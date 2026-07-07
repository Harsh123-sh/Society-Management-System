-- Full PostgreSQL schema synchronization for the current backend source.
-- This migration is intentionally additive and idempotent. It does not drop,
-- truncate, rename, or rewrite existing application data.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schema_sync_dummy_status') THEN
    CREATE TYPE schema_sync_dummy_status AS ENUM ('active', 'inactive');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visitor_approval_status') THEN
    CREATE TYPE visitor_approval_status AS ENUM ('pending', 'approved', 'manual_review', 'blocked', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visitor_status') THEN
    CREATE TYPE visitor_status AS ENUM ('pending', 'pending_approval', 'approved', 'checked_in', 'in_premises', 'checked_out', 'exited', 'rejected', 'cancelled', 'visited');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_thread_type') THEN
    CREATE TYPE chat_thread_type AS ENUM ('direct', 'group', 'channel');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_message_type') THEN
    CREATE TYPE chat_message_type AS ENUM ('text', 'image', 'video', 'audio', 'file', 'pdf', 'system');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_status') THEN
    CREATE TYPE billing_status AS ENUM ('draft', 'pending', 'active', 'unpaid', 'overdue', 'paid', 'partially_paid', 'cancelled', 'failed', 'refunded');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.__schema_sync_add_fk(
  p_table text,
  p_constraint text,
  p_columns text,
  p_ref_table text,
  p_ref_columns text,
  p_on_delete text DEFAULT 'SET NULL'
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF to_regclass('public.' || p_table) IS NULL OR to_regclass('public.' || p_ref_table) IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = p_constraint
      AND conrelid = to_regclass('public.' || p_table)
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%s) REFERENCES public.%I(%s) ON DELETE %s ON UPDATE CASCADE NOT VALID',
      p_table,
      p_constraint,
      p_columns,
      p_ref_table,
      p_ref_columns,
      p_on_delete
    );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN invalid_foreign_key THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.__schema_sync_add_check(
  p_table text,
  p_constraint text,
  p_expression text
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF to_regclass('public.' || p_table) IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = p_constraint
      AND conrelid = to_regclass('public.' || p_table)
  ) THEN
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s) NOT VALID',
      p_table,
      p_constraint,
      p_expression
    );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS builders (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(150),
  slug VARCHAR(100),
  logo_url VARCHAR(500),
  website VARCHAR(200),
  status VARCHAR(50) DEFAULT 'trial',
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  max_societies INT DEFAULT 10,
  max_users INT DEFAULT 1000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS societies (
  id SERIAL PRIMARY KEY,
  builder_id INT,
  code VARCHAR(80),
  slug VARCHAR(120),
  subdomain VARCHAR(120),
  name VARCHAR(200),
  society_name VARCHAR(200),
  registration_number VARCHAR(120),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  contact_email VARCHAR(150),
  contact_phone VARCHAR(50),
  office_timing VARCHAR(120),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  subscription_tier VARCHAR(50) DEFAULT 'starter',
  default_language VARCHAR(20) NOT NULL DEFAULT 'en',
  primary_admin_user_id INT,
  created_by INT,
  configured_at TIMESTAMP,
  theme_primary VARCHAR(20) DEFAULT '#1e40af',
  theme_secondary VARCHAR(20) DEFAULT '#64748b',
  theme_accent VARCHAR(20) DEFAULT '#0ea5e9',
  theme_background VARCHAR(20) DEFAULT '#ffffff',
  theme_card VARCHAR(20) DEFAULT '#f9fafb',
  theme_mode VARCHAR(20) DEFAULT 'auto',
  theme_gradient_style VARCHAR(100) DEFAULT 'linear',
  logo_url VARCHAR(500),
  logo_dark_url VARCHAR(500),
  brand_name VARCHAR(120),
  font_family VARCHAR(100) DEFAULT 'Inter',
  sidebar_style VARCHAR(50) DEFAULT 'default',
  button_style VARCHAR(50) DEFAULT 'rounded',
  accent_radius VARCHAR(50) DEFAULT 'medium',
  theme_preset VARCHAR(50),
  custom_css TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  full_name VARCHAR(200),
  email VARCHAR(150),
  original_email VARCHAR(255),
  password VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  address TEXT,
  role VARCHAR(50) NOT NULL DEFAULT 'resident',
  resident_type VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  approval_status VARCHAR(50) DEFAULT 'approved',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  society_id INT,
  builder_id INT,
  flat_id INT,
  flat_number VARCHAR(50),
  designation VARCHAR(120),
  department VARCHAR(120),
  reset_otp VARCHAR(20),
  reset_otp_hash VARCHAR(255),
  reset_otp_expires_at TIMESTAMP,
  reset_otp_verified BOOLEAN NOT NULL DEFAULT false,
  reset_otp_attempts INT NOT NULL DEFAULT 0,
  email_otp VARCHAR(20),
  otp_expires_at TIMESTAMP,
  otp_attempts INT NOT NULL DEFAULT 0,
  last_otp_sent_at TIMESTAMP,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMP,
  approved_by INT,
  approved_at TIMESTAMP,
  approval_rejected_reason TEXT,
  kyc_status VARCHAR(50),
  kyc_document_url VARCHAR(500),
  kyc_document_type VARCHAR(80),
  kyc_verified_by INT,
  kyc_verified_at TIMESTAMP,
  kyc_reviewed_by INT,
  kyc_reviewed_at TIMESTAMP,
  profile_photo_url VARCHAR(500),
  family_members JSONB,
  last_login TIMESTAMP,
  deleted_at TIMESTAMP,
  deleted_by INT,
  delete_reason TEXT,
  permanently_deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS towers (
  id SERIAL PRIMARY KEY,
  society_id INT,
  builder_id INT,
  name VARCHAR(120),
  code VARCHAR(80),
  tower_name VARCHAR(120),
  tower_code VARCHAR(80),
  total_floors INT DEFAULT 1,
  flats_per_floor INT DEFAULT 1,
  flat_number_format VARCHAR(80) DEFAULT 'floor_sequence',
  starting_floor INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wings (
  id SERIAL PRIMARY KEY,
  society_id INT,
  builder_id INT,
  tower_id INT,
  name VARCHAR(120),
  code VARCHAR(80),
  structure_type VARCHAR(50) DEFAULT 'wing',
  total_floors INT DEFAULT 0,
  units_per_floor INT DEFAULT 0,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  society_id INT,
  builder_id INT,
  tower_id INT,
  name VARCHAR(120),
  code VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS floors (
  id SERIAL PRIMARY KEY,
  society_id INT,
  builder_id INT,
  tower_id INT,
  floor_number INT,
  floor_name VARCHAR(120),
  total_units INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flats (
  id SERIAL PRIMARY KEY,
  society_id INT,
  builder_id INT,
  tower_id INT,
  wing_id INT,
  building_name VARCHAR(120),
  wing VARCHAR(100),
  flat_number VARCHAR(50),
  floor VARCHAR(50),
  block VARCHAR(50),
  flat_type VARCHAR(80),
  status VARCHAR(50) DEFAULT 'available',
  occupancy_status VARCHAR(50) DEFAULT 'vacant',
  approval_status VARCHAR(50) DEFAULT 'approved',
  approved_by INT,
  approved_at TIMESTAMP,
  resident_id INT,
  area_sqft NUMERIC(12,2),
  created_by INT,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE builders
  ADD COLUMN IF NOT EXISTS name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS website VARCHAR(200),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS max_societies INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS max_users INT DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE societies
  ADD COLUMN IF NOT EXISTS builder_id INT,
  ADD COLUMN IF NOT EXISTS code VARCHAR(80),
  ADD COLUMN IF NOT EXISTS slug VARCHAR(120),
  ADD COLUMN IF NOT EXISTS subdomain VARCHAR(120),
  ADD COLUMN IF NOT EXISTS name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS society_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS registration_number VARCHAR(120),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pincode VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS office_timing VARCHAR(120),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS default_language VARCHAR(20) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS primary_admin_user_id INT,
  ADD COLUMN IF NOT EXISTS created_by INT,
  ADD COLUMN IF NOT EXISTS configured_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS theme_primary VARCHAR(20) DEFAULT '#1e40af',
  ADD COLUMN IF NOT EXISTS theme_secondary VARCHAR(20) DEFAULT '#64748b',
  ADD COLUMN IF NOT EXISTS theme_accent VARCHAR(20) DEFAULT '#0ea5e9',
  ADD COLUMN IF NOT EXISTS theme_background VARCHAR(20) DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS theme_card VARCHAR(20) DEFAULT '#f9fafb',
  ADD COLUMN IF NOT EXISTS theme_mode VARCHAR(20) DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS theme_gradient_style VARCHAR(100) DEFAULT 'linear',
  ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS logo_dark_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS brand_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS sidebar_style VARCHAR(50) DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS button_style VARCHAR(50) DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS accent_radius VARCHAR(50) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS theme_preset VARCHAR(50),
  ADD COLUMN IF NOT EXISTS custom_css TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS original_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS mobile VARCHAR(50),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'resident',
  ADD COLUMN IF NOT EXISTS resident_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS builder_id INT,
  ADD COLUMN IF NOT EXISTS flat_id INT,
  ADD COLUMN IF NOT EXISTS flat_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS designation VARCHAR(120),
  ADD COLUMN IF NOT EXISTS department VARCHAR(120),
  ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(20),
  ADD COLUMN IF NOT EXISTS reset_otp_hash VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS reset_otp_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reset_otp_attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_otp VARCHAR(20),
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS otp_attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS approved_by INT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS approval_rejected_reason TEXT,
  ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS kyc_document_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS kyc_document_type VARCHAR(80),
  ADD COLUMN IF NOT EXISTS kyc_verified_by INT,
  ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_by INT,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS family_members JSONB,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INT,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT,
  ADD COLUMN IF NOT EXISTS permanently_deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE towers
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS builder_id INT,
  ADD COLUMN IF NOT EXISTS name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS code VARCHAR(80),
  ADD COLUMN IF NOT EXISTS tower_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS tower_code VARCHAR(80),
  ADD COLUMN IF NOT EXISTS total_floors INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS flats_per_floor INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS flat_number_format VARCHAR(80) DEFAULT 'floor_sequence',
  ADD COLUMN IF NOT EXISTS starting_floor INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_by INT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE wings
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS builder_id INT,
  ADD COLUMN IF NOT EXISTS tower_id INT,
  ADD COLUMN IF NOT EXISTS name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS code VARCHAR(80),
  ADD COLUMN IF NOT EXISTS structure_type VARCHAR(50) DEFAULT 'wing',
  ADD COLUMN IF NOT EXISTS total_floors INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS units_per_floor INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_by INT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE flats
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS builder_id INT,
  ADD COLUMN IF NOT EXISTS tower_id INT,
  ADD COLUMN IF NOT EXISTS wing_id INT,
  ADD COLUMN IF NOT EXISTS building_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS wing VARCHAR(100),
  ADD COLUMN IF NOT EXISTS flat_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS floor VARCHAR(50),
  ADD COLUMN IF NOT EXISTS block VARCHAR(50),
  ADD COLUMN IF NOT EXISTS flat_type VARCHAR(80),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS occupancy_status VARCHAR(50) DEFAULT 'vacant',
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_by INT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS resident_id INT,
  ADD COLUMN IF NOT EXISTS area_sqft NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS created_by INT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS society_brandings (
  society_id INT PRIMARY KEY,
  logo_url VARCHAR(500),
  favicon_url VARCHAR(500),
  primary_color VARCHAR(50) DEFAULT '#0f766e',
  secondary_color VARCHAR(50) DEFAULT '#2563eb',
  accent_color VARCHAR(50) DEFAULT '#14b8a6',
  font_family VARCHAR(100) DEFAULT 'Inter',
  theme_json JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS society_settings (
  society_id INT PRIMARY KEY,
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  locale VARCHAR(20) DEFAULT 'en',
  currency_code VARCHAR(20) DEFAULT 'INR',
  modules_json JSONB,
  permissions_json JSONB,
  feature_flags_json JSONB,
  personalization_json JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS society_subscriptions (
  id SERIAL PRIMARY KEY,
  society_id INT,
  plan_name VARCHAR(50) DEFAULT 'starter',
  status VARCHAR(50) DEFAULT 'trial',
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  renewal_at TIMESTAMP,
  limits_json JSONB,
  provider_name VARCHAR(100),
  provider_subscription_id VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS society_modules (
  id SERIAL PRIMARY KEY,
  society_id INT NOT NULL,
  module_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  config_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS society_analytics (
  id SERIAL PRIMARY KEY,
  society_id INT NOT NULL,
  metric_date DATE NOT NULL,
  metrics_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_approvals (
  id SERIAL PRIMARY KEY,
  user_id INT,
  society_id INT,
  approval_type VARCHAR(100),
  requested_by INT,
  approved_by INT,
  rejected_by INT,
  status VARCHAR(50) DEFAULT 'pending',
  reason TEXT,
  details JSONB,
  approval_comments TEXT,
  rejection_reason TEXT,
  documents_json JSONB,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_approvals
  ADD COLUMN IF NOT EXISTS user_id INT,
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS approval_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS requested_by INT,
  ADD COLUMN IF NOT EXISTS approved_by INT,
  ADD COLUMN IF NOT EXISTS rejected_by INT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB,
  ADD COLUMN IF NOT EXISTS approval_comments TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS documents_json JSONB,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS owner_properties (
  id SERIAL PRIMARY KEY,
  user_id INT,
  flat_id INT,
  living_start_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flat_residents (
  id SERIAL PRIMARY KEY,
  flat_id INT,
  resident_id INT,
  move_in_date DATE DEFAULT CURRENT_DATE,
  move_out_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bills (
  id SERIAL PRIMARY KEY,
  society_id INT,
  builder_id INT,
  user_id INT,
  resident_id INT,
  flat_id INT,
  template_id INT,
  amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  late_fee_amount NUMERIC(12,2) DEFAULT 0,
  late_fee_applied_at TIMESTAMP,
  grace_period_days INT DEFAULT 0,
  late_fee_fixed_amount NUMERIC(12,2) DEFAULT 0,
  late_fee_percentage NUMERIC(6,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  bill_type VARCHAR(50) DEFAULT 'maintenance',
  invoice_number VARCHAR(120),
  title VARCHAR(255),
  description TEXT,
  billing_month DATE,
  bill_date TIMESTAMP,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  paid_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(100),
  payment_attempts INT DEFAULT 0,
  reminder_count INT DEFAULT 0,
  last_reminder_at TIMESTAMP,
  invoice_pdf_url VARCHAR(500),
  gateway_provider VARCHAR(80),
  gateway_order_id VARCHAR(160),
  gateway_payment_id VARCHAR(160),
  upi_reference VARCHAR(160),
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS builder_id INT,
  ADD COLUMN IF NOT EXISTS user_id INT,
  ADD COLUMN IF NOT EXISTS resident_id INT,
  ADD COLUMN IF NOT EXISTS flat_id INT,
  ADD COLUMN IF NOT EXISTS template_id INT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_applied_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS grace_period_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_fixed_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_percentage NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS bill_type VARCHAR(50) DEFAULT 'maintenance',
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(120),
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS billing_month DATE,
  ADD COLUMN IF NOT EXISTS bill_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS paid_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reminder_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS gateway_provider VARCHAR(80),
  ADD COLUMN IF NOT EXISTS gateway_order_id VARCHAR(160),
  ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(160),
  ADD COLUMN IF NOT EXISTS upi_reference VARCHAR(160),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_by INT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS bill_templates (
  id SERIAL PRIMARY KEY,
  society_id INT,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  bill_type VARCHAR(50) NOT NULL DEFAULT 'maintenance',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  billing_period VARCHAR(30) NOT NULL DEFAULT 'monthly',
  grace_period_days INT NOT NULL DEFAULT 0,
  late_fee_fixed_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  late_fee_percentage NUMERIC(6,2) NOT NULL DEFAULT 0,
  target_type VARCHAR(30) NOT NULL DEFAULT 'society',
  target_value_json JSONB,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill_charges (
  id SERIAL PRIMARY KEY,
  bill_id INT,
  charge_name VARCHAR(200),
  charge_type VARCHAR(50) DEFAULT 'misc',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill_payments (
  id SERIAL PRIMARY KEY,
  bill_id INT,
  resident_id INT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(100),
  transaction_id VARCHAR(200),
  reference_number VARCHAR(160),
  receipt_url VARCHAR(500),
  gateway_provider VARCHAR(80),
  gateway_order_id VARCHAR(160),
  gateway_payment_id VARCHAR(200),
  gateway_signature VARCHAR(255),
  upi_id VARCHAR(120),
  upi_reference VARCHAR(160),
  status VARCHAR(50) DEFAULT 'pending',
  details JSONB,
  metadata_json JSONB,
  notes TEXT,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bill_payments
  ADD COLUMN IF NOT EXISTS bill_id INT,
  ADD COLUMN IF NOT EXISTS resident_id INT,
  ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
  ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(200),
  ADD COLUMN IF NOT EXISTS reference_number VARCHAR(160),
  ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS gateway_provider VARCHAR(80),
  ADD COLUMN IF NOT EXISTS gateway_order_id VARCHAR(160),
  ADD COLUMN IF NOT EXISTS gateway_payment_id VARCHAR(200),
  ADD COLUMN IF NOT EXISTS gateway_signature VARCHAR(255),
  ADD COLUMN IF NOT EXISTS upi_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS upi_reference VARCHAR(160),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS details JSONB,
  ADD COLUMN IF NOT EXISTS metadata_json JSONB,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS bill_reminders (
  id SERIAL PRIMARY KEY,
  bill_id INT,
  resident_id INT,
  reminder_type VARCHAR(50),
  channel VARCHAR(50) DEFAULT 'in_app',
  message TEXT,
  status VARCHAR(50) DEFAULT 'queued',
  sent_at TIMESTAMP,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  resident_id INT,
  society_id INT,
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50),
  assigned_to INT,
  updated_by INT,
  resolved_at TIMESTAMP,
  archived_at TIMESTAMP,
  archived_by INT,
  archived_from_status VARCHAR(50),
  deleted_at TIMESTAMP,
  deleted_by INT,
  deletion_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS resident_id INT,
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
  ADD COLUMN IF NOT EXISTS assigned_to INT,
  ADD COLUMN IF NOT EXISTS updated_by INT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_by INT,
  ADD COLUMN IF NOT EXISTS archived_from_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INT,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS complaint_comments (
  id SERIAL PRIMARY KEY,
  complaint_id INT,
  user_id INT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  society_id INT,
  title VARCHAR(255),
  message TEXT,
  status VARCHAR(50) DEFAULT 'active',
  expires_at TIMESTAMP,
  archived_at TIMESTAMP,
  archived_by INT,
  archived_from_status VARCHAR(50),
  deleted_at TIMESTAMP,
  deleted_by INT,
  deletion_reason TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notices
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS title VARCHAR(255),
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_by INT,
  ADD COLUMN IF NOT EXISTS archived_from_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INT,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_by INT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  user_id INT,
  society_id INT,
  document_type VARCHAR(80),
  file_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  reviewed_by INT,
  reviewed_at TIMESTAMP,
  version INT NOT NULL DEFAULT 1,
  deleted_at TIMESTAMP,
  deleted_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS user_id INT,
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS document_type VARCHAR(80),
  ADD COLUMN IF NOT EXISTS file_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by INT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS visitors (
  id SERIAL PRIMARY KEY,
  society_id INT,
  flat_id INT,
  resident_id INT,
  security_id INT,
  preapproval_id INT,
  qr_pass_id INT,
  name VARCHAR(200),
  visitor_name VARCHAR(200),
  visitor_email VARCHAR(180),
  phone VARCHAR(50),
  purpose VARCHAR(255),
  person_to_meet VARCHAR(150),
  vehicle_number VARCHAR(80),
  visitor_type VARCHAR(50) DEFAULT 'guest',
  visit_date DATE,
  visit_time TIME,
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  approval_status VARCHAR(50) DEFAULT 'approved',
  photo_url TEXT,
  face_capture_url TEXT,
  face_signature VARCHAR(255),
  face_match_confidence NUMERIC(8,2),
  blacklist_flag BOOLEAN NOT NULL DEFAULT false,
  otp_verified_at TIMESTAMP,
  check_in_method VARCHAR(50),
  check_out_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE visitors
  ADD COLUMN IF NOT EXISTS society_id INT,
  ADD COLUMN IF NOT EXISTS flat_id INT,
  ADD COLUMN IF NOT EXISTS resident_id INT,
  ADD COLUMN IF NOT EXISTS security_id INT,
  ADD COLUMN IF NOT EXISTS preapproval_id INT,
  ADD COLUMN IF NOT EXISTS qr_pass_id INT,
  ADD COLUMN IF NOT EXISTS name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS visitor_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS visitor_email VARCHAR(180),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS purpose VARCHAR(255),
  ADD COLUMN IF NOT EXISTS person_to_meet VARCHAR(150),
  ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(80),
  ADD COLUMN IF NOT EXISTS visitor_type VARCHAR(50) DEFAULT 'guest',
  ADD COLUMN IF NOT EXISTS visit_date DATE,
  ADD COLUMN IF NOT EXISTS visit_time TIME,
  ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS face_capture_url TEXT,
  ADD COLUMN IF NOT EXISTS face_signature VARCHAR(255),
  ADD COLUMN IF NOT EXISTS face_match_confidence NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS blacklist_flag BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS otp_verified_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS check_in_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS check_out_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS visitor_entries (
  id SERIAL PRIMARY KEY,
  visitor_id VARCHAR(40) UNIQUE,
  society_id INT,
  guard_id INT,
  flat_id INT,
  resident_id INT,
  visitor_name VARCHAR(150),
  phone VARCHAR(40),
  gender VARCHAR(30),
  purpose VARCHAR(200),
  visitor_count INT DEFAULT 1,
  resident_name VARCHAR(150),
  resident_phone VARCHAR(40),
  visitor_email VARCHAR(180),
  photo_url TEXT,
  status VARCHAR(40) DEFAULT 'pending_approval',
  approval_status VARCHAR(40) DEFAULT 'pending',
  check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  check_out_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resident_approvals (
  id SERIAL PRIMARY KEY,
  visitor_entry_id INT,
  resident_id INT,
  society_id INT,
  guard_id INT,
  status VARCHAR(40) DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS visitor_preapprovals (
  id SERIAL PRIMARY KEY,
  owner_id INT,
  flat_id INT,
  visitor_name VARCHAR(150),
  phone VARCHAR(50),
  purpose VARCHAR(255),
  visit_date DATE,
  expected_arrival_time TIMESTAMP,
  vehicle_number VARCHAR(80),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'approved',
  approved_at TIMESTAMP,
  approval_token VARCHAR(120),
  resident_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE visitor_preapprovals
  ADD COLUMN IF NOT EXISTS owner_id INT,
  ADD COLUMN IF NOT EXISTS flat_id INT,
  ADD COLUMN IF NOT EXISTS visitor_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS purpose VARCHAR(255),
  ADD COLUMN IF NOT EXISTS visit_date DATE,
  ADD COLUMN IF NOT EXISTS expected_arrival_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(80),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS approval_token VARCHAR(120),
  ADD COLUMN IF NOT EXISTS resident_notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS visitor_qr_passes (
  id SERIAL PRIMARY KEY,
  preapproval_id INT,
  qr_code TEXT,
  pass_token VARCHAR(160),
  status VARCHAR(50) DEFAULT 'active',
  expires_at TIMESTAMP,
  issued_by INT,
  scanned_by INT,
  scanned_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_otps (
  id SERIAL PRIMARY KEY,
  preapproval_id INT,
  otp_hash VARCHAR(255),
  purpose VARCHAR(80),
  expires_at TIMESTAMP,
  used_at TIMESTAMP,
  issued_by INT,
  verified_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_face_profiles (
  id SERIAL PRIMARY KEY,
  preapproval_id INT,
  visitor_name VARCHAR(150),
  phone VARCHAR(50),
  flat_id INT,
  face_capture_url TEXT,
  face_signature VARCHAR(255),
  face_match_confidence NUMERIC(8,2),
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_blacklist_entries (
  id SERIAL PRIMARY KEY,
  visitor_name VARCHAR(150),
  phone VARCHAR(50),
  flat_id INT,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'active',
  blocked_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_vehicle_entries (
  id SERIAL PRIMARY KEY,
  visitor_id INT,
  preapproval_id INT,
  vehicle_number VARCHAR(80),
  vehicle_type VARCHAR(80),
  owner_name VARCHAR(150),
  flat_id INT,
  entry_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'inside',
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_delivery_entries (
  id SERIAL PRIMARY KEY,
  visitor_id INT,
  delivery_type VARCHAR(100),
  package_id VARCHAR(120),
  recipient_name VARCHAR(150),
  delivery_partner VARCHAR(150),
  flat_id INT,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visitor_emergency_alerts (
  id SERIAL PRIMARY KEY,
  triggered_by INT,
  alert_type VARCHAR(50) DEFAULT 'security',
  severity VARCHAR(50) DEFAULT 'high',
  message TEXT,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  society_id INT,
  acknowledged_by INT,
  acknowledged_at TIMESTAMP,
  resolved_by INT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_threads (
  id SERIAL PRIMARY KEY,
  society_id INT,
  thread_type VARCHAR(50) NOT NULL DEFAULT 'direct',
  title VARCHAR(200),
  description TEXT,
  avatar_url VARCHAR(500),
  created_by INT,
  last_message_at TIMESTAMP,
  pinned_message_id INT,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_thread_members (
  id SERIAL PRIMARY KEY,
  thread_id INT,
  user_id INT,
  member_role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  muted_until TIMESTAMP,
  last_read_message_id INT,
  last_delivered_message_id INT
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  thread_id INT,
  sender_id INT,
  receiver_id INT,
  message_type VARCHAR(50) DEFAULT 'text',
  message TEXT,
  media_url VARCHAR(500),
  media_name VARCHAR(255),
  media_size INT,
  mime_type VARCHAR(120),
  thumbnail_url VARCHAR(500),
  reply_to_message_id INT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_by INT,
  pinned_at TIMESTAMP,
  metadata_json JSONB,
  deleted_for_sender BOOLEAN NOT NULL DEFAULT false,
  deleted_for_receiver BOOLEAN NOT NULL DEFAULT false,
  deleted_for_all BOOLEAN NOT NULL DEFAULT false,
  deleted_for_all_by INT,
  deleted_for_all_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_message_receipts (
  id SERIAL PRIMARY KEY,
  message_id INT,
  user_id INT,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INT,
  user_id INT,
  reaction VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  thread_id INT,
  sender_id INT,
  receiver_id INT,
  user_id INT,
  message_type VARCHAR(50) DEFAULT 'text',
  message TEXT,
  media_url VARCHAR(500),
  media_name VARCHAR(255),
  media_size INT,
  mime_type VARCHAR(120),
  thumbnail_url VARCHAR(500),
  reply_to_message_id INT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  pinned_by INT,
  pinned_at TIMESTAMP,
  metadata_json JSONB,
  deleted_for_sender BOOLEAN NOT NULL DEFAULT false,
  deleted_for_receiver BOOLEAN NOT NULL DEFAULT false,
  deleted_for_all BOOLEAN NOT NULL DEFAULT false,
  deleted_for_all_by INT,
  deleted_for_all_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  target_role VARCHAR(80) DEFAULT 'all',
  target_user_id INT,
  title VARCHAR(250),
  message TEXT,
  priority VARCHAR(50) DEFAULT 'medium',
  category VARCHAR(100) DEFAULT 'general',
  deep_link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(50) DEFAULT 'unread',
  data JSONB,
  related_type VARCHAR(100),
  related_id INT,
  created_by INT,
  archived_by INT,
  archived_at TIMESTAMP,
  archived_from_status VARCHAR(50),
  deleted_at TIMESTAMP,
  deleted_by INT,
  deletion_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS target_role VARCHAR(80) DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS target_user_id INT,
  ADD COLUMN IF NOT EXISTS title VARCHAR(250),
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS deep_link TEXT,
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'unread',
  ADD COLUMN IF NOT EXISTS data JSONB,
  ADD COLUMN IF NOT EXISTS related_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS related_id INT,
  ADD COLUMN IF NOT EXISTS created_by INT,
  ADD COLUMN IF NOT EXISTS archived_by INT,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS archived_from_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INT,
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS notification_device_tokens (
  id SERIAL PRIMARY KEY,
  user_id INT,
  platform VARCHAR(30) DEFAULT 'web',
  fcm_token VARCHAR(700),
  device_id VARCHAR(120),
  app_version VARCHAR(40),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_web_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT,
  endpoint VARCHAR(1000),
  p256dh VARCHAR(255),
  auth VARCHAR(255),
  expiration_time TIMESTAMP,
  user_agent VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(180),
  message TEXT,
  target_role VARCHAR(80) DEFAULT 'all',
  target_user_id INT,
  category VARCHAR(100) DEFAULT 'event_reminder',
  event_at TIMESTAMP,
  remind_before_minutes INT DEFAULT 30,
  dispatched_at TIMESTAMP,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(150),
  entity_type VARCHAR(100),
  entity_id INT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(150),
  resource_type VARCHAR(100),
  resource_id INT,
  entity_type VARCHAR(100),
  entity_id INT,
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

CREATE TABLE IF NOT EXISTS retention_rules (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(80) UNIQUE,
  retention_days INT NOT NULL DEFAULT 365,
  archive_after_days INT NOT NULL DEFAULT 30,
  auto_archive_enabled BOOLEAN NOT NULL DEFAULT true,
  allow_permanent_delete BOOLEAN NOT NULL DEFAULT false,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150),
  price NUMERIC(12,2) DEFAULT 0,
  stock INT DEFAULT 0,
  category VARCHAR(100),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_otps (
  id SERIAL PRIMARY KEY,
  user_id INT,
  email VARCHAR(255),
  otp_hash VARCHAR(255),
  purpose VARCHAR(80),
  expires_at TIMESTAMP,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT,
  phone VARCHAR(50),
  alternate_phone VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(40),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  document_type VARCHAR(80),
  document_number VARCHAR(120),
  document_url VARCHAR(500),
  document_verified_by INT,
  document_verified_at TIMESTAMP,
  rent_agreement_url VARCHAR(500),
  ownership_document_url VARCHAR(500),
  id_proof_url VARCHAR(500),
  profile_photo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demo_data_markers (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(80),
  entity_id INT,
  society_id INT,
  is_demo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_theme_generations (
  id SERIAL PRIMARY KEY,
  society_id INT,
  request_prompt TEXT,
  generated_theme_json JSONB,
  status VARCHAR(50) DEFAULT 'archived',
  generated_by INT,
  applied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_chats (
  id SERIAL PRIMARY KEY,
  user_id INT,
  society_id INT,
  chat_type VARCHAR(80) DEFAULT 'general',
  query TEXT,
  response TEXT,
  model_name VARCHAR(80),
  tokens_used INT,
  response_time_ms INT,
  ai_permissions_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parking_slots (
  id SERIAL PRIMARY KEY,
  society_id INT,
  flat_id INT,
  owner_id INT,
  wing VARCHAR(100),
  floor VARCHAR(50),
  block VARCHAR(50),
  slot_number VARCHAR(100),
  type VARCHAR(50) DEFAULT 'available',
  status VARCHAR(50) DEFAULT 'available',
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  builder_id INT,
  society_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  resource VARCHAR(120) NOT NULL,
  action VARCHAR(120) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INT,
  permission_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INT,
  role_id INT,
  society_id INT,
  builder_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  resource_type VARCHAR(80),
  resource_id INT,
  booked_by INT,
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  purpose TEXT,
  number_of_guests INT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_by INT,
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id SERIAL PRIMARY KEY,
  staff_user_id INT,
  society_id INT,
  attendance_date DATE,
  status VARCHAR(32) NOT NULL DEFAULT 'absent',
  check_in_at TIMESTAMPTZ,
  break_start_at TIMESTAMPTZ,
  break_end_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  working_minutes INT NOT NULL DEFAULT 0,
  break_minutes INT NOT NULL DEFAULT 0,
  overtime_minutes INT NOT NULL DEFAULT 0,
  notes TEXT,
  location TEXT,
  approval_status VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_attendance_requests (
  id SERIAL PRIMARY KEY,
  staff_user_id INT,
  society_id INT,
  attendance_date DATE,
  request_type VARCHAR(32),
  reason TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  reviewed_by INT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_attendance_special_days (
  id SERIAL PRIMARY KEY,
  society_id INT,
  special_date DATE,
  day_type VARCHAR(32),
  title TEXT,
  configured_by INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_security_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT,
  society_id INT,
  staff_role VARCHAR(80),
  department VARCHAR(80),
  employment_type VARCHAR(32) NOT NULL DEFAULT 'permanent',
  assigned_gate VARCHAR(80),
  assigned_area VARCHAR(120),
  shift_time VARCHAR(80),
  joining_date DATE,
  attendance_status VARCHAR(32),
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  mobile VARCHAR(40),
  approved_by VARCHAR(120),
  notes TEXT,
  created_by INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_alerts (
  id SERIAL PRIMARY KEY,
  society_id INT,
  message TEXT,
  alert_type VARCHAR(50),
  severity VARCHAR(50),
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_attendance (
  id SERIAL PRIMARY KEY,
  security_user_id INT,
  attendance_date DATE,
  check_in_at TIMESTAMP,
  check_out_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'checked_in',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_leave_requests (
  id SERIAL PRIMARY KEY,
  security_user_id INT,
  from_date DATE,
  to_date DATE,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_by INT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_holidays (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150),
  holiday_date DATE,
  description TEXT,
  is_optional BOOLEAN DEFAULT false,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_shifts (
  id SERIAL PRIMARY KEY,
  security_user_id INT,
  shift_date DATE,
  start_time TIME,
  end_time TIME,
  shift_type VARCHAR(50) DEFAULT 'general',
  status VARCHAR(50) DEFAULT 'scheduled',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_deliveries (
  id SERIAL PRIMARY KEY,
  flat_id INT,
  delivery_type VARCHAR(100),
  package_id VARCHAR(120),
  recipient_name VARCHAR(120),
  delivery_partner VARCHAR(120),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  logged_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_vehicle_entries (
  id SERIAL PRIMARY KEY,
  flat_id INT,
  vehicle_number VARCHAR(80),
  vehicle_type VARCHAR(80),
  owner_name VARCHAR(150),
  status VARCHAR(50) DEFAULT 'inside',
  logged_by INT,
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  exit_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_visitor_approvals (
  id SERIAL PRIMARY KEY,
  visitor_name VARCHAR(150),
  phone VARCHAR(50),
  purpose VARCHAR(255),
  flat_id INT,
  expected_at TIMESTAMP,
  requested_by INT,
  status VARCHAR(50) DEFAULT 'pending',
  decision_by INT,
  decision_at TIMESTAMP,
  check_in_at TIMESTAMP,
  check_out_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_notifications (
  id SERIAL PRIMARY KEY,
  target_role VARCHAR(80) DEFAULT 'security',
  target_user_id INT,
  title VARCHAR(200),
  message TEXT,
  priority VARCHAR(50) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  related_type VARCHAR(80),
  related_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_emergency_alerts (
  id SERIAL PRIMARY KEY,
  triggered_by INT,
  alert_type VARCHAR(50) DEFAULT 'other',
  severity VARCHAR(50) DEFAULT 'high',
  message TEXT,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  acknowledged_by INT,
  acknowledged_at TIMESTAMP,
  resolved_by INT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO retention_rules (resource_type, retention_days, archive_after_days, auto_archive_enabled, allow_permanent_delete)
VALUES
  ('complaints', 365, 30, true, false),
  ('notices', 365, 30, true, false)
ON CONFLICT (resource_type) DO NOTHING;

CREATE OR REPLACE FUNCTION datediff(ts1 TIMESTAMP, ts2 TIMESTAMP)
RETURNS INT
LANGUAGE SQL
AS $$
SELECT CAST(EXTRACT(EPOCH FROM (ts1 - ts2))/86400 AS INT);
$$;

CREATE INDEX IF NOT EXISTS idx_users_society_id ON users(society_id);
CREATE INDEX IF NOT EXISTS idx_users_builder_id ON users(builder_id);
CREATE INDEX IF NOT EXISTS idx_users_flat_id ON users(flat_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_societies_builder_status ON societies(builder_id, status);
CREATE INDEX IF NOT EXISTS idx_towers_society_builder ON towers(society_id, builder_id);
CREATE INDEX IF NOT EXISTS idx_wings_society_tower ON wings(society_id, tower_id);
CREATE INDEX IF NOT EXISTS idx_flats_society_wing ON flats(society_id, wing_id);
CREATE INDEX IF NOT EXISTS idx_flats_tower_id ON flats(tower_id);
CREATE INDEX IF NOT EXISTS idx_flats_status ON flats(status, occupancy_status);
CREATE INDEX IF NOT EXISTS idx_flat_residents_flat_active ON flat_residents(flat_id, is_active);
CREATE INDEX IF NOT EXISTS idx_flat_residents_resident ON flat_residents(resident_id);
CREATE INDEX IF NOT EXISTS idx_owner_properties_user ON owner_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_properties_flat ON owner_properties(flat_id);
CREATE INDEX IF NOT EXISTS idx_bills_society_flat_status ON bills(society_id, flat_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_resident_status ON bills(resident_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON bills(payment_status, status);
CREATE INDEX IF NOT EXISTS idx_bills_paid_date ON bills(paid_date);
CREATE INDEX IF NOT EXISTS idx_bill_charges_bill_id ON bill_charges(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_status ON bill_payments(bill_id, status);
CREATE INDEX IF NOT EXISTS idx_bill_payments_resident ON bill_payments(resident_id);
CREATE INDEX IF NOT EXISTS idx_complaints_society_status ON complaints(society_id, status);
CREATE INDEX IF NOT EXISTS idx_complaints_resident_id ON complaints(resident_id);
CREATE INDEX IF NOT EXISTS idx_complaint_comments_complaint_id ON complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notices_society_expires ON notices(society_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_documents_user_status ON documents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_society_status ON documents(society_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at);
CREATE INDEX IF NOT EXISTS idx_visitors_society_status_entry ON visitors(society_id, status, entry_time);
CREATE INDEX IF NOT EXISTS idx_visitors_flat_entry ON visitors(flat_id, entry_time);
CREATE INDEX IF NOT EXISTS idx_visitors_security_id ON visitors(security_id);
CREATE INDEX IF NOT EXISTS idx_visitors_preapproval_id ON visitors(preapproval_id);
CREATE INDEX IF NOT EXISTS idx_visitor_entries_society_status ON visitor_entries(society_id, status, check_in_time);
CREATE INDEX IF NOT EXISTS idx_resident_approvals_society_status ON resident_approvals(society_id, status, requested_at);
CREATE INDEX IF NOT EXISTS idx_visitor_preapprovals_owner_status ON visitor_preapprovals(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_visitor_preapprovals_flat_status ON visitor_preapprovals(flat_id, status);
CREATE INDEX IF NOT EXISTS idx_visitor_vehicle_status ON visitor_vehicle_entries(status, entry_time);
CREATE INDEX IF NOT EXISTS idx_visitor_delivery_status ON visitor_delivery_entries(status, created_at);
CREATE INDEX IF NOT EXISTS idx_visitor_emergency_alerts_society_status ON visitor_emergency_alerts(society_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_threads_society_type ON chat_threads(society_id, thread_type);
CREATE INDEX IF NOT EXISTS idx_chat_thread_members_user ON chat_thread_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created ON chat_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_created ON chat_messages(sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver_created ON chat_messages(receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chats_thread_created ON chats(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_read ON notifications(target_role, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_society_created ON audit_logs(society_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user_society ON ai_chats(user_id, society_id);
CREATE INDEX IF NOT EXISTS idx_ai_themes_society ON ai_theme_generations(society_id);
CREATE INDEX IF NOT EXISTS idx_parking_slots_society_status ON parking_slots(society_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_society_date ON staff_attendance(society_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_requests_society_status ON staff_attendance_requests(society_id, status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_security_alerts_location ON security_alerts(location);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_society_modules_key') THEN
    BEGIN
      CREATE UNIQUE INDEX uniq_society_modules_key ON society_modules(society_id, module_key);
    EXCEPTION WHEN unique_violation THEN
      CREATE INDEX IF NOT EXISTS idx_society_modules_key ON society_modules(society_id, module_key);
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_society_analytics_metric_date') THEN
    BEGIN
      CREATE UNIQUE INDEX uniq_society_analytics_metric_date ON society_analytics(society_id, metric_date);
    EXCEPTION WHEN unique_violation THEN
      CREATE INDEX IF NOT EXISTS idx_society_analytics_metric_date ON society_analytics(society_id, metric_date);
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_chat_thread_member') THEN
    BEGIN
      CREATE UNIQUE INDEX uniq_chat_thread_member ON chat_thread_members(thread_id, user_id);
    EXCEPTION WHEN unique_violation THEN
      CREATE INDEX IF NOT EXISTS idx_chat_thread_member ON chat_thread_members(thread_id, user_id);
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_chat_receipt') THEN
    BEGIN
      CREATE UNIQUE INDEX uniq_chat_receipt ON chat_message_receipts(message_id, user_id);
    EXCEPTION WHEN unique_violation THEN
      CREATE INDEX IF NOT EXISTS idx_chat_receipt ON chat_message_receipts(message_id, user_id);
    END;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_chat_reaction') THEN
    BEGIN
      CREATE UNIQUE INDEX uniq_chat_reaction ON chat_message_reactions(message_id, user_id, reaction);
    EXCEPTION WHEN unique_violation THEN
      CREATE INDEX IF NOT EXISTS idx_chat_reaction ON chat_message_reactions(message_id, user_id, reaction);
    END;
  END IF;
END $$;

SELECT public.__schema_sync_add_fk('societies', 'fk_societies_builder', 'builder_id', 'builders', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('societies', 'fk_societies_created_by', 'created_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('societies', 'fk_societies_primary_admin_user', 'primary_admin_user_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('users', 'fk_users_society', 'society_id', 'societies', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('users', 'fk_users_builder', 'builder_id', 'builders', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('users', 'fk_users_flat', 'flat_id', 'flats', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('users', 'fk_users_deleted_by', 'deleted_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('users', 'fk_users_approved_by', 'approved_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('towers', 'fk_towers_society', 'society_id', 'societies', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('towers', 'fk_towers_builder', 'builder_id', 'builders', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('wings', 'fk_wings_society', 'society_id', 'societies', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('wings', 'fk_wings_tower', 'tower_id', 'towers', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('flats', 'fk_flats_society', 'society_id', 'societies', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('flats', 'fk_flats_tower', 'tower_id', 'towers', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('flats', 'fk_flats_wing', 'wing_id', 'wings', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('flats', 'fk_flats_resident', 'resident_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('flat_residents', 'fk_flat_residents_flat', 'flat_id', 'flats', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('flat_residents', 'fk_flat_residents_resident', 'resident_id', 'users', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('owner_properties', 'fk_owner_properties_user', 'user_id', 'users', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('owner_properties', 'fk_owner_properties_flat', 'flat_id', 'flats', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('bills', 'fk_bills_society', 'society_id', 'societies', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('bills', 'fk_bills_resident', 'resident_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('bills', 'fk_bills_flat', 'flat_id', 'flats', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('bills', 'fk_bills_created_by', 'created_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('bill_payments', 'fk_bill_payments_bill', 'bill_id', 'bills', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('bill_payments', 'fk_bill_payments_resident', 'resident_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('complaints', 'fk_complaints_resident', 'resident_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('complaints', 'fk_complaints_updated_by', 'updated_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('complaints', 'fk_complaints_archived_by', 'archived_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('complaints', 'fk_complaints_deleted_by', 'deleted_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('complaint_comments', 'fk_complaint_comments_complaint', 'complaint_id', 'complaints', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('complaint_comments', 'fk_complaint_comments_user', 'user_id', 'users', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('notices', 'fk_notices_created_by', 'created_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('documents', 'fk_documents_user', 'user_id', 'users', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('documents', 'fk_documents_reviewed_by', 'reviewed_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitors', 'fk_visitors_flat', 'flat_id', 'flats', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitors', 'fk_visitors_security', 'security_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitors', 'fk_visitors_preapproval', 'preapproval_id', 'visitor_preapprovals', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitor_preapprovals', 'fk_preapprovals_owner', 'owner_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitor_preapprovals', 'fk_preapprovals_flat', 'flat_id', 'flats', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitor_vehicle_entries', 'fk_visitor_vehicle_visitor', 'visitor_id', 'visitors', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitor_vehicle_entries', 'fk_visitor_vehicle_preapproval', 'preapproval_id', 'visitor_preapprovals', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitor_vehicle_entries', 'fk_visitor_vehicle_flat', 'flat_id', 'flats', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitor_delivery_entries', 'fk_visitor_delivery_visitor', 'visitor_id', 'visitors', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('visitor_delivery_entries', 'fk_visitor_delivery_flat', 'flat_id', 'flats', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('chat_threads', 'fk_chat_threads_society', 'society_id', 'societies', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('chat_threads', 'fk_chat_threads_created_by', 'created_by', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('chat_thread_members', 'fk_chat_thread_members_thread', 'thread_id', 'chat_threads', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('chat_thread_members', 'fk_chat_thread_members_user', 'user_id', 'users', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('chat_messages', 'fk_chat_messages_thread', 'thread_id', 'chat_threads', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('chat_messages', 'fk_chat_messages_sender', 'sender_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('chat_messages', 'fk_chat_messages_receiver', 'receiver_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('chat_messages', 'fk_chat_messages_reply_to', 'reply_to_message_id', 'chat_messages', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('chat_message_receipts', 'fk_chat_receipts_message', 'message_id', 'chat_messages', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('chat_message_receipts', 'fk_chat_receipts_user', 'user_id', 'users', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('notifications', 'fk_notifications_target_user', 'target_user_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('ai_chats', 'fk_ai_chats_user', 'user_id', 'users', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('ai_chats', 'fk_ai_chats_society', 'society_id', 'societies', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('parking_slots', 'fk_parking_slots_society', 'society_id', 'societies', 'id', 'CASCADE');
SELECT public.__schema_sync_add_fk('parking_slots', 'fk_parking_slots_flat', 'flat_id', 'flats', 'id', 'SET NULL');
SELECT public.__schema_sync_add_fk('parking_slots', 'fk_parking_slots_owner', 'owner_id', 'users', 'id', 'SET NULL');

SELECT public.__schema_sync_add_check('visitors', 'chk_visitors_approval_status', $$approval_status IS NULL OR approval_status IN ('pending', 'approved', 'manual_review', 'blocked', 'rejected')$$);
SELECT public.__schema_sync_add_check('visitors', 'chk_visitors_status', $$status IS NULL OR status IN ('pending', 'pending_approval', 'approved', 'checked_in', 'in_premises', 'checked_out', 'exited', 'rejected', 'cancelled', 'visited')$$);
SELECT public.__schema_sync_add_check('flats', 'chk_flats_approval_status', $$approval_status IS NULL OR approval_status IN ('pending', 'approved', 'rejected')$$);
SELECT public.__schema_sync_add_check('flat_residents', 'chk_flat_residents_active_dates', $$move_out_date IS NULL OR move_in_date IS NULL OR move_out_date >= move_in_date$$);
SELECT public.__schema_sync_add_check('bills', 'chk_bills_amounts_nonnegative', $$COALESCE(total_amount, 0) >= 0 AND COALESCE(paid_amount, 0) >= 0 AND COALESCE(late_fee_amount, 0) >= 0$$);

DROP FUNCTION IF EXISTS public.__schema_sync_add_fk(text, text, text, text, text, text);
DROP FUNCTION IF EXISTS public.__schema_sync_add_check(text, text, text);
