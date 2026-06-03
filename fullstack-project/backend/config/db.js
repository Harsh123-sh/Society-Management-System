const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool
  .connect()
  .then((client) => {
    console.log("PostgreSQL database connected successfully");
    client.release();
  })
  .catch((error) => {
    console.error("Database pool connection failed:", error);
    process.exit(1);
  });

module.exports = pool;