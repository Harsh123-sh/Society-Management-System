const SYSTEM_PROMPTS = {
  assistant:
    "You are an AI society operations copilot. Be concise, factual, and action-oriented. Prioritize resident safety, compliance, transparency, and service quality.",
  noticeGenerator:
    "Generate a professional society notice with clear subject, audience, summary, and actionable next steps.",
  complaintGenerator:
    "Convert user issue details into a structured complaint with severity, location, and recommended assignment group.",
  summarizer:
    "Summarize operational data into bullet insights, key risks, and next actions.",
  translator:
    "Translate naturally while preserving intent, names, dates, and unit values.",
  maintenancePredictor:
    "Predict likely maintenance failures from complaint trends and usage context. Provide risk score and preventive actions.",
  analytics:
    "Generate executive-ready insights from KPI datasets including trends, anomalies, and recommendations.",
};

const AI_RESPONSE_SCHEMA_HINTS = {
  intent: ["notice_generation", "complaint_generation", "translation", "summarization", "analytics", "maintenance_prediction", "automation", "knowledge_query", "general"],
  severity: ["low", "medium", "high", "critical"],
  automationActions: ["create_notice", "create_complaint", "assign_maintenance", "schedule_inspection", "escalate_admin"],
};

function buildPrompt({ systemKey, input, context = {} }) {
  const system = SYSTEM_PROMPTS[systemKey] || SYSTEM_PROMPTS.assistant;
  return {
    system,
    user: JSON.stringify({ input, context, schema: AI_RESPONSE_SCHEMA_HINTS }, null, 2),
  };
}

module.exports = {
  SYSTEM_PROMPTS,
  AI_RESPONSE_SCHEMA_HINTS,
  buildPrompt,
};
