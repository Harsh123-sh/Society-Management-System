import { api } from "./authApi";

export async function fetchArchiveCenter(params = {}) {
  const { data } = await api.get("/archive/center", { params });
  return data;
}

export async function archiveComplaint(id) {
  const { data } = await api.post(`/complaints/${id}/archive`);
  return data;
}

export async function restoreComplaint(id) {
  const { data } = await api.post(`/complaints/${id}/restore`);
  return data;
}

export async function deleteComplaint(id, reason) {
  const { data } = await api.delete(`/complaints/${id}`, { data: { reason } });
  return data;
}

export async function archiveNotice(id) {
  const { data } = await api.post(`/notices/${id}/archive`);
  return data;
}

export async function restoreNotice(id) {
  const { data } = await api.post(`/notices/${id}/restore`);
  return data;
}

export async function deleteNotice(id, reason) {
  const { data } = await api.delete(`/notices/${id}`, { data: { reason } });
  return data;
}

export async function updateRetentionRule(resourceType, payload) {
  const { data } = await api.patch(`/archive/retention/${resourceType}`, payload);
  return data;
}
