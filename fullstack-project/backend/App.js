const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const db = require("./db");
const authRoutes = require("./routes/authRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const billRoutes = require("./routes/billRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const archiveRoutes = require("./routes/archiveRoutes");
const visitorRoutes = require("./routes/visitorRoutes");
const flatRoutes = require("./routes/flatRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const documentRoutes = require("./routes/documentRoutes");
const societyRoutes = require("./routes/societyRoutes");
const securityRoutes = require("./routes/securityRoutes");
const chatRoutes = require("./routes/chatRoutes");
const parkingRoutes = require("./routes/parkingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const themeRoutes = require("./routes/themeRoutes");
const aiRoutes = require("./routes/aiRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const wingRoutes = require("./routes/wingRoutes");
const towerRoutes = require("./routes/towerRoutes");
const publicWingRoutes = require("./routes/publicWingRoutes");
const publicSocietyRoutes = require("./routes/publicSocietyRoutes");
const builderRoutes = require("./routes/builderRoutes");
const structureRoutes = require("./routes/structureRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditRoutes = require("./routes/auditRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");
const { resolveTenantContext } = require("./middleware/tenantMiddleware");

const app = express();
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "10mb";

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function isLocalDevOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try later",
  },
});

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(helmet());
app.use(hpp());
app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin))
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", apiLimiter);
app.use(resolveTenantContext);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/societies", societyRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/themes", themeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/wings", wingRoutes);
app.use("/api/towers", towerRoutes);
app.use("/api/public/wings", publicWingRoutes);
app.use("/api/public", publicSocietyRoutes);
app.use("/api/builders", builderRoutes);
app.use("/api/builders", builderRoutes);
app.use("/api/structure", structureRoutes);
app.use("/api/dashboards", dashboardRoutes);
app.use("/api/dashboards", dashboardRoutes);
app.use("/api/audit", auditRoutes);

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/api/test", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT 1 + 1 AS result");
    res.json({
      success: true,
      message: "API and database are working",
      data: rows[0],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Database query failed",
    });
  }
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;