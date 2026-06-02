const AI_ACTION_WORKFLOWS = {
  create_notice: {
    description: "Generate and publish a society notice",
    allowedRoles: ["super_admin", "admin", "secretary"],
    requiredFields: ["title", "message"],
  },
  create_complaint: {
    description: "Generate and log a complaint",
    allowedRoles: ["super_admin", "admin", "secretary", "resident", "staff", "security"],
    requiredFields: ["title", "description", "residentId"],
  },
  summarize_report: {
    description: "Summarize society operational report",
    allowedRoles: ["super_admin", "admin", "secretary", "staff"],
    requiredFields: ["text"],
  },
  translate_message: {
    description: "Translate communication into target language",
    allowedRoles: ["super_admin", "admin", "secretary", "resident", "staff", "security"],
    requiredFields: ["text", "targetLanguage"],
  },
  predict_maintenance: {
    description: "Predict maintenance risk and suggest preventive actions",
    allowedRoles: ["super_admin", "admin", "secretary", "staff"],
    requiredFields: [],
  },
  analytics_insights: {
    description: "Generate AI analytics and dashboard insight widgets",
    allowedRoles: ["super_admin", "admin", "secretary", "staff"],
    requiredFields: [],
  },
};

function getWorkflow(action) {
  return AI_ACTION_WORKFLOWS[action] || null;
}

module.exports = {
  AI_ACTION_WORKFLOWS,
  getWorkflow,
};
