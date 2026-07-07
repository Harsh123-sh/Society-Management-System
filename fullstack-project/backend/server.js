require("dotenv").config();
const http = require("http");
const app = require("./App");
const { initChatSocket } = require("./sockets/chatSocket");
const archiveModel = require("./models/archiveModel");
const { validateSchema } = require("./utils/schemaValidator");
const { warnMissingOAuthConfig } = require("./utils/oauthConfig");
const db = require("./config/db");

let ensureSchema = null;
try {
  ensureSchema = require("./database/initSchema");
} catch (error) {
  console.warn(`Schema bootstrap unavailable: ${error.message}`);
}

const PORT = process.env.PORT || 5000;
const allowServerWithoutDb = process.env.ALLOW_SERVER_WITHOUT_DB === "true";
const requireDatabaseOnStartup = process.env.REQUIRE_DATABASE_ON_STARTUP === "true" ||
  (process.env.NODE_ENV === "production" && !allowServerWithoutDb);

const placeholderPattern = /<[^>]+>|YOUR_[A-Z_]+|RENDER_DB|SUPABASE_[A-Z_]+/;
const hasDatabaseConfig = Boolean(process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_NAME));
const requiredEnv = ["JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key] || placeholderPattern.test(process.env[key]));

if (!hasDatabaseConfig) {
  missingEnv.push("DATABASE_URL or DB_HOST/DB_NAME");
}

warnMissingOAuthConfig();

if (missingEnv.length) {
  console.error(
    `Missing or placeholder environment variables: ${[...new Set(missingEnv)].join(", ")}`
  );
  console.error(
    "Set DATABASE_URL for Supabase PostgreSQL or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME for local PostgreSQL, and provide JWT_SECRET."
  );
  process.exit(1);
}

// Initialize schema asynchronously without blocking server startup
async function initializeSchema() {
  try {
    if (typeof ensureSchema === "function") {
      await ensureSchema();
      console.log("✓ Database schema initialized");
    }

    await validateSchema();
  } catch (error) {
    console.error(`⚠ Schema validation failed: ${error.message}`);
    if (Array.isArray(error.details) && error.details.length) {
      error.details.forEach((detail) => console.error(`  - ${detail}`));
    }
    process.exit(1);
  }
}

(async () => {
  try {
    const databaseReady = await db.testConnection();
    if (!databaseReady) {
      const message = "Database is not reachable. DB-backed API routes will return errors until the connection is restored.";
      if (requireDatabaseOnStartup) {
        console.error("Startup stopped because the database is not reachable.");
        process.exit(1);
      }
      console.warn(message);
      console.warn("Continuing because ALLOW_SERVER_WITHOUT_DB=true or NODE_ENV is not production.");
    }

    if (databaseReady) {
      await initializeSchema();

      await archiveModel.runArchiveMaintenance().catch((error) => {
        console.warn(`Archive maintenance skipped on startup: ${error.message}`);
      });
    } else {
      console.warn("Schema initialization and archive maintenance skipped because the database is offline.");
    }

    const server = http.createServer(app);
    initChatSocket(server);

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the existing server or change PORT.`);
        process.exit(1);
      }
      console.error("Server error:", error);
      process.exit(1);
    });

    server.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });

    if (databaseReady) {
      setInterval(() => {
        archiveModel.runArchiveMaintenance().catch((error) => {
          console.warn(`Archive maintenance failed: ${error.message}`);
        });
      }, Number(process.env.ARCHIVE_MAINTENANCE_INTERVAL_MS || 60 * 60 * 1000));
    }
  } catch (error) {
    console.error("Fatal startup error:", error.message);
    process.exit(1);
  }
})();
