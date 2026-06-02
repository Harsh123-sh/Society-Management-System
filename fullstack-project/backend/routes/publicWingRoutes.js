const express = require("express");
const wingModel = require("../models/wingModel");
const societyModel = require("../models/societyModel");

const router = express.Router();

// Public: list wings by societyCode or societyId
router.get("/", async (req, res) => {
  try {
    const { societyCode, societyId } = req.query;

    let targetSocietyId = societyId ? Number(societyId) : null;
    if (!targetSocietyId && societyCode) {
      const society = await societyModel.getSocietyByCode(String(societyCode).trim());
      if (society) targetSocietyId = society.id;
    }

    if (!targetSocietyId) {
      return res.status(400).json({ success: false, message: "societyCode or societyId required" });
    }

    const wings = await wingModel.listWingsBySociety(targetSocietyId);
    return res.json({ success: true, data: wings });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
