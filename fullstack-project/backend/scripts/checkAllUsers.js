require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        email,
        role,
        status,
        is_verified,
        society_id,
        created_at
      FROM users
      ORDER BY id DESC
    `);

    console.table(result.rows);
    console.log("Total Users:", result.rows.length);

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();