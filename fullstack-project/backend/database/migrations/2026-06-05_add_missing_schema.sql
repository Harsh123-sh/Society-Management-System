-- Consolidated non-destructive migration to add missing tables/columns/indexes/FKs
-- Safe to run multiple times; uses IF NOT EXISTS checks and pg_catalog checks where necessary.
-- Create missing columns on existing tables and create missing tables used in logs.

-- Provide MySQL-like DATEDIFF function (days) for analytics SQL that uses DATEDIFF()
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'datediff') THEN
    EXECUTE $$
      CREATE FUNCTION datediff(ts1 TIMESTAMP, ts2 TIMESTAMP) RETURNS INT AS $fn$
        SELECT CAST(EXTRACT(EPOCH FROM (ts1 - ts2))/86400 AS INT);
      $fn$ LANGUAGE SQL IMMUTABLE STRICT;
    $$;
  END IF;
END $$;

-- 1) society_analytics: ensure id column, created_at, and unique index on (society_id, metric_date)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'society_analytics' AND column_name = 'id'
  ) THEN
    ALTER TABLE society_analytics ADD COLUMN id BIGINT;
    -- create sequence if not exists and populate id for existing rows
    PERFORM pg_catalog.setval(pg_get_serial_sequence('society_analytics','id')::text, COALESCE((SELECT MAX(id) FROM society_analytics), 0));
    -- If id still null for rows, populate using a sequence we create
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'society_analytics_id_seq') THEN
      CREATE SEQUENCE society_analytics_id_seq OWNED BY society_analytics.id;
    END IF;
    UPDATE society_analytics SET id = nextval('society_analytics_id_seq') WHERE id IS NULL;
    ALTER TABLE society_analytics ALTER COLUMN id SET DEFAULT nextval('society_analytics_id_seq');
    -- add an index on id (non-unique) for lookup performance
    CREATE INDEX IF NOT EXISTS idx_society_analytics_id ON society_analytics(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'society_analytics' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE society_analytics ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    UPDATE society_analytics SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
  END IF;

  -- Ensure unique index on (society_id, metric_date)
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_society_analytics_metric_date ON society_analytics(society_id, metric_date);
END $$;

-- 2) users.builder_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'builder_id'
  ) THEN
    ALTER TABLE users ADD COLUMN builder_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_builder_id ON users(builder_id);
  END IF;

  -- Add FK to builders.id only if builders table exists and FK not present
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'builders') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'users' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'builder_id'
    ) THEN
      ALTER TABLE users ADD CONSTRAINT fk_users_builder FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- 3) complaints.updated_by
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE complaints ADD COLUMN updated_by INT NULL;
    CREATE INDEX IF NOT EXISTS idx_complaints_updated_by ON complaints(updated_by);
  END IF;

  -- Add FK to users(id) if users table exists and FK missing
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'complaints' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'updated_by'
    ) THEN
      ALTER TABLE complaints ADD CONSTRAINT fk_complaints_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- 4) notices.expires_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE notices ADD COLUMN expires_at TIMESTAMP NULL;
  END IF;
END $$;

-- 5) parking_slots table
CREATE TABLE IF NOT EXISTS parking_slots (
  id SERIAL PRIMARY KEY,
  society_id INT,
  flat_id INT,
  owner_id INT NULL,
  wing VARCHAR(100),
  floor VARCHAR(50),
  block VARCHAR(50),
  slot_number VARCHAR(100),
  type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'available',
  deleted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  -- FK to societies
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'societies') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'parking_slots' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'society_id'
    ) THEN
      ALTER TABLE parking_slots ADD CONSTRAINT fk_parking_slots_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;

  -- FK to flats
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'flats') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'parking_slots' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'flat_id'
    ) THEN
      ALTER TABLE parking_slots ADD CONSTRAINT fk_parking_slots_flat FOREIGN KEY (flat_id) REFERENCES flats(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;

  CREATE INDEX IF NOT EXISTS idx_parking_slots_society_status ON parking_slots(society_id, status);
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'parking_slots') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parking_slots' AND column_name = 'owner_id') THEN
      ALTER TABLE parking_slots ADD COLUMN owner_id INT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'parking_slots' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'owner_id') THEN
      ALTER TABLE parking_slots ADD CONSTRAINT fk_parking_slots_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parking_slots' AND column_name = 'wing') THEN
      ALTER TABLE parking_slots ADD COLUMN wing VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parking_slots' AND column_name = 'floor') THEN
      ALTER TABLE parking_slots ADD COLUMN floor VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parking_slots' AND column_name = 'block') THEN
      ALTER TABLE parking_slots ADD COLUMN block VARCHAR(50);
    END IF;
  END IF;
