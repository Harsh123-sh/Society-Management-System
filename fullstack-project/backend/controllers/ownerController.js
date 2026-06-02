const userModel = require("../models/userModel");

async function listOwners(req, res) {
  try {
    const search = req.query.search ? String(req.query.search).trim() : "";
    const societyId = req.headers["x-society-id"] ? Number(req.headers["x-society-id"]) : null;

    const users = await userModel.getAllUsers({ search, status: "", role: "resident" });
    // filter to owners and by society if provided
    const owners = users.filter((u) => u.resident_type === "owner" && (!societyId || u.society_id === societyId));

    res.json({ success: true, data: owners });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getOwnerProperties(req, res) {
  try {
    const ownerId = Number(req.params.id);
    if (!ownerId) return res.status(400).json({ success: false, message: "Invalid owner id" });

    const rows = await userModel.getOwnerPropertyRows(ownerId);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function assignOwnerToFlat(req, res) {
  try {
    const ownerId = Number(req.params.id);
    const { flatId, livingStartDate } = req.body;
    if (!ownerId || !flatId) return res.status(400).json({ success: false, message: "ownerId and flatId are required" });

    const insertedId = await userModel.createOwnerProperty({ userId: ownerId, flatId, livingStartDate });

    res.status(201).json({ success: true, message: "Owner assigned to flat", data: { id: insertedId } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function removeOwnerProperty(req, res) {
  try {
    const propertyId = Number(req.params.propertyId);
    if (!propertyId) return res.status(400).json({ success: false, message: "Invalid property id" });

    const deleted = await userModel.deleteOwnerPropertyById(propertyId);
    if (!deleted) return res.status(404).json({ success: false, message: "Property mapping not found" });

    res.json({ success: true, message: "Owner property mapping removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  listOwners,
  getOwnerProperties,
  assignOwnerToFlat,
  removeOwnerProperty,
};
