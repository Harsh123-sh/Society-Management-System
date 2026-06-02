const express = require("express");
const parkingController = require("../controllers/parkingController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all parking slots (available, assigned, etc)
router.get("/", authenticateToken, parkingController.getSlots);

// Get parking statistics
router.get("/stats", authenticateToken, parkingController.getStatistics);

// Get specific parking slot
router.get("/:id", authenticateToken, parkingController.getSlot);

// Create new parking slot (admin only)
router.post("/", authenticateToken, authorizeRoles("admin"), parkingController.createSlot);

// Update parking slot (admin only)
router.patch("/:id", authenticateToken, authorizeRoles("admin"), parkingController.updateSlot);

// Assign parking slot to user (admin only)
router.post("/:id/assign", authenticateToken, authorizeRoles("admin"), parkingController.assignSlot);

// Release parking slot (admin only)
router.post("/:id/release", authenticateToken, authorizeRoles("admin"), parkingController.releaseSlot);

// Delete parking slot (admin only)
router.delete("/:id", authenticateToken, authorizeRoles("admin"), parkingController.deleteSlot);

module.exports = router;