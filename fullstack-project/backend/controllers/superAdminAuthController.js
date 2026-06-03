const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");
const userModel = require("../models/userModel");
const { sendOtpEmail } = require("../utils/mailer");

const OTP_VALIDITY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function getOtpExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_VALIDITY_MINUTES);
  return expiresAt;
}

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/.test(String(password || ""));
}

async function getEligibleSuperAdmin(email) {
  const user = await userModel.getUserByEmail(email);

  if (!user) {
    return null;
  }

  if (user.role !== "super_admin") {
    return null;
  }

  if (user.status !== "active" || Number(user.is_verified) !== 1) {
    return null;
  }

  return user;
}

async function clearResetOtp(userId) {
  await db.query(
    `UPDATE users
     SET reset_otp_hash = NULL,
         reset_otp_expires_at = NULL,
         reset_otp_verified = 0,
         reset_otp_attempts = 0
     WHERE id = ?`,
    [userId]
  );
}

async function setResetOtp({ userId, otpHash, expiresAt }) {
  await db.query(
    `UPDATE users
     SET reset_otp_hash = ?,
         reset_otp_expires_at = ?,
         reset_otp_verified = 0,
         reset_otp_attempts = 0
     WHERE id = ?`,
    [otpHash, expiresAt, userId]
  );
}

function sendGenericForgotResponse(res) {
  return res.json({
    success: true,
    message: "If this email is registered as Super Admin, OTP has been sent.",
  });
}

async function forgotPassword(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await getEligibleSuperAdmin(email);

    if (user) {
      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const expiresAt = getOtpExpiryDate();

      await setResetOtp({ userId: user.id, otpHash, expiresAt });

      try {
        await sendOtpEmail({
          to: user.email,
          otp,
          purpose: "super_admin_password_reset",
        });
      } catch (emailError) {
        console.warn(`[super-admin] password reset OTP send failed for ${user.email}:`, emailError.message);
      }
    }

    return sendGenericForgotResponse(res);
  } catch (error) {
    console.error("[super-admin] forgot password failed:", error.message);
    return sendGenericForgotResponse(res);
  }
}

async function verifyOtp(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();
    const user = await getEligibleSuperAdmin(email);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const attempts = Number(user.reset_otp_attempts || 0);
    const expiresAt = user.reset_otp_expires_at ? new Date(user.reset_otp_expires_at) : null;
    const hasActiveOtp = Boolean(user.reset_otp_hash && expiresAt && expiresAt.getTime() > Date.now());

    if (!hasActiveOtp || attempts >= MAX_OTP_ATTEMPTS) {
      await clearResetOtp(user.id);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (hashOtp(otp) !== user.reset_otp_hash) {
      const nextAttempts = attempts + 1;

      if (nextAttempts >= MAX_OTP_ATTEMPTS) {
        await db.query(
          `UPDATE users
           SET reset_otp_attempts = ?,
               reset_otp_hash = NULL,
               reset_otp_expires_at = NULL,
               reset_otp_verified = 0
           WHERE id = ?`,
          [MAX_OTP_ATTEMPTS, user.id]
        );
      } else {
        await db.query("UPDATE users SET reset_otp_attempts = ? WHERE id = ?", [nextAttempts, user.id]);
      }

      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    await db.query("UPDATE users SET reset_otp_verified = 1 WHERE id = ?", [user.id]);

    return res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("[super-admin] verify OTP failed:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function resetPassword(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "newPassword must include uppercase, lowercase, number, and special character",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "confirmPassword must match newPassword",
      });
    }

    const user = await getEligibleSuperAdmin(email);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "OTP verification is required before resetting the password",
      });
    }

    const expiresAt = user.reset_otp_expires_at ? new Date(user.reset_otp_expires_at) : null;
    const hasVerifiedOtp = Number(user.reset_otp_verified || 0) === 1;

    if (
      !hasVerifiedOtp ||
      !user.reset_otp_hash ||
      !expiresAt ||
      expiresAt.getTime() <= Date.now() ||
      Number(user.reset_otp_attempts || 0) >= MAX_OTP_ATTEMPTS
    ) {
      await clearResetOtp(user.id);
      return res.status(400).json({
        success: false,
        message: "OTP verification is required before resetting the password",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query(
      `UPDATE users
       SET password = ?,
           reset_otp_hash = NULL,
           reset_otp_expires_at = NULL,
           reset_otp_verified = 0,
           reset_otp_attempts = 0
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    return res.json({
      success: true,
      message: "Password reset successful. Please sign in again.",
    });
  } catch (error) {
    console.error("[super-admin] reset password failed:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  forgotPassword,
  verifyOtp,
  resetPassword,
};