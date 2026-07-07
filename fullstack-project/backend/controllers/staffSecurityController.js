const staffSecurityModel = require("../models/staffSecurityModel");

function getSocietyContext(req, res) {
  const societyId = req.user?.societyId || req.user?.society_id || req.societyId;
  const userId = req.user?.id || req.user?.userId || null;

  if (!societyId) {
    res.status(401).json({ success: false, message: "Society access not found. Please login again." });
    return null;
  }

  return { societyId, userId };
}

async function getStaffSecurityList(req, res) {
  try {
    const context = getSocietyContext(req, res);
    if (!context) return;

    const data = await staffSecurityModel.getStaffSecurityList({
      societyId: context.societyId,
      search: req.query.search,
      role: req.query.role,
      type: req.query.type,
      employmentType: req.query.employmentType,
      status: req.query.status,
      attendanceStatus: req.query.attendanceStatus,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Staff security list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load staff and security data." });
  }
}

async function getAttendanceSummary(req, res) {
  try {
    const context = getSocietyContext(req, res);
    if (!context) return;
    const data = await staffSecurityModel.getAttendanceSummary({ societyId: context.societyId });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Attendance summary error:", error);
    return res.status(500).json({ success: false, message: "Unable to load attendance summary." });
  }
}

async function getMonthlyAttendance(req, res) {
  try {
    const context = getSocietyContext(req, res);
    if (!context) return;
    const data = await staffSecurityModel.getMonthlyAttendance({
      societyId: context.societyId,
      month: req.query.month,
      year: req.query.year,
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Monthly attendance error:", error);
    return res.status(500).json({ success: false, message: "Unable to load monthly attendance." });
  }
}

async function patchAttendanceCorrection(req, res) {
  try {
    const context = getSocietyContext(req, res);
    if (!context) return;
    const data = await staffSecurityModel.patchAttendanceCorrection({
      societyId: context.societyId,
      attendanceId: Number(req.params.id),
      payload: req.body || {},
      updatedBy: context.userId,
    });

    if (!data) {
      return res.status(404).json({ success: false, message: "Attendance record not found." });
    }

    return res.json({ success: true, message: "Attendance updated.", data });
  } catch (error) {
    console.error("Attendance correction error:", error);
    return res.status(500).json({ success: false, message: "Unable to update attendance." });
  }
}

module.exports = {
  getStaffSecurityList,
  getAttendanceSummary,
  getMonthlyAttendance,
  patchAttendanceCorrection,
};
