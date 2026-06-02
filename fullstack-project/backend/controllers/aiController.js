const aiService = require("../services/aiAssistantService");
const { getWorkflow } = require("../config/aiWorkflows");
const notificationModel = require("../models/notificationModel");

function getSocietyContext(req) {
  return {
    societyId: req.user?.societyId || req.user?.society_id || req.tenant?.society?.id || null,
    societyCode: req.user?.societyCode || req.tenant?.society?.code || null,
    role: req.user?.role || null,
  };
}

async function suggestComplaint(req, res) {
  try {
    const { prompt } = req.body;
    const data = await aiService.generateComplaint({
      prompt,
      residentContext: getSocietyContext(req),
    });

    res.json({ success: true, data: { suggestion: data.description, ...data } });
  } catch (_error) {
    res.status(500).json({ success: false, message: "Failed to generate complaint suggestion" });
  }
}

async function generateNotice(req, res) {
  try {
    const { topic, detail, audience } = req.body;
    const data = await aiService.generateNotice({
      topic,
      detail,
      audience,
      societyContext: getSocietyContext(req),
    });

    res.json({ success: true, data: { notice: data.message, ...data } });
  } catch (_error) {
    res.status(500).json({ success: false, message: "Failed to generate notice" });
  }
}

async function assistantReply(req, res) {
  try {
    const { prompt, context } = req.body;
    const data = await aiService.answerSocietyQuestion({
      query: prompt,
      context: { ...context, ...getSocietyContext(req) },
    });

    res.json({ success: true, data: { reply: data.answer, ...data } });
  } catch (_error) {
    res.status(500).json({ success: false, message: "Failed to generate assistant reply" });
  }
}

async function queryAssistant(req, res) {
  try {
    const { query, context } = req.body;
    if (!query || !String(query).trim()) {
      return res.status(400).json({ success: false, message: "query is required" });
    }

    const answer = await aiService.answerSocietyQuestion({
      query,
      context: { ...context, ...getSocietyContext(req) },
    });

    return res.json({ success: true, data: answer });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "AI query failed" });
  }
}

async function executeAiAction(req, res) {
  try {
    const action = String(req.body.action || req.body.actionType || "").trim();
    const payload = req.body.payload || req.body;

    const workflow = getWorkflow(action);
    if (!workflow) {
      return res.status(400).json({ success: false, message: `Unknown AI action: ${action}` });
    }

    const missing = workflow.requiredFields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === "");
    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(", ")}` });
    }

    const result = await aiService.executeWorkflowAction({
      action,
      payload,
      user: { ...req.user, ...getSocietyContext(req) },
    });

    return res.json({ success: true, data: result });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "AI action execution failed" });
  }
}

async function summarizeReport(req, res) {
  try {
    const { text, metadata } = req.body;
    const data = await aiService.summarizeReport({ text, metadata });
    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to summarize report" });
  }
}

async function translate(req, res) {
  try {
    const { text, targetLanguage } = req.body;
    const data = await aiService.translateMessage({ text, targetLanguage });
    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to translate message" });
  }
}

async function search(req, res) {
  try {
    const query = String(req.query.q || req.query.search || req.body?.query || "").trim();
    if (!query) {
      return res.status(400).json({ success: false, message: "query is required" });
    }

    const data = await aiService.searchKnowledgeBase({
      societyId: getSocietyContext(req).societyId,
      query,
    });

    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "AI search failed" });
  }
}

async function predictMaintenance(req, res) {
  try {
    const data = await aiService.predictMaintenanceIssues({
      societyId: getSocietyContext(req).societyId,
    });

    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Maintenance prediction failed" });
  }
}

async function recommendActions(req, res) {
  try {
    const { question } = req.body;
    const data = await aiService.suggestActions({
      question,
      societyId: getSocietyContext(req).societyId,
      role: req.user?.role,
    });

    try {
      await notificationModel.createNotification({
        targetRole: "all",
        targetUserId: req.user.id,
        title: "AI recommendations are ready",
        message: "Your AI assistant generated actionable recommendations.",
        priority: "medium",
        category: "ai_alert",
        relatedType: "ai_recommendation",
      });
    } catch (_error) {
      // AI response should not fail because of notification fanout.
    }

    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Recommendation generation failed" });
  }
}

async function analyticsInsights(req, res) {
  try {
    const data = await aiService.generateAnalytics({
      societyId: getSocietyContext(req).societyId,
    });

    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "AI analytics failed" });
  }
}

async function dashboardWidgets(req, res) {
  try {
    const data = await aiService.generateAnalytics({
      societyId: getSocietyContext(req).societyId,
    });

    return res.json({
      success: true,
      data: {
        widgets: data.dashboardInsights,
        summary: data.summary,
        anomalies: data.anomalies,
        recommendations: data.recommendations,
      },
    });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Failed to load AI dashboard widgets" });
  }
}

async function ocr(req, res) {
  try {
    const { imageBase64, imageUrl } = req.body;
    const data = await aiService.performOCR({ imageBase64, imageUrl });
    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "OCR failed" });
  }
}

async function speechToText(req, res) {
  try {
    const { audioBase64, mimeType } = req.body;
    const data = await aiService.speechToText({ audioBase64, mimeType });
    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Speech-to-text failed" });
  }
}

async function textToSpeech(req, res) {
  try {
    const { text, voice } = req.body;
    const data = await aiService.textToSpeech({ text, voice });
    return res.json({ success: true, data });
  } catch (_error) {
    return res.status(500).json({ success: false, message: "Text-to-speech failed" });
  }
}

async function chatSmartReply(req, res) {
  try {
    const { prompt, context } = req.body;
    const data = await aiService.answerSocietyQuestion({ query: prompt, context });
    res.json({ success: true, data: { reply: data.answer, ...data } });
  } catch (_error) {
    res.status(500).json({ success: false, message: "Failed to generate smart reply" });
  }
}

async function chatTranslate(req, res) {
  try {
    const { text, targetLanguage } = req.body;
    const data = await aiService.translateMessage({ text, targetLanguage });
    res.json({ success: true, data: { translation: data.translatedText, ...data } });
  } catch (_error) {
    res.status(500).json({ success: false, message: "Failed to translate message" });
  }
}

async function chatSummarize(req, res) {
  try {
    const { text } = req.body;
    const data = await aiService.summarizeReport({ text, metadata: { mode: "chat" } });
    res.json({ success: true, data: { summary: data.summary, ...data } });
  } catch (_error) {
    res.status(500).json({ success: false, message: "Failed to summarize message" });
  }
}

module.exports = {
  suggestComplaint,
  generateNotice,
  assistantReply,
  queryAssistant,
  executeAiAction,
  summarizeReport,
  translate,
  search,
  predictMaintenance,
  recommendActions,
  analyticsInsights,
  dashboardWidgets,
  ocr,
  speechToText,
  textToSpeech,
  chatSmartReply,
  chatTranslate,
  chatSummarize,
};
