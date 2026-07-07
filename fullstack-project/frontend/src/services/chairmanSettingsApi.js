import { api } from "./authApi";

export async function fetchChairmanSettings() {
  const { data } = await api.get("/chairman/settings");
  return data;
}

export async function updateChairmanProfile(payload) {
  const { data } = await api.patch("/chairman/settings/profile", payload);
  return data;
}

export async function updateSocietyProfile(payload) {
  const { data } = await api.patch("/chairman/settings/society", payload);
  return data;
}

export async function updateNotificationSettings(payload) {
  const { data } = await api.patch("/chairman/settings/notifications", payload);
  return data;
}

export async function updateAppearanceSettings(payload) {
  const { data } = await api.patch("/chairman/settings/appearance", payload);
  return data;
}

export async function uploadProfileImage(file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/chairman/settings/upload/profile-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function uploadSocietyLogo(file) {
  const formData = new FormData();
  formData.append("image", file);
  const { data } = await api.post("/chairman/settings/upload/society-logo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
