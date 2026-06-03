import axios from "axios";
import {
  clearAuthSession,
  clearSuperAdminSession,
  getCurrentUserFromToken,
  getStoredSuperAdminToken,
  saveAuthSession,
} from "../utils/session";
import { getApiBaseUrl } from "./runtimeUrls";
import { API_BASE_URL } from "../config/api";

const API_URL = getApiBaseUrl();

// Track if refresh is in progress to avoid multiple refreshes
let isRefreshing = false;
let refreshSubscribers = [];

// Create main API instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const superAdminApi = axios.create({
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
  const token = localStorage.getItem("token");
  const societyId = localStorage.getItem("societyId") || localStorage.getItem("selectedSocietyId");
  const societyName = localStorage.getItem("societyName") || localStorage.getItem("selectedSocietyName");
  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("userName");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (societyId) {
    config.headers["x-society-id"] = societyId;
  }
  if (societyName) {
    config.headers["x-society-name"] = societyName;
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

    // If 401 and token exists, try to refresh
    if (status === 401 && localStorage.getItem("token") && !originalRequest._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;

        try {
          // Attempt token refresh
          const { data } = await api.post("/auth/refresh-token", {});
          const { token: newToken, user } = data;

          // Save new token
          saveAuthSession({ token: newToken, user });

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Notify all queued requests
          refreshSubscribers.forEach(({ resolve }) => resolve(newToken));
          refreshSubscribers = [];
          isRefreshing = false;

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - clear session and redirect to login
          isRefreshing = false;
          refreshSubscribers.forEach(({ reject }) => reject(refreshError));
          refreshSubscribers = [];
          clearAuthSession();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // Queue request while refresh is in progress
        return new Promise((resolve, reject) => {
          refreshSubscribers.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }
    }

    // Clear session on other auth errors
    if (status === 401 && localStorage.getItem("token")) {
      clearAuthSession();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

superAdminApi.interceptors.request.use((config) => {
  const token = getStoredSuperAdminToken();
  const requestPath = String(config.url || "");

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

function getApiMessage(error, fallback) {
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

export async function loginSuperAdmin(payload) {
  const { data } = await superAdminApi.post("/super-admin/login", payload);
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
  const { data } = await api.post("/auth/refresh-token", {});
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

export { api, getApiMessage, getCurrentUserFromToken, superAdminApi };
