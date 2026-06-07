require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    const result = await pool.query(`
      SELECT
        u.id AS user_id,
        u.name AS user_name,
        u.email,
        u.role,
        u.status,
        u.is_verified,
        u.society_id,
        s.name AS society_name,
        s.code AS society_code,
        u.created_at
      FROM users u
      LEFT JOIN societies s ON s.id = u.society_id
      ORDER BY u.society_id NULLS FIRST, u.role, u.id;
    `);

    console.table(result.rows);
    console.log("Total users:", result.rows.length);
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();