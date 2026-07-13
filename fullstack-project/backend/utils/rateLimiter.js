const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

function isRateLimitEnabled() {
  return process.env.DISABLE_RATE_LIMITS !== "true" && process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== "test";
}

function createRateLimiter({ windowMs, max, message = "Too many attempts. Please wait a few minutes and try again.", keyGenerator } = {}) {
  if (!isRateLimitEnabled()) {
    return (req, res, next) => next();
  }

  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000,
    max: max || 20,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    keyGenerator: keyGenerator || ipKeyGenerator,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
      });
    },
  });
}

module.exports = { createRateLimiter, isRateLimitEnabled };