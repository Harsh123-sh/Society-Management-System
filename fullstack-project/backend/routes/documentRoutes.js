const express = require("express");
const documentController = require("../controllers/documentController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const { documentReviewValidation } = require("../validators/requestValidators");
const { uploadDocument } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/upload",
  authorizeRoles("resident"),
  uploadDocument.single("file"),
  documentController.uploadDocument
);

router.get("/my", authorizeRoles("resident"), documentController.getMyDocuments);
router.get(
  "/history/:id",
  authorizeRoles("resident", "admin", "secretary"),
  validationMiddleware,
  documentController.getDocumentHistory
);

router.get(
  "/",
  authorizeRoles("admin", "secretary"),
  documentController.getAllDocuments
);

router.patch(
  "/:id/review",
  authorizeRoles("admin", "secretary"),
  documentReviewValidation,
  validationMiddleware,
  documentController.reviewDocument
);

router.delete(
  "/:id",
  authorizeRoles("resident", "admin", "secretary"),
  validationMiddleware,
  documentController.softDeleteDocument
);

router.patch(
  "/:id/restore",
  authorizeRoles("admin", "secretary"),
  validationMiddleware,
  documentController.restoreDocument
);

router.delete(
  "/:id/permanent",
  authorizeRoles("admin"),
  validationMiddleware,
  documentController.permanentlyDeleteDocument
);

module.exports = router;
