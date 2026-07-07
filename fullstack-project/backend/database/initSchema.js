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
    if (error?.code === "42P01") {
      console.warn(`[Migration skipped] ${label}: referenced table does not exist (${error.message})`);
      return true;
    }
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

    // Ensure missing enum values are added if the type already exists
    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'society_status' AND e.enumlabel = 'pending_chairman_registration'
        ) THEN
          ALTER TYPE society_status ADD VALUE 'pending_chairman_registration';
        END IF;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'society_status' AND e.enumlabel = 'pending_approval'
        ) THEN
          ALTER TYPE society_status ADD VALUE 'pending_approval';
        END IF;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
          WHERE t.typname = 'society_status' AND e.enumlabel = 'rejected'
        ) THEN
          ALTER TYPE society_status ADD VALUE 'rejected';
        END IF;
      END $$;
    `);

    await db.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'society_status') THEN
          CREATE TYPE society_status AS ENUM(
            'active',
            'inactive',
            'suspended',
            'trial',
            'pending_chairman_registration',
            'pending_approval',
            'rejected',
            'archived',
            'deleted'
          );
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

    // Ensure specific enum labels exist for society_status in case the type was created earlier
    async function ensureEnumValue(typeName, label) {
      try {
        await db.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
              WHERE t.typname = '${typeName}' AND e.enumlabel = '${label}'
            ) THEN
              ALTER TYPE ${typeName} ADD VALUE '${label}';
            END IF;
          END $$;
        `);
      } catch (err) {
        console.warn(`Warning ensuring enum value ${label} for ${typeName}: ${err.message}`);
      }
    }

    // Required society_status values (safe to call - will skip if already present)
    await ensureEnumValue('society_status', 'active');
    await ensureEnumValue('society_status', 'suspended');
    await ensureEnumValue('society_status', 'trial');
    await ensureEnumValue('society_status', 'pending_chairman_registration');
    await ensureEnumValue('society_status', 'pending_approval');
    await ensureEnumValue('society_status', 'rejected');

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

async function runSqlMigrationFile(migrationFile) {
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
    console.warn(`Warning applying migration ${migrationFile}: ${error.message}`);
  }
}

async function runMissingSchemaMigrations() {
  const migrationFiles = [
    "2026-06-05_add_missing_schema.sql",
    "2026-06-11_create_complaint_comments.sql",
    "2026-07-04_full_backend_schema_sync.sql",
  ];

  for (const migrationName of migrationFiles) {
    await runSqlMigrationFile(path.join(__dirname, "migrations", migrationName));
  }
}

