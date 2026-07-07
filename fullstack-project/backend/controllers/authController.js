const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const userModel = require("../models/userModel");
const db = require("../config/db");
const flatModel = require("../models/flatModel");
const societyModel = require("../models/societyModel");
const UserApprovalModel = require("../models/userApprovalModel");
const otpModel = require("../models/otpModel");
const { sendOtpEmail } = require("../utils/mailer");
const { getFrontendUrl, getOAuthConfigStatus, getProviderConfig, isOAuthDebugMode } = require("../utils/oauthConfig");

const OTP_VALIDITY_MINUTES = 10;
const OTP_RESEND_WINDOW_MINUTES = 15;
const OTP_RESEND_LIMIT = 3;
const OAUTH_PROFILE_TOKEN_EXPIRES_IN = "20m";

function isDevelopment() {
  return process.env.NODE_ENV !== "production";
}

function logLoginDebug(message, metadata = {}) {
  if (!isDevelopment()) return;
  console.log(`[authController.login] ${message}`, metadata);
}

function normalizeLoginRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized === "owner" || normalized === "tenant") return "resident";
  if (normalized === "maintenance_staff") return "staff";
  return normalized;
}

async function createOAuthPasswordHash() {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function normalizeSocietyCode(value) {
  return String(value || "").trim().toUpperCase();
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

  await otpModel.invalidateActiveOtps(email, purpose, userId);
  const otpId = await otpModel.createOtp({ userId, email, otpHash, purpose, expiresAt });
  console.log("[OTP CREATED]", { email, purpose, otpId, userId });
  await sendOtpEmail({ to: email, otp, purpose });
}

async function logVerificationActivity(user, action, metadata = {}) {
  if (!user?.id) return;

  try {
    await userModel.logUserActivity({
      userId: user.id,
      action,
      entityType: "user",
      entityId: user.id,
      metadata: {
        email: user.email,
        purpose: "email_verification",
        ...metadata,
      },
    });
  } catch (error) {
    console.warn("[EMAIL VERIFICATION LOG FAILED]", {
      userId: user.id,
      action,
      message: error.message,
    });
  }
}

function signToken(user) {
  const payload = {
    token_type: "access",
    id: user.id,
    email: user.email,
    role: user.role,
    resident_type: user.resident_type || null,
    status: user.status || null,
    builder_id: user.builder_id || user.builderId || null,
  };

  if (user.role !== "super_admin") {
    payload.society_id = user.society_id || user.societyId || null;
    payload.society_code = user.society_code || user.societyCode || null;
    payload.society_slug = user.society_slug || user.societySlug || null;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      token_type: "refresh",
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

function buildAuthTokenPayload(user) {
  const accessToken = signToken(user);
  const refreshToken = signRefreshToken(user);

  return {
    token: accessToken,
    accessToken,
    access_token: accessToken,
    refreshToken,
    refresh_token: refreshToken,
  };
}

function signOAuthProfileToken(profile) {
  return jwt.sign(
    {
      purpose: "oauth_profile_completion",
      provider: profile.provider,
      providerId: profile.providerId,
      email: profile.email,
      name: profile.name,
      profilePhoto: profile.profilePhoto || null,
      emailVerified: Boolean(profile.emailVerified),
    },
    process.env.JWT_SECRET,
    { expiresIn: OAUTH_PROFILE_TOKEN_EXPIRES_IN }
  );
}

function buildUserPayload(user, society) {
  return {
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
    society_code: society?.code || user.society_code || null,
    societyCode: society?.code || user.society_code || null,
    society_name: society?.name || user.society_name || null,
    societyName: society?.name || user.society_name || null,
    flat_id: user.flat_id || null,
    flat_number: user.flat_number || null,
    auth_provider: user.auth_provider || null,
    profile_photo: user.profile_photo || user.profile_photo_url || null,
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const error = new Error(data?.error_description || data?.error || "OAuth provider verification failed");
    error.statusCode = response.status;
    error.providerStatus = response.status;
    error.providerResponse = data || text || null;
    throw error;
  }
  return data;
}

async function postFormJson(url, fields) {
  return fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString(),
  });
}

async function verifyOAuthToken(provider, token) {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  if (!["google", "microsoft"].includes(normalizedProvider) || !token) {
    const error = new Error("Invalid OAuth provider.");
    error.statusCode = 400;
    throw error;
  }

  if (normalizedProvider === "google") {
    const profile = await fetchJson("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return {
      provider: "google",
      providerId: profile.sub,
      email: String(profile.email || "").toLowerCase(),
      name: profile.name || profile.email,
      profilePhoto: profile.picture || null,
      emailVerified: Boolean(profile.email_verified),
    };
  }

  const profile = await fetchJson("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    provider: "microsoft",
    providerId: profile.id,
    email: String(profile.mail || profile.userPrincipalName || "").toLowerCase(),
    name: profile.displayName || profile.mail || profile.userPrincipalName,
    profilePhoto: null,
    emailVerified: true,
  };
}

function providerLabel(provider) {
  return provider === "microsoft" ? "Microsoft" : "Google";
}

function createOAuthConfigurationError(provider, missing = [], warnings = []) {
  const error = new Error(`${providerLabel(provider)} sign-in is temporarily unavailable. Please contact your administrator.`);
  error.statusCode = 503;
  error.code = "OAUTH_CONFIGURATION_MISSING";
  error.missing = missing;
  error.warnings = warnings;
  return error;
}

function signOAuthState({ provider, societyCode, frontendOrigin }) {
  return jwt.sign(
    {
      purpose: "oauth_login_state",
      provider,
      societyCode: societyCode || null,
      frontendOrigin: frontendOrigin || null,
      nonce: crypto.randomBytes(16).toString("hex"),
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );
}

function verifyOAuthState(state, provider) {
  const payload = jwt.verify(state, process.env.JWT_SECRET);
  if (payload?.purpose !== "oauth_login_state" || payload.provider !== provider) {
    const error = new Error("Invalid OAuth state.");
    error.statusCode = 400;
    throw error;
  }
  return payload;
}

function getRequestFrontendOrigin(req) {
  const candidates = [req.get("origin"), req.get("referer"), getFrontendUrl()].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if (["localhost", "127.0.0.1"].includes(url.hostname) || url.origin === getFrontendUrl()) {
        return url.origin;
      }
    } catch {
      // Ignore malformed origin/referrer values.
    }
  }
  return getFrontendUrl();
}

