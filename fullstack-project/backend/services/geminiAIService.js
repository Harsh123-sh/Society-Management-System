/**
 * Gemini AI Integration Service
 * Handles Google Gemini API integration for AI-powered society management
 */

const db = require("../config/db");
let GoogleGenerativeAI = null;
let geminiSdkError = null;

try {
  ({ GoogleGenerativeAI } = require("@google/generative-ai"));
} catch (error) {
  geminiSdkError = error;
  console.warn(
    "Gemini AI module unavailable:",
    error.code === "MODULE_NOT_FOUND" ? "optional dependency missing" : error.message
  );
}

class GeminiAIService {
  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey || !GoogleGenerativeAI) {
      if (!apiKey) {
        console.warn("WARNING: GOOGLE_GEMINI_API_KEY not configured. AI features will be disabled.");
      } else {
        console.warn("WARNING: Gemini AI SDK unavailable. AI features will be disabled.");
      }
      this.enabled = false;
    } else {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are an intelligent AI assistant for a Smart Society Management platform.
You help users with society-related tasks, complaints, notices, and general questions.
Always be professional, helpful, and context-aware.
Follow the user's society permissions and only provide information they're authorized to access.
For document generation (notices, emails), follow professional formatting standards.`
      });
      this.enabled = true;
    }
  }

  // =====================================================
  // GENERAL QUESTIONS (NO SOCIETY DATA REQUIRED)
  // =====================================================
  async askGeneralQuestion(userId, query) {
    try {
      if (!this.enabled) {
        return {
          response: "AI service is not configured. Please contact administrator.",
          status: "disabled"
        };
      }

      const startTime = Date.now();

      const result = await this.model.generateContent(query);
      const response = result.response.text();

      const responseTime = Date.now() - startTime;

      // Store chat history
      await this.saveChatHistory({
        userId,
        societyId: null,
        chatType: "general",
        query,
        response,
        responseTime
      });

      return {
        response,
        status: "success",
        timestamp: new Date(),
        responseTimeMs: responseTime
      };
    } catch (error) {
      console.error("Error in general AI question:", error);
      return {
        response: "Failed to process your question. Please try again.",
        status: "error",
        error: error.message
      };
    }
  }

  // =====================================================
  // SOCIETY-AWARE QUESTIONS (WITH DATA ACCESS CONTROL)
  // =====================================================
  async askSocietyQuestion(userId, query, societyId) {
    try {
      if (!this.enabled) {
        return {
          response: "AI service is not configured.",
          status: "disabled"
        };
      }

      // Get user role and permissions
      const { rows: userRows } = await db.query(
        `SELECT role, resident_type, flat_id FROM users WHERE id = ? AND society_id = ?`,
        [userId, societyId]
      );

      if (userRows.length === 0) {
        return {
          response: "You don't have access to this society.",
          status: "unauthorized"
        };
      }

      const user = userRows[0];
      const userRole = user.role;
      const userFlatId = user.flat_id;

      // Build context based on user role and query
      const context = await this.buildSocietyContext(
        userId,
        societyId,
        userRole,
        userFlatId,
        query
      );

      // Create enhanced prompt with society context
      const enhancedPrompt = `
User Query: ${query}

Society Context:
${context}

Note: Only provide information that the user has access to based on their role.
If the user asks for data they don't have permission to access, politely inform them.
`;

      const startTime = Date.now();

      const result = await this.model.generateContent(enhancedPrompt);
      const response = result.response.text();

      const responseTime = Date.now() - startTime;

      // Store chat history with permissions
      await this.saveChatHistory({
        userId,
        societyId,
        chatType: "society_aware",
        query,
        response,
        responseTime,
        userPermissions: {
          role: userRole,
          canAccessAllData: ["super_admin", "admin", "secretary"].includes(userRole),
          residentType: user.resident_type,
          flatId: userFlatId
        }
      });

      return {
        response,
        status: "success",
        timestamp: new Date(),
        responseTimeMs: responseTime
      };
    } catch (error) {
      console.error("Error in society AI question:", error);
      return {
        response: "Failed to process your society question.",
        status: "error",
        error: error.message
      };
    }
  }

  // =====================================================
  // CONTEXT BUILDING FOR SOCIETY QUESTIONS
  // =====================================================
  async buildSocietyContext(userId, societyId, userRole, userFlatId, query) {
    try {
      let context = "";

      // Get society basic info
      const { rows: societyRows } = await db.query(
        `SELECT name, code FROM societies WHERE id = ?`,
        [societyId]
      );

      if (societyRows.length > 0) {
        context += `Society: ${societyRows[0].name} (${societyRows[0].code})\n\n`;
      }

      // Add role-specific context
      if (query.toLowerCase().includes("maintenance") || 
          query.toLowerCase().includes("bill") ||
          query.toLowerCase().includes("due")) {
        context += await this.getBillingContext(userId, societyId, userRole);
      }

      if (query.toLowerCase().includes("complaint")) {
        context += await this.getComplaintContext(userId, societyId, userRole);
      }

      if (query.toLowerCase().includes("notice")) {
        context += await this.getNoticeContext(societyId);
      }

      if (query.toLowerCase().includes("secretary") || 
          query.toLowerCase().includes("admin") ||
          query.toLowerCase().includes("staff")) {
        context += await this.getSocietyStaffContext(societyId);
      }

      if (query.toLowerCase().includes("visitor")) {
        context += await this.getVisitorContext(userId, societyId, userRole);
      }

      return context;
    } catch (error) {
      console.error("Error building society context:", error);
      return "Unable to load society context.";
    }
  }

  // =====================================================
  // CONTEXT HELPERS
  // =====================================================
  async getBillingContext(userId, societyId, userRole) {
    try {
      let context = "Billing Information:\n";

      if (userRole === "resident") {
        const { rows: bills } = await db.query(
          `SELECT bill_type, total_amount, paid_amount, status, due_date 
           FROM bills 
           WHERE resident_id = ? AND society_id = ?
           ORDER BY due_date DESC
           LIMIT 5`,
          [userId, societyId]
        );

        if (bills.length > 0) {
          context += "Your Bills:\n";
          bills.forEach(bill => {
            context += `- ${bill.bill_type}: ₹${bill.total_amount} (Status: ${bill.status}, Due: ${bill.due_date})\n`;
          });
        }
      } else if (["secretary", "admin"].includes(userRole)) {
        const { rows: stats } = await db.query(
          `SELECT 
            COUNT(*) as total_bills,
            SUM(total_amount) as total_amount,
            SUM(CASE WHEN status = 'unpaid' THEN total_amount ELSE 0 END) as unpaid_amount
           FROM bills 
           WHERE society_id = ?`,
          [societyId]
        );

        if (stats.length > 0) {
          context += `Total Bills: ${stats[0].total_bills}\n`;
          context += `Total Amount: ₹${stats[0].total_amount || 0}\n`;
          context += `Unpaid Amount: ₹${stats[0].unpaid_amount || 0}\n`;
        }
      }

      return context;
    } catch (error) {
      return "";
    }
  }

  async getComplaintContext(userId, societyId, userRole) {
    try {
      let context = "Complaint Information:\n";

      if (userRole === "resident") {
        const { rows: complaints } = await db.query(
          `SELECT title, status, created_at 
           FROM complaints 
           WHERE resident_id = ? AND resident_id IN (
             SELECT id FROM users WHERE society_id = ?
           )
           ORDER BY created_at DESC
           LIMIT 5`,
          [userId, societyId]
        );

        if (complaints.length > 0) {
          context += "Your Complaints:\n";
          complaints.forEach(c => {
            context += `- ${c.title} (Status: ${c.status})\n`;
          });
        }
      } else if (["secretary", "admin"].includes(userRole)) {
        const { rows: stats } = await db.query(
          `SELECT 
            COUNT(*) as total_complaints,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_complaints
           FROM complaints 
           WHERE resident_id IN (SELECT id FROM users WHERE society_id = ?)`,
          [societyId]
        );

        if (stats.length > 0) {
          context += `Total Complaints: ${stats[0].total_complaints}\n`;
          context += `Pending Complaints: ${stats[0].pending_complaints}\n`;
        }
      }

      return context;
    } catch (error) {
      return "";
    }
  }

  async getNoticeContext(societyId) {
    try {
      const { rows: notices } = await db.query(
        `SELECT title, message, created_at 
         FROM notices 
         WHERE created_by IN (SELECT id FROM users WHERE society_id = ?)
         ORDER BY created_at DESC
         LIMIT 3`,
        [societyId]
      );

      let context = "Recent Notices:\n";
      if (notices.length > 0) {
        notices.forEach(notice => {
          context += `- ${notice.title} (${new Date(notice.created_at).toLocaleDateString()})\n`;
        });
      } else {
        context += "No recent notices.\n";
      }

      return context;
    } catch (error) {
      return "Notice context unavailable.\n";
    }
  }

  async getSocietyStaffContext(societyId) {
    try {
      const { rows: staff } = await db.query(
        `SELECT role, COUNT(*) as count, GROUP_CONCAT(name) as names
         FROM users 
         WHERE society_id = ? AND role IN ('secretary', 'admin', 'staff')
         GROUP BY role`,
        [societyId]
      );

      let context = "Staff Information:\n";
      staff.forEach(s => {
        context += `${s.role}: ${s.count} (${s.names})\n`;
      });

      return context;
    } catch (error) {
      return "";
    }
  }

  async getVisitorContext(userId, societyId, userRole) {
    try {
      let context = "Visitor Information:\n";

      if (userRole === "resident") {
        const { rows: visitors } = await db.query(
          `SELECT visitor_name, purpose, entry_time, status 
           FROM visitors 
           WHERE flat_id IN (SELECT id FROM flats WHERE society_id = ?)
           ORDER BY entry_time DESC
           LIMIT 5`,
          [societyId]
        );

        context += `Recent Visitors: ${visitors.length}\n`;
      } else if (userRole === "security") {
        const { rows: stats } = await db.query(
          `SELECT 
            COUNT(*) as total_visitors,
            SUM(CASE WHEN status = 'in_premises' THEN 1 ELSE 0 END) as current_in_premises
           FROM visitors 
           WHERE security_id = ? AND DATE(entry_time) = CURDATE()`,
          [userId]
        );

        context += `Today's Visitors: ${stats[0]?.total_visitors || 0}\n`;
        context += `Currently in Premises: ${stats[0]?.current_in_premises || 0}\n`;
      }

      return context;
    } catch (error) {
      return "";
    }
  }

  // =====================================================
  // AI-POWERED DOCUMENT GENERATION
  // =====================================================
  async generateNotice(societyId, topic, content) {
    try {
      const prompt = `
Generate a professional notice for a residential society with the following details:
Topic: ${topic}
Content/Details: ${content}

Format the notice as:
[SOCIETY NAME]
NOTICE

Subject: [Subject Line]

Dear Residents,

[Professional notice content]

[Call to action if needed]

Regards,
Society Management
`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Error generating notice:", error);
      throw error;
    }
  }

  async generateEmail(recipient, subject, context) {
    try {
      const prompt = `Generate a professional email:
To: ${recipient}
Subject: ${subject}
Context: ${context}

Format as a complete professional email.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // CHAT HISTORY MANAGEMENT
  // =====================================================
  async saveChatHistory({
    userId,
    societyId,
    chatType,
    query,
    response,
    responseTime,
    userPermissions = null
  }) {
    try {
      await db.query(
        `INSERT INTO ai_chats (
          user_id, society_id, chat_type, query, response,
          model_name, response_time_ms, ai_permissions_json
        ) VALUES (?, ?, ?, ?, ?, 'gemini-1.5-flash', ?, ?)`,
        [
          userId,
          societyId,
          chatType,
          query,
          response,
          responseTime,
          userPermissions ? JSON.stringify(userPermissions) : null
        ]
      );
    } catch (error) {
      console.error("Error saving chat history:", error);
      // Don't throw - chat history failure shouldn't block AI response
    }
  }

  async getChatHistory(userId, societyId = null, limit = 20) {
    try {
      let query = `SELECT id, chat_type, query, response, created_at
                   FROM ai_chats
                   WHERE user_id = ?`;
      const params = [userId];

      if (societyId) {
        query += ` AND society_id = ?`;
        params.push(societyId);
      }

      query += ` ORDER BY created_at DESC LIMIT ?`;
      params.push(limit);

      const { rows } = await db.query(query, params);
      return rows;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }
  }

  // =====================================================
  // STATS & MONITORING
  // =====================================================
  async getAIUsageStats(societyId = null) {
    try {
      let query = `SELECT 
                    COUNT(*) as total_chats,
                    COUNT(DISTINCT user_id) as unique_users,
                    AVG(response_time_ms) as avg_response_time,
                    MAX(created_at) as last_used
                   FROM ai_chats`;
      const params = [];

      if (societyId) {
        query += ` WHERE society_id = ?`;
        params.push(societyId);
      }

      const { rows } = await db.query(query, params);
      return rows[0] || {};
    } catch (error) {
      console.error("Error fetching AI stats:", error);
      return {};
    }
  }
}

module.exports = new GeminiAIService();
