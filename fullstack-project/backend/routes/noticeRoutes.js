const express = require("express");
const noticeController = require("../controllers/noticeController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const { createNoticeValidation, archiveDeleteValidation } = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("admin", "secretary"),
  createNoticeValidation,
  validationMiddleware,
  noticeController.createNotice
);
router.get("/", authorizeRoles("admin", "secretary", "staff", "resident"), noticeController.getNotices);
router.post("/:id/archive", authorizeRoles("admin", "secretary", "super_admin"), noticeController.archiveNotice);
router.post("/:id/restore", authorizeRoles("admin", "secretary", "super_admin"), noticeController.restoreNotice);
router.delete(
  "/:id",
  authorizeRoles("super_admin"),
  archiveDeleteValidation,
  validationMiddleware,
  noticeController.deleteNotice
);

module.exports = router;
