import { api } from "./authApi";

export async function fetchTowers() {
  const { data } = await api.get("/towers");
  return data;
}

export async function createTower(payload) {
  const { data } = await api.post("/towers", payload);
  return data;
}

export async function generateFlatsForTower(towerId, payload = {}) {
  const { data } = await api.post(`/towers/${towerId}/generate`, payload);
  return data;
}

export async function bulkArchiveFlats(flatIds) {
  const { data } = await api.post("/towers/bulk/archive", { flatIds });
  return data;
}

export async function bulkDeleteFlats(flatIds) {
  const { data } = await api.post("/towers/bulk/delete", { flatIds });
  return data;
}
