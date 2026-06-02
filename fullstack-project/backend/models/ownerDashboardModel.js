const db = require("../db");

async function getOwnerPropertyRows(ownerId) {
  const [rows] = await db.query(
    `SELECT
       op.id AS owner_property_id,
       op.user_id,
       op.flat_id,
       op.living_start_date,
       f.society_id,
       f.building_name,
       f.wing,
       f.flat_number,
       f.floor,
       f.flat_type,
       f.status AS flat_status,
       f.approval_status,
       s.name AS society_name,
       s.code AS society_code,
       owner.id AS owner_id,
       owner.name AS owner_name,
       owner.email AS owner_email,
       owner.phone AS owner_phone,
       tenant.id AS tenant_id,
       tenant.name AS tenant_name,
       tenant.email AS tenant_email,
       tenant.phone AS tenant_phone,
       tenant.status AS tenant_status,
       tenant.is_verified AS tenant_is_verified,
       tenant.resident_type AS tenant_resident_type,
       fr_tenant.id AS flat_resident_id,
       fr_tenant.is_active AS tenant_is_active,
       fr_tenant.move_in_date AS tenant_move_in_date
     FROM owner_properties op
     JOIN users owner ON owner.id = op.user_id
     JOIN flats f ON f.id = op.flat_id
     LEFT JOIN societies s ON s.id = f.society_id
     LEFT JOIN flat_residents fr_tenant
       ON fr_tenant.flat_id = f.id
      AND fr_tenant.is_active = 1
      AND fr_tenant.resident_id <> op.user_id
     LEFT JOIN users tenant
       ON tenant.id = fr_tenant.resident_id
      AND tenant.role = 'resident'
      AND tenant.resident_type = 'tenant'
     WHERE op.user_id = ?
       AND owner.role = 'resident'
       AND owner.resident_type = 'owner'
     ORDER BY f.building_name ASC, f.flat_number ASC`,
    [ownerId]
  );

  return rows;
}

async function getOwnerProfile(ownerId) {
  const [rows] = await db.query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.phone,
       u.status,
       u.is_verified,
       u.resident_type,
       u.profile_photo_url,
       u.family_members,
       u.society_id,
       s.code AS society_code,
       s.name AS society_name
     FROM users u
     LEFT JOIN societies s ON s.id = u.society_id
     WHERE u.id = ?
       AND u.role = 'resident'
       AND u.resident_type = 'owner'
     LIMIT 1`,
    [ownerId]
  );

  return rows[0] || null;
}

async function getOwnerDocuments(ownerId) {
  const [rows] = await db.query(
    `SELECT
       id,
       document_type,
       file_url,
       status,
       notes,
       reviewed_by,
       reviewed_at,
       created_at
     FROM documents
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [ownerId]
  );

  return rows;
}

async function getOwnerParkingSlots(ownerId) {
  const [rows] = await db.query(
    `SELECT
       ps.id,
       ps.slot_number,
       ps.wing,
       ps.floor,
       ps.type,
       ps.status,
       ps.block,
       ps.flat_id,
       f.flat_number,
       f.building_name,
       u.name AS owner_name,
       u.email AS owner_email
     FROM parking_slots ps
     LEFT JOIN flats f ON f.id = ps.flat_id
     LEFT JOIN users u ON u.id = ps.owner_id
     WHERE ps.deleted_at IS NULL
       AND ps.owner_id = ?
     ORDER BY ps.updated_at DESC, ps.id DESC`,
    [ownerId]
  );

  return rows;
}

async function getOwnerBills(ownerId) {
  const [rows] = await db.query(
    `SELECT
       b.id,
       b.title,
       b.due_date,
       b.status,
       b.total_amount,
       b.paid_at,
       b.created_at,
       CASE
         WHEN b.status = 'paid' THEN 'paid'
         WHEN b.due_date < CURDATE() THEN 'overdue'
         ELSE 'due'
       END AS due_status
     FROM bills b
     WHERE b.resident_id = ?
     ORDER BY b.due_date DESC, b.id DESC`,
    [ownerId]
  );

  return rows;
}

async function getOwnerComplaints(ownerId) {
  const [rows] = await db.query(
    `SELECT id, title, description, status, resolved_at, created_at, updated_at
     FROM complaints
     WHERE resident_id = ?
     ORDER BY created_at DESC`,
    [ownerId]
  );

  return rows;
}

async function getOwnerPreapprovals(ownerId) {
  const [rows] = await db.query(
    `SELECT
       vpa.id,
       vpa.flat_id,
       f.building_name,
       f.wing,
       f.flat_number,
       vpa.visitor_name,
       vpa.phone,
       vpa.purpose,
       vpa.vehicle_number,
       vpa.visit_date,
       vpa.expected_arrival_time,
       vpa.notes,
       vpa.status,
       vpa.created_at,
       vpa.approved_at
     FROM visitor_preapprovals vpa
     JOIN flats f ON f.id = vpa.flat_id
     WHERE vpa.owner_id = ?
     ORDER BY vpa.visit_date DESC, vpa.id DESC`,
    [ownerId]
  );

  return rows;
}

