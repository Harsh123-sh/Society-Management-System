const staffAttendanceModel = require("../models/staffAttendanceModel");

function getStaffContext(req) {
  return {
    staffId: req.user?.id || req.user?.userId,
    societyId: req.user?.societyId || req.user?.society_id,
  };
}

function ensureStaffSociety(req, res) {
  const context = getStaffContext(req);
  if (!context.staffId || !context.societyId) {
    res.status(401).json({ success: false, message: "Society access not found. Please login again." });
    return null;
  }
  return context;
}

async function getMyAttendance(req, res) {
  try {
    const context = ensureStaffSociety(req, res);
    if (!context) return;

    const [data, specialDay] = await Promise.all([
      staffAttendanceModel.getMonthAttendance({
        ...context,
        month: req.query.month,
        year: req.query.year,
      }),
      staffAttendanceModel.getSpecialDay({ societyId: context.societyId }),
    ]);

    return res.json({
      success: true,
      data: {
        ...data,
        config: {
          canMarkHoliday: specialDay?.day_type === "holiday",
          canMarkWeeklyOff: specialDay?.day_type === "weekly_off",
          specialDay,
        },
      },
    });
  } catch (error) {
    console.error("Staff attendance list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load records. Please try again." });
  }
}

async function checkIn(req, res) {
  try {
    const context = ensureStaffSociety(req, res);
    if (!context) return;

    const attendance = await staffAttendanceModel.checkIn({
      ...context,
      notes: req.body?.notes,
      location: req.body?.location,
    });
    return res.json({ success: true, message: "Attendance marked successfully.", data: attendance });
  } catch (error) {
    console.error("Staff check-in error:", error);
    return res.status(500).json({ success: false, message: "Unable to load records. Please try again." });
  }
}

async function checkOut(req, res) {
  try {
    const context = ensureStaffSociety(req, res);
    if (!context) return;

    const attendance = await staffAttendanceModel.checkOut({ ...context, notes: req.body?.notes });
    if (!attendance?.check_out_at) {
      return res.status(400).json({ success: false, message: "Check In is required before Check Out." });
    }
    return res.json({ success: true, message: "Check-out completed.", data: attendance });
  } catch (error) {
    console.error("Staff check-out error:", error);
    return res.status(500).json({ success: false, message: "Unable to load records. Please try again." });
  }
}

async function createRequest(req, res) {
  try {
    const context = ensureStaffSociety(req, res);
    if (!context) return;

    const requestType = String(req.body?.requestType || "").toLowerCase();
    const id = await staffAttendanceModel.createRequest({
      ...context,
      requestType,
      reason: req.body?.reason,
      attendanceDate: req.body?.attendanceDate,
    });
    const request = await staffAttendanceModel.getRequestById(id, context.societyId);
    const message = requestType === "correction" ? "Correction request sent for approval." : "Leave request submitted.";
    return res.status(201).json({ success: true, message, data: request });
  } catch (error) {
    console.error("Staff attendance request error:", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to load records. Please try again." });
  }
}

async function markSpecialDay(req, res) {
  try {
    const context = ensureStaffSociety(req, res);
    if (!context) return;

    const attendance = await staffAttendanceModel.markConfiguredSpecialDay({
      ...context,
      dayType: req.body?.dayType,
    });
    if (!attendance) {
      return res.status(400).json({ success: false, message: "This day is not configured for that attendance status." });
    }
    return res.json({ success: true, message: "Attendance marked successfully.", data: attendance });
  } catch (error) {
    console.error("Staff special attendance error:", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to load records. Please try again." });
  }
}

async function reviewRequest(req, res) {
  try {
    if (!["admin", "secretary"].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    const societyId = req.user?.societyId || req.user?.society_id || req.body?.societyId;
    if (!societyId) {
      return res.status(401).json({ success: false, message: "Society access not found. Please login again." });
    }

    const request = await staffAttendanceModel.reviewRequest({
      requestId: Number(req.params.id),
      societyId,
      status: req.body?.status,
      reviewedBy: req.user.id,
    });
    if (!request) {
      return res.status(404).json({ success: false, message: "Pending request not found" });
    }
    return res.json({ success: true, message: `Request ${request.status}.`, data: request });
  } catch (error) {
    console.error("Staff attendance review error:", error);
    return res.status(400).json({ success: false, message: error.message || "Unable to load records. Please try again." });
  }
}

module.exports = {
  getMyAttendance,
  checkIn,
  checkOut,
  createRequest,
  markSpecialDay,
  reviewRequest,
};
