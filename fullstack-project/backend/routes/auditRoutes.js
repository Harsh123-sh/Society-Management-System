const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { resolveBuilderContext, resolveSocietyContext } = require("../middleware/multiTenantMiddleware");

// All audit endpoints require authentication
router.use(authenticateToken);

// List audit logs
router.get(
  "/",
  resolveBuilderContext,
  resolveSocietyContext,
  auditController.getAuditLogs
);

// Get activity summary
router.get(
  "/summary",
  resolveBuilderContext,
  resolveSocietyContext,
  auditController.getActivitySummary
);

// Get specific audit log
router.get(
  "/:id",
  resolveBuilderContext,
  resolveSocietyContext,
  auditController.getAuditLogById
);

module.exports = router;
