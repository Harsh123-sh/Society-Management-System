const { Pool } = require("pg");
require("dotenv").config();

const sslConfig = process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined;

function buildPostgresUrl() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (!host || !user || !password || !dbName) {
    throw new Error("Missing PostgreSQL environment variables. Set DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.");
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const sslMode = process.env.NODE_ENV === "production" ? "?sslmode=require" : "";
  return `postgresql://${encodedUser}:${encodedPassword}@${host}:${port}/${dbName}${sslMode}`;
}

const connectionString = process.env.DATABASE_URL || buildPostgresUrl();

const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

pool.on("error", (error) => {
  console.error("Unexpected error on idle client", error);
});

let connectionAttempts = 0;
const maxRetries = 3;

async function testConnection() {
  try {
    await pool.query("SELECT NOW()");
    console.log("✓ PostgreSQL database connected successfully");
    return true;
  } catch (error) {
    connectionAttempts++;
    if (connectionAttempts < maxRetries) {
      console.warn(`Connection attempt ${connectionAttempts}/${maxRetries} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return testConnection();
    }
    console.error("✗ Database connection failed after retries:", error.message);
    return false;
  }
}

testConnection().then((success) => {
  if (!success && process.env.NODE_ENV === "production") {
    console.error("⚠ Production environment but database not ready");
  }
});

module.exports = pool;