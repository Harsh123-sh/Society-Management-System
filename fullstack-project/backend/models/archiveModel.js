const db = require("../db");

async function getRetentionRules() {
  const [rows] = await db.query(
    `SELECT rr.id, rr.resource_type, rr.retention_days, rr.archive_after_days, rr.auto_archive_enabled,
            rr.allow_permanent_delete, rr.updated_by, rr.created_at, rr.updated_at,
            u.name AS updated_by_name
     FROM retention_rules rr
     LEFT JOIN users u ON u.id = rr.updated_by
     ORDER BY rr.resource_type ASC`
  );

  return rows;
}

async function updateRetentionRule({ resourceType, retentionDays, archiveAfterDays, autoArchiveEnabled, allowPermanentDelete, updatedBy }) {
  const [result] = await db.query(
    `INSERT INTO retention_rules (resource_type, retention_days, archive_after_days, auto_archive_enabled, allow_permanent_delete, updated_by)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       retention_days = VALUES(retention_days),
       archive_after_days = VALUES(archive_after_days),
       auto_archive_enabled = VALUES(auto_archive_enabled),
       allow_permanent_delete = VALUES(allow_permanent_delete),
       updated_by = VALUES(updated_by),
       updated_at = NOW()`,
    [resourceType, retentionDays, archiveAfterDays, autoArchiveEnabled ? 1 : 0, allowPermanentDelete ? 1 : 0, updatedBy]
  );

  return result.affectedRows > 0;
}

async function getArchivedComplaints(filters = {}) {
  const conditions = ["c.status IN ('archived', 'deleted')"];
  const params = [];

  if (filters.societyId) {
    conditions.push("resident.society_id = ?");
    params.push(filters.societyId);
  }

  if (filters.search) {
    const likeQuery = `%${filters.search}%`;
    conditions.push("(c.title LIKE ? OR c.description LIKE ? OR c.category LIKE ? OR resident.name LIKE ? OR resident.email LIKE ?)");
    params.push(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery);
  }

  if (filters.status && filters.status !== "all") {
    conditions.push("c.status = ?");
    params.push(filters.status);
  }

  if (filters.category) {
    conditions.push("c.category = ?");
    params.push(filters.category);
  }

  if (filters.flatNumber) {
    conditions.push("resident.flat_number = ?");
    params.push(filters.flatNumber);
  }

  if (filters.residentId) {
    conditions.push("c.resident_id = ?");
    params.push(filters.residentId);
  }

  if (filters.fromDate) {
    conditions.push("c.created_at >= ?");
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push("c.created_at <= ?");
    params.push(filters.toDate);
  }

  const [rows] = await db.query(
    `SELECT c.id, c.title, c.description, c.category, c.status, c.resolved_at, c.archived_at, c.archived_by, c.archived_from_status,
            c.deleted_at, c.deleted_by, c.deletion_reason, c.created_at, c.updated_at,
            c.resident_id, resident.name AS resident_name, resident.email AS resident_email, resident.flat_number AS resident_flat_number,
            archiver.name AS archived_by_name, deleter.name AS deleted_by_name
     FROM complaints c
     JOIN users resident ON resident.id = c.resident_id
     LEFT JOIN users archiver ON archiver.id = c.archived_by
     LEFT JOIN users deleter ON deleter.id = c.deleted_by
     WHERE ${conditions.join(" AND ")}
     ORDER BY COALESCE(c.archived_at, c.deleted_at, c.updated_at, c.created_at) DESC`,
    params
  );

  return rows;
}

