const express = require("express");
const structureController = require("../controllers/societyStructureController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("resident", "owner", "tenant"));

router.get("/profile-status", structureController.profileStatus);
router.get("/society-structure/:societyCode", structureController.residentStructure);
router.post("/profile-completion", structureController.submitResidenceRequest);
router.post("/residence-request", structureController.submitResidenceRequest);

module.exports = router;
