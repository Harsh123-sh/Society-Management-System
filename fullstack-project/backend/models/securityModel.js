const db = require("../config/db");

let securityModuleSchemaReady = null;

async function ensureSecurityAttendanceSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS security_attendance (
      id SERIAL PRIMARY KEY,
      security_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      society_id INTEGER NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
      check_in_time TIMESTAMP,
      check_out_time TIMESTAMP,
      break_start_time TIMESTAMP,
      break_end_time TIMESTAMP,
      total_working_minutes INTEGER DEFAULT 0,
      status VARCHAR(30) DEFAULT 'Present',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(security_user_id, attendance_date)
    )
  `);

  await db.query(`ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS society_id INTEGER`);
  await db.query(`ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP`);
  await db.query(`ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP`);
  await db.query(`ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS break_start_time TIMESTAMP`);
  await db.query(`ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS break_end_time TIMESTAMP`);
  await db.query(`ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS total_working_minutes INTEGER DEFAULT 0`);
  await db.query(`ALTER TABLE security_attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await db.query(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'security_attendance' AND column_name = 'check_in_at'
      ) THEN
        UPDATE security_attendance SET check_in_time = COALESCE(check_in_time, check_in_at);
      END IF;
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'security_attendance' AND column_name = 'check_out_at'
      ) THEN
        UPDATE security_attendance SET check_out_time = COALESCE(check_out_time, check_out_at);
      END IF;
    END $$;
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_security_attendance_user_date
    ON security_attendance(security_user_id, attendance_date)
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_security_attendance_society_date
    ON security_attendance(society_id, attendance_date)
  `);
}

async function ensureSecurityModuleSchema() {
  if (!securityModuleSchemaReady) {
    securityModuleSchemaReady = (async () => {
      await ensureSecurityAttendanceSchema();

      await db.query(`
        CREATE TABLE IF NOT EXISTS security_leave_requests (
          id SERIAL PRIMARY KEY,
          security_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          from_date DATE NOT NULL,
          to_date DATE NOT NULL,
          reason TEXT NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'pending',
          reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          reviewed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS security_holidays (
          id SERIAL PRIMARY KEY,
          title VARCHAR(150) NOT NULL,
          holiday_date DATE NOT NULL,
          description TEXT,
          is_optional INTEGER DEFAULT 0,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS security_shifts (
          id SERIAL PRIMARY KEY,
          security_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          shift_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          shift_type VARCHAR(50) DEFAULT 'general',
          status VARCHAR(30) DEFAULT 'assigned',
          notes TEXT,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS security_deliveries (
          id SERIAL PRIMARY KEY,
          society_id INTEGER REFERENCES societies(id) ON DELETE CASCADE,
          guard_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          resident_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          flat_id INTEGER REFERENCES flats(id) ON DELETE SET NULL,
          delivery_type VARCHAR(80) NOT NULL,
          package_id VARCHAR(120),
          recipient_name VARCHAR(150),
          delivery_partner VARCHAR(150),
          courier_company VARCHAR(150),
          package_details TEXT,
          entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          handover_time TIMESTAMP,
          status VARCHAR(30) DEFAULT 'pending',
          notes TEXT,
          logged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.query(`ALTER TABLE security_deliveries ADD COLUMN IF NOT EXISTS society_id INTEGER`);
      await db.query(`ALTER TABLE security_deliveries ADD COLUMN IF NOT EXISTS guard_id INTEGER`);
      await db.query(`ALTER TABLE security_deliveries ADD COLUMN IF NOT EXISTS resident_id INTEGER`);
      await db.query(`ALTER TABLE security_deliveries ADD COLUMN IF NOT EXISTS courier_company VARCHAR(150)`);
      await db.query(`ALTER TABLE security_deliveries ADD COLUMN IF NOT EXISTS package_details TEXT`);
      await db.query(`ALTER TABLE security_deliveries ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      await db.query(`ALTER TABLE security_deliveries ADD COLUMN IF NOT EXISTS handover_time TIMESTAMP`);

      await db.query(`
        CREATE TABLE IF NOT EXISTS security_visitor_approvals (
          id SERIAL PRIMARY KEY,
          visitor_name VARCHAR(150) NOT NULL,
          phone VARCHAR(40),
          purpose VARCHAR(180) NOT NULL,
          flat_id INTEGER REFERENCES flats(id) ON DELETE SET NULL,
          expected_at TIMESTAMP,
          requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          status VARCHAR(30) DEFAULT 'pending',
          decision_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          decision_at TIMESTAMP,
          check_in_at TIMESTAMP,
          check_out_at TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS security_notifications (
          id SERIAL PRIMARY KEY,
          society_id INTEGER REFERENCES societies(id) ON DELETE CASCADE,
          target_role VARCHAR(50) DEFAULT 'security',
          target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(180) NOT NULL,
          message TEXT NOT NULL,
          priority VARCHAR(30) DEFAULT 'medium',
          related_type VARCHAR(80),
          related_id INTEGER,
          is_read INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.query(`ALTER TABLE security_notifications ADD COLUMN IF NOT EXISTS society_id INTEGER`);

      await db.query(`
        CREATE TABLE IF NOT EXISTS security_emergency_alerts (
          id SERIAL PRIMARY KEY,
          triggered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          alert_type VARCHAR(80) DEFAULT 'other',
          severity VARCHAR(30) DEFAULT 'high',
          message TEXT NOT NULL,
          location VARCHAR(180),
          status VARCHAR(30) DEFAULT 'active',
          acknowledged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          acknowledged_at TIMESTAMP,
          resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          resolved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await db.query(`CREATE INDEX IF NOT EXISTS idx_security_shifts_user_date ON security_shifts(security_user_id, shift_date)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_security_deliveries_status_created ON security_deliveries(status, created_at)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_security_visitor_approvals_status ON security_visitor_approvals(status, created_at)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_security_notifications_target_read ON security_notifications(target_role, is_read, created_at)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_security_emergency_alerts_status ON security_emergency_alerts(status, created_at)`);
    })().catch((error) => {
      securityModuleSchemaReady = null;
      throw error;
    });
  }

  return securityModuleSchemaReady;
}

function mapSecurityAttendance(row) {
  if (!row) return null;
  const minutes = Number(row.total_working_minutes || 0);
  return {
    ...row,
    check_in_at: row.check_in_time,
    check_out_at: row.check_out_time,
    working_minutes: minutes,
    working_hours: minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : null,
  };
}

async function getSecurityProfile(userId) {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.society_id, s.name AS society_name
     FROM users u
     LEFT JOIN societies s ON u.society_id = s.id
     WHERE u.id = ? AND u.role = 'security'
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function getTodayAttendance(userId, societyId = null) {
  await ensureSecurityAttendanceSchema();
  const conditions = ["security_user_id = ?", "attendance_date = CURRENT_DATE"];
  const params = [userId];
  if (societyId) {
    conditions.push("society_id = ?");
    params.push(societyId);
  }
  const { rows } = await db.query(
    `SELECT id, security_user_id, society_id, attendance_date, check_in_time, check_out_time,
            break_start_time, break_end_time, total_working_minutes, status, notes, created_at, updated_at
     FROM security_attendance
     WHERE ${conditions.join(" AND ")}
     LIMIT 1`,
    params
  );

  return mapSecurityAttendance(rows[0]);
}

async function checkIn(userId, societyId, notes) {
  await ensureSecurityAttendanceSchema();
  const existing = await getTodayAttendance(userId, societyId);

  if (existing?.check_in_time) {
    const error = new Error("Already checked in today.");
    error.statusCode = 400;
    throw error;
  }

  await db.query(
    `INSERT INTO security_attendance (security_user_id, society_id, attendance_date, check_in_time, status, notes)
     VALUES (?, ?, CURRENT_DATE, NOW(), 'Present', ?)`,
    [userId, societyId, notes || null]
  );

  return getTodayAttendance(userId, societyId);
}

async function checkOut(userId, societyId, notes) {
  await ensureSecurityAttendanceSchema();
  const existing = await getTodayAttendance(userId, societyId);
  if (!existing?.check_in_time) {
    const error = new Error("Please check in first.");
    error.statusCode = 400;
    throw error;
  }
  if (existing?.check_out_time) {
    const error = new Error("Already checked out today.");
    error.statusCode = 400;
    throw error;
  }

  await db.query(
    `UPDATE security_attendance
     SET check_out_time = NOW(),
         total_working_minutes = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - check_in_time)) / 60))::int,
         updated_at = NOW(),
         notes = COALESCE(?, notes)
     WHERE security_user_id = ? AND society_id = ? AND attendance_date = CURRENT_DATE`,
    [notes || null, userId, societyId]
  );

  return getTodayAttendance(userId, societyId);
}

async function getMyShifts(userId, fromDate, toDate) {
  await ensureSecurityModuleSchema();
  const conditions = ["ss.security_user_id = ?"];
  const params = [userId];

  if (fromDate) {
    conditions.push("ss.shift_date >= ?");
    params.push(fromDate);
  }
  if (toDate) {
    conditions.push("ss.shift_date <= ?");
    params.push(toDate);
  }

  const { rows } = await db.query(
    `SELECT ss.id, ss.shift_date, ss.start_time, ss.end_time, ss.shift_type, ss.status,
            ss.notes, ss.created_at, creator.name AS created_by_name
     FROM security_shifts ss
     LEFT JOIN users creator ON creator.id = ss.created_by
     WHERE ${conditions.join(" AND ")}
     ORDER BY ss.shift_date DESC, ss.start_time DESC`,
    params
  );

  return rows;
}

async function createLeaveRequest({ userId, fromDate, toDate, reason }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `INSERT INTO security_leave_requests (security_user_id, from_date, to_date, reason, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [userId, fromDate, toDate, reason]
  );

  return result.insertId;
}

async function getLeaveRequestById(id) {
  await ensureSecurityModuleSchema();
  const { rows } = await db.query(
    `SELECT slr.id, slr.security_user_id, u.name AS security_name, u.email AS security_email,
            slr.from_date, slr.to_date, slr.reason, slr.status, slr.reviewed_by,
            reviewer.name AS reviewed_by_name, slr.reviewed_at, slr.created_at
     FROM security_leave_requests slr
     JOIN users u ON u.id = slr.security_user_id
     LEFT JOIN users reviewer ON reviewer.id = slr.reviewed_by
     WHERE slr.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function getMyLeaveRequests(userId) {
  await ensureSecurityModuleSchema();
  const { rows } = await db.query(
    `SELECT slr.id, slr.from_date, slr.to_date, slr.reason, slr.status,
            slr.reviewed_by, reviewer.name AS reviewed_by_name, slr.reviewed_at, slr.created_at
     FROM security_leave_requests slr
     LEFT JOIN users reviewer ON reviewer.id = slr.reviewed_by
     WHERE slr.security_user_id = ?
     ORDER BY slr.created_at DESC`,
    [userId]
  );

  return rows;
}

async function reviewLeaveRequest({ leaveRequestId, status, reviewedBy }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `UPDATE security_leave_requests
     SET status = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ? AND status = 'pending'`,
    [status, reviewedBy, leaveRequestId]
  );

  return result.affectedRows > 0;
}

async function getHolidays() {
  await ensureSecurityModuleSchema();
  const { rows } = await db.query(
    `SELECT id, title, holiday_date, description, is_optional, created_by, created_at
     FROM security_holidays
     ORDER BY holiday_date DESC, id DESC`
  );

  return rows;
}

async function createHoliday({ title, holidayDate, description, isOptional, createdBy }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `INSERT INTO security_holidays (title, holiday_date, description, is_optional, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [title, holidayDate, description || null, isOptional ? 1 : 0, createdBy]
  );

  return result.insertId;
}

async function createShift({ securityUserId, shiftDate, startTime, endTime, shiftType, notes, createdBy }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `INSERT INTO security_shifts (security_user_id, shift_date, start_time, end_time, shift_type, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [securityUserId, shiftDate, startTime, endTime, shiftType || "general", notes || null, createdBy]
  );

  return result.insertId;
}

async function getDeliveryById(id) {
  await ensureSecurityModuleSchema();
  const { rows } = await db.query(
    `SELECT sd.id, sd.society_id, sd.guard_id, sd.resident_id, sd.flat_id,
            f.building_name, f.wing, f.floor, f.flat_number,
            resident.name AS resident_name, resident.phone AS resident_phone,
            sd.delivery_type, sd.package_id,
            COALESCE(sd.courier_company, sd.delivery_partner) AS courier_company,
            sd.delivery_partner,
            COALESCE(sd.package_details, sd.notes) AS package_details,
            sd.recipient_name, sd.status, sd.notes,
            sd.entry_time, sd.handover_time,
            sd.logged_by, u.name AS logged_by_name, sd.created_at, sd.updated_at
     FROM security_deliveries sd
     LEFT JOIN flats f ON f.id = sd.flat_id
     LEFT JOIN users resident ON resident.id = sd.resident_id
     LEFT JOIN users u ON u.id = sd.logged_by
     WHERE sd.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function createDelivery({
  societyId,
  guardId,
  residentId,
  flatId,
  deliveryType,
  packageId,
  recipientName,
  deliveryPartner,
  courierCompany,
  packageDetails,
  status,
  notes,
  loggedBy,
}) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `INSERT INTO security_deliveries
     (society_id, guard_id, resident_id, flat_id, delivery_type, package_id, recipient_name,
      delivery_partner, courier_company, package_details, status, notes, logged_by, entry_time)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      societyId || null,
      guardId || loggedBy || null,
      residentId || null,
      flatId || null,
      deliveryType,
      packageId || null,
      recipientName || null,
      deliveryPartner || courierCompany || null,
      courierCompany || deliveryPartner || null,
      packageDetails || notes || null,
      status || "pending_handover",
      notes || packageDetails || null,
      loggedBy || guardId || null,
    ]
  );

  return result.insertId;
}

async function listDeliveries({ status, search, societyId } = {}) {
  await ensureSecurityModuleSchema();
  const conditions = [];
  const params = [];

  if (societyId) {
    conditions.push("sd.society_id = ?");
    params.push(societyId);
  }

  if (["logged", "pending", "pending_handover", "received", "completed", "dispatched", "returned"].includes(status)) {
    conditions.push("sd.status = ?");
    params.push(status);
  }

  if (search) {
    conditions.push("(sd.delivery_type LIKE ? OR sd.package_id LIKE ? OR sd.recipient_name LIKE ? OR sd.courier_company LIKE ? OR f.flat_number LIKE ? OR resident.name LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like, like, like);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT sd.id, sd.society_id, sd.guard_id, sd.resident_id, sd.flat_id,
            f.building_name, f.wing, f.floor, f.flat_number,
            resident.name AS resident_name, resident.phone AS resident_phone,
            sd.delivery_type, sd.package_id,
            COALESCE(sd.courier_company, sd.delivery_partner) AS courier_company,
            sd.delivery_partner,
            COALESCE(sd.package_details, sd.notes) AS package_details,
            sd.recipient_name, sd.status, sd.notes,
            sd.entry_time, sd.handover_time,
            sd.logged_by, u.name AS logged_by_name, sd.created_at, sd.updated_at
     FROM security_deliveries sd
     LEFT JOIN flats f ON f.id = sd.flat_id
     LEFT JOIN users resident ON resident.id = sd.resident_id
     LEFT JOIN users u ON u.id = sd.logged_by
     ${whereClause}
     ORDER BY COALESCE(sd.entry_time, sd.created_at) DESC`,
    params
  );

  return rows;
}

async function searchResidents({ societyId, query = "", limit = 50 } = {}) {
  const conditions = [
    "u.society_id = ?",
    "f.society_id = ?",
    "u.role = 'resident'",
    "u.status = 'active'",
    "u.resident_type IN ('owner','tenant')",
    "u.flat_id IS NOT NULL",
  ];
  const params = [societyId, societyId];

  if (query) {
    const likeQuery = `%${query}%`;
    conditions.push("(u.name LIKE ? OR u.phone LIKE ? OR f.wing LIKE ? OR f.flat_number LIKE ? OR f.floor LIKE ?)");
    params.push(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery);
  }

  const where = `WHERE ${conditions.join(" AND ")}`;

  const { rows } = await db.query(
    `SELECT u.id AS resident_id, u.name AS resident_name, u.phone AS resident_phone, u.status AS approval_status,
            u.resident_type AS owner_tenant, u.flat_id, f.wing, f.flat_number, f.floor, s.name AS society_name
     FROM users u
     JOIN flats f ON f.id = u.flat_id
     JOIN societies s ON s.id = f.society_id
     ${where}
     ORDER BY u.name ASC
     LIMIT ?`,
    [...params, Math.min(Math.max(Number(limit || 50), 1), 100)]
  );

  return rows;
}

async function getResidentSelection({ societyId, residentId, flatId } = {}) {
  const { rows } = await db.query(
    `SELECT u.id AS resident_id, u.name AS resident_name, u.email AS resident_email,
            u.phone AS resident_phone, u.status AS approval_status, u.resident_type AS owner_tenant,
            u.society_id, u.flat_id, f.wing, f.floor, f.flat_number, s.name AS society_name
     FROM users u
     JOIN flats f ON f.id = u.flat_id
     JOIN societies s ON s.id = f.society_id
     WHERE u.id = ?
       AND u.flat_id = ?
       AND u.society_id = ?
       AND f.society_id = ?
       AND u.role = 'resident'
       AND u.status = 'active'
       AND u.resident_type IN ('owner','tenant')
     LIMIT 1`,
    [residentId, flatId, societyId, societyId]
  );

  return rows[0] || null;
}

async function updateDeliveryStatus({ id, status, societyId }) {
  await ensureSecurityModuleSchema();
  const normalizedStatus = status === "dispatched" ? "completed" : status;
  const conditions = ["id = ?"];
  const params = [id];
  if (societyId) {
    conditions.push("society_id = ?");
    params.push(societyId);
  }
  const { rows: result } = await db.query(
    `UPDATE security_deliveries
     SET status = ?,
         handover_time = CASE WHEN ? IN ('completed', 'received') THEN COALESCE(handover_time, NOW()) ELSE handover_time END,
         updated_at = NOW()
     WHERE ${conditions.join(" AND ")}`,
    [normalizedStatus, normalizedStatus, ...params]
  );

  return result.affectedRows > 0;
}

async function ensureSecurityVehicleSchema() {
  await ensureSecurityModuleSchema();
  await db.query(`
    CREATE TABLE IF NOT EXISTS security_vehicle_entries (
      id SERIAL PRIMARY KEY,
      society_id INTEGER REFERENCES societies(id) ON DELETE CASCADE,
      guard_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      resident_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      flat_id INTEGER REFERENCES flats(id) ON DELETE SET NULL,
      vehicle_number VARCHAR(40) NOT NULL,
      vehicle_type VARCHAR(40),
      entry_type VARCHAR(30) DEFAULT 'guest',
      guest_name VARCHAR(150),
      id_proof_number VARCHAR(80),
      entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      exit_time TIMESTAMP,
      status VARCHAR(30) DEFAULT 'inside',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_security_vehicle_society_time ON security_vehicle_entries(society_id, entry_time)`);
}

async function createVehicleEntry({ societyId, guardId, residentId, flatId, vehicleNumber, vehicleType, entryType, guestName, idProofNumber }) {
  await ensureSecurityVehicleSchema();
  const { rows: result } = await db.query(
    `INSERT INTO security_vehicle_entries
     (society_id, guard_id, resident_id, flat_id, vehicle_number, vehicle_type, entry_type,
      guest_name, id_proof_number, entry_time, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'inside', NOW(), NOW())`,
    [
      societyId,
      guardId,
      residentId,
      flatId,
      vehicleNumber,
      vehicleType || null,
      entryType || "guest",
      guestName || null,
      idProofNumber || null,
    ]
  );

  return result.insertId;
}

async function getVehicleEntryById(id, societyId) {
  await ensureSecurityVehicleSchema();
  const { rows } = await db.query(
    `SELECT sve.id, sve.society_id, sve.guard_id, sve.resident_id, sve.flat_id,
            sve.vehicle_number, sve.vehicle_type, sve.entry_type, sve.guest_name,
            sve.id_proof_number, sve.entry_time, sve.exit_time, sve.status,
            sve.created_at, sve.updated_at,
            resident.name AS resident_name, resident.phone AS resident_phone,
            f.wing, f.floor, f.flat_number
     FROM security_vehicle_entries sve
     LEFT JOIN users resident ON resident.id = sve.resident_id
     LEFT JOIN flats f ON f.id = sve.flat_id
     WHERE sve.id = ? AND sve.society_id = ?
     LIMIT 1`,
    [id, societyId]
  );

  return rows[0] || null;
}

async function listVehicleEntries({ societyId, search = "" } = {}) {
  await ensureSecurityVehicleSchema();
  const conditions = ["sve.society_id = ?"];
  const params = [societyId];

  if (search) {
    const like = `%${search}%`;
    conditions.push("(sve.vehicle_number LIKE ? OR sve.guest_name LIKE ? OR resident.name LIKE ? OR f.flat_number LIKE ?)");
    params.push(like, like, like, like);
  }

  const { rows } = await db.query(
    `SELECT sve.id, sve.society_id, sve.guard_id, sve.resident_id, sve.flat_id,
            sve.vehicle_number, sve.vehicle_type, sve.entry_type, sve.guest_name,
            sve.id_proof_number, sve.entry_time, sve.exit_time, sve.status,
            sve.created_at, sve.updated_at,
            resident.name AS resident_name, resident.phone AS resident_phone,
            f.wing, f.floor, f.flat_number
     FROM security_vehicle_entries sve
     LEFT JOIN users resident ON resident.id = sve.resident_id
     LEFT JOIN flats f ON f.id = sve.flat_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY sve.entry_time DESC`,
    params
  );

  return rows;
}

async function createVisitorApprovalRequest({ visitorName, phone, purpose, flatId, expectedAt, requestedBy, notes }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `INSERT INTO security_visitor_approvals
     (visitor_name, phone, purpose, flat_id, expected_at, requested_by, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [visitorName, phone || null, purpose, flatId || null, expectedAt || null, requestedBy || null, notes || null]
  );

  return result.insertId;
}

async function listVisitorApprovalRequests({ status }) {
  await ensureSecurityModuleSchema();
  const params = [];
  let whereClause = "";

  if (["pending", "approved", "rejected", "checked_in", "checked_out"].includes(status)) {
    whereClause = "WHERE sva.status = ?";
    params.push(status);
  }

  const { rows } = await db.query(
    `SELECT sva.id, sva.visitor_name, sva.phone, sva.purpose, sva.flat_id,
            f.building_name, f.wing, f.flat_number, sva.expected_at,
            sva.requested_by, requester.name AS requested_by_name,
            sva.status, sva.decision_by, decider.name AS decision_by_name,
            sva.decision_at, sva.check_in_at, sva.check_out_at, sva.notes, sva.created_at
     FROM security_visitor_approvals sva
     LEFT JOIN flats f ON f.id = sva.flat_id
     LEFT JOIN users requester ON requester.id = sva.requested_by
     LEFT JOIN users decider ON decider.id = sva.decision_by
     ${whereClause}
     ORDER BY sva.created_at DESC`,
    params
  );

  return rows;
}

async function updateVisitorRequestStatus({ id, status, decisionBy }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `UPDATE security_visitor_approvals
     SET status = ?, decision_by = ?, decision_at = NOW()
     WHERE id = ?`,
    [status, decisionBy, id]
  );

  return result.affectedRows > 0;
}

async function markVisitorCheckIn(id) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `UPDATE security_visitor_approvals
     SET status = 'checked_in', check_in_at = NOW()
     WHERE id = ? AND status = 'approved'`,
    [id]
  );

  return result.affectedRows > 0;
}

async function markVisitorCheckOut(id) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `UPDATE security_visitor_approvals
     SET status = 'checked_out', check_out_at = NOW()
     WHERE id = ? AND status = 'checked_in'`,
    [id]
  );

  return result.affectedRows > 0;
}

async function createNotification({ societyId, targetRole, targetUserId, title, message, priority, relatedType, relatedId }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `INSERT INTO security_notifications
     (society_id, target_role, target_user_id, title, message, priority, related_type, related_id, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [societyId || null, targetRole || "security", targetUserId || null, title, message, priority || "medium", relatedType || null, relatedId || null]
  );

  return result.insertId;
}

async function listNotificationsForUser({ userId, role, societyId, onlyUnread }) {
  await ensureSecurityModuleSchema();
  const conditions = ["(sn.target_user_id = ? OR sn.target_role = ? OR sn.target_role = 'all')"];
  const params = [userId, role];

  if (societyId) {
    conditions.push("(sn.society_id = ? OR sn.society_id IS NULL)");
    params.push(societyId);
  }

  if (onlyUnread) {
    conditions.push("sn.is_read = 0");
  }

  const { rows } = await db.query(
    `SELECT sn.id, sn.society_id, sn.target_role, sn.target_user_id, sn.title, sn.message,
            sn.priority, sn.is_read, sn.related_type, sn.related_id, sn.created_at
     FROM security_notifications sn
     WHERE ${conditions.join(" AND ")}
     ORDER BY sn.created_at DESC`,
    params
  );

  return rows;
}

async function markNotificationRead(id, userId, role) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `UPDATE security_notifications
     SET is_read = 1
     WHERE id = ? AND (target_user_id = ? OR target_role = ? OR target_role = 'all')`,
    [id, userId, role]
  );

  return result.affectedRows > 0;
}

async function createEmergencyAlert({ triggeredBy, alertType, severity, message, location }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `INSERT INTO security_emergency_alerts
     (triggered_by, alert_type, severity, message, location, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [triggeredBy, alertType || "other", severity || "high", message, location || null]
  );

  return result.insertId;
}

async function listEmergencyAlerts({ status }) {
  await ensureSecurityModuleSchema();
  const conditions = [];
  const params = [];

  if (["active", "acknowledged", "resolved"].includes(status)) {
    conditions.push("sea.status = ?");
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT sea.id, sea.triggered_by, triggerer.name AS triggered_by_name,
            sea.alert_type, sea.severity, sea.message, sea.location, sea.status,
            sea.acknowledged_by, acknowledger.name AS acknowledged_by_name,
            sea.acknowledged_at, sea.resolved_by, resolver.name AS resolved_by_name,
            sea.resolved_at, sea.created_at
     FROM security_emergency_alerts sea
     LEFT JOIN users triggerer ON triggerer.id = sea.triggered_by
     LEFT JOIN users acknowledger ON acknowledger.id = sea.acknowledged_by
     LEFT JOIN users resolver ON resolver.id = sea.resolved_by
     ${whereClause}
     ORDER BY sea.created_at DESC`,
    params
  );

  return rows;
}

