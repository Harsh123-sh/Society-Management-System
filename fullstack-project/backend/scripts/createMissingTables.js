require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
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

    console.log("Visitors and notices tables created successfully");
    process.exit(0);
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exit(1);
  }
})();