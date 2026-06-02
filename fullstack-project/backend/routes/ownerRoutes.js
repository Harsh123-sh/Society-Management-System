const express = require("express");
const ownerController = require("../controllers/ownerController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { idParamValidation } = require("../validators/requestValidators");
const validationMiddleware = require("../middleware/validationMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/", authorizeRoles("admin", "secretary"), ownerController.listOwners);
router.get("/:id/properties", authorizeRoles("admin", "secretary"), idParamValidation, validationMiddleware, ownerController.getOwnerProperties);
router.post("/:id/properties", authorizeRoles("admin", "secretary"), idParamValidation, validationMiddleware, ownerController.assignOwnerToFlat);
router.delete("/:id/properties/:propertyId", authorizeRoles("admin", "secretary"), idParamValidation, validationMiddleware, ownerController.removeOwnerProperty);

module.exports = router;
