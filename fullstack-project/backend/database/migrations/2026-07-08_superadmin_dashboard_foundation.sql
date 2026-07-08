-- Safe foundation for the Nexora Super Admin dashboard.
-- This migration is intentionally additive: it does not delete or rewrite data.

CREATE TABLE IF NOT EXISTS user_approvals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  society_id INTEGER REFERENCES societies(id) ON DELETE CASCADE,
  approval_type VARCHAR(80) NOT NULL DEFAULT 'registration',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approval_comments TEXT,
  rejection_reason TEXT,
  documents_json JSONB,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  society_id INTEGER REFERENCES societies(id) ON DELETE SET NULL,
  action VARCHAR(140) NOT NULL,
  resource_type VARCHAR(80),
  resource_id INTEGER,
  details TEXT,
  status VARCHAR(50) DEFAULT 'success',
  ip_address VARCHAR(80),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS society_subscriptions (
  id SERIAL PRIMARY KEY,
  society_id INTEGER NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  plan_name VARCHAR(80) NOT NULL DEFAULT 'starter',
  status VARCHAR(50) NOT NULL DEFAULT 'trial',
  billing_cycle VARCHAR(40) DEFAULT 'monthly',
  renewal_at TIMESTAMP,
  provider_name VARCHAR(80),
  provider_subscription_id VARCHAR(160),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  society_id INTEGER REFERENCES societies(id) ON DELETE SET NULL,
  requester_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  priority VARCHAR(40) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'open',
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE societies ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(40);
ALTER TABLE societies ADD COLUMN IF NOT EXISTS default_language VARCHAR(12) DEFAULT 'en';
ALTER TABLE societies ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(80) DEFAULT 'starter';
ALTER TABLE societies ADD COLUMN IF NOT EXISTS chairman_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE societies ADD COLUMN IF NOT EXISTS primary_admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_user_approvals_status_role ON user_approvals(status, approval_type);
CREATE INDEX IF NOT EXISTS idx_user_approvals_society ON user_approvals(society_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_society_subscriptions_society ON society_subscriptions(society_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_society_status ON support_tickets(society_id, status);
