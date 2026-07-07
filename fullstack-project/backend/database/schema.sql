CREATE DATABASE IF NOT EXISTS fullstack_db;
USE fullstack_db;

CREATE TABLE IF NOT EXISTS societies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  slug VARCHAR(60) NOT NULL UNIQUE,
  subdomain VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  society_name VARCHAR(120) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  pincode VARCHAR(20) NULL,
  contact_email VARCHAR(150) NULL,
  contact_phone VARCHAR(30) NULL,
  status ENUM('active', 'inactive', 'suspended', 'trial', 'archived', 'deleted') NOT NULL DEFAULT 'active',
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  default_language VARCHAR(20) NOT NULL DEFAULT 'en',
  primary_admin_user_id INT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- No demo or default societies are auto-seeded here.
-- Society records should be created through the Super Admin dashboard or explicit seed scripts.

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

);

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
);

CREATE TABLE IF NOT EXISTS society_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  society_id INT NOT NULL UNIQUE,
  plan_name VARCHAR(50) NOT NULL DEFAULT 'starter',
  status ENUM('trial', 'active', 'past_due', 'cancelled') NOT NULL DEFAULT 'trial',
  billing_cycle ENUM('monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
  renewal_at DATETIME NULL,
  limits_json LONGTEXT NULL,
  provider_name VARCHAR(50) NOT NULL DEFAULT 'supabase',
  provider_subscription_id VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_society_subscriptions_society
    FOREIGN KEY (society_id) REFERENCES societies(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

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
);

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
);

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
  reset_otp_hash VARCHAR(255) NULL,
  reset_otp_expires_at DATETIME NULL,
  reset_otp_verified TINYINT(1) NOT NULL DEFAULT 0,
  reset_otp_attempts INT NOT NULL DEFAULT 0,
  society_id INT NULL,
  flat_id INT NULL,
  flat_number VARCHAR(50) NULL,
  deleted_at DATETIME NULL,
  deleted_by INT NULL,
  delete_reason VARCHAR(500) NULL,

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
);
  permanently_deleted_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS society_id INT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS flat_number VARCHAR(50) NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS flat_id INT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS original_email VARCHAR(150) NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_otp_hash VARCHAR(255) NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_otp_expires_at DATETIME NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_otp_verified TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_otp_attempts INT NOT NULL DEFAULT 0;


ALTER TABLE flats
ADD COLUMN IF NOT EXISTS tower_id INT NULL;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'active', 'rejected', 'inactive') NOT NULL DEFAULT 'pending';


ALTER TABLE flats
ADD COLUMN IF NOT EXISTS occupancy_status ENUM('vacant', 'owner_occupied', 'tenant_occupied', 'reserved', 'under_maintenance') NOT NULL DEFAULT 'vacant';
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_by INT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS delete_reason VARCHAR(500) NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS permanently_deleted_at DATETIME NULL;

ALTER TABLE users
MODIFY COLUMN role ENUM('super_admin', 'admin', 'secretary', 'resident', 'user', 'staff', 'security') NOT NULL DEFAULT 'resident';

UPDATE users
SET role = 'resident'
WHERE role = 'user';

ALTER TABLE users
MODIFY COLUMN role ENUM('super_admin', 'admin', 'secretary', 'resident', 'staff', 'security') NOT NULL DEFAULT 'resident';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS resident_type ENUM('owner', 'tenant') NULL;

ALTER TABLE users
ADD INDEX IF NOT EXISTS idx_users_society_flat (society_id, flat_id, resident_type, status);

ALTER TABLE users
ADD CONSTRAINT fk_users_society
  FOREIGN KEY (society_id) REFERENCES societies(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE users
ADD CONSTRAINT fk_users_deleted_by
  FOREIGN KEY (deleted_by) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE societies
ADD CONSTRAINT fk_societies_created_by
  FOREIGN KEY (created_by) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE societies
ADD CONSTRAINT fk_societies_primary_admin_user
  FOREIGN KEY (primary_admin_user_id) REFERENCES users(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS society_name VARCHAR(120) NULL;

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150) NULL;

ALTER TABLE societies
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30) NULL;

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS retention_rules (
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
);

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
  approval_status ENUM('pending', 'approved', 'manual_review', 'blocked', 'rejected') NOT NULL DEFAULT 'approved',
  security_id INT NOT NULL,
  qr_pass_id INT NULL,
  face_capture_url LONGTEXT NULL,
  face_signature VARCHAR(255) NULL,
  face_match_confidence DECIMAL(5, 2) NULL,
  blacklist_flag TINYINT(1) NOT NULL DEFAULT 0,
  otp_verified_at DATETIME NULL,
  check_in_method VARCHAR(30) NULL,
  check_out_method VARCHAR(30) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visitors_society_status_entry (society_id, status, entry_time),
  INDEX idx_visitors_status_entry (status, entry_time),
  INDEX idx_visitors_flat_entry (flat_id, entry_time),
  CONSTRAINT fk_visitors_security
    FOREIGN KEY (security_id) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS flat_id INT NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS preapproval_id INT NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS visitor_email VARCHAR(150) NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending', 'approved', 'manual_review', 'blocked', 'rejected') NOT NULL DEFAULT 'approved';

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS qr_pass_id INT NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS face_capture_url LONGTEXT NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS face_signature VARCHAR(255) NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS face_match_confidence DECIMAL(5, 2) NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS blacklist_flag TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS otp_verified_at DATETIME NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS check_in_method VARCHAR(30) NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS check_out_method VARCHAR(30) NULL;

