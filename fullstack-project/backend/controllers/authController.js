const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userModel = require("../models/userModel");
const flatModel = require("../models/flatModel");
const societyModel = require("../models/societyModel");
const UserApprovalModel = require("../models/userApprovalModel");
const otpModel = require("../models/otpModel");
const { sendOtpEmail } = require("../utils/mailer");

const OTP_VALIDITY_MINUTES = 10;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function getOtpExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_VALIDITY_MINUTES);
  return expiresAt;
}

async function issueAndSendOtp({ userId, email, purpose }) {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = getOtpExpiryDate();

  await otpModel.invalidateActiveOtps(email, purpose);
  await otpModel.createOtp({ userId, email, otpHash, purpose, expiresAt });
  await sendOtpEmail({ to: email, otp, purpose });
}

function signToken(user) {
  // Normalize token payload to use snake_case for DB-backed fields
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    resident_type: user.resident_type || null,
    status: user.status || null,
    society_id: user.society_id || user.societyId || null,
    society_code: user.society_code || user.societyCode || null,
    society_slug: user.society_slug || user.societySlug || null,
    builder_id: user.builder_id || user.builderId || null,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
}

async function logout(req, res) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) {
      return res.status(400).json({ success: false, message: "No token provided" });
    }
    const tokenBlacklist = require("../utils/tokenBlacklist");
    // Blacklist for token remaining lifetime (default 24h)
    tokenBlacklist.blacklistToken(token, 24 * 60 * 60);
    return res.json({ success: true, message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function register(req, res) {
  try {
    const { name, email, password, societyCode, role, wing, flatNumber, phone, address, idProofUrl } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required",
      });
    }

    if (!societyCode) {
      return res.status(400).json({
        success: false,
        message: "societyCode is required",
      });
    }

    const VALID_ROLES = ["chairman", "secretary", "owner", "tenant", "staff", "security"];
    const requestedRole = String(role || "").trim().toLowerCase();
    if (!requestedRole || !VALID_ROLES.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: "role must be chairman, secretary, owner, tenant, staff, or security",
      });
    }

    const isResidentRole = ["owner", "tenant"].includes(requestedRole);
    const isOfficerRole = ["chairman", "secretary"].includes(requestedRole);
    const normalizedRole = requestedRole === "chairman" ? "admin" : requestedRole;

    if (isResidentRole && (!wing || !flatNumber)) {
      return res.status(400).json({
        success: false,
        message: "wing and flatNumber are required for resident roles",
      });
    }

    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const society = await societyModel.getSocietyByCode(societyCode);
    if (!society) {
      return res.status(400).json({
        success: false,
        message: "Invalid society code",
      });
    }

    if (society.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This society is not active",
      });
    }

    const activeOfficerRows = await userModel.getUserCountsByRolesAndStatus({
      societyId: society.id,
      roles: ["admin", "secretary"],
      statuses: ["active"],
    });
    const activeOfficerCount = Number(activeOfficerRows?.count || 0);

    if (!isOfficerRole && activeOfficerCount === 0) {
      return res.status(403).json({
        success: false,
        message:
          "Only Chairman or Secretary can register first for this society. Member registration opens after one of them is approved.",
      });
    }

    if (isOfficerRole) {
      const existingOfficerRole = requestedRole === "chairman" ? "admin" : "secretary";
      const existingCount = await userModel.countUsersByRoleAndSociety(existingOfficerRole, society.id);
      if (existingCount > 0) {
        return res.status(400).json({
          success: false,
          message:
            requestedRole === "chairman"
              ? "Chairman already exists for this society."
              : "Secretary already exists for this society.",
        });
      }
    }

    let residentType = null;
    let normalizedFlatNumber = null;
    let matchedFlat = null;

    if (isResidentRole) {
      normalizedFlatNumber = String(flatNumber).trim();
      const normalizedWing = String(wing).trim().toUpperCase();
      matchedFlat = await flatModel.getFlatByWingAndFlatNumber({
        societyId: society.id,
        wing: normalizedWing,
        flatNumber: normalizedFlatNumber,
      });

      if (!matchedFlat) {
        return res.status(400).json({
          success: false,
          message: "No flat found for the selected wing and flat number",
        });
      }

      const hasOwner = await userModel.hasOwnerForFlatId(matchedFlat.id);
      residentType = hasOwner ? "tenant" : "owner";
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = isResidentRole ? "resident" : normalizedRole;

    const user = await userModel.createUser({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      residentType,
      status: "pending",
      isVerified: false,
      societyId: society.id,
      flatId: matchedFlat?.id || null,
      flatNumber: normalizedFlatNumber,
      phone: phone || null,
      address: address || null,
    });
    if (isOfficerRole) {
      await UserApprovalModel.createApprovalRequest({
        userId: user.id,
        societyId: society.id,
        approvalType: "registration",
        requestedBy: null,
        documents: idProofUrl ? { idProofUrl } : null,
      });
    }

    if (residentType === "owner") {
      await userModel.syncOwnerPropertyMapping(user.id, matchedFlat?.id || null);
    }

    let otpQueued = true;
    try {
      await issueAndSendOtp({
        userId: user.id,
        email: user.email,
        purpose: "email_verification",
      });
    } catch (otpError) {
      otpQueued = false;
      console.warn("OTP delivery failed during registration:", otpError.message);
    }

    res.status(201).json({
      success: true,
      message: otpQueued
        ? "User registered. Verify OTP sent to your email."
        : "User registered. OTP could not be sent automatically, please use resend OTP.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        resident_type: user.resident_type,
        status: user.status,
        society_code: society.code,
        flat_id: user.flat_id,
        flat_number: user.flat_number,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function verifyEmailOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "email and otp are required",
      });
    }

    const activeOtp = await otpModel.getLatestActiveOtp(email, "email_verification");
    if (!activeOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (activeOtp.otp_hash !== hashOtp(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await otpModel.markOtpAsUsed(activeOtp.id);
    await userModel.verifyUserByEmail(email);

    const user = await userModel.getUserByEmail(email);

    res.json({
      success: true,
      message: "Email verified successfully. Your account is waiting for admin approval.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        resident_type: user.resident_type || null,
        status: user.status || null,
        society_code: user.society_code || null,
        flat_id: user.flat_id || null,
        flat_number: user.flat_number || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function resendVerificationOtp(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: "User is already verified",
      });
    }

    await issueAndSendOtp({
      userId: user.id,
      email: user.email,
      purpose: "email_verification",
    });

    res.json({
      success: true,
      message: "Verification OTP sent",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password, societyCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.role === "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Super admin logins must use the hidden super admin login route",
      });
    }

    if (!societyCode) {
      return res.status(400).json({
        success: false,
        message: "societyCode is required",
      });
    }

    // Verify society exists
    const society = await societyModel.getSocietyByCode(societyCode);
    if (!society) {
      return res.status(400).json({
        success: false,
        message: "Invalid society code",
      });
    }

    if (society.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This society is not active",
      });
    }

    // CRITICAL: Verify user's society_id matches the selected society
    if (!user.society_id || user.society_id !== society.id) {
      return res.status(403).json({
        success: false,
        message: "This account is not registered with this society",
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email first",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          user.status === "rejected"
            ? "Your account has been rejected"
            : user.status === "inactive"
              ? "Your account is inactive"
            : "Your account is pending approval.",
      });
    }

    const token = signToken(user);
    await userModel.touchUserLastLogin(user.id).catch(() => null);

    const userPayload = {
      id: user.id,
      userId: user.id,
      email: user.email,
      name: user.name || user.full_name || null,
      userName: user.name || user.full_name || null,
      role: user.role,
      resident_type: user.resident_type || null,
      status: user.status || null,
      society_id: user.society_id,
      societyId: user.society_id,
      society_code: society.code,
      societyCode: society.code,
      society_name: society.name,
      societyName: society.name,
      flat_id: user.flat_id || null,
      flat_number: user.flat_number || null,
    };

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userPayload,
      data: userPayload,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function loginSuperAdmin(req, res) {
  try {
    const { email, password } = req.body;

    console.log("[loginSuperAdmin] incoming request", {
      email,
      hasPassword: Boolean(password),
      jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
    });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const user = await userModel.getSuperAdminByEmail(email);
    console.log("[loginSuperAdmin] fetched user record", {
      email,
      userFound: Boolean(user),
      userId: user?.id || null,
      role: user?.role || null,
      status: user?.status || null,
      is_verified: user?.is_verified || null,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid super admin credentials",
      });
    }

    if (user.role !== "super_admin") {
      console.error("[loginSuperAdmin] unexpected role mismatch", { email, role: user.role });
      return res.status(401).json({
        success: false,
        message: "Invalid super admin credentials",
      });
    }

    if (user.status !== "active" || !user.is_verified) {
      console.error("[loginSuperAdmin] super admin status/verification mismatch", {
        email,
        role: user.role,
        status: user.status,
        is_verified: user.is_verified,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid super admin credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("[loginSuperAdmin] password validation result", {
      email,
      isPasswordValid,
    });

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid super admin credentials",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          user.status === "rejected"
            ? "Your account has been rejected"
            : user.status === "inactive"
              ? "Your account is inactive"
              : "Your account is waiting for admin approval",
      });
    }

    const token = signToken(user);
    console.log("[loginSuperAdmin] JWT generated", {
      email,
      tokenLength: token ? token.length : 0,
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name || user.full_name || null,
      role: user.role,
      resident_type: user.resident_type || null,
      status: user.status || null,
      society_id: user.society_id || null,
      society_code: user.society_code || null,
      society_name: user.society_name || null,
      flat_id: user.flat_id || null,
      flat_number: user.flat_number || null,
    };

    res.json({
      success: true,
      message: "Super admin login successful",
      token,
      user: userPayload,
      data: userPayload,
    });
  } catch (error) {
    console.error("[loginSuperAdmin] unexpected error", {
      email: req.body?.email,
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Internal server error. See backend logs for details.",
      error: error.message,
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const existingUser = await userModel.getUserByEmailAndSociety(email, societyId);
    if (user) {
      await issueAndSendOtp({
        userId: user.id,
        email: user.email,
        purpose: "password_reset",
      });
    }

    res.json({
      success: true,
      message: "If this email is registered, a password reset OTP has been sent",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "email, otp and newPassword are required",
      });
    }

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const activeOtp = await otpModel.getLatestActiveOtp(email, "password_reset");
    if (!activeOtp) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (activeOtp.otp_hash !== hashOtp(otp)) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePasswordByEmail(email, hashedPassword);
    await otpModel.markOtpAsUsed(activeOtp.id);

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getProfile(req, res) {
  try {
    const user = await userModel.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function refreshToken(req, res) {
  try {
    // The token is already verified by authenticateToken middleware
    const userId = req.user.id;

    // Fetch fresh user data from database
    const user = await userModel.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user status is still active
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message:
          user.status === "rejected"
            ? "Your account has been rejected"
            : user.status === "inactive"
              ? "Your account is inactive"
              : "Your account is no longer approved",
      });
    }

    // Issue a new token
    const newToken = signToken(user);

    const userPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      resident_type: user.resident_type || null,
      status: user.status || null,
      society_code: user.society_code || null,
      flat_id: user.flat_id || null,
      flat_number: user.flat_number || null,
    };

    res.json({
      success: true,
      message: "Token refreshed",
      token: newToken,
      user: userPayload,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

function adminOnly(req, res) {
  res.json({
    success: true,
    message: "Admin route accessed",
    user: req.user,
  });
}

function staffOrAdmin(req, res) {
  res.json({
    success: true,
    message: "Staff/Admin route accessed",
    user: req.user,
  });
}

module.exports = {
  register,
  verifyEmailOtp,
  resendVerificationOtp,
  login,
  loginSuperAdmin,
  forgotPassword,
  resetPassword,
  getProfile,
  refreshToken,
  adminOnly,
  staffOrAdmin,
  logout,
};
