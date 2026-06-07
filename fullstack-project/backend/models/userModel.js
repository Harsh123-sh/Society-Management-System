const db = require("../config/db");
const ALLOWED_ROLES = ["super_admin", "admin", "chairman", "secretary", "resident", "staff", "security"];
const RESIDENT_TYPES = ["owner", "tenant"];
const ACCOUNT_STATUSES = ["pending", "active", "rejected", "inactive"];
let userTableColumnsCache = null;

async function getUserTableColumns() {
  if (!userTableColumnsCache) {
    userTableColumnsCache = (async () => {
      const { rows } = await db.query(
        `SELECT column_name
         FROM information_schema.columns
         WHERE table_catalog = current_database()
           AND table_schema = 'public'
           AND table_name = 'users'`
      );

      return new Set(rows.map((row) => row.column_name));
    })();
  }

  return userTableColumnsCache;
}

let existingTablesCache = null;

async function tableExists(tableName) {
  if (!existingTablesCache) {
    const { rows } = await db.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_catalog = current_database()
         AND table_schema = 'public'`
    );
    existingTablesCache = new Set(rows.map((row) => row.table_name));
  }

  return existingTablesCache.has(tableName);
}

async function getUserByEmailAndSociety(email, societyId) {
  const { rows } = await pool.query(
    `
    SELECT *
    FROM users
    WHERE LOWER(email) = LOWER($1)
      AND society_id = $2
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [email, societyId]
  );

  return rows[0] || null;
}

function buildDeletedEmail(originalEmail, userId) {
  const timestamp = Date.now();
  const suffix = `__deleted_${timestamp}_${userId}`;
  const maxEmailLength = 150;

  if (!originalEmail || !originalEmail.includes("@")) {
    return `deleted_${userId}_${timestamp}@deleted.local`;
  }

  const [localPart, domainPart] = originalEmail.split("@");
  const minRequiredLength = suffix.length + 1 + domainPart.length;

  if (minRequiredLength >= maxEmailLength) {
    return `deleted_${userId}_${timestamp}@deleted.local`;
  }

  const allowedLocalLength = maxEmailLength - minRequiredLength;
  const trimmedLocal = localPart.slice(0, allowedLocalLength);
  return `${trimmedLocal}${suffix}@${domainPart}`;
}

async function getAllUsers({ search, status, role, societyId } = {}) {
  const conditions = [];
  const params = [];

  if (societyId) {
    conditions.push("u.society_id = ?");
    params.push(societyId);
  }

  if (search) {
    conditions.push(
      "(u.name LIKE ? OR u.email LIKE ? OR u.role LIKE ? OR u.resident_type LIKE ? OR u.flat_number LIKE ? OR s.code LIKE ?)"
    );
    const likeQuery = `%${search}%`;
    params.push(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery);
  }

  if (ACCOUNT_STATUSES.includes(status)) {
    conditions.push("u.status = ?");
    params.push(status);
  }

  if (ALLOWED_ROLES.includes(role)) {
    conditions.push("u.role = ?");
    params.push(role);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.role, u.resident_type, u.status, u.is_verified,
            u.society_id, u.flat_id, u.flat_number, s.code AS society_code, s.name AS society_name,
             u.deleted_at, u.deleted_by, u.delete_reason, u.permanently_deleted_at, u.created_at
     FROM users u
     LEFT JOIN societies s ON s.id = u.society_id
     ${whereClause}
     ORDER BY u.id DESC`,
    params
  );
  return rows;
}

async function getDeletedUsers({ search, societyId } = {}) {
  const conditions = ["u.status = 'inactive'"];
  const params = [];

  if (societyId) {
    conditions.push("u.society_id = ?");
    params.push(societyId);
  }

  if (search) {
    conditions.push(
      "(u.name LIKE ? OR u.email LIKE ? OR u.role LIKE ? OR u.resident_type LIKE ? OR u.flat_number LIKE ? OR s.code LIKE ? OR u.delete_reason LIKE ?)"
    );
    const likeQuery = `%${search}%`;
    params.push(
      likeQuery,
      likeQuery,
      likeQuery,
      likeQuery,
      likeQuery,
      likeQuery,
      likeQuery
    );
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.original_email, u.role, u.resident_type, u.status,
            u.is_verified, u.society_id, u.flat_id, u.flat_number, s.code AS society_code,
            s.name AS society_name, u.deleted_at, u.deleted_by, u.delete_reason,
             u.permanently_deleted_at,
            deleter.name AS deleted_by_name, u.created_at
     FROM users u
     LEFT JOIN societies s ON s.id = u.society_id
     LEFT JOIN users deleter ON deleter.id = u.deleted_by
     ${whereClause}
     ORDER BY u.deleted_at DESC, u.id DESC`,
    params
  );

  return rows;
}

