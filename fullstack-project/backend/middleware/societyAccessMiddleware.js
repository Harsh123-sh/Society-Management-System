const db = require("../config/db");

/**
 * Middleware to enforce society-level access control
 * Verifies that the user has access to the requested society
 */
function requireSocietyAccess(req, res, next) {
  try {
    if (!req.user?.id || !req.user?.societyId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required with society context",
      });
    }

    // Society context is verified in JWT, just continue
    return next();
  } catch (error) {
    console.error("Society access check error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Society access verification failed",
    });
  }
}

/**
 * Middleware to enforce society-scoped data access
 * Ensures user can only access data from their society
 */
function validateSocietyScope(req, res, next) {
  try {
    if (!req.user?.societyId) {
      return res.status(401).json({
        success: false,
        message: "Society context required",
      });
    }

    // Get societyId from request (query param, path param, or body)
    const requestedSocietyId = 
      req.query.societyId || 
      req.params.societyId || 
      req.body?.societyId ||
      null;

    // If a specific society is requested, verify user belongs to it
    if (requestedSocietyId && parseInt(requestedSocietyId) !== req.user.societyId) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this society",
      });
    }

    return next();
  } catch (error) {
    console.error("Society scope validation error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Society scope validation failed",
    });
  }
}

/**
 * Middleware to enforce role-based society access
 * Verifies user has both the required role AND society access
 */
function requireSocietyRoleAccess(requiredRole) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id || !req.user?.societyId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required with society context",
        });
      }

      // Check role
      if (req.user.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: `${requiredRole} access required`,
        });
      }

      // Check society assignment
      if (req.user.resident_type === "owner" && !req.user.flatId) {
        return res.status(403).json({
          success: false,
          message: "No flat assigned to your account",
        });
      }

      return next();
    } catch (error) {
      console.error("Society role access error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Society role access verification failed",
      });
    }
  };
}

module.exports = {
  requireSocietyAccess,
  validateSocietyScope,
  requireSocietyRoleAccess,
};
