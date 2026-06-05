const db = require("../config/db");
const societyModel = require("./societyModel");

const DEFAULT_MODULES = [
  { moduleKey: "billing", enabled: true },
  { moduleKey: "complaints", enabled: true },
  { moduleKey: "chat", enabled: true },
  { moduleKey: "visitors", enabled: true },
  { moduleKey: "analytics", enabled: true },
  { moduleKey: "notices", enabled: true },
  { moduleKey: "parking", enabled: true },
  { moduleKey: "documents", enabled: true },
  { moduleKey: "ai_assistant", enabled: true },
  { moduleKey: "subscription", enabled: true },
];

const DEFAULT_FEATURES = {
  realtimeNotifications: true,
  whatsappStyleChat: true,
  aiAutomation: true,
  aiPersonalization: true,
  ocrCapture: true,
  translation: true,
  mobileApps: true,
};

const DEFAULT_PERMISSIONS = {
  super_admin: ["all"],
  admin: ["manage_society", "manage_users", "manage_billing", "manage_settings", "view_analytics"],
  secretary: ["manage_notices", "manage_documents", "manage_calendar", "view_analytics"],
  staff: ["manage_tasks", "update_work_logs", "view_assigned_items"],
  resident: ["view_own_data", "raise_complaints", "chat", "pay_bills"],
  security: ["manage_gate", "verify_visitors", "create_incidents"],
};

function toJson(value) {
  return JSON.stringify(value ?? null);
}

