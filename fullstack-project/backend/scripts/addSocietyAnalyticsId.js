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
        -- Populate existing rows with sequence values
        PERFORM setval(pg_get_serial_sequence('society_analytics','id'), COALESCE((SELECT MAX(id) FROM society_analytics), 0));
        UPDATE society_analytics SET id = nextval(pg_get_serial_sequence('society_analytics','id')) WHERE id IS NULL;
        ALTER TABLE society_analytics ALTER COLUMN id SET DEFAULT nextval(pg_get_serial_sequence('society_analytics','id'));
      END IF;
    END $$;
    `);

    console.log('society_analytics.id ensured');
    process.exit(0);
  } catch (error) {
    console.error('Failed to add id column to society_analytics:', error.message || error);
    process.exit(1);
  }
}

addIdColumn();
