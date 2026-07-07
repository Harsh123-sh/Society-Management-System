import axios from "axios";
import {
  clearAuthSession,
  clearSuperAdminSession,
  getCurrentUserFromToken,
  getStoredRole,
  getStoredSuperAdminToken,
  getStoredUser,
  saveAuthSession,
} from "../utils/session";
import { getApiBaseUrl } from "./runtimeUrls";
import { API_BASE_URL } from "../config/api";

const API_URL = getApiBaseUrl();

// Track if refresh is in progress to avoid multiple refreshes
let isRefreshing = false;
let refreshSubscribers = [];

const SOCIETY_ACCESS_MESSAGE = "Society access not found. Please login again.";

function getStoredAccessToken() {
  return localStorage.getItem("accessToken") || localStorage.getItem("token");
}

function getStoredRefreshToken() {
  return localStorage.getItem("refreshToken");
}

function logAuthFailure(context, error) {
  if (!import.meta.env.DEV) return;

  console.warn(`[AuthAPI] ${context}`, {
    status: error?.response?.status || null,
    message: error?.response?.data?.message || error?.message || null,
    url: error?.config?.url || null,
  });
}

function redirectToLogin(message) {
  if (message) {
    sessionStorage.setItem("loginErrorMessage", message);
  }
  window.location.href = "/login";
}

// Create main API instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const superAdminApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const SUPER_ADMIN_PUBLIC_PATHS = [
  "/super-admin/login",
  "/super-admin/forgot-password",
  "/super-admin/verify-otp",
  "/super-admin/reset-password",
];

// Add token to request headers
api.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  const user = getStoredUser();
  const role = getStoredRole();
  const isStaff = role === "staff";
  const societyId = isStaff
    ? user?.societyId || user?.society_id || null
    : localStorage.getItem("societyId") || localStorage.getItem("selectedSocietyId");
  const societyName = isStaff
    ? user?.societyName || user?.society_name || null
    : localStorage.getItem("societyName") || localStorage.getItem("selectedSocietyName");
  const societyCode = isStaff
    ? user?.societyCode || user?.society_code || null
    : localStorage.getItem("societyCode") || user?.societyCode || user?.society_code || null;
  const userName = user?.name || user?.userName || localStorage.getItem("userName");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (societyId) {
    config.headers["x-society-id"] = societyId;
  }
  if (societyName) {
    config.headers["x-society-name"] = societyName;
  }
  if (societyCode) {
    config.headers["x-society-code"] = societyCode;
  }
  if (role) {
    config.headers["x-user-role"] = role;
  }
  if (userName) {
    config.headers["x-user-name"] = userName;
  }

  console.log("[API] request", {
    url: `${API_BASE_URL}${String(config.url || "")}`,
    hasToken: Boolean(token),
    role,
    societyId,
  });

  return config;
});

