const structureModel = require("../models/societyStructureModel");
const societyModel = require("../models/societyModel");

function getUserSocietyId(req, explicit = null) {
  if (req.user?.role === "super_admin" && explicit != null) return Number(explicit);
  return structureModel.resolveSocietyId(req.user || {}, explicit);
}

function sendError(res, error, fallback = "Internal server error") {
  if (error.code === "23505" || error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ success: false, message: "Duplicate structure record for this society" });
  }
  const payload = { success: false, message: fallback };
  if (process.env.NODE_ENV !== "production" && error) {
    payload.error = error.message || String(error);
    payload.stack = error.stack || null;
  }
  return res.status(500).json(payload);
}

async function getSocietyStructure(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.params.id || req.params.societyId || req.query.societyId);
    if (!societyId) return res.status(400).json({ success: false, message: "societyId is required" });
    const data = await structureModel.getSocietyStructure(societyId);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch society structure");
  }
}

async function publishSocietyStructure(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.params.id || req.params.societyId || req.body.societyId || req.body.society_id);
    if (!societyId) return res.status(400).json({ success: false, message: "societyId is required" });
    const payload = req.body || {};
    const data = await structureModel.createStructureForSociety(societyId, {
      towers: payload.towers || [],
      gates: payload.gates || [],
      parking: payload.parking || {},
      structureManagedBy: payload.structureManagedBy,
      structureStatus: payload.structureStatus,
    }, req.user?.id || null);
    await structureModel.refreshSocietyCounts(societyId);
    await societyModel.updateSocietyById(societyId, {
      status: "active",
      structureManagedBy: payload.structureManagedBy || "both",
      structureStatus: payload.structureStatus || "in_progress",
    });
    return res.status(201).json({ success: true, message: "Society structure published", data });
  } catch (error) {
    return sendError(res, error, "Failed to publish society structure");
  }
}

async function listTowers(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.params.societyId || req.query.societyId);
    const data = await structureModel.listTowers(societyId);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch towers");
  }
}

async function createTower(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.body?.society_id);
    if (!societyId) return res.status(400).json({ success: false, message: "societyId is required" });
    const data = await structureModel.createTower({
      societyId,
      towerName: req.body.towerName || req.body.tower_name || req.body.name,
      towerCode: req.body.towerCode || req.body.tower_code || req.body.code,
      totalFloors: req.body.totalFloors || req.body.total_floors,
      totalFlats: req.body.totalFlats || req.body.total_flats,
      flatsPerFloor: req.body.flatsPerFloor || req.body.flats_per_floor,
      flatNumberFormat: req.body.flatNumberFormat || req.body.flat_number_format,
      startingFloor: req.body.startingFloor || req.body.starting_floor,
      createdBy: req.user?.id || null,
    });
    return res.status(201).json({ success: true, message: "Tower created", data });
  } catch (error) {
    return sendError(res, error, "Failed to create tower");
  }
}

async function updateTower(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    const data = await structureModel.updateTower(Number(req.params.id), societyId, req.body);
    if (!data) return res.status(404).json({ success: false, message: "Tower not found" });
    return res.json({ success: true, message: "Tower updated", data });
  } catch (error) {
    return sendError(res, error, "Failed to update tower");
  }
}

async function deleteTower(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    await structureModel.deleteTower(Number(req.params.id), societyId);
    return res.json({ success: true, message: "Tower deleted" });
  } catch (error) {
    return sendError(res, error, "Failed to delete tower");
  }
}

async function listWings(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.params.societyId || req.query.societyId);
    const towerId = Number(req.params.towerId || req.query.towerId || req.query.tower_id || 0) || null;
    const data = await structureModel.listWings({ societyId, towerId });
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch wings");
  }
}

async function createWing(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.body?.society_id);
    const data = await structureModel.createWing({
      societyId,
      towerId: Number(req.body.towerId || req.body.tower_id || 0) || null,
      wingName: req.body.wingName || req.body.wing_name || req.body.name,
      wingCode: req.body.wingCode || req.body.wing_code || req.body.code,
      totalFloors: req.body.totalFloors || req.body.total_floors,
      totalFlats: req.body.totalFlats || req.body.total_flats,
      createdBy: req.user?.id || null,
    });
    return res.status(201).json({ success: true, message: "Wing created", data });
  } catch (error) {
    return sendError(res, error, "Failed to create wing");
  }
}

async function updateWing(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    const data = await structureModel.updateWing(Number(req.params.id), societyId, req.body);
    if (!data) return res.status(404).json({ success: false, message: "Wing not found" });
    return res.json({ success: true, message: "Wing updated", data });
  } catch (error) {
    return sendError(res, error, "Failed to update wing");
  }
}

async function deleteWing(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    await structureModel.deleteWing(Number(req.params.id), societyId);
    return res.json({ success: true, message: "Wing deleted" });
  } catch (error) {
    return sendError(res, error, "Failed to delete wing");
  }
}

async function listFloors(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.query.societyId);
    const data = await structureModel.listFloors({
      societyId,
      towerId: Number(req.query.towerId || req.query.tower_id || 0) || null,
      wingId: Number(req.params.wingId || req.query.wingId || req.query.wing_id || 0) || null,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch floors");
  }
}