ALTER TABLE visitors
ADD COLUMN IF NOT EXISTS society_id INT NULL;

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
    ON DELETE CASCADE ON UPDATE CASCADE
);

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
);

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
);

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
);

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
);

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS flats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  society_id INT NULL,
  building_name VARCHAR(120) NOT NULL,
  wing ENUM('A', 'B', 'C', 'D') NOT NULL DEFAULT 'A',
  flat_number VARCHAR(50) NOT NULL,
  floor VARCHAR(20) NULL,
  flat_type VARCHAR(50) NULL,
  status ENUM('vacant', 'occupied') NOT NULL DEFAULT 'vacant',
  approval_status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending',
  approved_by INT NULL,
  approved_at DATETIME NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_society_wing_flat (society_id, wing, flat_number),
  INDEX idx_flats_status (status),
  INDEX idx_flats_wing_approval (wing, approval_status),
  CONSTRAINT fk_flats_society
    FOREIGN KEY (society_id) REFERENCES societies(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_flats_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_flats_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE flats
ADD COLUMN IF NOT EXISTS society_id INT NULL;

ALTER TABLE flats
ADD COLUMN IF NOT EXISTS wing ENUM('A', 'B', 'C', 'D') NOT NULL DEFAULT 'A';

ALTER TABLE flats
ADD COLUMN IF NOT EXISTS approval_status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending';

ALTER TABLE flats
ADD COLUMN IF NOT EXISTS approved_by INT NULL;

ALTER TABLE flats
ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL;

ALTER TABLE flats
ADD COLUMN IF NOT EXISTS archived_at DATETIME NULL;

ALTER TABLE flats
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE users
ADD CONSTRAINT fk_users_flat
  FOREIGN KEY (flat_id) REFERENCES flats(id)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE visitor_preapprovals
ADD CONSTRAINT fk_preapprovals_flat
  FOREIGN KEY (flat_id) REFERENCES flats(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

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
);

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
);

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
);

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
);

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  thread_id INT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message_type ENUM('text', 'image', 'video', 'audio', 'file', 'pdf', 'system') NOT NULL DEFAULT 'text',
  message TEXT NOT NULL,
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
  INDEX idx_chats_thread_created (thread_id, created_at),
  INDEX idx_chats_sender_receiver_created (sender_id, receiver_id, created_at),
  INDEX idx_chats_receiver_sender_created (receiver_id, sender_id, created_at),
  FULLTEXT KEY ft_chats_text (message, media_name),
  CONSTRAINT fk_chats_thread
    FOREIGN KEY (thread_id) REFERENCES chat_threads(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_chats_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chats_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  society_id INT NULL,
  document_type VARCHAR(80) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_documents_society_status (society_id, status),
  INDEX idx_documents_user_status (user_id, status),
  CONSTRAINT fk_documents_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_documents_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NULL,
  entity_id INT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activity_logs_user_created (user_id, created_at),
  CONSTRAINT fk_activity_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS security_attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  security_user_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  check_in_at DATETIME NULL,
  check_out_at DATETIME NULL,
  status ENUM('checked_in', 'checked_out') NOT NULL DEFAULT 'checked_in',
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_security_attendance_user_date (security_user_id, attendance_date),
  INDEX idx_security_attendance_date (attendance_date),
  CONSTRAINT fk_security_attendance_user
    FOREIGN KEY (security_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS security_leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  security_user_id INT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_by INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_leave_user_status (security_user_id, status),
  CONSTRAINT fk_security_leave_user
    FOREIGN KEY (security_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_security_leave_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS security_holidays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  holiday_date DATE NOT NULL,
  description VARCHAR(500) NULL,
  is_optional TINYINT(1) NOT NULL DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_holiday_date (holiday_date),
  CONSTRAINT fk_security_holiday_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS security_shifts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  security_user_id INT NOT NULL,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  shift_type ENUM('morning', 'evening', 'night', 'general') NOT NULL DEFAULT 'general',
  status ENUM('scheduled', 'completed', 'missed') NOT NULL DEFAULT 'scheduled',
  notes VARCHAR(500) NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_shifts_user_date (security_user_id, shift_date),
  CONSTRAINT fk_security_shift_user
    FOREIGN KEY (security_user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_security_shift_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS security_deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flat_id INT NULL,
  delivery_type VARCHAR(100) NOT NULL,
  package_id VARCHAR(120) NULL,
  recipient_name VARCHAR(120) NULL,
  delivery_partner VARCHAR(120) NULL,
  status ENUM('pending', 'received', 'dispatched', 'returned') NOT NULL DEFAULT 'pending',
  notes VARCHAR(500) NULL,
  logged_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_security_deliveries_status_created (status, created_at),
  CONSTRAINT fk_security_delivery_flat
    FOREIGN KEY (flat_id) REFERENCES flats(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_security_delivery_logged_by
    FOREIGN KEY (logged_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS security_visitor_approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  visitor_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NULL,
  purpose VARCHAR(255) NOT NULL,
  flat_id INT NULL,
  expected_at DATETIME NULL,
  requested_by INT NULL,
  status ENUM('pending', 'approved', 'rejected', 'checked_in', 'checked_out') NOT NULL DEFAULT 'pending',
  decision_by INT NULL,
  decision_at DATETIME NULL,
  check_in_at DATETIME NULL,
  check_out_at DATETIME NULL,
  notes VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_visitor_status_created (status, created_at),
  CONSTRAINT fk_security_visitor_flat
    FOREIGN KEY (flat_id) REFERENCES flats(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_security_visitor_requested_by
    FOREIGN KEY (requested_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_security_visitor_decision_by
    FOREIGN KEY (decision_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS security_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_role ENUM('security', 'admin', 'secretary', 'staff', 'all') NOT NULL DEFAULT 'security',
  target_user_id INT NULL,
  title VARCHAR(200) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  related_type VARCHAR(80) NULL,
  related_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_notifications_target_read (target_role, is_read, created_at),
  CONSTRAINT fk_security_notifications_target_user
    FOREIGN KEY (target_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_role VARCHAR(30) NOT NULL DEFAULT 'all',
  target_user_id INT NULL,
  title VARCHAR(200) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  category ENUM('visitor_alert', 'payment_reminder', 'chat_message', 'emergency_alert', 'event_reminder', 'ai_alert', 'general') NOT NULL DEFAULT 'general',
  deep_link VARCHAR(255) NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  related_type VARCHAR(80) NULL,
  related_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_target_read (target_role, is_read, created_at),
  CONSTRAINT fk_notifications_target_user
    FOREIGN KEY (target_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_device_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  platform ENUM('web', 'android', 'ios') NOT NULL DEFAULT 'web',
  fcm_token VARCHAR(700) NOT NULL,
  device_id VARCHAR(120) NULL,
  app_version VARCHAR(40) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_seen_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_notification_device_token (fcm_token),
  INDEX idx_notification_tokens_user_active (user_id, platform, is_active),
  CONSTRAINT fk_notification_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_web_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  endpoint VARCHAR(1000) NOT NULL,
  p256dh VARCHAR(255) NOT NULL,
  auth VARCHAR(255) NOT NULL,
  expiration_time DATETIME NULL,
  user_agent VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_notification_web_subscription_endpoint (endpoint(255)),
  INDEX idx_notification_web_subscriptions_user_active (user_id, is_active),
  CONSTRAINT fk_notification_web_subscriptions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  target_role VARCHAR(30) NOT NULL DEFAULT 'all',
  target_user_id INT NULL,
  category ENUM('event_reminder', 'general') NOT NULL DEFAULT 'event_reminder',
  event_at DATETIME NOT NULL,
  remind_before_minutes INT NOT NULL DEFAULT 30,
  dispatched_at DATETIME NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notification_events_dispatch (dispatched_at, event_at),
  CONSTRAINT fk_notification_events_target_user
    FOREIGN KEY (target_user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_notification_events_created_by
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS security_emergency_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  triggered_by INT NOT NULL,
  alert_type ENUM('fire', 'medical', 'security', 'maintenance', 'other') NOT NULL DEFAULT 'other',
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'high',
  message VARCHAR(1200) NOT NULL,
  location VARCHAR(255) NULL,
  status ENUM('active', 'acknowledged', 'resolved') NOT NULL DEFAULT 'active',
  acknowledged_by INT NULL,
  acknowledged_at DATETIME NULL,
  resolved_by INT NULL,
  resolved_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_security_alerts_status_created (status, created_at),
  CONSTRAINT fk_security_alert_triggered_by
    FOREIGN KEY (triggered_by) REFERENCES users(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_security_alert_ack_by
    FOREIGN KEY (acknowledged_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_security_alert_resolved_by
    FOREIGN KEY (resolved_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
);