async function ensureRequiredBaseTables() {
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
      kyc_reviewed_at TIMESTAMP,
      kyc_reviewed_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS societies (
      id SERIAL PRIMARY KEY,
      code VARCHAR(30) NOT NULL UNIQUE,
      slug VARCHAR(60) NOT NULL UNIQUE,
      subdomain VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      society_name VARCHAR(120),
      registration_number VARCHAR(120),
      address VARCHAR(255),
      contact_email VARCHAR(150),
      contact_phone VARCHAR(50),
      office_timing VARCHAR(120),
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

  await db.query(`
    CREATE TABLE IF NOT EXISTS flats (
      id SERIAL PRIMARY KEY,
      society_id INT,
      tower_id INT NULL,
      building_name VARCHAR(120),
      wing VARCHAR(100),
      wing_id INT NULL,
      flat_number VARCHAR(50),
      floor VARCHAR(50),
      block VARCHAR(50),
      flat_type VARCHAR(80),
      status VARCHAR(50) DEFAULT 'available',
      occupancy_status VARCHAR(50) DEFAULT 'vacant',
      approval_status VARCHAR(50),
      approved_by INT NULL,
      approved_at TIMESTAMP NULL,
      resident_id INT,
      area_sqft NUMERIC(12,2),
      archived_at TIMESTAMP NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notices (
      id SERIAL PRIMARY KEY,
      society_id INT,
      title VARCHAR(255),
      message TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'active',
      created_by INT NULL,
      expires_at TIMESTAMP NULL,
      archived_by INT NULL,
      archived_at TIMESTAMP NULL,
      archived_from_status VARCHAR(50) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_by INT NULL,
      deletion_reason TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitors (
      id SERIAL PRIMARY KEY,
      society_id INT,
      flat_id INT,
      resident_id INT NULL,
      security_id INT NULL,
      preapproval_id INT NULL,
      qr_pass_id INT NULL,
      name VARCHAR(200),
      visitor_name VARCHAR(200),
      phone VARCHAR(50),
      purpose VARCHAR(255),
      visitor_type VARCHAR(50) DEFAULT 'guest',
      visit_date DATE,
      visit_time TIME,
      entry_time TIMESTAMP NULL,
      exit_time TIMESTAMP NULL,
      check_in_time TIMESTAMP NULL,
      check_out_time TIMESTAMP NULL,
      status VARCHAR(50) DEFAULT 'pending',
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
      resolved_at TIMESTAMP NULL,
      archived_at TIMESTAMP NULL,
      archived_by INT NULL,
      archived_from_status VARCHAR(50) NULL,
      deleted_at TIMESTAMP NULL,
      deleted_by INT NULL,
      deletion_reason TEXT NULL,
      updated_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bills (
      id SERIAL PRIMARY KEY,
      society_id INT,
      user_id INT,
      resident_id INT NULL,
      flat_id INT NULL,
      amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      total_amount NUMERIC(12,2) DEFAULT 0,
      paid_amount NUMERIC(12,2) DEFAULT 0,
      late_fee_amount NUMERIC(12,2) DEFAULT 0,
      currency VARCHAR(10) DEFAULT 'INR',
      bill_type VARCHAR(50) DEFAULT 'maintenance',
      invoice_number VARCHAR(120),
      title VARCHAR(255),
      billing_month DATE NULL,
      bill_date TIMESTAMP NULL,
      due_date TIMESTAMP,
      paid_at TIMESTAMP NULL,
      paid_date TIMESTAMP NULL,
      status VARCHAR(50) DEFAULT 'pending',
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(100) NULL,
      reminder_count INT DEFAULT 0,
      description TEXT,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS retention_rules (
      id SERIAL PRIMARY KEY,
      resource_type VARCHAR(80) NOT NULL UNIQUE,
      retention_days INT NOT NULL DEFAULT 365,
      archive_after_days INT NOT NULL DEFAULT 30,
      auto_archive_enabled BOOLEAN NOT NULL DEFAULT true,
      allow_permanent_delete BOOLEAN NOT NULL DEFAULT false,
      updated_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    INSERT INTO retention_rules (resource_type, retention_days, archive_after_days, auto_archive_enabled, allow_permanent_delete)
    VALUES
      ('complaints', 365, 30, true, false),
      ('notices', 365, 30, true, false)
    ON CONFLICT (resource_type) DO NOTHING;
  `);
}

async function ensureSchema() {
  try {
    console.log("Initializing PostgreSQL schema...");
    
    // Create enum types first
    await createEnumTypes();

    // Create required base tables before any migration can ALTER them.
    await ensureRequiredBaseTables();

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
        registration_number VARCHAR(120),
        address VARCHAR(255),
        contact_email VARCHAR(150),
        contact_phone VARCHAR(50),
        office_timing VARCHAR(120),
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
    await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(120);`);
    await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150);`);
    await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);`);
    await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS office_timing VARCHAR(120);`);

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
        version INT NOT NULL DEFAULT 1,
        deleted_at TIMESTAMP NULL,
        deleted_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;`);
    await db.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
    await db.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_by INT;`);

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
        kyc_reviewed_at TIMESTAMP,
        kyc_reviewed_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(200);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMP;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_reviewed_by INT;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS resident_type VARCHAR(50);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS flat_id INT;`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS flat_number VARCHAR(50);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS original_email VARCHAR(255);`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;`);
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
      CREATE TABLE IF NOT EXISTS complaint_comments (
        id SERIAL PRIMARY KEY,
        complaint_id INT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON complaint_comments(complaint_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_complaint_comments_user_id ON complaint_comments(user_id);`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS towers (
        id SERIAL PRIMARY KEY,
        society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
        tower_name VARCHAR(120) NOT NULL,
        tower_code VARCHAR(40) NOT NULL,
        total_floors INT DEFAULT 1,
        flats_per_floor INT DEFAULT 1,
        flat_number_format VARCHAR(50) DEFAULT 'floor_sequence',
        starting_floor INT DEFAULT 1,
        status VARCHAR(50) DEFAULT 'active',
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_towers_society_id ON towers(society_id);`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS wings (
        id SERIAL PRIMARY KEY,
        society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
        tower_id INT REFERENCES towers(id) ON DELETE CASCADE,
        name VARCHAR(120) NOT NULL,
        code VARCHAR(40) NOT NULL,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_wings_society_id ON wings(society_id);`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS visitor_preapprovals (
        id SERIAL PRIMARY KEY,
        owner_id INT REFERENCES users(id) ON DELETE SET NULL,
        flat_id INT REFERENCES flats(id) ON DELETE SET NULL,
        visitor_name VARCHAR(150),
        phone VARCHAR(50),
        purpose TEXT,
        visit_date DATE,
        expected_arrival_time TIMESTAMP,
        vehicle_number VARCHAR(50),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approval_token TEXT,
        qr_pass_token TEXT,
        otp_code_hash TEXT,
        otp_expires_at TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS visitor_delivery_entries (
        id SERIAL PRIMARY KEY,
        visitor_id INT,
        delivery_type VARCHAR(100),
        package_id VARCHAR(100),
        recipient_name VARCHAR(150),
        delivery_partner VARCHAR(150),
        flat_id INT REFERENCES flats(id) ON DELETE SET NULL,
        status VARCHAR(50),
        notes TEXT,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS visitor_vehicle_entries (
        id SERIAL PRIMARY KEY,
        visitor_id INT,
        preapproval_id INT REFERENCES visitor_preapprovals(id) ON DELETE SET NULL,
        vehicle_number VARCHAR(50),
        vehicle_type VARCHAR(50),
        owner_name VARCHAR(150),
        flat_id INT REFERENCES flats(id) ON DELETE SET NULL,
        entry_method VARCHAR(50),
        status VARCHAR(50),
        entry_time TIMESTAMP,
        exit_time TIMESTAMP,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS bill_items (
        id SERIAL PRIMARY KEY,
        bill_id INT REFERENCES bills(id) ON DELETE CASCADE,
        item_name VARCHAR(150) NOT NULL,
        description TEXT,
        quantity NUMERIC(10,2) DEFAULT 1,
        unit_price NUMERIC(12,2) DEFAULT 0,
        amount NUMERIC(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        bill_id INT REFERENCES bills(id) ON DELETE CASCADE,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(100) DEFAULT 'cash',
        payment_status VARCHAR(50) DEFAULT 'pending',
        transaction_id VARCHAR(200),
        gateway_payment_id VARCHAR(200),
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
        department VARCHAR(100),
        designation VARCHAR(120),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS security (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
        shift VARCHAR(80),
        designation VARCHAR(120),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        check_in_at TIMESTAMP,
        check_out_at TIMESTAMP,
        status VARCHAR(50) DEFAULT 'present',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_threads (
        id SERIAL PRIMARY KEY,
        society_id INT REFERENCES societies(id) ON DELETE CASCADE,
        thread_type VARCHAR(50) DEFAULT 'direct',
        title VARCHAR(255),
        description TEXT,
        avatar_url TEXT,
        created_by INT REFERENCES users(id) ON DELETE SET NULL,
        last_message_at TIMESTAMP,
        pinned_message_id INT,
        archived_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        thread_id INT REFERENCES chat_threads(id) ON DELETE CASCADE,
        sender_id INT REFERENCES users(id) ON DELETE SET NULL,
        receiver_id INT REFERENCES users(id) ON DELETE SET NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        message TEXT,
        media_url TEXT,
        media_name TEXT,
        mime_type VARCHAR(100),
        deleted_for_all BOOLEAN DEFAULT FALSE,
        deleted_for_sender BOOLEAN DEFAULT FALSE,
        deleted_for_receiver BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200),
        message TEXT,
        target_user_id INT REFERENCES users(id) ON DELETE CASCADE,
        target_role VARCHAR(50) DEFAULT 'all',
        society_id INT REFERENCES societies(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'unread',
        priority VARCHAR(20) DEFAULT 'medium',
        category VARCHAR(100),
        deep_link TEXT,
        related_type VARCHAR(100),
        related_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_notifications_society_id ON notifications(society_id);`);

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
