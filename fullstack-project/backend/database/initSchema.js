require("dotenv").config();
const db = require("../db");

async function ensureSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS builders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      logo_url VARCHAR(500) NULL,
      website VARCHAR(200) NULL,
      status ENUM('active', 'suspended', 'trial') DEFAULT 'trial',
      subscription_plan VARCHAR(50) DEFAULT 'starter',
      max_societies INT DEFAULT 10,
      max_users INT DEFAULT 1000,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS societies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(30) NOT NULL UNIQUE,
      slug VARCHAR(60) NOT NULL UNIQUE,
      subdomain VARCHAR(80) NOT NULL UNIQUE,
      name VARCHAR(120) NOT NULL,
      address VARCHAR(255) NULL,
      builder_id INT NULL,
      configured_at DATETIME NULL,
      subscription_tier VARCHAR(50) DEFAULT 'starter',
      status ENUM('active', 'inactive', 'suspended', 'trial', 'archived', 'deleted') NOT NULL DEFAULT 'active',
      subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter',
      default_language VARCHAR(20) NOT NULL DEFAULT 'en',
      city VARCHAR(100) NULL,
      state VARCHAR(100) NULL,
      pincode VARCHAR(20) NULL,
      primary_admin_user_id INT NULL,
      created_by INT NULL,
      theme_primary VARCHAR(7) DEFAULT '#1e40af',
      theme_secondary VARCHAR(7) DEFAULT '#64748b',
      theme_accent VARCHAR(7) DEFAULT '#0ea5e9',
      theme_mode ENUM('light', 'dark', 'auto') DEFAULT 'auto',
      theme_gradient_style ENUM('linear', 'radial', 'conic') DEFAULT 'linear',
      logo_url VARCHAR(500) NULL,
      logo_dark_url VARCHAR(500) NULL,
      brand_name VARCHAR(120) NULL,
      font_family VARCHAR(50) DEFAULT 'Inter',
      sidebar_style ENUM('default', 'minimal', 'compact') DEFAULT 'default',
      button_style ENUM('rounded', 'square', 'pill') DEFAULT 'rounded',
      accent_radius ENUM('small', 'medium', 'large') DEFAULT 'medium',
      theme_preset VARCHAR(50) NULL,
      custom_css LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // No default society record is auto-created on startup.
  // Society creation is now managed through the Super Admin dashboard only.

  // Ensure builder_id column exists in societies table
  const [societyBuilderIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'societies'
      AND COLUMN_NAME = 'builder_id'
    LIMIT 1
  `);

  if (!societyBuilderIdColumn.length) {
    await db.query("ALTER TABLE societies ADD COLUMN builder_id INT NULL AFTER subdomain");
  }

  // Ensure city and state columns exist in societies table
  const locationColumns = [
    { name: 'address', sql: "ALTER TABLE societies ADD COLUMN address VARCHAR(255) NULL AFTER name" },
    { name: 'city', sql: "ALTER TABLE societies ADD COLUMN city VARCHAR(100) NULL AFTER name" },
    { name: 'state', sql: "ALTER TABLE societies ADD COLUMN state VARCHAR(100) NULL AFTER city" },
    { name: 'pincode', sql: "ALTER TABLE societies ADD COLUMN pincode VARCHAR(20) NULL AFTER state" },
  ];

  for (const col of locationColumns) {
    const [colExists] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'societies' AND COLUMN_NAME = ?
    `, [col.name]);

    if (!colExists.length) {
      try {
        await db.query(col.sql);
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
          console.warn(`Warning adding column ${col.name}:`, error.message);
        }
      }
    }
  }

  // Add theme columns to societies table if they don't exist
  const themeColumns = [
    { name: 'theme_primary', sql: "ALTER TABLE societies ADD COLUMN theme_primary VARCHAR(7) DEFAULT '#1e40af'" },
    { name: 'theme_secondary', sql: "ALTER TABLE societies ADD COLUMN theme_secondary VARCHAR(7) DEFAULT '#64748b'" },
    { name: 'theme_accent', sql: "ALTER TABLE societies ADD COLUMN theme_accent VARCHAR(7) DEFAULT '#0ea5e9'" },
    { name: 'theme_mode', sql: "ALTER TABLE societies ADD COLUMN theme_mode ENUM('light', 'dark', 'auto') DEFAULT 'auto'" },
    { name: 'theme_gradient_style', sql: "ALTER TABLE societies ADD COLUMN theme_gradient_style ENUM('linear', 'radial', 'conic') DEFAULT 'linear'" },
    { name: 'logo_url', sql: "ALTER TABLE societies ADD COLUMN logo_url VARCHAR(500) NULL" },
    { name: 'logo_dark_url', sql: "ALTER TABLE societies ADD COLUMN logo_dark_url VARCHAR(500) NULL" },
    { name: 'brand_name', sql: "ALTER TABLE societies ADD COLUMN brand_name VARCHAR(120) NULL" },
    { name: 'font_family', sql: "ALTER TABLE societies ADD COLUMN font_family VARCHAR(50) DEFAULT 'Inter'" },
    { name: 'sidebar_style', sql: "ALTER TABLE societies ADD COLUMN sidebar_style ENUM('default', 'minimal', 'compact') DEFAULT 'default'" },
    { name: 'button_style', sql: "ALTER TABLE societies ADD COLUMN button_style ENUM('rounded', 'square', 'pill') DEFAULT 'rounded'" },
    { name: 'accent_radius', sql: "ALTER TABLE societies ADD COLUMN accent_radius ENUM('small', 'medium', 'large') DEFAULT 'medium'" },
    { name: 'theme_preset', sql: "ALTER TABLE societies ADD COLUMN theme_preset VARCHAR(50) NULL" },
    { name: 'custom_css', sql: "ALTER TABLE societies ADD COLUMN custom_css LONGTEXT NULL" },
    { name: 'updated_at', sql: "ALTER TABLE societies ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" }
  ];

  for (const col of themeColumns) {
    const [colExists] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'societies' AND COLUMN_NAME = ?
    `, [col.name]);
    
    if (!colExists.length) {
      try {
        await db.query(col.sql);
      } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
          console.warn(`Warning adding column ${col.name}:`, error.message);
        }
      }
    }
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS society_brandings (
      society_id INT PRIMARY KEY,
      logo_url VARCHAR(500) NULL,
      favicon_url VARCHAR(500) NULL,
      primary_color VARCHAR(20) NOT NULL DEFAULT '#0f766e',
      secondary_color VARCHAR(20) NOT NULL DEFAULT '#2563eb',
      accent_color VARCHAR(20) NOT NULL DEFAULT '#14b8a6',
      font_family VARCHAR(100) NOT NULL DEFAULT 'Inter',
      theme_json LONGTEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_society_brandings_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS society_settings (
      society_id INT PRIMARY KEY,
      timezone VARCHAR(80) NOT NULL DEFAULT 'Asia/Kolkata',
      locale VARCHAR(20) NOT NULL DEFAULT 'en',
      currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
      modules_json LONGTEXT NULL,
      permissions_json LONGTEXT NULL,
      feature_flags_json LONGTEXT NULL,
      personalization_json LONGTEXT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_society_settings_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS society_subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL UNIQUE,
      plan_name VARCHAR(50) NOT NULL DEFAULT 'starter',
      status ENUM('trial', 'active', 'past_due', 'cancelled') NOT NULL DEFAULT 'trial',
      billing_cycle ENUM('monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
      renewal_at DATETIME NULL,
      limits_json LONGTEXT NULL,
      provider_name VARCHAR(50) NOT NULL DEFAULT 'render',
      provider_subscription_id VARCHAR(120) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_society_subscriptions_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS society_modules (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      module_key VARCHAR(80) NOT NULL,
      enabled TINYINT(1) NOT NULL DEFAULT 1,
      config_json LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_society_module (society_id, module_key),
      CONSTRAINT fk_society_modules_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS society_analytics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      metric_date DATE NOT NULL,
      metrics_json LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_society_metric_date (society_id, metric_date),
      CONSTRAINT fk_society_analytics_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS towers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      builder_id INT NULL,
      name VARCHAR(120) NOT NULL,
      code VARCHAR(60) NULL,
      total_floors INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_society_builder_tower_code (society_id, builder_id, code),
      CONSTRAINT fk_towers_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      CONSTRAINT fk_towers_builder FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      builder_id INT NULL,
      tower_id INT NOT NULL,
      name VARCHAR(120) NULL,
      code VARCHAR(60) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_society_tower_block_code (society_id, tower_id, code),
      CONSTRAINT fk_blocks_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      CONSTRAINT fk_blocks_builder FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
      CONSTRAINT fk_blocks_tower FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS floors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      builder_id INT NULL,
      tower_id INT NOT NULL,
      floor_number INT NOT NULL,
      floor_name VARCHAR(60) NULL,
      total_units INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_society_tower_floor_num (society_id, tower_id, floor_number),
      CONSTRAINT fk_floors_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      CONSTRAINT fk_floors_builder FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE,
      CONSTRAINT fk_floors_tower FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS wings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      builder_id INT NULL,
      tower_id INT NULL,
      name VARCHAR(120) NOT NULL,
      code VARCHAR(60) NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_wings_society_name (society_id, name),
      CONSTRAINT fk_wings_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE,
      CONSTRAINT fk_wings_builder FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE CASCADE
    )
  `);

  try {
    await db.query("ALTER TABLE towers MODIFY COLUMN builder_id INT NULL");
  } catch (error) {
    if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY" && error.code !== "ER_BAD_FIELD_ERROR") {
      throw error;
    }
  }

  try {
    await db.query("ALTER TABLE blocks MODIFY COLUMN builder_id INT NULL");
  } catch (error) {
    if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY" && error.code !== "ER_BAD_FIELD_ERROR") {
      throw error;
    }
  }

  try {
    await db.query("ALTER TABLE floors MODIFY COLUMN builder_id INT NULL");
  } catch (error) {
    if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY" && error.code !== "ER_BAD_FIELD_ERROR") {
      throw error;
    }
  }

  try {
    await db.query("ALTER TABLE wings MODIFY COLUMN builder_id INT NULL");
  } catch (error) {
    if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY" && error.code !== "ER_BAD_FIELD_ERROR") {
      throw error;
    }
  }


  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      original_email VARCHAR(150) NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('super_admin', 'admin', 'secretary', 'resident', 'staff', 'security') NOT NULL DEFAULT 'resident',
      resident_type ENUM('owner', 'tenant') NULL,
      status ENUM('pending', 'active', 'rejected', 'inactive') NOT NULL DEFAULT 'pending',
      is_verified TINYINT(1) NOT NULL DEFAULT 0,
      society_id INT NULL,
      flat_id INT NULL,
      flat_number VARCHAR(50) NULL,
      deleted_at DATETIME NULL,
      deleted_by INT NULL,
      delete_reason VARCHAR(500) NULL,
      permanently_deleted_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      action VARCHAR(120) NOT NULL,
      resource_type VARCHAR(120) NULL,
      resource_id VARCHAR(100) NULL,
      details LONGTEXT NULL,
      old_values LONGTEXT NULL,
      new_values LONGTEXT NULL,
      status ENUM('success', 'error', 'warning') NOT NULL DEFAULT 'success',
      ip_address VARCHAR(45) NULL,
      user_agent VARCHAR(255) NULL,
      society_id INT NULL,
      builder_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_audit_logs_user (user_id),
      INDEX idx_audit_logs_society (society_id),
      INDEX idx_audit_logs_builder (builder_id),
      CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Ensure builder_id column exists in users table
  const [builderIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'builder_id'
    LIMIT 1
  `);

  if (!builderIdColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN builder_id INT NULL AFTER flat_id");
  }

  const [societyIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'society_id'
    LIMIT 1
  `);

  if (!societyIdColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN society_id INT NULL");
  }

  const [flatIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'flat_id'
    LIMIT 1
  `);

  if (!flatIdColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN flat_id INT NULL");
  }

  const [originalEmailColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'original_email'
    LIMIT 1
  `);

  if (!originalEmailColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN original_email VARCHAR(150) NULL");
  }

  const [societyNameColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'societies'
      AND COLUMN_NAME = 'society_name'
    LIMIT 1
  `);

  if (!societyNameColumn.length) {
    await db.query("ALTER TABLE societies ADD COLUMN society_name VARCHAR(120) NULL");
  }

  const [societyContactEmailColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'societies'
      AND COLUMN_NAME = 'contact_email'
    LIMIT 1
  `);

  if (!societyContactEmailColumn.length) {
    await db.query("ALTER TABLE societies ADD COLUMN contact_email VARCHAR(150) NULL");
  }

  const [societyContactPhoneColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'societies'
      AND COLUMN_NAME = 'contact_phone'
    LIMIT 1
  `);

  if (!societyContactPhoneColumn.length) {
    await db.query("ALTER TABLE societies ADD COLUMN contact_phone VARCHAR(30) NULL");
  }

  const [resetOtpHashColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'reset_otp_hash'
    LIMIT 1
  `);

  if (!resetOtpHashColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN reset_otp_hash VARCHAR(255) NULL");
  }

  const [resetOtpExpiresAtColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'reset_otp_expires_at'
    LIMIT 1
  `);

  if (!resetOtpExpiresAtColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN reset_otp_expires_at DATETIME NULL");
  }

  const [resetOtpVerifiedColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'reset_otp_verified'
    LIMIT 1
  `);

  if (!resetOtpVerifiedColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN reset_otp_verified TINYINT(1) NOT NULL DEFAULT 0");
  }

  const [resetOtpAttemptsColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'reset_otp_attempts'
    LIMIT 1
  `);

  if (!resetOtpAttemptsColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN reset_otp_attempts INT NOT NULL DEFAULT 0");
  }

  const [residentTypeColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'resident_type'
    LIMIT 1
  `);

  if (!residentTypeColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN resident_type ENUM('owner', 'tenant') NULL");
  }

  const [statusColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'status'
    LIMIT 1
  `);

  if (!statusColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN status ENUM('pending', 'active', 'rejected', 'inactive') NOT NULL DEFAULT 'pending'");
  } else {
    await db.query("ALTER TABLE users MODIFY COLUMN status ENUM('pending', 'active', 'rejected', 'inactive') NOT NULL DEFAULT 'pending'");
  }

  const [roleColumn] = await db.query(`
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role'
    LIMIT 1
  `);

  if (!roleColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN role ENUM('super_admin', 'admin', 'secretary', 'resident', 'staff', 'security') NOT NULL DEFAULT 'resident'");
  } else {
    await db.query("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'admin', 'secretary', 'resident', 'staff', 'security') NOT NULL DEFAULT 'resident'");
  }

  const [deletedAtColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'deleted_at'
    LIMIT 1
  `);

  if (!deletedAtColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL");
  }

  const [deletedByColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'deleted_by'
    LIMIT 1
  `);

  if (!deletedByColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN deleted_by INT NULL");
  }

  const [deleteReasonColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'delete_reason'
    LIMIT 1
  `);

  if (!deleteReasonColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN delete_reason VARCHAR(500) NULL");
  }

  const [permanentDeletedAtColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'permanently_deleted_at'
    LIMIT 1
  `);

  if (!permanentDeletedAtColumn.length) {
    await db.query("ALTER TABLE users ADD COLUMN permanently_deleted_at DATETIME NULL");
  }

  const [isVerifiedColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'is_verified'
    LIMIT 1
  `);

  if (!isVerifiedColumn.length) {
    await db.query(
      "ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0"
    );
  }

  const [societyFkColumn] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'society_id'
      AND REFERENCED_TABLE_NAME = 'societies'
    LIMIT 1
  `);

  if (!societyFkColumn.length) {
    await db.query(
      "ALTER TABLE users ADD CONSTRAINT fk_users_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }

  const [deletedByFkColumn] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'deleted_by'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
  `);

  if (!deletedByFkColumn.length) {
    await db.query(
      "ALTER TABLE users ADD CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }

  const [societyCreatedByFkColumn] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'societies'
      AND COLUMN_NAME = 'created_by'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
  `);

  if (!societyCreatedByFkColumn.length) {
    await db.query(
      "ALTER TABLE societies ADD CONSTRAINT fk_societies_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }

  const [societyPrimaryAdminFkColumn] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'societies'
      AND COLUMN_NAME = 'primary_admin_user_id'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
  `);

  if (!societyPrimaryAdminFkColumn.length) {
    await db.query(
      "ALTER TABLE societies ADD CONSTRAINT fk_societies_primary_admin_user FOREIGN KEY (primary_admin_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }

  try {
    await db.query("CREATE INDEX idx_users_society_flat ON users (society_id, flat_number, resident_type, status)");
  } catch (error) {
    if (error.code !== "ER_DUP_KEYNAME") {
      throw error;
    }
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      category VARCHAR(100),
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_products_created_by_users
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      email VARCHAR(150) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      purpose ENUM('email_verification', 'password_reset') NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_otps_email_purpose (email, purpose),
      INDEX idx_user_otps_expires_at (expires_at),
      CONSTRAINT fk_user_otps_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bills (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NULL,
      resident_id INT NOT NULL,
      bill_type ENUM('maintenance', 'parking', 'utility', 'other') NOT NULL DEFAULT 'maintenance',
      invoice_number VARCHAR(40) NULL UNIQUE,
      title VARCHAR(200) NOT NULL,
      due_date DATE NOT NULL,
      billing_month DATE NULL,
      status ENUM('draft', 'unpaid', 'overdue', 'paid', 'partially_paid') NOT NULL DEFAULT 'unpaid',
      payment_status ENUM('pending', 'partial', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
      total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      late_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      late_fee_applied_at DATETIME NULL,
      reminder_count INT NOT NULL DEFAULT 0,
      last_reminder_at DATETIME NULL,
      invoice_pdf_url VARCHAR(500) NULL,
      gateway_provider VARCHAR(40) NULL,
      gateway_order_id VARCHAR(120) NULL,
      gateway_payment_id VARCHAR(120) NULL,
      upi_reference VARCHAR(120) NULL,
      notes VARCHAR(1000) NULL,
      created_by INT NOT NULL,
      paid_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bills_resident_status (resident_id, status),
      INDEX idx_bills_society_type_due (society_id, bill_type, due_date),
      INDEX idx_bills_payment_status (payment_status, status),
      CONSTRAINT fk_bills_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_bills_resident
        FOREIGN KEY (resident_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_bills_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bill_charges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      charge_name VARCHAR(200) NOT NULL,
      charge_type ENUM('maintenance', 'parking', 'utility', 'late_fee', 'misc') NOT NULL DEFAULT 'misc',
      amount DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_bill_charges_bill_id (bill_id),
      CONSTRAINT fk_bill_charges_bill
        FOREIGN KEY (bill_id) REFERENCES bills(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bill_payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      resident_id INT NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      payment_method ENUM('upi', 'razorpay', 'card', 'netbanking', 'cash') NOT NULL DEFAULT 'upi',
      gateway_provider VARCHAR(40) NULL,
      gateway_order_id VARCHAR(120) NULL,
      gateway_payment_id VARCHAR(120) NULL,
      gateway_signature VARCHAR(255) NULL,
      upi_id VARCHAR(120) NULL,
      upi_reference VARCHAR(120) NULL,
      status ENUM('created', 'authorized', 'captured', 'failed', 'refunded') NOT NULL DEFAULT 'created',
      metadata_json LONGTEXT NULL,
      paid_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_bill_payments_bill_status (bill_id, status),
      INDEX idx_bill_payments_order (gateway_order_id),
      CONSTRAINT fk_bill_payments_bill
        FOREIGN KEY (bill_id) REFERENCES bills(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_bill_payments_resident
        FOREIGN KEY (resident_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  const [billPaymentsAmountColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bill_payments'
      AND COLUMN_NAME = 'amount'
  `);

  if (!billPaymentsAmountColumn.length) {
    await db.query("ALTER TABLE bill_payments ADD COLUMN amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER resident_id");
  }

  const [billPaymentsGatewayPaymentIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bill_payments'
      AND COLUMN_NAME = 'gateway_payment_id'
  `);

  if (!billPaymentsGatewayPaymentIdColumn.length) {
    await db.query("ALTER TABLE bill_payments ADD COLUMN gateway_payment_id VARCHAR(120) NULL AFTER gateway_order_id");
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS bill_reminders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bill_id INT NOT NULL,
      resident_id INT NOT NULL,
      reminder_type ENUM('pre_due', 'due_today', 'overdue') NOT NULL,
      channel ENUM('in_app', 'email', 'sms', 'whatsapp') NOT NULL DEFAULT 'in_app',
      message VARCHAR(1200) NOT NULL,
      status ENUM('queued', 'sent', 'failed') NOT NULL DEFAULT 'queued',
      sent_at DATETIME NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_bill_reminders_bill_created (bill_id, created_at),
      CONSTRAINT fk_bill_reminders_bill
        FOREIGN KEY (bill_id) REFERENCES bills(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_bill_reminders_resident
        FOREIGN KEY (resident_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_bill_reminders_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_approvals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      society_id INT NOT NULL,
      approval_type ENUM('registration', 'owner_verification', 'tenant_verification', 'staff_verification', 'reactivation') NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      requested_by INT NULL,
      approved_by INT NULL,
      approval_comments VARCHAR(1000) NULL,
      documents_json LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_approvals_society_status (society_id, status),
      INDEX idx_approvals_user_type (user_id, approval_type),
      CONSTRAINT fk_user_approvals_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_user_approvals_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_user_approvals_requested_by
        FOREIGN KEY (requested_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_user_approvals_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  const [billsSocietyIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'society_id'
    LIMIT 1
  `);

  if (!billsSocietyIdColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN society_id INT NULL");
  }

  const [billsBillTypeColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'bill_type'
    LIMIT 1
  `);

  if (!billsBillTypeColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN bill_type ENUM('maintenance', 'parking', 'utility', 'other') NOT NULL DEFAULT 'maintenance'");
  }

  const [billsInvoiceNumberColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'invoice_number'
    LIMIT 1
  `);

  if (!billsInvoiceNumberColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN invoice_number VARCHAR(40) NULL UNIQUE");
  }

  const [billsBillingMonthColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'billing_month'
    LIMIT 1
  `);

  if (!billsBillingMonthColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN billing_month DATE NULL");
  }

  const [billsPaymentStatusColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'payment_status'
    LIMIT 1
  `);

  if (!billsPaymentStatusColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN payment_status ENUM('pending', 'partial', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending'");
  }

  const [billsPaidAmountColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'paid_amount'
    LIMIT 1
  `);

  if (!billsPaidAmountColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0");
  }

  const [billsLateFeeAmountColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'late_fee_amount'
    LIMIT 1
  `);

  if (!billsLateFeeAmountColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN late_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0");
  }

  const [billsLateFeeAppliedAtColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'late_fee_applied_at'
    LIMIT 1
  `);

  if (!billsLateFeeAppliedAtColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN late_fee_applied_at DATETIME NULL");
  }

  const [billsReminderCountColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'reminder_count'
    LIMIT 1
  `);

  if (!billsReminderCountColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN reminder_count INT NOT NULL DEFAULT 0");
  }

  const [billsLastReminderAtColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'last_reminder_at'
    LIMIT 1
  `);

  if (!billsLastReminderAtColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN last_reminder_at DATETIME NULL");
  }

  const [billsInvoicePdfUrlColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'invoice_pdf_url'
    LIMIT 1
  `);

  if (!billsInvoicePdfUrlColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN invoice_pdf_url VARCHAR(500) NULL");
  }
  const [billsGatewayProviderColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'gateway_provider'
    LIMIT 1
  `);

  if (!billsGatewayProviderColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN gateway_provider VARCHAR(40) NULL");
  }

  const [billsGatewayOrderIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'gateway_order_id'
    LIMIT 1
  `);

  if (!billsGatewayOrderIdColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN gateway_order_id VARCHAR(120) NULL");
  }

  const [billsGatewayPaymentIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'gateway_payment_id'
    LIMIT 1
  `);

  if (!billsGatewayPaymentIdColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN gateway_payment_id VARCHAR(120) NULL");
  }

  const [billsUpiReferenceColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'upi_reference'
    LIMIT 1
  `);

  if (!billsUpiReferenceColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN upi_reference VARCHAR(120) NULL");
  }

  const [billsNotesColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bills'
      AND COLUMN_NAME = 'notes'
    LIMIT 1
  `);

  if (!billsNotesColumn.length) {
    await db.query("ALTER TABLE bills ADD COLUMN notes VARCHAR(1000) NULL");
  }
  // Modify bills status enum
  await db.query("ALTER TABLE bills MODIFY COLUMN status ENUM('draft', 'unpaid', 'overdue', 'paid', 'partially_paid') NOT NULL DEFAULT 'unpaid'");

  // Add charge_type to bill_charges
  const [billChargesChargeTypeColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bill_charges'
      AND COLUMN_NAME = 'charge_type'
    LIMIT 1
  `);

  if (!billChargesChargeTypeColumn.length) {
    await db.query("ALTER TABLE bill_charges ADD COLUMN charge_type ENUM('maintenance', 'parking', 'utility', 'late_fee', 'misc') NOT NULL DEFAULT 'misc'");
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS complaints (
      id INT AUTO_INCREMENT PRIMARY KEY,
      resident_id INT NOT NULL,
      society_id INT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(80) NOT NULL DEFAULT 'general',
      status ENUM('open', 'assigned', 'in_progress', 'resolved', 'closed', 'archived', 'deleted') NOT NULL DEFAULT 'open',
      updated_by INT NULL,
      resolved_at DATETIME NULL,
      archived_at DATETIME NULL,
      archived_by INT NULL,
      archived_from_status VARCHAR(40) NULL,
      deleted_at DATETIME NULL,
      deleted_by INT NULL,
      deletion_reason VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_complaints_society_status (society_id, status),
      INDEX idx_complaints_resident_status (resident_id, status),
      INDEX idx_complaints_category_status (category, status),
      CONSTRAINT fk_complaints_resident
        FOREIGN KEY (resident_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_complaints_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  const complaintColumns = [
    { name: "society_id", sql: "ALTER TABLE complaints ADD COLUMN society_id INT NULL AFTER resident_id" },
    { name: "category", sql: "ALTER TABLE complaints ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT 'general' AFTER description" },
    { name: "archived_at", sql: "ALTER TABLE complaints ADD COLUMN archived_at DATETIME NULL AFTER resolved_at" },
    { name: "archived_by", sql: "ALTER TABLE complaints ADD COLUMN archived_by INT NULL AFTER archived_at" },
    { name: "archived_from_status", sql: "ALTER TABLE complaints ADD COLUMN archived_from_status VARCHAR(40) NULL AFTER archived_by" },
    { name: "deleted_at", sql: "ALTER TABLE complaints ADD COLUMN deleted_at DATETIME NULL AFTER archived_from_status" },
    { name: "deleted_by", sql: "ALTER TABLE complaints ADD COLUMN deleted_by INT NULL AFTER deleted_at" },
    { name: "deletion_reason", sql: "ALTER TABLE complaints ADD COLUMN deletion_reason VARCHAR(500) NULL AFTER deleted_by" },
  ];

  for (const column of complaintColumns) {
    const [columnExists] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'complaints'
        AND COLUMN_NAME = ?
      LIMIT 1
    `, [column.name]);

    if (!columnExists.length) {
      await db.query(column.sql);
    }
  }

  await db.query(
    `UPDATE complaints c
     JOIN users u ON u.id = c.resident_id
     SET c.society_id = u.society_id
     WHERE c.society_id IS NULL`
  ).catch(() => {});

  await db.query("UPDATE complaints SET status = 'open' WHERE status = 'pending'").catch(() => {});
  await db.query("UPDATE complaints SET status = 'closed' WHERE status = 'resolved'").catch(() => {});

  await db.query(`
    CREATE TABLE IF NOT EXISTS complaint_comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      complaint_id INT NOT NULL,
      user_id INT NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_complaint_comments_complaint_id (complaint_id),
      CONSTRAINT fk_complaint_comments_complaint
        FOREIGN KEY (complaint_id) REFERENCES complaints(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_complaint_comments_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS notices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      created_by INT NOT NULL,
      society_id INT NULL,
      status ENUM('active', 'scheduled', 'expired', 'archived', 'deleted') NOT NULL DEFAULT 'active',
      expires_at DATETIME NULL,
      archived_at DATETIME NULL,
      archived_by INT NULL,
      archived_from_status VARCHAR(40) NULL,
      deleted_at DATETIME NULL,
      deleted_by INT NULL,
      deletion_reason VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_notices_society_status (society_id, status),
      INDEX idx_notices_created_at (created_at),
      INDEX idx_notices_status_expiry (status, expires_at),
      CONSTRAINT fk_notices_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  const noticeColumns = [
    { name: "society_id", sql: "ALTER TABLE notices ADD COLUMN society_id INT NULL AFTER created_by" },
    { name: "status", sql: "ALTER TABLE notices ADD COLUMN status ENUM('active', 'scheduled', 'expired', 'archived', 'deleted') NOT NULL DEFAULT 'active' AFTER created_by" },
    { name: "expires_at", sql: "ALTER TABLE notices ADD COLUMN expires_at DATETIME NULL AFTER status" },
    { name: "archived_at", sql: "ALTER TABLE notices ADD COLUMN archived_at DATETIME NULL AFTER expires_at" },
    { name: "archived_by", sql: "ALTER TABLE notices ADD COLUMN archived_by INT NULL AFTER archived_at" },
    { name: "archived_from_status", sql: "ALTER TABLE notices ADD COLUMN archived_from_status VARCHAR(40) NULL AFTER archived_by" },
    { name: "deleted_at", sql: "ALTER TABLE notices ADD COLUMN deleted_at DATETIME NULL AFTER archived_from_status" },
    { name: "deleted_by", sql: "ALTER TABLE notices ADD COLUMN deleted_by INT NULL AFTER deleted_at" },
    { name: "deletion_reason", sql: "ALTER TABLE notices ADD COLUMN deletion_reason VARCHAR(500) NULL AFTER deleted_by" },
    { name: "updated_at", sql: "ALTER TABLE notices ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at" },
  ];

  for (const column of noticeColumns) {
    const [columnExists] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'notices'
        AND COLUMN_NAME = ?
      LIMIT 1
    `, [column.name]);

    if (!columnExists.length) {
      await db.query(column.sql);
    }
  }

  await db.query(
    `UPDATE notices n
     JOIN users u ON u.id = n.created_by
     SET n.society_id = u.society_id
     WHERE n.society_id IS NULL`
  ).catch(() => {});

  const [retentionTableExists] = await db.query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'retention_rules'
    LIMIT 1
  `);

  if (!retentionTableExists.length) {
    await db.query(`
      CREATE TABLE retention_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        resource_type VARCHAR(80) NOT NULL UNIQUE,
        retention_days INT NOT NULL DEFAULT 30,
        archive_after_days INT NOT NULL DEFAULT 30,
        auto_archive_enabled TINYINT(1) NOT NULL DEFAULT 1,
        allow_permanent_delete TINYINT(1) NOT NULL DEFAULT 0,
        updated_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_retention_rules_updated_by
          FOREIGN KEY (updated_by) REFERENCES users(id)
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    await db.query(
      `INSERT INTO retention_rules (resource_type, retention_days, archive_after_days, auto_archive_enabled, allow_permanent_delete)
       VALUES
       ('complaints', 30, 30, 1, 0),
       ('notices', 30, 30, 1, 0),
       ('visitors', 3650, 3650, 1, 0),
       ('security_logs', 3650, 3650, 1, 0),
       ('documents', 3650, 3650, 1, 0),
       ('billing', 3650, 3650, 0, 0)`
    ).catch(() => {});
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NULL,
      visitor_name VARCHAR(150) NOT NULL,
      visitor_email VARCHAR(150) NULL,
      phone VARCHAR(30) NULL,
      purpose VARCHAR(255) NOT NULL,
      person_to_meet VARCHAR(150) NULL,
      vehicle_number VARCHAR(50) NULL,
      flat_id INT NULL,
      preapproval_id INT NULL,
      entry_time DATETIME NOT NULL,
      exit_time DATETIME NULL,
      status ENUM('in_premises', 'exited') NOT NULL DEFAULT 'in_premises',
      security_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_visitors_society_status_entry (society_id, status, entry_time),
      INDEX idx_visitors_status_entry (status, entry_time),
      INDEX idx_visitors_flat_entry (flat_id, entry_time),
      CONSTRAINT fk_visitors_security
        FOREIGN KEY (security_id) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  const [visitorFlatIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'flat_id'
    LIMIT 1
  `);

  if (!visitorFlatIdColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN flat_id INT NULL");
  }

  const [visitorSocietyColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'society_id'
    LIMIT 1
  `);

  if (!visitorSocietyColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN society_id INT NULL AFTER id");
  }

  await db.query(
    `UPDATE visitors v
     LEFT JOIN flats f ON f.id = v.flat_id
     LEFT JOIN users u ON u.id = v.security_id
     SET v.society_id = COALESCE(f.society_id, u.society_id)
     WHERE v.society_id IS NULL`
  ).catch(() => {});

  await db.query(
    `CREATE INDEX idx_visitors_society_status_entry ON visitors (society_id, status, entry_time)`
  ).catch(() => {});

  const [documentsTableExists] = await db.query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'documents'
    LIMIT 1
  `);

  if (documentsTableExists.length) {
    const [documentsSocietyColumn] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'documents'
        AND COLUMN_NAME = 'society_id'
      LIMIT 1
    `);

    if (!documentsSocietyColumn.length) {
      await db.query("ALTER TABLE documents ADD COLUMN society_id INT NULL AFTER user_id");
    }

    await db.query(
      `UPDATE documents d
       JOIN users u ON u.id = d.user_id
       SET d.society_id = u.society_id
       WHERE d.society_id IS NULL`
    ).catch(() => {});

    await db.query("CREATE INDEX idx_documents_society_status ON documents (society_id, status)").catch(() => {});
  }

  const [parkingTableExists] = await db.query(`
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'parking_slots'
    LIMIT 1
  `);

  if (parkingTableExists.length) {
    const [parkingSocietyColumn] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'parking_slots'
        AND COLUMN_NAME = 'society_id'
      LIMIT 1
    `);

    if (!parkingSocietyColumn.length) {
      await db.query("ALTER TABLE parking_slots ADD COLUMN society_id INT NULL AFTER id");
    }

    await db.query(
      `UPDATE parking_slots ps
       LEFT JOIN flats f ON f.id = ps.flat_id
       LEFT JOIN users u ON u.id = ps.owner_id
       SET ps.society_id = COALESCE(f.society_id, u.society_id)
       WHERE ps.society_id IS NULL`
    ).catch(() => {});

    await db.query("CREATE INDEX idx_parking_slots_society_status ON parking_slots (society_id, status)").catch(() => {});
  }

  const [visitorPreapprovalIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'preapproval_id'
    LIMIT 1
  `);

  if (!visitorPreapprovalIdColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN preapproval_id INT NULL");
  }

  const [visitorEmailColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'visitor_email'
    LIMIT 1
  `);

  if (!visitorEmailColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN visitor_email VARCHAR(150) NULL");
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS towers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NOT NULL,
      tower_name VARCHAR(120) NOT NULL,
      tower_code VARCHAR(40) NOT NULL,
      total_floors INT NOT NULL DEFAULT 1,
      flats_per_floor INT NOT NULL DEFAULT 1,
      flat_number_format ENUM('floor_sequence', 'floor_pad_sequence', 'custom') NOT NULL DEFAULT 'floor_sequence',
      starting_floor INT NOT NULL DEFAULT 1,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_towers_society_name (society_id, tower_name),
      UNIQUE KEY uk_towers_society_code (society_id, tower_code),
      INDEX idx_towers_society_status (society_id, status),
      CONSTRAINT fk_towers_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_towers_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS flats (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NULL,
      tower_id INT NULL,
      building_name VARCHAR(120) NOT NULL,
      wing ENUM('A', 'B', 'C', 'D') NOT NULL DEFAULT 'A',
      wing_id INT NULL,
      flat_number VARCHAR(50) NOT NULL,
      floor VARCHAR(20) NULL,
      flat_type VARCHAR(50) NULL,
      status ENUM('vacant', 'occupied') NOT NULL DEFAULT 'vacant',
      occupancy_status ENUM('vacant', 'owner_occupied', 'tenant_occupied', 'reserved', 'under_maintenance') NOT NULL DEFAULT 'vacant',
      approval_status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending',
      approved_by INT NULL,
      approved_at DATETIME NULL,
      archived_at DATETIME NULL,
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_society_tower_flat (society_id, tower_id, flat_number),
      UNIQUE KEY uk_society_wing_flat (society_id, wing, flat_number),
      INDEX idx_flats_status (status),
      INDEX idx_flats_occupancy_status (occupancy_status),
      INDEX idx_flats_tower_floor (tower_id, floor),
      INDEX idx_flats_wing_approval (wing, approval_status),
      CONSTRAINT fk_flats_tower
        FOREIGN KEY (tower_id) REFERENCES towers(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_flats_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_flats_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  const [flatSocietyColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'society_id'
    LIMIT 1
  `);

  if (!flatSocietyColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN society_id INT NULL AFTER id");
  }

  const [flatTowerColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'tower_id'
    LIMIT 1
  `);

  if (!flatTowerColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN tower_id INT NULL AFTER society_id");
  }

  const [flatWingColumn] = await db.query(`
    SELECT COLUMN_TYPE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'wing'
    LIMIT 1
  `);

  if (flatWingColumn.length && !String(flatWingColumn[0].COLUMN_TYPE || "").includes("'D'")) {
    await db.query("ALTER TABLE flats MODIFY COLUMN wing ENUM('A', 'B', 'C', 'D') NOT NULL DEFAULT 'A'");
  }

  const [flatOccupancyColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'occupancy_status'
    LIMIT 1
  `);

  if (!flatOccupancyColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN occupancy_status ENUM('vacant', 'owner_occupied', 'tenant_occupied', 'reserved', 'under_maintenance') NOT NULL DEFAULT 'vacant' AFTER status");
  }

  try {
    await db.query("ALTER TABLE flats DROP INDEX uk_wing_flat");
  } catch (error) {
    if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
      throw error;
    }
  }

  try {
    await db.query("CREATE UNIQUE INDEX uk_society_wing_flat ON flats (society_id, wing, flat_number)");
  } catch (error) {
    if (error.code !== "ER_DUP_KEYNAME") {
      throw error;
    }
  }

  try {
    await db.query("CREATE UNIQUE INDEX uk_society_tower_flat ON flats (society_id, tower_id, flat_number)");
  } catch (error) {
    if (error.code !== "ER_DUP_KEYNAME") {
      throw error;
    }
  }

  const [flatSocietyFk] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'society_id'
      AND REFERENCED_TABLE_NAME = 'societies'
    LIMIT 1
  `);

  if (!flatSocietyFk.length) {
    await db.query(
      "ALTER TABLE flats ADD CONSTRAINT fk_flats_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }

  const [wingColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'wing'
    LIMIT 1
  `);

  if (!wingColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN wing ENUM('A', 'B', 'C', 'D') NOT NULL DEFAULT 'A'");
  }

  const [wingIdColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'wing_id'
    LIMIT 1
  `);

  if (!wingIdColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN wing_id INT NULL AFTER wing");
  }

  const [wingFk] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'wing_id'
      AND REFERENCED_TABLE_NAME = 'wings'
    LIMIT 1
  `);

  if (!wingFk.length) {
    try {
      await db.query("ALTER TABLE flats ADD CONSTRAINT fk_flats_wing_id FOREIGN KEY (wing_id) REFERENCES wings(id) ON DELETE SET NULL ON UPDATE CASCADE");
    } catch (err) {
      // ignore if constraint cannot be added in older schemas
    }
  }

  try {
    await db.query("ALTER TABLE flats DROP INDEX uk_building_flat");
  } catch (error) {
    if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
      throw error;
    }
  }

  try {
    await db.query("CREATE UNIQUE INDEX uk_society_wing_flat ON flats (society_id, wing, flat_number)");
  } catch (error) {
    if (error.code !== "ER_DUP_KEYNAME") {
      throw error;
    }
  }

  const [approvalStatusColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'approval_status'
    LIMIT 1
  `);

  if (!approvalStatusColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN approval_status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending'");
  }

  const [approvedByColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'approved_by'
    LIMIT 1
  `);

  if (!approvedByColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN approved_by INT NULL");
  }

  const [approvedAtColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'approved_at'
    LIMIT 1
  `);

  if (!approvedAtColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN approved_at DATETIME NULL");
  }

  const [archivedAtColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'archived_at'
    LIMIT 1
  `);

  if (!archivedAtColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN archived_at DATETIME NULL");
  }

  const [updatedAtColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'updated_at'
    LIMIT 1
  `);

  if (!updatedAtColumn.length) {
    await db.query("ALTER TABLE flats ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  }

  const [approvedByFk] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'flats'
      AND COLUMN_NAME = 'approved_by'
      AND REFERENCED_TABLE_NAME = 'users'
    LIMIT 1
  `);

  if (!approvedByFk.length) {
    await db.query(
      "ALTER TABLE flats ADD CONSTRAINT fk_flats_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE"
    );
  }

  const [flatFkColumn] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'flat_id'
      AND REFERENCED_TABLE_NAME = 'flats'
    LIMIT 1
  `);

  if (!flatFkColumn.length) {
    await db.query(
      "ALTER TABLE users ADD CONSTRAINT fk_users_flat FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitor_preapprovals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner_id INT NOT NULL,
      flat_id INT NOT NULL,
      visitor_name VARCHAR(150) NOT NULL,
      phone VARCHAR(30) NULL,
      purpose VARCHAR(255) NOT NULL,
      visit_date DATE NOT NULL,
      expected_arrival_time TIME NULL,
      vehicle_number VARCHAR(50) NULL,
      notes VARCHAR(500) NULL,
      status ENUM('approved', 'visited', 'cancelled') NOT NULL DEFAULT 'approved',
      approved_at DATETIME NOT NULL,
      approval_token VARCHAR(120) NULL,
      qr_pass_token VARCHAR(120) NULL,
      qr_pass_issued_at DATETIME NULL,
      otp_code_hash VARCHAR(255) NULL,
      otp_expires_at DATETIME NULL,
      otp_verified_at DATETIME NULL,
      resident_notes VARCHAR(500) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_preapprovals_owner_status (owner_id, status, visit_date),
      CONSTRAINT fk_preapprovals_owner
        FOREIGN KEY (owner_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_preapprovals_flat
        FOREIGN KEY (flat_id) REFERENCES flats(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  const visitorPreapprovalColumns = [
    { name: "approval_token", sql: "ALTER TABLE visitor_preapprovals ADD COLUMN approval_token VARCHAR(120) NULL AFTER approved_at" },
    { name: "qr_pass_token", sql: "ALTER TABLE visitor_preapprovals ADD COLUMN qr_pass_token VARCHAR(120) NULL AFTER approval_token" },
    { name: "qr_pass_issued_at", sql: "ALTER TABLE visitor_preapprovals ADD COLUMN qr_pass_issued_at DATETIME NULL AFTER qr_pass_token" },
    { name: "otp_code_hash", sql: "ALTER TABLE visitor_preapprovals ADD COLUMN otp_code_hash VARCHAR(255) NULL AFTER qr_pass_issued_at" },
    { name: "otp_expires_at", sql: "ALTER TABLE visitor_preapprovals ADD COLUMN otp_expires_at DATETIME NULL AFTER otp_code_hash" },
    { name: "otp_verified_at", sql: "ALTER TABLE visitor_preapprovals ADD COLUMN otp_verified_at DATETIME NULL AFTER otp_expires_at" },
    { name: "resident_notes", sql: "ALTER TABLE visitor_preapprovals ADD COLUMN resident_notes VARCHAR(500) NULL AFTER otp_verified_at" },
  ];

  for (const column of visitorPreapprovalColumns) {
    const [columnExists] = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'visitor_preapprovals'
        AND COLUMN_NAME = ?
      LIMIT 1
    `, [column.name]);

    if (!columnExists.length) {
      await db.query(column.sql);
    }
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitor_qr_passes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      preapproval_id INT NOT NULL,
      pass_token VARCHAR(120) NOT NULL UNIQUE,
      qr_payload LONGTEXT NOT NULL,
      qr_code_url LONGTEXT NOT NULL,
      status ENUM('active', 'scanned', 'expired', 'revoked') NOT NULL DEFAULT 'active',
      expires_at DATETIME NOT NULL,
      issued_by INT NULL,
      scanned_by INT NULL,
      scan_count INT NOT NULL DEFAULT 0,
      last_scanned_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_visitor_qr_passes_status (status, expires_at),
      CONSTRAINT fk_visitor_qr_pass_preapproval
        FOREIGN KEY (preapproval_id) REFERENCES visitor_preapprovals(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_qr_pass_issued_by
        FOREIGN KEY (issued_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_qr_pass_scanned_by
        FOREIGN KEY (scanned_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitor_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      preapproval_id INT NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      otp_code_last4 VARCHAR(4) NULL,
      status ENUM('active', 'verified', 'expired', 'revoked') NOT NULL DEFAULT 'active',
      expires_at DATETIME NOT NULL,
      issued_by INT NULL,
      verified_by INT NULL,
      verified_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_visitor_otps_status (status, expires_at),
      CONSTRAINT fk_visitor_otp_preapproval
        FOREIGN KEY (preapproval_id) REFERENCES visitor_preapprovals(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_otp_issued_by
        FOREIGN KEY (issued_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_otp_verified_by
        FOREIGN KEY (verified_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitor_face_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      preapproval_id INT NOT NULL,
      visitor_name VARCHAR(150) NOT NULL,
      phone VARCHAR(30) NULL,
      flat_id INT NULL,
      face_capture_url LONGTEXT NULL,
      face_signature VARCHAR(255) NULL,
      face_match_confidence DECIMAL(5, 2) NULL,
      created_by INT NULL,
      updated_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_visitor_faces_signature (face_signature),
      CONSTRAINT fk_visitor_faces_preapproval
        FOREIGN KEY (preapproval_id) REFERENCES visitor_preapprovals(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_faces_flat
        FOREIGN KEY (flat_id) REFERENCES flats(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_faces_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_faces_updated_by
        FOREIGN KEY (updated_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitor_blacklist_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      visitor_name VARCHAR(150) NULL,
      phone VARCHAR(30) NULL,
      reason VARCHAR(500) NOT NULL,
      flat_id INT NULL,
      face_signature VARCHAR(255) NULL,
      blocked_by INT NULL,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_visitor_blacklist_status (status, created_at),
      CONSTRAINT fk_visitor_blacklist_flat
        FOREIGN KEY (flat_id) REFERENCES flats(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_blacklist_blocked_by
        FOREIGN KEY (blocked_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitor_vehicle_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      visitor_id INT NULL,
      preapproval_id INT NULL,
      vehicle_number VARCHAR(50) NOT NULL,
      vehicle_type VARCHAR(60) NULL,
      owner_name VARCHAR(150) NULL,
      flat_id INT NULL,
      entry_method ENUM('manual', 'qr', 'otp', 'face', 'guard') NOT NULL DEFAULT 'manual',
      status ENUM('inside', 'outside', 'blocked') NOT NULL DEFAULT 'inside',
      entry_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      exit_time DATETIME NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_visitor_vehicle_status (status, entry_time),
      CONSTRAINT fk_visitor_vehicle_visitor
        FOREIGN KEY (visitor_id) REFERENCES visitors(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_vehicle_preapproval
        FOREIGN KEY (preapproval_id) REFERENCES visitor_preapprovals(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_vehicle_flat
        FOREIGN KEY (flat_id) REFERENCES flats(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_vehicle_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitor_delivery_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      visitor_id INT NULL,
      delivery_type VARCHAR(100) NOT NULL,
      package_id VARCHAR(120) NULL,
      recipient_name VARCHAR(120) NULL,
      delivery_partner VARCHAR(120) NULL,
      flat_id INT NULL,
      status ENUM('pending', 'received', 'dispatched', 'returned') NOT NULL DEFAULT 'pending',
      notes VARCHAR(500) NULL,
      created_by INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_visitor_delivery_status (status, created_at),
      CONSTRAINT fk_visitor_delivery_visitor
        FOREIGN KEY (visitor_id) REFERENCES visitors(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_delivery_flat
        FOREIGN KEY (flat_id) REFERENCES flats(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_delivery_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS visitor_emergency_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      triggered_by INT NOT NULL,
      alert_type ENUM('fire', 'medical', 'security', 'maintenance', 'other') NOT NULL DEFAULT 'security',
      severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'high',
      message VARCHAR(1200) NOT NULL,
      location VARCHAR(255) NULL,
      status ENUM('active', 'acknowledged', 'resolved') NOT NULL DEFAULT 'active',
      acknowledged_by INT NULL,
      acknowledged_at DATETIME NULL,
      resolved_by INT NULL,
      resolved_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_visitor_emergency_alerts_status (status, created_at),
      CONSTRAINT fk_visitor_emergency_triggered_by
        FOREIGN KEY (triggered_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_emergency_ack_by
        FOREIGN KEY (acknowledged_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_visitor_emergency_resolved_by
        FOREIGN KEY (resolved_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  const [visitorApprovalColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'approval_status'
    LIMIT 1
  `);

  if (!visitorApprovalColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN approval_status ENUM('pending', 'approved', 'manual_review', 'blocked', 'rejected') NOT NULL DEFAULT 'approved'");
  }

  const [visitorQrPassColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'qr_pass_id'
    LIMIT 1
  `);

  if (!visitorQrPassColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN qr_pass_id INT NULL");
  }

  const [visitorFaceCaptureColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'face_capture_url'
    LIMIT 1
  `);

  if (!visitorFaceCaptureColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN face_capture_url LONGTEXT NULL");
  }

  const [visitorFaceSignatureColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'face_signature'
    LIMIT 1
  `);

  if (!visitorFaceSignatureColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN face_signature VARCHAR(255) NULL");
  }

  const [visitorFaceMatchConfidenceColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'face_match_confidence'
    LIMIT 1
  `);

  if (!visitorFaceMatchConfidenceColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN face_match_confidence DECIMAL(5, 2) NULL");
  }

  const [visitorBlacklistFlagColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'blacklist_flag'
    LIMIT 1
  `);

  if (!visitorBlacklistFlagColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN blacklist_flag TINYINT(1) NOT NULL DEFAULT 0");
  }

  const [visitorOtpVerifiedAtColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'otp_verified_at'
    LIMIT 1
  `);

  if (!visitorOtpVerifiedAtColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN otp_verified_at DATETIME NULL");
  }

  const [visitorCheckInMethodColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'check_in_method'
    LIMIT 1
  `);

  if (!visitorCheckInMethodColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN check_in_method VARCHAR(30) NULL");
  }

  const [visitorCheckOutMethodColumn] = await db.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'check_out_method'
    LIMIT 1
  `);

  if (!visitorCheckOutMethodColumn.length) {
    await db.query("ALTER TABLE visitors ADD COLUMN check_out_method VARCHAR(30) NULL");
  }

  try {
    await db.query("ALTER TABLE visitors ADD CONSTRAINT fk_visitors_qr_pass FOREIGN KEY (qr_pass_id) REFERENCES visitor_qr_passes(id) ON DELETE SET NULL ON UPDATE CASCADE");
  } catch (error) {
    if (
      error.code !== "ER_DUP_KEYNAME" &&
      error.code !== "ER_LOCK_WAIT_TIMEOUT" &&
      !String(error.message).includes("Duplicate foreign key constraint name")
    ) {
      throw error;
    }
  }

  const [visitorFlatFk] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'flat_id'
      AND REFERENCED_TABLE_NAME = 'flats'
    LIMIT 1
  `);

  if (!visitorFlatFk.length) {
    await db.query(
      "ALTER TABLE visitors ADD CONSTRAINT fk_visitors_flat FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }

  const [visitorPreapprovalFk] = await db.query(`
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'visitors'
      AND COLUMN_NAME = 'preapproval_id'
      AND REFERENCED_TABLE_NAME = 'visitor_preapprovals'
    LIMIT 1
  `);

  if (!visitorPreapprovalFk.length) {
    await db.query(
      "ALTER TABLE visitors ADD CONSTRAINT fk_visitors_preapproval FOREIGN KEY (preapproval_id) REFERENCES visitor_preapprovals(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS flat_residents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flat_id INT NOT NULL,
      resident_id INT NOT NULL,
      move_in_date DATE NOT NULL,
      move_out_date DATE NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      assigned_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_flat_residents_flat_active (flat_id, is_active),
      INDEX idx_flat_residents_resident (resident_id),
      CONSTRAINT fk_flat_residents_flat
        FOREIGN KEY (flat_id) REFERENCES flats(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_flat_residents_resident
        FOREIGN KEY (resident_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_flat_residents_assigned_by
        FOREIGN KEY (assigned_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS owner_properties (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      flat_id INT NOT NULL,
      living_start_date DATE NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_owner_properties_user_flat (user_id, flat_id),
      UNIQUE KEY uk_owner_properties_flat (flat_id),
      INDEX idx_owner_properties_user (user_id),
      CONSTRAINT fk_owner_properties_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_owner_properties_flat
        FOREIGN KEY (flat_id) REFERENCES flats(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_threads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      society_id INT NULL,
      thread_type ENUM('direct', 'group', 'channel') NOT NULL DEFAULT 'direct',
      title VARCHAR(200) NULL,
      description VARCHAR(500) NULL,
      avatar_url VARCHAR(500) NULL,
      created_by INT NOT NULL,
      last_message_at DATETIME NULL,
      pinned_message_id INT NULL,
      archived_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chat_threads_society_type (society_id, thread_type),
      CONSTRAINT fk_chat_threads_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_chat_threads_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_thread_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      thread_id INT NOT NULL,
      user_id INT NOT NULL,
      member_role ENUM('owner', 'admin', 'member') NOT NULL DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      left_at DATETIME NULL,
      muted_until DATETIME NULL,
      last_read_message_id INT NULL,
      last_delivered_message_id INT NULL,
      UNIQUE KEY uniq_chat_thread_member (thread_id, user_id),
      INDEX idx_chat_thread_members_user (user_id),
      CONSTRAINT fk_chat_thread_members_thread
        FOREIGN KEY (thread_id) REFERENCES chat_threads(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_chat_thread_members_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      thread_id INT NOT NULL,
      sender_id INT NOT NULL,
      receiver_id INT NULL,
      message_type ENUM('text', 'image', 'video', 'audio', 'file', 'pdf', 'system') NOT NULL DEFAULT 'text',
      message TEXT NULL,
      media_url VARCHAR(500) NULL,
      media_name VARCHAR(255) NULL,
      media_size INT NULL,
      mime_type VARCHAR(120) NULL,
      thumbnail_url VARCHAR(500) NULL,
      reply_to_message_id INT NULL,
      is_pinned TINYINT(1) NOT NULL DEFAULT 0,
      pinned_by INT NULL,
      pinned_at DATETIME NULL,
      metadata_json LONGTEXT NULL,
      deleted_for_sender TINYINT(1) NOT NULL DEFAULT 0,
      deleted_for_receiver TINYINT(1) NOT NULL DEFAULT 0,
      deleted_for_all TINYINT(1) NOT NULL DEFAULT 0,
      deleted_for_all_by INT NULL,
      deleted_for_all_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chat_messages_thread_created (thread_id, created_at),
      INDEX idx_chat_messages_sender_created (sender_id, created_at),
      INDEX idx_chat_messages_receiver_created (receiver_id, created_at),
      FULLTEXT KEY ft_chat_messages_text (message, media_name),
      CONSTRAINT fk_chat_messages_thread
        FOREIGN KEY (thread_id) REFERENCES chat_threads(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_chat_messages_sender
        FOREIGN KEY (sender_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_chat_messages_receiver
        FOREIGN KEY (receiver_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_chat_messages_reply_to
        FOREIGN KEY (reply_to_message_id) REFERENCES chat_messages(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_chat_messages_pinned_by
        FOREIGN KEY (pinned_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_chat_messages_deleted_for_all_by
        FOREIGN KEY (deleted_for_all_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_message_receipts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message_id INT NOT NULL,
      user_id INT NOT NULL,
      delivered_at DATETIME NULL,
      read_at DATETIME NULL,
      UNIQUE KEY uniq_chat_receipt (message_id, user_id),
      INDEX idx_chat_receipts_user (user_id),
      CONSTRAINT fk_chat_receipts_message
        FOREIGN KEY (message_id) REFERENCES chat_messages(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_chat_receipts_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_message_reactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      message_id INT NOT NULL,
      user_id INT NOT NULL,
      reaction VARCHAR(40) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_chat_reaction (message_id, user_id, reaction),
      INDEX idx_chat_reactions_message (message_id),
      CONSTRAINT fk_chat_reactions_message
        FOREIGN KEY (message_id) REFERENCES chat_messages(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_chat_reactions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  console.log("Database schema initialized successfully!");
}

if (require.main === module) {
  ensureSchema()
    .then(() => {
      console.log("Schema ensured");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Schema initialization failed:", error.message);
      process.exit(1);
    });
}

module.exports = ensureSchema;
