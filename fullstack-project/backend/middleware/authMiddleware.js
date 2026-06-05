const jwt = require("jsonwebtoken");
const societyModel = require("../models/societyModel");
const tokenBlacklist = require("../utils/tokenBlacklist");

async function authenticateToken(req, res, next) {
  if (!process.env.JWT_SECRET) {
    console.error("[authMiddleware] JWT_SECRET is not configured");
    return res.status(500).json({ success: false, message: "Server authentication is not configured" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access token missing" });
  }

  const token = authHeader.split(" ")[1];

  // Check blacklist first
  if (tokenBlacklist.isBlacklisted(token)) {
    return res.status(401).json({ success: false, message: "Token revoked" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Basic status guard
    if (decoded.status && decoded.status !== "active") {
      const message = decoded.status === "rejected" ? "Account is rejected" : decoded.status === "inactive" ? "Account is inactive" : "Account is not approved yet";
      return res.status(403).json({ success: false, message });
    }

    // If the token carries a society id, ensure society is active
    const societyId = decoded.society_id || decoded.societyId || null;
    if (decoded.role !== "super_admin" && societyId) {
      const society = await societyModel.getSocietyById(societyId);
      if (!society || society.status !== "active") {
        return res.status(403).json({ success: false, message: "This society is no longer active" });
      }
    }

    // Normalize token fields for downstream
    req.user = Object.assign({}, decoded);
    if (decoded.society_id && !req.user.societyId) req.user.societyId = decoded.society_id;
    if (decoded.societyId && !req.user.society_id) req.user.society_id = decoded.societyId;
    if (decoded.builder_id && !req.user.builderId) req.user.builderId = decoded.builder_id;
    if (decoded.builderId && !req.user.builder_id) req.user.builder_id = decoded.builderId;

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

module.exports = {
  authenticateToken,
};