async function createUser({
  name,
  email,
  password,
  role,
  residentType,
  status,
  isVerified,
  societyId,
  flatId,
  flatNumber,
  phone,
  address,
}) {
  const selectedRole = ALLOWED_ROLES.includes(role) ? role : "resident";
  const selectedResidentType = RESIDENT_TYPES.includes(residentType)
    ? residentType
    : selectedRole === "resident"
      ? "owner"
      : null;
  const selectedStatus = ACCOUNT_STATUSES.includes(status)
    ? status
    : selectedRole === "resident"
      ? "pending"
      : "active";
  const selectedVerificationState =
    typeof isVerified === "boolean"
      ? Number(isVerified)
      : selectedRole === "resident"
        ? 0
        : 1;

  const userColumns = await getUserTableColumns();
  const fields = ["name", "email", "password", "role", "resident_type", "status", "is_verified", "society_id", "flat_id", "flat_number"];
  const values = [
    name,
    email,
    password,
    selectedRole,
    selectedResidentType,
    selectedStatus,
    selectedVerificationState,
    societyId || null,
    flatId || null,
    flatNumber || null,
  ];

  if (userColumns.has("phone")) {
    fields.push("phone");
    values.push(phone || null);
  }

  if (userColumns.has("address")) {
    fields.push("address");
    values.push(address || null);
  }

  const { rows: result } = await db.query(
    `INSERT INTO users (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")}) RETURNING id`,
    values
  );

  return {
    id: result[0]?.id,
    name,
    email,
    role: selectedRole,
    resident_type: selectedResidentType,
    status: selectedStatus,
    is_verified: selectedVerificationState,
    society_id: societyId || null,
    flat_id: flatId || null,
    flat_number: flatNumber || null,
    phone: phone || null,
    address: address || null,
  };
}

async function countUsersByRoleAndSociety(role, societyId) {
  const { rows } = await db.query(
    `SELECT COUNT(*) AS count
     FROM users
     WHERE society_id = ?
       AND role = ?
       AND status IN ('pending', 'active')`,
    [societyId, role]
  );

  return Number(rows[0]?.count || 0);
}

async function getUserCountsByRolesAndStatus({ societyId, roles = [], statuses = [] } = {}) {
  const conditions = [];
  const params = [];

  if (societyId) {
    conditions.push("society_id = ?");
    params.push(societyId);
  }

  if (Array.isArray(roles) && roles.length) {
    conditions.push(`role IN (${roles.map(() => "?").join(", ")})`);
    params.push(...roles);
  }

  if (Array.isArray(statuses) && statuses.length) {
    conditions.push(`status IN (${statuses.map(() => "?").join(", ")})`);
    params.push(...statuses);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT COUNT(*) AS count
     FROM users
     ${whereClause}`,
    params
  );

  return rows[0] || { count: 0 };
}

async function getFlatByWingAndNumber({ societyId, wingId, wing, flatNumber }) {
  const filters = [];
  const params = [];

  if (societyId) {
    filters.push("f.society_id = ?");
    params.push(societyId);
  }

  if (wingId) {
    filters.push("f.wing_id = ?");
    params.push(wingId);
  } else if (wing) {
    filters.push("f.wing = ?");
    params.push(wing);
  }

  filters.push("f.flat_number = ?");
  params.push(flatNumber);

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT f.id, f.building_name, f.wing, f.wing_id, f.flat_number, f.floor, f.flat_type
     FROM flats f
     ${whereClause}
     ORDER BY f.id ASC
     LIMIT 1`,
    params
  );

  return rows[0] || null;
}

