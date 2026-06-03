const db = require("../db");

const COMPLAINT_STATUSES = ["open", "assigned", "in_progress", "resolved", "closed", "archived", "deleted"];
const ACTIVE_COMPLAINT_STATUSES = ["open", "assigned", "in_progress", "resolved", "closed"];

function normalizeComplaintStatus(status) {
  if (!status) {
    return null;
  }

  const value = String(status).toLowerCase();
  if (value === "pending") {
    return "open";
  }
  if (value === "resolved") {
    return "closed";
  }

  return COMPLAINT_STATUSES.includes(value) ? value : null;
}

function buildComplaintWhere({ search, status, category, residentId, societyId, flatNumber, fromDate, toDate, includeArchived = false } = {}) {
  const conditions = ["1 = 1"];
  const params = [];

  if (societyId) {
    conditions.push("resident.society_id = ?");
    params.push(societyId);
  }

  if (search) {
    conditions.push("(c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ? OR resident.name LIKE ? OR resident.email LIKE ?)");
    const likeQuery = `%${search}%`;
    params.push(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery);
  }

  const normalizedStatus = normalizeComplaintStatus(status);
  if (normalizedStatus && normalizedStatus !== "all") {
    conditions.push("c.status = ?");
    params.push(normalizedStatus);
  } else if (!includeArchived) {
    conditions.push("c.status NOT IN ('archived', 'deleted')");
  }

  if (category) {
    conditions.push("c.category = ?");
    params.push(category);
  }

  if (residentId) {
    conditions.push("c.resident_id = ?");
    params.push(residentId);
  }

  if (flatNumber) {
    conditions.push("resident.flat_number = ?");
    params.push(flatNumber);
  }

  if (fromDate) {
    conditions.push("c.created_at >= ?");
    params.push(fromDate);
  }

  if (toDate) {
    conditions.push("c.created_at <= ?");
    params.push(toDate);
  }

  return { conditions, params };
}

function mapComplaintRow(row) {
  return {
    ...row,
    status: row.status,
    archived_from_status: row.archived_from_status,
  };
}

async function createComplaint({ residentId, societyId = null, title, description, category = "general" }) {
  const { rows: result } = await db.query(
    `INSERT INTO complaints (resident_id, society_id, title, description, category, status)
     VALUES (?, ?, ?, ?, ?, 'open')`,
    [residentId, societyId, title, description, category || "general"]
  );

  return result.insertId;
}

async function getComplaintById(complaintId, { includeArchived = true, societyId = null } = {}) {
  const archiveFilter = includeArchived ? "" : "AND c.status NOT IN ('archived', 'deleted')";
  const societyFilter = societyId ? "AND resident.society_id = ?" : "";
  const { rows } = await db.query(
    `SELECT c.id, c.title, c.description, c.category, c.status, c.resolved_at, c.archived_at, c.archived_by, c.archived_from_status,
            c.deleted_at, c.deleted_by, c.deletion_reason, c.created_at, c.updated_at,
            c.resident_id, resident.name AS resident_name, resident.email AS resident_email, resident.flat_number AS resident_flat_number,
            c.updated_by, updater.name AS updated_by_name, archiver.name AS archived_by_name, deleter.name AS deleted_by_name
     FROM complaints c
     JOIN users resident ON resident.id = c.resident_id
     LEFT JOIN users updater ON updater.id = c.updated_by
     LEFT JOIN users archiver ON archiver.id = c.archived_by
     LEFT JOIN users deleter ON deleter.id = c.deleted_by
     WHERE c.id = ? ${archiveFilter} ${societyFilter}
     LIMIT 1`,
    societyId ? [complaintId, societyId] : [complaintId]
  );

  return rows[0] ? mapComplaintRow(rows[0]) : null;
}

async function getAllComplaints(filters = {}) {
  const { conditions, params } = buildComplaintWhere(filters);
  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const { rows } = await db.query(
    `SELECT c.id, c.title, c.description, c.category, c.status, c.resolved_at, c.archived_at, c.archived_by, c.archived_from_status,
            c.deleted_at, c.deleted_by, c.deletion_reason, c.created_at, c.updated_at,
            c.resident_id, resident.name AS resident_name, resident.email AS resident_email, resident.flat_number AS resident_flat_number,
            c.updated_by, updater.name AS updated_by_name, archiver.name AS archived_by_name, deleter.name AS deleted_by_name
     FROM complaints c
     JOIN users resident ON resident.id = c.resident_id
     LEFT JOIN users updater ON updater.id = c.updated_by
     LEFT JOIN users archiver ON archiver.id = c.archived_by
     LEFT JOIN users deleter ON deleter.id = c.deleted_by
     ${whereClause}
     ORDER BY c.created_at DESC`,
    params
  );

  return rows.map(mapComplaintRow);
}

