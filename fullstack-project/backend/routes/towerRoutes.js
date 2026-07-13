const express = require("express");
const structureController = require("../controllers/societyStructureController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "secretary", "super_admin"));

router.get("/", structureController.listTowers);
router.get("/:towerId/wings", structureController.listWings);
router.post("/", structureController.createTower);
router.put("/:id", structureController.updateTower);
router.delete("/:id", structureController.deleteTower);
router.post("/:id/generate", structureController.generateFlats);

module.exports = router;