async function createOwnerProperty({ userId, flatId, livingStartDate }) {
  if (!(await tableExists("owner_properties"))) {
    return null;
  }

  const { rows: result } = await db.query(
    `INSERT INTO owner_properties (user_id, flat_id, living_start_date)
     VALUES (?, ?, ?)
     ON CONFLICT (flat_id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       living_start_date = EXCLUDED.living_start_date
     RETURNING id`,
    [userId, flatId, livingStartDate || null]
  );

  return result[0]?.id || flatId;
}

async function syncOwnerPropertyMapping(userId, flatId = null) {
  const { rows: userRows } = await db.query(
    `SELECT id, flat_id, resident_type, status
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );

  const user = userRows[0] || null;
  if (!user || user.resident_type !== "owner") {
    return null;
  }

  const targetFlatId = Number(flatId || user.flat_id || 0);
  if (!targetFlatId) {
    return null;
  }

  const { rows: flatRows } = await db.query(
    `SELECT id, building_name, wing, flat_number, floor, flat_type
     FROM flats
     WHERE id = ?
     LIMIT 1`,
    [targetFlatId]
  );

  const flat = flatRows[0] || null;
  if (!flat) {
    return null;
  }

  await createOwnerProperty({
    userId: user.id,
    flatId: flat.id,
    livingStartDate: new Date(),
  });

  return flat;
}

async function updateUserFlatAssignment({ userId, flatId, flatNumber = null }) {
  await db.query(
    `UPDATE users
     SET flat_id = ?, flat_number = ?
     WHERE id = ?`,
    [flatId || null, flatNumber || null, userId]
  );

  return getUserById(userId);
}

async function updateUserRoleById(id, role) {
  const selectedRole = ALLOWED_ROLES.includes(role) ? role : "resident";

  await db.query("UPDATE users SET role = ? WHERE id = ?", [selectedRole, id]);

  return getUserById(id);
}

async function updateUserStatusById(id, status) {
  const selectedStatus = ACCOUNT_STATUSES.includes(status) ? status : "pending";

  await db.query("UPDATE users SET status = ? WHERE id = ?", [selectedStatus, id]);

  return getUserById(id);
}

async function updateUserById(id, { name, email, phone, profilePhotoUrl, familyMembers }) {
  const fields = [];
  const params = [];
  const userColumns = await getUserTableColumns();

  if (name !== undefined) {
    fields.push("name = ?");
    params.push(name);
  }
  if (email !== undefined) {
    fields.push("email = ?");
    params.push(email);
  }
  if (phone !== undefined && userColumns.has("phone")) {
    fields.push("phone = ?");
    params.push(phone);
  }
  if (profilePhotoUrl !== undefined && userColumns.has("profile_photo_url")) {
    fields.push("profile_photo_url = ?");
    params.push(profilePhotoUrl);
  }
  if (familyMembers !== undefined && userColumns.has("family_members")) {
    fields.push("family_members = ?");
    params.push(JSON.stringify(familyMembers || null));
  }

  if (!fields.length) return getUserById(id);

  params.push(id);
  await db.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, params);

  return getUserById(id);
}

async function deleteOwnerPropertyById(propertyId) {
  if (!(await tableExists("owner_properties"))) {
    return false;
  }

  const result = await db.query(
    `DELETE FROM owner_properties WHERE id = ?`,
    [propertyId]
  );

  return result.rowCount > 0;
}

async function getUserByEmail(email) {
  const { rows } = await db.query(
    `SELECT
       u.id,
       u.name,
       u.full_name,
       u.email,
       u.password,
       u.role,
       u.status,
       u.is_verified,
       u.resident_type,
       u.society_id,
       u.flat_id,
       u.flat_number,
       s.code AS society_code,
       s.slug AS society_slug,
       s.subdomain AS society_subdomain,
       s.name AS society_name,
       s.builder_id,
       u.created_at,
       u.updated_at
     FROM users u
     LEFT JOIN societies s ON s.id = u.society_id
     WHERE LOWER(TRIM(u.email)) = LOWER(TRIM($1))
     LIMIT 1`,
    [email]
  );

  const user = rows[0] || null;
  if (user) {
    console.log("[userModel.getUserByEmail] fetched user record", {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      society_id: user.society_id,
    });
  } else {
    console.log("[userModel.getUserByEmail] no user found for email", email);
  }

  return user;
}

async function getSuperAdminByEmail(email) {
  const { rows } = await db.query(
    `SELECT
       u.id,
       u.name,
       u.full_name,
       u.email,
       u.password,
       u.role,
       u.status,
       u.is_verified,
       u.resident_type,
       u.society_id,
       u.flat_id,
       u.flat_number,
       s.code AS society_code,
       s.slug AS society_slug,
       s.subdomain AS society_subdomain,
       s.name AS society_name,
       s.builder_id
     FROM users u
     LEFT JOIN societies s ON s.id = u.society_id
     WHERE LOWER(TRIM(u.email)) = LOWER(TRIM($1))
       AND u.role = 'super_admin'
       AND u.status = 'active'
       AND u.is_verified = true
     LIMIT 1`,
    [email]
  );

  const user = rows[0] || null;
  if (user) {
    console.log("[userModel.getSuperAdminByEmail] fetched super admin record", {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      is_verified: user.is_verified,
      society_id: user.society_id,
    });
  } else {
    console.log("[userModel.getSuperAdminByEmail] no active verified super admin found for email", email);
  }

  return user;
}

async function getUserById(id) {
  const { rows } = await db.query(
        `SELECT u.id, u.name, u.email, u.role, u.resident_type, u.status, u.is_verified,
          u.society_id, u.flat_id, u.flat_number, s.code AS society_code, s.slug AS society_slug,
          s.subdomain AS society_subdomain, s.name AS society_name, s.builder_id,
            u.created_at, u.updated_at
     FROM users u
     LEFT JOIN societies s ON s.id = u.society_id
     WHERE u.id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function verifyUserByEmail(email) {
  await db.query("UPDATE users SET is_verified = TRUE, status = 'pending' WHERE email = ?", [email]);
}

async function hasOwnerForFlat({ societyId, flatNumber }) {
  const { rows } = await db.query(
    `SELECT id
     FROM users
     WHERE society_id = ?
       AND flat_number = ?
       AND resident_type = 'owner'
       AND status IN ('pending', 'active', 'rejected')
     LIMIT 1`,
    [societyId, flatNumber]
  );

  return rows.length > 0;
}

async function hasOwnerForFlatId(flatId) {
  if (await tableExists("owner_properties")) {
    try {
      const { rows } = await db.query(
        `SELECT id
         FROM owner_properties
         WHERE flat_id = ?
         LIMIT 1`,
        [flatId]
      );

      return rows.length > 0;
    } catch (error) {
      if (error?.code === "42P01" || /relation "owner_properties"/i.test(error?.message || "")) {
        // Fallback when the table is absent or the schema is inconsistent
      } else {
        throw error;
      }
    }
  }

  const { rows } = await db.query(
    `SELECT id
     FROM users
     WHERE flat_id = ?
       AND resident_type = 'owner'
       AND status IN ('pending', 'active', 'rejected')
     LIMIT 1`,
    [flatId]
  );

  return rows.length > 0;
}

async function getOwnerPropertyRows(ownerId) {
  if (!(await tableExists("owner_properties"))) {
    return [];
  }

  const { rows } = await db.query(
    `SELECT
       op.id AS owner_property_id,
       op.user_id,
       op.flat_id,
       op.living_start_date,
       u.id AS owner_id,
       u.name AS owner_name,
       u.email AS owner_email,
       f.building_name,
       f.wing,
       f.flat_number,
       f.floor,
       f.flat_type
     FROM owner_properties op
     JOIN users u ON u.id = op.user_id
     JOIN flats f ON f.id = op.flat_id
     WHERE op.user_id = ?
     ORDER BY f.building_name ASC, f.flat_number ASC, f.wing ASC`,
    [ownerId]
  );

  return rows;
}

async function updatePasswordByEmail(email, hashedPassword) {
  await db.query("UPDATE users SET password = ? WHERE email = ?", [
    hashedPassword,
    email,
  ]);
}

async function countActiveAdmins(excludeUserId = null) {
  const params = [];
  let exclusionClause = "";

  if (excludeUserId) {
    exclusionClause = "AND id <> ?";
    params.push(excludeUserId);
  }

  const { rows } = await db.query(
    `SELECT COUNT(*) AS count
     FROM users
     WHERE role = 'admin'
       AND status = 'active'
       ${exclusionClause}`,
    params
  );

  return Number(rows[0]?.count || 0);
}

async function softDeleteUserById({ userId, deletedBy, deleteReason }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows] = await connection.query(
      `SELECT id, email, role, status
       FROM users
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [userId]
    );

    const user = userRows[0] || null;
    if (!user) {
      await connection.rollback();
      return null;
    }

    if (user.status === "inactive") {
      await connection.rollback();
      return { alreadyInactive: true };
    }

    const archivedEmail = buildDeletedEmail(user.email, user.id);

    const [activeFlatRows] = await connection.query(
      `SELECT DISTINCT flat_id
       FROM flat_residents
       WHERE resident_id = ? AND is_active = TRUE`,
      [userId]
    );

    await connection.query(
      `UPDATE flat_residents
       SET is_active = FALSE,
           move_out_date = COALESCE(move_out_date, CURRENT_DATE)
       WHERE resident_id = ? AND is_active = TRUE`,
      [userId]
    );

    for (const row of activeFlatRows) {
      const flatId = row.flat_id;
      const [remainingActiveRows] = await connection.query(
        `SELECT COUNT(*) AS count
         FROM flat_residents
         WHERE flat_id = ? AND is_active = TRUE`,
        [flatId]
      );

      const hasActiveResidents = Number(remainingActiveRows[0]?.count || 0) > 0;
      await connection.query(
        "UPDATE flats SET status = ? WHERE id = ?",
        [hasActiveResidents ? "occupied" : "vacant", flatId]
      );
    }

    await connection.query(
      `UPDATE users
       SET email = ?,
           original_email = COALESCE(original_email, email),
           status = 'inactive',
           deleted_at = NOW(),
           deleted_by = ?,
           delete_reason = ?
       WHERE id = ?`,
      [archivedEmail, deletedBy || null, deleteReason || null, userId]
    );

    await connection.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES (?, 'user_soft_deleted', 'user', ?, json_build_object('deletedBy', ?, 'archivedEmail', ?, 'reason', ?))`,
      [deletedBy || null, userId, deletedBy || null, archivedEmail, deleteReason || null]
    );

    await connection.commit();

    return {
      alreadyInactive: false,
      archivedEmail,
      userId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function restoreUserById({ userId, restoredBy }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows] = await connection.query(
      `SELECT id, email, original_email, status, permanently_deleted_at
       FROM users
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [userId]
    );

    const user = userRows[0] || null;
    if (!user) {
      await connection.rollback();
      return null;
    }

    if (user.status !== "inactive") {
      await connection.rollback();
      return { notDeleted: true };
    }

    if (user.permanently_deleted_at) {
      await connection.rollback();
      return {
        cannotRestore: true,
        reason: "User was permanently deleted from trash",
      };
    }

    const restoreEmail = user.original_email;
    if (!restoreEmail) {
      await connection.rollback();
      return { cannotRestore: true, reason: "Original email is not available" };
    }

    const [emailRows] = await connection.query(
      `SELECT id
       FROM users
       WHERE email = ? AND id <> ?
       LIMIT 1`,
      [restoreEmail, userId]
    );

    if (emailRows.length) {
      await connection.rollback();
      return {
        cannotRestore: true,
        reason: "Email is already in use by another account",
      };
    }

    await connection.query(
      `UPDATE users
       SET email = ?,
           status = 'active',
           deleted_at = NULL,
           deleted_by = NULL,
           delete_reason = NULL,
           permanently_deleted_at = NULL
       WHERE id = ?`,
      [restoreEmail, userId]
    );

    await connection.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES (?, 'user_restored', 'user', ?, json_build_object('restoredBy', ?, 'restoredEmail', ?))`,
      [restoredBy || null, userId, restoredBy || null, restoreEmail]
    );

    await connection.commit();

    return {
      restored: true,
      userId,
      email: restoreEmail,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function permanentlyDeleteUserById({ userId, deletedBy }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [userRows] = await connection.query(
      `SELECT id, status
       FROM users
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [userId]
    );

    const user = userRows[0] || null;
    if (!user) {
      await connection.rollback();
      return null;
    }

    if (user.status !== "inactive") {
      await connection.rollback();
      return { notInTrash: true };
    }

    await connection.query(
      `UPDATE users
       SET delete_reason = COALESCE(delete_reason, '') ||
         CASE
           WHEN COALESCE(delete_reason, '') = '' THEN ''
           ELSE ' | '
         END ||
         'PERMANENT_DELETE_FINALIZED',
           permanently_deleted_at = NOW()
       WHERE id = ?`,
      [userId]
    );

    await connection.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES (?, 'user_permanent_delete_finalized', 'user', ?, json_build_object('deletedBy', ?))`,
      [deletedBy || null, userId, deletedBy || null]
    );

    await connection.commit();

    return {
      finalized: true,
      userId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getUsersByCategory(category, { search, status, societyId } = {}) {
  const conditions = ["u.status = 'active'"];
  const params = [];

  if (societyId) {
    conditions.push("u.society_id = ?");
    params.push(societyId);
  }

  if (category === "residents") {
    conditions.push("u.role = 'resident'");
  } else if (category === "staff") {
    conditions.push("u.role = 'staff'");
  } else if (category === "security") {
    conditions.push("u.role = 'security'");
  } else {
    return [];
  }

  if (search) {
    conditions.push(
      "(u.name LIKE ? OR u.email LIKE ? OR u.flat_number LIKE ? OR u.resident_type LIKE ?)"
    );
    const likeQuery = `%${search}%`;
    params.push(likeQuery, likeQuery, likeQuery, likeQuery);
  }

  if (status && ACCOUNT_STATUSES.includes(status)) {
    conditions[0] = `u.status = '${status}'`;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.role, u.resident_type, u.status, u.is_verified,
            u.society_id, u.flat_id, u.flat_number, s.code AS society_code, s.name AS society_name,
            u.created_at
     FROM users u
     LEFT JOIN societies s ON s.id = u.society_id
     ${whereClause}
     ORDER BY u.created_at DESC, u.id DESC`,
    params
  );

  return rows;
}

async function touchUserLastLogin(userId) {
  const userColumns = await getUserTableColumns();
  if (!userColumns.has("last_login")) {
    return false;
  }

  await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [userId]);
  return true;
}

async function getUserDirectory({
  search = "",
  status = "",
  role = "",
  wing = "",
  floor = "",
  flatNumber = "",
  kyc = "",
  registrationFrom = "",
  registrationTo = "",
  page = 1,
  limit = 20,
  societyId = null,
} = {}) {
  const userColumns = await getUserTableColumns();
  console.log('[getUserDirectory] schema flags', {
    hasPhone: userColumns.has('phone'),
    hasCreatedAt: userColumns.has('created_at'),
    hasDeletedAt: userColumns.has('deleted_at'),
  });
  const selectFields = [
    "u.id",
    "u.name",
    "u.email",
    "u.role",
    "u.resident_type",
    "u.status",
    "u.is_verified",
    "u.society_id",
    "u.flat_id",
    "u.flat_number",
    "s.code AS society_code",
    "s.name AS society_name",
    "s.address AS society_address",
    "s.city AS society_city",
    "s.state AS society_state",
    "s.pincode AS society_pincode",
    "f.building_name",
    "f.wing AS flat_wing",
    "f.floor AS flat_floor",
    "f.flat_number AS flat_flat_number",
    "f.status AS flat_status",
    "w.name AS wing_name",
    "w.code AS wing_code",
    "w.id AS wing_id",
  ];

  if (userColumns.has("profile_photo_url")) {
    selectFields.push("u.profile_photo_url");
  } else {
    selectFields.push("NULL AS profile_photo_url");
  }

  // Audit columns are intentionally omitted here because older deployments may not have them.
  selectFields.push("NULL AS created_at");
  selectFields.push("NULL AS updated_at");
  selectFields.push("NULL AS deleted_at");
  selectFields.push("NULL AS deleted_by");
  selectFields.push("NULL AS delete_reason");

  if (userColumns.has("phone")) {
    selectFields.push("u.phone");
  } else {
    selectFields.push("NULL AS phone");
  }

  if (userColumns.has("family_members")) {
    selectFields.push("u.family_members");
  } else {
    selectFields.push("NULL AS family_members");
  }

  if (userColumns.has("approval_status")) {
    selectFields.push("u.approval_status");
  } else {
    selectFields.push("NULL AS approval_status");
  }

  if (userColumns.has("approved_at")) {
    selectFields.push("u.approved_at");
  } else {
    selectFields.push("NULL AS approved_at");
  }

  if (userColumns.has("kyc_status")) {
    selectFields.push("u.kyc_status");
  } else {
    selectFields.push("NULL AS kyc_status");
  }

  if (userColumns.has("last_login")) {
    selectFields.push("u.last_login");
  } else {
    selectFields.push("NULL AS last_login");
  }

  console.log('[getUserDirectory] selectFields', selectFields);

  const joins = [
    "LEFT JOIN societies s ON s.id = u.society_id",
    "LEFT JOIN flats f ON f.id = u.flat_id",
    "LEFT JOIN wings w ON w.id = f.wing_id",
  ];

  const whereClauses = ["u.deleted_at IS NULL", "u.role <> 'super_admin'", "u.email LIKE '%@%'"];
  const params = [];

  if (societyId) {
    whereClauses.push("u.society_id = ?");
    params.push(societyId);
  }

  const normalizedRole = String(role || "").trim().toLowerCase();
  if (normalizedRole && normalizedRole !== "all") {
    if (normalizedRole === "chairman") {
      whereClauses.push("u.role = 'admin'");
    } else if (normalizedRole === "owner" || normalizedRole === "tenant") {
      whereClauses.push("u.role = 'resident'");
      whereClauses.push("u.resident_type = ?");
      params.push(normalizedRole);
    } else if (ALLOWED_ROLES.includes(normalizedRole)) {
      whereClauses.push("u.role = ?");
      params.push(normalizedRole);
    }
  }

  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (normalizedStatus && normalizedStatus !== "all" && ACCOUNT_STATUSES.includes(normalizedStatus)) {
    whereClauses.push("u.status = ?");
    params.push(normalizedStatus);
  }

  const normalizedKyc = String(kyc || "").trim().toLowerCase();
  if (normalizedKyc && normalizedKyc !== "all" && userColumns.has("kyc_status")) {
    whereClauses.push("u.kyc_status = ?");
    params.push(normalizedKyc);
  }

  if (search) {
    const likeQuery = `%${search}%`;
    const searchParts = ["u.name LIKE ?", "u.email LIKE ?", "u.flat_number LIKE ?", "f.flat_number LIKE ?", "f.wing LIKE ?", "w.name LIKE ?", "w.code LIKE ?", "s.name LIKE ?", "s.code LIKE ?"];
    const searchParams = [likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, likeQuery];

    if (userColumns.has("phone")) {
      // prefer phone near the front for faster match if available
      searchParts.splice(1, 0, "u.phone LIKE ?");
      searchParams.splice(1, 0, likeQuery);
    }

    whereClauses.push(`(${searchParts.join(" OR ")})`);
    params.push(...searchParams);
  }

  if (wing) {
    whereClauses.push("(f.wing = ? OR w.name = ? OR w.code = ?)");
    params.push(wing, wing, wing);
  }

  if (floor !== "" && floor !== null && floor !== undefined) {
    whereClauses.push("CAST(f.floor AS CHAR) = ?");
    params.push(String(floor));
  }

  if (flatNumber) {
    whereClauses.push("(u.flat_number = ? OR f.flat_number = ?)");
    params.push(flatNumber, flatNumber);
  }

  if (registrationFrom) {
    whereClauses.push("DATE(u.created_at) >= ?");
    params.push(registrationFrom);
  }

  if (registrationTo) {
    whereClauses.push("DATE(u.created_at) <= ?");
    params.push(registrationTo);
  }

  const whereClause = `WHERE ${whereClauses.join(" AND ")}`;
  const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 20, 1), 100);
  const offset = (pageNumber - 1) * pageSize;

  const { rows: countRows } = await db.query(
    `SELECT COUNT(*) AS total
     FROM users u
     ${joins.join("\n     ")}
     ${whereClause}`,
    params
  );

  const summaryParams = [];
  const summaryWhere = ["u.deleted_at IS NULL", "u.role <> 'super_admin'"];
  if (societyId) {
    summaryWhere.push("u.society_id = ?");
    summaryParams.push(societyId);
  }

  const { rows: summaryRows } = await db.query(
    `SELECT
        COUNT(CASE WHEN u.role = 'resident' THEN 1 END) AS total_residents,
        COUNT(CASE WHEN u.role = 'resident' AND u.resident_type = 'owner' THEN 1 END) AS total_owners,
        COUNT(CASE WHEN u.role = 'resident' AND u.resident_type = 'tenant' THEN 1 END) AS total_tenants,
        COUNT(CASE WHEN u.role = 'staff' THEN 1 END) AS total_staff,
        COUNT(CASE WHEN u.role = 'security' THEN 1 END) AS total_security,
        COUNT(CASE WHEN u.status = 'pending' THEN 1 END) AS pending_approvals,
        COUNT(CASE WHEN u.status = 'active' THEN 1 END) AS active_members
     FROM users u
     WHERE ${summaryWhere.join(" AND ")}`,
    summaryParams
  );

  const { rows: vacantRows } = await db.query(
    `SELECT COUNT(*) AS vacant_flats
     FROM flats f
     WHERE f.society_id = ?
       AND LOWER(COALESCE(f.status, '')) IN ('vacant', 'available', 'empty')`,
    [societyId || 0]
  );

  const { rows } = await db.query(
    `SELECT ${selectFields.join(",\n            ")}
     FROM users u
     ${joins.join("\n     ")}
     ${whereClause}
     ORDER BY u.created_at DESC, u.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    rows,
    total: Number(countRows[0]?.total || 0),
    summary: {
      totalResidents: Number(summaryRows[0]?.total_residents || 0),
      totalOwners: Number(summaryRows[0]?.total_owners || 0),
      totalTenants: Number(summaryRows[0]?.total_tenants || 0),
      totalStaff: Number(summaryRows[0]?.total_staff || 0),
      totalSecurity: Number(summaryRows[0]?.total_security || 0),
      pendingApprovals: Number(summaryRows[0]?.pending_approvals || 0),
      activeMembers: Number(summaryRows[0]?.active_members || 0),
      vacantFlats: Number(vacantRows[0]?.vacant_flats || 0),
    },
    page: pageNumber,
    limit: pageSize,
  };
}

module.exports = {
  getAllUsers,
  getDeletedUsers,
  createUser,
  getUserByEmail,
  getSuperAdminByEmail,
  getUserById,
  updateUserRoleById,
  updateUserStatusById,
  verifyUserByEmail,
  hasOwnerForFlat,
  hasOwnerForFlatId,
  createOwnerProperty,
  syncOwnerPropertyMapping,
  updateUserFlatAssignment,
  getOwnerPropertyRows,
  getFlatByWingAndNumber,
  countUsersByRoleAndSociety,
  getUserCountsByRolesAndStatus,
  countActiveAdmins,
  softDeleteUserById,
  restoreUserById,
  permanentlyDeleteUserById,
  updatePasswordByEmail,
  getUsersByCategory,
  getUserDirectory,
  touchUserLastLogin,
};
