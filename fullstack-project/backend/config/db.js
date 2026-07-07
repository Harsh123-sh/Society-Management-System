const { Pool } = require("pg");
require("dotenv").config();

function isPlaceholder(value) {
  return typeof value === "string" && (/<[^>]+>|YOUR_[A-Z_]+|RENDER_DB|SUPABASE_[A-Z_]+/.test(value));
}

function isLocalDatabaseUrl(value) {
  if (!value) {
    return true;
  }

  return /(^|:)(localhost|127\.0\.0\.1|::1)(:|\/|$)/i.test(value) || /\.local$/i.test(value);
}

function buildConnectionStringFromParts() {
  const {
    DB_HOST,
    DB_PORT = "5432",
    DB_USER,
    DB_PASSWORD = "",
    DB_NAME,
  } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    return "";
  }

  const user = encodeURIComponent(DB_USER);
  const password = DB_PASSWORD ? `:${encodeURIComponent(DB_PASSWORD)}` : "";
  const host = DB_HOST.includes(":") && !DB_HOST.startsWith("[") ? `[${DB_HOST}]` : DB_HOST;
  const database = encodeURIComponent(DB_NAME);

  return `postgresql://${user}${password}@${host}:${DB_PORT}/${database}`;
}

function buildConnectionString() {
  if (process.env.DATABASE_URL && !isPlaceholder(process.env.DATABASE_URL)) {
    return process.env.DATABASE_URL;
  }

  const builtUrl = buildConnectionStringFromParts();
  if (builtUrl) {
    return builtUrl;
  }

  if (!process.env.DATABASE_URL || isPlaceholder(process.env.DATABASE_URL)) {
    throw new Error(
      "DATABASE_URL is required and must point to the active Postgres database, or set DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME for local PostgreSQL."
    );
  }
}

const databaseUrl = buildConnectionString();
console.log("[DB] active database host:", getDatabaseHost());

if (!databaseUrl || isPlaceholder(databaseUrl)) {
  throw new Error(
    "Database configuration is missing. Set DATABASE_URL for Supabase or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME for local PostgreSQL."
  );
}

const isLocalDatabase = isLocalDatabaseUrl(databaseUrl);
const sslConfig = isLocalDatabase ? false : { rejectUnauthorized: false };

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: sslConfig,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
  keepAlive: true,
});

const originalQuery = pool.query.bind(pool);

function getDatabaseHost() {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return "unknown";
  }
}

function addInsertReturningId(queryText) {
  if (/^\s*INSERT\s+INTO/i.test(queryText) && !/RETURNING\s+/i.test(queryText)) {
    return queryText.trim().replace(/;?$/u, " RETURNING id");
  }
  return queryText;
}

function formatPostgresQuery(queryText, params = []) {
  queryText = addInsertReturningId(queryText);
  if (!params || params.length === 0 || !queryText.includes("?")) {
    return { text: queryText, values: params };
  }

  let index = 0;
  const formattedText = queryText.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });

  return { text: formattedText, values: params };
}

pool.query = async (queryText, params = []) => {
  const { text, values } = formatPostgresQuery(queryText, params);

  try {
    const result = await originalQuery(text, values);
    // Map pg semantics to some MySQL-compatible properties used across the codebase
    if (result) {
      // rowCount -> affectedRows for legacy checks
      if (result.rowCount !== undefined && result.affectedRows === undefined) {
        result.affectedRows = result.rowCount;
      }

      // If INSERT RETURNING id was used, expose insertId on both result and rows for compatibility
      if (Array.isArray(result.rows) && result.rows[0] && result.rows[0].id !== undefined && result.insertId === undefined) {
        result.insertId = result.rows[0].id;
        try {
          result.rows.insertId = result.rows[0].id;
        } catch (e) {
          // ignore if rows isn't writable in this shape
        }
      }

      // Also provide an array-like first element with affectedRows/insertId for code that expects mysql2 [result, fields] style
      if (result[0] === undefined) {
        result[0] = {};
      }
      if (result.affectedRows !== undefined) result[0].affectedRows = result.affectedRows;
      if (result.insertId !== undefined) result[0].insertId = result.insertId;
    }

    return result;
  } catch (error) {
    console.error("[DB] Query failed:", {
      text,
      values,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

pool.getConnection = async () => {
  const client = await pool.connect();

  return {
    query: async (queryText, params = []) => {
      const { text, values } = formatPostgresQuery(queryText, params);
      const result = await client.query(text, values);
      // Map pg semantics to MySQL-compatible properties
      if (result) {
        if (result.rowCount !== undefined && result.affectedRows === undefined) {
          result.affectedRows = result.rowCount;
        }

        if (Array.isArray(result.rows) && result.rows[0] && result.rows[0].id !== undefined && result.insertId === undefined) {
          result.insertId = result.rows[0].id;
          try {
            result.rows.insertId = result.rows[0].id;
          } catch (e) {}
        }

        if (result[0] === undefined) result[0] = {};
        if (result.affectedRows !== undefined) result[0].affectedRows = result.affectedRows;
        if (result.insertId !== undefined) result[0].insertId = result.insertId;
      }

      return result;
    },
    beginTransaction: async () => {
      await client.query("BEGIN");
    },
    commit: async () => {
      await client.query("COMMIT");
    },
    rollback: async () => {
      await client.query("ROLLBACK");
    },
    release: () => {
      client.release();
    },
  };
};

pool.on("error", (error) => {
  console.error("[DB] Unexpected error on idle client:", error);
});

const maxRetries = 3;

async function testConnection(connectionAttempts = 0) {
  const databaseHost = getDatabaseHost();
  const sslMode = isLocalDatabase ? "disabled" : "enabled (sslmode=require)";

  try {
    const result = await originalQuery("SELECT NOW() AS current_time");
    console.log(`✓ PostgreSQL database connected successfully (${databaseHost}, ssl: ${sslMode})`);
    console.log(`[DB] Connection verified at ${result.rows?.[0]?.current_time || "unknown time"}`);
    return true;
  } catch (error) {
    connectionAttempts += 1;
    if (connectionAttempts < maxRetries) {
      console.warn(`[DB] Connection attempt ${connectionAttempts}/${maxRetries} failed: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return testConnection(connectionAttempts);
    }
    console.error("[DB] Database connection failed after retries:", error.message);
    console.error(`[DB] Host: ${databaseHost}`);
    console.error(`[DB] SSL mode: ${sslMode}`);

    return false;
  }
}

pool.testConnection = testConnection;
pool.getDatabaseHost = getDatabaseHost;

module.exports = pool;
module.exports.getDatabaseHost = getDatabaseHost;
