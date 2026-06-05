require("dotenv").config();
const http = require("http");
const app = require("./App");
const { initChatSocket } = require("./sockets/chatSocket");
const archiveModel = require("./models/archiveModel");
const { validateSchema } = require("./utils/schemaValidator");

let ensureSchema = null;
try {
  ensureSchema = require("./database/initSchema");
} catch (error) {
  console.warn(`Schema bootstrap unavailable: ${error.message}`);
}

const PORT = process.env.PORT || 5000;

const placeholderPattern = /<[^>]+>|YOUR_[A-Z_]+|RENDER_DB/;
const requiredEnv = ["JWT_SECRET", "DATABASE_URL"];
const missingEnv = requiredEnv.filter((key) => !process.env[key] || placeholderPattern.test(process.env[key]));

if (missingEnv.length) {
  console.error(
    `Missing or placeholder environment variables: ${[...new Set(missingEnv)].join(", ")}`
  );
  console.error(
    "For Render deployment, set DATABASE_URL to Render PostgreSQL Internal Database URL and JWT_SECRET to a secure value."
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
    // Start schema initialization in background
    await initializeSchema();

    await archiveModel.runArchiveMaintenance().catch((error) => {
      console.warn(`Archive maintenance skipped on startup: ${error.message}`);
    });

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

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`✓ Server running on port ${PORT}`);
    });

    setInterval(() => {
      archiveModel.runArchiveMaintenance().catch((error) => {
        console.warn(`Archive maintenance failed: ${error.message}`);
      });
    }, Number(process.env.ARCHIVE_MAINTENANCE_INTERVAL_MS || 60 * 60 * 1000));
  } catch (error) {
    console.error("Fatal startup error:", error.message);
    process.exit(1);
  }
})();