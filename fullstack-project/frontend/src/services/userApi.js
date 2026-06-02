import { api } from "./authApi";

export async function fetchUsers(params = {}) {
  const { data } = await api.get("/users", { params });
  return data;
}

export async function fetchUsersByCategory(category, params = {}) {
  const { data } = await api.get(`/users/category/${category}`, { params });
  return data;
}

export async function updateUserRole(userId, role) {
  const { data } = await api.patch(`/users/${userId}/role`, { role });
  return data;
}

export async function updateUser(userId, payload) {
  const { data } = await api.patch(`/users/${userId}`, payload);
  return data;
}

export async function updateUserStatus(userId, status) {
  const { data } = await api.patch(`/users/${userId}/status`, { status });
  return data;
}

export async function deleteUser(userId, reason) {
  const { data } = await api.delete(`/users/${userId}`, {
    data: { reason },
  });
  return data;
}

export async function fetchTrashUsers(params = {}) {
  const { data } = await api.get("/users/trash", { params });
  return data;
}

export async function restoreUser(userId) {
  const { data } = await api.patch(`/users/${userId}/restore`);
  return data;
}

export async function permanentlyDeleteUser(userId) {
  const { data } = await api.delete(`/users/${userId}/permanent`);
  return data;
}
