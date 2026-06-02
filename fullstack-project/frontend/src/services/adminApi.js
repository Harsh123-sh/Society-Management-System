import { api } from "./authApi";

export async function fetchOverviewKpis() {
  const { data } = await api.get("/admin/overview");
  return data;
}

export async function fetchAiRecommendations() {
  const { data } = await api.get("/admin/ai-recommendations");
  return data;
}

export async function acknowledgeAlert(alertId) {
  const { data } = await api.post(`/admin/alerts/${alertId}/acknowledge`);
  return data;
}
