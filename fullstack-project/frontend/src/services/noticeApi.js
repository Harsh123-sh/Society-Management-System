import { api } from "./authApi";

export async function fetchNotices() {
  const { data } = await api.get("/notices");
  return data;
}

export async function createNotice(payload) {
  const { data } = await api.post("/notices", payload);
  return data;
}
