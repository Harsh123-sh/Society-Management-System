const rbacModel = require("../models/rbacModel");

/**
 * Check if user has specific permission
 * Middleware factory function
 */
function requirePermission(resource, action) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const hasPermission = await rbacModel.hasPermission(req.user.id, resource, action);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied: ${resource}/${action}`,
        });
      }

      return next();
    } catch (error) {
      console.error("Permission check error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Permission check failed",
      });
    }
  };
}

/**
 * Check if user has any of the specified roles
 */
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.user?.role) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(", ")}`,
        });
      }

      return next();
    } catch (error) {
      console.error("Role check error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Role check failed",
      });
    }
  };
}

/**
 * Load user permissions into request context
 */
async function loadUserPermissions(req, _res, next) {
  try {
    if (!req.user?.id) {
      return next();
    }

    const permissions = await rbacModel.getUserPermissions(req.user.id);
    req.userPermissions = permissions.map(p => `${p.resource}:${p.action}`);
    
    return next();
  } catch (error) {
    console.error("Load permissions error:", error.message);
    return next(error);
  }
}

/**
 * Check if user has specific permission (helper)
 */
function userHasPermission(req, resource, action) {
  if (!req.userPermissions) {
    return false;
  }
  return req.userPermissions.includes(`${resource}:${action}`);
}

module.exports = {
  requirePermission,
  requireRole,
  loadUserPermissions,
  userHasPermission,
};
