const express = require("express");
const structureController = require("../controllers/societyStructureController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "secretary", "super_admin"));

router.get("/tree", structureController.getSocietyStructure);
router.get("/towers", structureController.listTowers);
router.post("/towers", structureController.createTower);
router.put("/towers/:id", structureController.updateTower);
router.delete("/towers/:id", structureController.deleteTower);

router.get("/wings", structureController.listWings);
router.post("/wings", structureController.createWing);
router.put("/wings/:id", structureController.updateWing);
router.delete("/wings/:id", structureController.deleteWing);

router.get("/floors", structureController.listFloors);
router.post("/floors", structureController.createFloor);
router.put("/floors/:id", structureController.updateFloor);
router.delete("/floors/:id", structureController.deleteFloor);

router.get("/flats", structureController.listFlats);
router.post("/flats", structureController.createFlat);
router.post("/flats/generate", structureController.generateFlats);
router.put("/flats/:id", structureController.updateFlat);
router.delete("/flats/:id", structureController.deleteFlat);

router.get("/gates", structureController.listGates);
router.post("/gates", structureController.createGate);
router.put("/gates/:id", structureController.updateGate);
router.delete("/gates/:id", structureController.deleteGate);

module.exports = router;
