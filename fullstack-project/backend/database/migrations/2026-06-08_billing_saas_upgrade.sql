BEGIN;

CREATE TABLE IF NOT EXISTS bill_templates (
  id SERIAL PRIMARY KEY,
  society_id INTEGER NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  bill_type VARCHAR(50) NOT NULL DEFAULT 'maintenance',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  billing_period VARCHAR(30) NOT NULL DEFAULT 'monthly',
  grace_period_days INTEGER NOT NULL DEFAULT 0,
  late_fee_fixed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  late_fee_percentage NUMERIC(6, 2) NOT NULL DEFAULT 0,
  target_type VARCHAR(30) NOT NULL DEFAULT 'society',
  target_value_json JSONB,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_templates_society_created
  ON bill_templates (society_id, created_at DESC);

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS flat_id INTEGER REFERENCES flats(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES bill_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS grace_period_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_fixed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee_percentage NUMERIC(6, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_bills_society_flat_status
  ON bills (society_id, flat_id, status);

CREATE INDEX IF NOT EXISTS idx_bills_template
  ON bills (template_id);

ALTER TABLE bill_payments
  ADD COLUMN IF NOT EXISTS reference_number VARCHAR(160),
  ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMIT;