function publicOAuthMessage(provider, error) {
  if (error?.code === "OAUTH_CONFIGURATION_MISSING") {
    return error.message;
  }
  if (["Email already registered with another provider.", "Your account is pending society approval.", "Account rejected.", "Access denied.", "Society code not found."].includes(error?.message)) {
    return error.message;
  }
  return `${providerLabel(provider)} login failed. Please try again.`;
}

function buildOAuthErrorPayload(provider, error) {
  const payload = {
    success: false,
    code: error?.code || "OAUTH_LOGIN_FAILED",
    missing: error?.missing || [],
    warnings: error?.warnings || [],
    message: publicOAuthMessage(provider, error),
  };

  if (isOAuthDebugMode()) {
    payload.debugMessage = error?.providerResponse
      ? `${error.message}: ${JSON.stringify(error.providerResponse)}`
      : error?.message || null;
    payload.statusCode = error?.statusCode || null;
  }

  return payload;
}

function sendOAuthPopupResponse(res, payload, frontendOrigin = getFrontendUrl()) {
  const frontendUrl = String(frontendOrigin || getFrontendUrl()).replace(/\/+$/, "");
  const redirectUrl = new URL("/login", frontendUrl);
  if (!payload.success) {
    redirectUrl.searchParams.set("oauth_error", payload.message || "OAuth login failed.");
    if (payload.code) redirectUrl.searchParams.set("oauth_code", payload.code);
    if (payload.debugMessage) redirectUrl.searchParams.set("oauth_debug", payload.debugMessage);
  }

  res.type("html").send(`<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8"><title>Nexora OAuth</title></head>
  <body>
    <script>
      (function () {
        var payload = ${JSON.stringify({ type: "nexora-backend-oauth-callback", ...payload })};
        if (window.opener) {
          window.opener.postMessage(payload, ${JSON.stringify(frontendUrl)});
          window.close();
        } else {
          window.location.replace(${JSON.stringify(redirectUrl.toString())});
        }
      })();
    </script>
  </body>
</html>`);
}

