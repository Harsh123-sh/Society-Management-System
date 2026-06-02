const express = require("express");
const bookingController = require("../controllers/bookingController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/stats", authenticateToken, bookingController.getStats);
router.get("/", authenticateToken, bookingController.getBookings);
router.get("/:id", authenticateToken, bookingController.getBooking);
router.post("/", authenticateToken, bookingController.createBooking);
router.patch("/:id", authenticateToken, bookingController.updateBooking);
router.patch("/:id/approve", authenticateToken, authorizeRoles("admin", "secretary"), bookingController.approveBooking);
router.patch("/:id/reject", authenticateToken, authorizeRoles("admin", "secretary"), bookingController.rejectBooking);
router.patch("/:id/cancel", authenticateToken, bookingController.cancelBooking);
router.delete("/:id", authenticateToken, authorizeRoles("admin", "secretary"), bookingController.deleteBooking);

module.exports = router;