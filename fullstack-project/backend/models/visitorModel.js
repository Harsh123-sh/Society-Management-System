const crypto = require("crypto");
const db = require("../config/db");

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

async function safeRows(queryPromise, fallback = [], label = "visitor model query") {
  try {
    const result = await queryPromise;
    if (Array.isArray(result)) return result[0] || fallback;
    if (Array.isArray(result?.rows)) return result.rows;
    return fallback;
  } catch (error) {
    console.error(`[visitorModel] ${label} failed`, error?.message || error);
    return fallback;
  }
}

async function safeArray(queryPromise, fallback = [], label = "visitor model query") {
  try {
    return await queryPromise;
  } catch (error) {
    console.error(`[visitorModel] ${label} failed`, error?.message || error);
    return fallback;
  }
}

let flatTableColumnsCache = null;
let visitorEmergencyAlertSchemaReady = null;
let visitorEntrySchemaReady = null;

async function ensureVisitorEntrySchema() {
  if (!visitorEntrySchemaReady) {
    visitorEntrySchemaReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS visitor_entries (
          id SERIAL PRIMARY KEY,
          visitor_id VARCHAR(40) UNIQUE NOT NULL,
          society_id INTEGER REFERENCES societies(id) ON DELETE CASCADE,
          guard_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          flat_id INTEGER REFERENCES flats(id) ON DELETE SET NULL,
          resident_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          visitor_name VARCHAR(150) NOT NULL,
          phone VARCHAR(40) NOT NULL,
          gender VARCHAR(30),
          purpose VARCHAR(200) NOT NULL,
          visitor_count INTEGER NOT NULL DEFAULT 1,
          resident_name VARCHAR(150),
          resident_phone VARCHAR(40),
          visitor_email VARCHAR(180),
          photo_url TEXT,
          status VARCHAR(40) NOT NULL DEFAULT 'pending_approval',
          approval_status VARCHAR(40) NOT NULL DEFAULT 'pending',
          check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          check_out_time TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS resident_approvals (
          id SERIAL PRIMARY KEY,
          visitor_entry_id INTEGER NOT NULL REFERENCES visitor_entries(id) ON DELETE CASCADE,
          resident_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          society_id INTEGER REFERENCES societies(id) ON DELETE CASCADE,
          guard_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          status VARCHAR(40) NOT NULL DEFAULT 'pending',
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          responded_at TIMESTAMP,
          notes TEXT
        )
      `);

      await db.query(`CREATE INDEX IF NOT EXISTS idx_visitor_entries_society_status ON visitor_entries(society_id, status, check_in_time)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_visitor_entries_guard_time ON visitor_entries(guard_id, check_in_time)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_resident_approvals_society_status ON resident_approvals(society_id, status, requested_at)`);
      await db.query(`ALTER TABLE visitor_entries ADD COLUMN IF NOT EXISTS visitor_email VARCHAR(180)`);
    })().catch((error) => {
      visitorEntrySchemaReady = null;
      throw error;
    });
  }

  return visitorEntrySchemaReady;
}

async function ensureVisitorEmergencyAlertSchema() {
  if (!visitorEmergencyAlertSchemaReady) {
    visitorEmergencyAlertSchemaReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS visitor_emergency_alerts (
          id SERIAL PRIMARY KEY,
          triggered_by INT NULL,
          alert_type VARCHAR(50) NOT NULL DEFAULT 'security',
          severity VARCHAR(50) NOT NULL DEFAULT 'high',
          message TEXT NOT NULL,
          location VARCHAR(255) NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          society_id INT NULL,
          acknowledged_by INT NULL,
          acknowledged_at TIMESTAMP NULL,
          resolved_by INT NULL,
          resolved_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await db.query(`ALTER TABLE visitor_emergency_alerts ADD COLUMN IF NOT EXISTS society_id INT NULL;`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_visitor_emergency_alerts_society_status ON visitor_emergency_alerts(society_id, status, created_at);`);
    })().catch((error) => {
      visitorEmergencyAlertSchemaReady = null;
      throw error;
    });
  }

  return visitorEmergencyAlertSchemaReady;
}

