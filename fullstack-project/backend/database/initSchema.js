require("dotenv").config();
const db = require("../config/db");

// PostgreSQL ENUM type creators
async function createEnumTypes() {
  try {
    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'builder_status') THEN
          CREATE TYPE builder_status AS ENUM('active', 'suspended', 'trial');
        END IF;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'society_status') THEN
          CREATE TYPE society_status AS ENUM('active', 'inactive', 'suspended', 'trial', 'archived', 'deleted');
        END IF;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_mode') THEN
          CREATE TYPE theme_mode AS ENUM('light', 'dark', 'auto');
        END IF;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_gradient_style') THEN
          CREATE TYPE theme_gradient_style AS ENUM('linear', 'radial', 'conic');
        END IF;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'button_style') THEN
          CREATE TYPE button_style AS ENUM('rounded', 'square', 'pill');
        END IF;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accent_radius') THEN
          CREATE TYPE accent_radius AS ENUM('small', 'medium', 'large');
        END IF;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sidebar_style') THEN
          CREATE TYPE sidebar_style AS ENUM('default', 'minimal', 'compact');
        END IF;
      END $$;
    `);
  } catch (error) {
    console.warn("Warning creating enum types:", error.message);
  }
}

async function ensureSchema() {
  try {
    console.log("Initializing PostgreSQL schema...");
    
    // Create enum types first
    await createEnumTypes();

    // Create builders table
    await db.query(`
      CREATE TABLE IF NOT EXISTS builders (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        logo_url VARCHAR(500),
        website VARCHAR(200),
        status builder_status DEFAULT 'trial',
        subscription_plan VARCHAR(50) DEFAULT 'starter',
        max_societies INT DEFAULT 10,
        max_users INT DEFAULT 1000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create societies table
    await db.query(`
      CREATE TABLE IF NOT EXISTS societies (
        id SERIAL PRIMARY KEY,
        code VARCHAR(30) NOT NULL UNIQUE,
        slug VARCHAR(60) NOT NULL UNIQUE,
        subdomain VARCHAR(80) NOT NULL UNIQUE,
        name VARCHAR(120) NOT NULL,
        society_name VARCHAR(120),
        address VARCHAR(255),
        contact_email VARCHAR(150),
        contact_phone VARCHAR(50),
        builder_id INT,
        configured_at TIMESTAMP,
        subscription_tier VARCHAR(50) DEFAULT 'starter',
        status society_status NOT NULL DEFAULT 'active',
        subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter',
        default_language VARCHAR(20) NOT NULL DEFAULT 'en',
        city VARCHAR(100),
        state VARCHAR(100),
        pincode VARCHAR(20),
        primary_admin_user_id INT,
        created_by INT,
        theme_primary VARCHAR(7) DEFAULT '#1e40af',
        theme_secondary VARCHAR(7) DEFAULT '#64748b',
        theme_accent VARCHAR(7) DEFAULT '#0ea5e9',
        theme_mode theme_mode DEFAULT 'auto',
        theme_gradient_style theme_gradient_style DEFAULT 'linear',
        logo_url VARCHAR(500),
        logo_dark_url VARCHAR(500),
        brand_name VARCHAR(120),
        font_family VARCHAR(50) DEFAULT 'Inter',
        sidebar_style sidebar_style DEFAULT 'default',
        button_style button_style DEFAULT 'rounded',
        accent_radius accent_radius DEFAULT 'medium',
        theme_preset VARCHAR(50),
        custom_css TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS society_name VARCHAR(120);`);
    await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150);`);
    await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS society_brandings (
        society_id INT PRIMARY KEY,
        logo_url VARCHAR(500),
        favicon_url VARCHAR(500),
        primary_color VARCHAR(50),
        secondary_color VARCHAR(50),
        accent_color VARCHAR(50),
        font_family VARCHAR(100),
        theme_json JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS society_settings (
        society_id INT PRIMARY KEY,
        timezone VARCHAR(100),
        locale VARCHAR(20),
        currency_code VARCHAR(20),
        modules_json JSONB,
        permissions_json JSONB,
        feature_flags_json JSONB,
        personalization_json JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS society_subscriptions (
        society_id INT PRIMARY KEY,
        plan_name VARCHAR(50),
        status VARCHAR(50),
        billing_cycle VARCHAR(50),
        renewal_at TIMESTAMP,
        limits_json JSONB,
        provider_name VARCHAR(100),
        provider_subscription_id VARCHAR(200),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS society_modules (
        society_id INT NOT NULL,
        module_key VARCHAR(100) NOT NULL,
        enabled BOOLEAN DEFAULT false,
        config_json JSONB,
        PRIMARY KEY (society_id, module_key)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS society_analytics (
        society_id INT NOT NULL,
        metric_date DATE NOT NULL,
        metrics_json JSONB,
        PRIMARY KEY (society_id, metric_date)
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INT,
        action VARCHAR(150) NOT NULL,
        resource_type VARCHAR(100),
        resource_id INT,
        details JSONB,
        old_values JSONB,
        new_values JSONB,
        status VARCHAR(50) DEFAULT 'success',
        ip_address VARCHAR(100),
        user_agent VARCHAR(300),
        society_id INT,
        builder_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200),
        full_name VARCHAR(200),
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(20),
        resident_type VARCHAR(50),
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        is_verified BOOLEAN NOT NULL DEFAULT false,
        society_id INT,
        flat_id INT,
        flat_number VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(200);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS resident_type VARCHAR(50);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS flat_id INT;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS flat_number VARCHAR(50);`);

    console.log("✓ PostgreSQL schema initialized successfully");
  } catch (error) {
    console.error("Error initializing schema:", error.message);
    throw error;
  }
}

module.exports = ensureSchema;
