const db = require("../config/db");

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

async function getTodayAttendance(userId) {
  const { rows } = await db.query(
    `SELECT id, security_user_id, attendance_date, check_in_at, check_out_at, status, notes
     FROM security_attendance
     WHERE security_user_id = ? AND attendance_date = CURRENT_DATE
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function checkIn(userId, notes) {
  const { rows: existing } = await db.query(
    `SELECT id FROM security_attendance WHERE security_user_id = ? AND attendance_date = CURRENT_DATE LIMIT 1`,
    [userId]
  );

  if (existing.length) {
    await db.query(
      `UPDATE security_attendance
       SET check_in_at = COALESCE(check_in_at, NOW()),
           status = 'checked_in',
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [notes || null, existing[0].id]
    );
    return getTodayAttendance(userId);
  }

  await db.query(
    `INSERT INTO security_attendance (security_user_id, attendance_date, check_in_at, status, notes)
     VALUES (?, CURRENT_DATE, NOW(), 'checked_in', ?)`,
    [userId, notes || null]
  );

  return getTodayAttendance(userId);
}

async function checkOut(userId, notes) {
  await db.query(
    `UPDATE security_attendance
     SET check_out_at = NOW(), status = 'checked_out', notes = COALESCE(?, notes)
     WHERE security_user_id = ? AND attendance_date = CURRENT_DATE`,
    [notes || null, userId]
  );

  return getTodayAttendance(userId);
}