async function getFlatTableColumns() {
  if (!flatTableColumnsCache) {
    const { rows } = await db.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_catalog = current_database()
         AND table_schema = 'public'
         AND table_name = 'flats'`
    );
    flatTableColumnsCache = new Set(rows.map((row) => row.column_name));
  }

  return flatTableColumnsCache;
}

async function hasFlatColumn(columnName) {
  const flatColumns = await getFlatTableColumns();
  return flatColumns.has(columnName);
}

function createSignature(value) {
  return crypto.createHash("sha256").update(normalizeText(value)).digest("hex");
}

async function getFlatByWingAndFlatNumber({ societyId, builderId, wingId, wing, flatNumber }) {
  const filters = [];
  const params = [];
  const flatColumns = await getFlatTableColumns();

  if (societyId && flatColumns.has("society_id")) {
    filters.push("f.society_id = ?");
    params.push(societyId);
  }

  if (builderId && flatColumns.has("builder_id")) {
    filters.push("f.builder_id = ?");
    params.push(builderId);
  }

  if (wingId && flatColumns.has("wing_id")) {
    filters.push("f.wing_id = ?");
    params.push(wingId);
  } else if (normalizeText(wing) && flatColumns.has("wing")) {
    filters.push("UPPER(f.wing) = ?");
    params.push(normalizeText(wing).toUpperCase());
  }

  filters.push("f.flat_number = ?");
  params.push(normalizeText(flatNumber));

  if (flatColumns.has("approval_status")) {
    filters.push("f.approval_status = 'approved'");
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT f.*
     FROM flats f
     ${whereClause}
     ORDER BY f.id ASC
     LIMIT 1`,
    params
  );

  return rows[0] || null;
}

async function getFlatOwnerByFlatId(flatId) {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.phone
     FROM owner_properties op
     JOIN users u ON u.id = op.user_id
     WHERE op.flat_id = ?
       AND u.role = 'resident'
       AND u.resident_type = 'owner'
       AND u.status = 'active'
     ORDER BY op.id DESC
     LIMIT 1`,
    [flatId]
  );

  return rows[0] || null;
}

async function createGuardVisitorEntry({
  visitorName,
  visitorEmail,
  phone,
  gender,
  purpose,
  visitorCount,
  flatId,
  residentId,
  residentName,
  residentPhone,
  guardId,
  societyId,
  photoUrl,
}) {
  await ensureVisitorEntrySchema();
  const visitorId = `VIS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const { rows: result } = await db.query(
    `INSERT INTO visitor_entries (
      visitor_id, society_id, guard_id, flat_id, resident_id, visitor_name, visitor_email, phone,
      gender, purpose, visitor_count, resident_name, resident_phone, photo_url,
      status, approval_status, check_in_time, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', 'pending', NOW(), NOW(), NOW())`,
    [
      visitorId,
      societyId,
      guardId,
      flatId,
      residentId || null,
      normalizeText(visitorName),
      visitorEmail || null,
      normalizeText(phone),
      gender || null,
      normalizeText(purpose),
      Number(visitorCount) || 1,
      residentName || null,
      residentPhone || null,
      photoUrl || null,
    ]
  );

  const entryId = result.insertId;
  await db.query(
    `INSERT INTO resident_approvals (visitor_entry_id, resident_id, society_id, guard_id, status, notes)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    [entryId, residentId || null, societyId, guardId, "Awaiting resident approval"]
  );

  return getGuardVisitorEntryById(entryId, societyId);
}

async function getGuardVisitorEntryById(id, societyId) {
  await ensureVisitorEntrySchema();
  const params = [id];
  let societyClause = "";
  if (societyId) {
    societyClause = "AND ve.society_id = ?";
    params.push(societyId);
  }

  const { rows } = await db.query(
    `SELECT ve.id, ve.visitor_id, ve.society_id, ve.guard_id, ve.flat_id, ve.resident_id,
            ve.visitor_name, ve.visitor_email, ve.phone, ve.gender, ve.purpose, ve.visitor_count,
            ve.resident_name, ve.resident_phone, ve.photo_url, ve.status, ve.approval_status,
            ve.check_in_time AS entry_time, ve.check_out_time AS exit_time, ve.created_at, ve.updated_at,
            f.building_name, f.wing, f.floor, f.flat_number, guard.name AS security_name
     FROM visitor_entries ve
     LEFT JOIN flats f ON f.id = ve.flat_id
     LEFT JOIN users guard ON guard.id = ve.guard_id
     WHERE ve.id = ? ${societyClause}
     LIMIT 1`,
    params
  );

  return rows[0] || null;
}

async function getVisitorById(visitorId) {
  const { rows } = await db.query(
    `SELECT v.id, v.visitor_name, v.visitor_email, v.phone, v.purpose, v.person_to_meet,
            v.vehicle_number, v.entry_time, v.exit_time, v.status, v.approval_status,
            v.security_id, v.flat_id, v.preapproval_id, v.photo_url, v.face_capture_url,
            v.face_match_confidence, v.qr_pass_id, v.otp_verified_at, v.blacklist_flag,
            u.name AS security_name, u.email AS security_email,
            COALESCE(f.building_name, f.block) AS building_name, f.wing, f.flat_number
     FROM visitors v
     LEFT JOIN users u ON u.id = v.security_id
     LEFT JOIN flats f ON f.id = v.flat_id
     WHERE v.id = ?
     LIMIT 1`,
    [visitorId]
  );

  return rows[0] || null;
}

async function createVisitorEntry({
  visitorName,
  visitorEmail,
  phone,
  purpose,
  personToMeet,
  vehicleNumber,
  flatId,
  preapprovalId,
  securityId,
  photoUrl,
  faceCaptureUrl,
  faceSignature,
  faceMatchConfidence,
  approvalStatus,
  blacklistFlag,
  qrPassId,
  otpVerifiedAt,
  societyId,
}) {
  const { rows: result } = await db.query(
    `INSERT INTO visitors (
      society_id,
      visitor_name,
      visitor_email,
      phone,
      purpose,
      person_to_meet,
      vehicle_number,
      flat_id,
      preapproval_id,
      entry_time,
      status,
      approval_status,
      security_id,
      photo_url,
      face_capture_url,
      face_signature,
      face_match_confidence,
      blacklist_flag,
      qr_pass_id,
      otp_verified_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'in_premises', ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      societyId || null,
      normalizeText(visitorName),
      visitorEmail || null,
      phone || null,
      normalizeText(purpose),
      personToMeet || null,
      vehicleNumber || null,
      flatId || null,
      preapprovalId || null,
      approvalStatus || "approved",
      securityId,
      photoUrl || null,
      faceCaptureUrl || null,
      faceSignature || null,
      faceMatchConfidence || null,
      blacklistFlag ? 1 : 0,
      qrPassId || null,
      otpVerifiedAt || null,
    ]
  );

  return result.insertId;
}

