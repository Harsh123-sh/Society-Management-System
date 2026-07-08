const express = require("express");
const userApprovalController = require("../controllers/userApprovalController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.get("/pending", userApprovalController.getChairmanPendingApprovals);
router.post("/:approvalId/approve", userApprovalController.approveChairmanApproval);
router.post("/:approvalId/reject", userApprovalController.rejectChairmanApproval);

module.exports = router;