END $$;

-- 6) documents table
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

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'documents') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE documents ADD COLUMN user_id INT NOT NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'society_id'
    ) THEN
      ALTER TABLE documents ADD COLUMN society_id INT NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'document_type'
    ) THEN
      ALTER TABLE documents ADD COLUMN document_type VARCHAR(80) NOT NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'file_url'
    ) THEN
      ALTER TABLE documents ADD COLUMN file_url VARCHAR(500) NOT NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'status'
    ) THEN
      ALTER TABLE documents ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'notes'
    ) THEN
      ALTER TABLE documents ADD COLUMN notes TEXT NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'reviewed_by'
    ) THEN
      ALTER TABLE documents ADD COLUMN reviewed_by INT NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'reviewed_at'
    ) THEN
      ALTER TABLE documents ADD COLUMN reviewed_at TIMESTAMP NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'created_at'
    ) THEN
      ALTER TABLE documents ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'documents' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
      ) THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'documents' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'reviewed_by'
      ) THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_documents_society_status ON documents(society_id, status);
    CREATE INDEX IF NOT EXISTS idx_documents_user_status ON documents(user_id, status);
  END IF;
END $$;

-- 7) towers table
CREATE TABLE IF NOT EXISTS towers (
  id SERIAL PRIMARY KEY,
  society_id INT,
  tower_name VARCHAR(120),
  tower_code VARCHAR(80),
  total_floors INT DEFAULT 1,
  flats_per_floor INT DEFAULT 1,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'societies') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'towers' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'society_id'
    ) THEN
      ALTER TABLE towers ADD CONSTRAINT fk_towers_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'towers') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towers' AND column_name = 'total_floors') THEN
      ALTER TABLE towers ADD COLUMN total_floors INT DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towers' AND column_name = 'flats_per_floor') THEN
      ALTER TABLE towers ADD COLUMN flats_per_floor INT DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towers' AND column_name = 'flat_number_format') THEN
      ALTER TABLE towers ADD COLUMN flat_number_format VARCHAR(50) DEFAULT 'floor_sequence';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towers' AND column_name = 'starting_floor') THEN
      ALTER TABLE towers ADD COLUMN starting_floor INT DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towers' AND column_name = 'status') THEN
      ALTER TABLE towers ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'towers' AND column_name = 'created_by') THEN
      ALTER TABLE towers ADD COLUMN created_by INT NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'towers' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'created_by'
    ) THEN
      ALTER TABLE towers ADD CONSTRAINT fk_towers_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_towers_society_status ON towers(society_id, status);
  END IF;
END $$;

