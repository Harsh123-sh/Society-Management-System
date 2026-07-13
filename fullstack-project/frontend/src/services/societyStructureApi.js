import { api } from "./authApi";

export async function fetchSocietyStructure(societyId) {
  const url = societyId ? `/societies/${societyId}/structure` : "/structure/tree";
  const { data } = await api.get(url);
  return data;
}

export async function createTower(payload) {
  const { data } = await api.post("/towers", payload);
  return data;
}

export async function updateTower(id, payload) {
  const { data } = await api.put(`/towers/${id}`, payload);
  return data;
}

export async function deleteTower(id, params = {}) {
  const { data } = await api.delete(`/towers/${id}`, { params });
  return data;
}

export async function createWing(payload) {
  const { data } = await api.post("/wings", payload);
  return data;
}

export async function fetchWings(towerId, params = {}) {
  const url = towerId ? `/towers/${towerId}/wings` : "/wings";
  const { data } = await api.get(url, { params });
  return data;
}

export async function updateWing(id, payload) {
  const { data } = await api.put(`/wings/${id}`, payload);
  return data;
}

export async function deleteWing(id, params = {}) {
  const { data } = await api.delete(`/wings/${id}`, { params });
  return data;
}

export async function createFloor(payload) {
  const { data } = await api.post("/floors", payload);
  return data;
}

export async function updateFloor(id, payload) {
  const { data } = await api.put(`/floors/${id}`, payload);
  return data;
}

export async function deleteFloor(id, params = {}) {
  const { data } = await api.delete(`/floors/${id}`, { params });
  return data;
}

export async function fetchFloors(wingId, params = {}) {
  const url = wingId ? `/wings/${wingId}/floors` : "/floors";
  const { data } = await api.get(url, { params });
  return data;
}

export async function createStructureFlat(payload) {
  const { data } = await api.post("/flats", payload);
  return data;
}

export async function updateStructureFlat(id, payload) {
  const { data } = await api.put(`/structure/flats/${id}`, payload);
  return data;
}

export async function deleteStructureFlat(id, params = {}) {
  const { data } = await api.delete(`/structure/flats/${id}`, { params });
  return data;
}

export async function fetchStructureFlats(params = {}) {
  const { data } = await api.get("/flats", { params });
  return data;
}

export async function generateFlats(payload) {
  const { data } = await api.post("/flats/generate", payload);
  return data;
}

export async function createGate(payload) {
  const { data } = await api.post("/gates", payload);
  return data;
}

export async function publishSocietyStructure(societyId, payload) {
  const { data } = await api.post(`/societies/${societyId}/structure`, payload);
  return data;
}

export async function updateGate(id, payload) {
  const { data } = await api.put(`/gates/${id}`, payload);
  return data;
}

export async function deleteGate(id, params = {}) {
  const { data } = await api.delete(`/gates/${id}`, { params });
  return data;
}

export async function fetchGates(params = {}) {
  const { data } = await api.get("/gates", { params });
  return data;
}

export async function fetchResidentSocietyStructure(societyCode) {
  const { data } = await api.get(`/resident/society-structure/${societyCode}`);
  return data;
}

export async function submitResidenceRequest(payload) {
  const { data } = await api.post("/resident/residence-request", payload);
  return data;
}

export async function fetchResidenceProfileStatus() {
  const { data } = await api.get("/resident/profile-status");
  return data;
}

export async function fetchChairmanResidenceRequests() {
  const { data } = await api.get("/chairman/residence-requests");
  return data;
}

export async function approveResidenceRequest(id) {
  const { data } = await api.post(`/chairman/residence-requests/${id}/approve`);
  return data;
}

export async function rejectResidenceRequest(id, reason) {
  const { data } = await api.post(`/chairman/residence-requests/${id}/reject`, { reason });
  return data;
}