async function getComplaintsByResident(residentId, filters = {}) {
  const { includeArchived = false } = filters;
  const { conditions, params } = buildComplaintWhere({ ...filters, residentId, includeArchived });
  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const { rows } = await db.query(
    `SELECT c.id, c.title, c.description, c.category, c.status, c.resolved_at, c.archived_at, c.archived_by, c.archived_from_status,
            c.deleted_at, c.deleted_by, c.deletion_reason, c.created_at, c.updated_at,
            c.resident_id, resident.name AS resident_name, resident.email AS resident_email, resident.flat_number AS resident_flat_number,
            c.updated_by, updater.name AS updated_by_name, archiver.name AS archived_by_name, deleter.name AS deleted_by_name
     FROM complaints c
     JOIN users resident ON resident.id = c.resident_id
     LEFT JOIN users updater ON updater.id = c.updated_by
     LEFT JOIN users archiver ON archiver.id = c.archived_by
     LEFT JOIN users deleter ON deleter.id = c.deleted_by
     ${whereClause}
     ORDER BY c.created_at DESC`,
    params
  );

  return rows.map(mapComplaintRow);
}

async function updateComplaintStatus({ complaintId, status, updatedBy, category }) {
  const normalizedStatus = normalizeComplaintStatus(status);
  if (!normalizedStatus || normalizedStatus === "archived" || normalizedStatus === "deleted") {
    throw new Error("Invalid complaint status transition");
  }

  const resolvedAt = ["resolved", "closed"].includes(normalizedStatus) ? new Date() : null;
  const archiveSourceStatus = normalizedStatus === "archived" ? "closed" : null;

  const { rows: result } = await db.query(
    `UPDATE complaints
     SET status = ?, updated_by = ?, resolved_at = ?, archived_from_status = COALESCE(archived_from_status, ?), updated_at = NOW()
     WHERE id = ?`,
    [normalizedStatus, updatedBy, resolvedAt, archiveSourceStatus, complaintId]
  );

  if (category) {
    await db.query(
      `UPDATE complaints SET category = ?, updated_by = ?, updated_at = NOW() WHERE id = ?`,
      [category, updatedBy, complaintId]
    );
  }

  return result.affectedRows > 0;
}

async function archiveComplaint({ complaintId, archivedBy }) {
  const { rows: result } = await db.query(
    `UPDATE complaints
     SET status = 'archived', archived_at = NOW(), archived_by = ?, archived_from_status = COALESCE(NULLIF(status, 'archived'), 'closed'), updated_by = ?, updated_at = NOW()
     WHERE id = ? AND status <> 'deleted'`,
    [archivedBy, archivedBy, complaintId]
  );

  return result.affectedRows > 0;
}

async function restoreComplaint({ complaintId, restoredBy }) {
  const { rows } = await db.query(
    `SELECT archived_from_status
     FROM complaints
     WHERE id = ? AND status = 'archived'
     LIMIT 1`,
    [complaintId]
  );

  if (!rows.length) {
    return false;
  }

  const restoreStatus = ACTIVE_COMPLAINT_STATUSES.includes(rows[0].archived_from_status) ? rows[0].archived_from_status : "closed";

  const { rows: result } = await db.query(
    `UPDATE complaints
     SET status = ?, archived_at = NULL, archived_by = NULL, updated_by = ?, updated_at = NOW()
     WHERE id = ? AND status = 'archived'`,
    [restoreStatus, restoredBy, complaintId]
  );

  return result.affectedRows > 0;
}

async function deleteComplaint({ complaintId, deletedBy, reason }) {
  const { rows: result } = await db.query(
    `UPDATE complaints
     SET status = 'deleted', deleted_at = NOW(), deleted_by = ?, deletion_reason = ?, updated_by = ?, updated_at = NOW()
     WHERE id = ? AND status <> 'deleted'`,
    [deletedBy, reason, deletedBy, complaintId]
  );

  return result.affectedRows > 0;
}

async function createComment({ complaintId, userId, comment }) {
  const { rows: result } = await db.query(
    `INSERT INTO complaint_comments (complaint_id, user_id, comment_text)
     VALUES (?, ?, ?)`,
    [complaintId, userId, comment]
  );

  return result.insertId;
}

async function getCommentsByComplaintIds(complaintIds) {
  if (!complaintIds.length) {
    return [];
  }

  const placeholders = complaintIds.map(() => "?").join(",");
  const { rows } = await db.query(
    `SELECT cc.id, cc.complaint_id, cc.comment_text, cc.created_at,
            cc.user_id, u.name AS user_name, u.role AS user_role
     FROM complaint_comments cc
     JOIN users u ON u.id = cc.user_id
     WHERE cc.complaint_id IN (${placeholders})
     ORDER BY cc.created_at ASC`,
    complaintIds
  );

  return rows;
}

module.exports = {
  COMPLAINT_STATUSES,
  createComplaint,
  getComplaintById,
  getAllComplaints,
  getComplaintsByResident,
  updateComplaintStatus,
  archiveComplaint,
  restoreComplaint,
  deleteComplaint,
  createComment,
  getCommentsByComplaintIds,
};