async function markVisitorExit(visitorId) {
  await ensureVisitorEntrySchema();
  let result = await db.query(
    `UPDATE visitor_entries
     SET check_out_time = NOW(), status = 'checked_out', updated_at = NOW()
     WHERE id = ? AND status IN ('in_premises', 'pending_approval')`,
    [visitorId]
  );

  if (!result.affectedRows) {
    result = await db.query(
      `UPDATE visitors
       SET exit_time = NOW(), status = 'exited'
       WHERE id = ? AND status = 'in_premises'`,
      [visitorId]
    );
  }

  return result.affectedRows > 0;
}

async function getVisitorLogs({ wing, search, fromDate, toDate, status, societyId } = {}) {
  await ensureVisitorEntrySchema();
  const params = [];
  const filters = [];

  if (societyId) {
    filters.push("ve.society_id = ?");
    params.push(societyId);
  }

  if (normalizeText(wing)) {
    filters.push("UPPER(f.wing) = ?");
    params.push(normalizeText(wing).toUpperCase());
  }

  if (normalizeText(search)) {
    filters.push("(ve.visitor_name ILIKE ? OR ve.phone ILIKE ? OR ve.resident_name ILIKE ? OR f.flat_number ILIKE ?)");
    const like = `%${normalizeText(search)}%`;
    params.push(like, like, like, like);
  }

  if (normalizeText(fromDate)) {
    filters.push("DATE(ve.check_in_time) >= ?");
    params.push(fromDate);
  }

  if (normalizeText(toDate)) {
    filters.push("DATE(ve.check_in_time) <= ?");
    params.push(toDate);
  }

  if (["pending_approval", "in_premises", "checked_out", "rejected", "exited"].includes(normalizeText(status))) {
    filters.push("ve.status = ?");
    params.push(normalizeText(status));
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT ve.id, ve.visitor_id, ve.visitor_name, ve.visitor_email, ve.phone, ve.gender, ve.purpose,
            ve.visitor_count, ve.resident_name, ve.resident_phone, ve.photo_url,
            ve.check_in_time AS entry_time, ve.check_out_time AS exit_time,
            ve.status, ve.approval_status, ve.guard_id AS security_id, ve.flat_id,
            u.name AS security_name, u.email AS security_email,
            f.building_name, f.wing, f.floor, f.flat_number
     FROM visitor_entries ve
     LEFT JOIN users u ON u.id = ve.guard_id
     LEFT JOIN flats f ON f.id = ve.flat_id
     ${whereClause}
     ORDER BY ve.check_in_time DESC`,
    params
  );

  return rows;
}

async function createVisitorPreapproval({
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
  const approvalToken = crypto.randomBytes(10).toString("hex").toUpperCase();
  const { rows: result } = await db.query(
    `INSERT INTO visitor_preapprovals (
      owner_id, flat_id, visitor_name, phone, purpose, visit_date,
      expected_arrival_time, vehicle_number, notes, status, approved_at,
      approval_token, resident_notes
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW(), ?, ?)` ,
    [
      ownerId,
      flatId,
      normalizeText(visitorName),
      phone || null,
      normalizeText(purpose),
      visitDate,
      expectedArrivalTime || null,
      vehicleNumber || null,
      notes || null,
      approvalToken,
      notes || null,
    ]
  );

  return result.insertId;
}

async function getVisitorPreapprovalById(preapprovalId) {
  const { rows } = await db.query(
    `SELECT vp.id, vp.owner_id, vp.flat_id, vp.visitor_name, vp.phone, vp.purpose,
            vp.visit_date, vp.expected_arrival_time, vp.vehicle_number, vp.notes,
            vp.status, vp.approved_at, vp.created_at, vp.approval_token,
            f.building_name, f.wing, f.flat_number
     FROM visitor_preapprovals vp
     LEFT JOIN flats f ON f.id = vp.flat_id
     WHERE vp.id = ?
     LIMIT 1`,
    [preapprovalId]
  );

  return rows[0] || null;
}

async function listVisitorPreapprovals({ ownerId, status, societyId } = {}) {
  const params = [];
  const filters = [];

  if (ownerId) {
    filters.push("vp.owner_id = ?");
    params.push(ownerId);
  }

  if (societyId) {
    filters.push("f.society_id = ?");
    params.push(societyId);
  }

  if (["approved", "visited", "cancelled"].includes(normalizeText(status))) {
    filters.push("vp.status = ?");
    params.push(normalizeText(status));
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT vp.id, vp.owner_id, vp.flat_id, vp.visitor_name, vp.phone, vp.purpose,
            vp.visit_date, vp.expected_arrival_time, vp.vehicle_number, vp.notes,
            vp.status, vp.approved_at, vp.created_at, vp.approval_token,
            f.building_name, f.wing, f.flat_number
     FROM visitor_preapprovals vp
     LEFT JOIN flats f ON f.id = vp.flat_id
     ${whereClause}
     ORDER BY vp.created_at DESC`,
    params
  );

  return rows;
}

