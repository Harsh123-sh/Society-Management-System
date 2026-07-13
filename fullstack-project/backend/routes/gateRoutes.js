const express = require("express");
const structureController = require("../controllers/societyStructureController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "secretary", "super_admin"));

router.get("/", structureController.listGates);
router.post("/", structureController.createGate);
router.put("/:id", structureController.updateGate);
router.delete("/:id", structureController.deleteGate);

module.exports = router;