async function createOwnerPreapproval({
  ownerId,
  flatId,
  visitorName,
  phone,
  purpose,
  visitDate,
  expectedArrivalTime,
  vehicleNumber,
  notes,
}) {
  const [result] = await db.query(
    `INSERT INTO visitor_preapprovals (
      owner_id,
      flat_id,
      visitor_name,
      phone,
      purpose,
      visit_date,
      expected_arrival_time,
      vehicle_number,
      notes,
      status,
      approved_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW())`,
    [
      ownerId,
      flatId,
      visitorName,
      phone || null,
      purpose,
      visitDate,
      expectedArrivalTime || null,
      vehicleNumber || null,
      notes || null,
    ]
  );

  return result.insertId;
}

async function getOwnerPreapprovalById(preapprovalId, ownerId) {
  const [rows] = await db.query(
    `SELECT
       vpa.id,
       vpa.owner_id,
       vpa.flat_id,
       vpa.visitor_name,
       vpa.phone,
       vpa.purpose,
       vpa.visit_date,
       vpa.expected_arrival_time,
       vpa.vehicle_number,
       vpa.notes,
       vpa.status,
       vpa.created_at,
       vpa.approved_at,
       f.building_name,
       f.wing,
       f.flat_number
     FROM visitor_preapprovals vpa
     JOIN flats f ON f.id = vpa.flat_id
     WHERE vpa.id = ? AND vpa.owner_id = ?
     LIMIT 1`,
    [preapprovalId, ownerId]
  );

  return rows[0] || null;
}

async function cancelOwnerPreapproval(preapprovalId, ownerId) {
  const [result] = await db.query(
    `UPDATE visitor_preapprovals
     SET status = 'cancelled'
     WHERE id = ? AND owner_id = ? AND status = 'approved'`,
    [preapprovalId, ownerId]
  );

  return result.affectedRows > 0;
}

async function getOwnerVisitorHistory(ownerId) {
  const [rows] = await db.query(
    `SELECT
       v.id,
       v.visitor_name,
       v.phone,
       v.purpose,
       v.person_to_meet,
       v.vehicle_number,
       v.entry_time,
       v.exit_time,
       v.status,
       v.flat_id,
       f.building_name,
       f.wing,
       f.flat_number,
       v.preapproval_id,
       u.name AS security_name
     FROM visitors v
     JOIN flats f ON f.id = v.flat_id
     LEFT JOIN users u ON u.id = v.security_id
     WHERE v.flat_id IN (
       SELECT op.flat_id
       FROM owner_properties op
       JOIN users owner ON owner.id = op.user_id
       WHERE op.user_id = ?
         AND owner.role = 'resident'
         AND owner.resident_type = 'owner'
     )
     ORDER BY v.entry_time DESC, v.id DESC
     LIMIT 100`,
    [ownerId]
  );

  return rows;
}

async function getOwnerActivityTimeline(ownerId, limit = 25) {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 100) : 25;

  const [rows] = await db.query(
    `SELECT activity_type, title, detail, happened_at
     FROM (
       SELECT
         'bill' AS activity_type,
         CONCAT('Bill ', b.status) AS title,
         CONCAT(b.title, ' (', b.total_amount, ')') AS detail,
         COALESCE(b.paid_at, b.created_at) AS happened_at
       FROM bills b
       WHERE b.resident_id = ?

       UNION ALL

       SELECT
         'complaint' AS activity_type,
         CONCAT('Complaint ', c.status) AS title,
         c.title AS detail,
         c.updated_at AS happened_at
       FROM complaints c
       WHERE c.resident_id = ?

       UNION ALL

       SELECT
         'visitor' AS activity_type,
         CONCAT('Visitor preapproval ', vpa.status) AS title,
         CONCAT(vpa.visitor_name, ' for ', f.building_name, '-', f.flat_number) AS detail,
         vpa.created_at AS happened_at
       FROM visitor_preapprovals vpa
       JOIN flats f ON f.id = vpa.flat_id
       WHERE vpa.owner_id = ?

       UNION ALL

       SELECT
         'property' AS activity_type,
         'Ownership linked' AS title,
         CONCAT(f.building_name, '-', f.flat_number) AS detail,
         op.created_at AS happened_at
       FROM owner_properties op
       JOIN flats f ON f.id = op.flat_id
       JOIN users owner ON owner.id = op.user_id
       WHERE op.user_id = ?
         AND owner.resident_type = 'owner'

       UNION ALL

       SELECT
         'system' AS activity_type,
         al.action AS title,
         COALESCE(JSON_UNQUOTE(JSON_EXTRACT(al.metadata, '$.message')), '') AS detail,
         al.created_at AS happened_at
       FROM activity_logs al
       WHERE al.user_id = ?
     ) all_activities
     ORDER BY happened_at DESC
     LIMIT ${safeLimit}`,
    [ownerId, ownerId, ownerId, ownerId, ownerId]
  );

  return rows;
}

module.exports = {
  getOwnerPropertyRows,
  getOwnerProfile,
  getOwnerDocuments,
  getOwnerParkingSlots,
  getOwnerBills,
  getOwnerComplaints,
  getOwnerPreapprovals,
  createOwnerPreapproval,
  getOwnerPreapprovalById,
  cancelOwnerPreapproval,
  getOwnerVisitorHistory,
  getOwnerActivityTimeline,
};
