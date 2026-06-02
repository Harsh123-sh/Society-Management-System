const towerModel = require("../models/towerModel");

async function createTower(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const { towerName, totalFloors, flatsPerFloor, flatNumberFormat } = req.body;

    if (!towerName || !totalFloors || !flatsPerFloor) {
      return res.status(400).json({
        success: false,
        message: "towerName, totalFloors and flatsPerFloor are required",
      });
    }

    const tower = await towerModel.createTower({
      societyId,
      towerName,
      totalFloors: Number(totalFloors),
      flatsPerFloor: Number(flatsPerFloor),
      flatNumberFormat: flatNumberFormat || "floor_sequence",
      createdBy: req.user.id,
    });

    return res.status(201).json({ success: true, message: "Tower created", data: tower });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Tower already exists" });
    }
    return res.status(500).json({ success: false, message: "Failed to create tower" });
  }
}

async function getTowers(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const towers = await towerModel.listTowersWithStats({ societyId });
    return res.json({ success: true, data: towers, count: towers.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch towers" });
  }
}

async function generateFlats(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const towerId = Number(req.params.id);
    const { flatType } = req.body;

    if (!towerId) {
      return res.status(400).json({ success: false, message: "Valid tower id is required" });
    }

    const result = await towerModel.generateFlatsForTower({
      towerId,
      societyId,
      createdBy: req.user.id,
      flatType: flatType || null,
    });

    if (!result.tower) {
      return res.status(404).json({ success: false, message: "Tower not found" });
    }

    return res.json({ success: true, message: "Flats generated", data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to generate flats" });
  }
}

async function bulkArchiveFlats(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const flatIds = Array.isArray(req.body.flatIds) ? req.body.flatIds.map(Number).filter(Boolean) : [];
    const archived = await towerModel.bulkArchiveFlats({ flatIds, societyId });
    return res.json({ success: true, message: "Flats archived", archived });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to archive flats" });
  }
}

async function bulkDeleteFlats(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const flatIds = Array.isArray(req.body.flatIds) ? req.body.flatIds.map(Number).filter(Boolean) : [];
    const deleted = await towerModel.bulkDeleteFlats({ flatIds, societyId });
    return res.json({ success: true, message: "Flats deleted", deleted });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete flats" });
  }
}

module.exports = {
  createTower,
  getTowers,
  generateFlats,
  bulkArchiveFlats,
  bulkDeleteFlats,
};
