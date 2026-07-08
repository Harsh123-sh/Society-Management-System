const express = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/authController");
const superAdminController = require("../controllers/superAdminController");
const superAdminAuthController = require("../controllers/superAdminAuthController");
const { requireSuperAdmin } = require("../middleware/superAdminMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const {
	emailOnlyValidation,
	superAdminLoginValidation,
	superAdminOtpValidation,
	superAdminResetPasswordValidation,
} = require("../validators/requestValidators");

const forgotPasswordLimiter = rateLimit({
	windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
	max: Number(process.env.SUPER_ADMIN_FORGOT_RATE_LIMIT_MAX || 5),
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many requests, please try again later",
	},
});

const superAdminLoginLimiter = rateLimit({
	windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
	max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many authentication attempts, please try later",
	},
});

const router = express.Router();

router.post("/login", superAdminLoginLimiter, superAdminLoginValidation, validationMiddleware, authController.loginSuperAdmin);
router.post(
	"/forgot-password",
	forgotPasswordLimiter,
	emailOnlyValidation,
	validationMiddleware,
	superAdminAuthController.forgotPassword
);
router.post(
	"/verify-otp",
	superAdminOtpValidation,
	validationMiddleware,
	superAdminAuthController.verifyOtp
);
router.post(
	"/reset-password",
	superAdminResetPasswordValidation,
	validationMiddleware,
	superAdminAuthController.resetPassword
);
router.use(requireSuperAdmin);

router.get("/platform-stats", superAdminController.getPlatformStats);
router.get("/societies", superAdminController.listSocieties);
router.post("/societies", superAdminController.createSociety);
router.get("/societies/export", superAdminController.exportSocieties);
router.post("/societies/bulk", superAdminController.bulkUpdateSocieties);
router.put("/societies/:id", superAdminController.updateSociety);
router.patch("/societies/:id", superAdminController.updateSociety);
router.patch("/societies/:id/code", superAdminController.changeSocietyCode);
router.patch("/societies/:id/suspend", superAdminController.suspendSociety);
router.delete("/societies/:id", superAdminController.archiveSociety);
router.get("/societies/:id", superAdminController.getSocietyDetails);
router.get("/societies/:id/details", superAdminController.getSocietyDetails);
router.get("/societies/:id/analytics", superAdminController.getSocietyAnalytics);
router.get("/pending-approvals", superAdminController.getPendingApprovals);
router.post("/pending-approvals/:approvalId/approve", superAdminController.approvePendingUser);
router.post("/pending-approvals/:approvalId/reject", superAdminController.rejectPendingUser);
router.post("/societies/:id/assign-chairman", superAdminController.assignChairman);
router.get("/users/search", superAdminController.searchUsers);
router.get("/users", superAdminController.listUsers);
router.put("/users/:id/status", superAdminController.updateUserStatus);
router.delete("/users/:id", superAdminController.deleteUser);
router.get("/activity-logs", superAdminController.getActivityLogs);
router.get("/audit-logs", superAdminController.getActivityLogs);
router.get("/subscriptions", superAdminController.getSubscriptions);
router.get("/revenue-stats", superAdminController.getRevenueStats);
router.get("/support-tickets", superAdminController.getSupportTickets);
router.put("/support-tickets/:id/status", superAdminController.updateSupportTicketStatus);
router.get("/system-health", superAdminController.getSystemHealth);
router.get("/analytics", superAdminController.getPlatformAnalytics);

module.exports = router;
