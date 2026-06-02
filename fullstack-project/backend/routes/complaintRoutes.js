const express = require("express");
const complaintController = require("../controllers/complaintController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const {
  raiseComplaintValidation,
  complaintListQueryValidation,
  updateComplaintStatusValidation,
  archiveDeleteValidation,
  addCommentValidation,
} = require("../validators/requestValidators");

const router = express.Router();

router.use(authenticateToken);

router.post(
  "/",
  authorizeRoles("resident"),
  raiseComplaintValidation,
  validationMiddleware,
  complaintController.raiseComplaint
);
router.get("/my", complaintListQueryValidation, validationMiddleware, complaintController.getMyComplaints);
router.get(
  "/",
  authorizeRoles("admin", "secretary", "staff"),
  complaintListQueryValidation,
  validationMiddleware,
  complaintController.getAllComplaints
);
router.patch(
  "/:id/status",
  authorizeRoles("admin", "secretary", "staff"),
  updateComplaintStatusValidation,
  validationMiddleware,
  complaintController.updateComplaintStatus
);
router.post(
  "/:id/archive",
  authorizeRoles("admin", "secretary", "super_admin"),
  complaintController.archiveComplaint
);
router.post(
  "/:id/restore",
  authorizeRoles("admin", "secretary", "super_admin"),
  complaintController.restoreComplaint
);
router.delete(
  "/:id",
  authorizeRoles("super_admin"),
  archiveDeleteValidation,
  validationMiddleware,
  complaintController.deleteComplaint
);
router.post("/:id/comments", addCommentValidation, validationMiddleware, complaintController.addComment);

module.exports = router;
