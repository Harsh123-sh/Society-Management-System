const db = require("../config/db");

// ============ TOWERS ============

async function createTower({ societyId, builderId, name, code, totalFloors }) {
  const { rows: result } = await db.query(
    `INSERT INTO towers (society_id, builder_id, name, code, total_floors)
     VALUES (?, ?, ?, ?, ?)`,
    [societyId, builderId, name, code || null, totalFloors || null]
  );
  return getTowerById(result.insertId);
}

async function getTowerById(id) {
  const { rows } = await db.query(
    `SELECT id, society_id, builder_id, name, code, total_floors, created_at
     FROM towers WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listTowersBySociety(societyId, builderId) {
  const { rows } = await db.query(
    `SELECT id, society_id, builder_id, name, code, total_floors, created_at
     FROM towers WHERE society_id = ? AND builder_id = ? ORDER BY name ASC`,
    [societyId, builderId]
  );
  return rows;
}

async function updateTower(id, builderId, societyId, { name, code, totalFloors }) {
  await db.query(
    `UPDATE towers SET name = ?, code = ?, total_floors = ? 
     WHERE id = ? AND builder_id = ? AND society_id = ?`,
    [name, code || null, totalFloors || null, id, builderId, societyId]
  );
  return getTowerById(id);
}

async function deleteTower(id, builderId, societyId) {
  const result = await db.query(
    `DELETE FROM towers WHERE id = ? AND builder_id = ? AND society_id = ?`,
    [id, builderId, societyId]
  );
  return result[0].affectedRows > 0;
}

// ============ BLOCKS ============

async function createBlock({ societyId, builderId, towerId, name, code }) {
  const { rows: result } = await db.query(
    `INSERT INTO blocks (society_id, builder_id, tower_id, name, code)
     VALUES (?, ?, ?, ?, ?)`,
    [societyId, builderId, towerId, name || null, code || null]
  );
  return getBlockById(result.insertId);
}

async function getBlockById(id) {
  const { rows } = await db.query(
    `SELECT id, society_id, builder_id, tower_id, name, code, created_at
     FROM blocks WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listBlocksByTower(towerId, builderId, societyId) {
  const { rows } = await db.query(
    `SELECT id, society_id, builder_id, tower_id, name, code, created_at
     FROM blocks WHERE tower_id = ? AND builder_id = ? AND society_id = ?
     ORDER BY name ASC`,
    [towerId, builderId, societyId]
  );
  return rows;
}

// ============ FLOORS ============

async function createFloor({ societyId, builderId, towerId, floorNumber, floorName, totalUnits }) {
  const { rows: result } = await db.query(
    `INSERT INTO floors (society_id, builder_id, tower_id, floor_number, floor_name, total_units)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [societyId, builderId, towerId, floorNumber, floorName || null, totalUnits || null]
  );
  return getFloorById(result.insertId);
}

async function getFloorById(id) {
  const { rows } = await db.query(
    `SELECT id, society_id, builder_id, tower_id, floor_number, floor_name, total_units, created_at
     FROM floors WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listFloorsByTower(towerId, builderId, societyId) {
  const { rows } = await db.query(
    `SELECT id, society_id, builder_id, tower_id, floor_number, floor_name, total_units, created_at
     FROM floors WHERE tower_id = ? AND builder_id = ? AND society_id = ?
     ORDER BY floor_number ASC`,
    [towerId, builderId, societyId]
  );
  return rows;
}

async function getFloorsByTowerRange(towerId, builderId, societyId, startFloor, endFloor) {
  const { rows } = await db.query(
    `SELECT id, floor_number, floor_name, total_units
     FROM floors 
     WHERE tower_id = ? AND builder_id = ? AND society_id = ?
     AND floor_number >= ? AND floor_number <= ?
     ORDER BY floor_number ASC`,
    [towerId, builderId, societyId, startFloor, endFloor]
  );
  return rows;
}

// ============ STRUCTURE TREE ============

async function getCompleteStructure(societyId, builderId) {
  const towers = await listTowersBySociety(societyId, builderId);
  
  const result = [];
  for (const tower of towers) {
    const blocks = await listBlocksByTower(tower.id, builderId, societyId);
    const floors = await listFloorsByTower(tower.id, builderId, societyId);
    
    result.push({
      ...tower,
      blocks,
      floors,
    });
  }
  
  return result;
}

module.exports = {
  // Towers
  createTower,
  getTowerById,
  listTowersBySociety,
  updateTower,
  deleteTower,
  
  // Blocks
  createBlock,
  getBlockById,
  listBlocksByTower,
  
  // Floors
  createFloor,
  getFloorById,
  listFloorsByTower,
  getFloorsByTowerRange,
  
  // Structure
  getCompleteStructure,
};
