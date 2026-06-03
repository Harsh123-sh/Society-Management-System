/**
 * User Approval Workflow Model
 * Manages the approval process for new user registrations
 */

const db = require("../db");

class UserApprovalModel {
  // Create approval request
  static async createApprovalRequest({
    userId,
    societyId,
    approvalType = "registration",
    requestedBy = null,
    documents = null
  }) {
    try {
      const { rows: result } = await db.query(
        `INSERT INTO user_approvals (
          user_id, society_id, approval_type, requested_by, 
          documents_json, status
        ) VALUES (?, ?, ?, ?, ?, 'pending')`,
        [
          userId,
          societyId,
          approvalType,
          requestedBy,
          documents ? JSON.stringify(documents) : null
        ]
      );

      return this.getApprovalById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Get approval by ID
  static async getApprovalById(approvalId) {
    try {
      const { rows } = await db.query(
        `SELECT id, user_id, society_id, approval_type, status,
                requested_by, approved_by, approval_comments,
                documents_json, created_at, approved_at, updated_at
         FROM user_approvals
         WHERE id = ?`,
        [approvalId]
      );

      if (rows.length === 0) return null;

      const approval = rows[0];
      if (approval.documents_json) {
        try {
          approval.documents = JSON.parse(approval.documents_json);
        } catch (e) {
          approval.documents = null;
        }
      }

      return approval;
    } catch (error) {
      throw error;
    }
  }

  // Get pending approvals for a society
  static async getPendingApprovals(societyId, filter = {}) {
    try {
      const conditions = [
        "ua.society_id = ?",
        "ua.status = 'pending'"
      ];
      const params = [societyId];

      if (filter.approvalType) {
        conditions.push("ua.approval_type = ?");
        params.push(filter.approvalType);
      }

      if (filter.residentType) {
        conditions.push("u.resident_type = ?");
        params.push(filter.residentType);
      }

      const whereClause = conditions.join(" AND ");

      const { rows } = await db.query(
        `SELECT ua.id, ua.user_id, ua.approval_type, ua.status,
                u.name, u.email, u.phone, u.role, u.resident_type,
                u.flat_number, ua.created_at, ua.requested_by
         FROM user_approvals ua
         JOIN users u ON u.id = ua.user_id
         WHERE ${whereClause}
         ORDER BY ua.created_at ASC`,
        params
      );

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Approve user
  static async approveUser(approvalId, approvedBy, comments = null) {
    try {
      // Get approval request
      const approval = await this.getApprovalById(approvalId);
      if (!approval || approval.status !== "pending") return null;

      // Update approval
      await db.query(
        `UPDATE user_approvals 
         SET status = 'approved', approved_by = ?, 
             approval_comments = ?, approved_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [approvedBy, comments, approvalId]
      );

      // Update user status
      await db.query(
        `UPDATE users
         SET status = 'active'
         WHERE id = ?`,
        [approval.user_id]
      );

      return this.getApprovalById(approvalId);
    } catch (error) {
      throw error;
    }
  }

  // Reject user
  static async rejectUser(approvalId, rejectedBy, reason) {
    try {
      const approval = await this.getApprovalById(approvalId);
      if (!approval || approval.status !== "pending") return null;

      // Update approval
      await db.query(
        `UPDATE user_approvals 
         SET status = 'rejected', approved_by = ?, 
             approval_comments = ?, approved_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [rejectedBy, reason, approvalId]
      );

      // Update user status
      await db.query(
        `UPDATE users
         SET status = 'rejected'
         WHERE id = ?`,
        [approval.user_id]
      );

      return this.getApprovalById(approvalId);
    } catch (error) {
      throw error;
    }
  }

  // Verify owner (KYC)
  static async verifyOwner(userId, societyId, documentUrl, verifiedBy) {
    try {
      // Update user KYC status
      await db.query(
        `UPDATE users 
         SET kyc_status = 'verified', 
             kyc_document_url = ?,
             kyc_document_type = 'ownership_proof',
             kyc_verified_by = ?,
             kyc_verified_at = CURRENT_TIMESTAMP
         WHERE id = ? AND society_id = ?`,
        [documentUrl, verifiedBy, userId, societyId]
      );

      // Create approval if not exists
      const { rows: existing } = await db.query(
        `SELECT id FROM user_approvals 
         WHERE user_id = ? AND approval_type = 'owner_verification'`,
        [userId]
      );

      if (existing.length === 0) {
        await this.createApprovalRequest({
          userId,
          societyId,
          approvalType: "owner_verification",
          requestedBy: null
        });
      }

      return this.getApprovalById(userId);
    } catch (error) {
      throw error;
    }
  }

  // Verify tenant
  static async verifyTenant(userId, societyId, rentAgreementUrl, verifiedBy) {
    try {
      // Update user KYC status
      await db.query(
        `UPDATE users 
         SET kyc_status = 'verified', 
             kyc_document_url = ?,
             kyc_document_type = 'rent_agreement',
             kyc_verified_by = ?,
             kyc_verified_at = CURRENT_TIMESTAMP
         WHERE id = ? AND society_id = ?`,
        [rentAgreementUrl, verifiedBy, userId, societyId]
      );

      return this.getApprovalById(userId);
    } catch (error) {
      throw error;
    }
  }

  // Get user approval history
  static async getUserApprovalHistory(userId) {
    try {
      const { rows } = await db.query(
        `SELECT id, approval_type, status, approval_comments,
                approved_by, created_at, approved_at
         FROM user_approvals
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get society approval stats
  static async getApprovalStats(societyId) {
    try {
      const { rows } = await db.query(
        `SELECT 
          approval_type,
          status,
          COUNT(*) as count
         FROM user_approvals
         WHERE society_id = ?
         GROUP BY approval_type, status`,
        [societyId]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Bulk approve users
  static async bulkApproveUsers(userIds, societyId, approvedBy, comments = null) {
    try {
      const results = [];

      for (const userId of userIds) {
        const { rows: approvals } = await db.query(
          `SELECT id FROM user_approvals 
           WHERE user_id = ? AND society_id = ? AND status = 'pending'
           LIMIT 1`,
          [userId, societyId]
        );

        if (approvals.length > 0) {
          const approval = await this.approveUser(
            approvals[0].id,
            approvedBy,
            comments
          );
          results.push(approval);
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserApprovalModel;
