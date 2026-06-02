require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [societyCols] = await pool.query(
      "SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='societies' AND COLUMN_NAME='builder_id'"
    );
    const [userCols] = await pool.query(
      "SELECT COUNT(*) AS c FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='builder_id'"
    );

    console.log("societies has builder_id:", societyCols[0].c === 1 ? "YES" : "NO");
    console.log("users has builder_id:", userCols[0].c === 1 ? "YES" : "NO");

    // Get all columns for societies
    const [socCols] = await pool.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='societies' ORDER BY ORDINAL_POSITION"
    );
    console.log("societies columns:", socCols.map((r) => r.COLUMN_NAME).join(", "));

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await pool.end();
  }
})();
