const parkingModel = require("../models/parkingModel");
const userModel = require("../models/userModel");
const flatModel = require("../models/flatModel");

async function createSlot(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const {
      slot_number,
      wing,
      floor,
      type,
      block,
    } = req.body;

    if (!slot_number || !wing) {
      return res.status(400).json({
        success: false,
        message: "slot_number and wing are required",
      });
    }

    if (!["2wheeler", "4wheeler"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "type must be 2wheeler or 4wheeler",
      });
    }

    const slot = await parkingModel.createParkingSlot({
      society_id: societyId,
      slot_number,
      wing,
      floor: floor || 1,
      type,
      block: block || null,
      status: "available",
    });

    res.status(201).json({
      success: true,
      message: "Parking slot created",
      data: slot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create parking slot",
    });
  }
}

async function getSlots(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const { status, wing, type } = req.query;

    const slots = await parkingModel.getParkingSlots({
      society_id: societyId,
      status: status || undefined,
      wing: wing || undefined,
      type: type || undefined,
    });

    res.json({
      success: true,
      data: slots,
      count: slots.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch parking slots",
    });
  }
}

async function getSlot(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const { id } = req.params;

    const slot = await parkingModel.getParkingSlotById(id, societyId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Parking slot not found",
      });
    }

    res.json({
      success: true,
      data: slot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch parking slot",
    });
  }
}

async function updateSlot(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const { id } = req.params;
    const { status, type } = req.body;

    const slot = await parkingModel.getParkingSlotById(id, societyId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Parking slot not found",
      });
    }

    await parkingModel.updateParkingSlot(id, {
      status: status || undefined,
      type: type || undefined,
    }, societyId);

    const updated = await parkingModel.getParkingSlotById(id, societyId);
    res.json({
      success: true,
      message: "Parking slot updated",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update parking slot",
    });
  }
}

async function assignSlot(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const { id } = req.params;
    const { user_id, flat_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    const slot = await parkingModel.getParkingSlotById(id, societyId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Parking slot not found",
      });
    }

    if (slot.status !== "available") {
      return res.status(400).json({
        success: false,
        message: "Slot is not available",
      });
    }

    const user = await userModel.getUserById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (societyId && user.society_id !== societyId) {
      return res.status(403).json({
        success: false,
        message: "Cannot assign parking across societies",
      });
    }

    if (flat_id) {
      const flat = await flatModel.getFlatById(flat_id, { societyId });
      if (!flat) {
        return res.status(404).json({ success: false, message: "Flat not found in current society" });
      }
    }

    await parkingModel.assignParkingSlot(id, user_id, flat_id || null, societyId);

    const updated = await parkingModel.getParkingSlotById(id, societyId);
    res.json({
      success: true,
      message: "Parking slot assigned",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to assign parking slot",
    });
  }
}

async function releaseSlot(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const { id } = req.params;

    const slot = await parkingModel.getParkingSlotById(id, societyId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Parking slot not found",
      });
    }

    await parkingModel.releaseParkingSlot(id, societyId);

    const updated = await parkingModel.getParkingSlotById(id, societyId);
    res.json({
      success: true,
      message: "Parking slot released",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to release parking slot",
    });
  }
}

async function deleteSlot(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const { id } = req.params;

    const slot = await parkingModel.getParkingSlotById(id, societyId);
    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Parking slot not found",
      });
    }

    await parkingModel.deleteParkingSlot(id, req.user.id, societyId);

    res.json({
      success: true,
      message: "Parking slot deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete parking slot",
    });
  }
}

async function getStatistics(req, res) {
  try {
    const societyId = req.user?.societyId || req.user?.society_id;
    const stats = await parkingModel.getParkingStatistics(societyId);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch parking statistics",
    });
  }
}

module.exports = {
  createSlot,
  getSlots,
  getSlot,
  updateSlot,
  assignSlot,
  releaseSlot,
  deleteSlot,
  getStatistics,
};