async function getArchivedNotices(filters = {}) {
  const conditions = ["n.status IN ('archived', 'deleted')"];
  const params = [];

  if (filters.societyId) {
    conditions.push("u.society_id = ?");
    params.push(filters.societyId);
  }

  if (filters.search) {
    const likeQuery = `%${filters.search}%`;
    conditions.push("(n.title LIKE ? OR n.message LIKE ? OR u.name LIKE ? OR u.email LIKE ?)");
    params.push(likeQuery, likeQuery, likeQuery, likeQuery);
  }

  if (filters.status && filters.status !== "all") {
    conditions.push("n.status = ?");
    params.push(filters.status);
  }

  if (filters.fromDate) {
    conditions.push("n.created_at >= ?");
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    conditions.push("n.created_at <= ?");
    params.push(filters.toDate);
  }

  const [rows] = await db.query(
    `SELECT n.id, n.title, n.message, n.status, n.expires_at, n.archived_at, n.archived_by, n.archived_from_status,
            n.deleted_at, n.deleted_by, n.deletion_reason, n.created_at, n.created_by,
            u.name AS created_by_name, u.email AS created_by_email, archiver.name AS archived_by_name, deleter.name AS deleted_by_name
     FROM notices n
     JOIN users u ON u.id = n.created_by
     LEFT JOIN users archiver ON archiver.id = n.archived_by
     LEFT JOIN users deleter ON deleter.id = n.deleted_by
     WHERE ${conditions.join(" AND ")}
     ORDER BY COALESCE(n.archived_at, n.deleted_at, n.updated_at, n.created_at) DESC`,
    params
  );

  return rows;
}

async function getArchiveStats({ societyId = null } = {}) {
  const complaintSocietyFilter = societyId ? "WHERE resident.society_id = ?" : "";
  const noticeSocietyFilter = societyId ? "WHERE u.society_id = ?" : "";

  const [[complaintCounts], [noticeCounts], [retentionCounts]] = await Promise.all([
    db.query(
      `SELECT
         SUM(c.status = 'archived') AS archived_count,
         SUM(c.status = 'deleted') AS deleted_count,
         COUNT(*) AS total_count
       FROM complaints c
       JOIN users resident ON resident.id = c.resident_id
       ${complaintSocietyFilter}`,
      societyId ? [societyId] : []
    ),
    db.query(
      `SELECT
         SUM(n.status = 'archived') AS archived_count,
         SUM(n.status = 'deleted') AS deleted_count,
         COUNT(*) AS total_count
       FROM notices n
       JOIN users u ON u.id = n.created_by
       ${noticeSocietyFilter}`,
      societyId ? [societyId] : []
    ),
    db.query(
      `SELECT
         SUM(auto_archive_enabled = 1) AS auto_archive_enabled_count,
         COUNT(*) AS total_rules
       FROM retention_rules`
    ),
  ]);

  return {
    complaints: complaintCounts[0] || { archived_count: 0, deleted_count: 0, total_count: 0 },
    notices: noticeCounts[0] || { archived_count: 0, deleted_count: 0, total_count: 0 },
    retention: retentionCounts[0] || { auto_archive_enabled_count: 0, total_rules: 0 },
  };
}

async function getRecentAuditLogs({ limit = 20, societyId = null } = {}) {
  const societyFilter = societyId ? "AND al.society_id = ?" : "";
  const [rows] = await db.query(
    `SELECT al.id, al.user_id, al.action, al.resource_type, al.resource_id, al.details, al.status, al.created_at,
            u.name AS user_name, u.email AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.resource_type IN ('complaint', 'notice') ${societyFilter}
     ORDER BY al.created_at DESC
     LIMIT ?`,
    societyId ? [societyId, limit] : [limit]
  );

  return rows;
}

async function runArchiveMaintenance() {
  const retentionRules = await getRetentionRules();

  for (const rule of retentionRules) {
    if (!rule.auto_archive_enabled) {
      continue;
    }

    if (rule.resource_type === "complaints") {
      await db.query(
        `UPDATE complaints
         SET status = 'archived', archived_at = NOW(), archived_from_status = COALESCE(NULLIF(status, 'archived'), 'closed'), updated_at = NOW()
         WHERE status IN ('resolved', 'closed')
           AND COALESCE(resolved_at, updated_at) <= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [rule.archive_after_days || rule.retention_days || 30]
      );
    }

    if (rule.resource_type === "notices") {
      await db.query(
        `UPDATE notices
         SET status = 'archived', archived_at = NOW(), archived_from_status = COALESCE(NULLIF(status, 'archived'), 'expired'), updated_at = NOW()
         WHERE status = 'expired'
           AND COALESCE(expires_at, updated_at) <= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [rule.archive_after_days || rule.retention_days || 30]
      );
    }
  }
}

module.exports = {
  getRetentionRules,
  updateRetentionRule,
  getArchivedComplaints,
  getArchivedNotices,
  getArchiveStats,
  getRecentAuditLogs,
  runArchiveMaintenance,
};
