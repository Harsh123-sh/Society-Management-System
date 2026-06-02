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

module.exports = router;