function buildOAuthAuthorizationUrl(provider, societyCode, frontendOrigin) {
  const config = getProviderConfig(provider);
  const status = getOAuthConfigStatus()[provider];
  if (!status?.enabled) {
    throw createOAuthConfigurationError(provider, status?.missing || [], status?.warnings || []);
  }

  const state = signOAuthState({ provider, societyCode, frontendOrigin });
  if (provider === "google") {
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      access_type: "online",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    response_mode: "query",
    scope: "openid profile email User.Read",
    prompt: "select_account",
    state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

async function exchangeOAuthCode(provider, code) {
  const config = getProviderConfig(provider);
  if (provider === "google") {
    return postFormJson("https://oauth2.googleapis.com/token", {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.callbackUrl,
    });
  }

  return postFormJson("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.callbackUrl,
  });
}

async function completeOAuthLoginForProfile(oauthProfile, societyCode) {
  await userModel.ensureOAuthColumns();

  if (!oauthProfile.email || !oauthProfile.providerId) {
    const error = new Error(`${providerLabel(oauthProfile.provider)} login failed.`);
    error.statusCode = 400;
    throw error;
  }

  const society = societyCode ? await societyModel.getSocietyByCode(societyCode) : null;
  if (societyCode && !society) {
    const error = new Error("Society code not found.");
    error.statusCode = 400;
    throw error;
  }

  const usersWithEmail = await userModel.findUsersByEmail(oauthProfile.email);
  const user = society
    ? usersWithEmail.find((item) => Number(item.society_id) === Number(society.id))
    : usersWithEmail[0];

  if (!user) {
    return {
      success: true,
      requiresProfileCompletion: true,
      message: "Complete your society registration to continue.",
      completionToken: signOAuthProfileToken(oauthProfile),
      profile: {
        provider: oauthProfile.provider,
        email: oauthProfile.email,
        name: oauthProfile.name,
        profilePhoto: oauthProfile.profilePhoto,
      },
    };
  }

  if (society && Number(user.society_id) !== Number(society.id)) {
    const error = new Error("Access denied.");
    error.statusCode = 403;
    throw error;
  }

  if (user.auth_provider && user.auth_provider !== "password" && user.auth_provider !== oauthProfile.provider) {
    const error = new Error("Email already registered with another provider.");
    error.statusCode = 409;
    throw error;
  }

  let loginUser = user;
  if (!user.auth_provider || user.auth_provider === "password" || !user.provider_id) {
    loginUser = await userModel.linkOAuthProvider({
      userId: user.id,
      provider: oauthProfile.provider,
      providerId: oauthProfile.providerId,
      profilePhoto: oauthProfile.profilePhoto,
      emailVerified: oauthProfile.emailVerified,
    });
  } else if (String(user.provider_id) !== String(oauthProfile.providerId)) {
    const error = new Error("Email already registered with another provider.");
    error.statusCode = 409;
    throw error;
  }

  const accountStatus = loginUser.account_status || loginUser.status;
  if (accountStatus !== "active") {
    const error = new Error(
      accountStatus === "rejected"
        ? "Account rejected."
        : accountStatus === "inactive"
          ? "Access denied."
          : "Your account is pending society approval."
    );
    error.statusCode = 403;
    throw error;
  }

  if (!loginUser.society_id) {
    const error = new Error("Access denied.");
    error.statusCode = 403;
    throw error;
  }

  const userSociety = society || await societyModel.getSocietyById(loginUser.society_id);
  if (!userSociety || userSociety.status !== "active") {
    const error = new Error("Access denied.");
    error.statusCode = 403;
    throw error;
  }

  const authTokens = buildAuthTokenPayload({ ...loginUser, society_code: userSociety.code });
  await userModel.touchUserLastLogin(loginUser.id).catch(() => null);
  const payload = buildUserPayload(loginUser, userSociety);

  return {
    success: true,
    message: "Login successful",
    ...authTokens,
    user: payload,
    data: payload,
  };
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

    const VALID_ROLES = ["secretary", "owner", "tenant", "staff", "security"];
    const requestedRole = String(role || "").trim().toLowerCase();
    if (!requestedRole || !VALID_ROLES.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: "role must be secretary, owner, tenant, staff, or security",
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

    const existingUser = await userModel.getUserByEmailAndSociety(email, society.id);
    console.log("Registration Check:", {
      email,
      societyId: society.id,
      existingUser,
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
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
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getChairmanSocietyStatus(societyCode) {
  await societyModel.ensureChairmanColumn();
  await userModel.ensureChairmanRegistrationColumns();
  await societyModel.cleanupStaleChairmanIds();
  const society = await societyModel.getSocietyByCode(societyCode);
  if (!society) {
    return { ok: false, statusCode: 404, message: "Society code not found." };
  }

  const chairmanCount = await userModel.countBlockingChairmenBySociety(society.id);
  if (chairmanCount > 0) {
    return { ok: false, statusCode: 409, message: "Chairman already registered for this society.", society };
  }

  return { ok: true, society };
}

async function validateChairmanSociety(req, res) {
  try {
    const societyCode = normalizeSocietyCode(req.query.societyCode || req.query.code || req.body?.societyCode);
    if (!societyCode) {
      return res.status(400).json({ success: false, message: "Society code is required." });
    }

    const result = await getChairmanSocietyStatus(societyCode);
    if (!result.ok) {
      return res.status(result.statusCode).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      message: "Society is available for Chairman registration.",
      data: {
        id: result.society.id,
        code: result.society.code,
        societyCode: result.society.code,
        name: result.society.name,
        societyName: result.society.society_name || result.society.name,
        status: result.society.status,
      },
    });
  } catch (error) {
    console.error("[authController.validateChairmanSociety]", error);
    return res.status(500).json({ success: false, message: "Failed to validate society code." });
  }
}

async function registerChairman(req, res) {
  try {
    const { name, email, mobile, phone, password, confirmPassword } = req.body || {};
    const societyCode = normalizeSocietyCode(req.body?.societyCode);
    const requestedRole = String(req.body?.role || "chairman").trim().toLowerCase();

    if (requestedRole !== "chairman") {
      return res.status(400).json({ success: false, message: "Role must be chairman." });
    }
    if (!societyCode || !name || !email || !(mobile || phone) || !password) {
      return res.status(400).json({ success: false, message: "Society code, full name, email, mobile and password are required." });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters." });
    }

    await userModel.ensureChairmanRegistrationColumns();
    const result = await getChairmanSocietyStatus(societyCode);
    if (!result.ok) {
      return res.status(result.statusCode).json({ success: false, message: result.message });
    }

    const existingUser = await userModel.getUserByEmailAndSociety(email, result.society.id);
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered for this society." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({
      name,
      email,
      password: hashedPassword,
      role: "chairman",
      status: "pending_approval",
      isVerified: false,
      emailVerified: false,
      societyId: result.society.id,
      phone: mobile || phone,
      mobile: mobile || phone,
    });

    await issueAndSendOtp({
      userId: user.id,
      email: user.email,
      purpose: "email_verification",
    });

    await UserApprovalModel.createApprovalRequest({
      userId: user.id,
      societyId: result.society.id,
      approvalType: "chairman_registration",
      requestedBy: null,
      documents: { role: "chairman", mobile: mobile || phone || null },
    });

    return res.status(201).json({
      success: true,
      message: "OTP sent. Chairman registration submitted. Waiting for Super Admin approval.",
      data: {
        id: user.id,
        email: user.email,
        mobile: user.phone,
        role: "chairman",
        status: user.status,
        societyCode: result.society.code,
        societyName: result.society.name,
      },
    });
  } catch (error) {
    console.error("[authController.registerChairman]", error);
    return res.status(500).json({ success: false, message: "Chairman registration failed." });
  }
}

async function verifyChairmanRegistrationOtp(req, res) {
  try {
    const { email, otp } = req.body || {};
    const societyCode = normalizeSocietyCode(req.body?.societyCode);
    const requestedRole = String(req.body?.role || "chairman").trim().toLowerCase();

    if (requestedRole !== "chairman") {
      return res.status(400).json({ success: false, message: "Role must be chairman." });
    }
    if (!email || !otp || !societyCode) {
      return res.status(400).json({ success: false, message: "email, societyCode and otp are required." });
    }

    const society = await societyModel.getSocietyByCode(societyCode);
    if (!society) {
      return res.status(404).json({ success: false, message: "Society code not found." });
    }

    const user = await userModel.getUserByEmail(email, society.id);
    if (!user || !["chairman", "admin"].includes(user.role)) {
      return res.status(404).json({ success: false, message: "Chairman registration not found." });
    }
    if (user.status !== "pending_approval") {
      return res.status(400).json({ success: false, message: "Chairman registration is not pending approval." });
    }

    const activeOtp = await otpModel.getLatestActiveOtp(email, "email_verification", user.id);
    if (!activeOtp) {
      return res.status(400).json({ success: false, message: "OTP not found or expired" });
    }
    if (activeOtp.otp_hash !== hashOtp(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    const { count = 0 } = await userModel.getUserCountsByRolesAndStatus({
      societyId: society.id,
      roles: ["chairman"],
      statuses: ["active"],
    });
    if (Number(count || 0) > 0) {
      return res.status(409).json({ success: false, message: "Chairman already registered for this society." });
    }

    await otpModel.markOtpAsUsed(activeOtp.id);
    await userModel.verifyUserById(user.id);

    const existingApprovalRows = await UserApprovalModel.getPendingApprovals(society.id, { approvalType: "chairman_registration" });
    const hasPendingApproval = existingApprovalRows.some((item) => Number(item.user_id) === Number(user.id));
    if (!hasPendingApproval) {
      await UserApprovalModel.createApprovalRequest({
        userId: user.id,
        societyId: society.id,
        approvalType: "chairman_registration",
        requestedBy: null,
        documents: { role: "chairman" },
      });
    }

    await logVerificationActivity({ ...user, is_verified: true }, "chairman_registration_verified", { otpId: activeOtp.id });

    return res.json({
      success: true,
      message: "Registration submitted. Waiting for Super Admin approval.",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: "chairman",
        status: "pending_approval",
        is_verified: true,
        societyCode: society.code,
        societyName: society.name,
      },
    });
  } catch (error) {
    console.error("[authController.verifyChairmanRegistrationOtp]", error);
    return res.status(500).json({ success: false, message: "OTP verification failed." });
  }
}

async function resendChairmanRegistrationOtp(req, res) {
  try {
    const { email } = req.body || {};
    const societyCode = normalizeSocietyCode(req.body?.societyCode);
    if (!email || !societyCode) {
      return res.status(400).json({ success: false, message: "email and societyCode are required." });
    }

    const society = await societyModel.getSocietyByCode(societyCode);
    if (!society) {
      return res.status(404).json({ success: false, message: "Society code not found." });
    }
    const user = await userModel.getUserByEmail(email, society.id);
    if (!user || !["chairman", "admin"].includes(user.role) || user.status !== "pending_approval") {
      return res.status(404).json({ success: false, message: "Chairman registration not found." });
    }
    if (user.is_verified) {
      return res.status(400).json({ success: false, message: "Chairman registration is already verified and waiting for approval." });
    }

    await issueAndSendOtp({
      userId: user.id,
      email: user.email,
      purpose: "email_verification",
    });

    return res.json({ success: true, message: "Verification OTP sent." });
  } catch (error) {
    console.error("[authController.resendChairmanRegistrationOtp]", error);
    return res.status(500).json({ success: false, message: "Failed to resend OTP." });
  }
}

async function verifyEmailOtp(req, res) {
  try {
    const { email, otp, societyCode } = req.body;

    if (!email || !otp || !societyCode) {
      return res.status(400).json({
        success: false,
        message: "email, otp and societyCode are required",
      });
    }

    const society = await societyModel.getSocietyByCode(societyCode);
    if (!society) {
      return res.status(400).json({
        success: false,
        message: "Invalid society code",
      });
    }

    const user = await userModel.getUserByEmail(email, society.id);
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

    const activeOtp = await otpModel.getLatestActiveOtp(email, "email_verification", user.id);
    if (!activeOtp) {
      await logVerificationActivity(user, "email_verification_failed", { reason: "otp_not_found_or_expired" });
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (activeOtp.otp_hash !== hashOtp(otp)) {
      await logVerificationActivity(user, "email_verification_failed", { reason: "invalid_otp" });
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await otpModel.markOtpAsUsed(activeOtp.id);
    await userModel.verifyUserById(user.id);
    const verifiedUser = await userModel.getUserById(user.id);
    const responseUser = verifiedUser || { ...user, is_verified: true };
    await logVerificationActivity(responseUser, "email_verified", { otpId: activeOtp.id });

    res.json({
      success: true,
      message: "Email verified successfully.",
      data: {
        id: responseUser.id,
        name: responseUser.name,
        email: responseUser.email,
        role: responseUser.role,
        resident_type: responseUser.resident_type || null,
        status: responseUser.status || null,
        society_code: responseUser.society_code || null,
        flat_id: responseUser.flat_id || null,
        flat_number: responseUser.flat_number || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function resendVerificationOtp(req, res) {
  try {
    const { email, societyCode } = req.body;

    if (!email || !societyCode) {
      return res.status(400).json({
        success: false,
        message: "email and societyCode are required",
      });
    }

    const society = await societyModel.getSocietyByCode(societyCode);
    if (!society) {
      return res.status(400).json({
        success: false,
        message: "Invalid society code",
      });
    }

    const user = await userModel.getUserByEmail(email, society.id);
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

    const recentOtpCount = await otpModel.countOtpsCreatedSince(
      user.email,
      "email_verification",
      OTP_RESEND_WINDOW_MINUTES,
      user.id
    );

    if (recentOtpCount >= OTP_RESEND_LIMIT) {
      await logVerificationActivity(user, "email_verification_resend_limited", {
        windowMinutes: OTP_RESEND_WINDOW_MINUTES,
        limit: OTP_RESEND_LIMIT,
      });
      return res.status(429).json({
        success: false,
        code: "OTP_RESEND_LIMIT_EXCEEDED",
        message: `Too many OTP requests. Please try again after ${OTP_RESEND_WINDOW_MINUTES} minutes.`,
      });
    }

    await issueAndSendOtp({
      userId: user.id,
      email: user.email,
      purpose: "email_verification",
    });
    await logVerificationActivity(user, "email_verification_otp_resent");

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
    const body = req.body || {};
    const identifier = String(body.email || body.username || "").trim();
    const password = body.password;
    const societyCode = String(body.societyCode || body.society_code || "").trim().toUpperCase();
    const requestedRole = normalizeLoginRole(body.role);

    logLoginDebug("login attempt", {
      activeDatabaseHost: db.getDatabaseHost(),
      identifier,
      email: body.email ? String(body.email).trim() : null,
      requestedRole: requestedRole || null,
      societyCode,
      hasPassword: Boolean(password),
      bodyKeys: Object.keys(body),
    });

    logLoginDebug("request body received", {
      identifier,
      email: body.email ? String(body.email).trim() : null,
      username: body.username ? String(body.username).trim() : null,
      societyCode,
      requestedRole: requestedRole || null,
      hasPassword: Boolean(password),
      bodyKeys: Object.keys(body),
    });

    if (!identifier || !password || !societyCode) {
      const missingFields = [];
      if (!identifier) missingFields.push("email");
      if (!password) missingFields.push("password");
      if (!societyCode) missingFields.push("societyCode");
      logLoginDebug("returning 400 missing required fields", { missingFields });
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} ${missingFields.length === 1 ? "is" : "are"} required`,
        missingFields,
      });
    }

    const allowedLoginRoles = ["chairman", "admin", "secretary", "resident", "staff", "security"];
    if (requestedRole && !allowedLoginRoles.includes(requestedRole)) {
      logLoginDebug("returning 400 invalid requested role", { requestedRole });
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    logLoginDebug("looking up society by code", { societyCode });
    const society = await societyModel.getSocietyByCode(societyCode);
    logLoginDebug("society lookup result", {
      found: Boolean(society),
      societyId: society?.id || null,
      code: society?.code || null,
      status: society?.status || null,
    });
    if (!society) {
      logLoginDebug("returning 404 society code not found", { societyCode });
      return res.status(404).json({
        success: false,
        message: "Society code not found",
      });
    }

    const user = await userModel.getUserByLoginIdentifier(identifier, society.id);
    logLoginDebug("user lookup result", {
      found: Boolean(user),
      userId: user?.id || null,
      userSocietyId: user?.society_id || null,
      requestedSocietyId: society.id,
      role: user?.role || null,
      status: user?.status || null,
      isVerified: user?.is_verified ?? null,
    });
    if (!user) {
      logLoginDebug("returning 401 user not found in selected society", { identifier, societyId: society.id });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.role === "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Super admin logins must use the hidden super admin login route",
      });
    }

    const userRole = normalizeLoginRole(user.role);
    if (requestedRole && requestedRole !== userRole) {
      logLoginDebug("returning 403 requested role mismatch", {
        userId: user.id,
        requestedRole,
        userRole,
      });
      return res.status(403).json({
        success: false,
        message: "Selected role does not match this account",
      });
    }

    if (society.status !== "active" && userRole !== "chairman") {
      logLoginDebug("returning 403 inactive society", { societyId: society.id, status: society.status });
      return res.status(403).json({
        success: false,
        message: "This society is not active",
      });
    }

    // CRITICAL: Verify user's society_id matches the selected society
    if (!user.society_id || Number(user.society_id) !== Number(society.id)) {
      logLoginDebug("returning 403 user society mismatch", {
        userId: user.id,
        userSocietyId: user.society_id || null,
        selectedSocietyId: society.id,
      });
      return res.status(403).json({
        success: false,
        message: "This account is not registered with this society",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    logLoginDebug("password validation result", { userId: user.id, isPasswordValid });
    if (!isPasswordValid) {
      logLoginDebug("returning 401 invalid password", { userId: user.id });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status !== "active") {
      logLoginDebug("returning 403 inactive user", { userId: user.id, status: user.status });
      return res.status(403).json({
        success: false,
        message:
          user.status === "rejected"
            ? "Your account has been rejected"
            : user.status === "inactive"
              ? "Your account is inactive"
              : user.role === "chairman"
                ? "Your Chairman account is pending Super Admin approval."
                : "Your account is pending approval.",
      });
    }

    if (!user.is_verified) {
      logLoginDebug("returning 403 unverified email", { userId: user.id, email: user.email });
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before login.",
        email: user.email,
      });
    }

    if (society.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This society is not active",
      });
    }

    const authTokens = buildAuthTokenPayload({ ...user, society_code: society.code });
    logLoginDebug("jwt tokens generated", {
      userId: user.id,
      hasAccessToken: Boolean(authTokens.accessToken),
      hasRefreshToken: Boolean(authTokens.refreshToken),
    });
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
      ...authTokens,
      user: userPayload,
      data: userPayload,
    });
  } catch (error) {
    console.error("[authController.login] unexpected error", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function oauthLogin(req, res) {
  try {
    const { provider, accessToken, token, societyCode } = req.body;
    const oauthProfile = await verifyOAuthToken(provider, accessToken || token);
    const result = await completeOAuthLoginForProfile(oauthProfile, societyCode);
    return res.json(result);
  } catch (error) {
    console.error("[authController.oauthLogin]", error.message);
    const label = providerLabel(String(req.body?.provider || "").toLowerCase());
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || `${label} login failed.` });
  }
}

async function oauthConfig(req, res) {
  res.json({ success: true, data: getOAuthConfigStatus() });
}

async function startOAuth(req, res) {
  const provider = req.path.includes("microsoft") ? "microsoft" : "google";
  if (!["google", "microsoft"].includes(provider)) {
    return res.status(404).json({ success: false, message: "OAuth provider not found." });
  }

  try {
    const frontendOrigin = getRequestFrontendOrigin(req);
    const authUrl = buildOAuthAuthorizationUrl(provider, req.query.societyCode, frontendOrigin);
    return res.redirect(authUrl);
  } catch (error) {
    const frontendOrigin = getRequestFrontendOrigin(req);
    const errorPayload = buildOAuthErrorPayload(provider, error);
    if (req.accepts("html")) {
      return sendOAuthPopupResponse(res, errorPayload, frontendOrigin);
    }
    return res.status(error.statusCode || 500).json({
      ...errorPayload,
    });
  }
}

async function oauthCallback(req, res) {
  const provider = req.path.includes("microsoft") ? "microsoft" : "google";
  try {
    if (!["google", "microsoft"].includes(provider)) {
      throw Object.assign(new Error("OAuth provider not found."), { statusCode: 404 });
    }
    if (req.query.error) {
      throw Object.assign(new Error(req.query.error_description || `${providerLabel(provider)} login failed.`), { statusCode: 400 });
    }
    if (!req.query.code || !req.query.state) {
      throw Object.assign(new Error("Invalid OAuth callback. Missing authorization code or state."), {
        statusCode: 400,
        code: "OAUTH_INVALID_CALLBACK",
      });
    }
    const state = verifyOAuthState(req.query.state, provider);
    const tokenResponse = await exchangeOAuthCode(provider, req.query.code);
    const oauthProfile = await verifyOAuthToken(provider, tokenResponse.access_token);
    const result = await completeOAuthLoginForProfile(oauthProfile, state.societyCode);
    return sendOAuthPopupResponse(res, result, state.frontendOrigin || getFrontendUrl());
  } catch (error) {
    console.error(`[authController.${provider}Callback]`, {
      message: error.message,
      statusCode: error.statusCode || null,
      providerStatus: error.providerStatus || null,
      providerResponse: error.providerResponse || null,
      queryError: req.query.error || null,
      callbackUrl: getProviderConfig(provider).callbackUrl,
    });
    let frontendOrigin = getFrontendUrl();
    try {
      frontendOrigin = req.query.state ? verifyOAuthState(req.query.state, provider).frontendOrigin || frontendOrigin : frontendOrigin;
    } catch {
      // Keep the configured frontend fallback when state itself is invalid.
    }
    return sendOAuthPopupResponse(res, buildOAuthErrorPayload(provider, error), frontendOrigin);
  }
}

async function completeOAuthProfile(req, res) {
  try {
    await userModel.ensureOAuthColumns();
    const {
      completionToken,
      name,
      phone,
      mobile,
      societyCode,
      role,
      wing,
      flatNumber,
      department,
      designation,
      idProofUrl,
    } = req.body;

    let profile = null;
    try {
      profile = jwt.verify(completionToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "OAuth session expired. Please sign in again." });
    }
    if (profile?.purpose !== "oauth_profile_completion") {
      return res.status(401).json({ success: false, message: "OAuth session expired. Please sign in again." });
    }

    const VALID_ROLES = ["secretary", "owner", "tenant", "staff", "security"];
    const requestedRole = String(role || "").trim().toLowerCase();
    if (!VALID_ROLES.includes(requestedRole)) {
      return res.status(400).json({ success: false, message: "Access denied." });
    }

    const society = await societyModel.getSocietyByCode(societyCode);
    if (!society) {
      return res.status(400).json({ success: false, message: "Society code not found." });
    }
    if (society.status !== "active") {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    const existingInSociety = await userModel.getUserByEmail(profile.email, society.id);
    if (existingInSociety) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }
    const existingAny = await userModel.findUsersByEmail(profile.email);
    if (existingAny.some((item) => item.auth_provider && item.auth_provider !== profile.provider)) {
      return res.status(409).json({ success: false, message: "Email already registered with another provider." });
    }

    const isResidentRole = ["owner", "tenant"].includes(requestedRole);
    const isOfficerRole = requestedRole === "secretary";
    const normalizedRole = requestedRole;
    let residentType = null;
    let matchedFlat = null;
    let normalizedFlatNumber = null;

    if (isResidentRole) {
      if (!wing || !flatNumber) {
        return res.status(400).json({ success: false, message: "Flat details are required." });
      }
      normalizedFlatNumber = String(flatNumber).trim();
      matchedFlat = await flatModel.getFlatByWingAndFlatNumber({
        societyId: society.id,
        wing: String(wing).trim().toUpperCase(),
        flatNumber: normalizedFlatNumber,
      });
      if (!matchedFlat) {
        return res.status(400).json({ success: false, message: "Flat details are invalid." });
      }
      residentType = requestedRole;
    }

    const userRole = isResidentRole ? "resident" : normalizedRole;
    const user = await userModel.createUser({
      name: name || profile.name,
      email: profile.email,
      password: await createOAuthPasswordHash(),
      role: userRole,
      residentType,
      status: "pending",
      isVerified: true,
      emailVerified: true,
      societyId: society.id,
      flatId: matchedFlat?.id || null,
      flatNumber: normalizedFlatNumber,
      phone: phone || mobile || null,
      authProvider: profile.provider,
      providerId: profile.providerId,
      profilePhoto: profile.profilePhoto || null,
      department,
      designation,
    });

    await UserApprovalModel.createApprovalRequest({
      userId: user.id,
      societyId: society.id,
      approvalType: "registration",
      requestedBy: null,
      documents: idProofUrl ? { idProofUrl } : null,
    }).catch(() => null);

    if (residentType === "owner") {
      await userModel.syncOwnerPropertyMapping(user.id, matchedFlat?.id || null).catch(() => null);
    }

    return res.status(201).json({
      success: true,
      message: "Your account is pending society approval.",
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        society_code: society.code,
      },
    });
  } catch (error) {
    console.error("[authController.completeOAuthProfile]", error);
    return res.status(500).json({ success: false, message: "Registration failed." });
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

    const authTokens = buildAuthTokenPayload(user);
    console.log("[loginSuperAdmin] JWT generated", {
      email,
      tokenLength: authTokens.accessToken ? authTokens.accessToken.length : 0,
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    });

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name || user.full_name || null,
      role: user.role,
      resident_type: user.resident_type || null,
      status: user.status || null,
    };

    res.json({
      success: true,
      message: "Super admin login successful",
      ...authTokens,
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
    console.log("[FORGOT PASSWORD REQUEST]", req.body);
    const { email, societyCode } = req.body;

    if (!email || !societyCode) {
      return res.status(400).json({
        success: false,
        message: "email and societyCode are required",
      });
    }

    const society = await societyModel.getSocietyByCode(societyCode);
    if (!society) {
      return res.status(400).json({
        success: false,
        message: "Invalid society code",
      });
    }

    const user = await userModel.getUserByEmail(email, society.id);
    if (user) {
      await issueAndSendOtp({
        userId: user.id,
        email: user.email,
        purpose: "password_reset",
      });
    }

    console.log("[FORGOT PASSWORD SUCCESS]", email);
    res.json({
      success: true,
      message: "If this email is registered, a password reset OTP has been sent",
    });
  } catch (error) {
    console.error("[FORGOT PASSWORD ERROR]", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, otp, newPassword, societyCode } = req.body;

    if (!email || !otp || !newPassword || !societyCode) {
      return res.status(400).json({
        success: false,
        message: "email, otp, newPassword and societyCode are required",
      });
    }

    const society = await societyModel.getSocietyByCode(societyCode);
    if (!society) {
      return res.status(400).json({
        success: false,
        message: "Invalid society code",
      });
    }

    const user = await userModel.getUserByEmail(email, society.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const activeOtp = await otpModel.getLatestActiveOtp(email, "password_reset", user.id);
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
    await userModel.updatePasswordById(user.id, hashedPassword);
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
    console.log("[authController.getProfile] auth/me request", {
      activeDatabaseHost: db.getDatabaseHost(),
      userId: req.user.id,
      userExists: Boolean(user),
    });

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
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const incomingRefreshToken = req.body?.refreshToken || req.body?.refresh_token || bearerToken;

    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, process.env.JWT_SECRET);
    } catch (error) {
      console.warn("[authController.refreshToken] invalid refresh token", {
        message: error.message,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    if (decoded.token_type !== "refresh") {
      console.warn("[authController.refreshToken] non-refresh token rejected", {
        userId: decoded.id || decoded.userId || null,
        tokenType: decoded.token_type || null,
      });
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const userId = decoded.id || decoded.userId;

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

    let society = null;
    if (user.society_id) {
      society = await societyModel.getSocietyById(user.society_id).catch(() => null);
    }

    // Issue a new token pair
    const authTokens = buildAuthTokenPayload({
      ...user,
      society_code: society?.code || user.society_code || null,
      society_name: society?.name || user.society_name || null,
    });

    const userPayload = {
      id: user.id,
      userId: user.id,
      name: user.name,
      userName: user.name,
      email: user.email,
      role: user.role,
      resident_type: user.resident_type || null,
      status: user.status || null,
      society_id: user.society_id || null,
      societyId: user.society_id || null,
      society_code: society?.code || user.society_code || null,
      societyCode: society?.code || user.society_code || null,
      society_name: society?.name || user.society_name || null,
      societyName: society?.name || user.society_name || null,
      flat_id: user.flat_id || null,
      flat_number: user.flat_number || null,
    };

    res.json({
      success: true,
      message: "Token refreshed",
      ...authTokens,
      user: userPayload,
    });
  } catch (error) {
    console.error("[authController.refreshToken]", error);
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
  validateChairmanSociety,
  registerChairman,
  verifyChairmanRegistrationOtp,
  resendChairmanRegistrationOtp,
  verifyEmailOtp,
  resendVerificationOtp,
  login,
  oauthConfig,
  startOAuth,
  oauthCallback,
  oauthLogin,
  completeOAuthProfile,
  loginSuperAdmin,
  forgotPassword,
  resetPassword,
  getProfile,
  refreshToken,
  adminOnly,
  staffOrAdmin,
  logout,
};