async function updateVisitorPreapprovalStatus({ id, ownerId, status }) {
  const { rows: result } = await db.query(
    `UPDATE visitor_preapprovals
     SET status = ?, approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE approved_at END
     WHERE id = ? AND owner_id = ?`,
    [status, status, id, ownerId]
  );

  return result.affectedRows > 0;
}

async function markPreapprovalVisited(preapprovalId) {
  const { rows: result } = await db.query(
    `UPDATE visitor_preapprovals
     SET status = 'visited'
     WHERE id = ? AND status = 'approved'`,
    [preapprovalId]
  );

  return result.affectedRows > 0;
}

// Security actions: update preapproval status (used by security guards)
async function updateVisitorPreapprovalStatusBySecurity({ id, status, updatedBy, societyId }) {
  const params = [status, status, id];
  let sql = `UPDATE visitor_preapprovals vp
     SET status = ?, approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE vp.approved_at END
     FROM flats f
     WHERE f.id = vp.flat_id AND vp.id = ?`;
  if (societyId) {
    sql += ` AND f.society_id = ?`;
    params.push(societyId);
  }

  const result = await db.query(sql, params);
  return result.affectedRows > 0;
}

async function createVisitorEntryFromPreapproval({ preapprovalId, securityId, entryMethod, societyId, photoBase64 }) {
  const preapproval = await getVisitorPreapprovalById(preapprovalId);
  if (!preapproval) return null;

  const { rows: result } = await db.query(
    `INSERT INTO visitors (
      society_id, visitor_name, phone, purpose, flat_id, preapproval_id,
      entry_time, status, security_id, qr_pass_id, face_capture_url, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 'in_premises', ?, NULL, ?, NOW())`,
    [
      societyId || null,
      normalizeText(preapproval.visitor_name),
      preapproval.phone || null,
      normalizeText(preapproval.purpose),
      preapproval.flat_id || null,
      preapproval.id,
      securityId || null,
      photoBase64 || null,
    ]
  );

  // mark preapproval as checked-in
  await db.query(
    `UPDATE visitor_preapprovals SET status = 'checked_in' WHERE id = ?`,
    [preapprovalId]
  ).catch(() => {});

  return result.insertId;
}