async function createFloor(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.body?.society_id);
    const data = await structureModel.createFloor({
      societyId,
      towerId: Number(req.body.towerId || req.body.tower_id || 0) || null,
      wingId: Number(req.body.wingId || req.body.wing_id || 0) || null,
      floorNumber: req.body.floorNumber || req.body.floor_number,
      floorLabel: req.body.floorLabel || req.body.floor_label,
      totalFlats: req.body.totalFlats || req.body.total_flats,
    });
    return res.status(201).json({ success: true, message: "Floor saved", data });
  } catch (error) {
    return sendError(res, error, "Failed to save floor");
  }
}

async function updateFloor(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    const data = await structureModel.updateFloor(Number(req.params.id), societyId, req.body);
    if (!data) return res.status(404).json({ success: false, message: "Floor not found" });
    return res.json({ success: true, message: "Floor updated", data });
  } catch (error) {
    return sendError(res, error, "Failed to update floor");
  }
}

async function deleteFloor(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    await structureModel.deleteFloor(Number(req.params.id), societyId);
    return res.json({ success: true, message: "Floor deleted" });
  } catch (error) {
    return sendError(res, error, "Failed to delete floor");
  }
}

async function listFlats(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.query.societyId);
    const data = await structureModel.listFlats({
      societyId,
      towerId: Number(req.query.towerId || req.query.tower_id || 0) || null,
      wingId: Number(req.query.wingId || req.query.wing_id || 0) || null,
      floorId: Number(req.params.floorId || req.query.floorId || req.query.floor_id || 0) || null,
      vacantOnly: req.query.vacantOnly === "true" || req.query.vacant_only === "true",
    });
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch flats");
  }
}

async function createFlat(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.body?.society_id);
    const data = await structureModel.createFlat({
      societyId,
      towerId: Number(req.body.towerId || req.body.tower_id || 0) || null,
      wingId: Number(req.body.wingId || req.body.wing_id || 0) || null,
      floorId: Number(req.body.floorId || req.body.floor_id || 0) || null,
      flatNumber: req.body.flatNumber || req.body.flat_number,
      houseNumber: req.body.houseNumber || req.body.house_number,
      flatType: req.body.flatType || req.body.flat_type,
      bedrooms: req.body.bedrooms,
      areaSqft: req.body.areaSqft || req.body.area_sqft,
      createdBy: req.user?.id || null,
    });
    return res.status(201).json({ success: true, message: "Flat created", data });
  } catch (error) {
    return sendError(res, error, "Failed to create flat");
  }
}

async function updateFlat(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    const data = await structureModel.updateFlat(Number(req.params.id), societyId, req.body);
    if (!data) return res.status(404).json({ success: false, message: "Flat not found" });
    return res.json({ success: true, message: "Flat updated", data });
  } catch (error) {
    return sendError(res, error, "Failed to update flat");
  }
}

async function deleteFlat(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    await structureModel.deleteFlat(Number(req.params.id), societyId);
    return res.json({ success: true, message: "Flat deleted" });
  } catch (error) {
    return sendError(res, error, "Failed to delete flat");
  }
}

async function generateFlats(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.body?.society_id);
    const data = await structureModel.generateFlats({
      societyId,
      towerId: Number(req.body.towerId || req.body.tower_id || req.params.id || 0) || null,
      wingId: Number(req.body.wingId || req.body.wing_id || 0) || null,
      startFloor: req.body.startFloor || req.body.start_floor,
      floors: req.body.floors,
      flatsPerFloor: req.body.flatsPerFloor || req.body.flats_per_floor,
      prefix: req.body.prefix,
      pattern: req.body.pattern || req.body.flatNumberPattern || req.body.flat_number_pattern,
      flatType: req.body.flatType || req.body.flat_type,
      createdBy: req.user?.id || null,
    });
    return res.status(201).json({ success: true, message: "Flats generated", data, count: data.length });
  } catch (error) {
    return sendError(res, error, "Failed to generate flats");
  }
}

async function listGates(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.params.societyId || req.query.societyId);
    const data = await structureModel.listGates(societyId);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch gates");
  }
}

async function createGate(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.body?.society_id);
    const data = await structureModel.createGate({
      societyId,
      gateName: req.body.gateName || req.body.gate_name || req.body.name,
      gateNumber: req.body.gateNumber || req.body.gate_number || req.body.number,
      gateType: req.body.gateType || req.body.gate_type || req.body.type,
    });
    return res.status(201).json({ success: true, message: "Gate created", data });
  } catch (error) {
    return sendError(res, error, "Failed to create gate");
  }
}

async function updateGate(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    const data = await structureModel.updateGate(Number(req.params.id), societyId, req.body);
    if (!data) return res.status(404).json({ success: false, message: "Gate not found" });
    return res.json({ success: true, message: "Gate updated", data });
  } catch (error) {
    return sendError(res, error, "Failed to update gate");
  }
}

