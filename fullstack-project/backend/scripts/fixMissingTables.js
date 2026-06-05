require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS retention_rules (
        id SERIAL PRIMARY KEY,
        resource_type VARCHAR(100) NOT NULL UNIQUE,
        retention_days INTEGER DEFAULT 365,
        archive_after_days INTEGER DEFAULT 180,
        auto_archive_enabled BOOLEAN DEFAULT true,
        allow_permanent_delete BOOLEAN DEFAULT false,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS visitors (
        id SERIAL PRIMARY KEY,
        society_id INTEGER REFERENCES societies(id) ON DELETE CASCADE,
        flat_id INTEGER REFERENCES flats(id) ON DELETE SET NULL,
        visitor_name VARCHAR(150),
        phone VARCHAR(30),
        purpose TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id SERIAL PRIMARY KEY,
        society_id INTEGER REFERENCES societies(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        message TEXT,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Missing tables created successfully");
    process.exit(0);
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
})();