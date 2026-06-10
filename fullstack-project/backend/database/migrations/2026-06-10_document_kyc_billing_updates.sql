BEGIN;

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS kyc_reviewed_by INT;

CREATE INDEX IF NOT EXISTS idx_documents_user_type_version
  ON documents (user_id, document_type, version DESC);

CREATE INDEX IF NOT EXISTS idx_documents_deleted_at
  ON documents (deleted_at);

COMMIT;
