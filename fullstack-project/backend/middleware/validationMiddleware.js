const { validationResult } = require("express-validator");

function validationMiddleware(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("[validationMiddleware] request validation failed", {
      method: req.method,
      path: req.originalUrl || req.path,
      body: {
        ...req.body,
        password: req.body?.password ? "[REDACTED]" : undefined,
        confirmPassword: req.body?.confirmPassword ? "[REDACTED]" : undefined,
        newPassword: req.body?.newPassword ? "[REDACTED]" : undefined,
      },
      errors: result.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  return res.status(400).json({
    success: false,
    message: result.array()[0]?.msg || "Validation failed",
    errors: result.array().map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  });
}

module.exports = validationMiddleware;
