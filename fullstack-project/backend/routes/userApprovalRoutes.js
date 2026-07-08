const express = require("express");
const userApprovalController = require("../controllers/userApprovalController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/pending", userApprovalController.getCurrentUserPendingApprovals);
router.post("/:approvalId/approve", userApprovalController.approveCurrentUserApproval);
router.post("/:approvalId/reject", userApprovalController.rejectCurrentUserApproval);
router.get("/:societyId/pending", userApprovalController.getPendingApprovals);
router.get("/:societyId/stats", userApprovalController.getApprovalStats);
router.post("/:societyId/:approvalId/approve", userApprovalController.approveUser);
router.post("/:societyId/:approvalId/reject", userApprovalController.rejectUser);
router.post("/:societyId/bulk-approve", userApprovalController.bulkApproveUsers);

module.exports = router;
