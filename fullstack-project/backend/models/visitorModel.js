const crypto = require("crypto");
const QRCode = require("qrcode");
const db = require("../db");

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

async function safeRows(queryPromise, fallback = [], label = "visitor model query") {
  try {
    const [rows] = await queryPromise;
    return rows;
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

function createSignature(value) {
  return crypto.createHash("sha256").update(normalizeText(value)).digest("hex");
}

function randomNumericOtp(length = 6) {
  const minimum = 10 ** (length - 1);
  const maximum = 10 ** length - 1;
  return String(Math.floor(minimum + Math.random() * (maximum - minimum)));
}

async function uploadQrData(payload) {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });
}

async function getFlatByWingAndFlatNumber({ societyId, builderId, wingId, wing, flatNumber }) {
  const filters = [];
  const params = [];

  if (societyId) {
    filters.push("f.society_id = ?");
    params.push(societyId);
  }

  if (builderId) {
    filters.push("f.builder_id = ?");
    params.push(builderId);
  }

  if (wingId) {
    filters.push("f.wing_id = ?");
    params.push(wingId);
  } else if (normalizeText(wing)) {
    filters.push("UPPER(f.wing) = ?");
    params.push(normalizeText(wing).toUpperCase());
  }

  filters.push("f.flat_number = ?");
  params.push(normalizeText(flatNumber));

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT f.id, f.society_id, f.builder_id, f.building_name, f.wing, f.wing_id, f.flat_number
     FROM flats f
     ${whereClause}
       AND f.approval_status = 'approved'
     ORDER BY f.id ASC
     LIMIT 1`,
    params
  );

  return rows[0] || null;
}

async function getFlatOwnerByFlatId(flatId) {
  const [rows] = await db.query(
    `SELECT u.id, u.name, u.email
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

async function getVisitorById(visitorId) {
  const [rows] = await db.query(
    `SELECT v.id, v.visitor_name, v.visitor_email, v.phone, v.purpose, v.person_to_meet,
            v.vehicle_number, v.entry_time, v.exit_time, v.status, v.approval_status,
            v.security_id, v.flat_id, v.preapproval_id, v.photo_url, v.face_capture_url,
            v.face_match_confidence, v.qr_pass_id, v.otp_verified_at, v.blacklist_flag,
            u.name AS security_name, u.email AS security_email,
            f.building_name, f.wing, f.flat_number,
            vp.pass_token, vp.qr_code_url, vp.expires_at AS qr_expires_at
     FROM visitors v
     LEFT JOIN users u ON u.id = v.security_id
     LEFT JOIN flats f ON f.id = v.flat_id
     LEFT JOIN visitor_qr_passes vp ON vp.id = v.qr_pass_id
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
  const [result] = await db.query(
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
  const [result] = await db.query(
    `UPDATE visitors
     SET exit_time = NOW(), status = 'exited'
     WHERE id = ? AND status = 'in_premises'`,
    [visitorId]
  );

  return result.affectedRows > 0;
}

async function getVisitorLogs({ wing, search, fromDate, toDate, status, societyId } = {}) {
  const params = [];
  const filters = [];

  if (societyId) {
    filters.push("v.society_id = ?");
    params.push(societyId);
  }

  if (normalizeText(wing)) {
    filters.push("UPPER(f.wing) = ?");
    params.push(normalizeText(wing).toUpperCase());
  }

  if (normalizeText(search)) {
    filters.push("(v.visitor_name LIKE ? OR v.phone LIKE ? OR v.vehicle_number LIKE ? OR f.flat_number LIKE ?)");
    const like = `%${normalizeText(search)}%`;
    params.push(like, like, like, like);
  }

  if (normalizeText(fromDate)) {
    filters.push("DATE(v.entry_time) >= ?");
    params.push(fromDate);
  }

  if (normalizeText(toDate)) {
    filters.push("DATE(v.entry_time) <= ?");
    params.push(toDate);
  }

  if (["in_premises", "exited"].includes(normalizeText(status))) {
    filters.push("v.status = ?");
    params.push(normalizeText(status));
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [rows] = await db.query(
    `SELECT v.id, v.visitor_name, v.visitor_email, v.phone, v.purpose, v.person_to_meet,
            v.vehicle_number, v.entry_time, v.exit_time, v.status, v.approval_status,
            v.security_id, v.flat_id, v.preapproval_id, v.photo_url, v.face_capture_url,
            v.face_match_confidence, v.blacklist_flag,
            u.name AS security_name, u.email AS security_email,
            f.building_name, f.wing, f.flat_number,
            vp.pass_token, vp.qr_code_url
     FROM visitors v
     LEFT JOIN users u ON u.id = v.security_id
     LEFT JOIN flats f ON f.id = v.flat_id
     LEFT JOIN visitor_qr_passes vp ON vp.id = v.qr_pass_id
     ${whereClause}
     ORDER BY v.entry_time DESC`,
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
  const [result] = await db.query(
    `INSERT INTO visitor_preapprovals (
      owner_id, flat_id, visitor_name, phone, purpose, visit_date,
      expected_arrival_time, vehicle_number, notes, status, approved_at,
      approval_token, qr_pass_token, otp_code_hash, otp_expires_at, resident_notes
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW(), ?, NULL, NULL, NULL, ?)` ,
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
  const [rows] = await db.query(
    `SELECT vp.id, vp.owner_id, vp.flat_id, vp.visitor_name, vp.phone, vp.purpose,
            vp.visit_date, vp.expected_arrival_time, vp.vehicle_number, vp.notes,
            vp.status, vp.approved_at, vp.created_at, vp.approval_token,
            vp.qr_pass_token, vp.otp_code_hash, vp.otp_expires_at,
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

  const [rows] = await db.query(
    `SELECT vp.id, vp.owner_id, vp.flat_id, vp.visitor_name, vp.phone, vp.purpose,
            vp.visit_date, vp.expected_arrival_time, vp.vehicle_number, vp.notes,
            vp.status, vp.approved_at, vp.created_at, vp.approval_token,
            vp.qr_pass_token, vp.otp_code_hash, vp.otp_expires_at,
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
  const [result] = await db.query(
    `UPDATE visitor_preapprovals
     SET status = ?, approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE approved_at END
     WHERE id = ? AND owner_id = ?`,
    [status, status, id, ownerId]
  );

  return result.affectedRows > 0;
}

async function markPreapprovalVisited(preapprovalId) {
  const [result] = await db.query(
    `UPDATE visitor_preapprovals
     SET status = 'visited'
     WHERE id = ? AND status = 'approved'`,
    [preapprovalId]
  );

  return result.affectedRows > 0;
}

async function issueQrPass({ preapprovalId, issuedBy, deviceLabel }) {
  const passToken = crypto.randomBytes(18).toString("hex").toUpperCase();
  const qrPayload = JSON.stringify({ passToken, preapprovalId, deviceLabel: deviceLabel || null });
  const qrCodeUrl = await uploadQrData(qrPayload);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);

  const [result] = await db.query(
    `INSERT INTO visitor_qr_passes (
      preapproval_id, pass_token, qr_payload, qr_code_url, status,
      expires_at, issued_by, created_at
     ) VALUES (?, ?, ?, ?, 'active', ?, ?, NOW())`,
    [preapprovalId, passToken, qrPayload, qrCodeUrl, expiresAt, issuedBy || null]
  );

  await db.query(
    `UPDATE visitor_preapprovals
     SET qr_pass_token = ?, otp_code_hash = COALESCE(otp_code_hash, NULL), qr_pass_issued_at = NOW()
     WHERE id = ?`,
    [passToken, preapprovalId]
  ).catch(() => {});

  return { id: result.insertId, passToken, qrCodeUrl, expiresAt };
}

async function getQrPassByToken(passToken) {
  const [rows] = await db.query(
    `SELECT vp.id, vp.preapproval_id, vp.pass_token, vp.qr_payload, vp.qr_code_url,
            vp.status, vp.expires_at, vp.scan_count, vp.last_scanned_at, vp.issued_by,
            pre.id AS preapproval_id, pre.visitor_name, pre.phone, pre.purpose, pre.flat_id, pre.vehicle_number,
            pre.owner_id, pre.status AS preapproval_status
     FROM visitor_qr_passes vp
     JOIN visitor_preapprovals pre ON pre.id = vp.preapproval_id
     WHERE vp.pass_token = ?
     LIMIT 1`,
    [passToken]
  );

  return rows[0] || null;
}

async function markQrPassScanned({ passId, scannedBy }) {
  const [result] = await db.query(
    `UPDATE visitor_qr_passes
     SET scan_count = scan_count + 1, last_scanned_at = NOW(), scanned_by = ?, status = 'scanned'
     WHERE id = ? AND status = 'active'`,
    [scannedBy || null, passId]
  );

  return result.affectedRows > 0;
}

// Security actions: update preapproval status (used by security guards)
async function updateVisitorPreapprovalStatusBySecurity({ id, status, updatedBy, societyId }) {
  const params = [status, status, id];
  // Only allow updating preapproval if it belongs to the society (via flat)
  let sql = `UPDATE visitor_preapprovals vp
     JOIN flats f ON f.id = vp.flat_id
     SET vp.status = ?, vp.approved_at = CASE WHEN ? = 'approved' THEN NOW() ELSE vp.approved_at END
     WHERE vp.id = ?`;
  if (societyId) {
    sql += ` AND f.society_id = ?`;
    params.push(societyId);
  }

  const [result] = await db.query(sql, params).catch(() => [{}]);
  return result && result.affectedRows > 0;
}

async function createVisitorEntryFromPreapproval({ preapprovalId, securityId, entryMethod, societyId, photoBase64 }) {
  const preapproval = await getVisitorPreapprovalById(preapprovalId);
  if (!preapproval) return null;

  const [result] = await db.query(
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
  const [result] = await db.query(
    `UPDATE visitors
     SET exit_time = NOW(), status = 'checked_out'
     WHERE id = ? AND (status = 'in_premises' OR status = 'checked_in')`,
    [visitorId]
  );

  return result.affectedRows > 0;
}

async function createVisitorOtp({ preapprovalId, issuedBy }) {
  const otpCode = randomNumericOtp(6);
  const otpHash = createSignature(otpCode);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10);

  const [result] = await db.query(
    `INSERT INTO visitor_otps (preapproval_id, otp_hash, otp_code_last4, expires_at, issued_by, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
    [preapprovalId, otpHash, otpCode.slice(-4), expiresAt, issuedBy || null]
  );

  return { id: result.insertId, otpCode, expiresAt };
}

async function verifyVisitorOtp({ preapprovalId, otpCode, verifiedBy }) {
  const [rows] = await db.query(
    `SELECT id, otp_hash, expires_at, status
     FROM visitor_otps
     WHERE preapproval_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [preapprovalId]
  );

  const otpRow = rows[0];
  if (!otpRow || otpRow.status !== "active") {
    return { verified: false, reason: "OTP not found" };
  }

  if (new Date(otpRow.expires_at).getTime() < Date.now()) {
    return { verified: false, reason: "OTP expired" };
  }

  if (createSignature(otpCode) !== otpRow.otp_hash) {
    return { verified: false, reason: "OTP does not match" };
  }

  await db.query(
    `UPDATE visitor_otps
     SET status = 'verified', verified_at = NOW(), verified_by = ?
     WHERE id = ?`,
    [verifiedBy || null, otpRow.id]
  );

  await db.query(
    `UPDATE visitor_preapprovals
     SET otp_verified_at = NOW(), status = 'approved', approved_at = NOW()
     WHERE id = ?`,
    [preapprovalId]
  ).catch(() => {});

  return { verified: true, otpId: otpRow.id };
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
  const [existingRows] = await db.query(
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

  const [result] = await db.query(
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
  const [rows] = await db.query(
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

async function addBlacklistEntry({ visitorName, phone, reason, blockedBy, flatId, faceSignature }) {
  const [result] = await db.query(
    `INSERT INTO visitor_blacklist_entries
     (visitor_name, phone, reason, flat_id, face_signature, blocked_by, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
    [visitorName || null, phone || null, reason, flatId || null, faceSignature || null, blockedBy || null]
  );

  return result.insertId;
}

async function isBlacklisted({ visitorName, phone, faceSignature }) {
  const params = [];
  const filters = ["status = 'active'"];

  if (normalizeText(visitorName)) {
    filters.push("visitor_name = ?");
    params.push(normalizeText(visitorName));
  }

  if (normalizeText(phone)) {
    filters.push("phone = ?");
    params.push(normalizeText(phone));
  }

  if (normalizeText(faceSignature)) {
    filters.push("face_signature = ?");
    params.push(normalizeText(faceSignature));
  }

  if (!params.length) {
    return { blacklisted: false, record: null };
  }

  const [rows] = await db.query(
    `SELECT id, visitor_name, phone, reason, flat_id, face_signature, status, created_at
     FROM visitor_blacklist_entries
     WHERE (${filters.join(" OR ")})
     LIMIT 1`,
    params
  );

  return { blacklisted: Boolean(rows[0]), record: rows[0] || null };
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
  const [result] = await db.query(
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

  const [rows] = await db.query(
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
  const [result] = await db.query(
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

  const [rows] = await db.query(
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
        SUM(CASE WHEN DATE(entry_time) = CURDATE() THEN 1 ELSE 0 END) AS today_visits,
        SUM(CASE WHEN status = 'in_premises' THEN 1 ELSE 0 END) AS active_visits,
        SUM(CASE WHEN blacklist_flag = 1 THEN 1 ELSE 0 END) AS blacklist_hits,
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
  const [analyticsSnapshot, recentVisitors, pendingApprovals, activePasses, blacklists, deliveries, vehicles] = await Promise.all([
    createVisitorAnalyticsSnapshot({ societyId }),
    safeArray(getVisitorLogs({ wing, societyId }), [], "recent visitors"),
    safeArray(listVisitorPreapprovals({ status: "approved", societyId }), [], "pending approvals"),
    safeRows(
      db.query(
        `SELECT qp.id, qp.preapproval_id, qp.pass_token, qp.qr_code_url, qp.status, qp.expires_at,
                pre.visitor_name, pre.phone, pre.purpose, pre.visit_date, f.wing, f.flat_number
         FROM visitor_qr_passes qp
         JOIN visitor_preapprovals pre ON pre.id = qp.preapproval_id
         LEFT JOIN flats f ON f.id = pre.flat_id
         ${societyId ? "WHERE f.society_id = ? AND qp.status = 'active'" : "WHERE qp.status = 'active'"}
         ORDER BY qp.created_at DESC`,
        societyId ? [societyId] : []
      ),
      [],
      "active passes"
    ),
    safeRows(
      db.query(
        `SELECT b.id, b.visitor_name, b.phone, b.reason, b.flat_id, b.status, b.created_at
         FROM visitor_blacklist_entries b
         LEFT JOIN flats f ON f.id = b.flat_id
         ${societyId ? "WHERE f.society_id = ? AND b.status = 'active'" : "WHERE b.status = 'active'"}
         ORDER BY b.created_at DESC
         LIMIT 20`,
        societyId ? [societyId] : []
      ),
      [],
      "blacklist entries"
    ),
    safeArray(listDeliveryEntries({ societyId }), [], "deliveries"),
    safeArray(listVehicleEntries({ societyId }), [], "vehicles"),
  ]);

  return {
    summary: analyticsSnapshot.summary,
    byWing: analyticsSnapshot.byWing,
    byPurpose: analyticsSnapshot.byPurpose,
    recentVisitors: recentVisitors.slice(0, 20),
    pendingApprovals: pendingApprovals.slice(0, 20),
    activePasses: activePasses.slice(0, 20),
    blacklistEntries: blacklists.slice(0, 20),
    deliveries: deliveries.slice(0, 20),
    vehicles: vehicles.slice(0, 20),
  };
}

async function createEmergencyAlert({ triggeredBy, alertType, severity, message, location }) {
  const [result] = await db.query(
    `INSERT INTO visitor_emergency_alerts
     (triggered_by, alert_type, severity, message, location, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
    [triggeredBy, alertType || "security", severity || "high", normalizeText(message), location || null]
  );

  return result.insertId;
}

async function listEmergencyAlerts({ status } = {}) {
  const params = [];
  const filters = [];

  if (["active", "acknowledged", "resolved"].includes(normalizeText(status))) {
    filters.push("status = ?");
    params.push(normalizeText(status));
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const [rows] = await db.query(
    `SELECT id, triggered_by, alert_type, severity, message, location, status, created_at
     FROM visitor_emergency_alerts
     ${whereClause}
     ORDER BY created_at DESC`,
    params
  );

  return rows;
}

async function acknowledgeEmergencyAlert({ id, userId }) {
  const [result] = await db.query(
    `UPDATE visitor_emergency_alerts
     SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = NOW()
     WHERE id = ? AND status = 'active'`,
    [userId, id]
  );

  return result.affectedRows > 0;
}

async function resolveEmergencyAlert({ id, userId }) {
  const [result] = await db.query(
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
  randomNumericOtp,
  uploadQrData,
  getFlatByWingAndFlatNumber,
  getFlatOwnerByFlatId,
  getVisitorById,
  createVisitorEntry,
  markVisitorExit,
  getVisitorLogs,
  createVisitorPreapproval,
  getVisitorPreapprovalById,
  listVisitorPreapprovals,
  updateVisitorPreapprovalStatus,
  markPreapprovalVisited,
  issueQrPass,
  getQrPassByToken,
  markQrPassScanned,
  createVisitorOtp,
  verifyVisitorOtp,
  upsertVisitorFaceProfile,
  recognizeVisitorFace,
  addBlacklistEntry,
  isBlacklisted,
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
