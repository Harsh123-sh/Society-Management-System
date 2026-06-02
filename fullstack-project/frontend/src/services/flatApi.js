import { api } from "./authApi";

export async function fetchFlats(params = {}) {
  const { data } = await api.get("/flats", { params });
  return data;
}

export async function fetchOccupancyHistory() {
  const { data } = await api.get("/flats/history");
  return data;
}

export async function fetchMyFlats() {
  const { data } = await api.get("/flats/my");
  return data;
}

export async function fetchMyPropertySummary() {
  const { data } = await api.get("/flats/my/property");
  return data;
}

export async function addFlat(payload) {
  const { data } = await api.post("/flats", payload);
  return data;
}

export async function createFlatsBulk(payload) {
  const { data } = await api.post("/flats/bulk", payload);
  return data;
}

export async function assignResident(flatId, payload) {
  const { data } = await api.post(`/flats/${flatId}/assign`, payload);
  return data;
}

export async function unassignResident(flatId) {
  const { data } = await api.patch(`/flats/${flatId}/unassign`);
  return data;
}

export async function approveFlat(flatId) {
  const { data } = await api.patch(`/flats/${flatId}/approve`);
  return data;
}

export async function updateFlat(flatId, payload) {
  const { data } = await api.patch(`/flats/${flatId}`, payload);
  return data;
}

export async function archiveFlat(flatId) {
  const { data } = await api.post(`/flats/${flatId}/archive`);
  return data;
}

export async function deleteFlat(flatId) {
  const { data } = await api.delete(`/flats/${flatId}`);
  return data;
}

export async function fetchResidents() {
  const { data } = await api.get("/users");
  return data;
}
