-- SaaS Platform Enhancements: Multi-society Demo, Theme System, Approval Workflow
-- This migration adds comprehensive support for the AI Smart Society Management SaaS Platform

-- =====================================================
-- 1. WINGS/TOWERS/BLOCKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  society_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) NOT NULL,
  structure_type ENUM('wing', 'tower', 'block', 'building') NOT NULL DEFAULT 'wing',
  total_floors INT NOT NULL DEFAULT 0,
  units_per_floor INT NOT NULL DEFAULT 0,
  description VARCHAR(500) NULL,
  status ENUM('active', 'inactive', 'under_construction') NOT NULL DEFAULT 'active',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_society_wing_code (society_id, code),
  INDEX idx_wings_society_status (society_id, status),
  CONSTRAINT fk_wings_society
    FOREIGN KEY (society_id) REFERENCES societies(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_wings_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- 2. UPDATE FLATS TABLE TO REFERENCE WINGS
-- =====================================================
ALTER TABLE flats
ADD COLUMN IF NOT EXISTS wing_id INT NULL AFTER society_id;

ALTER TABLE flats
DROP COLUMN IF EXISTS wing;

ALTER TABLE flats
ADD CONSTRAINT fk_flats_wing
  FOREIGN KEY (wing_id) REFERENCES wings(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- 3. USER APPROVAL WORKFLOW
-- =====================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending_approval', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending_approval' AFTER status;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved_by INT NULL AFTER approval_status;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS approval_rejected_reason VARCHAR(500) NULL AFTER approved_by;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL AFTER approval_rejected_reason;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL AFTER email;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS kyc_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending' AFTER phone;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS kyc_document_url VARCHAR(500) NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS kyc_document_type VARCHAR(50) NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS kyc_verified_by INT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS kyc_verified_at DATETIME NULL;

ALTER TABLE users
ADD CONSTRAINT fk_users_approved_by
  FOREIGN KEY (approved_by) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE users
ADD CONSTRAINT fk_users_kyc_verified_by
  FOREIGN KEY (kyc_verified_by) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

-- =====================================================
-- 4. USER APPROVALS AUDIT TABLE
-- =====================================================
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
);

-- =====================================================
-- 5. AI THEME STORAGE
-- =====================================================
ALTER TABLE societies
ADD COLUMN IF NOT EXISTS theme_primary VARCHAR(20) NOT NULL DEFAULT '#0f766e' AFTER subscription_plan;

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS theme_secondary VARCHAR(20) NOT NULL DEFAULT '#2563eb';

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS theme_accent VARCHAR(20) NOT NULL DEFAULT '#14b8a6';

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS theme_background VARCHAR(20) NOT NULL DEFAULT '#ffffff';

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS theme_card VARCHAR(20) NOT NULL DEFAULT '#f9fafb';

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS theme_mode ENUM('light', 'dark', 'auto') NOT NULL DEFAULT 'light';

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS theme_gradient_style VARCHAR(100) NULL;

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS sidebar_style ENUM('light', 'dark', 'colored') NOT NULL DEFAULT 'light';

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS button_style ENUM('rounded', 'square', 'pill') NOT NULL DEFAULT 'rounded';

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) NOT NULL DEFAULT 'Inter';

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS accent_radius VARCHAR(20) NOT NULL DEFAULT 'rounded-lg';

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS theme_preset VARCHAR(50) NULL;

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS custom_css LONGTEXT NULL;

-- =====================================================
-- 6. AI THEME GENERATION LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_theme_generations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  society_id INT NOT NULL,
  request_prompt TEXT NOT NULL,
  generated_theme_json LONGTEXT NOT NULL,
  status ENUM('applied', 'rejected', 'archived') NOT NULL DEFAULT 'archived',
  generated_by INT NOT NULL,
  applied_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_themes_society (society_id),
  INDEX idx_ai_themes_status (status),
  CONSTRAINT fk_ai_themes_society
    FOREIGN KEY (society_id) REFERENCES societies(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ai_themes_generated_by
    FOREIGN KEY (generated_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- =====================================================
-- 7. GEMINI AI CHAT HISTORY
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  society_id INT NULL,
  chat_type ENUM('general', 'society_aware', 'complaint_assistant', 'notice_generator') NOT NULL DEFAULT 'general',
  query TEXT NOT NULL,
  response LONGTEXT NOT NULL,
  model_name VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-flash',
  tokens_used INT NULL,
  response_time_ms INT NULL,
  ai_permissions_json LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ai_chats_user_society (user_id, society_id),
  INDEX idx_ai_chats_type (chat_type),
  CONSTRAINT fk_ai_chats_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ai_chats_society
    FOREIGN KEY (society_id) REFERENCES societies(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- 8. USER PROFILE DETAILS (FOR DOCUMENT STORAGE)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  phone VARCHAR(20) NULL,
  alternate_phone VARCHAR(20) NULL,
  date_of_birth DATE NULL,
  gender VARCHAR(20) NULL,
  address TEXT NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) DEFAULT 'India',
  document_type VARCHAR(50) NULL,
  document_number VARCHAR(100) NULL,
  document_url VARCHAR(500) NULL,
  document_verified_by INT NULL,
  document_verified_at DATETIME NULL,
  rent_agreement_url VARCHAR(500) NULL,
  ownership_document_url VARCHAR(500) NULL,
  id_proof_url VARCHAR(500) NULL,
  profile_photo_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_profiles_verified_by
    FOREIGN KEY (document_verified_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================
-- 9. DEMO SOCIETY MARKERS
-- =====================================================
CREATE TABLE IF NOT EXISTS demo_data_markers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  society_id INT NOT NULL,
  is_demo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_markers_society_demo (society_id, is_demo),
  INDEX idx_markers_entity (entity_type, entity_id),
  UNIQUE KEY uk_marker (entity_type, entity_id, society_id),
  CONSTRAINT fk_markers_society
    FOREIGN KEY (society_id) REFERENCES societies(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
-- 10. INDEXES FOR PERFORMANCE
-- =====================================================
ALTER TABLE users
ADD INDEX IF NOT EXISTS idx_users_approval_society (approval_status, society_id);

ALTER TABLE users
ADD INDEX IF NOT EXISTS idx_users_resident_type_society (resident_type, society_id, approval_status);

ALTER TABLE flats
ADD INDEX IF NOT EXISTS idx_flats_society_wing (society_id, wing_id);

-- =====================================================
-- COMPLETE - Database enhancements for AI Smart Society Management SaaS
-- =====================================================
