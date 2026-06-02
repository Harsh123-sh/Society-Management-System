const db = require("../db");

async function createFlat({
  societyId,
  towerId = null,
  buildingName,
  wingId,
  wing,
  flatNumber,
  floor,
  flatType,
  occupancyStatus = "vacant",
  approvalStatus = "pending",
  createdBy,
}) {
  const [result] = await db.query(
    `INSERT INTO flats (
      society_id,
      tower_id,
      building_name,
      wing,
      wing_id,
      flat_number,
      floor,
      flat_type,
      status,
      approval_status,
      occupancy_status,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'vacant', ?, ?, ?)` ,
    [
      societyId || null,
      towerId || null,
      buildingName,
      wing || null,
      wingId || null,
      flatNumber,
      floor || null,
      flatType || null,
      approvalStatus,
      occupancyStatus,
      createdBy,
    ]
  );

  return result.insertId;
}

async function getFlatByWingAndFlatNumber({ societyId, wingId, wing, flatNumber }) {
  const [rows] = await db.query(
        `SELECT id, society_id, tower_id, building_name, wing, wing_id, flat_number, floor, flat_type, status,
          occupancy_status, approval_status, approved_by, approved_at, archived_at, created_at, created_by
     FROM flats
     WHERE society_id = ?
       AND ((? IS NULL) OR (wing_id = ?))
       AND ((? IS NULL) OR (wing = ?))
       AND flat_number = ?
     LIMIT 1`,
    [societyId, wingId || null, wingId || null, wing || null, wing || null, flatNumber]
  );

  return rows[0] || null;
}

async function getFlatById(flatId, { societyId = null } = {}) {
  const [rows] = await db.query(
        `SELECT id, society_id, tower_id, building_name, wing, wing_id, flat_number, floor, flat_type, status,
          occupancy_status, approval_status, approved_by, approved_at, archived_at, created_at, created_by
     FROM flats
     WHERE id = ?
       ${societyId ? "AND society_id = ?" : ""}
     LIMIT 1`,
    [flatId, ...(societyId ? [societyId] : [])]
  );

  return rows[0] || null;
}

async function getCurrentAssignment(flatId) {
  const [rows] = await db.query(
    `SELECT fr.id, fr.flat_id, fr.resident_id, fr.move_in_date, fr.move_out_date,
            u.name AS resident_name, u.email AS resident_email
     FROM flat_residents fr
     JOIN users u ON u.id = fr.resident_id
     WHERE fr.flat_id = ? AND fr.is_active = 1
     ORDER BY fr.id DESC
     LIMIT 1`,
    [flatId]
  );

  return rows[0] || null;
}

async function getNextAvailableFlat({ societyId, preferredFlatId = null } = {}) {
  const filters = ["f.society_id = ?", "f.archived_at IS NULL", "f.occupancy_status = 'vacant'"];
  const params = [societyId];

  if (preferredFlatId) {
    const preferred = await getFlatById(preferredFlatId, { societyId });
    if (preferred && preferred.occupancy_status === "vacant" && !preferred.archived_at) {
      return preferred;
    }
  }

  const [rows] = await db.query(
    `SELECT f.id, f.society_id, f.tower_id, f.building_name, f.wing, f.wing_id, f.flat_number, f.floor, f.flat_type,
            f.status, f.occupancy_status, f.approval_status, f.approved_by, f.approved_at, f.archived_at, f.created_at, f.created_by,
            t.tower_name, t.tower_code
     FROM flats f
     LEFT JOIN towers t ON t.id = f.tower_id
     WHERE ${filters.join(" AND ")}
     ORDER BY f.tower_id ASC, CAST(f.floor AS UNSIGNED) ASC, CAST(f.flat_number AS UNSIGNED) ASC, f.flat_number ASC
     LIMIT 1`,
    params
  );

  return rows[0] || null;
}

