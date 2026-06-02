const express = require("express");
const router = express.Router();
const builderController = require("../controllers/builderController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { resolveBuilderContext } = require("../middleware/multiTenantMiddleware");

// Builder profile and dashboard (builder admin routes)
router.get("/profile", authenticateToken, resolveBuilderContext, builderController.getProfile);
router.get("/societies", authenticateToken, resolveBuilderContext, builderController.listSocieties);
router.get("/dashboard", authenticateToken, resolveBuilderContext, builderController.getDashboardOverview);

// Super admin routes
router.get("/all", authenticateToken, builderController.listBuilders);
router.post("/", authenticateToken, builderController.createBuilder);
router.get("/:id", authenticateToken, builderController.getBuilderDetails);
router.put("/:id", authenticateToken, builderController.updateBuilder);

module.exports = router;
