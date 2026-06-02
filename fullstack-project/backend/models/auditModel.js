const db = require("../db");

/**
 * Create audit log entry
 */
async function createAuditLog({
  userId,
  action,
  resourceType,
  resourceId,
  details = null,
  oldValues = null,
  newValues = null,
  status = "success",
  ipAddress = null,
  userAgent = null,
  societyId = null,
  builderId = null,
}) {
  const [result] = await db.query(
    `INSERT INTO audit_logs (
      user_id, action, resource_type, resource_id, details,
      old_values, new_values, status, ip_address, user_agent,
      society_id, builder_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      userId,
      action,
      resourceType,
      resourceId || null,
      details ? JSON.stringify(details) : null,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      status,
      ipAddress || null,
      userAgent || null,
      societyId || null,
      builderId || null,
    ]
  );
  return result.insertId;
}

/**
 * Get audit logs with filters
 */
async function getAuditLogs({
  userId = null,
  resourceType = null,
  action = null,
  societyId = null,
  builderId = null,
  status = null,
  startDate = null,
  endDate = null,
  limit = 100,
  offset = 0,
} = {}) {
  const filters = [];
  const params = [];

  if (userId) {
    filters.push("user_id = ?");
    params.push(userId);
  }

  if (resourceType) {
    filters.push("resource_type = ?");
    params.push(resourceType);
  }

  if (action) {
    filters.push("action = ?");
    params.push(action);
  }

  if (societyId) {
    filters.push("society_id = ?");
    params.push(societyId);
  }

  if (builderId) {
    filters.push("builder_id = ?");
    params.push(builderId);
  }

  if (status) {
    filters.push("status = ?");
    params.push(status);
  }

  if (startDate) {
    filters.push("created_at >= ?");
    params.push(startDate);
  }

  if (endDate) {
    filters.push("created_at <= ?");
    params.push(endDate);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT al.*, u.name AS user_name, u.email AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return rows;
}

/**
 * Get audit log count
 */
async function getAuditLogCount({
  userId = null,
  resourceType = null,
  action = null,
  societyId = null,
  builderId = null,
  status = null,
  startDate = null,
  endDate = null,
} = {}) {
  const filters = [];
  const params = [];

  if (userId) {
    filters.push("user_id = ?");
    params.push(userId);
  }

  if (resourceType) {
    filters.push("resource_type = ?");
    params.push(resourceType);
  }

  if (action) {
    filters.push("action = ?");
    params.push(action);
  }

  if (societyId) {
    filters.push("society_id = ?");
    params.push(societyId);
  }

  if (builderId) {
    filters.push("builder_id = ?");
    params.push(builderId);
  }

  if (status) {
    filters.push("status = ?");
    params.push(status);
  }

  if (startDate) {
    filters.push("created_at >= ?");
    params.push(startDate);
  }

  if (endDate) {
    filters.push("created_at <= ?");
    params.push(endDate);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT COUNT(*) as count FROM audit_logs al ${whereClause}`,
    params
  );

  return rows[0]?.count || 0;
}

/**
 * Get audit log by ID
 */
async function getAuditLogById(id) {
  const [rows] = await db.query(
    `SELECT al.*, u.name AS user_name, u.email AS user_email
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Get activity summary for dashboard
 */
async function getActivitySummary(builderId = null, societyId = null, hours = 24) {
  const filters = [];
  const params = [];

  filters.push(`created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)`);
  params.push(hours);

  if (builderId) {
    filters.push("builder_id = ?");
    params.push(builderId);
  }

  if (societyId) {
    filters.push("society_id = ?");
    params.push(societyId);
  }

  const whereClause = `WHERE ${filters.join(" AND ")}`;

  const [rows] = await db.query(
    `SELECT
      action,
      COUNT(*) as count,
      COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
      COUNT(CASE WHEN status = 'error' THEN 1 END) as failed
     FROM audit_logs
     ${whereClause}
     GROUP BY action
     ORDER BY count DESC`,
    params
  );

  return rows;
}

module.exports = {
  createAuditLog,
  getAuditLogs,
  getAuditLogCount,
  getAuditLogById,
  getActivitySummary,
};
