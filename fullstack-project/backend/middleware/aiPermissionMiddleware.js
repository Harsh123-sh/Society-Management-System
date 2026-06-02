const { getWorkflow } = require("../config/aiWorkflows");

function authorizeAiAction() {
  return (req, res, next) => {
    const action = String(req.body?.action || req.body?.actionType || req.params?.action || "").trim();
    if (!action) {
      return res.status(400).json({ success: false, message: "AI action is required" });
    }

    const workflow = getWorkflow(action);
    if (!workflow) {
      return res.status(400).json({ success: false, message: `Unknown AI action: ${action}` });
    }

    const role = req.user?.role;
    if (!role || !workflow.allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, message: "You are not allowed to run this AI action" });
    }

    req.aiWorkflow = workflow;
    req.aiAction = action;
    return next();
  };
}

module.exports = {
  authorizeAiAction,
};
