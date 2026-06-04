require("dotenv").config({ path: __dirname + "/../.env" });

const pool = require("../config/db");

(async () => {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        name,
        email,
        role,
        status,
        is_verified
      FROM users
      WHERE role = 'super_admin'
      ORDER BY id ASC
    `);

    console.log("================================");
    console.log("SUPER ADMINS FOUND:");
    console.log("================================");
    console.log(rows);

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();