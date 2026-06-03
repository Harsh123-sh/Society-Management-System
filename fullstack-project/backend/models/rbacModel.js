const db = require("../db");

// ============ ROLES ============

async function createRole({ name, description, builderId = null, societyId = null }) {
  const { rows: result } = await db.query(
    `INSERT INTO roles (name, description, builder_id, society_id)
     VALUES (?, ?, ?, ?)`,
    [name, description || null, builderId || null, societyId || null]
  );
  return getRoleById(result.insertId);
}

async function getRoleById(id) {
  const { rows } = await db.query(
    `SELECT id, name, description, builder_id, society_id, created_at
     FROM roles WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getRoleByName(name, { builderId = null, societyId = null } = {}) {
  let query = `SELECT id, name, description, builder_id, society_id, created_at FROM roles WHERE name = ?`;
  const params = [name];
  
  if (builderId) {
    query += ` AND builder_id = ?`;
    params.push(builderId);
  }
  if (societyId) {
    query += ` AND society_id = ?`;
    params.push(societyId);
  }
  
  const { rows } = await db.query(query + ` LIMIT 1`, params);
  return rows[0] || null;
}

async function listRoles(builderId = null, societyId = null) {
  const filters = [];
  const params = [];
  
  if (builderId) {
    filters.push(`(builder_id = ? OR builder_id IS NULL)`);
    params.push(builderId);
  }
  if (societyId) {
    filters.push(`(society_id = ? OR society_id IS NULL)`);
    params.push(societyId);
  }
  
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  
  const { rows } = await db.query(
    `SELECT id, name, description, builder_id, society_id, created_at
     FROM roles ${whereClause} ORDER BY name ASC`,
    params
  );
  return rows;
}

// ============ PERMISSIONS ============

async function createPermission({ resource, action, description }) {
  const { rows: result } = await db.query(
    `INSERT INTO permissions (resource, action, description)
     VALUES (?, ?, ?)`,
    [resource, action, description || null]
  );
  return getPermissionById(result.insertId);
}

async function getPermissionById(id) {
  const { rows } = await db.query(
    `SELECT id, resource, action, description, created_at
     FROM permissions WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listPermissions() {
  const { rows } = await db.query(
    `SELECT id, resource, action, description, created_at
     FROM permissions ORDER BY resource ASC, action ASC`
  );
  return rows;
}

async function getPermissionByResourceAction(resource, action) {
  const { rows } = await db.query(
    `SELECT id, resource, action, description, created_at
     FROM permissions WHERE resource = ? AND action = ? LIMIT 1`,
    [resource, action]
  );
  return rows[0] || null;
}

// ============ ROLE-PERMISSION MAPPING ============

async function grantPermissionToRole(roleId, permissionId) {
  try {
    const { rows: result } = await db.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES (?, ?)`,
      [roleId, permissionId]
    );
    return result.insertId;
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return null; // Already granted
    }
    throw error;
  }
}

async function revokePermissionFromRole(roleId, permissionId) {
  const { rows: result } = await db.query(
    `DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?`,
    [roleId, permissionId]
  );
  return result.affectedRows > 0;
}

async function getRolePermissions(roleId) {
  const { rows } = await db.query(
    `SELECT p.id, p.resource, p.action, p.description
     FROM role_permissions rp
     JOIN permissions p ON p.id = rp.permission_id
     WHERE rp.role_id = ?
     ORDER BY p.resource ASC, p.action ASC`,
    [roleId]
  );
  return rows;
}

// ============ USER-ROLE MAPPING ============

async function assignRoleToUser(userId, roleId, { societyId = null, builderId = null } = {}) {
  try {
    const { rows: result } = await db.query(
      `INSERT INTO user_roles (user_id, role_id, society_id, builder_id)
       VALUES (?, ?, ?, ?)`,
      [userId, roleId, societyId || null, builderId || null]
    );
    return result.insertId;
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return null; // Already assigned
    }
    throw error;
  }
}

async function removeRoleFromUser(userId, roleId) {
  const { rows: result } = await db.query(
    `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`,
    [userId, roleId]
  );
  return result.affectedRows > 0;
}

async function getUserRoles(userId) {
  const { rows } = await db.query(
    `SELECT ur.id, r.id as role_id, r.name, r.description, ur.society_id, ur.builder_id
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ?
     ORDER BY r.name ASC`,
    [userId]
  );
  return rows;
}

async function getUserPermissions(userId) {
  const { rows } = await db.query(
    `SELECT DISTINCT p.id, p.resource, p.action, p.description
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = ?
     ORDER BY p.resource ASC, p.action ASC`,
    [userId]
  );
  return rows;
}

async function hasPermission(userId, resource, action) {
  const { rows } = await db.query(
    `SELECT COUNT(*) as count
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE ur.user_id = ? AND p.resource = ? AND p.action = ?
     LIMIT 1`,
    [userId, resource, action]
  );
  return rows[0]?.count > 0;
}

module.exports = {
  createRole,
  getRoleById,
  getRoleByName,
  listRoles,
  createPermission,
  getPermissionById,
  listPermissions,
  getPermissionByResourceAction,
  grantPermissionToRole,
  revokePermissionFromRole,
  getRolePermissions,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getUserPermissions,
  hasPermission,
};
