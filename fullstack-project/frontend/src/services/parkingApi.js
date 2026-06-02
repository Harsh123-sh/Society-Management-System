import { api } from "./authApi";

export async function getParkingSlots(params = {}) {
  const { data } = await api.get("/parking", { params });
  return data;
}

export async function getParkingSlot(id) {
  const { data } = await api.get(`/parking/${id}`);
  return data;
}

export async function getParkingStats() {
  const { data } = await api.get("/parking/stats");
  return data;
}

export async function createParkingSlot(payload) {
  const { data } = await api.post("/parking", payload);
  return data;
}

export async function updateParkingSlot(id, payload) {
  const { data } = await api.patch(`/parking/${id}`, payload);
  return data;
}

export async function assignParkingSlot(id, userId, flatId) {
  const { data } = await api.post(`/parking/${id}/assign`, {
    user_id: userId,
    flat_id: flatId,
  });
  return data;
}

export async function releaseParkingSlot(id) {
  const { data } = await api.post(`/parking/${id}/release`);
  return data;
}

export async function deleteParkingSlot(id) {
  const { data } = await api.delete(`/parking/${id}`);
  return data;
}