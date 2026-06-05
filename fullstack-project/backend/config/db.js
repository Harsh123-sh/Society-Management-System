const { Pool } = require("pg");
require("dotenv").config();

function isPlaceholder(value) {
  return typeof value === "string" && (/<[^>]+>|YOUR_[A-Z_]+|RENDER_DB/.test(value));
}

// Validate DATABASE_URL on startup
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is required. Set it to your Render PostgreSQL Internal Database URL in format: postgresql://user:password@host:port/dbname"
  );
}

if (isPlaceholder(process.env.DATABASE_URL)) {
  throw new Error(
    `Invalid DATABASE_URL: ${process.env.DATABASE_URL}. Replace placeholder values. Use Render PostgreSQL Internal Database URL in format: postgresql://user:password@host:port/dbname`
  );
}

const sslConfig = process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

const originalQuery = pool.query.bind(pool);

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