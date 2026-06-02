const express = require("express");
const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", authenticateToken, notificationController.getNotifications);
router.post("/", authenticateToken, authorizeRoles("admin", "secretary", "staff"), notificationController.createNotification);
router.patch("/:id/read", authenticateToken, notificationController.markAsRead);

router.post("/devices/register", authenticateToken, notificationController.registerDeviceToken);
router.delete("/devices/:token", authenticateToken, notificationController.unregisterDeviceToken);

router.post("/web-subscriptions", authenticateToken, notificationController.registerWebSubscription);
router.delete("/web-subscriptions", authenticateToken, notificationController.unregisterWebSubscription);

router.post("/push/send", authenticateToken, authorizeRoles("admin", "secretary", "staff", "security"), notificationController.sendPushAlert);

router.post("/events", authenticateToken, authorizeRoles("admin", "secretary", "staff"), notificationController.createEventReminder);
router.post("/events/dispatch", authenticateToken, authorizeRoles("admin", "secretary", "staff"), notificationController.dispatchEventReminders);

module.exports = router;