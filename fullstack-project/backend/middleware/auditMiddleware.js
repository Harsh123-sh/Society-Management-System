const auditModel = require("../models/auditModel");

/**
 * Audit middleware factory
 * Automatically logs HTTP requests to audit trail
 */
function auditAction(resourceType, action) {
  return async (req, _res, next) => {
    try {
      // Store audit info in request for later use
      req.audit = {
        resourceType,
        action,
        startTime: Date.now(),
        userId: req.user?.id || null,
        builderId: req.user?.builder_id || null,
        societyId: req.user?.society_id || null,
      };

      // Capture original response json method
      const originalJson = res.json;
      
      res.json = function (data) {
        try {
          const duration = Date.now() - req.audit.startTime;
          
          // Extract resource ID from request
          let resourceId = null;
          if (req.params.id) {
            resourceId = req.params.id;
          } else if (req.body?.id) {
            resourceId = req.body.id;
          }

          // Determine status
          const status = data?.success !== false ? "success" : "error";

          // Log async (don't wait for it)
          auditModel.createAuditLog({
            userId: req.audit.userId,
            action: req.audit.action,
            resourceType: req.audit.resourceType,
            resourceId: resourceId,
            details: {
              method: req.method,
              path: req.path,
              duration: `${duration}ms`,
              responseCode: res.statusCode,
            },
            oldValues: req.audit.oldValues || null,
            newValues: req.audit.newValues || null,
            status: status,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get("user-agent") || null,
            societyId: req.audit.societyId,
            builderId: req.audit.builderId,
          }).catch(err => {
            console.error("Audit logging failed:", err.message);
          });
        } catch (error) {
          console.error("Audit middleware error:", error.message);
        }

        // Call original json method
        return originalJson.call(this, data);
      };

      return next();
    } catch (error) {
      console.error("Audit setup error:", error.message);
      return next(error);
    }
  };
}

/**
 * Manual audit log creation
 * Use this to log important state changes
 */
async function logAudit({
  req,
  action,
  resourceType,
  resourceId,
  oldValues = null,
  newValues = null,
  details = null,
  status = "success",
} = {}) {
  try {
    return await auditModel.createAuditLog({
      userId: req.user?.id || null,
      action,
      resourceType,
      resourceId: resourceId || null,
      details,
      oldValues,
      newValues,
      status,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
      userAgent: req.get("user-agent") || null,
      societyId: req.user?.society_id || null,
      builderId: req.user?.builder_id || null,
    });
  } catch (error) {
    console.error("Manual audit log failed:", error.message);
    return null;
  }
}

module.exports = {
  auditAction,
  logAudit,
};
