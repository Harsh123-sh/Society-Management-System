const express = require("express");
const authController = require("../controllers/authController");
const { createRateLimiter } = require("../utils/rateLimiter");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const {
  registerValidation,
  loginValidation,
  superAdminLoginValidation,
  emailWithSocietyValidation,
  otpValidation,
  resetPasswordValidation,
} = require("../validators/requestValidators");

const router = express.Router();

const loginLimiter = createRateLimiter({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX || 20),
  message: "Too many attempts. Please wait a few minutes and try again.",
});
const otpLimiter = createRateLimiter({
  windowMs: Number(process.env.OTP_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  max: Number(process.env.OTP_RATE_LIMIT_MAX || 10),
  message: "Too many attempts. Please wait a few minutes and try again.",
});
const registrationLimiter = createRateLimiter({
  windowMs: Number(process.env.REGISTRATION_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000),
  max: Number(process.env.REGISTRATION_RATE_LIMIT_MAX || 10),
  message: "Too many attempts. Please wait a few minutes and try again.",
});
const forgotPasswordLimiter = createRateLimiter({
  windowMs: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000),
  max: Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX || 5),
  message: "Too many attempts. Please wait a few minutes and try again.",
});

router.post("/register", registrationLimiter, registerValidation, validationMiddleware, authController.register);
router.post("/register-chairman", registrationLimiter, authController.registerChairman);
router.get("/chairman/validate-society", authController.validateChairmanSociety);
router.post("/chairman/register", registrationLimiter, authController.registerChairman);
router.post("/chairman/verify-otp", otpLimiter, authController.verifyChairmanRegistrationOtp);
router.post("/chairman/resend-otp", otpLimiter, authController.resendChairmanRegistrationOtp);
router.post("/verify-email-otp", otpLimiter, otpValidation, validationMiddleware, authController.verifyEmailOtp);
router.post(
  "/resend-verification-otp",
  otpLimiter,
  emailWithSocietyValidation,
  validationMiddleware,
  authController.resendVerificationOtp
);
router.post("/login", loginLimiter, loginValidation, validationMiddleware, authController.login);
router.get("/me", authenticateToken, authController.getProfile);
router.get("/profile", authenticateToken, authController.getProfile);
router.get("/oauth/config", authController.oauthConfig);
router.get("/google", authController.startOAuth);
router.get("/google/callback", authController.oauthCallback);
router.get("/microsoft", authController.startOAuth);
router.get("/microsoft/callback", authController.oauthCallback);
router.post("/oauth/login", authController.oauthLogin);
router.post("/social/google", authController.oauthLogin);
router.post("/social/microsoft", authController.oauthLogin);
router.post("/oauth/complete-profile", authController.completeOAuthProfile);
router.post("/super-admin/login", superAdminLoginValidation, validationMiddleware, authController.loginSuperAdmin);
router.post("/forgot-password", forgotPasswordLimiter, emailWithSocietyValidation, validationMiddleware, authController.forgotPassword);
router.post("/reset-password", resetPasswordValidation, validationMiddleware, authController.resetPassword);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authenticateToken, authController.logout);
router.get("/profile", authenticateToken, authController.getProfile);
router.get(
  "/admin-only",
  authenticateToken,
  authorizeRoles("admin"),
  authController.adminOnly
);
router.get(
  "/staff-or-admin",
  authenticateToken,
  authorizeRoles("staff", "admin"),
  authController.staffOrAdmin
);

module.exports = router;
