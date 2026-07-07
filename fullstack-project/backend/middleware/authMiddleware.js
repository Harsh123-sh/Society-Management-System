const jwt = require("jsonwebtoken");
const societyModel = require("../models/societyModel");
const userModel = require("../models/userModel");
const tokenBlacklist = require("../utils/tokenBlacklist");

async function authenticateToken(req, res, next) {
  if (!process.env.JWT_SECRET) {
    console.error("[authMiddleware] JWT_SECRET is not configured");
    return res.status(500).json({ success: false, message: "Server authentication is not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[authMiddleware] missing bearer token", {
        method: req.method,
        path: req.originalUrl || req.path,
      });
    }
    return res.status(401).json({ success: false, message: "Access token missing" });
  }

  const token = authHeader.split(" ")[1];

  // Check blacklist first
  if (tokenBlacklist.isBlacklisted(token)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[authMiddleware] blacklisted token rejected", {
        method: req.method,
        path: req.originalUrl || req.path,
      });
    }
    return res.status(401).json({ success: false, message: "Token revoked" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.token_type && decoded.token_type !== "access") {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[authMiddleware] non-access token rejected", {
          tokenType: decoded.token_type,
          method: req.method,
          path: req.originalUrl || req.path,
        });
      }
      return res.status(401).json({ success: false, message: "Invalid access token" });
    }

    // Verify token user exists in current active database
    const currentUser = await userModel.getUserById(decoded.id);
    if (!currentUser) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[authMiddleware] token user not found in current database", {
          userId: decoded.id,
          email: decoded.email,
          path: req.originalUrl || req.path,
        });
      }
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    if (currentUser.status !== "active") {
      return res.status(403).json({ success: false, message: "Account is not active" });
    }

    // Basic status guard
    if (decoded.status && decoded.status !== "active") {
      const message = decoded.status === "rejected" ? "Account is rejected" : decoded.status === "inactive" ? "Account is inactive" : "Account is not approved yet";
      return res.status(403).json({ success: false, message });
    }

    // If the token carries a society id, ensure society is active
    const societyId = decoded.society_id || decoded.societyId || null;
    const societyCode = decoded.society_code || decoded.societyCode || null;
    if (decoded.role === "staff" && (!societyId || !societyCode)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[authMiddleware] staff token missing society context", {
          userId: decoded.id || decoded.userId || null,
          method: req.method,
          path: req.originalUrl || req.path,
        });
      }
      return res.status(401).json({ success: false, message: "Society access not found. Please login again." });
    }

    if (decoded.role !== "super_admin" && societyId) {
      const society = await societyModel.getSocietyById(societyId);
      if (!society || society.status !== "active") {
        return res.status(403).json({ success: false, message: "This society is no longer active" });
      }
    }

    const requestedSocietyId =
      req.headers["x-society-id"] ||
      req.query?.societyId ||
      req.query?.society_id ||
      req.body?.societyId ||
      req.body?.society_id ||
      null;
    if (decoded.role !== "super_admin" && requestedSocietyId && Number(requestedSocietyId) !== Number(societyId)) {
      return res.status(403).json({ success: false, message: "Access denied for this society" });
    }

    const requestedSocietyCode = req.headers["x-society-code"] || req.query?.societyCode || req.query?.society_code || req.body?.societyCode || req.body?.society_code || null;
    if (
      decoded.role !== "super_admin" &&
      requestedSocietyCode &&
      societyCode &&
      String(requestedSocietyCode).toLowerCase() !== String(societyCode).toLowerCase()
    ) {
      return res.status(403).json({ success: false, message: "Access denied for this society" });
    }

    // Normalize token fields for downstream
    req.user = Object.assign({}, decoded);
    if (decoded.userId && !req.user.id) req.user.id = decoded.userId;
    if (decoded.id && !req.user.userId) req.user.userId = decoded.id;
    if (decoded.society_id && !req.user.societyId) req.user.societyId = decoded.society_id;
    if (decoded.societyId && !req.user.society_id) req.user.society_id = decoded.societyId;
    if (decoded.society_code && !req.user.societyCode) req.user.societyCode = decoded.society_code;
    if (decoded.societyCode && !req.user.society_code) req.user.society_code = decoded.societyCode;
    if (decoded.builder_id && !req.user.builderId) req.user.builderId = decoded.builder_id;
    if (decoded.builderId && !req.user.builder_id) req.user.builder_id = decoded.builderId;
    req.societyId = societyId;
    req.societyCode = societyCode;

    return next();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[authMiddleware] token verification failed", {
        message: error.message,
        method: req.method,
        path: req.originalUrl || req.path,
      });
    }
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

module.exports = {
  authenticateToken,
};