async function markVisitorCheckOut(visitorId) {
  const { rows: result } = await db.query(
    `UPDATE visitors
     SET exit_time = NOW(), status = 'checked_out'
     WHERE id = ? AND (status = 'in_premises' OR status = 'checked_in')`,
    [visitorId]
  );

  return result.affectedRows > 0;
}

async function upsertVisitorFaceProfile({
  preapprovalId,
  visitorName,
  phone,
  flatId,
  faceCaptureUrl,
  faceSignature,
  faceMatchConfidence,
  createdBy,
}) {
  const { rows: existingRows } = await db.query(
    `SELECT id FROM visitor_face_profiles WHERE preapproval_id = ? LIMIT 1`,
    [preapprovalId]
  );

  if (existingRows[0]) {
    await db.query(
      `UPDATE visitor_face_profiles
       SET visitor_name = ?, phone = ?, flat_id = ?, face_capture_url = ?, face_signature = ?, face_match_confidence = ?, updated_by = ?, updated_at = NOW()
       WHERE id = ?`,
      [visitorName, phone || null, flatId || null, faceCaptureUrl || null, faceSignature || null, faceMatchConfidence || null, createdBy || null, existingRows[0].id]
    );

    return existingRows[0].id;
  }

  const { rows: result } = await db.query(
    `INSERT INTO visitor_face_profiles (
      preapproval_id, visitor_name, phone, flat_id, face_capture_url, face_signature,
      face_match_confidence, created_by, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      preapprovalId,
      visitorName,
      phone || null,
      flatId || null,
      faceCaptureUrl || null,
      faceSignature || null,
      faceMatchConfidence || null,
      createdBy || null,
    ]
  );

  return result.insertId;
}

async function recognizeVisitorFace({ faceCaptureUrl, faceSignature, phone, visitorName, flatId }) {
  const { rows } = await db.query(
    `SELECT id, visitor_name, phone, flat_id, face_signature, face_capture_url, face_match_confidence
     FROM visitor_face_profiles
     ORDER BY updated_at DESC, id DESC
     LIMIT 200`
  );

  const normalizedSignature = normalizeText(faceSignature);
  const normalizedPhone = normalizeText(phone);
  const normalizedName = normalizeLower(visitorName);

  let bestMatch = null;
  let bestConfidence = 0;

  for (const row of rows) {
    let confidence = 0.42;

    if (normalizedSignature && row.face_signature && normalizedSignature === row.face_signature) {
      confidence = 0.98;
    } else if (normalizedPhone && normalizeText(row.phone) === normalizedPhone) {
      confidence = 0.91;
    } else if (normalizedName && normalizeLower(row.visitor_name).includes(normalizedName)) {
      confidence = 0.82;
    } else if (flatId && Number(row.flat_id) === Number(flatId)) {
      confidence = 0.7;
    }

    if (confidence > bestConfidence) {
      bestMatch = row;
      bestConfidence = confidence;
    }
  }

  return {
    matchFound: Boolean(bestMatch && bestConfidence >= 0.8),
    confidence: Number(bestConfidence.toFixed(2)),
    match: bestMatch,
    faceCaptureUrl: faceCaptureUrl || null,
  };
}

async function createVehicleEntry({
  visitorId,
  preapprovalId,
  vehicleNumber,
  vehicleType,
  ownerName,
  flatId,
  entryMethod,
  createdBy,
}) {
  const { rows: result } = await db.query(
    `INSERT INTO visitor_vehicle_entries (
      visitor_id, preapproval_id, vehicle_number, vehicle_type, owner_name,
      flat_id, entry_method, status, created_by, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'inside', ?, NOW())`,
    [visitorId || null, preapprovalId || null, vehicleNumber, vehicleType || null, ownerName || null, flatId || null, entryMethod || "manual", createdBy || null]
  );

  return result.insertId;
}

async function listVehicleEntries({ search, societyId } = {}) {
  const params = [];
  const filters = [];

  if (societyId) {
    filters.push("f.society_id = ?");
    params.push(societyId);
  }

  if (normalizeText(search)) {
    const like = `%${normalizeText(search)}%`;
    filters.push("(vehicle_number LIKE ? OR owner_name LIKE ? OR vehicle_type LIKE ?)");
    params.push(like, like, like);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT v.id, v.visitor_id, v.preapproval_id, v.vehicle_number, v.vehicle_type, v.owner_name,
            v.flat_id, v.entry_method, v.status, v.entry_time, v.exit_time, v.created_by, v.created_at
     FROM visitor_vehicle_entries v
     LEFT JOIN flats f ON f.id = v.flat_id
     ${whereClause}
     ORDER BY v.entry_time DESC`,
    params
  );

  return rows;
}