// Handle token refresh and response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    // If 401 and refresh token exists, try to refresh the access token.
    if (status === 401 && getStoredRefreshToken() && originalRequest && !originalRequest._retry && !String(originalRequest.url || "").includes("/auth/refresh-token")) {
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;

        try {
          const refreshToken = getStoredRefreshToken();
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken }, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${refreshToken}`,
            },
          });
          const newToken = data.accessToken || data.access_token || data.token;
          const newRefreshToken = data.refreshToken || data.refresh_token || refreshToken;
          const { user } = data;

          if (!newToken) {
            throw new Error("Refresh response did not include an access token");
          }

          // Save new token
          saveAuthSession({ accessToken: newToken, refreshToken: newRefreshToken, user });

          // Retry original request with new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Notify all queued requests
          refreshSubscribers.forEach(({ resolve }) => resolve(newToken));
          refreshSubscribers = [];
          isRefreshing = false;

          return api(originalRequest);
        } catch (refreshError) {
          logAuthFailure("token refresh failed", refreshError);
          // Refresh failed - clear session and redirect to login
          isRefreshing = false;
          refreshSubscribers.forEach(({ reject }) => reject(refreshError));
          refreshSubscribers = [];
          const message = refreshError?.response?.data?.message;
          clearAuthSession();
          redirectToLogin(message === SOCIETY_ACCESS_MESSAGE ? SOCIETY_ACCESS_MESSAGE : null);
          return Promise.reject(refreshError);
        }
      } else {
        // Queue request while refresh is in progress
        return new Promise((resolve, reject) => {
          refreshSubscribers.push({
            resolve: (token) => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }
    }

    // Clear session on other auth errors
    if (status === 401 && getStoredAccessToken()) {
      logAuthFailure("protected request unauthorized", error);
      const message = error?.response?.data?.message;
      clearAuthSession();
      redirectToLogin(message === SOCIETY_ACCESS_MESSAGE ? SOCIETY_ACCESS_MESSAGE : null);
    }

    return Promise.reject(error);
  }
);

superAdminApi.interceptors.request.use((config) => {
  const token = getStoredSuperAdminToken();
  const requestPath = String(config.url || "");

  if (!config.headers) {
    config.headers = {};
  }

  if (!token && !SUPER_ADMIN_PUBLIC_PATHS.some((path) => requestPath.includes(path))) {
    clearSuperAdminSession();
    window.location.href = "/super-admin/login";
    return Promise.reject(new Error("Missing super admin token"));
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("[SuperAdminSocietyAPI] request", {
    url: `${API_BASE_URL}${requestPath}`,
    hasToken: Boolean(token),
  });

  return config;
});

superAdminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if ((status === 401 || status === 403) && getStoredSuperAdminToken()) {
      clearSuperAdminSession();
      window.location.href = "/super-admin/login";
    }

    return Promise.reject(error);
  }
);

export function getApiMessage(error, fallback) {
  const validationErrors = error?.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length) {
    return validationErrors.map((item) => item.message).join(". ");
  }

  if (!error?.response) {
    return `Cannot reach server. Check backend is running on ${API_BASE_URL} and CORS allows this frontend origin.`;
  }

  return error?.response?.data?.message || fallback;
}

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function validateChairmanSociety(societyCode) {
  const { data } = await api.get("/auth/chairman/validate-society", { params: { societyCode } });
  return data;
}

export async function registerChairman(payload) {
  const { data } = await api.post("/auth/register-chairman", payload);
  return data;
}

export async function verifyChairmanOtp(payload) {
  const { data } = await api.post("/auth/chairman/verify-otp", payload);
  return data;
}

export async function resendChairmanOtp(payload) {
  const { data } = await api.post("/auth/chairman/resend-otp", payload);
  return data;
}

export async function fetchSocietyByCode(societyCode) {
  const { data } = await api.get("/public/society", { params: { code: societyCode } });
  return data;
}

export async function fetchWingsBySocietyCode(societyCode) {
  const { data } = await api.get("/public/wings", { params: { societyCode } });
  return data;
}

export async function fetchAvailableFlats({ societyCode, wing }) {
  const { data } = await api.get("/public/flats", {
    params: { societyCode, wing, availableOnly: true },
  });
  return data;
}

export async function verifyEmailOtp(payload) {
  const { data } = await api.post("/auth/verify-email-otp", payload);
  return data;
}

export async function resendVerificationOtp(payload) {
  const { data } = await api.post("/auth/resend-verification-otp", payload);
  return data;
}

export async function loginUser(payload) {
  console.log("[LoginAPI] login request", {
    apiUrl: `${API_BASE_URL}/auth/login`,
    societyCode: payload?.societyCode,
    email: payload?.email,
  });
  const { data } = await api.post("/auth/login", payload);
  console.log("[LoginAPI] login response", data);
  return data;
}

export async function oauthLogin(payload) {
  const { data } = await api.post("/auth/oauth/login", payload);
  return data;
}

export async function fetchOAuthConfig() {
  const { data } = await api.get("/auth/oauth/config");
  return data;
}

export async function completeOAuthProfile(payload) {
  const { data } = await api.post("/auth/oauth/complete-profile", payload);
  return data;
}

export async function loginSuperAdmin(payload) {
  const { email = "", password = "" } = payload || {};
  const { data } = await superAdminApi.post("/super-admin/login", { email, password });
  return data;
}

export async function forgotSuperAdminPassword(payload) {
  const { data } = await superAdminApi.post("/super-admin/forgot-password", payload);
  return data;
}

export async function verifySuperAdminOtp(payload) {
  const { data } = await superAdminApi.post("/super-admin/verify-otp", payload);
  return data;
}

export async function resetSuperAdminPassword(payload) {
  const { data } = await superAdminApi.post("/super-admin/reset-password", payload);
  return data;
}

export async function fetchSuperAdminDashboard() {
  const { data } = await superAdminApi.get("/super-admin/platform-stats");
  return data;
}

export async function fetchSuperAdminPlatformStats() {
  const { data } = await superAdminApi.get("/super-admin/platform-stats");
  return data;
}

export async function fetchSuperAdminSocieties(params = {}) {
  const apiUrl = `${API_BASE_URL}/super-admin/societies`;
  console.log("[SuperAdminSocietyAPI] list URL:", apiUrl);
  const { data } = await superAdminApi.get("/super-admin/societies", { params });
  console.log("[SuperAdminSocietyAPI] list response:", data);
  return data;
}

export async function fetchSuperAdminSocietyDetails(societyId) {
  const apiUrl = `${API_BASE_URL}/super-admin/societies/${societyId}/details`;
  console.log("[SuperAdminSocietyAPI] detail URL:", apiUrl);
  const { data } = await superAdminApi.get(`/super-admin/societies/${societyId}/details`);
  console.log("[SuperAdminSocietyAPI] detail response:", data);
  return data;
}

export async function createSuperAdminSociety(payload) {
  const apiUrl = `${API_BASE_URL}/super-admin/societies`;
  console.log("[SuperAdminSocietyAPI] create URL:", apiUrl);
  const { data } = await superAdminApi.post("/super-admin/societies", payload);
  console.log("[SuperAdminSocietyAPI] create response:", data);
  return data;
}

export async function updateSuperAdminSociety(societyId, payload) {
  const { data } = await superAdminApi.put(`/super-admin/societies/${societyId}`, payload);
  return data;
}

export async function changeSuperAdminSocietyCode(societyId, payload) {
  const { data } = await superAdminApi.patch(`/super-admin/societies/${societyId}/code`, payload);
  return data;
}

export async function suspendSuperAdminSociety(societyId) {
  const { data } = await superAdminApi.patch(`/super-admin/societies/${societyId}/suspend`, {});
  return data;
}

export async function archiveSuperAdminSociety(societyId) {
  const { data } = await superAdminApi.delete(`/super-admin/societies/${societyId}`);
  return data;
}

export async function fetchSuperAdminSocietyAnalytics(societyId) {
  const { data } = await superAdminApi.get(`/super-admin/societies/${societyId}/analytics`);
  return data;
}

export async function fetchSuperAdminPendingApprovals(params = {}) {
  const { data } = await superAdminApi.get("/super-admin/pending-approvals", { params });
  return data;
}

export async function approveSuperAdminPendingUser(approvalId, payload = {}) {
  const { data } = await superAdminApi.post(`/super-admin/pending-approvals/${approvalId}/approve`, payload);
  return data;
}

export async function rejectSuperAdminPendingUser(approvalId, payload = {}) {
  const { data } = await superAdminApi.post(`/super-admin/pending-approvals/${approvalId}/reject`, payload);
  return data;
}

export async function fetchSuperAdminActivityLogs(params = {}) {
  const { data } = await superAdminApi.get("/super-admin/activity-logs", { params });
  return data;
}

export async function fetchSuperAdminSubscriptions() {
  const { data } = await superAdminApi.get("/super-admin/subscriptions");
  return data;
}

export async function fetchSuperAdminAnalytics() {
  const { data } = await superAdminApi.get("/super-admin/analytics");
  return data;
}

export async function forgotPassword(payload) {
  const { data } = await api.post("/auth/forgot-password", payload);
  return data;
}

export async function resetPassword(payload) {
  const { data } = await api.post("/auth/reset-password", payload);
  return data;
}

export async function refreshToken() {
  const storedRefreshToken = getStoredRefreshToken();
  const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken: storedRefreshToken }, {
    headers: {
      "Content-Type": "application/json",
      ...(storedRefreshToken ? { Authorization: `Bearer ${storedRefreshToken}` } : {}),
    },
  });
  return data;
}

export async function logoutUser() {
  const { data } = await api.post("/auth/logout", {});
  return data;
}

export async function fetchPublicSocieties() {
  console.log("[PublicSocietyAPI] list URL:", `${API_BASE_URL}/public/societies`);
  const { data } = await api.get("/public/societies", {
    params: {
      time: Date.now(),
    },
  });
  console.log("[PublicSocietyAPI] list response:", data);
  return data;
}

export async function fetchSocietyLivePreview(societyId) {
  const { data } = await api.get(`/public/societies/${societyId}/live-preview`);
  return data;
}

export async function fetchSocietyLandingStats(societyId) {
  const { data } = await api.get(`/public/societies/${societyId}/landing-stats`);
  return data;
}

export async function fetchStaffDashboard() {
  const { data } = await api.get("/dashboards/staff");
  return data;
}

export async function fetchStaffAttendance(params = {}) {
  const { data } = await api.get("/staff/attendance", { params });
  return data;
}

export async function staffAttendanceCheckIn(payload = {}) {
  const { data } = await api.post("/staff/attendance/check-in", payload);
  return data;
}

export async function staffAttendanceCheckOut(payload = {}) {
  const { data } = await api.post("/staff/attendance/check-out", payload);
  return data;
}

export async function submitStaffAttendanceRequest(payload = {}) {
  const { data } = await api.post("/staff/attendance/requests", payload);
  return data;
}

export async function markStaffSpecialAttendance(payload = {}) {
  const { data } = await api.post("/staff/attendance/mark-special", payload);
  return data;
}

export { api, getCurrentUserFromToken };
