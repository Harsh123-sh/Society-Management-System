const express = require("express");
const structureController = require("../controllers/societyStructureController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "chairman", "secretary"));

router.get("/", structureController.listResidenceRequests);
router.post("/:id/approve", structureController.approveResidenceRequest);
router.post("/:id/reject", structureController.rejectResidenceRequest);

module.exports = router;
