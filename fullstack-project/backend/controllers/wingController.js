const wingModel = require("../models/wingModel");

async function listWings(req, res) {
  try {
    const societyId = req.tenant?.society?.id || req.user?.society_id || req.query.societyId;
    if (!societyId) {
      return res.status(400).json({ success: false, message: "societyId required" });
    }

    const wings = await wingModel.listWingsBySociety(societyId);
    res.json({ success: true, data: wings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createWing(req, res) {
  try {
    const societyId = req.tenant?.society?.id || req.body.societyId || req.user?.society_id;
    const { name, code } = req.body;

    if (!societyId || !name) {
      return res.status(400).json({ success: false, message: "societyId and name required" });
    }

    const wing = await wingModel.createWing({ societyId, name, code, createdBy: req.user?.id || null });
    res.status(201).json({ success: true, data: wing });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = { listWings, createWing };
