require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  const result = await pool.query(`
    SELECT id, name, email, role, status
    FROM users
    ORDER BY id
  `);

  console.table(result.rows);
  process.exit(0);
})();