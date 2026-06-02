const societyModel = require("../models/societyModel");
const tenantModel = require("../models/tenantModel");
const userModel = require("../models/userModel");

function normalizeIdentifier(value) {
  return String(value || "").trim();
}

function isSuperAdmin(req) {
  return req.user?.role === "super_admin";
}

function canAccessSociety(req, societyId) {
  return isSuperAdmin(req) || Number(req.user?.societyId) === Number(societyId);
}

async function onboardSociety(req, res) {
  try {
    const {
      code,
      name,
      slug,
      subdomain,
      defaultLanguage,
      subscriptionPlan,
      branding = {},
      settings = {},
      subscription = {},
      admin = {},
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: "code and name are required" });
    }

    const existingCode = await societyModel.getSocietyByCode(code);
    if (existingCode) {
      return res.status(409).json({ success: false, message: "Society code already exists" });
    }

    const createdSociety = await tenantModel.createSocietyTenant({
      code,
      name,
      slug: slug || code,
      subdomain: subdomain || slug || code,
      defaultLanguage,
      subscriptionPlan,
      ...branding,
      ...settings,
      ...subscription,
      createdBy: req.user?.id || null,
    });

    let createdAdmin = null;
    if (admin.email && admin.name && admin.password) {
      createdAdmin = await userModel.createUser({
        name: admin.name,
        email: admin.email,
        password: admin.password,
        role: "admin",
        residentType: null,
        status: admin.status || "active",
        isVerified: true,
        societyId: createdSociety.id,
      });

      await societyModel.updateSocietyById(createdSociety.id, {
        primaryAdminUserId: createdAdmin.id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Society onboarded successfully",
      data: {
        society: createdSociety,
        admin: createdAdmin,
        tenant: await tenantModel.getTenantContextBySocietyId(createdSociety.id),
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Society code, slug, or subdomain already exists" });
    }

    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function listSocieties(req, res) {
  try {
    const societies = await tenantModel.listTenantSummaries();
    res.json({ success: true, data: societies });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getCurrentTenant(req, res) {
  try {
    const tenant = req.tenant || (req.user?.societyId ? await tenantModel.getTenantContextBySocietyId(req.user.societyId) : null);

    if (!tenant) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }

    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateBranding(req, res) {
  try {
    const societyId = Number(req.params.id);
    if (!canAccessSociety(req, societyId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await tenantModel.updateTenantBranding(societyId, req.body);
    res.json({ success: true, message: "Branding updated", data: await tenantModel.getTenantContextBySocietyId(societyId) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateSettings(req, res) {
  try {
    const societyId = Number(req.params.id);
    if (!canAccessSociety(req, societyId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await tenantModel.updateTenantSettings(societyId, req.body);
    res.json({ success: true, message: "Settings updated", data: await tenantModel.getTenantContextBySocietyId(societyId) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateSubscription(req, res) {
  try {
    const societyId = Number(req.params.id);
    if (!canAccessSociety(req, societyId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await tenantModel.updateTenantSubscription(societyId, req.body);
    await societyModel.updateSocietyById(societyId, {
      subscriptionPlan: req.body.planName || req.body.plan_name,
    });
    res.json({ success: true, message: "Subscription updated", data: await tenantModel.getTenantContextBySocietyId(societyId) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function toggleModule(req, res) {
  try {
    const societyId = Number(req.params.id);
    const moduleKey = normalizeIdentifier(req.params.moduleKey);

    if (!moduleKey) {
      return res.status(400).json({ success: false, message: "moduleKey is required" });
    }

    if (!canAccessSociety(req, societyId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const enabled = Boolean(req.body.enabled ?? req.body.isEnabled ?? true);
    await tenantModel.setModuleState(societyId, moduleKey, enabled, req.body.config || {});

    res.json({ success: true, message: "Module state updated", data: await tenantModel.getTenantContextBySocietyId(societyId) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getSocietyAnalytics(req, res) {
  try {
    const societyId = Number(req.params.id);
    if (!canAccessSociety(req, societyId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const analytics = await tenantModel.getSocietyAnalytics(societyId);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateBrandingByCode(req, res) {
  try {
    const society = await societyModel.getSocietyByCode(req.params.code);
    if (!society) {
      return res.status(404).json({ success: false, message: "Society not found" });
    }

    if (!canAccessSociety(req, society.id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await tenantModel.updateTenantBranding(society.id, req.body);
    res.json({ success: true, message: "Branding updated", data: await tenantModel.getTenantContextBySocietyId(society.id) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getDashboardOverview(req, res) {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const societies = await tenantModel.listTenantSummaries();
    const counts = {
      societies: societies.length,
      activeSocieties: societies.filter((item) => item.status === "active").length,
      trialSubscriptions: societies.filter((item) => item.subscription_status === "trial").length,
    };

    res.json({
      success: true,
      data: {
        counts,
        societies,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  onboardSociety,
  listSocieties,
  getCurrentTenant,
  updateBranding,
  updateSettings,
  updateSubscription,
  toggleModule,
  getSocietyAnalytics,
  updateBrandingByCode,
  getDashboardOverview,
};