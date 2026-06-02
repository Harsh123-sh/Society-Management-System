const db = require("../db");

const NOTICE_STATUSES = ["active", "scheduled", "expired", "archived", "deleted"];

function normalizeNoticeStatus(status) {
  if (!status) {
    return null;
  }

  const value = String(status).toLowerCase();
  return NOTICE_STATUSES.includes(value) ? value : null;
}

function buildNoticeSelect({ archivedOnly = false, status, search, fromDate, toDate, societyId } = {}) {
  const conditions = ["1 = 1"];
  const params = [];

  if (societyId) {
    conditions.push("n.society_id = ?");
    params.push(societyId);
  }

  if (archivedOnly) {
    conditions.push("n.status IN ('archived', 'deleted')");
  } else {
    conditions.push("n.status NOT IN ('archived', 'deleted')");
  }

  const normalizedStatus = normalizeNoticeStatus(status);
  if (normalizedStatus && normalizedStatus !== "all") {
    conditions.push("n.status = ?");
    params.push(normalizedStatus);
  }

  if (search) {
    const likeQuery = `%${search}%`;
    conditions.push("(n.title LIKE ? OR n.message LIKE ? OR u.name LIKE ? OR u.email LIKE ?)");
    params.push(likeQuery, likeQuery, likeQuery, likeQuery);
  }

  if (fromDate) {
    conditions.push("n.created_at >= ?");
    params.push(fromDate);
  }

  if (toDate) {
    conditions.push("n.created_at <= ?");
    params.push(toDate);
  }

  return { conditions, params };
}

function mapNoticeRow(row) {
  return row;
}

function deriveNoticeStatus(expiresAt) {
  if (!expiresAt) {
    return "active";
  }

  const expiryDate = new Date(expiresAt).getTime();
  if (Number.isNaN(expiryDate)) {
    return "active";
  }

  return expiryDate > Date.now() ? "scheduled" : "expired";
}

async function createNotice({ title, message, createdBy, societyId = null, expiresAt = null }) {
  const status = deriveNoticeStatus(expiresAt);
  const [result] = await db.query(
    `INSERT INTO notices (title, message, created_by, society_id, status, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, message, createdBy, societyId, status, expiresAt]
  );

  return result.insertId;
}

async function getNoticeById(id, { includeArchived = true, societyId = null } = {}) {
  const archiveFilter = includeArchived ? "" : "AND n.status NOT IN ('archived', 'deleted')";
  const societyFilter = societyId ? "AND n.society_id = ?" : "";
  const [rows] = await db.query(
    `SELECT n.id, n.title, n.message, n.society_id, n.status, n.expires_at, n.archived_at, n.archived_by, n.archived_from_status,
            n.deleted_at, n.deleted_by, n.deletion_reason, n.created_at, n.created_by,
            u.name AS created_by_name, u.email AS created_by_email, archiver.name AS archived_by_name, deleter.name AS deleted_by_name
     FROM notices n
     JOIN users u ON u.id = n.created_by
     LEFT JOIN users archiver ON archiver.id = n.archived_by
     LEFT JOIN users deleter ON deleter.id = n.deleted_by
     WHERE n.id = ? ${archiveFilter} ${societyFilter}
     LIMIT 1`,
    societyId ? [id, societyId] : [id]
  );

  return rows[0] ? mapNoticeRow(rows[0]) : null;
}

async function getAllNotices(filters = {}) {
  const { conditions, params } = buildNoticeSelect(filters);
  const [rows] = await db.query(
    `SELECT n.id, n.title, n.message, n.society_id, n.status, n.expires_at, n.archived_at, n.archived_by, n.archived_from_status,
            n.deleted_at, n.deleted_by, n.deletion_reason, n.created_at, n.created_by,
            u.name AS created_by_name, u.email AS created_by_email, archiver.name AS archived_by_name, deleter.name AS deleted_by_name
     FROM notices n
     JOIN users u ON u.id = n.created_by
     LEFT JOIN users archiver ON archiver.id = n.archived_by
     LEFT JOIN users deleter ON deleter.id = n.deleted_by
     WHERE ${conditions.join(" AND ")}
     ORDER BY n.created_at DESC`,
    params
  );

  return rows.map(mapNoticeRow);
}

async function archiveExpiredNotices(societyId = null) {
  await db.query(
    `UPDATE notices
     SET status = 'expired'
     WHERE status IN ('active', 'scheduled')
       AND expires_at IS NOT NULL
       AND expires_at <= NOW()
       ${societyId ? "AND society_id = ?" : ""}`,
    societyId ? [societyId] : []
  );
}

async function archiveNotice({ noticeId, archivedBy }) {
  const [rows] = await db.query(
    `SELECT status
     FROM notices
     WHERE id = ?
     LIMIT 1`,
    [noticeId]
  );

  if (!rows.length || rows[0].status === "deleted") {
    return false;
  }

  const [result] = await db.query(
    `UPDATE notices
     SET status = 'archived', archived_at = NOW(), archived_by = ?, archived_from_status = COALESCE(NULLIF(status, 'archived'), 'active'), updated_at = NOW()
     WHERE id = ? AND status <> 'deleted'`,
    [archivedBy, noticeId]
  );

  return result.affectedRows > 0;
}

async function restoreNotice({ noticeId, restoredBy }) {
  const [rows] = await db.query(
    `SELECT archived_from_status, expires_at
     FROM notices
     WHERE id = ? AND status = 'archived'
     LIMIT 1`,
    [noticeId]
  );

  if (!rows.length) {
    return false;
  }

  const restoreStatus = NOTICE_STATUSES.includes(rows[0].archived_from_status) && rows[0].archived_from_status !== 'archived' && rows[0].archived_from_status !== 'deleted'
    ? rows[0].archived_from_status
    : deriveNoticeStatus(rows[0].expires_at);

  const [result] = await db.query(
    `UPDATE notices
     SET status = ?, archived_at = NULL, archived_by = NULL, updated_at = NOW()
     WHERE id = ? AND status = 'archived'`,
    [restoreStatus, noticeId]
  );

  if (result.affectedRows > 0) {
    await db.query(
      `UPDATE notices SET archived_from_status = NULL WHERE id = ?`,
      [noticeId]
    );
  }

  return result.affectedRows > 0;
}

async function deleteNotice({ noticeId, deletedBy, reason }) {
  const [result] = await db.query(
    `UPDATE notices
     SET status = 'deleted', deleted_at = NOW(), deleted_by = ?, deletion_reason = ?, updated_at = NOW()
     WHERE id = ? AND status <> 'deleted'`,
    [deletedBy, reason, noticeId]
  );

  return result.affectedRows > 0;
}

module.exports = {
  NOTICE_STATUSES,
  createNotice,
  getNoticeById,
  getAllNotices,
  archiveExpiredNotices,
  archiveNotice,
  restoreNotice,
  deleteNotice,
};
