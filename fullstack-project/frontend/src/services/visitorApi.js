import { api } from "./authApi";

export async function createVisitorEntry(payload) {
  const { data } = await api.post("/visitors", payload);
  return data;
}

export async function createVisitorEntryWithPhoto(payload) {
  // payload should include photoBase64
  const { data } = await api.post("/visitors", payload);
  return data;
}

export async function fetchVisitorLogs(params = {}) {
  const { data } = await api.get("/visitors", { params });
  return data;
}

export async function markVisitorExit(visitorId) {
  const { data } = await api.patch(`/visitors/${visitorId}/exit`);
  return data;
}

export async function createOwnerPreapproval(payload) {
  const { data } = await api.post("/visitors/owner/preapprovals", payload);
  return data;
}

export async function cancelOwnerPreapproval(preapprovalId) {
  const { data } = await api.patch(`/visitors/owner/preapprovals/${preapprovalId}/cancel`);
  return data;
}

export async function fetchOwnerVisitorHistory() {
  const { data } = await api.get("/visitors/owner/history");
  return data;
}

export async function fetchVisitorDashboard(params = {}) {
  const { data } = await api.get("/visitors/dashboard", { params });
  return data;
}

export async function fetchVisitorAnalytics(params = {}) {
  const { data } = await api.get("/visitors/analytics", { params });
  return data;
}

export async function fetchVisitorHistory(params = {}) {
  const { data } = await api.get("/visitors/history", { params });
  return data;
}

export async function fetchOwnerPreapprovals(params = {}) {
  const { data } = await api.get("/visitors/owner/preapprovals", { params });
  return data;
}

export async function fetchSecurityPreapprovals(params = {}) {
  const { data } = await api.get("/visitors/preapprovals", { params });
  return data;
}

export async function securityUpdatePreapprovalStatus(preapprovalId, status) {
  const { data } = await api.patch(`/visitors/preapprovals/${preapprovalId}/status`, { status });
  return data;
}

export async function securityCheckInPreapproval(preapprovalId, payload = {}) {
  const { data } = await api.post(`/visitors/preapprovals/${preapprovalId}/checkin`, payload);
  return data;
}

export async function verifyPreapprovalQr(token) {
  const { data } = await api.post(`/visitors/preapprovals/verify-qr`, { token });
  return data;
}

export async function approveVisitorPreapproval(preapprovalId) {
  const { data } = await api.patch(`/visitors/owner/preapprovals/${preapprovalId}/approve`);
  return data;
}

export async function rejectVisitorPreapproval(preapprovalId) {
  const { data } = await api.patch(`/visitors/owner/preapprovals/${preapprovalId}/reject`);
  return data;
}

export async function issueVisitorQrPass(preapprovalId, payload = {}) {
  const { data } = await api.post(`/visitors/owner/preapprovals/${preapprovalId}/qr-pass`, payload);
  return data;
}

export async function sendVisitorOtp(preapprovalId) {
  const { data } = await api.post(`/visitors/owner/preapprovals/${preapprovalId}/otp/send`);
  return data;
}

export async function verifyVisitorOtp(preapprovalId, otpCode) {
  const { data } = await api.post(`/visitors/owner/preapprovals/${preapprovalId}/otp/verify`, { otpCode });
  return data;
}

export async function recognizeVisitorFace(payload) {
  const { data } = await api.post("/visitors/faces/recognize", payload);
  return data;
}

export async function addVisitorBlacklistEntry(payload) {
  const { data } = await api.post("/visitors/blacklist", payload);
  return data;
}

export async function fetchVisitorVehicles(params = {}) {
  const { data } = await api.get("/visitors/vehicles", { params });
  return data;
}

export async function createVisitorVehicleEntry(payload) {
  const { data } = await api.post("/visitors/vehicles", payload);
  return data;
}

export async function fetchVisitorDeliveries(params = {}) {
  const { data } = await api.get("/visitors/deliveries", { params });
  return data;
}

export async function createVisitorDeliveryEntry(payload) {
  const { data } = await api.post("/visitors/deliveries", payload);
  return data;
}

export async function fetchVisitorEmergencyAlerts(params = {}) {
  const { data } = await api.get("/visitors/emergency-alerts", { params });
  return data;
}

export async function createVisitorEmergencyAlert(payload) {
  const { data } = await api.post("/visitors/emergency-alerts", payload);
  return data;
}

export async function acknowledgeVisitorEmergencyAlert(alertId) {
  const { data } = await api.patch(`/visitors/emergency-alerts/${alertId}/acknowledge`);
  return data;
}

export async function resolveVisitorEmergencyAlert(alertId) {
  const { data } = await api.patch(`/visitors/emergency-alerts/${alertId}/resolve`);
  return data;
}