-- 7) wings table
CREATE TABLE IF NOT EXISTS wings (
  id SERIAL PRIMARY KEY,
  society_id INT,
  name VARCHAR(120),
  code VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'societies') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'wings' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'society_id'
    ) THEN
      ALTER TABLE wings ADD CONSTRAINT fk_wings_society FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- 8) notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  target_user_id INT NULL,
  target_role VARCHAR(80) DEFAULT 'all',
  title VARCHAR(250),
  message TEXT,
  data JSONB NULL,
  status VARCHAR(50) DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'notifications' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'target_user_id'
    ) THEN
      ALTER TABLE notifications ADD CONSTRAINT fk_notifications_target_user FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'notifications' AND column_name = 'created_by'
    ) THEN
      ALTER TABLE notifications ADD COLUMN created_by INT NULL;
      ALTER TABLE notifications ADD CONSTRAINT fk_notifications_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'archived_by'
  ) THEN
    ALTER TABLE notifications ADD COLUMN archived_by INT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN archived_at TIMESTAMP NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'archived_from_status'
  ) THEN
    ALTER TABLE notifications ADD COLUMN archived_from_status VARCHAR(50) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN deleted_at TIMESTAMP NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE notifications ADD COLUMN deleted_by INT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'deletion_reason'
  ) THEN
    ALTER TABLE notifications ADD COLUMN deletion_reason TEXT NULL;
  END IF;

  CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
END $$;

-- 9) notices lifecycle columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE notices ADD COLUMN created_by INT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'archived_by'
  ) THEN
    ALTER TABLE notices ADD COLUMN archived_by INT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE notices ADD COLUMN archived_at TIMESTAMP NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'archived_from_status'
  ) THEN
    ALTER TABLE notices ADD COLUMN archived_from_status VARCHAR(50) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE notices ADD COLUMN deleted_at TIMESTAMP NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'deleted_by'
  ) THEN
    ALTER TABLE notices ADD COLUMN deleted_by INT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notices' AND column_name = 'deletion_reason'
  ) THEN
    ALTER TABLE notices ADD COLUMN deletion_reason TEXT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'notices' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'created_by'
    ) THEN
      ALTER TABLE notices ADD CONSTRAINT fk_notices_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- 10) bills.resident_id (some DBs had different column names)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'resident_id'
  ) THEN
    ALTER TABLE bills ADD COLUMN resident_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_bills_resident_id ON bills(resident_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'bills' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'resident_id'
    ) THEN
      ALTER TABLE bills ADD CONSTRAINT fk_bills_resident FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bills' AND column_name = 'created_by'
    ) THEN
      ALTER TABLE bills ADD COLUMN created_by INT NULL;
      ALTER TABLE bills ADD CONSTRAINT fk_bills_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- 9b) bills additional columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'bill_type'
  ) THEN
    ALTER TABLE bills ADD COLUMN bill_type VARCHAR(50) DEFAULT 'maintenance';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE bills ADD COLUMN invoice_number VARCHAR(120);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'title'
  ) THEN
    ALTER TABLE bills ADD COLUMN title VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'billing_month'
  ) THEN
    ALTER TABLE bills ADD COLUMN billing_month DATE NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE bills ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE bills ADD COLUMN total_amount NUMERIC(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE bills ADD COLUMN paid_amount NUMERIC(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'late_fee_amount'
  ) THEN
    ALTER TABLE bills ADD COLUMN late_fee_amount NUMERIC(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'reminder_count'
  ) THEN
    ALTER TABLE bills ADD COLUMN reminder_count INT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bills' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE bills ADD COLUMN paid_at TIMESTAMP NULL;
  END IF;
END $$;

-- Add a paid_date column used in analytics (non-destructive). If paid_at exists populate it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'bills') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'bills' AND column_name = 'paid_date'
    ) THEN
      ALTER TABLE bills ADD COLUMN paid_date TIMESTAMP NULL;
      -- backfill from paid_at if present
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'paid_at') THEN
        EXECUTE 'UPDATE bills SET paid_date = paid_at WHERE paid_date IS NULL AND paid_at IS NOT NULL';
      END IF;
    END IF;
    CREATE INDEX IF NOT EXISTS idx_bills_paid_date ON bills(paid_date);
  END IF;
END $$;

-- 10) bill_payments.paid_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bill_payments' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE bill_payments ADD COLUMN paid_at TIMESTAMP NULL;
  END IF;
END $$;

