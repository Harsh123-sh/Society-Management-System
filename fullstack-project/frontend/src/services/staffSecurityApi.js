import { api } from "./authApi";

export async function fetchStaffSecurity(params = {}) {
  const { data } = await api.get("/staff/security", { params });
  return data;
}

export async function fetchAttendanceSummary(params = {}) {
  const { data } = await api.get("/staff/security/attendance/summary", { params });
  return data;
}

export async function fetchMonthlyAttendance(params = {}) {
  const { data } = await api.get("/staff/security/attendance/monthly", { params });
  return data;
}

export async function updateAttendanceCorrection(id, payload) {
  const { data } = await api.patch(`/staff/security/attendance/${id}`, payload);
  return data;
}

export async function reviewStaffAttendanceRequest(id, payload) {
  const { data } = await api.patch(`/staff/attendance/requests/${id}/review`, payload);
  return data;
}
