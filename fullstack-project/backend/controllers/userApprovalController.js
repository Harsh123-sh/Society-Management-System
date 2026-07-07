/**
 * User Approval Workflow Controller
 * Handles approval/rejection of new user registrations and KYC verification
 */

const db = require("../config/db");
const UserApprovalModel = require("../models/userApprovalModel");

const CHAIRMAN_ROLES = new Set(["chairman", "admin"]);
const OPERATIONAL_ROLES = new Set(["resident", "staff", "security"]);

function isChairmanRole(role) {
  return CHAIRMAN_ROLES.has(String(role || "").toLowerCase());
}

function isOperationalApproval(user) {
  const role = String(user?.role || "").toLowerCase();
  if (!OPERATIONAL_ROLES.has(role)) return false;
  if (role === "resident") {
    return ["owner", "tenant"].includes(String(user?.resident_type || "").toLowerCase());
  }
  return true;
}

function canSeeApproval(approver, targetUser, societyId) {
  const approverRole = String(approver?.role || "").toLowerCase();
  const sameSociety = Number(approver?.society_id || approver?.societyId) === Number(societyId);

  if (approverRole === "super_admin") {
    return ["chairman", "admin", "secretary"].includes(String(targetUser?.role || "").toLowerCase());
  }

  if (!sameSociety) return false;

  if (isChairmanRole(approverRole)) {
    return String(targetUser?.role || "").toLowerCase() === "secretary" || isOperationalApproval(targetUser);
  }

  if (approverRole === "secretary") {
    return isOperationalApproval(targetUser);
  }

  return false;
}

function getApprovalAuthorization({ approver, targetUser, societyId }) {
  const approverRole = String(approver?.role || "").toLowerCase();
  const targetRole = String(targetUser?.role || "").toLowerCase();
  const sameSociety = Number(approver?.society_id || approver?.societyId) === Number(societyId);

  if (isChairmanRole(targetRole)) {
    return {
      allowed: approverRole === "super_admin",
      message: "Chairman approval requires Super Admin.",
    };
  }

  if (targetRole === "secretary") {
    return {
      allowed:
        approverRole === "super_admin" ||
        (isChairmanRole(approverRole) && sameSociety && Number(approver?.id) !== Number(targetUser?.id)),
      message: "Secretary can be approved by Super Admin or Chairman.",
    };
  }

  if (isOperationalApproval(targetUser)) {
    return {
      allowed: (isChairmanRole(approverRole) || approverRole === "secretary") && sameSociety,
      message: "Chairman or Secretary can approve same-society owner, tenant, staff, and security registrations.",
    };
  }

  return { allowed: false, message: "Unauthorized approval target." };
}

async function getApprovalTarget(approvalId) {
  const { rows } = await db.query(
    `SELECT ua.id, ua.society_id, ua.status AS approval_status,
            u.id AS user_id, u.role, u.resident_type, u.society_id AS user_society_id
     FROM user_approvals ua
     JOIN users u ON u.id = ua.user_id
     WHERE ua.id = ?
     LIMIT 1`,
    [approvalId]
  );

  return rows[0] || null;
}

