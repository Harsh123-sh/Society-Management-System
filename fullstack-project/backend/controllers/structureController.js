const structureModel = require("../models/structureModel");
const { verifySocietyOwnership } = require("../middleware/multiTenantMiddleware");

// ============ TOWERS ============

async function listTowers(req, res) {
  try {
    if (!req.society) {
      return res.status(400).json({ success: false, message: "Society context required" });
    }

    const towers = await structureModel.listTowersBySociety(req.society.id, req.society.builderId);
    return res.json({ success: true, data: towers });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createTower(req, res) {
  try {
    if (!req.society) {
      return res.status(400).json({ success: false, message: "Society context required" });
    }

    const { name, code, totalFloors } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Tower name required" });
    }

    const tower = await structureModel.createTower({
      societyId: req.society.id,
      builderId: req.society.builderId,
      name,
      code: code || null,
      totalFloors: totalFloors || null,
    });

    return res.status(201).json({ success: true, data: tower });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Tower code already exists" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateTower(req, res) {
  try {
    if (!req.society) {
      return res.status(400).json({ success: false, message: "Society context required" });
    }

    const towerId = Number(req.params.id);
    const tower = await structureModel.getTowerById(towerId);
    if (!tower) {
      return res.status(404).json({ success: false, message: "Tower not found" });
    }

    const owned = await verifySocietyOwnership(req.society.id, req.society.builderId, tower.society_id, tower.builder_id);
    if (!owned) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updated = await structureModel.updateTower(towerId, req.society.builderId, req.society.id, req.body);
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function deleteTower(req, res) {
  try {
    if (!req.society) {
      return res.status(400).json({ success: false, message: "Society context required" });
    }

    const towerId = Number(req.params.id);
    const tower = await structureModel.getTowerById(towerId);
    if (!tower) {
      return res.status(404).json({ success: false, message: "Tower not found" });
    }

    const owned = await verifySocietyOwnership(req.society.id, req.society.builderId, tower.society_id, tower.builder_id);
    if (!owned) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const deleted = await structureModel.deleteTower(towerId, req.society.builderId, req.society.id);
    if (!deleted) {
      return res.status(400).json({ success: false, message: "Could not delete tower" });
    }

    return res.json({ success: true, message: "Tower deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ============ BLOCKS ============

async function listBlocks(req, res) {
  try {
    if (!req.society) {
      return res.status(400).json({ success: false, message: "Society context required" });
    }

    const towerId = Number(req.query.towerId);
    if (!towerId) {
      return res.status(400).json({ success: false, message: "towerId required" });
    }

    const blocks = await structureModel.listBlocksByTower(towerId, req.society.builderId, req.society.id);
    return res.json({ success: true, data: blocks });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createBlock(req, res) {
  try {
    if (!req.society) {
      return res.status(400).json({ success: false, message: "Society context required" });
    }

    const { towerId, name, code } = req.body;
    if (!towerId) {
      return res.status(400).json({ success: false, message: "towerId required" });
    }

    const block = await structureModel.createBlock({
      societyId: req.society.id,
      builderId: req.society.builderId,
      towerId,
      name: name || null,
      code: code || null,
    });

    return res.status(201).json({ success: true, data: block });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ============ FLOORS ============

async function listFloors(req, res) {
  try {
    if (!req.society) {
      return res.status(400).json({ success: false, message: "Society context required" });
    }

    const towerId = Number(req.query.towerId);
    if (!towerId) {
      return res.status(400).json({ success: false, message: "towerId required" });
    }

    const floors = await structureModel.listFloorsByTower(towerId, req.society.builderId, req.society.id);
    return res.json({ success: true, data: floors });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createFloor(req, res) {
  try {
    if (!req.society) {
      return res.status(400).json({ success: false, message: "Society context required" });
    }

    const { towerId, floorNumber, floorName, totalUnits } = req.body;
    if (!towerId || !floorNumber) {
      return res.status(400).json({ success: false, message: "towerId and floorNumber required" });
    }

    const floor = await structureModel.createFloor({
      societyId: req.society.id,
      builderId: req.society.builderId,
      towerId,
      floorNumber: Number(floorNumber),
      floorName: floorName || null,
      totalUnits: totalUnits || null,
    });

    return res.status(201).json({ success: true, data: floor });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Floor already exists for this tower" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// ============ COMPLETE STRUCTURE ============

async function getStructureTree(req, res) {
  try {
    if (!req.society) {
      return res.status(400).json({ success: false, message: "Society context required" });
    }

    const structure = await structureModel.getCompleteStructure(req.society.id, req.society.builderId);
    return res.json({ success: true, data: structure });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  listTowers,
  createTower,
  updateTower,
  deleteTower,
  listBlocks,
  createBlock,
  listFloors,
  createFloor,
  getStructureTree,
};
