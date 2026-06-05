require('dotenv').config();
const db = require('../config/db');

async function addIdColumn() {
  try {
    console.log('Checking society_analytics id column...');

    await db.query(`DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='society_analytics' AND column_name='id'
      ) THEN
        ALTER TABLE society_analytics ADD COLUMN id BIGSERIAL;
        PERFORM setval(pg_get_serial_sequence('society_analytics','id'), COALESCE((SELECT MAX(id) FROM society_analytics), 0));
        UPDATE society_analytics SET id = nextval(pg_get_serial_sequence('society_analytics','id')) WHERE id IS NULL;
        ALTER TABLE society_analytics ALTER COLUMN id SET DEFAULT nextval(pg_get_serial_sequence('society_analytics','id'));
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='society_analytics' AND column_name='created_at'
      ) THEN
        ALTER TABLE society_analytics ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        UPDATE society_analytics SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
      END IF;
    END $$;
    `);

    console.log('society_analytics.id & created_at ensured');

    // Ensure visitors has entry_time and exit_time (some DBs use check_in_time/check_out_time)
    await db.query(`DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='visitors' AND column_name='entry_time'
      ) THEN
        ALTER TABLE visitors ADD COLUMN entry_time TIMESTAMP;
        -- populate from check_in_time or created_at if available
        UPDATE visitors SET entry_time = COALESCE(check_in_time, created_at) WHERE entry_time IS NULL;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='visitors' AND column_name='exit_time'
      ) THEN
        ALTER TABLE visitors ADD COLUMN exit_time TIMESTAMP;
        UPDATE visitors SET exit_time = COALESCE(check_out_time, NULL) WHERE exit_time IS NULL;
      END IF;
    END $$;
    `);

    console.log('visitors.entry_time and exit_time ensured');
    process.exit(0);
  } catch (error) {
    console.error('Failed to add id column to society_analytics:', error.message || error);
    process.exit(1);
  }
}

addIdColumn();
