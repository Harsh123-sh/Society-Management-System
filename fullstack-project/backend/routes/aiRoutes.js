const express = require("express");
const aiController = require("../controllers/aiController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const { authorizeAiAction } = require("../middleware/aiPermissionMiddleware");

const router = express.Router();

router.use(authenticateToken);

router.post("/assistant", aiController.assistantReply);
router.post("/assistant/query", aiController.queryAssistant);
router.post("/assistant/action", authorizeAiAction(), aiController.executeAiAction);

router.post("/notice-generator", authorizeRoles("super_admin", "admin", "secretary"), aiController.generateNotice);
router.post("/complaint-suggestion", aiController.suggestComplaint);
router.post("/reports/summarize", authorizeRoles("super_admin", "admin", "secretary", "staff"), aiController.summarizeReport);
router.post("/translate", aiController.translate);
router.get("/search", aiController.search);

router.post("/maintenance/predict", authorizeRoles("super_admin", "admin", "secretary", "staff"), aiController.predictMaintenance);
router.post("/recommendations", aiController.recommendActions);
router.get("/analytics/insights", authorizeRoles("super_admin", "admin", "secretary", "staff"), aiController.analyticsInsights);
router.get("/dashboard/widgets", authorizeRoles("super_admin", "admin", "secretary", "staff"), aiController.dashboardWidgets);

router.post("/ocr", authorizeRoles("super_admin", "admin", "secretary", "staff", "security"), aiController.ocr);
router.post("/speech-to-text", aiController.speechToText);
router.post("/text-to-speech", aiController.textToSpeech);

router.post("/chat-smart-reply", aiController.chatSmartReply);
router.post("/chat-translate", aiController.chatTranslate);
router.post("/chat-summarize", aiController.chatSummarize);

module.exports = router;