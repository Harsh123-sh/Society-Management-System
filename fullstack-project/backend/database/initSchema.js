require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../config/db");

function splitSqlStatements(sql) {
  const statements = [];
  let current = "";
  let singleQuoted = false;
  let doubleQuoted = false;
  let lineComment = false;
  let blockComment = false;
  let dollarQuoteTag = null;

  for (let i = 0; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (lineComment) {
      current += char;
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        i += 1;
        blockComment = false;
      }
      continue;
    }

    if (dollarQuoteTag) {
      if (sql.startsWith(dollarQuoteTag, i)) {
        current += dollarQuoteTag;
        i += dollarQuoteTag.length - 1;
        dollarQuoteTag = null;
      } else {
        current += char;
      }
      continue;
    }

    if (!singleQuoted && !doubleQuoted && char === "-" && next === "-") {
      current += char + next;
      i += 1;
      lineComment = true;
      continue;
    }

    if (!singleQuoted && !doubleQuoted && char === "/" && next === "*") {
      current += char + next;
      i += 1;
      blockComment = true;
      continue;
    }

    if (!singleQuoted && !doubleQuoted && char === "$") {
      const match = sql.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (match) {
        dollarQuoteTag = match[0];
        current += dollarQuoteTag;
        i += dollarQuoteTag.length - 1;
        continue;
      }
    }

    if (!doubleQuoted && char === "'" && sql[i - 1] !== "\\") {
      singleQuoted = !singleQuoted;
    } else if (!singleQuoted && char === '"') {
      doubleQuoted = !doubleQuoted;
    }

    if (!singleQuoted && !doubleQuoted && char === ";") {
      const statement = current.trim();
      if (statement) statements.push(`${statement};`);
      current = "";
      continue;
    }

    current += char;
  }

  const trailing = current.trim();
  if (trailing) statements.push(trailing);
  return statements;
}

async function runMigrationStatement(sql, label) {
  const statement = sql.trim();
  if (!statement) return true;

  try {
    await db.query(statement);
    return true;
  } catch (error) {
    console.error(`[Migration failed] ${label}: ${error.message}`);
    console.error(`[Failed SQL] ${statement}`);
    return false;
  }
}

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

async function runMissingSchemaMigrations() {
  const migrationFile = path.join(__dirname, "migrations", "2026-06-05_add_missing_schema.sql");
  try {
    const sql = fs.readFileSync(migrationFile, "utf8");
    if (sql && sql.trim()) {
      console.log(`Starting migration: ${migrationFile}`);
      const statements = splitSqlStatements(sql);
      let failures = 0;

      for (const [index, statement] of statements.entries()) {
        const ok = await runMigrationStatement(
          statement,
          `missing schema statement ${index + 1}/${statements.length}`
        );
        if (!ok) failures += 1;
      }
      if (failures > 0) {
        console.warn(`Migration completed with ${failures} failed statement(s): ${migrationFile}`);
      } else {
        console.log(`Migration completed: ${migrationFile}`);
      }
    }
  } catch (error) {
    console.warn(`Warning applying missing schema migrations: ${error.message}`);
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
      CREATE TABLE IF NOT EXISTS flats (
        id SERIAL PRIMARY KEY,
        society_id INT,
        wing VARCHAR(100),
        flat_number VARCHAR(50),
        floor VARCHAR(50),
        block VARCHAR(50),
        status VARCHAR(50) DEFAULT 'available',
        resident_id INT,
        area_sqft NUMERIC(12,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id SERIAL PRIMARY KEY,
        society_id INT,
        flat_id INT,
        owner_id INT NULL,
        wing VARCHAR(100),
        floor VARCHAR(50),
        block VARCHAR(50),
        slot_number VARCHAR(100),
        type VARCHAR(50) DEFAULT 'available',
        status VARCHAR(50) DEFAULT 'available',
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        society_id INT,
        user_id INT,
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'INR',
        due_date TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS bill_payments (
        id SERIAL PRIMARY KEY,
        bill_id INT NOT NULL,
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(100),
        transaction_id VARCHAR(200),
        gateway_payment_id VARCHAR(200),
        paid_at TIMESTAMP NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`ALTER TABLE bill_payments ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(200);`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_approvals (
        id SERIAL PRIMARY KEY,
        user_id INT,
        society_id INT,
        approval_type VARCHAR(100),
        requested_by INT,
        status VARCHAR(50) DEFAULT 'pending',
        reason TEXT,
        details JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        resident_id INT,
        society_id INT,
        title VARCHAR(255),
        description TEXT,
        category VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        society_id INT NULL,
        document_type VARCHAR(80) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        notes TEXT NULL,
        reviewed_by INT NULL,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        id SERIAL PRIMARY KEY,
        society_id INT NOT NULL,
        metric_date DATE NOT NULL,
        metrics_json JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (society_id, metric_date)
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
        address VARCHAR(255),
        resident_type VARCHAR(50),
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        is_verified BOOLEAN NOT NULL DEFAULT false,
        society_id INT,
        flat_id INT,
        flat_number VARCHAR(50),
        original_email VARCHAR(255),
        deleted_at TIMESTAMP,
        deleted_by INT,
        delete_reason TEXT,
        permanently_deleted_at TIMESTAMP,
        last_login TIMESTAMP,
        profile_photo_url VARCHAR(500),
        family_members JSONB,
        approval_status VARCHAR(50),
        approved_at TIMESTAMP,
        kyc_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(200);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS resident_type VARCHAR(50);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS flat_id INT;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS flat_number VARCHAR(50);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS original_email VARCHAR(255);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by INT;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS delete_reason TEXT;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS permanently_deleted_at TIMESTAMP;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS family_members JSONB;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50);`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS user_otps (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_otps_email_purpose ON user_otps(email, purpose);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_otps_expires_at ON user_otps(expires_at);`);

    await runMissingSchemaMigrations();

    console.log("✓ PostgreSQL schema initialized successfully");
  } catch (error) {
    console.error("Error initializing schema:", error.message);
    throw error;
  }
}

module.exports = ensureSchema;
