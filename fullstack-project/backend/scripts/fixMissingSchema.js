require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS builder_id INTEGER;`);

    await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP;`);
    await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP;`);
    await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS security_id INTEGER;`);
    await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS visitor_email VARCHAR(150);`);
    await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS person_to_meet VARCHAR(150);`);
    await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);`);
    await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';`);
    await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS qr_pass_id INTEGER;`);

    await pool.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;`);

    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS updated_by INTEGER;`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS archived_by INTEGER;`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_by INTEGER;`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS archived_from_status VARCHAR(50);`);
    await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deletion_reason TEXT;`);

    await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS resident_id INTEGER;`);
    await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS builder_id INTEGER;`);
    await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS created_by INTEGER;`);

    await pool.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS tower_id INTEGER;`);
    await pool.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS building_name VARCHAR(100);`);
    await pool.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS wing_id INTEGER;`);
    await pool.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS flat_type VARCHAR(50);`);
    await pool.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS occupancy_status VARCHAR(50);`);
    await pool.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved';`);
    await pool.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS approved_by INTEGER;`);
    await pool.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;`);
    await pool.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;`);

    await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS preapproval_id INTEGER;`);
await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS photo_url TEXT;`);
await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS face_capture_url TEXT;`);
await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS face_match_confidence NUMERIC;`);
await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS blacklist_flag BOOLEAN DEFAULT false;`);

await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS bill_type VARCHAR(50);`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS title VARCHAR(200);`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS due_date DATE;`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS billing_month VARCHAR(20);`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0;`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0;`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC DEFAULT 0;`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;`);

await pool.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;`);
await pool.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS archived_by INTEGER;`);
await pool.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS archived_from_status VARCHAR(50);`);
await pool.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
await pool.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS deleted_by INTEGER;`);
await pool.query(`ALTER TABLE notices ADD COLUMN IF NOT EXISTS deletion_reason TEXT;`);

await pool.query(`ALTER TABLE towers ADD COLUMN IF NOT EXISTS total_floors INTEGER DEFAULT 0;`);
await pool.query(`ALTER TABLE towers ADD COLUMN IF NOT EXISTS flats_per_floor INTEGER DEFAULT 0;`);
await pool.query(`ALTER TABLE towers ADD COLUMN IF NOT EXISTS flat_number_format VARCHAR(100);`);
await pool.query(`ALTER TABLE towers ADD COLUMN IF NOT EXISTS starting_floor INTEGER DEFAULT 0;`);
await pool.query(`ALTER TABLE towers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';`);
await pool.query(`ALTER TABLE towers ADD COLUMN IF NOT EXISTS created_by INTEGER;`);
await pool.query(`ALTER TABLE towers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200),
        message TEXT,
        target_user_id INTEGER,
        target_role VARCHAR(50) DEFAULT 'all',
        society_id INTEGER,
        status VARCHAR(50) DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wings (
        id SERIAL PRIMARY KEY,
        society_id INTEGER,
        name VARCHAR(100),
        code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS towers (
        id SERIAL PRIMARY KEY,
        society_id INTEGER,
        tower_name VARCHAR(100),
        tower_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id SERIAL PRIMARY KEY,
        society_id INTEGER,
        flat_id INTEGER,
        slot_number VARCHAR(50),
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'available',
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitor_qr_passes (
        id SERIAL PRIMARY KEY,
        pass_token VARCHAR(255),
        qr_code_url TEXT,
        visitor_id INTEGER,
        flat_id INTEGER,
        society_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS flat_residents (
        id SERIAL PRIMARY KEY,
        flat_id INTEGER,
        resident_id INTEGER,
        move_in_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Missing schema fixed successfully");
    process.exit(0);
  } catch (err) {
    console.error("Schema fix error:", err.message);
    process.exit(1);
  }
})();