async function assignResidentToFlat({ flatId, residentId, residentType = "owner", assignedBy, moveInDate }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE flat_residents
       SET is_active = 0,
           move_out_date = COALESCE(move_out_date, CURDATE())
       WHERE flat_id = ? AND is_active = 1`,
      [flatId]
    );

    const [result] = await connection.query(
      `INSERT INTO flat_residents (
        flat_id,
        resident_id,
        move_in_date,
        is_active,
        assigned_by
      ) VALUES (?, ?, ?, 1, ?)`,
      [flatId, residentId, moveInDate || new Date(), assignedBy]
    );

    await connection.query(
      "UPDATE flats SET status = 'occupied' WHERE id = ?",
      [flatId]
    );

    await connection.query(
      "UPDATE flats SET occupancy_status = ? WHERE id = ?",
      [residentType === "tenant" ? "tenant_occupied" : "owner_occupied", flatId]
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function unassignResidentFromFlat(flatId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [activeRows] = await connection.query(
      "SELECT id FROM flat_residents WHERE flat_id = ? AND is_active = 1 LIMIT 1",
      [flatId]
    );

    if (!activeRows.length) {
      await connection.rollback();
      return false;
    }

    await connection.query(
      `UPDATE flat_residents
       SET is_active = 0,
           move_out_date = COALESCE(move_out_date, CURDATE())
       WHERE flat_id = ? AND is_active = 1`,
      [flatId]
    );

    await connection.query("UPDATE flats SET status = 'vacant', occupancy_status = 'vacant' WHERE id = ?", [flatId]);

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getFlatsWithOccupancy({ societyId, towerId, wingId, wing, search, approvalStatus, includeArchived = false } = {}) {
  const conditions = [];
  const params = [];

  if (societyId) {
    conditions.push("f.society_id = ?");
    params.push(societyId);
  }

  if (!includeArchived) {
    conditions.push("f.archived_at IS NULL");
  }

  if (towerId) {
    conditions.push("f.tower_id = ?");
    params.push(towerId);
  }

  if (wingId) {
    conditions.push("f.wing_id = ?");
    params.push(wingId);
  } else if (wing) {
    conditions.push("f.wing = ?");
    params.push(wing);
  }

  if (["pending", "approved"].includes(approvalStatus)) {
    conditions.push("f.approval_status = ?");
    params.push(approvalStatus);
  }

  if (search) {
    const likeSearch = `%${search}%`;
    conditions.push("(f.flat_number LIKE ? OR u.name LIKE ?)");
    params.push(likeSearch, likeSearch);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await db.query(
      `SELECT f.id, f.society_id, f.tower_id, t.tower_name, t.tower_code, s.name AS society_name, f.building_name, f.wing, f.wing_id, f.flat_number, f.floor, f.flat_type,
        f.status, f.occupancy_status, f.approval_status, f.approved_by, f.approved_at, f.archived_at, f.created_at,
                 fr.id AS assignment_id, fr.move_in_date,
            u.id AS resident_id, u.name AS resident_name, u.email AS resident_email,
                 u.resident_type AS occupancy_resident_type,
                 ps.slot_number AS parking_slot_number
     FROM flats f
     LEFT JOIN societies s ON s.id = f.society_id
       LEFT JOIN towers t ON t.id = f.tower_id
     LEFT JOIN flat_residents fr ON fr.flat_id = f.id AND fr.is_active = 1
     LEFT JOIN users u ON u.id = fr.resident_id
               LEFT JOIN parking_slots ps ON ps.flat_id = f.id AND ps.deleted_at IS NULL
     ${whereClause}
     ORDER BY f.building_name ASC, f.flat_number ASC`
    ,
    params
  );

  return rows;
}

async function approveFlatById({ flatId, approvedBy }) {
  await db.query(
    `UPDATE flats
     SET approval_status = 'approved',
         approved_by = ?,
         approved_at = NOW()
     WHERE id = ?`,
    [approvedBy, flatId]
  );

  return getFlatById(flatId);
}

async function updateFlatById({ flatId, societyId, flatType, occupancyStatus, status, approvedBy = null }) {
  await db.query(
    `UPDATE flats
     SET flat_type = COALESCE(?, flat_type),
         occupancy_status = COALESCE(?, occupancy_status),
         status = COALESCE(?, status),
         approved_by = COALESCE(?, approved_by)
     WHERE id = ?
       ${societyId ? "AND society_id = ?" : ""}`,
    [flatType || null, occupancyStatus || null, status || null, approvedBy || null, flatId, ...(societyId ? [societyId] : [])]
  );

  return getFlatById(flatId, { societyId });
}

async function archiveFlatById({ flatId, societyId }) {
  const [result] = await db.query(
    `UPDATE flats
     SET archived_at = NOW(), status = 'vacant', occupancy_status = 'vacant'
     WHERE id = ?
       ${societyId ? "AND society_id = ?" : ""}`,
    [flatId, ...(societyId ? [societyId] : [])]
  );

  return result.affectedRows > 0;
}

async function deleteFlatById({ flatId, societyId }) {
  const [result] = await db.query(
    `DELETE FROM flats
     WHERE id = ?
       ${societyId ? "AND society_id = ?" : ""}`,
    [flatId, ...(societyId ? [societyId] : [])]
  );

  return result.affectedRows > 0;
}

async function getOccupancyHistory() {
  const [rows] = await db.query(
        `SELECT fr.id, fr.flat_id, fr.resident_id, fr.move_in_date, fr.move_out_date, fr.is_active,
          f.building_name, f.flat_number, f.occupancy_status,
            u.name AS resident_name, u.email AS resident_email,
            assigner.name AS assigned_by_name
     FROM flat_residents fr
     JOIN flats f ON f.id = fr.flat_id
     JOIN users u ON u.id = fr.resident_id
     JOIN users assigner ON assigner.id = fr.assigned_by
     ORDER BY fr.id DESC`
  );

  return rows;
}

async function getFlatsForResident(residentId) {
  const [rows] = await db.query(
    `SELECT f.id, f.society_id, s.name AS society_name, f.building_name, f.flat_number, f.floor, f.flat_type, f.status,
            fr.move_in_date, fr.move_out_date, fr.is_active
     FROM flat_residents fr
     JOIN flats f ON f.id = fr.flat_id
     LEFT JOIN societies s ON s.id = f.society_id
     WHERE fr.resident_id = ?
     ORDER BY fr.id DESC`,
    [residentId]
  );

  return rows;
}

async function getResidentPropertySummary(residentId) {
  const [rows] = await db.query(
    `SELECT f.id AS flat_id, f.society_id, s.name AS society_name, f.building_name, f.flat_number, f.floor, f.flat_type,
            fr.resident_id AS owner_id,
            owner.name AS owner_name,
            owner.email AS owner_email,
            owner.resident_type AS owner_resident_type,
            tenant.id AS tenant_id,
            tenant.name AS tenant_name,
            tenant.email AS tenant_email
     FROM flat_residents fr
     JOIN flats f ON f.id = fr.flat_id
     LEFT JOIN societies s ON s.id = f.society_id
     JOIN users owner ON owner.id = fr.resident_id
     LEFT JOIN flat_residents fr_tenant ON fr_tenant.flat_id = fr.flat_id AND fr_tenant.is_active = 1 AND fr_tenant.resident_id <> fr.resident_id
     LEFT JOIN users tenant ON tenant.id = fr_tenant.resident_id AND tenant.role = 'resident' AND tenant.resident_type = 'tenant'
     WHERE fr.resident_id = ? AND fr.is_active = 1
     ORDER BY f.building_name ASC, f.flat_number ASC`,
    [residentId]
  );

  return rows;
}

module.exports = {
  createFlat,
  getFlatByWingAndFlatNumber,
  getFlatById,
  getCurrentAssignment,
  getNextAvailableFlat,
  assignResidentToFlat,
  unassignResidentFromFlat,
  getFlatsWithOccupancy,
  approveFlatById,
  updateFlatById,
  archiveFlatById,
  deleteFlatById,
  getOccupancyHistory,
  getFlatsForResident,
  getResidentPropertySummary,
};
