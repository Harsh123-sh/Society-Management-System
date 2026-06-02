const flatModel = require("../models/flatModel");
const userModel = require("../models/userModel");

async function addFlat(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const { buildingName, wingId, wing, flatNumber, floor, flatType } = req.body;

    if (!buildingName || !flatNumber) {
      return res.status(400).json({
        success: false,
        message: "buildingName and flatNumber are required",
      });
    }

    const flatId = await flatModel.createFlat({
      societyId,
      buildingName,
      wingId: wingId || null,
      wing: wing || null,
      flatNumber,
      floor,
      flatType,
      createdBy: req.user.id,
    });

    const flat = await flatModel.getFlatById(flatId, { societyId });

    res.status(201).json({
      success: true,
      message: "Flat added successfully",
      data: flat,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Flat already exists in this building",
      });
    }

    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function assignResident(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const flatId = Number(req.params.id);
    const { residentId, moveInDate } = req.body;

    if (!flatId || !residentId) {
      return res.status(400).json({
        success: false,
        message: "flat id and residentId are required",
      });
    }

    const flat = await flatModel.getFlatById(flatId, { societyId });
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    const resident = await userModel.getUserById(residentId);
    if (!resident || resident.role !== "resident") {
      return res.status(404).json({
        success: false,
        message: "Resident not found",
      });
    }

    if (societyId && resident.society_id !== societyId) {
      return res.status(403).json({ success: false, message: "Resident must belong to current society" });
    }

    await flatModel.assignResidentToFlat({
      flatId,
      residentId,
      assignedBy: req.user.id,
      moveInDate,
    });

    const currentAssignment = await flatModel.getCurrentAssignment(flatId);

    res.json({
      success: true,
      message: "Resident assigned to flat",
      data: currentAssignment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function unassignResident(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const flatId = Number(req.params.id);

    if (!flatId) {
      return res.status(400).json({
        success: false,
        message: "Valid flat id is required",
      });
    }

    const flat = await flatModel.getFlatById(flatId, { societyId });
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    const updated = await flatModel.unassignResidentFromFlat(flatId);
    if (!updated) {
      return res.status(400).json({
        success: false,
        message: "No active resident assignment for this flat",
      });
    }

    res.json({
      success: true,
      message: "Resident unassigned and flat marked vacant",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getFlats(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id || null;
    const wingId = req.query.wingId ? Number(req.query.wingId) : null;
    const wing = req.query.wing ? String(req.query.wing).trim().toUpperCase() : "";
    const search = req.query.search ? String(req.query.search).trim() : "";
    const approvalStatus = req.query.approvalStatus
      ? String(req.query.approvalStatus).trim().toLowerCase()
      : "";
    const flats = await flatModel.getFlatsWithOccupancy({
      societyId,
      wingId,
      wing,
      search,
      approvalStatus,
    });
    res.json({ success: true, data: flats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function approveFlat(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const flatId = Number(req.params.id);

    if (!flatId) {
      return res.status(400).json({
        success: false,
        message: "Valid flat id is required",
      });
    }

    const flat = await flatModel.getFlatById(flatId, { societyId });
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found",
      });
    }

    if (flat.approval_status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Flat is already approved",
      });
    }

    const approved = await flatModel.approveFlatById({
      flatId,
      approvedBy: req.user.id,
    });

    return res.json({
      success: true,
      message: "Flat approved successfully",
      data: approved,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateFlat(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const flatId = Number(req.params.id);
    const { flatType, occupancyStatus, status } = req.body;

    const flat = await flatModel.getFlatById(flatId, { societyId });
    if (!flat) {
      return res.status(404).json({ success: false, message: "Flat not found" });
    }

    const updated = await flatModel.updateFlatById({
      flatId,
      societyId,
      flatType: flatType || null,
      occupancyStatus: occupancyStatus || null,
      status: status || null,
      approvedBy: req.user.id,
    });

    return res.json({ success: true, message: "Flat updated successfully", data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function archiveFlat(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const flatId = Number(req.params.id);
    const archived = await flatModel.archiveFlatById({ flatId, societyId });
    if (!archived) {
      return res.status(404).json({ success: false, message: "Flat not found" });
    }
    return res.json({ success: true, message: "Flat archived successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteFlat(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const flatId = Number(req.params.id);
    const deleted = await flatModel.deleteFlatById({ flatId, societyId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Flat not found" });
    }
    return res.json({ success: true, message: "Flat deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getOccupancyHistory(req, res) {
  try {
    const history = await flatModel.getOccupancyHistory();
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMyFlats(req, res) {
  try {
    const flats = await flatModel.getFlatsForResident(req.user.id);
    res.json({ success: true, data: flats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function getMyPropertySummary(req, res) {
  try {
    const summaryRows = await flatModel.getResidentPropertySummary(req.user.id);

    const groupedByFlat = summaryRows.reduce((acc, row) => {
      if (!acc[row.flat_id]) {
        acc[row.flat_id] = {
          flat_id: row.flat_id,
          building_name: row.building_name,
          flat_number: row.flat_number,
          floor: row.floor,
          flat_type: row.flat_type,
          owner_id: row.owner_id,
          owner_name: row.owner_name,
          owner_email: row.owner_email,
          owner_resident_type: row.owner_resident_type,
          tenants: [],
        };
      }

      if (row.tenant_id) {
        acc[row.flat_id].tenants.push({
          id: row.tenant_id,
          name: row.tenant_name,
          email: row.tenant_email,
        });
      }

      return acc;
    }, {});

    return res.json({
      success: true,
      data: Object.values(groupedByFlat),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createFlatsBulk(req, res) {
  try {
    const { buildingName, wing, floors = 1, flatsPerFloor = 2, floorStart = 1 } = req.body;
    const societyId = req.user?.societyId || req.user?.society_id || null;

    if (!buildingName || !wing) {
      return res.status(400).json({ success: false, message: "buildingName and wing are required" });
    }

    const created = [];

    for (let f = 0; f < Number(floors); f++) {
      const floorNum = Number(floorStart) + f;
      for (let i = 1; i <= Number(flatsPerFloor); i++) {
        const flatNumber = `${wing}-${String(floorNum)}${String(i).padStart(2, "0")}`;
        try {
          const flatId = await flatModel.createFlat({
            societyId,
            buildingName,
            wing,
            flatNumber,
            floor: floorNum,
            flatType: null,
            createdBy: req.user.id,
          });
          const flat = await flatModel.getFlatById(flatId);
          created.push(flat);
        } catch (err) {
          // ignore duplicates or continue
        }
      }
    }

    res.status(201).json({ success: true, message: "Flats generated", data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  addFlat,
  createFlatsBulk,
  assignResident,
  unassignResident,
  getFlats,
  approveFlat,
  updateFlat,
  archiveFlat,
  deleteFlat,
  getOccupancyHistory,
  getMyFlats,
  getMyPropertySummary,
};
