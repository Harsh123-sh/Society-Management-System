const express = require("express");
const structureController = require("../controllers/societyStructureController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "secretary", "super_admin"));

router.get("/", structureController.listFloors);
router.get("/:floorId/flats", structureController.listFlats);
router.post("/", structureController.createFloor);
router.put("/:id", structureController.updateFloor);
router.delete("/:id", structureController.deleteFloor);

module.exports = router;
