require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  const cols = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name='society_analytics'
    ORDER BY ordinal_position
  `);

  console.table(cols.rows);
  process.exit(0);
})();