async function createDeliveryEntry({ visitorId, deliveryType, packageId, recipientName, deliveryPartner, flatId, status, notes, createdBy }) {
  const { rows: result } = await db.query(
    `INSERT INTO visitor_delivery_entries (
      visitor_id, delivery_type, package_id, recipient_name, delivery_partner,
      flat_id, status, notes, created_by, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [visitorId || null, deliveryType, packageId || null, recipientName || null, deliveryPartner || null, flatId || null, status || "pending", notes || null, createdBy || null]
  );

  return result.insertId;
}

async function listDeliveryEntries({ status, search, societyId } = {}) {
  const params = [];
  const filters = [];

  if (societyId) {
    filters.push("f.society_id = ?");
    params.push(societyId);
  }

  if (["pending", "received", "dispatched", "returned"].includes(normalizeText(status))) {
    filters.push("status = ?");
    params.push(normalizeText(status));
  }

  if (normalizeText(search)) {
    const like = `%${normalizeText(search)}%`;
    filters.push("(delivery_type LIKE ? OR package_id LIKE ? OR recipient_name LIKE ? OR delivery_partner LIKE ?)");
    params.push(like, like, like, like);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT d.id, d.visitor_id, d.delivery_type, d.package_id, d.recipient_name, d.delivery_partner,
            d.flat_id, d.status, d.notes, d.created_by, d.created_at, d.updated_at
     FROM visitor_delivery_entries d
     LEFT JOIN flats f ON f.id = d.flat_id
     ${whereClause}
     ORDER BY d.created_at DESC`,
    params
  );

  return rows;
}

async function createVisitorAnalyticsSnapshot({ societyId } = {}) {
  const societyFilter = societyId ? "WHERE society_id = ?" : "";
  const societyParams = societyId ? [societyId] : [];
  const summaryRows = await safeRows(
    db.query(
      `SELECT
        COUNT(*) AS total_visits, 
        SUM(CASE WHEN DATE(entry_time) = CURRENT_DATE THEN 1 ELSE 0 END) AS today_visits,
        SUM(CASE WHEN status = 'in_premises' THEN 1 ELSE 0 END) AS active_visits,
        SUM(CASE WHEN blacklist_flag = true THEN 1 ELSE 0 END) AS blacklist_hits,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) AS approved_visits
       FROM visitors ${societyFilter}`,
      societyParams
    ),
    [{ total_visits: 0, today_visits: 0, active_visits: 0, blacklist_hits: 0, approved_visits: 0 }],
    "analytics summary"
  );

  const wingRows = await safeRows(
    db.query(
      `SELECT COALESCE(f.wing, 'NA') AS wing, COUNT(*) AS total
       FROM visitors v
       LEFT JOIN flats f ON f.id = v.flat_id
      ${societyId ? "WHERE v.society_id = ?" : ""}
       GROUP BY COALESCE(f.wing, 'NA')`,
      societyParams,
    ),
    [],
    "analytics by wing"
  );

  const purposeRows = await safeRows(
    db.query(
      `SELECT purpose, COUNT(*) AS total
       FROM visitors
       ${societyFilter}
       GROUP BY purpose
       ORDER BY total DESC
       LIMIT 8`,
      societyParams
    ),
    [],
    "analytics by purpose"
  );

  return {
    summary: summaryRows[0] || {},
    byWing: wingRows,
    byPurpose: purposeRows,
  };
}

