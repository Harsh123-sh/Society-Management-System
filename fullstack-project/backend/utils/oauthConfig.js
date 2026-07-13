const REQUIRED_BY_PROVIDER = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_CALLBACK_URL"],
  microsoft: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_CALLBACK_URL"],
};

const PLACEHOLDER_VALUES = new Set([
  "null",
  "undefined",
  "test",
  "demo",
  "placeholder",
  "your_google_client_id",
  "your-google-client-id",
  "your_microsoft_client_id",
  "your-microsoft-client-id",
  "real_google_client_id_here",
  "real-google-client-id-here",
  "real_microsoft_client_id_here",
  "real-microsoft-client-id-here",
]);

function isConfiguredValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;
  if (PLACEHOLDER_VALUES.has(normalized)) return false;
  return !normalized.includes("_here") && !normalized.includes("-here") && !normalized.includes("your_") && !normalized.includes("your-");
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

function getExpectedLocalCallback(provider) {
  const port = process.env.PORT || "5000";
  return `http://localhost:${port}/api/auth/${provider}/callback`;
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
      const socialMissing = [`${provider.toUpperCase()}_CLIENT_ID`].filter((key) => !isConfiguredValue(process.env[key]));
      const warnings = [];

      if (config.callbackUrl && config.callbackUrl.includes("[")) {
        warnings.push(`${provider.toUpperCase()}_CALLBACK_URL must be a plain URL, not markdown text.`);
      }

      const expectedLocalCallback = getExpectedLocalCallback(provider);
      if (isLocalUrl(config.callbackUrl) && normalizeUrl(config.callbackUrl) !== expectedLocalCallback) {
        warnings.push(`${provider.toUpperCase()}_CALLBACK_URL must exactly be ${expectedLocalCallback}.`);
      }

      return [provider, {
        enabled: missing.length === 0 && warnings.length === 0,
        socialEnabled: socialMissing.length === 0,
        missing,
        socialMissing,
        warnings,
        expectedFrontendRedirectUrl: `${getFrontendUrl()}/oauth/popup-callback`,
      }];
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
