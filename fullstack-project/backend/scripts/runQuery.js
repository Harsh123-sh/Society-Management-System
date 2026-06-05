require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

async function run() {
  try {
    const result = await pool.query(`
      SELECT id, name, code, status, created_by, created_at
      FROM societies
      ORDER BY id DESC;
    `);

    console.table(result.rows);
    process.exit(0);
  } catch (error) {
    console.error("QUERY ERROR:", error.message);
    process.exit(1);
  }
}

run();