const express = require("express");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validationMiddleware = require("../middleware/validationMiddleware");
const {
  registerValidation,
  loginValidation,
  emailOnlyValidation,
  otpValidation,
  resetPasswordValidation,
} = require("../validators/requestValidators");

const router = express.Router();

router.post("/register", registerValidation, validationMiddleware, authController.register);
router.post("/verify-email-otp", otpValidation, validationMiddleware, authController.verifyEmailOtp);
router.post(
  "/resend-verification-otp",
  emailOnlyValidation,
  validationMiddleware,
  authController.resendVerificationOtp
);
router.post("/login", loginValidation, validationMiddleware, authController.login);
router.post("/super-admin/login", loginValidation, validationMiddleware, authController.loginSuperAdmin);
router.post("/forgot-password", emailOnlyValidation, validationMiddleware, authController.forgotPassword);
router.post("/reset-password", resetPasswordValidation, validationMiddleware, authController.resetPassword);
router.post("/refresh-token", authenticateToken, authController.refreshToken);
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
