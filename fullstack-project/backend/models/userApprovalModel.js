/**
 * User Approval Workflow Model
 * Manages the approval process for new user registrations
 */

const db = require("../config/db");

let approvalColumnsEnsured = false;

async function ensureApprovalColumns() {
  if (approvalColumnsEnsured) return;
  await db.query(`CREATE TABLE IF NOT EXISTS user_approvals (id SERIAL PRIMARY KEY)`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS user_id INT NULL`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS society_id INT NULL`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS approval_type VARCHAR(80) DEFAULT 'registration'`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS documents_json JSONB NULL`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS requested_by INT NULL`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS approved_by INT NULL`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS rejected_by INT NULL`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS approval_comments TEXT`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS rejection_reason TEXT`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await db.query(`ALTER TABLE user_approvals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending'`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by INT NULL`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_by INT NULL`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP NULL`);
  approvalColumnsEnsured = true;
}

class UserApprovalModel {
  static async ensureSchema() {
    await ensureApprovalColumns();
  }

  // Create approval request
  static async createApprovalRequest({
    userId,
    societyId,
    approvalType = "registration",
    requestedBy = null,
    documents = null
  }) {
    try {
      await ensureApprovalColumns();
      await db.query(
        `UPDATE users
         SET approval_status = 'pending'
         WHERE id = $1
           AND status = 'pending_approval'
           AND (approval_status IS NULL OR approval_status <> 'pending')`,
        [userId]
      );
      const { rows: result } = await db.query(
        `INSERT INTO user_approvals (
          user_id, society_id, approval_type, requested_by, 
          documents_json, status
        ) VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
        [
          userId,
          societyId,
          approvalType,
          requestedBy,
          documents ? JSON.stringify(documents) : null
        ]
      );

      console.log("[Approval inserted successfully]", {
        approvalId: result[0]?.id || null,
        userId,
        societyId,
        approvalType,
        requestedBy,
      });

      return this.getApprovalById(result[0]?.id);
    } catch (error) {
      throw error;
    }
  }

  // Get approval by ID
  static async getApprovalById(approvalId) {
    try {
      await ensureApprovalColumns();
      const { rows } = await db.query(
        `SELECT id, user_id, society_id, approval_type, status,
                requested_by, approved_by, approval_comments,
                rejection_reason, documents_json, created_at, approved_at,
                rejected_by, rejected_at, updated_at
         FROM user_approvals
         WHERE id = $1`,
        [approvalId]
      );

      if (rows.length === 0) return null;

      const approval = rows[0];
      if (approval.documents_json) {
        if (typeof approval.documents_json === "string") {
          try {
            approval.documents = JSON.parse(approval.documents_json);
          } catch {
            approval.documents = null;
          }
        } else {
          approval.documents = approval.documents_json;
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
      await ensureApprovalColumns();
      const params = [societyId];
      const conditions = [
        `ua.society_id = $${params.length}`,
        "ua.status = 'pending'"
      ];

      if (filter.approvalType) {
        conditions.push(`ua.approval_type = $${params.length + 1}`);
        params.push(filter.approvalType);
      }

      if (filter.residentType) {
        conditions.push(`u.resident_type = $${params.length + 1}`);
        params.push(filter.residentType);
      }

      const whereClause = conditions.join(" AND ");

      const { rows } = await db.query(
        `SELECT ua.id, ua.user_id, ua.approval_type, ua.status,
                u.name, u.email, COALESCE(u.mobile, u.phone) AS phone, u.role, u.resident_type,
                u.flat_number, ua.created_at, ua.requested_by,
                s.name AS society_name, s.code AS society_code
         FROM user_approvals ua
         JOIN users u ON u.id = ua.user_id
         LEFT JOIN societies s ON s.id = ua.society_id
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
         SET status = 'approved', approved_by = $1, 
             approval_comments = $2, approved_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [approvedBy, comments, approvalId]
      );

      // Update user status and verification
      await db.query(
        `UPDATE users
         SET status = 'active',
             is_verified = TRUE,
             approval_status = 'approved',
             approved_by = $2,
             approved_at = CURRENT_TIMESTAMP,
             rejected_by = NULL,
             rejected_at = NULL
         WHERE id = $1`,
        [approval.user_id, approvedBy]
      );

      return this.getApprovalById(approvalId);
    } catch (error) {
      throw error;
    }
  }

  // Process residence approval with transactional assignment to flat
  static async processResidenceApproval(approvalId, approvedBy, comments = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [approvalRows] = await connection.query(
        `SELECT ua.id, ua.user_id, ua.society_id, ua.status, ua.documents_json
         FROM user_approvals ua
         WHERE ua.id = ?
         LIMIT 1
         FOR UPDATE`,
        [approvalId]
      );

      const approval = approvalRows[0] || null;
      if (!approval) {
        await connection.rollback();
        const err = new Error("Request not found");
        err.code = "REQUEST_NOT_FOUND";
        throw err;
      }

      if (String(approval.status).toLowerCase() !== "pending") {
        await connection.rollback();
        const err = new Error("Request is not pending");
        err.code = "REQUEST_NOT_PENDING";
        throw err;
      }

      const [userRows] = await connection.query(
        `SELECT id, flat_id, flat_number, resident_type, society_id, status
         FROM users
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [approval.user_id]
      );

      const user = userRows[0] || null;
      if (!user) {
        await connection.rollback();
        const err = new Error("Resident not found");
        err.code = "RESIDENT_NOT_FOUND";
        throw err;
      }

      // Determine flat
      let flat = null;
      if (user.flat_id) {
        const [flatRows] = await connection.query(
          `SELECT * FROM flats WHERE id = ? AND society_id = ? LIMIT 1 FOR UPDATE`,
          [user.flat_id, user.society_id]
        );
        flat = flatRows[0] || null;
      } else if (user.flat_number) {
        const [flatRows] = await connection.query(
          `SELECT * FROM flats WHERE society_id = ? AND flat_number = ? LIMIT 1 FOR UPDATE`,
          [user.society_id, user.flat_number]
        );
        flat = flatRows[0] || null;
      }

      if (!flat) {
        await connection.rollback();
        const err = new Error("Flat not found");
        err.code = "FLAT_NOT_FOUND";
        throw err;
      }

      // Check occupancy
      const [activeRows] = await connection.query(
        `SELECT id FROM flat_residents WHERE flat_id = ? AND is_active = TRUE LIMIT 1 FOR UPDATE`,
        [flat.id]
      );

      if (activeRows.length > 0) {
        await connection.rollback();
        const err = new Error("Flat already occupied");
        err.code = "FLAT_OCCUPIED";
        throw err;
      }

      // Insert assignment
      const moveInDate = new Date();
      const { rows: insertResult } = await connection.query(
        `INSERT INTO flat_residents (flat_id, resident_id, move_in_date, is_active, assigned_by)
         VALUES (?, ?, ?, TRUE, ?)
         RETURNING id`,
        [flat.id, user.id, moveInDate, approvedBy]
      );

      // Update flat occupancy/status
      const occupancyValue = user.resident_type === "tenant" ? "tenant_occupied" : "owner_occupied";
      const updateParts = [];
      const updateParams = [];
      // prefer occupancy_status column if present
      updateParts.push("status = 'occupied'");
      updateParams.push(flat.id);

      // Try to set occupancy_status if column exists
      try {
        await connection.query(`UPDATE flats SET occupancy_status = ? WHERE id = ?`, [occupancyValue, flat.id]);
      } catch (e) {
        // ignore if column doesn't exist
      }

      await connection.query(`UPDATE flats SET status = 'occupied' WHERE id = ?`, [flat.id]);

      // Update user record
      await connection.query(
        `UPDATE users SET flat_id = ?, flat_number = ?, status = 'active', is_verified = TRUE, approved_by = ?, approved_at = NOW(), approval_status = 'approved' WHERE id = ?`,
        [flat.id, flat.flat_number || user.flat_number || null, approvedBy, user.id]
      );

      // If owner, ensure owner_properties mapping exists
      if (String(user.resident_type).toLowerCase() === "owner") {
        try {
          await connection.query(
            `INSERT INTO owner_properties (user_id, flat_id, living_start_date)
             VALUES (?, ?, ?)
             ON CONFLICT (flat_id) DO UPDATE SET user_id = EXCLUDED.user_id, living_start_date = EXCLUDED.living_start_date`,
            [user.id, flat.id, moveInDate]
          );
        } catch (e) {
          // ignore if owner_properties table absent
        }
      }

      // Mark approval approved
      await connection.query(
        `UPDATE user_approvals SET status = 'approved', approved_by = ?, approval_comments = ?, approved_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [approvedBy, comments || null, approvalId]
      );

      // Activity log
      try {
        await connection.query(
          `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
           VALUES (?, 'approve_residence', 'user_approval', ?, ?::jsonb)`,
          [approvedBy || null, approvalId, JSON.stringify({ approvedBy, approvalId, userId: user.id, flatId: flat.id })]
        );
      } catch (e) {
        // ignore logging errors
      }

      await connection.commit();

      return this.getApprovalById(approvalId);
    } catch (error) {
      try {
        await connection.rollback();
      } catch (e) {}
      throw error;
    } finally {
      connection.release();
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
         SET status = 'rejected',
             rejected_by = $1,
             approval_comments = $2,
             rejection_reason = $2,
             rejected_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [rejectedBy, reason, approvalId]
      );

      // Update user status
      await db.query(
        `UPDATE users
         SET status = 'rejected',
             approval_status = 'rejected',
             rejected_by = $2,
             rejected_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [approval.user_id, rejectedBy]
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
             kyc_document_url = $1,
             kyc_document_type = 'ownership_proof',
             kyc_verified_by = $2,
             kyc_verified_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND society_id = $4`,
        [documentUrl, verifiedBy, userId, societyId]
      );

      // Create approval if not exists
      const { rows: existing } = await db.query(
        `SELECT id FROM user_approvals 
         WHERE user_id = $1 AND approval_type = 'owner_verification'`,
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
             kyc_document_url = $1,
             kyc_document_type = 'rent_agreement',
             kyc_verified_by = $2,
             kyc_verified_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND society_id = $4`,
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
         WHERE user_id = $1
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
         WHERE society_id = $1
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
           WHERE user_id = $1 AND society_id = $2 AND status = 'pending'
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