function fromJson(value, fallback = null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

async function ensureSocietyDefaults(connection, societyId, overrides = {}) {
  const branding = {
    logoUrl: overrides.logoUrl || null,
    faviconUrl: overrides.faviconUrl || null,
    primaryColor: overrides.primaryColor || "#0f766e",
    secondaryColor: overrides.secondaryColor || "#2563eb",
    accentColor: overrides.accentColor || "#14b8a6",
    fontFamily: overrides.fontFamily || "Inter",
    themeJson: overrides.themeJson || {
      mode: "dark",
      gradient: ["#0f766e", "#2563eb"],
      glassmorphism: true,
    },
  };

  const settings = {
    timezone: overrides.timezone || "Asia/Kolkata",
    locale: overrides.locale || "en",
    currencyCode: overrides.currencyCode || "INR",
    modules: overrides.modules || DEFAULT_MODULES,
    permissions: overrides.permissions || DEFAULT_PERMISSIONS,
    featureFlags: overrides.featureFlags || DEFAULT_FEATURES,
    personalization: overrides.personalization || {
      aiGreeting: true,
      tone: "premium",
      languageFallback: ["en"],
      automationLevel: "balanced",
    },
  };

  const subscription = {
    planName: overrides.planName || "starter",
    status: overrides.subscriptionStatus || "trial",
    billingCycle: overrides.billingCycle || "monthly",
    renewalAt: overrides.renewalAt || null,
    limits: overrides.limits || {
      societies: 1,
      users: 200,
      staff: 25,
      storageMb: 5000,
      aiRequests: 10000,
    },
    providerName: overrides.providerName || "render",
    providerSubscriptionId: overrides.providerSubscriptionId || null,
  };

  await db.query(
    `INSERT INTO society_brandings
      (society_id, logo_url, favicon_url, primary_color, secondary_color, accent_color, font_family, theme_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(society_id) DO UPDATE SET
       logo_url = EXCLUDED.logo_url,
       favicon_url = EXCLUDED.favicon_url,
       primary_color = EXCLUDED.primary_color,
       secondary_color = EXCLUDED.secondary_color,
       accent_color = EXCLUDED.accent_color,
       font_family = EXCLUDED.font_family,
       theme_json = EXCLUDED.theme_json`,
    [
      societyId,
      branding.logoUrl,
      branding.faviconUrl,
      branding.primaryColor,
      branding.secondaryColor,
      branding.accentColor,
      branding.fontFamily,
      toJson(branding.themeJson),
    ]
  );

  await db.query(
    `INSERT INTO society_settings
      (society_id, timezone, locale, currency_code, modules_json, permissions_json, feature_flags_json, personalization_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(society_id) DO UPDATE SET
       timezone = EXCLUDED.timezone,
       locale = EXCLUDED.locale,
       currency_code = EXCLUDED.currency_code,
       modules_json = EXCLUDED.modules_json,
       permissions_json = EXCLUDED.permissions_json,
       feature_flags_json = EXCLUDED.feature_flags_json,
       personalization_json = EXCLUDED.personalization_json`,
    [
      societyId,
      settings.timezone,
      settings.locale,
      settings.currencyCode,
      toJson(settings.modules),
      toJson(settings.permissions),
      toJson(settings.featureFlags),
      toJson(settings.personalization),
    ]
  );

  await db.query(
    `INSERT INTO society_subscriptions
      (society_id, plan_name, status, billing_cycle, renewal_at, limits_json, provider_name, provider_subscription_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(society_id) DO UPDATE SET
       plan_name = EXCLUDED.plan_name,
       status = EXCLUDED.status,
       billing_cycle = EXCLUDED.billing_cycle,
       renewal_at = EXCLUDED.renewal_at,
       limits_json = EXCLUDED.limits_json,
       provider_name = EXCLUDED.provider_name,
       provider_subscription_id = EXCLUDED.provider_subscription_id`,
    [
      societyId,
      subscription.planName,
      subscription.status,
      subscription.billingCycle,
      subscription.renewalAt,
      toJson(subscription.limits),
      subscription.providerName,
      subscription.providerSubscriptionId,
    ]
  );

  for (const moduleConfig of settings.modules) {
    await db.query(
      `INSERT INTO society_modules
        (society_id, module_key, enabled, config_json)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT(society_id, module_key) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         config_json = EXCLUDED.config_json`,
      [
        societyId,
        moduleConfig.moduleKey,
        moduleConfig.enabled ? true : false,
        toJson(moduleConfig.config || {}),
      ]
    );
  }
}

async function createSocietyTenant(payload) {
  try {
    const result = await db.query(
      `INSERT INTO societies
        (code, slug, subdomain, name, status, subscription_plan, default_language, created_by, primary_admin_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        String(payload.code).trim().toUpperCase(),
        String(payload.slug || payload.code).trim().toLowerCase(),
        String(payload.subdomain || payload.slug || payload.code).trim().toLowerCase(),
        String(payload.name).trim(),
        payload.status || "active",
        payload.subscriptionPlan || "starter",
        payload.defaultLanguage || "en",
        payload.createdBy || null,
        payload.primaryAdminUserId || null,
      ]
    );

    const societyId = result.rows[0].id;
    await ensureSocietyDefaults(societyId, payload);

    return societyModel.getSocietyById(societyId);
  } catch (error) {
    throw error;
  }
}

async function getTenantContextBySocietyId(societyId) {
  if (!societyId) {
    return null;
  }

  const { rows } = await db.query(
    `SELECT s.id, s.code, s.slug, s.subdomain, s.name, s.status, s.subscription_plan, s.default_language,
            s.created_by, s.primary_admin_user_id, s.created_at,
            b.logo_url, b.favicon_url, b.primary_color, b.secondary_color, b.accent_color, b.font_family, b.theme_json,
            st.timezone, st.locale, st.currency_code, st.modules_json, st.permissions_json,
            st.feature_flags_json, st.personalization_json,
            sub.plan_name, sub.status AS subscription_status, sub.billing_cycle, sub.renewal_at, sub.limits_json,
            sub.provider_name, sub.provider_subscription_id
     FROM societies s
     LEFT JOIN society_brandings b ON b.society_id = s.id
     LEFT JOIN society_settings st ON st.society_id = s.id
     LEFT JOIN society_subscriptions sub ON sub.society_id = s.id
     WHERE s.id = $1
     LIMIT 1`,
    [societyId]
  );

  const row = rows[0] || null;
  if (!row) {
    return null;
  }

  return {
    society: {
      id: row.id,
      code: row.code,
      slug: row.slug,
      subdomain: row.subdomain,
      name: row.name,
      status: row.status,
      subscriptionPlan: row.subscription_plan,
      defaultLanguage: row.default_language,
      createdBy: row.created_by,
      primaryAdminUserId: row.primary_admin_user_id,
      createdAt: row.created_at,
    },
    branding: {
      logoUrl: row.logo_url,
      faviconUrl: row.favicon_url,
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      fontFamily: row.font_family,
      theme: fromJson(row.theme_json, { mode: "dark" }),
    },
    settings: {
      timezone: row.timezone,
      locale: row.locale,
      currencyCode: row.currency_code,
      modules: fromJson(row.modules_json, DEFAULT_MODULES),
      permissions: fromJson(row.permissions_json, DEFAULT_PERMISSIONS),
      featureFlags: fromJson(row.feature_flags_json, DEFAULT_FEATURES),
      personalization: fromJson(row.personalization_json, {}),
    },
    subscription: {
      planName: row.plan_name || row.subscription_plan,
      status: row.subscription_status,
      billingCycle: row.billing_cycle,
      renewalAt: row.renewal_at,
      limits: fromJson(row.limits_json, {}),
      providerName: row.provider_name,
      providerSubscriptionId: row.provider_subscription_id,
    },
  };
}

async function listTenantSummaries() {
  const { rows } = await db.query(
    `SELECT s.id, s.code, s.slug, s.subdomain, s.name, s.status, s.subscription_plan,
            s.default_language, s.created_at,
            b.primary_color, b.secondary_color, b.accent_color,
            sub.status AS subscription_status, sub.renewal_at,
            COUNT(DISTINCT u.id) AS user_count
     FROM societies s
     LEFT JOIN society_brandings b ON b.society_id = s.id
     LEFT JOIN society_subscriptions sub ON sub.society_id = s.id
     LEFT JOIN users u ON u.society_id = s.id
     GROUP BY s.id, s.code, s.slug, s.subdomain, s.name, s.status, s.subscription_plan,
              s.default_language, s.created_at, b.primary_color, b.secondary_color, b.accent_color,
              sub.status, sub.renewal_at
     ORDER BY s.created_at DESC`
  );

  return rows;
}

async function updateTenantBranding(societyId, branding = {}) {
  await db.query(
    `INSERT INTO society_brandings
      (society_id, logo_url, favicon_url, primary_color, secondary_color, accent_color, font_family, theme_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(society_id) DO UPDATE SET
       logo_url = EXCLUDED.logo_url,
       favicon_url = EXCLUDED.favicon_url,
       primary_color = EXCLUDED.primary_color,
       secondary_color = EXCLUDED.secondary_color,
       accent_color = EXCLUDED.accent_color,
       font_family = EXCLUDED.font_family,
       theme_json = EXCLUDED.theme_json`,
    [
      societyId,
      branding.logoUrl || null,
      branding.faviconUrl || null,
      branding.primaryColor || null,
      branding.secondaryColor || null,
      branding.accentColor || null,
      branding.fontFamily || null,
      toJson(branding.theme || branding.themeJson || null),
    ]
  );

  return { success: true };
}

async function updateTenantSettings(societyId, settings = {}) {
  await db.query(
    `INSERT INTO society_settings
      (society_id, timezone, locale, currency_code, modules_json, permissions_json, feature_flags_json, personalization_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(society_id) DO UPDATE SET
       timezone = EXCLUDED.timezone,
       locale = EXCLUDED.locale,
       currency_code = EXCLUDED.currency_code,
       modules_json = EXCLUDED.modules_json,
       permissions_json = EXCLUDED.permissions_json,
       feature_flags_json = EXCLUDED.feature_flags_json,
       personalization_json = EXCLUDED.personalization_json`,
    [
      societyId,
      settings.timezone || "Asia/Kolkata",
      settings.locale || "en",
      settings.currencyCode || settings.currency_code || "INR",
      toJson(settings.modules || DEFAULT_MODULES),
      toJson(settings.permissions || DEFAULT_PERMISSIONS),
      toJson(settings.featureFlags || settings.feature_flags || DEFAULT_FEATURES),
      toJson(settings.personalization || {}),
    ]
  );

  return { success: true };
}

async function updateTenantSubscription(societyId, subscription = {}) {
  await db.query(
    `INSERT INTO society_subscriptions
      (society_id, plan_name, status, billing_cycle, renewal_at, limits_json, provider_name, provider_subscription_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT(society_id) DO UPDATE SET
       plan_name = EXCLUDED.plan_name,
       status = EXCLUDED.status,
       billing_cycle = EXCLUDED.billing_cycle,
       renewal_at = EXCLUDED.renewal_at,
       limits_json = EXCLUDED.limits_json,
       provider_name = EXCLUDED.provider_name,
       provider_subscription_id = EXCLUDED.provider_subscription_id`,
    [
      societyId,
      subscription.planName || subscription.plan_name || "starter",
      subscription.status || "trial",
      subscription.billingCycle || subscription.billing_cycle || "monthly",
      subscription.renewalAt || subscription.renewal_at || null,
      toJson(subscription.limits || {}),
      subscription.providerName || subscription.provider_name || "render",
      subscription.providerSubscriptionId || subscription.provider_subscription_id || null,
    ]
  );

  return { success: true };
}

async function setModuleState(societyId, moduleKey, enabled, config = {}) {
  await db.query(
    `INSERT INTO society_modules
      (society_id, module_key, enabled, config_json)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(society_id, module_key) DO UPDATE SET
       enabled = EXCLUDED.enabled,
       config_json = EXCLUDED.config_json`,
    [societyId, moduleKey, enabled ? true : false, toJson(config)]
  );

  return { success: true };
}

async function recordSocietyAnalytics(societyId, metrics = {}, metricDate = new Date()) {
  const metricKey = metricDate.toISOString().slice(0, 10);

  await db.query(
    `INSERT INTO society_analytics (society_id, metric_date, metrics_json)
     VALUES ($1, $2, $3)
     ON CONFLICT(society_id, metric_date) DO UPDATE SET metrics_json = EXCLUDED.metrics_json`,
    [societyId, metricKey, toJson(metrics)]
  );
}

async function getSocietyAnalytics(societyId) {
  const result = await db.query(
  `SELECT society_id, metric_date, metrics_json
   FROM society_analytics
   WHERE society_id = $1
   ORDER BY metric_date DESC`,
  [societyId]
);

  return rows.map((row) => ({
    id: row.id,
    societyId: row.society_id,
    metricDate: row.metric_date,
    metrics: fromJson(row.metrics_json, {}),
    createdAt: row.created_at,
  }));
}

async function resolveTenantFromRequest(req) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || req.hostname || "")
    .split(":")[0]
    .toLowerCase();
  const headerCode = req.headers["x-society-code"] || req.headers["x-tenant-code"];
  const headerSlug = req.headers["x-society-slug"] || req.headers["x-tenant-slug"];
  const queryCode = req.query.societyCode || req.query.society || req.query.code;

  const fromUser = req.user?.societyId ? await societyModel.getSocietyById(req.user.societyId) : null;
  if (fromUser) {
    return getTenantContextBySocietyId(fromUser.id);
  }

  const hostParts = host.split(".");
  const possibleSubdomain = hostParts.length > 2 ? hostParts[0] : null;

  const society =
    (headerCode && (await societyModel.getSocietyByCode(headerCode))) ||
    (headerSlug && (await societyModel.getSocietyBySlug(headerSlug))) ||
    (possibleSubdomain && (await societyModel.getSocietyBySubdomain(possibleSubdomain))) ||
    (queryCode && (await societyModel.getSocietyByCode(queryCode))) ||
    (await societyModel.getSocietyByCode("DEFAULT"));

  if (!society) {
    return null;
  }

  return getTenantContextBySocietyId(society.id);
}

module.exports = {
  DEFAULT_MODULES,
  DEFAULT_FEATURES,
  DEFAULT_PERMISSIONS,
  createSocietyTenant,
  ensureSocietyDefaults,
  getSocietyAnalytics,
  getTenantContextBySocietyId,
  listTenantSummaries,
  recordSocietyAnalytics,
  resolveTenantFromRequest,
  setModuleState,
  updateTenantBranding,
  updateTenantSettings,
  updateTenantSubscription,
};