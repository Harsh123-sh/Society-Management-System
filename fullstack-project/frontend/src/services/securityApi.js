import { api } from "./authApi";

export async function fetchSecurityDashboard() {
  const { data } = await api.get("/security/dashboard");
  return data;
}

export async function fetchSecurityProfile() {
  const { data } = await api.get("/security/profile");
  return data;
}

export async function securityCheckIn(notes) {
  const { data } = await api.post("/security/attendance/check-in", { notes });
  return data;
}

export async function securityCheckOut(notes) {
  const { data } = await api.post("/security/attendance/check-out", { notes });
  return data;
}

export async function createLeaveRequest(payload) {
  const { data } = await api.post("/security/leave-requests", payload);
  return data;
}

export async function fetchMySecurityShifts(params = {}) {
  const { data } = await api.get("/security/shifts/my", { params });
  return data;
}

export async function fetchMySecurityLeaveRequests() {
  const { data } = await api.get("/security/leave-requests/my");
  return data;
}

export async function createDelivery(payload) {
  const { data } = await api.post("/security/deliveries", payload);
  return data;
}

export async function fetchDeliveries(params = {}) {
  const { data } = await api.get("/security/deliveries", { params });
  return data;
}

export async function updateDeliveryStatus(deliveryId, status) {
  const { data } = await api.patch(`/security/deliveries/${deliveryId}/status`, { status });
  return data;
}

export async function createVisitorRequest(payload) {
  const { data } = await api.post("/security/visitor-requests", payload);
  return data;
}

export async function fetchVisitorRequests(params = {}) {
  const { data } = await api.get("/security/visitor-requests", { params });
  return data;
}

export async function updateVisitorRequestStatus(requestId, status) {
  const { data } = await api.patch(`/security/visitor-requests/${requestId}/status`, {
    status,
  });
  return data;
}

export async function markVisitorRequestCheckIn(requestId) {
  const { data } = await api.patch(`/security/visitor-requests/${requestId}/check-in`);
  return data;
}

export async function markVisitorRequestCheckOut(requestId) {
  const { data } = await api.patch(`/security/visitor-requests/${requestId}/check-out`);
  return data;
}

export async function fetchSecurityNotifications(params = {}) {
  const { data } = await api.get("/security/notifications", { params });
  return data;
}

export async function markSecurityNotificationRead(notificationId) {
  const { data } = await api.patch(`/security/notifications/${notificationId}/read`);
  return data;
}

export async function createEmergencyAlert(payload) {
  const { data } = await api.post("/security/emergency-alerts", payload);
  return data;
}

export async function fetchEmergencyAlerts(params = {}) {
  const { data } = await api.get("/security/emergency-alerts", { params });
  return data;
}

export async function acknowledgeEmergencyAlert(alertId) {
  const { data } = await api.patch(`/security/emergency-alerts/${alertId}/acknowledge`);
  return data;
}

export async function resolveEmergencyAlert(alertId) {
  const { data } = await api.patch(`/security/emergency-alerts/${alertId}/resolve`);
  return data;
}
