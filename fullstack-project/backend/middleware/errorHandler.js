function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }

  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed",
    });
  }

  // Log full error to console for debugging (safe in local/dev only)
  try {
    console.error(err && err.stack ? err.stack : err);
  } catch (e) {
    // ignore logging errors
  }

  const statusCode = Number(err?.statusCode || err?.status || 500);
  const isProduction = process.env.NODE_ENV === "production";

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500 && isProduction
        ? "Internal server error"
        : err?.message || "Internal server error",
  });
}

module.exports = {
  notFound,
  errorHandler,
};