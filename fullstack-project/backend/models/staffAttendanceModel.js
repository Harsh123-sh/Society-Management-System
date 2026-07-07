const db = require("../config/db");

const VALID_REQUEST_TYPES = ["leave", "half_day", "correction", "overtime"];
const VALID_REVIEW_STATUSES = ["approved", "rejected"];

async function ensureStaffAttendanceSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_attendance (
      id SERIAL PRIMARY KEY,
      staff_user_id INT NOT NULL,
      society_id INT NOT NULL,
      attendance_date DATE NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'absent',
      check_in_at TIMESTAMPTZ NULL,
      break_start_at TIMESTAMPTZ NULL,
      break_end_at TIMESTAMPTZ NULL,
      check_out_at TIMESTAMPTZ NULL,
      working_minutes INT NOT NULL DEFAULT 0,
      break_minutes INT NOT NULL DEFAULT 0,
      overtime_minutes INT NOT NULL DEFAULT 0,
      notes TEXT NULL,
      location TEXT NULL,
      approval_status VARCHAR(32) NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (staff_user_id, society_id, attendance_date)
    )
  `);

  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS staff_user_id INT;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS society_id INT;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS attendance_date DATE;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'absent';`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMPTZ NULL;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS break_start_at TIMESTAMPTZ NULL;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS break_end_at TIMESTAMPTZ NULL;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMPTZ NULL;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS working_minutes INT NOT NULL DEFAULT 0;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS break_minutes INT NOT NULL DEFAULT 0;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS overtime_minutes INT NOT NULL DEFAULT 0;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS notes TEXT NULL;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS location TEXT NULL;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS approval_status VARCHAR(32) NULL;`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await db.query(`ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_attendance_requests (
      id SERIAL PRIMARY KEY,
      staff_user_id INT NOT NULL,
      society_id INT NOT NULL,
      attendance_date DATE NOT NULL,
      request_type VARCHAR(32) NOT NULL,
      reason TEXT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      reviewed_by INT NULL,
      reviewed_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS staff_user_id INT;`);
  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS society_id INT;`);
  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS attendance_date DATE NOT NULL DEFAULT CURRENT_DATE;`);
  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(32) NOT NULL DEFAULT 'leave';`);
  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS reason TEXT NULL;`);
  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'pending';`);
  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS reviewed_by INT NULL;`);
  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ NULL;`);
  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await db.query(`ALTER TABLE staff_attendance_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_attendance_special_days (
      id SERIAL PRIMARY KEY,
      society_id INT NOT NULL,
      special_date DATE NOT NULL,
      day_type VARCHAR(32) NOT NULL,
      title TEXT NULL,
      configured_by INT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (society_id, special_date, day_type)
    )
  `);

  await db.query(`ALTER TABLE staff_attendance_special_days ADD COLUMN IF NOT EXISTS society_id INT;`);
  await db.query(`ALTER TABLE staff_attendance_special_days ADD COLUMN IF NOT EXISTS special_date DATE;`);
  await db.query(`ALTER TABLE staff_attendance_special_days ADD COLUMN IF NOT EXISTS day_type VARCHAR(32) NOT NULL DEFAULT 'holiday';`);
  await db.query(`ALTER TABLE staff_attendance_special_days ADD COLUMN IF NOT EXISTS title TEXT NULL;`);
  await db.query(`ALTER TABLE staff_attendance_special_days ADD COLUMN IF NOT EXISTS configured_by INT NULL;`);
  await db.query(`ALTER TABLE staff_attendance_special_days ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
}

function mapAttendance(row) {
  if (!row) return null;
  return {
    ...row,
    date: row.attendance_date,
    overtime: Number(row.overtime_minutes || 0) > 0,
    working_hours: row.working_minutes ? `${Math.floor(row.working_minutes / 60)}h ${row.working_minutes % 60}m` : null,
    break_time: row.break_minutes ? `${Math.floor(row.break_minutes / 60)}h ${row.break_minutes % 60}m` : null,
  };
}

async function getTodayAttendance({ staffId, societyId }) {
  await ensureStaffAttendanceSchema();
  const { rows } = await db.query(
    `SELECT *
     FROM staff_attendance
     WHERE staff_user_id = ? AND society_id = ? AND attendance_date = CURRENT_DATE
     LIMIT 1`,
    [staffId, societyId]
  );
  return mapAttendance(rows[0]);
}

async function getSpecialDay({ societyId, date = null }) {
  await ensureStaffAttendanceSchema();
  const { rows } = await db.query(
    `SELECT id, society_id, special_date, day_type, title
     FROM staff_attendance_special_days
     WHERE society_id = ? AND special_date = COALESCE(?::date, CURRENT_DATE)
     ORDER BY id DESC
     LIMIT 1`,
    [societyId, date]
  );
  return rows[0] || null;
}

async function getMonthAttendance({ staffId, societyId, month, year }) {
  await ensureStaffAttendanceSchema();
  const monthNumber = Number(month) || new Date().getMonth() + 1;
  const yearNumber = Number(year) || new Date().getFullYear();
  const fromDate = `${yearNumber}-${String(monthNumber).padStart(2, "0")}-01`;

  const { rows } = await db.query(
    `SELECT *
     FROM staff_attendance
     WHERE staff_user_id = ?
       AND society_id = ?
       AND attendance_date >= ?::date
       AND attendance_date < (?::date + INTERVAL '1 month')
     ORDER BY attendance_date ASC`,
    [staffId, societyId, fromDate, fromDate]
  );

  const { rows: requestRows } = await db.query(
    `SELECT id, attendance_date, request_type, reason, status, reviewed_by, reviewed_at, created_at
     FROM staff_attendance_requests
     WHERE staff_user_id = ?
       AND society_id = ?
       AND attendance_date >= ?::date
       AND attendance_date < (?::date + INTERVAL '1 month')
     ORDER BY created_at DESC`,
    [staffId, societyId, fromDate, fromDate]
  );

  const records = rows.map(mapAttendance);
  const present = records.filter((item) => item.status === "present").length;
  const absent = records.filter((item) => item.status === "absent").length;
  const paidLeave = records.filter((item) => item.status === "leave").length;
  const halfLeave = records.filter((item) => item.status === "half_day").length;
  const lateArrivals = records.filter((item) => item.status === "late").length;
  const overtimeMinutes = records.reduce((sum, item) => sum + Number(item.overtime_minutes || 0), 0);
  const workingDays = Math.max(1, present + absent + paidLeave + halfLeave + lateArrivals);

  return {
    today: await getTodayAttendance({ staffId, societyId }),
    records,
    requests: requestRows,
    charts: {
      attendanceTrend: records.map((item) => ({
        name: new Date(item.attendance_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        value: ["present", "late"].includes(item.status) ? 1 : item.status === "half_day" ? 0.5 : 0,
      })),
      workingHours: records.map((item) => ({
        name: new Date(item.attendance_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        value: Number(((item.working_minutes || 0) / 60).toFixed(1)),
      })),
      leaveStatistics: [
        { name: "Paid Leave", value: paidLeave },
        { name: "Half Day", value: halfLeave },
        { name: "Absent", value: absent },
      ].filter((item) => item.value > 0),
      lateArrivalTrend: records.map((item) => ({
        name: new Date(item.attendance_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        value: item.status === "late" ? 1 : 0,
      })),
    },
    monthlySummary: {
      presentDays: present,
      absentDays: absent,
      paidLeaveUsed: paidLeave,
      halfLeaveUsed: halfLeave,
      remainingLeave: Math.max(0, 2 - paidLeave),
      lateArrivals,
      overtimeHours: Number((overtimeMinutes / 60).toFixed(1)),
      attendancePercentage: Math.round(((present + halfLeave * 0.5) / workingDays) * 100),
    },
  };
}

async function checkIn({ staffId, societyId, notes, location }) {
  await ensureStaffAttendanceSchema();
  const existing = await getTodayAttendance({ staffId, societyId });
  if (existing?.check_in_at) return existing;

  await db.query(
    `INSERT INTO staff_attendance (staff_user_id, society_id, attendance_date, status, check_in_at, notes, location)
     VALUES (?, ?, CURRENT_DATE, 'present', NOW(), ?, ?)
     ON CONFLICT (staff_user_id, society_id, attendance_date)
     DO UPDATE SET check_in_at = COALESCE(staff_attendance.check_in_at, NOW()),
                   status = CASE WHEN staff_attendance.status IN ('leave', 'half_day', 'holiday', 'weekly_off') THEN staff_attendance.status ELSE 'present' END,
                   notes = COALESCE(EXCLUDED.notes, staff_attendance.notes),
                   location = COALESCE(EXCLUDED.location, staff_attendance.location),
                   updated_at = NOW()`,
    [staffId, societyId, notes || null, location || null]
  );

  return getTodayAttendance({ staffId, societyId });
}

async function checkOut({ staffId, societyId, notes }) {
  await ensureStaffAttendanceSchema();
  await db.query(
    `UPDATE staff_attendance
     SET check_out_at = NOW(),
         working_minutes = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - check_in_at)) / 60)::INT - COALESCE(break_minutes, 0)),
         overtime_minutes = GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - check_in_at)) / 60)::INT - COALESCE(break_minutes, 0) - 480),
         notes = COALESCE(?, notes),
         updated_at = NOW()
     WHERE staff_user_id = ?
       AND society_id = ?
       AND attendance_date = CURRENT_DATE
       AND check_in_at IS NOT NULL`,
    [notes || null, staffId, societyId]
  );

  return getTodayAttendance({ staffId, societyId });
}

async function createRequest({ staffId, societyId, requestType, reason, attendanceDate = null }) {
  await ensureStaffAttendanceSchema();
  const normalizedType = String(requestType || "").toLowerCase();
  if (!VALID_REQUEST_TYPES.includes(normalizedType)) {
    throw new Error("Invalid attendance request type");
  }

  const { rows: result } = await db.query(
    `INSERT INTO staff_attendance_requests (staff_user_id, society_id, attendance_date, request_type, reason, status)
     VALUES (?, ?, COALESCE(?::date, CURRENT_DATE), ?, ?, 'pending')`,
    [staffId, societyId, attendanceDate, normalizedType, reason || null]
  );

  return result.insertId;
}

async function markConfiguredSpecialDay({ staffId, societyId, dayType }) {
  await ensureStaffAttendanceSchema();
  const normalizedType = String(dayType || "").toLowerCase();
  if (!["holiday", "weekly_off"].includes(normalizedType)) {
    throw new Error("Invalid special day type");
  }

  const specialDay = await getSpecialDay({ societyId });
  if (!specialDay || specialDay.day_type !== normalizedType) {
    return null;
  }

  await db.query(
    `INSERT INTO staff_attendance (staff_user_id, society_id, attendance_date, status, approval_status, updated_at)
     VALUES (?, ?, CURRENT_DATE, ?, 'configured', NOW())
     ON CONFLICT (staff_user_id, society_id, attendance_date)
     DO UPDATE SET status = EXCLUDED.status,
                   approval_status = 'configured',
                   updated_at = NOW()`,
    [staffId, societyId, normalizedType]
  );

  return getTodayAttendance({ staffId, societyId });
}

async function getRequestById(id, societyId = null) {
  await ensureStaffAttendanceSchema();
  const societyFilter = societyId ? "AND sar.society_id = ?" : "";
  const { rows } = await db.query(
    `SELECT sar.*, u.name AS staff_name, u.email AS staff_email
     FROM staff_attendance_requests sar
     JOIN users u ON u.id = sar.staff_user_id
     WHERE sar.id = ? ${societyFilter}
     LIMIT 1`,
    societyId ? [id, societyId] : [id]
  );
  return rows[0] || null;
}

async function reviewRequest({ requestId, societyId, status, reviewedBy }) {
  await ensureStaffAttendanceSchema();
  const normalizedStatus = String(status || "").toLowerCase();
  if (!VALID_REVIEW_STATUSES.includes(normalizedStatus)) {
    throw new Error("Invalid review status");
  }

  const request = await getRequestById(requestId, societyId);
  if (!request || request.status !== "pending") return null;

  await db.query(
    `UPDATE staff_attendance_requests
     SET status = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = ? AND society_id = ? AND status = 'pending'`,
    [normalizedStatus, reviewedBy, requestId, societyId]
  );

  if (normalizedStatus === "approved" && ["leave", "half_day"].includes(request.request_type)) {
    const attendanceStatus = request.request_type === "half_day" ? "half_day" : "leave";
    await db.query(
      `INSERT INTO staff_attendance (staff_user_id, society_id, attendance_date, status, approval_status, updated_at)
       VALUES (?, ?, ?, ?, 'approved', NOW())
       ON CONFLICT (staff_user_id, society_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status,
                     approval_status = 'approved',
                     updated_at = NOW()`,
      [request.staff_user_id, request.society_id, request.attendance_date, attendanceStatus]
    );
  }

  return getRequestById(requestId, societyId);
}

module.exports = {
  ensureStaffAttendanceSchema,
  getTodayAttendance,
  getSpecialDay,
  getMonthAttendance,
  checkIn,
  checkOut,
  createRequest,
  markConfiguredSpecialDay,
  getRequestById,
  reviewRequest,
};
