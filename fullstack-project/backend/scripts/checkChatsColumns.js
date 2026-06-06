require("dotenv").config();
const pool = require("../config/db");

(async () => {
  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'chats'
    ORDER BY column_name
  `);

  console.table(result.rows);
  process.exit(0);
})();