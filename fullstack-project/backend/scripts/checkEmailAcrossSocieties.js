require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    const email = "WRITE_EMAIL_HERE"; // change this

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.is_verified,
        u.society_id,
        s.name AS society_name,
        s.code AS society_code
      FROM users u
      LEFT JOIN societies s ON s.id = u.society_id
      WHERE LOWER(u.email) = LOWER($1)
      ORDER BY u.id DESC
      `,
      [email]
    );

    console.table(result.rows);
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();