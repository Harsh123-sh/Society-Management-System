const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

const ANALYTICS_ROLES = ["admin", "secretary", "accountant", "super_admin"];

// Legacy endpoints
router.get("/overview", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getOverviewStats);
router.get("/owner-dashboard", authorizeRoles("resident"), analyticsController.getOwnerDashboard);

// Analytics Endpoints (all require admin/secretary role)
router.get("/visitor", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getVisitorAnalyticsDash);
router.get("/financial", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getFinancialAnalyticsDash);
router.get("/complaint", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getComplaintAnalyticsDash);
router.get("/chat", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getChatAnalyticsDash);
router.get("/payment", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getPaymentAnalyticsDash);
router.get("/ai", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getAIAnalyticsDash);
router.get("/staff-performance", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getStaffPerformanceDash);
router.get("/security", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getSecurityAnalyticsDash);
router.get("/all", authorizeRoles(...ANALYTICS_ROLES), analyticsController.getAllAnalytics);

// Export endpoint
router.get("/export", authorizeRoles(...ANALYTICS_ROLES), analyticsController.exportAnalytics);

module.exports = router;