async function getVisitorDashboard({ wing, societyId } = {}) {
  const [analyticsSnapshot, recentVisitors, pendingApprovals, deliveries, vehicles] = await Promise.all([
    createVisitorAnalyticsSnapshot({ societyId }),
    safeArray(getVisitorLogs({ wing, societyId }), [], "recent visitors"),
    safeArray(listVisitorPreapprovals({ status: "approved", societyId }), [], "pending approvals"),
    safeArray(listDeliveryEntries({ societyId }), [], "deliveries"),
    safeArray(listVehicleEntries({ societyId }), [], "vehicles"),
  ]);

  return {
    summary: analyticsSnapshot.summary,
    byWing: analyticsSnapshot.byWing,
    byPurpose: analyticsSnapshot.byPurpose,
    recentVisitors: recentVisitors.slice(0, 20),
    pendingApprovals: pendingApprovals.slice(0, 20),
    deliveries: deliveries.slice(0, 20),
    vehicles: vehicles.slice(0, 20),
  };
}

async function createEmergencyAlert({ triggeredBy, alertType, severity, message, location, societyId }) {
  await ensureVisitorEmergencyAlertSchema();

  const result = await db.query(
    `INSERT INTO visitor_emergency_alerts
     (triggered_by, alert_type, severity, message, location, status, society_id, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, NOW())`,
    [triggeredBy, alertType || "security", severity || "high", normalizeText(message), location || null, societyId || null]
  );

  return result.insertId || result.rows?.[0]?.id || null;
}

async function listEmergencyAlerts({ status, societyId } = {}) {
  await ensureVisitorEmergencyAlertSchema();

  const params = [];
  const filters = [];

  if (["active", "acknowledged", "resolved"].includes(normalizeText(status))) {
    filters.push("status = ?");
    params.push(normalizeText(status));
  }

  if (societyId) {
    filters.push("society_id = ?");
    params.push(societyId);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const { rows } = await db.query(
    `SELECT id, triggered_by, alert_type, severity, message, location, status, created_at
     FROM visitor_emergency_alerts
     ${whereClause}
     ORDER BY created_at DESC`,
    params
  );

  return rows;
}

async function acknowledgeEmergencyAlert({ id, userId }) {
  await ensureVisitorEmergencyAlertSchema();

  const result = await db.query(
    `UPDATE visitor_emergency_alerts
     SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = NOW()
     WHERE id = ? AND status = 'active'`,
    [userId, id]
  );

  return result.affectedRows > 0;
}

async function resolveEmergencyAlert({ id, userId }) {
  await ensureVisitorEmergencyAlertSchema();

  const result = await db.query(
    `UPDATE visitor_emergency_alerts
     SET status = 'resolved', resolved_by = ?, resolved_at = NOW()
     WHERE id = ? AND status IN ('active', 'acknowledged')`,
    [userId, id]
  );

  return result.affectedRows > 0;
}

module.exports = {
  normalizeText,
  normalizeLower,
  createSignature,
  getFlatByWingAndFlatNumber,
  getFlatOwnerByFlatId,
  createGuardVisitorEntry,
  getGuardVisitorEntryById,
  getVisitorById,
  createVisitorEntry,
  markVisitorExit,
  getVisitorLogs,
  createVisitorPreapproval,
  getVisitorPreapprovalById,
  listVisitorPreapprovals,
  updateVisitorPreapprovalStatus,
  markPreapprovalVisited,
  upsertVisitorFaceProfile,
  recognizeVisitorFace,
  createVehicleEntry,
  listVehicleEntries,
  createDeliveryEntry,
  listDeliveryEntries,
  createVisitorAnalyticsSnapshot,
  getVisitorDashboard,
  createEmergencyAlert,
  listEmergencyAlerts,
  acknowledgeEmergencyAlert,
  resolveEmergencyAlert,
};
