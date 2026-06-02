const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireSocietyAccess } = require("../middleware/societyAccessMiddleware");
const { resolveBuilderContext, resolveSocietyContext } = require("../middleware/multiTenantMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");

// Super Admin Dashboard
router.get(
  "/super-admin",
  authenticateToken,
  requireRole("super_admin"),
  dashboardController.getSuperAdminDashboard
);

// Builder Admin Dashboard
router.get(
  "/builder",
  authenticateToken,
  resolveBuilderContext,
  dashboardController.getBuilderDashboard
);

// Society Admin Dashboard
router.get(
  "/society",
  authenticateToken,
  resolveSocietyContext,
  dashboardController.getSocietyDashboard
);

// Owner Dashboard
router.get(
  "/owner",
  authenticateToken,
  requireSocietyAccess,
  requireRole("resident"),
  dashboardController.getOwnerDashboard
);

// Tenant Dashboard
router.get(
  "/tenant",
  authenticateToken,
  requireSocietyAccess,
  requireRole("resident"),
  dashboardController.getTenantDashboard
);

// Security/Guard Dashboard
router.get(
  "/security",
  authenticateToken,
  requireSocietyAccess,
  requireRole("security"),
  dashboardController.getSecurityDashboard
);

module.exports = router;
