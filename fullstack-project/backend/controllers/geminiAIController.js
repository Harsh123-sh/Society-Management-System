/**
 * Gemini AI API Controller
 * Handles all Gemini AI interactions - general, society-aware, and document generation
 */

const geminiAIService = require("../services/geminiAIService");
const db = require("../db");

// Ask general question (no society context)
exports.askGeneralQuestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { query } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Query is required" });
    }

    const result = await geminiAIService.askGeneralQuestion(userId, query);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Error in askGeneralQuestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process question"
    });
  }
};

// Ask society-aware question (with context and data access control)
exports.askSocietyQuestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { societyId, query } = req.body;

    if (!societyId) {
      return res.status(400).json({ message: "Society ID is required" });
    }

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Query is required" });
    }

    // Verify user has access to this society
    const [user] = await db.query(
      `SELECT society_id, role FROM users WHERE id = ? AND society_id = ?`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "You don't have access to this society" });
    }

    const result = await geminiAIService.askSocietyQuestion(userId, query, societyId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Error in askSocietyQuestion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process question"
    });
  }
};

// Generate notice using AI
exports.generateNotice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { societyId, topic, content } = req.body;

    if (!societyId || !topic || !content) {
      return res.status(400).json({ 
        message: "Society ID, topic, and content are required" 
      });
    }

    // Verify authorization
    const [user] = await db.query(
      `SELECT id FROM users 
       WHERE id = ? AND society_id = ? AND role IN ('secretary', 'admin')`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const generatedNotice = await geminiAIService.generateNotice(
      societyId,
      topic,
      content
    );

    res.json({
      success: true,
      notice: generatedNotice,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error generating notice:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate notice"
    });
  }
};

// Generate email using AI
exports.generateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { societyId, recipient, subject, context } = req.body;

    if (!societyId || !recipient || !subject || !context) {
      return res.status(400).json({ 
        message: "All fields are required" 
      });
    }

    // Verify user is in the society
    const [user] = await db.query(
      `SELECT id FROM users 
       WHERE id = ? AND society_id = ?`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const generatedEmail = await geminiAIService.generateEmail(
      recipient,
      subject,
      context
    );

    res.json({
      success: true,
      email: generatedEmail,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error generating email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate email"
    });
  }
};

// Get AI chat history
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { societyId } = req.query;
    const limit = req.query.limit || 20;

    const history = await geminiAIService.getChatHistory(userId, societyId, limit);

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch history"
    });
  }
};

// Get AI usage stats (Society Admin / Super Admin)
exports.getAIUsageStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { societyId } = req.params;

    // Verify authorization
    let queryParams = [];
    let whereClause = "";

    if (societyId) {
      // Society Admin
      const [user] = await db.query(
        `SELECT id FROM users 
         WHERE id = ? AND society_id = ? AND role IN ('secretary', 'admin')`,
        [userId, societyId]
      );

      if (user.length === 0) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      queryParams = [societyId];
      whereClause = " WHERE society_id = ?";
    } else {
      // Super Admin
      const [user] = await db.query(
        `SELECT id FROM users WHERE id = ? AND role = 'super_admin'`,
        [userId]
      );

      if (user.length === 0) {
        return res.status(403).json({ message: "Only super admin can view all stats" });
      }
    }

    const stats = await geminiAIService.getAIUsageStats(societyId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error fetching AI stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch stats"
    });
  }
};

// Get AI capabilities and features (public endpoint)
exports.getAICapabilities = async (req, res) => {
  try {
    const capabilities = {
      enabled: geminiAIService.enabled,
      model: "gemini-1.5-flash",
      features: [
        {
          id: "general_qa",
          name: "General Q&A",
          description: "Ask AI general questions about any topic",
          scope: "public"
        },
        {
          id: "society_aware",
          name: "Society-Aware Assistance",
          description: "Get society-specific information and assistance",
          scope: "authenticated",
          requiresContext: ["societyId"]
        },
        {
          id: "notice_generation",
          name: "Notice Generation",
          description: "AI-powered notice generation for society events",
          scope: "admin",
          requiresContext: ["societyId", "topic", "content"]
        },
        {
          id: "email_generation",
          name: "Email Generation",
          description: "Generate professional emails",
          scope: "authenticated",
          requiresContext: ["recipient", "subject", "context"]
        },
        {
          id: "complaint_analysis",
          name: "Complaint Analysis",
          description: "AI analysis and suggestions for complaints",
          scope: "admin",
          requiresContext: ["societyId"]
        },
        {
          id: "document_suggestions",
          name: "Document Suggestions",
          description: "Get suggestions for maintenance, policies, etc.",
          scope: "admin",
          requiresContext: ["societyId"]
        }
      ],
      limits: {
        requestsPerDay: 100,
        requestsPerHour: 10
      },
      status: "operational"
    };

    res.json({
      success: true,
      capabilities
    });
  } catch (error) {
    console.error("Error fetching AI capabilities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch capabilities"
    });
  }
};

// Analyze complaint using AI (return suggestions)
exports.analyzeComplaint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { societyId, complaintTitle, complaintDescription } = req.body;

    if (!societyId || !complaintTitle || !complaintDescription) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Verify user is in society
    const [user] = await db.query(
      `SELECT role FROM users WHERE id = ? AND society_id = ?`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const query = `Analyze this complaint for a residential society:
Title: ${complaintTitle}
Description: ${complaintDescription}

Provide:
1. Severity assessment
2. Category
3. Recommended resolution steps
4. Department responsible
5. Estimated resolution time

Format as actionable points.`;

    const result = await geminiAIService.askSocietyQuestion(
      userId,
      query,
      societyId
    );

    res.json({
      success: true,
      analysis: result.response,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error analyzing complaint:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze complaint"
    });
  }
};

// Get maintenance suggestions using AI
exports.getMaintenanceSuggestions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { societyId } = req.params;

    // Verify authorization - Secretary/Admin
    const [user] = await db.query(
      `SELECT id FROM users 
       WHERE id = ? AND society_id = ? AND role IN ('secretary', 'admin')`,
      [userId, societyId]
    );

    if (user.length === 0) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const query = `For a residential society, suggest:
1. Monthly maintenance checks
2. Quarterly maintenance schedules
3. Annual inspection checklist
4. Emergency procedures
5. Vendor management tips

Format as a structured maintenance calendar.`;

    const result = await geminiAIService.askSocietyQuestion(
      userId,
      query,
      societyId
    );

    res.json({
      success: true,
      suggestions: result.response,
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error getting suggestions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get suggestions"
    });
  }
};

// Health check for AI service
exports.healthCheck = async (req, res) => {
  try {
    const status = {
      service: "Gemini AI",
      enabled: geminiAIService.enabled,
      status: geminiAIService.enabled ? "operational" : "disabled",
      timestamp: new Date(),
      version: "1.0.0"
    };

    res.json({
      success: true,
      health: status
    });
  } catch (error) {
    console.error("Error in health check:", error);
    res.status(500).json({
      success: false,
      health: {
        service: "Gemini AI",
        status: "error",
        error: error.message
      }
    });
  }
};
