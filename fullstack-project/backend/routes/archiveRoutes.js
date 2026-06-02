const express = require("express");
const archiveController = require("../controllers/archiveController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("admin", "secretary", "super_admin"));

router.get("/center", archiveController.getArchiveCenter);
router.patch("/retention/:resourceType", archiveController.updateRetentionRule);

module.exports = router;
