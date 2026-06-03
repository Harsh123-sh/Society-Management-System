const db = require("../db");

async function createParkingSlot(payload) {
  const {
    society_id,
    slot_number,
    wing,
    floor,
    type,
    status,
    owner_id,
    flat_id,
    block,
  } = payload;

  const query = `
    INSERT INTO parking_slots (
      society_id, slot_number, wing, floor, type, status, owner_id, flat_id, block, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const { rows: result } = await db.query(query, [
    society_id || null,
    slot_number,
    wing,
    floor,
    type || "2wheeler",
    status || "available",
    owner_id || null,
    flat_id || null,
    block || null,
  ]);

  return { id: result.insertId, ...payload };
}

async function getParkingSlots(filters = {}) {
  let query = `
    SELECT 
      ps.*,
      u.name as owner_name,
      u.email as owner_email,
      f.flat_number
    FROM parking_slots ps
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN flats f ON ps.flat_id = f.id
    WHERE ps.deleted_at IS NULL
  `;

  const conditions = [];
  const params = [];

  if (filters.society_id) {
    conditions.push("ps.society_id = ?");
    params.push(filters.society_id);
  }

  if (filters.status) {
    conditions.push("ps.status = ?");
    params.push(filters.status);
  }

  if (filters.wing) {
    conditions.push("ps.wing = ?");
    params.push(filters.wing);
  }

  if (filters.type) {
    conditions.push("ps.type = ?");
    params.push(filters.type);
  }

  if (filters.owner_id) {
    conditions.push("ps.owner_id = ?");
    params.push(filters.owner_id);
  }

  if (conditions.length) {
    query += " AND " + conditions.join(" AND ");
  }

  query += " ORDER BY ps.wing, ps.slot_number";

  const { rows } = await db.query(query, params);
  return rows;
}

async function getParkingSlotById(slotId, societyId = null) {
  const query = `
    SELECT 
      ps.*,
      u.name as owner_name,
      u.email as owner_email,
      f.flat_number
    FROM parking_slots ps
    LEFT JOIN users u ON ps.owner_id = u.id
    LEFT JOIN flats f ON ps.flat_id = f.id
    WHERE ps.id = ? AND ps.deleted_at IS NULL
      ${societyId ? "AND ps.society_id = ?" : ""}
  `;

  const { rows } = await db.query(query, societyId ? [slotId, societyId] : [slotId]);
  return rows[0] || null;
}

async function updateParkingSlot(slotId, payload, societyId = null) {
  const {
    status,
    owner_id,
    flat_id,
    type,
  } = payload;

  const query = `
    UPDATE parking_slots
    SET 
      status = COALESCE(?, status),
      owner_id = COALESCE(?, owner_id),
      flat_id = COALESCE(?, flat_id),
      type = COALESCE(?, type),
      updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
      ${societyId ? "AND society_id = ?" : ""}
  `;

  const { rows: result } = await db.query(query, [
    status,
    owner_id,
    flat_id,
    type,
    slotId,
    ...(societyId ? [societyId] : []),
  ]);

  return result.affectedRows > 0;
}

async function assignParkingSlot(slotId, userId, flatId, societyId = null) {
  const query = `
    UPDATE parking_slots
    SET 
      owner_id = ?,
      flat_id = ?,
      status = 'assigned',
      updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
      ${societyId ? "AND society_id = ?" : ""}
  `;

  const { rows: result } = await db.query(query, [userId, flatId, slotId, ...(societyId ? [societyId] : [])]);
  return result.affectedRows > 0;
}

async function releaseParkingSlot(slotId, societyId = null) {
  const query = `
    UPDATE parking_slots
    SET 
      owner_id = NULL,
      flat_id = NULL,
      status = 'available',
      updated_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
      ${societyId ? "AND society_id = ?" : ""}
  `;

  const { rows: result } = await db.query(query, [slotId, ...(societyId ? [societyId] : [])]);
  return result.affectedRows > 0;
}

async function deleteParkingSlot(slotId, deletedBy, societyId = null) {
  const query = `
    UPDATE parking_slots
    SET 
      deleted_at = NOW(),
      deleted_by = ?,
      status = 'deleted'
    WHERE id = ? AND deleted_at IS NULL
      ${societyId ? "AND society_id = ?" : ""}
  `;

  const { rows: result } = await db.query(query, [deletedBy, slotId, ...(societyId ? [societyId] : [])]);
  return result.affectedRows > 0;
}

async function getParkingStatistics(societyId = null) {
  const query = `
    SELECT 
      COUNT(*) as total_slots,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_slots,
      SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned_slots,
      SUM(CASE WHEN type = '2wheeler' THEN 1 ELSE 0 END) as two_wheeler_slots,
      SUM(CASE WHEN type = '4wheeler' THEN 1 ELSE 0 END) as four_wheeler_slots
    FROM parking_slots
    WHERE deleted_at IS NULL
      ${societyId ? "AND society_id = ?" : ""}
  `;

  const { rows } = await db.query(query, societyId ? [societyId] : []);
  return rows[0];
}

module.exports = {
  createParkingSlot,
  getParkingSlots,
  getParkingSlotById,
  updateParkingSlot,
  assignParkingSlot,
  releaseParkingSlot,
  deleteParkingSlot,
  getParkingStatistics,
};