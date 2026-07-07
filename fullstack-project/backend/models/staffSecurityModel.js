const db = require("../config/db");
const staffAttendanceModel = require("./staffAttendanceModel");

const STAFF_ROLES = ["staff", "security"];
const ACTIVE_ATTENDANCE = ["present", "late", "overtime"];
let userColumnsCache = null;

function clean(value) {
  return value === undefined || value === "" ? null : value;
}

async function getUserColumns() {
  if (!userColumnsCache) {
    userColumnsCache = (async () => {
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
  return userColumnsCache;
}

async function ensureStaffSecuritySchema() {
  await staffAttendanceModel.ensureStaffAttendanceSchema();

  await db.query(`
    CREATE TABLE IF NOT EXISTS staff_security_profiles (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      society_id INT NOT NULL,
      staff_role VARCHAR(80) NULL,
      department VARCHAR(80) NULL,
      employment_type VARCHAR(32) NOT NULL DEFAULT 'permanent',
      assigned_gate VARCHAR(80) NULL,
      assigned_area VARCHAR(120) NULL,
      shift_time VARCHAR(80) NULL,
      joining_date DATE NULL,
      attendance_status VARCHAR(32) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      mobile VARCHAR(40) NULL,
      approved_by VARCHAR(120) NULL,
      notes TEXT NULL,
      created_by INT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, society_id)
    )
  `);

}

function mapPerson(row) {
  const role = String(row.role || "").toLowerCase();
  const attendanceStatus = row.attendance_status || row.today_attendance_status || "not_marked";
  const fallbackRole = role === "security" ? "Security Guard" : "Staff";

  return {
    id: row.id,
    userId: row.id,
    name: row.name || "Unnamed",
    role,
    staffRole: row.staff_role || row.designation || fallbackRole,
    department: row.department || (role === "security" ? "Security" : "Operations"),
    mobile: row.mobile || row.phone || "",
    email: row.email || "",
    status: row.profile_status || row.status || "active",
    employmentType: row.employment_type || "permanent",
    joiningDate: row.joining_date || row.created_at || null,
    attendanceStatus,
    assignedGate: row.assigned_gate || "",
    assignedArea: row.assigned_area || "",
    shift: row.shift_time || "",
    source: "user",
  };
}

function buildFilters(filters = {}, userColumns = new Set()) {
  const params = [];
  const clauses = ["u.society_id = ?", "LOWER(u.role) IN ('staff', 'security')", "u.deleted_at IS NULL"];
  params.push(filters.societyId);

  if (userColumns.has("is_deleted")) {
    clauses.push("COALESCE(u.is_deleted, FALSE) = FALSE");
  }

  if (filters.search) {
    const like = `%${String(filters.search).toLowerCase()}%`;
    clauses.push("LOWER(u.name) LIKE ?");
    params.push(like);
  }
  if (filters.role && filters.role !== "all") {
    const roleExpression = userColumns.has("designation") ? "COALESCE(p.staff_role, u.designation, u.role)" : "COALESCE(p.staff_role, u.role)";
    clauses.push(`LOWER(${roleExpression}) = ?`);
    params.push(String(filters.role).toLowerCase());
  }
  if (filters.type && filters.type !== "all") {
    clauses.push("LOWER(u.role) = ?");
    params.push(String(filters.type).toLowerCase());
  }
  if (filters.employmentType && filters.employmentType !== "all") {
    clauses.push("LOWER(COALESCE(p.employment_type, 'permanent')) = ?");
    params.push(String(filters.employmentType).toLowerCase());
  }
  if (filters.status && filters.status !== "all") {
    clauses.push("LOWER(COALESCE(p.status, u.status, 'active')) = ?");
    params.push(String(filters.status).toLowerCase());
  }
  if (filters.attendanceStatus && filters.attendanceStatus !== "all") {
    clauses.push("LOWER(COALESCE(a.status, p.attendance_status, 'not_marked')) = ?");
    params.push(String(filters.attendanceStatus).toLowerCase());
  }
  if (filters.dateFrom) {
    clauses.push("COALESCE(p.joining_date, u.created_at::date) >= ?::date");
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    clauses.push("COALESCE(p.joining_date, u.created_at::date) <= ?::date");
    params.push(filters.dateTo);
  }

  return { where: clauses.join(" AND "), params };
}

async function getStaffSecurityList(filters = {}) {
  await ensureStaffSecuritySchema();
  const userColumns = await getUserColumns();
  const { where, params } = buildFilters(filters, userColumns);
  const phoneSelect = userColumns.has("phone") ? "u.phone" : "NULL AS phone";
  const departmentSelect = userColumns.has("department") ? "u.department" : "NULL AS department";
  const designationSelect = userColumns.has("designation") ? "u.designation" : "NULL AS designation";

  const { rows: userRows } = await db.query(
    `SELECT u.id, u.name, u.email, u.role, u.status, ${phoneSelect}, ${departmentSelect}, ${designationSelect}, u.created_at,
            p.staff_role, p.employment_type, p.assigned_gate, p.assigned_area, p.shift_time,
            p.joining_date, p.attendance_status, p.status AS profile_status,
            a.status AS today_attendance_status
     FROM users u
     LEFT JOIN staff_security_profiles p ON p.user_id = u.id AND p.society_id = u.society_id
     LEFT JOIN staff_attendance a ON a.staff_user_id = u.id AND a.society_id = u.society_id AND a.attendance_date = CURRENT_DATE
     WHERE ${where}
     ORDER BY LOWER(u.role), LOWER(u.name)`,
    params
  );

  const { rows: requestRows } = await db.query(
    `SELECT sar.*, u.name AS staff_name, u.role AS staff_role
     FROM staff_attendance_requests sar
     LEFT JOIN users u ON u.id = sar.staff_user_id
     WHERE sar.society_id = ?
     ORDER BY sar.created_at DESC
     LIMIT 50`,
    [filters.societyId]
  );

  const people = userRows.map(mapPerson);
  const staff = people.filter((item) => item.role === "staff");
  const securityGuards = people.filter((item) => item.role === "security");
  const attendanceToday = people.filter((item) => item.attendanceStatus && item.attendanceStatus !== "not_marked");

  const summary = {
    totalStaff: staff.length + securityGuards.length,
    activeStaff: people.filter((item) => String(item.status).toLowerCase() === "active").length,
    securityGuards: securityGuards.length,
    onDutyToday: people.filter((item) => ACTIVE_ATTENDANCE.includes(String(item.attendanceStatus).toLowerCase())).length,
    absentToday: people.filter((item) => String(item.attendanceStatus).toLowerCase() === "absent").length,
    pendingApprovals: requestRows.filter((item) => item.status === "pending").length,
  };

  return {
    summary,
    staff,
    securityGuards,
    attendanceToday,
    attendanceRequests: requestRows,
  };
}

async function getAttendanceSummary({ societyId }) {
  await ensureStaffSecuritySchema();
  const { rows } = await db.query(
    `SELECT status, COUNT(*)::int AS count
     FROM staff_attendance
     WHERE society_id = ? AND attendance_date = CURRENT_DATE
     GROUP BY status`,
    [societyId]
  );
  const totals = rows.reduce((acc, item) => ({ ...acc, [item.status]: item.count }), {});
  return {
    today: totals,
    onDuty: Object.entries(totals).filter(([status]) => ACTIVE_ATTENDANCE.includes(status)).reduce((sum, [, count]) => sum + count, 0),
    absent: totals.absent || 0,
    leave: totals.leave || 0,
    halfDay: totals.half_day || 0,
    lateMark: totals.late || 0,
    overtime: totals.overtime || 0,
  };
}

async function getMonthlyAttendance({ societyId, month, year }) {
  await ensureStaffSecuritySchema();
  const monthNumber = Number(month) || new Date().getMonth() + 1;
  const yearNumber = Number(year) || new Date().getFullYear();
  const fromDate = `${yearNumber}-${String(monthNumber).padStart(2, "0")}-01`;

  const { rows } = await db.query(
    `SELECT a.*, u.name AS staff_name, u.role AS staff_role
     FROM staff_attendance a
     LEFT JOIN users u ON u.id = a.staff_user_id
     WHERE a.society_id = ?
       AND a.attendance_date >= ?::date
       AND a.attendance_date < (?::date + INTERVAL '1 month')
     ORDER BY a.attendance_date DESC, u.name ASC`,
    [societyId, fromDate, fromDate]
  );

  return rows;
}

async function patchAttendanceCorrection({ societyId, attendanceId, payload, updatedBy }) {
  await ensureStaffSecuritySchema();
  const { rows } = await db.query(
    `UPDATE staff_attendance
     SET status = COALESCE(?, status),
         notes = COALESCE(?, notes),
         approval_status = COALESCE(?, approval_status),
         updated_at = NOW()
     WHERE id = ? AND society_id = ?
     RETURNING *`,
    [
      clean(payload.status),
      clean(payload.notes || payload.reason),
      clean(payload.approvalStatus || "chairman_updated"),
      attendanceId,
      societyId,
    ]
  );

  if (rows[0]) {
    void updatedBy;
  }

  return rows[0] || null;
}

module.exports = {
  ensureStaffSecuritySchema,
  getStaffSecurityList,
  getAttendanceSummary,
  getMonthlyAttendance,
  patchAttendanceCorrection,
};