async function getMyShifts(userId, fromDate, toDate) {
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
  const { rows: result } = await db.query(
    `INSERT INTO security_leave_requests (security_user_id, from_date, to_date, reason, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [userId, fromDate, toDate, reason]
  );

  return result.insertId;
}

async function getLeaveRequestById(id) {
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
  const { rows: result } = await db.query(
    `UPDATE security_leave_requests
     SET status = ?, reviewed_by = ?, reviewed_at = NOW()
     WHERE id = ? AND status = 'pending'`,
    [status, reviewedBy, leaveRequestId]
  );

  return result.affectedRows > 0;
}

async function getHolidays() {
  const { rows } = await db.query(
    `SELECT id, title, holiday_date, description, is_optional, created_by, created_at
     FROM security_holidays
     ORDER BY holiday_date DESC, id DESC`
  );

  return rows;
}

async function createHoliday({ title, holidayDate, description, isOptional, createdBy }) {
  const { rows: result } = await db.query(
    `INSERT INTO security_holidays (title, holiday_date, description, is_optional, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [title, holidayDate, description || null, isOptional ? 1 : 0, createdBy]
  );

  return result.insertId;
}

async function createShift({ securityUserId, shiftDate, startTime, endTime, shiftType, notes, createdBy }) {
  const { rows: result } = await db.query(
    `INSERT INTO security_shifts (security_user_id, shift_date, start_time, end_time, shift_type, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [securityUserId, shiftDate, startTime, endTime, shiftType || "general", notes || null, createdBy]
  );

  return result.insertId;
}

async function getDeliveryById(id) {
  const { rows } = await db.query(
    `SELECT sd.id, sd.flat_id, f.building_name, f.wing, f.flat_number, sd.delivery_type,
            sd.package_id, sd.recipient_name, sd.delivery_partner, sd.status, sd.notes,
            sd.logged_by, u.name AS logged_by_name, sd.created_at, sd.updated_at
     FROM security_deliveries sd
     LEFT JOIN flats f ON f.id = sd.flat_id
     LEFT JOIN users u ON u.id = sd.logged_by
     WHERE sd.id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function createDelivery({ flatId, deliveryType, packageId, recipientName, deliveryPartner, status, notes, loggedBy }) {
  const { rows: result } = await db.query(
    `INSERT INTO security_deliveries
     (flat_id, delivery_type, package_id, recipient_name, delivery_partner, status, notes, logged_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [flatId || null, deliveryType, packageId || null, recipientName || null, deliveryPartner || null, status || "pending", notes || null, loggedBy]
  );

  return result.insertId;
}

async function listDeliveries({ status, search }) {
  const conditions = [];
  const params = [];

  if (["pending", "received", "dispatched", "returned"].includes(status)) {
    conditions.push("sd.status = ?");
    params.push(status);
  }

  if (search) {
    conditions.push("(sd.delivery_type LIKE ? OR sd.package_id LIKE ? OR sd.recipient_name LIKE ? OR f.flat_number LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `SELECT sd.id, sd.flat_id, f.building_name, f.wing, f.flat_number, sd.delivery_type,
            sd.package_id, sd.recipient_name, sd.delivery_partner, sd.status, sd.notes,
            sd.logged_by, u.name AS logged_by_name, sd.created_at, sd.updated_at
     FROM security_deliveries sd
     LEFT JOIN flats f ON f.id = sd.flat_id
     LEFT JOIN users u ON u.id = sd.logged_by
     ${whereClause}
     ORDER BY sd.created_at DESC`,
    params
  );

  return rows;
}

async function updateDeliveryStatus({ id, status }) {
  const { rows: result } = await db.query(
    `UPDATE security_deliveries
     SET status = ?, updated_at = NOW()
     WHERE id = ?`,
    [status, id]
  );

  return result.affectedRows > 0;
}

async function createVisitorApprovalRequest({ visitorName, phone, purpose, flatId, expectedAt, requestedBy, notes }) {
  const { rows: result } = await db.query(
    `INSERT INTO security_visitor_approvals
     (visitor_name, phone, purpose, flat_id, expected_at, requested_by, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [visitorName, phone || null, purpose, flatId || null, expectedAt || null, requestedBy || null, notes || null]
  );

  return result.insertId;
}

async function listVisitorApprovalRequests({ status }) {
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
  const { rows: result } = await db.query(
    `UPDATE security_visitor_approvals
     SET status = ?, decision_by = ?, decision_at = NOW()
     WHERE id = ?`,
    [status, decisionBy, id]
  );

  return result.affectedRows > 0;
}

async function markVisitorCheckIn(id) {
  const { rows: result } = await db.query(
    `UPDATE security_visitor_approvals
     SET status = 'checked_in', check_in_at = NOW()
     WHERE id = ? AND status = 'approved'`,
    [id]
  );

  return result.affectedRows > 0;
}

async function markVisitorCheckOut(id) {
  const { rows: result } = await db.query(
    `UPDATE security_visitor_approvals
     SET status = 'checked_out', check_out_at = NOW()
     WHERE id = ? AND status = 'checked_in'`,
    [id]
  );

  return result.affectedRows > 0;
}

async function createNotification({ targetRole, targetUserId, title, message, priority, relatedType, relatedId }) {
  const { rows: result } = await db.query(
    `INSERT INTO security_notifications
     (target_role, target_user_id, title, message, priority, related_type, related_id, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [targetRole || "security", targetUserId || null, title, message, priority || "medium", relatedType || null, relatedId || null]
  );

  return result.insertId;
}

async function listNotificationsForUser({ userId, role, onlyUnread }) {
  const conditions = ["(sn.target_user_id = ? OR sn.target_role = ? OR sn.target_role = 'all')"];
  const params = [userId, role];

  if (onlyUnread) {
    conditions.push("sn.is_read = 0");
  }

  const { rows } = await db.query(
    `SELECT sn.id, sn.target_role, sn.target_user_id, sn.title, sn.message,
            sn.priority, sn.is_read, sn.related_type, sn.related_id, sn.created_at
     FROM security_notifications sn
     WHERE ${conditions.join(" AND ")}
     ORDER BY sn.created_at DESC`,
    params
  );

  return rows;
}

async function markNotificationRead(id, userId, role) {
  const { rows: result } = await db.query(
    `UPDATE security_notifications
     SET is_read = 1
     WHERE id = ? AND (target_user_id = ? OR target_role = ? OR target_role = 'all')`,
    [id, userId, role]
  );

  return result.affectedRows > 0;
}

async function createEmergencyAlert({ triggeredBy, alertType, severity, message, location }) {
  const { rows: result } = await db.query(
    `INSERT INTO security_emergency_alerts
     (triggered_by, alert_type, severity, message, location, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [triggeredBy, alertType || "other", severity || "high", message, location || null]
  );

  return result.insertId;
}

async function listEmergencyAlerts({ status }) {
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
  const { rows: result } = await db.query(
    `UPDATE security_emergency_alerts
     SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = NOW()
     WHERE id = ? AND status = 'active'`,
    [userId, id]
  );

  return result.affectedRows > 0;
}

async function resolveEmergencyAlert({ id, userId }) {
  const { rows: result } = await db.query(
    `UPDATE security_emergency_alerts
     SET status = 'resolved', resolved_by = ?, resolved_at = NOW()
     WHERE id = ? AND status IN ('active', 'acknowledged')`,
    [userId, id]
  );

  return result.affectedRows > 0;
}

async function getDashboardSummary(userId, role) {
  const [attendance, shifts, leaves, visitorApprovals, deliveries, notifications, alerts, holidays] =
    await Promise.all([
      getTodayAttendance(userId),
      getMyShifts(userId),
      getMyLeaveRequests(userId),
      listVisitorApprovalRequests({ status: "pending" }),
      listDeliveries({ status: "pending" }),
      listNotificationsForUser({ userId, role, onlyUnread: true }),
      listEmergencyAlerts({ status: "active" }),
      getHolidays(),
    ]);

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
