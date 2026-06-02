const express = require("express");
const themeController = require("../controllers/themeController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { resolveTenantContext } = require("../middleware/tenantMiddleware");

const router = express.Router();

// Existing routes
router.get("/societies", authenticateToken, authorizeRoles("super_admin", "admin"), themeController.listThemes);
router.get("/current", authenticateToken, resolveTenantContext, themeController.getCurrentTheme);
router.patch("/:id", authenticateToken, authorizeRoles("super_admin", "admin"), themeController.updateTheme);
router.post("/generate", authenticateToken, authorizeRoles("super_admin", "admin"), themeController.generateTheme);

// New comprehensive white-label theme routes
// Get available theme presets
router.get("/presets/list", themeController.getThemePresets);

// Get my society's current theme
router.get("/my-theme", authenticateToken, themeController.getMyTheme);

// Get theme by subdomain (public route)
router.get("/subdomain/:subdomain", themeController.getThemeBySubdomain);

// Apply preset theme to society
router.post("/:societyId/preset", authenticateToken, authorizeRoles("admin", "super_admin"), themeController.applyPresetTheme);

// Validate theme for accessibility
router.post("/validate/accessibility", themeController.validateThemeAccessibility);

// Export theme as CSS variables
router.get("/:societyId/export-css", themeController.exportThemeCSS);

module.exports = router;
