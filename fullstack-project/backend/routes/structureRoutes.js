const express = require("express");
const router = express.Router();
const structureController = require("../controllers/structureController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { resolveSocietyContext, requireSocietyContext } = require("../middleware/multiTenantMiddleware");

// All routes require authentication and society context
router.use(authenticateToken);
router.use(resolveSocietyContext);
router.use(requireSocietyContext);

// ============ TOWERS ============
router.get("/towers", structureController.listTowers);
router.post("/towers", structureController.createTower);
router.put("/towers/:id", structureController.updateTower);
router.delete("/towers/:id", structureController.deleteTower);

// ============ BLOCKS ============
router.get("/blocks", structureController.listBlocks);
router.post("/blocks", structureController.createBlock);

// ============ FLOORS ============
router.get("/floors", structureController.listFloors);
router.post("/floors", structureController.createFloor);

// ============ COMPLETE TREE ============
router.get("/tree", structureController.getStructureTree);

module.exports = router;
