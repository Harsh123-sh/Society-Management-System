const express = require("express");
const securityController = require("../controllers/securityController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadVisitorPhoto } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get(
  "/profile",
  authorizeRoles("security"),
  securityController.getProfile
);

router.get(
  "/dashboard",
  authorizeRoles("security", "admin", "secretary"),
  securityController.getDashboard
);

// Residents search for guard visitor check-in select box
router.get(
  "/residents/search",
  authorizeRoles("security"),
  securityController.searchResidents
);
router.post("/attendance/check-in", authorizeRoles("security"), securityController.checkIn);
router.post("/attendance/check-out", authorizeRoles("security"), securityController.checkOut);

router.post("/leave-requests", authorizeRoles("security"), securityController.createLeaveRequest);
router.get("/leave-requests/my", authorizeRoles("security"), securityController.getMyLeaveRequests);
router.patch(
  "/leave-requests/:id/review",
  authorizeRoles("admin", "secretary"),
  securityController.reviewLeaveRequest
);

router.get("/shifts/my", authorizeRoles("security"), securityController.getMyShifts);
router.post("/shifts", authorizeRoles("admin", "secretary"), securityController.createShift);

router.get("/holidays", authorizeRoles("security", "admin", "secretary"), securityController.getHolidays);
router.post("/holidays", authorizeRoles("admin", "secretary"), securityController.createHoliday);

router.post("/visitors/check-in", authorizeRoles("security"), uploadVisitorPhoto.single("visitorPhoto"), securityController.checkInVisitor);
router.get("/visitors", authorizeRoles("security", "admin", "secretary"), securityController.listVisitors);
router.post("/visitors/:id/check-out", authorizeRoles("security"), securityController.checkOutVisitor);

router.post("/vehicles/entry", authorizeRoles("security"), securityController.createVehicleEntry);
router.get("/vehicles", authorizeRoles("security", "admin", "secretary"), securityController.listVehicles);

router.post("/deliveries", authorizeRoles("security", "admin"), securityController.createDelivery);
router.get("/deliveries", authorizeRoles("security", "admin", "secretary"), securityController.listDeliveries);
router.patch("/deliveries/:id/status", authorizeRoles("security", "admin"), securityController.updateDeliveryStatus);

router.post("/visitor-requests", authorizeRoles("security", "admin"), securityController.createVisitorRequest);
router.get("/visitor-requests", authorizeRoles("security", "admin", "secretary"), securityController.listVisitorRequests);
router.patch("/visitor-requests/:id/status", authorizeRoles("security", "admin"), securityController.updateVisitorRequestStatus);
router.patch("/visitor-requests/:id/check-in", authorizeRoles("security", "admin"), securityController.markVisitorCheckIn);
router.patch("/visitor-requests/:id/check-out", authorizeRoles("security", "admin"), securityController.markVisitorCheckOut);

router.get("/notifications", authorizeRoles("security", "admin", "secretary", "staff"), securityController.listNotifications);
router.patch("/notifications/:id/read", authorizeRoles("security", "admin", "secretary", "staff"), securityController.markNotificationRead);

router.post("/emergency-alerts", authorizeRoles("security", "admin", "secretary", "staff"), securityController.createEmergencyAlert);
router.get("/emergency-alerts", authorizeRoles("security", "admin", "secretary", "staff"), securityController.listEmergencyAlerts);
router.patch("/emergency-alerts/:id/acknowledge", authorizeRoles("security", "admin", "secretary", "staff"), securityController.acknowledgeEmergencyAlert);
router.patch("/emergency-alerts/:id/resolve", authorizeRoles("security", "admin", "secretary"), securityController.resolveEmergencyAlert);

module.exports = router;