// Get pending approvals for a society
exports.getPendingApprovals = async (req, res) => {
  try {
    const { societyId } = req.params;
    const userId = req.user.id;
    const { residentType, approvalType } = req.query;

    const { rows: user } = await db.query(
      `SELECT id, role, society_id FROM users 
       WHERE id = ? AND (society_id = ? OR role = 'super_admin') AND role IN ('chairman', 'admin', 'secretary', 'super_admin')`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get pending approvals
    const approver = user[0];
    const approvals = await UserApprovalModel.getPendingApprovals(societyId, {
      residentType,
      approvalType
    });
    const visibleApprovals = approvals.filter((approval) => canSeeApproval(approver, approval, societyId));

    res.json({
      message: "Pending approvals fetched",
      count: visibleApprovals.length,
      approvals: visibleApprovals
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Failed to fetch approvals" });
  }
};

// Get approval stats for a society
exports.getApprovalStats = async (req, res) => {
  try {
    const { societyId } = req.params;
    const userId = req.user.id;

    const { rows: user } = await db.query(
      `SELECT id, role, society_id FROM users 
       WHERE id = ? AND (society_id = ? OR role = 'super_admin') AND role IN ('chairman', 'admin', 'secretary', 'super_admin')`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get stats
    const stats = await UserApprovalModel.getApprovalStats(societyId);

    res.json({
      message: "Approval stats fetched",
      stats
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};

// Approve user
exports.approveUser = async (req, res) => {
  try {
    const { societyId, approvalId } = req.params;
    const userId = req.user.id;
    const { comments } = req.body;

    const { rows: user } = await db.query(
      `SELECT id, role, society_id FROM users 
       WHERE id = ? AND (society_id = ? OR role = 'super_admin') AND role IN ('chairman', 'admin', 'secretary', 'super_admin')`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const target = await getApprovalTarget(approvalId);
    if (!target || Number(target.society_id) !== Number(societyId)) {
      return res.status(404).json({ message: "Approval not found" });
    }

    const authorization = getApprovalAuthorization({
      approver: user[0],
      targetUser: { id: target.user_id, role: target.role, resident_type: target.resident_type },
      societyId,
    });

    if (!authorization.allowed) {
      return res.status(403).json({ message: authorization.message });
    }

    const approval = await UserApprovalModel.approveUser(approvalId, userId, comments);

    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    res.json({
      message: "User approved successfully",
      approval
    });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ message: "Failed to approve user" });
  }
};

// Reject user
exports.rejectUser = async (req, res) => {
  try {
    const { societyId, approvalId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const { rows: user } = await db.query(
      `SELECT id, role, society_id FROM users 
       WHERE id = ? AND (society_id = ? OR role = 'super_admin') AND role IN ('chairman', 'admin', 'secretary', 'super_admin')`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const target = await getApprovalTarget(approvalId);
    if (!target || Number(target.society_id) !== Number(societyId)) {
      return res.status(404).json({ message: "Approval not found" });
    }

    const authorization = getApprovalAuthorization({
      approver: user[0],
      targetUser: { id: target.user_id, role: target.role, resident_type: target.resident_type },
      societyId,
    });

    if (!authorization.allowed) {
      return res.status(403).json({ message: authorization.message });
    }

    const approval = await UserApprovalModel.rejectUser(approvalId, userId, reason);

    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    res.json({
      message: "User rejected successfully",
      approval
    });
  } catch (error) {
    console.error("Error rejecting user:", error);
    res.status(500).json({ message: "Failed to reject user" });
  }
};

// Bulk approve users
exports.bulkApproveUsers = async (req, res) => {
  try {
    const { societyId } = req.params;
    const userId = req.user.id;
    const { userIds, comments } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "User IDs are required" });
    }

    // Verify authorization
    const { rows: user } = await db.query(
      `SELECT id, role, society_id FROM users 
       WHERE id = ? AND (society_id = ? OR role = 'super_admin') AND role IN ('chairman', 'admin', 'secretary', 'super_admin')`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const results = [];
    for (const targetUserId of userIds) {
      const { rows: approvalRows } = await db.query(
        `SELECT ua.id, u.id AS user_id, u.role, u.resident_type
         FROM user_approvals ua
         JOIN users u ON u.id = ua.user_id
         WHERE ua.user_id = ? AND ua.society_id = ? AND ua.status = 'pending'
         LIMIT 1`,
        [targetUserId, societyId]
      );
      const target = approvalRows[0];
      if (!target) continue;

      const authorization = getApprovalAuthorization({
        approver: user[0],
        targetUser: { id: target.user_id, role: target.role, resident_type: target.resident_type },
        societyId,
      });
      if (!authorization.allowed) continue;

      const approval = await UserApprovalModel.approveUser(target.id, userId, comments);
      if (approval) results.push(approval);
    }

    res.json({
      message: "Users approved successfully",
      count: results.length,
      approvals: results
    });
  } catch (error) {
    console.error("Error bulk approving users:", error);
    res.status(500).json({ message: "Failed to bulk approve users" });
  }
};

// Verify owner (KYC)
exports.verifyOwner = async (req, res) => {
  try {
    const { societyId, userId } = req.params;
    const verifierId = req.user.id;
    const { documentUrl } = req.body;

    if (!documentUrl) {
      return res.status(400).json({ message: "Document URL is required" });
    }

    // Verify authorization
    const { rows: user } = await db.query(
      `SELECT id FROM users 
       WHERE id = ? AND society_id = ? AND role IN ('secretary', 'admin', 'super_admin')`,
      [verifierId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Verify owner
    await UserApprovalModel.verifyOwner(userId, societyId, documentUrl, verifierId);

    res.json({
      message: "Owner verified successfully"
    });
  } catch (error) {
    console.error("Error verifying owner:", error);
    res.status(500).json({ message: "Failed to verify owner" });
  }
};

// Verify tenant
exports.verifyTenant = async (req, res) => {
  try {
    const { societyId, userId } = req.params;
    const verifierId = req.user.id;
    const { rentAgreementUrl } = req.body;

    if (!rentAgreementUrl) {
      return res.status(400).json({ message: "Rent agreement URL is required" });
    }

    // Verify authorization
    const { rows: user } = await db.query(
      `SELECT id FROM users 
       WHERE id = ? AND society_id = ? AND role IN ('secretary', 'admin', 'super_admin')`,
      [verifierId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Verify tenant
    await UserApprovalModel.verifyTenant(userId, societyId, rentAgreementUrl, verifierId);

    res.json({
      message: "Tenant verified successfully"
    });
  } catch (error) {
    console.error("Error verifying tenant:", error);
    res.status(500).json({ message: "Failed to verify tenant" });
  }
};

// Get user approval history
exports.getUserApprovalHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;

    // Get user info
    const { rows: userInfo } = await db.query(
      `SELECT society_id FROM users WHERE id = ?`,
      [userId]
    );

    if (userInfo.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const societyId = userInfo[0].society_id;

    // Verify authorization - must be in same society or super admin
    if (societyId !== req.user.societyId && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Get history
    const history = await UserApprovalModel.getUserApprovalHistory(userId);

    res.json({
      message: "User approval history fetched",
      history
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};

// Get Super Admin pending approvals (all societies)
exports.getSuperAdminPendingApprovals = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify super admin
    const { rows: user } = await db.query(
      `SELECT id FROM users WHERE id = ? AND role = 'super_admin'`,
      [userId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Only super admin can access this" });
    }

    // Get all pending approvals
    const { rows: approvals } = await db.query(
      `SELECT ua.id, ua.user_id, ua.approval_type, ua.status,
              u.name, u.email, u.phone, u.role, u.resident_type,
              s.code, s.name as society_name, ua.created_at
       FROM user_approvals ua
       JOIN users u ON u.id = ua.user_id
       JOIN societies s ON s.id = ua.society_id
       WHERE ua.status = 'pending'
       ORDER BY ua.created_at ASC`
    );

    res.json({
      message: "All pending approvals fetched",
      count: approvals.length,
      approvals
    });
  } catch (error) {
    console.error("Error fetching super admin approvals:", error);
    res.status(500).json({ message: "Failed to fetch approvals" });
  }
};

// Super Admin approve user (cross-society)
exports.superAdminApproveUser = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const userId = req.user.id;
    const { comments } = req.body;

    // Verify super admin
    const { rows: user } = await db.query(
      `SELECT id FROM users WHERE id = ? AND role = 'super_admin'`,
      [userId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Only super admin can access this" });
    }

    // Approve
    const approval = await UserApprovalModel.approveUser(approvalId, userId, comments);

    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    res.json({
      message: "User approved successfully",
      approval
    });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ message: "Failed to approve user" });
  }
};

// Super Admin reject user (cross-society)
exports.superAdminRejectUser = async (req, res) => {
  try {
    const { approvalId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    // Verify super admin
    const { rows: user } = await db.query(
      `SELECT id FROM users WHERE id = ? AND role = 'super_admin'`,
      [userId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Only super admin can access this" });
    }

    // Reject
    const approval = await UserApprovalModel.rejectUser(approvalId, userId, reason);

    if (!approval) {
      return res.status(404).json({ message: "Approval not found" });
    }

    res.json({
      message: "User rejected successfully",
      approval
    });
  } catch (error) {
    console.error("Error rejecting user:", error);
    res.status(500).json({ message: "Failed to reject user" });
  }
};
