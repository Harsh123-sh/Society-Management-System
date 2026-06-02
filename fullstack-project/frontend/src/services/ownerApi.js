import { api } from "./authApi";

export async function fetchOwners(params = {}) {
  const { data } = await api.get("/owners", { params });
  return data;
}

export async function fetchOwnerProperties(ownerId) {
  const { data } = await api.get(`/owners/${ownerId}/properties`);
  return data;
}

export async function assignOwnerProperty(ownerId, payload) {
  const { data } = await api.post(`/owners/${ownerId}/properties`, payload);
  return data;
}

export async function removeOwnerProperty(ownerId, propertyId) {
  const { data } = await api.delete(`/owners/${ownerId}/properties/${propertyId}`);
  return data;
}
