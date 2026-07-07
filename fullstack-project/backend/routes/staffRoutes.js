const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const staffAttendanceController = require("../controllers/staffAttendanceController");
const staffSecurityController = require("../controllers/staffSecurityController");

const router = express.Router();

router.use(authenticateToken);

router.get("/security", authorizeRoles("chairman", "admin", "secretary"), staffSecurityController.getStaffSecurityList);
router.get("/security/attendance/summary", authorizeRoles("chairman", "admin", "secretary"), staffSecurityController.getAttendanceSummary);
router.get("/security/attendance/monthly", authorizeRoles("chairman", "admin", "secretary"), staffSecurityController.getMonthlyAttendance);
router.patch("/security/attendance/:id", authorizeRoles("chairman", "admin", "secretary"), staffSecurityController.patchAttendanceCorrection);

router.get("/attendance", authorizeRoles("staff"), staffAttendanceController.getMyAttendance);
router.post("/attendance/check-in", authorizeRoles("staff"), staffAttendanceController.checkIn);
router.post("/attendance/check-out", authorizeRoles("staff"), staffAttendanceController.checkOut);
router.post("/attendance/requests", authorizeRoles("staff"), staffAttendanceController.createRequest);
router.post("/attendance/mark-special", authorizeRoles("staff"), staffAttendanceController.markSpecialDay);
router.patch("/attendance/requests/:id/review", authorizeRoles("chairman", "admin", "secretary"), staffAttendanceController.reviewRequest);

module.exports = router;