-- 10) add visitor_type, visitor timestamps and minimal analytics tables
DO $$
BEGIN
  -- visitors.visitor_type
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'visitors') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'visitors' AND column_name = 'visitor_type'
    ) THEN
      ALTER TABLE visitors ADD COLUMN visitor_type VARCHAR(50) DEFAULT 'guest';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'visitors' AND column_name = 'entry_time'
    ) THEN
      ALTER TABLE visitors ADD COLUMN entry_time TIMESTAMP NULL;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'visitors' AND column_name = 'exit_time'
    ) THEN
      ALTER TABLE visitors ADD COLUMN exit_time TIMESTAMP NULL;
    END IF;
  END IF;

  -- minimal chats table used by analytics (non-destructive)
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'chats') THEN
    CREATE TABLE chats (
      id SERIAL PRIMARY KEY,
      sender_id INT NULL,
      receiver_id INT NULL,
      message TEXT,
      message_type VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
  END IF;

  -- minimal security_alerts table used by analytics (non-destructive)
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'security_alerts') THEN
    CREATE TABLE security_alerts (
      id SERIAL PRIMARY KEY,
      society_id INT NULL,
      message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at);
  END IF;

END $$;

-- 11) visitors.security_id, entry_time, exit_time
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visitors' AND column_name = 'security_id'
  ) THEN
    ALTER TABLE visitors ADD COLUMN security_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_visitors_security_id ON visitors(security_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visitors' AND column_name = 'preapproval_id'
  ) THEN
    ALTER TABLE visitors ADD COLUMN preapproval_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_visitors_preapproval_id ON visitors(preapproval_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visitors' AND column_name = 'qr_pass_id'
  ) THEN
    ALTER TABLE visitors ADD COLUMN qr_pass_id INT NULL;
    CREATE INDEX IF NOT EXISTS idx_visitors_qr_pass_id ON visitors(qr_pass_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visitors' AND column_name = 'entry_time'
  ) THEN
    ALTER TABLE visitors ADD COLUMN entry_time TIMESTAMP NULL;
    -- populate from check_in_time or created_at if available
    BEGIN
      UPDATE visitors SET entry_time = COALESCE(check_in_time, created_at) WHERE entry_time IS NULL;
    EXCEPTION WHEN others THEN
      -- ignore if check_in_time doesn't exist
      NULL;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visitors' AND column_name = 'exit_time'
  ) THEN
    ALTER TABLE visitors ADD COLUMN exit_time TIMESTAMP NULL;
    BEGIN
      UPDATE visitors SET exit_time = COALESCE(check_out_time, NULL) WHERE exit_time IS NULL;
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;

  -- Add foreign key to users for security_id if users table exists
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'users') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'visitors' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'security_id'
    ) THEN
      ALTER TABLE visitors ADD CONSTRAINT fk_visitors_security FOREIGN KEY (security_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- 11) add missing indexes referenced in logs
CREATE INDEX IF NOT EXISTS idx_users_society_id ON users(society_id);
CREATE INDEX IF NOT EXISTS idx_complaints_resident_id ON complaints(resident_id);
CREATE INDEX IF NOT EXISTS idx_notices_society_expires ON notices(society_id, expires_at);

-- 12) Ensure towers/flats/wings relations exist if tables present
DO $$
BEGIN
  -- if flats table exists, ensure tower_id column
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'flats') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flats' AND column_name = 'tower_id') THEN
      ALTER TABLE flats ADD COLUMN tower_id INT NULL;
      CREATE INDEX IF NOT EXISTS idx_flats_tower_id ON flats(tower_id);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'towers') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'flats' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'tower_id'
      ) THEN
        ALTER TABLE flats ADD CONSTRAINT fk_flats_tower FOREIGN KEY (tower_id) REFERENCES towers(id) ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END IF;
  END IF;
END $$;

-- 13) Safety note: this migration is non-destructive and only adds columns/tables/indexes/constraints when missing.

-- End of migration
