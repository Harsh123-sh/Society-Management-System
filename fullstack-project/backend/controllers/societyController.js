const societyModel = require("../models/societyModel");
const tenantModel = require("../models/tenantModel");
const structureModel = require("../models/societyStructureModel");

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
    const {
      code,
      name,
      slug,
      subdomain,
      defaultLanguage,
      subscriptionPlan,
      branding,
      settings,
      subscription,
      admin,
      structureSetup,
      structure,
      address,
      city,
      state,
      pincode,
    } = req.body;

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
      address,
      city,
      state,
      pincode,
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

    const setup = structureSetup || structure || null;
    if (setup && (Array.isArray(setup.towers) || Array.isArray(setup.gates))) {
      await structureModel.createStructureForSociety(society.id, setup, req.user?.id || null);
    }

    return res.status(201).json({
      success: true,
      message: "Society created successfully",
      data: await societyModel.getSocietyById(society.id),
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

async function updateSociety(req, res) {
  try {
    const societyId = Number(req.params.id);
    const society = await societyModel.updateSocietyById(societyId, req.body);
    if (!society) {
      return res.status(404).json({ success: false, message: "Society not found" });
    }

    const setup = req.body.structureSetup || req.body.structure || null;
    if (setup && (Array.isArray(setup.towers) || Array.isArray(setup.gates))) {
      await structureModel.createStructureForSociety(society.id, setup, req.user?.id || null);
    }

    return res.json({ success: true, message: "Society updated successfully", data: await societyModel.getSocietyById(society.id) });
  } catch (error) {
    if (error.code === "23505" || error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Society code already exists" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getSocieties,
  createSociety,
  updateSociety,
};
