require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    await pool.query(`
      INSERT INTO flats
      (society_id, wing, flat_number, floor, block, status, area_sqft, created_at, updated_at)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    `, [6, "A", "101", "1", "A Block", "vacant", 950]);

    console.log("Flat A-102 created successfully");
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();