const express = require("express");
const tenantController = require("../controllers/tenantController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { resolveTenantContext, requireTenantContext } = require("../middleware/tenantMiddleware");

const router = express.Router();

router.get("/current", resolveTenantContext, requireTenantContext, tenantController.getCurrentTenant);
router.get("/dashboard", authenticateToken, authorizeRoles("super_admin"), tenantController.getDashboardOverview);
router.get("/", authenticateToken, authorizeRoles("super_admin"), tenantController.listSocieties);
router.post("/onboard", authenticateToken, authorizeRoles("super_admin"), tenantController.onboardSociety);
router.get("/:id/analytics", authenticateToken, authorizeRoles("super_admin", "admin"), tenantController.getSocietyAnalytics);
router.patch("/:id/branding", authenticateToken, authorizeRoles("super_admin", "admin"), tenantController.updateBranding);
router.patch("/:code/branding-by-code", authenticateToken, authorizeRoles("super_admin", "admin"), tenantController.updateBrandingByCode);
router.patch("/:id/settings", authenticateToken, authorizeRoles("super_admin", "admin"), tenantController.updateSettings);
router.patch("/:id/subscription", authenticateToken, authorizeRoles("super_admin"), tenantController.updateSubscription);
router.patch("/:id/modules/:moduleKey", authenticateToken, authorizeRoles("super_admin", "admin"), tenantController.toggleModule);

module.exports = router;