async function deleteGate(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    await structureModel.deleteGate(Number(req.params.id), societyId);
    return res.json({ success: true, message: "Gate deleted" });
  } catch (error) {
    return sendError(res, error, "Failed to delete gate");
  }
}

async function residentStructure(req, res) {
  try {
    const data = await structureModel.getResidentStructure(req.params.societyCode);
    if (!data) return res.status(404).json({ success: false, message: "Society not found" });
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch resident structure");
  }
}

async function profileStatus(req, res) {
  try {
    const data = await structureModel.getProfileStatus(req.user.id);
    return res.json({ success: true, data, completed: data?.approval_status === "approved", pending: data?.approval_status === "pending" });
  } catch (error) {
    return sendError(res, error, "Failed to fetch profile status");
  }
}

async function submitResidenceRequest(req, res) {
  try {
    const society =
      req.body.societyCode || req.body.society_code
        ? await societyModel.getSocietyByCode(req.body.societyCode || req.body.society_code)
        : await societyModel.getSocietyById(getUserSocietyId(req, req.body.societyId || req.body.society_id));
    if (!society) return res.status(404).json({ success: false, message: "Society not found" });
    const data = await structureModel.submitResidenceRequest({
      userId: req.user.id,
      societyId: society.id,
      towerId: req.body.towerId || req.body.tower_id,
      wingId: req.body.wingId || req.body.wing_id,
      floorId: req.body.floorId || req.body.floor_id,
      flatId: req.body.flatId || req.body.flat_id,
      residentType: req.body.residentType || req.body.resident_type || req.body.role,
      familyMembersCount: req.body.familyMembersCount || req.body.family_members_count,
      vehicleDetails: req.body.vehicleDetails || req.body.vehicle_details,
      documentUrl: req.body.documentUrl || req.body.document_url,
      moveInDate: req.body.moveInDate || req.body.move_in_date,
      ownerName: req.body.ownerName || req.body.owner_name,
      ownerContact: req.body.ownerContact || req.body.owner_contact,
    });
    return res.status(201).json({ success: true, message: "Residence request submitted", data });
  } catch (error) {
    return sendError(res, error, "Failed to submit residence request");
  }
}

async function listResidenceRequests(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.query.societyId);
    const data = await structureModel.listResidenceRequests(societyId);
    return res.json({ success: true, data });
  } catch (error) {
    return sendError(res, error, "Failed to fetch residence requests");
  }
}

async function approveResidenceRequest(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    const data = await structureModel.reviewResidenceRequest({
      requestId: Number(req.params.id),
      societyId,
      approved: true,
      reviewedBy: req.user?.id || null,
    });
    if (!data) {
      console.error("[approveResidenceRequest] review returned empty", { requestId: Number(req.params.id), societyId });
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    console.log("[approveResidenceRequest] Resident approved", { requestId: Number(req.params.id), societyId, reviewer: req.user?.id || null });
    return res.json({ success: true, message: "Resident approved successfully", data });
  } catch (error) {
    console.error("[approveResidenceRequest] error", error);
    if (error.code === "REQUEST_NOT_FOUND") return res.status(404).json({ success: false, message: "Request not found" });
    if (error.code === "RESIDENT_NOT_FOUND") return res.status(404).json({ success: false, message: "Resident not found" });
    if (error.code === "TOWER_NOT_FOUND") return res.status(404).json({ success: false, message: "Tower not found" });
    if (error.code === "WING_NOT_FOUND") return res.status(404).json({ success: false, message: "Wing not found" });
    if (error.code === "FLOOR_NOT_FOUND") return res.status(404).json({ success: false, message: "Floor not found" });
    if (error.code === "FLAT_NOT_FOUND") return res.status(404).json({ success: false, message: "Flat not found" });
    if (error.code === "FLAT_OCCUPIED") return res.status(409).json({ success: false, message: "Flat already occupied" });
    return sendError(res, error, "Database update failed");
  }
}

async function rejectResidenceRequest(req, res) {
  try {
    const societyId = getUserSocietyId(req, req.body?.societyId || req.query?.societyId);
    const data = await structureModel.reviewResidenceRequest({
      requestId: Number(req.params.id),
      societyId,
      approved: false,
      reviewedBy: req.user?.id || null,
      rejectionReason: req.body?.reason || req.body?.rejectionReason || req.body?.rejection_reason,
    });
    if (!data) return res.status(404).json({ success: false, message: "Residence request not found" });
    return res.json({ success: true, message: "Residence request rejected", data });
  } catch (error) {
    return sendError(res, error, "Failed to reject residence request");
  }
}

module.exports = {
  getSocietyStructure,
  publishSocietyStructure,
  listTowers,
  createTower,
  updateTower,
  deleteTower,
  listWings,
  createWing,
  updateWing,
  deleteWing,
  listFloors,
  createFloor,
  updateFloor,
  deleteFloor,
  listFlats,
  createFlat,
  updateFlat,
  deleteFlat,
  generateFlats,
  listGates,
  createGate,
  updateGate,
  deleteGate,
  residentStructure,
  profileStatus,
  submitResidenceRequest,
  listResidenceRequests,
  approveResidenceRequest,
  rejectResidenceRequest,
};
