const societyModel = require("../models/societyModel");
const tenantModel = require("../models/tenantModel");

async function getSocieties(_req, res) {
  try {
    const societies = await societyModel.listSocieties();
    res.json({ success: true, data: societies });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createSociety(req, res) {
  try {
    const { code, name, slug, subdomain, defaultLanguage, subscriptionPlan, branding, settings, subscription, admin } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: "code and name are required",
      });
    }

    const existingSociety = await societyModel.getSocietyByCode(code);
    if (existingSociety) {
      return res.status(409).json({
        success: false,
        message: "Society code already exists",
      });
    }

    const society = await tenantModel.createSocietyTenant({
      code,
      name,
      slug,
      subdomain,
      defaultLanguage,
      subscriptionPlan,
      ...(branding || {}),
      ...(settings || {}),
      ...(subscription || {}),
      createdBy: req.user?.id || null,
    });

    if (admin?.email && admin?.name && admin?.password) {
      const userModel = require("../models/userModel");
      const adminUser = await userModel.createUser({
        name: admin.name,
        email: admin.email,
        password: admin.password,
        role: "admin",
        residentType: null,
        status: admin.status || "active",
        isVerified: true,
        societyId: society.id,
      });

      await societyModel.updateSocietyById(society.id, {
        primaryAdminUserId: adminUser.id,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Society created successfully",
      data: society,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Society code already exists",
      });
    }

    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getSocieties,
  createSociety,
};
