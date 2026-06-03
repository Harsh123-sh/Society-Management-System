const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool(process.env.DATABASE_URL);

pool.getConnection()
  .then((connection) => {
    console.log("MySQL database connected successfully");
    connection.release();
  })
  .catch((error) => {
    console.error("Database pool connection failed:", error);
    process.exit(1);
  });

module.exports = pool;