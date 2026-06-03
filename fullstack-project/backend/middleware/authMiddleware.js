const jwt = require("jsonwebtoken");
const societyModel = require("../models/societyModel");

function isTokenExpired(decodedToken) {
  return Boolean(decodedToken?.exp) && Date.now() >= decodedToken.exp * 1000;
}

async function authenticateToken(req, res, next) {
  if (!process.env.JWT_SECRET) {
    console.error("[authMiddleware] JWT_SECRET is not configured");
    return res.status(500).json({
      success: false,
      message: "Server authentication is not configured",
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[authMiddleware] missing or malformed Authorization header", {
      authorizationHeader: authHeader,
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({
      success: false,
      message: "Access token missing",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[authMiddleware] token decoded", {
      userId: decoded?.id,
      email: decoded?.email,
      role: decoded?.role,
      status: decoded?.status,
      societyId: decoded?.societyId,
    });

    if (isTokenExpired(decoded)) {
      console.warn("[authMiddleware] token expired", { userId: decoded?.id, email: decoded?.email });
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    if (decoded.status && decoded.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          decoded.status === "rejected"
            ? "Account is rejected"
            : decoded.status === "inactive"
              ? "Account is inactive"
              : "Account is not approved yet",
      });
    }

    if (decoded.role !== "super_admin" && decoded.societyId) {
      const society = await societyModel.getSocietyById(decoded.societyId);
      console.log("[authMiddleware] society lookup", { societyId: decoded.societyId, societyStatus: society?.status });
      if (!society || society.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "This society is no longer active",
        });
      }
    }

    req.user = decoded;
    // Normalize token fields so downstream middleware sees a consistent shape.
    if (decoded.societyId && !req.user.society_id) {
      req.user.society_id = decoded.societyId;
    }
    if (decoded.society_id && !req.user.societyId) {
      req.user.societyId = decoded.society_id;
    }
    if (decoded.builderId && !req.user.builder_id) {
      req.user.builder_id = decoded.builderId;
    }
    if (decoded.builder_id && !req.user.builderId) {
      req.user.builderId = decoded.builder_id;
    }
    return next();
  } catch (error) {
    console.error("[authMiddleware] token verification failed", {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
    });
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

module.exports = {
  authenticateToken,
};
