require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

const query = pool.query.bind(pool);
let failedMigrations = 0;

async function runMigration(sql, params) {
  const statement = typeof sql === "string" ? sql.trim() : sql;

  try {
    return await query(sql, params);
  } catch (err) {
    failedMigrations += 1;
    console.error(`[Migration failed] ${err.message}`);
    console.error(`[Failed SQL] ${statement}`);
    return null;
  }
}

pool.query = runMigration;

(async () => {
  try {
    console.log("Starting migration: fixMissingSchema");

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
await pool.query(`ALTER TABLE bill_payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;`);
await pool.query(`ALTER TABLE bill_payments ADD COLUMN IF NOT EXISTS resident_id INTEGER;`);
await pool.query(`ALTER TABLE bill_payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);`);
await pool.query(`ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS owner_id INTEGER;`);
await pool.query(`ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS wing VARCHAR(50);`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS paid_date DATE;`);
await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS visitor_type VARCHAR(50) DEFAULT 'guest';`);
await pool.query(`ALTER TABLE chats ADD COLUMN IF NOT EXISTS user_id INTEGER;`);
await pool.query(`UPDATE chats SET user_id = sender_id WHERE user_id IS NULL AND sender_id IS NOT NULL;`);

await pool.query(`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'cash';`);

await pool.query(`ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS location VARCHAR(255);`);
await pool.query(`ALTER TABLE visitor_qr_passes ADD COLUMN IF NOT EXISTS preapproval_id INTEGER;`);
await pool.query(`ALTER TABLE visitor_qr_passes ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';`);
await pool.query(`ALTER TABLE visitor_qr_passes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;`);
await pool.query(`ALTER TABLE visitor_qr_passes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);
await pool.query(`ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS user_id INTEGER;`);
await pool.query(`ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS living_start_date TIMESTAMP;`);
await pool.query(`ALTER TABLE owner_properties ADD COLUMN IF NOT EXISTS flat_id INTEGER;`);
await pool.query(`ALTER TABLE wings ADD COLUMN IF NOT EXISTS builder_id INTEGER;`);
await pool.query(`ALTER TABLE wings ADD COLUMN IF NOT EXISTS tower_id INTEGER;`);
await pool.query(`ALTER TABLE wings ADD COLUMN IF NOT EXISTS created_by INTEGER;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by INTEGER;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS delete_reason TEXT;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp VARCHAR(10);`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMP;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp VARCHAR(10);`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMP;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp VARCHAR(10);`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_attempts INTEGER DEFAULT 0;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_otp_sent_at TIMESTAMP;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(10);`);
await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp_expires_at TIMESTAMP;`);
await pool.query(`ALTER TABLE chats ADD COLUMN IF NOT EXISTS thread_id INTEGER;`);
await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS payment_attempts INTEGER DEFAULT 0;`);
await pool.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS approved_by INTEGER;`);
await pool.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS rejected_by INTEGER;`);
await pool.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;`);
await pool.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;`);
await pool.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS approval_comments TEXT;`);
await pool.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;`);
await pool.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS documents_json JSONB;`);
await pool.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);



await pool.query(`
  CREATE TABLE IF NOT EXISTS ai_chats (
    id SERIAL PRIMARY KEY,
    society_id INTEGER,
    user_id INTEGER,
    message TEXT,
    response TEXT,
    task_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);


await pool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS owner_properties_flat_id_unique
  ON owner_properties(flat_id);
`);




await pool.query(`
CREATE TABLE IF NOT EXISTS visitor_preapprovals (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER,
  flat_id INTEGER,
  visitor_name VARCHAR(150),
  phone VARCHAR(50),
  purpose TEXT,
  visit_date DATE,
  expected_arrival_time TIMESTAMP,
  vehicle_number VARCHAR(50),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approval_token TEXT,
  qr_pass_token TEXT,
  otp_code_hash TEXT,
  otp_expires_at TIMESTAMP
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS visitor_emergency_alerts (
  id SERIAL PRIMARY KEY,
  triggered_by INTEGER,
  alert_type VARCHAR(100),
  severity VARCHAR(50),
  message TEXT,
  location TEXT,
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS visitor_blacklist_entries (
  id SERIAL PRIMARY KEY,
  visitor_name VARCHAR(150),
  phone VARCHAR(50),
  reason TEXT,
  flat_id INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS visitor_delivery_entries (
  id SERIAL PRIMARY KEY,
  visitor_id INTEGER,
  delivery_type VARCHAR(100),
  package_id VARCHAR(100),
  recipient_name VARCHAR(150),
  delivery_partner VARCHAR(150),
  flat_id INTEGER,
  status VARCHAR(50),
  notes TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

await pool.query(`
CREATE TABLE IF NOT EXISTS visitor_vehicle_entries (
  id SERIAL PRIMARY KEY,
  visitor_id INTEGER,
  preapproval_id INTEGER,
  vehicle_number VARCHAR(50),
  vehicle_type VARCHAR(50),
  owner_name VARCHAR(150),
  flat_id INTEGER,
  entry_method VARCHAR(50),
  status VARCHAR(50),
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    society_id INTEGER,
    sender_id INTEGER,
    receiver_id INTEGER,
    message TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    society_id INTEGER,
    alert_type VARCHAR(100),
    message TEXT,
    severity VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    society_id INTEGER REFERENCES societies(id) ON DELETE CASCADE,
    document_type VARCHAR(100),
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    society_id INTEGER,
    sender_id INTEGER,
    receiver_id INTEGER,
    message TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

await pool.query(`
  CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    society_id INTEGER,
    alert_type VARCHAR(100),
    message TEXT,
    severity VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
  );
`);

await pool.query(`ALTER TABLE bills ADD COLUMN IF NOT EXISTS paid_date DATE;`);
await pool.query(`ALTER TABLE visitors ADD COLUMN IF NOT EXISTS visitor_type VARCHAR(50) DEFAULT 'guest';`);

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

    if (failedMigrations > 0) {
      console.warn(`Migration completed with ${failedMigrations} failed statement(s): fixMissingSchema`);
    } else {
      console.log("Migration completed: fixMissingSchema");
    }
    process.exit(0);
  } catch (err) {
    console.error(`[Migration failed] fixMissingSchema fatal error: ${err.message}`);
    process.exit(1);
  }
})();
