const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log("MySQL pool connected...");
  } catch (error) {
    console.error("Database pool connection failed:", error.message);
  }
}

checkDatabaseConnection();

module.exports = pool;