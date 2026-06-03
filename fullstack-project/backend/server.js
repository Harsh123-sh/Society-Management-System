require("dotenv").config();
const http = require("http");
const app = require("./App");
const { initChatSocket } = require("./sockets/chatSocket");
const archiveModel = require("./models/archiveModel");

let ensureSchema = null;
try {
  ensureSchema = require("./database/initSchema");
} catch (error) {
  console.warn(`Schema bootstrap unavailable: ${error.message}`);
}

const PORT = process.env.PORT || 5000;

const requiredEnv = ["DB_HOST", "DB_USER", "DB_NAME", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

// Initialize schema asynchronously without blocking server startup
async function initializeSchema() {
  try {
    if (typeof ensureSchema === "function") {
      await ensureSchema();
      console.log("✓ Database schema initialized");
    }
  } catch (error) {
    console.warn(`⚠ Schema initialization failed: ${error.message}`);
    console.warn("Server will continue running. Database tables may be missing.");
    // Retry schema initialization after 30 seconds
    setTimeout(initializeSchema, 30000);
  }
}

(async () => {
  try {
    // Start schema initialization in background
    initializeSchema().catch(error => {
      console.warn(`Background schema init error: ${error.message}`);
    });

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

    server.listen(PORT, () => {
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