import { api } from "./authApi";

export async function suggestComplaintText(prompt) {
  const { data } = await api.post("/ai/complaint-suggestion", { prompt });
  return data;
}

export async function generateNoticeDraft({ topic, detail, audience }) {
  const { data } = await api.post("/ai/notice-generator", { topic, detail, audience });
  return data;
}

export async function askSocietyAssistant(prompt) {
  const { data } = await api.post("/ai/assistant", { prompt });
  return data;
}

export async function queryAssistant(payload) {
  const { data } = await api.post("/ai/assistant/query", payload);
  return data;
}

export async function executeAiAction(payload) {
  const { data } = await api.post("/ai/assistant/action", payload);
  return data;
}

export async function summarizeAiReport(payload) {
  const { data } = await api.post("/ai/reports/summarize", payload);
  return data;
}

export async function translateAiMessage(payload) {
  const { data } = await api.post("/ai/translate", payload);
  return data;
}

export async function predictAiMaintenance(payload = {}) {
  const { data } = await api.post("/ai/maintenance/predict", payload);
  return data;
}

export async function fetchAiRecommendations(payload) {
  const { data } = await api.post("/ai/recommendations", payload);
  return data;
}

export async function fetchAiAnalyticsInsights() {
  const { data } = await api.get("/ai/analytics/insights");
  return data;
}

export async function fetchAiDashboardWidgets() {
  const { data } = await api.get("/ai/dashboard/widgets");
  return data;
}

export async function aiSearchKnowledge(query) {
  const { data } = await api.get("/ai/search", {
    params: {
      q: query,
    },
  });
  return data;
}

export async function aiOCR(payload) {
  const { data } = await api.post("/ai/ocr", payload);
  return data;
}

export async function aiSpeechToText(payload) {
  const { data } = await api.post("/ai/speech-to-text", payload);
  return data;
}

export async function aiTextToSpeech(payload) {
  const { data } = await api.post("/ai/text-to-speech", payload);
  return data;
}