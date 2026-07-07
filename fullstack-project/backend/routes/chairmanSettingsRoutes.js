const express = require("express");
const chairmanSettingsController = require("../controllers/chairmanSettingsController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { uploadSettingsImage } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles("chairman", "admin", "secretary"));

router.get("/", chairmanSettingsController.getSettings);
router.patch("/profile", chairmanSettingsController.patchProfile);
router.patch("/society", chairmanSettingsController.patchSociety);
router.patch("/notifications", chairmanSettingsController.patchNotifications);
router.patch("/appearance", chairmanSettingsController.patchAppearance);
router.post(
  "/upload/profile-image",
  uploadSettingsImage.single("image"),
  chairmanSettingsController.uploadProfileImage
);
router.post(
  "/upload/society-logo",
  uploadSettingsImage.single("image"),
  chairmanSettingsController.uploadSocietyLogo
);

module.exports = router;
