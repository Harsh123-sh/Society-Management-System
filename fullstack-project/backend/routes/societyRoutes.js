const express = require("express");
const societyController = require("../controllers/societyController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const { societyValidation } = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);

router.get("/", authorizeRoles("admin", "super_admin"), societyController.getSocieties);
router.post(
  "/",
  authorizeRoles("admin", "super_admin"),
  societyValidation,
  validationMiddleware,
  societyController.createSociety
);

module.exports = router;