async function acknowledgeEmergencyAlert({ id, userId }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `UPDATE security_emergency_alerts
     SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = NOW()
     WHERE id = ? AND status = 'active'`,
    [userId, id]
  );

  return result.affectedRows > 0;
}

async function resolveEmergencyAlert({ id, userId }) {
  await ensureSecurityModuleSchema();
  const { rows: result } = await db.query(
    `UPDATE security_emergency_alerts
     SET status = 'resolved', resolved_by = ?, resolved_at = NOW()
     WHERE id = ? AND status IN ('active', 'acknowledged')`,
    [userId, id]
  );

  return result.affectedRows > 0;
}

async function getDashboardSummary(userId, role, societyId = null) {
  await ensureSecurityModuleSchema();
  const [
    attendanceResult,
    shiftsResult,
    leavesResult,
    visitorApprovalsResult,
    deliveriesResult,
    notificationsResult,
    alertsResult,
    holidaysResult,
  ] = await Promise.allSettled([
    getTodayAttendance(userId, societyId),
    getMyShifts(userId),
    getMyLeaveRequests(userId),
    listVisitorApprovalRequests({ status: "pending" }),
    listDeliveries({ status: "pending_handover", societyId }),
    listNotificationsForUser({ userId, role, societyId, onlyUnread: true }),
    listEmergencyAlerts({ status: "active" }),
    getHolidays(),
  ]);

  const attendance = attendanceResult.status === "fulfilled" ? attendanceResult.value : null;
  const shifts = shiftsResult.status === "fulfilled" && Array.isArray(shiftsResult.value) ? shiftsResult.value : [];
  const leaves = leavesResult.status === "fulfilled" && Array.isArray(leavesResult.value) ? leavesResult.value : [];
  const visitorApprovals =
    visitorApprovalsResult.status === "fulfilled" && Array.isArray(visitorApprovalsResult.value)
      ? visitorApprovalsResult.value
      : [];
  const deliveries =
    deliveriesResult.status === "fulfilled" && Array.isArray(deliveriesResult.value)
      ? deliveriesResult.value
      : [];
  const notifications =
    notificationsResult.status === "fulfilled" && Array.isArray(notificationsResult.value)
      ? notificationsResult.value
      : [];
  const alerts = alertsResult.status === "fulfilled" && Array.isArray(alertsResult.value) ? alertsResult.value : [];
  const holidays =
    holidaysResult.status === "fulfilled" && Array.isArray(holidaysResult.value) ? holidaysResult.value : [];

  return {
    attendance,
    shifts: shifts.slice(0, 10),
    leaves: leaves.slice(0, 10),
    holidays: holidays.slice(0, 10),
    pendingVisitorApprovals: visitorApprovals.slice(0, 10),
    pendingDeliveries: deliveries.slice(0, 10),
    unreadNotifications: notifications.slice(0, 20),
    activeAlerts: alerts.slice(0, 20),
    metrics: {
      todayShiftCount: shifts.filter((item) => {
        const dateValue = new Date(item.shift_date);
        const today = new Date();
        return (
          dateValue.getFullYear() === today.getFullYear() &&
          dateValue.getMonth() === today.getMonth() &&
          dateValue.getDate() === today.getDate()
        );
      }).length,
      pendingLeaveRequests: leaves.filter((item) => item.status === "pending").length,
      pendingVisitorApprovals: visitorApprovals.length,
      pendingDeliveries: deliveries.length,
      unreadNotifications: notifications.length,
      activeAlerts: alerts.length,
    },
  };
}

module.exports = {
  getSecurityProfile,
  getTodayAttendance,
  checkIn,
  checkOut,
  getMyShifts,
  createLeaveRequest,
  getLeaveRequestById,
  getMyLeaveRequests,
  reviewLeaveRequest,
  getHolidays,
  createHoliday,
  createShift,
  getDeliveryById,
  createDelivery,
  listDeliveries,
  updateDeliveryStatus,
  searchResidents,
  getResidentSelection,
  createVehicleEntry,
  getVehicleEntryById,
  listVehicleEntries,
  createVisitorApprovalRequest,
  listVisitorApprovalRequests,
  updateVisitorRequestStatus,
  markVisitorCheckIn,
  markVisitorCheckOut,
  createNotification,
  listNotificationsForUser,
  markNotificationRead,
  createEmergencyAlert,
  listEmergencyAlerts,
  acknowledgeEmergencyAlert,
  resolveEmergencyAlert,
  getDashboardSummary,
};
