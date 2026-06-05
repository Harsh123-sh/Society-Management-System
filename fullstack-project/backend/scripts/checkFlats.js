require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        society_id,
        building_name,
        wing,
        flat_number,
        status,
        approval_status
      FROM flats
      ORDER BY id DESC
    `);

    console.table(result.rows);
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();