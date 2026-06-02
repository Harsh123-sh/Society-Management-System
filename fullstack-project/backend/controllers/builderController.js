const builderModel = require("../models/builderModel");
const societyModel = require("../models/societyModel");
const { verifyBuilderOwnership } = require("../middleware/multiTenantMiddleware");

/**
 * Get builder profile (for builder admin)
 */
async function getProfile(req, res) {
  try {
    if (!req.builder) {
      return res.status(403).json({ success: false, message: "Builder context required" });
    }

    const builder = await builderModel.getBuilderById(req.builder.id);
    const societyCount = await builderModel.getSocietyCountForBuilder(req.builder.id);
    const userCount = await builderModel.getUserCountForBuilder(req.builder.id);

    return res.json({
      success: true,
      data: {
        ...builder,
        societyCount,
        userCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * List societies for builder
 */
async function listSocieties(req, res) {
  try {
    if (!req.builder) {
      return res.status(403).json({ success: false, message: "Builder context required" });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const societies = await societyModel.listSocietiesByBuilder(req.builder.id, limit, offset);
    const total = await societyModel.getSocietyCountByBuilder(req.builder.id);

    return res.json({
      success: true,
      data: societies,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Super admin: Get all builders
 */
async function listBuilders(req, res) {
  try {
    // Check if user is super admin
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const builders = await builderModel.listBuilders(limit, offset);
    return res.json({
      success: true,
      data: builders,
      pagination: { limit, offset },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Super admin: Get builder details
 */
async function getBuilderDetails(req, res) {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }

    const builderId = Number(req.params.id);
    const builder = await builderModel.getBuilderById(builderId);

    if (!builder) {
      return res.status(404).json({ success: false, message: "Builder not found" });
    }

    const societyCount = await builderModel.getSocietyCountForBuilder(builderId);
    const userCount = await builderModel.getUserCountForBuilder(builderId);

    return res.json({
      success: true,
      data: {
        ...builder,
        societyCount,
        userCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Super admin: Create builder
 */
async function createBuilder(req, res) {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }

    const { name, email, slug, logoUrl, website, subscriptionPlan, maxSocieties, maxUsers } = req.body;

    if (!name || !email || !slug) {
      return res.status(400).json({ success: false, message: "name, email, and slug required" });
    }

    const existing = await builderModel.getBuilderByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    const builder = await builderModel.createBuilder({
      name,
      email,
      slug,
      logoUrl: logoUrl || null,
      website: website || null,
      subscriptionPlan: subscriptionPlan || "starter",
      maxSocieties: maxSocieties || 10,
      maxUsers: maxUsers || 1000,
    });

    return res.status(201).json({ success: true, data: builder });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Email or slug already exists" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Super admin: Update builder
 */
async function updateBuilder(req, res) {
  try {
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }

    const builderId = Number(req.params.id);
    const builder = await builderModel.getBuilderById(builderId);

    if (!builder) {
      return res.status(404).json({ success: false, message: "Builder not found" });
    }

    const updated = await builderModel.updateBuilder(builderId, req.body);
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/**
 * Builder dashboard overview
 */
async function getDashboardOverview(req, res) {
  try {
    if (!req.builder) {
      return res.status(403).json({ success: false, message: "Builder context required" });
    }

    const builder = await builderModel.getBuilderById(req.builder.id);
    const societyCount = await builderModel.getSocietyCountForBuilder(req.builder.id);
    const userCount = await builderModel.getUserCountForBuilder(req.builder.id);

    return res.json({
      success: true,
      data: {
        builder: {
          id: builder.id,
          name: builder.name,
          email: builder.email,
          status: builder.status,
          subscriptionPlan: builder.subscription_plan,
        },
        metrics: {
          totalSocieties: societyCount,
          totalUsers: userCount,
          totalStorage: 0, // To be calculated
          activeSubscriptions: societyCount,
        },
        limits: {
          maxSocieties: builder.max_societies,
          maxUsers: builder.max_users,
          usedSocieties: societyCount,
          usedUsers: userCount,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getProfile,
  listSocieties,
  listBuilders,
  getBuilderDetails,
  createBuilder,
  updateBuilder,
  getDashboardOverview,
};
