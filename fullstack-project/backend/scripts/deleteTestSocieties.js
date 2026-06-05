require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    const result = await pool.query(`
      DELETE FROM societies
      WHERE name LIKE 'Test Society%'
    `);

    console.log("Deleted Test Societies");
    console.log("Rows affected:", result.rowCount);

    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();