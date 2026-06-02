const express = require("express");
const analyticsController = require("../controllers/analyticsController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);

// Legacy endpoints
router.get("/overview", authorizeRoles("admin", "secretary"), analyticsController.getOverviewStats);
router.get("/owner-dashboard", authorizeRoles("resident"), analyticsController.getOwnerDashboard);

// Analytics Endpoints (all require admin/secretary role)
router.get("/visitor", authorizeRoles("admin", "secretary"), analyticsController.getVisitorAnalyticsDash);
router.get("/financial", authorizeRoles("admin", "secretary"), analyticsController.getFinancialAnalyticsDash);
router.get("/complaint", authorizeRoles("admin", "secretary"), analyticsController.getComplaintAnalyticsDash);
router.get("/chat", authorizeRoles("admin", "secretary"), analyticsController.getChatAnalyticsDash);
router.get("/payment", authorizeRoles("admin", "secretary"), analyticsController.getPaymentAnalyticsDash);
router.get("/ai", authorizeRoles("admin", "secretary"), analyticsController.getAIAnalyticsDash);
router.get("/staff-performance", authorizeRoles("admin", "secretary"), analyticsController.getStaffPerformanceDash);
router.get("/security", authorizeRoles("admin", "secretary"), analyticsController.getSecurityAnalyticsDash);
router.get("/all", authorizeRoles("admin", "secretary"), analyticsController.getAllAnalytics);

// Export endpoint
router.get("/export", authorizeRoles("admin", "secretary"), analyticsController.exportAnalytics);

module.exports = router;
