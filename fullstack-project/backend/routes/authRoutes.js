const express = require("express");
const authController = require("../controllers/authController");
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

router.post("/register", registerValidation, validationMiddleware, authController.register);
router.post("/register-chairman", authController.registerChairman);
router.get("/chairman/validate-society", authController.validateChairmanSociety);
router.post("/chairman/register", authController.registerChairman);
router.post("/chairman/verify-otp", authController.verifyChairmanRegistrationOtp);
router.post("/chairman/resend-otp", authController.resendChairmanRegistrationOtp);
router.post("/verify-email-otp", otpValidation, validationMiddleware, authController.verifyEmailOtp);
router.post(
  "/resend-verification-otp",
  emailWithSocietyValidation,
  validationMiddleware,
  authController.resendVerificationOtp
);
router.post("/login", loginValidation, validationMiddleware, authController.login);
router.get("/me", authenticateToken, authController.getProfile);
router.get("/profile", authenticateToken, authController.getProfile);
router.get("/oauth/config", authController.oauthConfig);
router.get("/google", authController.startOAuth);
router.get("/google/callback", authController.oauthCallback);
router.get("/microsoft", authController.startOAuth);
router.get("/microsoft/callback", authController.oauthCallback);
router.post("/oauth/login", authController.oauthLogin);
router.post("/oauth/complete-profile", authController.completeOAuthProfile);
router.post("/super-admin/login", superAdminLoginValidation, validationMiddleware, authController.loginSuperAdmin);
router.post("/forgot-password", emailWithSocietyValidation, validationMiddleware, authController.forgotPassword);
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
