-- Registration, approval, and dashboard workflow safety columns.
-- Safe to run repeatedly on existing Nexora databases.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by INT NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS rejected_by INT NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL;

ALTER TABLE user_approvals
  ADD COLUMN IF NOT EXISTS approval_type VARCHAR(80) DEFAULT 'registration',
  ADD COLUMN IF NOT EXISTS rejected_by INT NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS approval_comments TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_user_approvals_society_status_type
  ON user_approvals (society_id, status, approval_type);

CREATE INDEX IF NOT EXISTS idx_users_society_role_status
  ON users (society_id, role, status);
