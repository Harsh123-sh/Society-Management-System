const express = require("express");
const visitorController = require("../controllers/visitorController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const {
  addVisitorEntryValidation,
  ownerVisitorPreapprovalValidation,
  idParamValidation,
} = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);

router.post("/", authorizeRoles("security"), addVisitorEntryValidation, validationMiddleware, visitorController.addVisitorEntry);
router.patch("/:id/exit", authorizeRoles("security"), idParamValidation, validationMiddleware, visitorController.updateVisitorExit);
router.get("/", authorizeRoles("security", "admin", "secretary"), visitorController.getVisitorLogs);
router.get("/history", authorizeRoles("security", "admin", "secretary", "resident"), visitorController.getVisitorHistory);
router.get("/dashboard", authorizeRoles("security", "admin", "secretary"), visitorController.getVisitorDashboard);
router.get("/analytics", authorizeRoles("security", "admin", "secretary"), visitorController.getVisitorAnalytics);

router.post("/owner/preapprovals", authorizeRoles("resident"), ownerVisitorPreapprovalValidation, validationMiddleware, visitorController.createOwnerPreapproval);
router.get("/owner/preapprovals", authorizeRoles("resident"), visitorController.getOwnerPreapprovals);
router.patch("/owner/preapprovals/:id/approve", authorizeRoles("resident"), idParamValidation, validationMiddleware, visitorController.approveOwnerPreapproval);
router.patch("/owner/preapprovals/:id/reject", authorizeRoles("resident"), idParamValidation, validationMiddleware, visitorController.rejectOwnerPreapproval);
router.patch("/owner/preapprovals/:id/cancel", authorizeRoles("resident"), idParamValidation, validationMiddleware, visitorController.rejectOwnerPreapproval);
router.post("/owner/preapprovals/:id/qr-pass", authorizeRoles("security", "admin", "secretary", "resident"), idParamValidation, validationMiddleware, visitorController.issueQrPass);
router.post("/owner/preapprovals/:id/otp/send", authorizeRoles("security", "admin", "secretary", "resident"), idParamValidation, validationMiddleware, visitorController.sendOtp);
router.post("/owner/preapprovals/:id/otp/verify", authorizeRoles("security", "admin", "secretary", "resident"), idParamValidation, validationMiddleware, visitorController.verifyOtp);

// Security management endpoints
router.get("/preapprovals", authorizeRoles("security", "admin", "secretary"), visitorController.listSecurityPreapprovals);
router.patch("/preapprovals/:id/status", authorizeRoles("security", "admin", "secretary"), idParamValidation, validationMiddleware, visitorController.updatePreapprovalStatusBySecurity);
router.post("/preapprovals/:id/checkin", authorizeRoles("security", "admin", "secretary"), idParamValidation, validationMiddleware, visitorController.checkInFromPreapproval);
router.post("/preapprovals/verify-qr", authorizeRoles("security", "admin", "secretary"), validationMiddleware, visitorController.verifyQrToken);

router.post("/faces/recognize", authorizeRoles("security", "admin", "secretary"), visitorController.recognizeFace);
router.post("/blacklist", authorizeRoles("security", "admin", "secretary"), visitorController.addBlacklist);

router.post("/vehicles", authorizeRoles("security", "admin"), visitorController.createVehicleEntry);
router.get("/vehicles", authorizeRoles("security", "admin", "secretary"), visitorController.listVehicleEntries);

router.post("/deliveries", authorizeRoles("security", "admin"), visitorController.createDeliveryEntry);
router.get("/deliveries", authorizeRoles("security", "admin", "secretary"), visitorController.listDeliveryEntries);

router.post("/emergency-alerts", authorizeRoles("security", "admin", "secretary", "staff"), visitorController.createEmergencyAlert);
router.get("/emergency-alerts", authorizeRoles("security", "admin", "secretary", "staff"), visitorController.listEmergencyAlerts);
router.patch("/emergency-alerts/:id/acknowledge", authorizeRoles("security", "admin", "secretary", "staff"), idParamValidation, validationMiddleware, visitorController.acknowledgeEmergencyAlert);
router.patch("/emergency-alerts/:id/resolve", authorizeRoles("security", "admin", "secretary"), idParamValidation, validationMiddleware, visitorController.resolveEmergencyAlert);

module.exports = router;
