const REQUIRED_BY_PROVIDER = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"],
  microsoft: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_CALLBACK_URL"],
};

const LOCAL_CALLBACKS = {
  google: "http://localhost:5000/api/auth/google/callback",
  microsoft: "http://localhost:5000/api/auth/microsoft/callback",
};

function isConfiguredValue(value) {
  return Boolean(String(value || "").trim());
}

function getFrontendUrl() {
  return String(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
}

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function isLocalUrl(value) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(String(value || ""));
}

function getProviderConfig(provider) {
  const normalizedProvider = String(provider || "").trim().toLowerCase();
  const prefix = normalizedProvider === "microsoft" ? "MICROSOFT" : "GOOGLE";

  return {
    provider: normalizedProvider,
    clientId: process.env[`${prefix}_CLIENT_ID`] || "",
    clientSecret: process.env[`${prefix}_CLIENT_SECRET`] || "",
    callbackUrl: process.env[`${prefix}_CALLBACK_URL`] || "",
  };
}

function getOAuthConfigStatus() {
  return Object.fromEntries(
    Object.keys(REQUIRED_BY_PROVIDER).map((provider) => {
      const missing = REQUIRED_BY_PROVIDER[provider].filter((key) => !isConfiguredValue(process.env[key]));
      const config = getProviderConfig(provider);
      const warnings = [];

      if (config.callbackUrl && config.callbackUrl.includes("[")) {
        warnings.push(`${provider.toUpperCase()}_CALLBACK_URL must be a plain URL, not markdown text.`);
      }

      if (isLocalUrl(config.callbackUrl) && normalizeUrl(config.callbackUrl) !== LOCAL_CALLBACKS[provider]) {
        warnings.push(`${provider.toUpperCase()}_CALLBACK_URL must exactly be ${LOCAL_CALLBACKS[provider]}.`);
      }

      return [provider, { enabled: missing.length === 0 && warnings.length === 0, missing, warnings }];
    })
  );
}

function isOAuthDebugMode() {
  return process.env.NODE_ENV !== "production" || isLocalUrl(getFrontendUrl());
}

function warnMissingOAuthConfig() {
  const status = getOAuthConfigStatus();
  Object.entries(status).forEach(([provider, config]) => {
    if (!config.enabled) {
      console.warn(
        `[OAuth] ${provider} login is not enabled. Missing: ${config.missing.join(", ")}`
      );
    }
  });
}

module.exports = {
  getFrontendUrl,
  getOAuthConfigStatus,
  getProviderConfig,
  isOAuthDebugMode,
  warnMissingOAuthConfig,
};
