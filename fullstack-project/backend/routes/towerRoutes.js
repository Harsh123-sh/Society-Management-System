const express = require("express");
const towerController = require("../controllers/towerController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "secretary"));

router.get("/", towerController.getTowers);
router.post("/", towerController.createTower);
router.post("/:id/generate", towerController.generateFlats);
router.post("/bulk/archive", towerController.bulkArchiveFlats);
router.post("/bulk/delete", towerController.bulkDeleteFlats);

module.exports = router;
