const auditModel = require("../models/auditModel");

/**
 * Get audit logs (filtered based on user role and context)
 */
async function getAuditLogs(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    // Build filters based on user context and role
    const filters = {
      limit,
      offset,
    };

    if (req.user?.role === "super_admin") {
      // Super admin can see all audit logs
      if (req.query.builderId) {
        filters.builderId = Number(req.query.builderId);
      }
      if (req.query.societyId) {
        filters.societyId = Number(req.query.societyId);
      }
    } else if (req.builder) {
      // Builder admin can see only their builder's logs
      filters.builderId = req.builder.id;
      if (req.query.societyId) {
        filters.societyId = Number(req.query.societyId);
      }
    } else if (req.society) {
      // Society admin can see only their society's logs
      filters.builderId = req.society.builderId;
      filters.societyId = req.society.id;
    } else if (req.user?.role === "resident") {
      // Residents can only see their own activities
      filters.userId = req.user.id;
    } else {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    // Apply additional filters if provided
    if (req.query.action) {
      filters.action = req.query.action;
    }
    if (req.query.resourceType) {
      filters.resourceType = req.query.resourceType;
    }
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const logs = await auditModel.getAuditLogs(filters);
    const count = await auditModel.getAuditLogCount(filters);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Get activity summary
 */
async function getActivitySummary(req, res) {
  try {
    const hours = Number(req.query.hours) || 24;

    // Build filters based on user context
    let builderId = null;
    let societyId = null;

    if (req.user?.role === "super_admin") {
      if (req.query.builderId) {
        builderId = Number(req.query.builderId);
      }
    } else if (req.builder) {
      builderId = req.builder.id;
    } else if (req.society) {
      builderId = req.society.builderId;
      societyId = req.society.id;
    } else {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    const summary = await auditModel.getActivitySummary(builderId, societyId, hours);

    return res.json({
      success: true,
      data: summary,
      filters: { hours, builderId, societyId },
    });
  } catch (error) {
    console.error("Get activity summary error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Get specific audit log
 */
async function getAuditLogById(req, res) {
  try {
    const auditId = Number(req.params.id);
    const log = await auditModel.getAuditLogById(auditId);

    if (!log) {
      return res.status(404).json({ success: false, message: "Audit log not found" });
    }

    // Check permissions
    if (req.user?.role !== "super_admin") {
      if (req.builder && log.builder_id !== req.builder.id) {
        return res.status(403).json({ success: false, message: "Insufficient permissions" });
      }
      if (req.society && log.society_id !== req.society.id) {
        return res.status(403).json({ success: false, message: "Insufficient permissions" });
      }
      if (req.user?.role === "resident" && log.user_id !== req.user.id) {
        return res.status(403).json({ success: false, message: "Insufficient permissions" });
      }
    }

    return res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    console.error("Get audit log error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getAuditLogs,
  getActivitySummary,
  getAuditLogById,
};
