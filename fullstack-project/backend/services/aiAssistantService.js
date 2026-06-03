const db = require("../config/db");
const analyticsModel = require("../models/analyticsModel");
const complaintModel = require("../models/complaintModel");
const noticeModel = require("../models/noticeModel");
const { buildPrompt } = require("../config/aiPrompts");

const OPENAI_API_BASE = process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_CHAT_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 20000);

function hasOpenAi() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function stripMarkdownFence(text = "") {
  return String(text)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function tryParseJson(text, fallback = null) {
  try {
    return JSON.parse(stripMarkdownFence(text));
  } catch (_error) {
    return fallback;
  }
}

function normalizeLanguage(code = "en") {
  return String(code || "en").trim().toLowerCase();
}

function detectIntent(text = "") {
  const value = String(text || "").toLowerCase();
  if (value.includes("notice")) return "notice_generation";
  if (value.includes("complaint") || value.includes("issue")) return "complaint_generation";
  if (value.includes("translate") || value.includes("language")) return "translation";
  if (value.includes("summary") || value.includes("summarize")) return "summarization";
  if (value.includes("analytics") || value.includes("report") || value.includes("insight")) return "analytics";
  if (value.includes("maintenance") || value.includes("predict")) return "maintenance_prediction";
  if (value.includes("automate") || value.includes("action")) return "automation";
  if (value.includes("search") || value.includes("find")) return "knowledge_query";
  return "general";
}

async function callOpenAiChat({ system, user, json = false }) {
  if (!hasOpenAi()) {
    throw new Error("OpenAI API key is not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_CHAT_TIMEOUT_MS);

  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        response_format: json ? { type: "json_object" } : undefined,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI chat error: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    const output = payload?.choices?.[0]?.message?.content || "";
    return output;
  } finally {
    clearTimeout(timer);
  }
}

function fallbackNotice({ topic = "", detail = "", audience = "all residents" }) {
  return {
    title: topic || "Important Society Update",
    message: `Dear ${audience},\n\n${detail || "Please review the latest update from society management."}\n\nRegards,\nSociety Management`,
    urgency: "medium",
    actionItems: ["Share with residents", "Acknowledge receipt", "Follow policy timelines"],
  };
}

function fallbackComplaint({ prompt = "" }) {
  const text = String(prompt || "").toLowerCase();
  const severity = text.includes("urgent") || text.includes("leak") ? "high" : "medium";
  return {
    title: "Resident Complaint",
    description: prompt || "Resident has reported an issue requiring attention.",
    severity,
    category: text.includes("water") ? "plumbing" : text.includes("lift") ? "elevator" : "general",
    suggestedAction: "Assign maintenance staff and notify resident with ETA",
  };
}

function fallbackSummary(text = "") {
  const sentences = String(text || "")
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  return {
    summary: sentences.slice(0, 3).join(" ") || "No summary available.",
    highlights: sentences.slice(0, 3),
    riskLevel: "medium",
    nextActions: ["Review pending tasks", "Assign owners", "Track completion"],
  };
}

function fallbackTranslation(text = "", targetLanguage = "en") {
  const language = normalizeLanguage(targetLanguage);
  return {
    sourceLanguage: "auto",
    targetLanguage: language,
    translatedText: language === "en" ? text : `[${language.toUpperCase()} translation] ${text}`,
  };
}

async function askModel({ systemKey, input, context = {}, jsonFallback = {} }) {
  const { system, user } = buildPrompt({ systemKey, input, context });

  if (!hasOpenAi()) {
    return jsonFallback;
  }

  try {
    const output = await callOpenAiChat({ system, user, json: true });
    return tryParseJson(output, jsonFallback) || jsonFallback;
  } catch (_error) {
    return jsonFallback;
  }
}

async function generateNotice({ topic, detail, audience, societyContext }) {
  const fallback = fallbackNotice({ topic, detail, audience });
  const ai = await askModel({
    systemKey: "noticeGenerator",
    input: { topic, detail, audience },
    context: { societyContext },
    jsonFallback: fallback,
  });

  return {
    title: ai.title || fallback.title,
    message: ai.message || fallback.message,
    urgency: ai.urgency || fallback.urgency,
    actionItems: Array.isArray(ai.actionItems) ? ai.actionItems : fallback.actionItems,
  };
}

async function generateComplaint({ prompt, residentContext }) {
  const fallback = fallbackComplaint({ prompt });
  const ai = await askModel({
    systemKey: "complaintGenerator",
    input: { prompt },
    context: { residentContext },
    jsonFallback: fallback,
  });

  return {
    title: ai.title || fallback.title,
    description: ai.description || fallback.description,
    severity: ai.severity || fallback.severity,
    category: ai.category || fallback.category,
    suggestedAction: ai.suggestedAction || fallback.suggestedAction,
  };
}

async function summarizeReport({ text, metadata = {} }) {
  const fallback = fallbackSummary(text);
  const ai = await askModel({
    systemKey: "summarizer",
    input: { text },
    context: metadata,
    jsonFallback: fallback,
  });

  return {
    summary: ai.summary || fallback.summary,
    highlights: Array.isArray(ai.highlights) ? ai.highlights : fallback.highlights,
    riskLevel: ai.riskLevel || fallback.riskLevel,
    nextActions: Array.isArray(ai.nextActions) ? ai.nextActions : fallback.nextActions,
  };
}

async function translateMessage({ text, targetLanguage }) {
  const fallback = fallbackTranslation(text, targetLanguage);
  const ai = await askModel({
    systemKey: "translator",
    input: { text, targetLanguage },
    jsonFallback: fallback,
  });

  return {
    sourceLanguage: ai.sourceLanguage || fallback.sourceLanguage,
    targetLanguage: ai.targetLanguage || fallback.targetLanguage,
    translatedText: ai.translatedText || fallback.translatedText,
  };
}

async function answerSocietyQuestion({ query, context = {} }) {
  const intent = detectIntent(query);

  const fallback = {
    answer: "I can help with notices, complaints, billing communication, maintenance planning, and analytics summaries.",
    intent,
    confidence: 0.62,
    suggestedActions: ["summarize_report", "generate_notice", "predict_maintenance"],
  };

  const ai = await askModel({
    systemKey: "assistant",
    input: { query },
    context,
    jsonFallback: fallback,
  });

  return {
    answer: ai.answer || fallback.answer,
    intent: ai.intent || intent,
    confidence: Number(ai.confidence || fallback.confidence),
    suggestedActions: Array.isArray(ai.suggestedActions) ? ai.suggestedActions : fallback.suggestedActions,
  };
}

async function searchKnowledgeBase({ societyId, query }) {
  const like = `%${String(query || "").trim()}%`;

  const { rows: noticeRows } = await db.query(
    `SELECT id, title, message, created_at
     FROM notices
     WHERE title LIKE ? OR message LIKE ?
     ORDER BY created_at DESC
     LIMIT 8`,
    [like, like]
  );

  const { rows: complaintRows } = await db.query(
    `SELECT c.id, c.title, c.description, c.status, c.created_at
     FROM complaints c
     JOIN users u ON u.id = c.resident_id
     WHERE (c.title LIKE ? OR c.description LIKE ?)
       AND (? IS NULL OR u.society_id = ?)
     ORDER BY c.created_at DESC
     LIMIT 8`,
    [like, like, societyId || null, societyId || null]
  );

  const { rows: billRows } = await db.query(
    `SELECT b.id, b.title, b.status, b.total_amount, b.created_at
     FROM bills b
     JOIN users u ON u.id = b.resident_id
     WHERE b.title LIKE ?
       AND (? IS NULL OR u.society_id = ?)
     ORDER BY b.created_at DESC
     LIMIT 8`,
    [like, societyId || null, societyId || null]
  );

  return {
    notices: noticeRows,
    complaints: complaintRows,
    bills: billRows,
  };
}

async function predictMaintenanceIssues({ societyId }) {
  const { rows } = await db.query(
    `SELECT DATE_FORMAT(c.created_at, '%Y-%m') AS month_key,
            COUNT(*) AS total,
            SUM(CASE WHEN c.title LIKE '%water%' OR c.description LIKE '%water%' THEN 1 ELSE 0 END) AS water_issues,
            SUM(CASE WHEN c.title LIKE '%lift%' OR c.description LIKE '%lift%' THEN 1 ELSE 0 END) AS lift_issues,
            SUM(CASE WHEN c.title LIKE '%electric%' OR c.description LIKE '%electric%' THEN 1 ELSE 0 END) AS electrical_issues
     FROM complaints c
     JOIN users u ON u.id = c.resident_id
     WHERE c.created_at >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
       AND (? IS NULL OR u.society_id = ?)
     GROUP BY month_key
     ORDER BY month_key ASC`,
    [societyId || null, societyId || null]
  );

  const latest = rows[rows.length - 1] || { total: 0, water_issues: 0, lift_issues: 0, electrical_issues: 0 };
  const riskScore = Math.min(100, Number(latest.total || 0) * 4 + Number(latest.water_issues || 0) * 6 + Number(latest.lift_issues || 0) * 5);

  const fallback = {
    riskScore,
    predictedIssues: [
      { issue: "Water pipeline stress", probability: Math.min(0.95, (Number(latest.water_issues || 0) + 1) / 10) },
      { issue: "Lift preventive servicing due", probability: Math.min(0.95, (Number(latest.lift_issues || 0) + 1) / 10) },
      { issue: "Electrical panel overload", probability: Math.min(0.95, (Number(latest.electrical_issues || 0) + 1) / 10) },
    ],
    preventiveActions: [
      "Schedule wing-wise plumbing audit",
      "Run monthly lift vibration diagnostics",
      "Inspect electrical load balancing in common panels",
    ],
    trend: rows,
  };

  const ai = await askModel({
    systemKey: "maintenancePredictor",
    input: { complaintTrend: rows },
    jsonFallback: fallback,
  });

  return {
    riskScore: Number(ai.riskScore || fallback.riskScore),
    predictedIssues: Array.isArray(ai.predictedIssues) ? ai.predictedIssues : fallback.predictedIssues,
    preventiveActions: Array.isArray(ai.preventiveActions) ? ai.preventiveActions : fallback.preventiveActions,
    trend: fallback.trend,
  };
}

async function generateAnalytics({ societyId }) {
  const [totalResidents, pendingComplaints, unpaidBills, complaintStatus, billStatus, monthlyTrend] = await Promise.all([
    analyticsModel.getTotalResidents(),
    analyticsModel.getPendingComplaints(),
    analyticsModel.getUnpaidBills(),
    analyticsModel.getComplaintStatusBreakdown(),
    analyticsModel.getBillStatusBreakdown(),
    analyticsModel.getMonthlyComplaintsAndBills(6),
  ]);

  const raw = {
    totals: {
      totalResidents,
      pendingComplaints,
      unpaidBills,
    },
    charts: {
      complaintStatus,
      billStatus,
      monthlyTrend,
    },
    societyId: societyId || null,
  };

  const fallback = {
    summary: `Residents: ${totalResidents}, Pending complaints: ${pendingComplaints}, Unpaid bills: ${unpaidBills}.`,
    anomalies: pendingComplaints > Math.max(10, totalResidents * 0.1) ? ["Complaint load is above normal"] : [],
    recommendations: [
      "Prioritize unresolved complaints older than 48 hours",
      "Send automated payment reminders to unpaid bill holders",
      "Run weekly maintenance readiness review",
    ],
    dashboardInsights: [
      {
        title: "Service health",
        value: `${Math.max(0, 100 - pendingComplaints)}%`,
        trend: pendingComplaints > 15 ? "down" : "up",
        detail: "Pending complaints impact resident satisfaction",
      },
      {
        title: "Collections",
        value: `${unpaidBills} unpaid bills`,
        trend: unpaidBills > 20 ? "down" : "up",
        detail: "Automate reminders and payment follow-ups",
      },
      {
        title: "Resident load",
        value: `${totalResidents} active residents`,
        trend: "stable",
        detail: "Use AI support during high ticket windows",
      },
    ],
  };

  const ai = await askModel({
    systemKey: "analytics",
    input: raw,
    jsonFallback: fallback,
  });

  return {
    raw,
    summary: ai.summary || fallback.summary,
    anomalies: Array.isArray(ai.anomalies) ? ai.anomalies : fallback.anomalies,
    recommendations: Array.isArray(ai.recommendations) ? ai.recommendations : fallback.recommendations,
    dashboardInsights: Array.isArray(ai.dashboardInsights) ? ai.dashboardInsights : fallback.dashboardInsights,
  };
}

async function suggestActions({ question, societyId, role }) {
  const answer = await answerSocietyQuestion({ query: question, context: { role, societyId } });
  return {
    intent: answer.intent,
    suggestedActions: answer.suggestedActions,
    reply: answer.answer,
    confidence: answer.confidence,
  };
}

async function executeWorkflowAction({ action, payload, user }) {
  switch (action) {
    case "create_notice": {
      const noticeId = await noticeModel.createNotice({
        title: payload.title,
        message: payload.message,
        createdBy: user.id,
      });
      const notice = await noticeModel.getNoticeById(noticeId);
      return { action, status: "completed", data: notice };
    }
    case "create_complaint": {
      const complaintId = await complaintModel.createComplaint({
        residentId: Number(payload.residentId || user.id),
        title: payload.title,
        description: payload.description,
      });
      const complaint = await complaintModel.getComplaintById(complaintId);
      return { action, status: "completed", data: complaint };
    }
    case "summarize_report": {
      const summary = await summarizeReport({ text: payload.text || "" });
      return { action, status: "completed", data: summary };
    }
    case "translate_message": {
      const translation = await translateMessage({ text: payload.text || "", targetLanguage: payload.targetLanguage || "en" });
      return { action, status: "completed", data: translation };
    }
    case "predict_maintenance": {
      const prediction = await predictMaintenanceIssues({ societyId: user.societyId || user.society_id || null });
      return { action, status: "completed", data: prediction };
    }
    case "analytics_insights": {
      const analytics = await generateAnalytics({ societyId: user.societyId || user.society_id || null });
      return { action, status: "completed", data: analytics };
    }
    default:
      return { action, status: "ignored", data: { message: "Unknown action" } };
  }
}

async function performOCR({ imageBase64 = "", imageUrl = "" }) {
  const fallback = {
    text: "OCR processing completed in fallback mode. Configure OpenAI API key for advanced OCR extraction.",
    fields: {},
  };

  if (!hasOpenAi()) {
    return fallback;
  }

  const content = imageUrl
    ? [{ type: "text", text: "Extract structured text and key fields from this document." }, { type: "image_url", image_url: { url: imageUrl } }]
    : [{ type: "text", text: "Extract structured text and key fields from this document." }, { type: "image_url", image_url: { url: imageBase64 } }];

  try {
    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
        temperature: 0,
        messages: [
          { role: "system", content: "You are an OCR extraction engine. Return JSON with keys: text and fields." },
          { role: "user", content },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const payload = await response.json();
    return tryParseJson(payload?.choices?.[0]?.message?.content || "", fallback) || fallback;
  } catch (_error) {
    return fallback;
  }
}

async function speechToText({ audioBase64 = "", mimeType = "audio/webm" }) {
  if (!hasOpenAi()) {
    return {
      text: "Speech-to-text fallback: configure OPENAI_API_KEY for transcription.",
      language: "en",
    };
  }

  const audioPayload = String(audioBase64 || "").split(",").pop();
  const response = await fetch(`${OPENAI_API_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe",
      file: audioPayload,
      format: "base64",
      mime_type: mimeType,
    }),
  });

  if (!response.ok) {
    return {
      text: "Transcription failed",
      language: "en",
    };
  }

  const payload = await response.json();
  return {
    text: payload.text || "",
    language: payload.language || "en",
  };
}

async function textToSpeech({ text = "", voice = "alloy" }) {
  if (!hasOpenAi()) {
    return {
      audioBase64: "",
      format: "mp3",
      message: "TTS fallback: configure OPENAI_API_KEY for audio synthesis.",
    };
  }

  const response = await fetch(`${OPENAI_API_BASE}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice,
      input: text,
      format: "mp3",
    }),
  });

  if (!response.ok) {
    return {
      audioBase64: "",
      format: "mp3",
      message: "TTS failed",
    };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    audioBase64: buffer.toString("base64"),
    format: "mp3",
  };
}

module.exports = {
  hasOpenAi,
  detectIntent,
  generateNotice,
  generateComplaint,
  summarizeReport,
  translateMessage,
  answerSocietyQuestion,
  searchKnowledgeBase,
  predictMaintenanceIssues,
  suggestActions,
  generateAnalytics,
  executeWorkflowAction,
  performOCR,
  speechToText,
  textToSpeech,
};
