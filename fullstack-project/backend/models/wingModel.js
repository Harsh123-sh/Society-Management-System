const db = require("../db");

async function createWing({ 
  societyId, 
  name, 
  code, 
  towerId = null,
  createdBy 
}) {
  const [result] = await db.query(
    `INSERT INTO wings (
      society_id, builder_id, tower_id, name, code, created_by
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      societyId || null,
      null,
      towerId || null,
      String(name).trim(),
      code ? String(code).trim().toUpperCase() : null,
      createdBy || null,
    ]
  );

  return getWingById(result.insertId);
}

async function listWingsBySociety(societyId) {
  const [rows] = await db.query(
    `SELECT 
      id, society_id, builder_id, tower_id, name, code, created_by, created_at 
    FROM wings 
    WHERE society_id = ? 
    ORDER BY name ASC`,
    [societyId]
  );

  return rows;
}

async function getWingById(id) {
  const [rows] = await db.query(
    `SELECT 
      id, society_id, builder_id, tower_id, name, code, created_by, created_at 
    FROM wings 
    WHERE id = ? 
    LIMIT 1`, 
    [id]
  );
  return rows[0] || null;
}

async function updateWing(id, updateData) {
  const allowedFields = [
    'name', 'code', 'tower_id', 'builder_id', 'created_by'
  ];
  
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updateData)) {
    if (allowedFields.includes(key) && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (fields.length === 0) return getWingById(id);
  
  values.push(id);
  
  const query = `
    UPDATE wings 
    SET ${fields.join(', ')} 
    WHERE id = ?
  `;
  
  await db.query(query, values);
  return getWingById(id);
}

async function deleteWing(id) {
  const [result] = await db.query('DELETE FROM wings WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function getWingWithFlats(wingId) {
  const wing = await getWingById(wingId);
  if (!wing) return null;
  
  const [flats] = await db.query(
    `SELECT id, flat_number, floor, flat_type, status, approval_status 
    FROM flats 
    WHERE wing_id = ? 
    ORDER BY flat_number ASC`,
    [wingId]
  );
  
  return { ...wing, flats };
}

module.exports = {
  createWing,
  listWingsBySociety,
  getWingById,
  updateWing,
  deleteWing,
  getWingWithFlats,
};
