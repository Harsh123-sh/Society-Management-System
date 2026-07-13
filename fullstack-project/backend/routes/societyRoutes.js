const express = require("express");
const societyController = require("../controllers/societyController");
const structureController = require("../controllers/societyStructureController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const { societyValidation } = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);

router.get("/", authorizeRoles("admin", "super_admin"), societyController.getSocieties);
router.get("/:id/structure", authorizeRoles("admin", "super_admin", "secretary"), structureController.getSocietyStructure);
router.post("/:id/structure", authorizeRoles("admin", "super_admin", "secretary"), structureController.publishSocietyStructure);
router.post(
  "/",
  authorizeRoles("admin", "super_admin"),
  societyValidation,
  validationMiddleware,
  societyController.createSociety
);
router.put("/:id", authorizeRoles("admin", "super_admin"), societyController.updateSociety);
router.get("/:societyId/towers", authorizeRoles("admin", "super_admin", "secretary"), structureController.listTowers);
router.get("/:societyId/gates", authorizeRoles("admin", "super_admin", "secretary"), structureController.listGates);

module.exports = router;
