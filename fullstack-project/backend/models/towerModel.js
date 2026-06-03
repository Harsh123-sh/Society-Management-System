const db = require("../db");

function normalizeText(value) {
  return String(value || "").trim();
}

function slugBase(value) {
  return normalizeText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function deriveTowerCode(towerName, existingCodes = new Set()) {
  const baseWords = slugBase(towerName).split(/\s+/).filter(Boolean);
  let code = baseWords[0]?.slice(0, 3) || "T";
  code = code.replace(/[^A-Z0-9]/g, "");

  if (!code) code = "T";
  let candidate = code;
  let suffix = 2;
  while (existingCodes.has(candidate)) {
    candidate = `${code}${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function buildFlatNumber({ format, floor, sequence, towerCode }) {
  const floorNumber = Number(floor);
  const flatSequence = Number(sequence);
  if (format === "floor_pad_sequence") {
    return `${String(floorNumber).padStart(2, "0")}${String(flatSequence).padStart(2, "0")}`;
  }
  if (format === "custom") {
    return `${towerCode}${floorNumber}${String(flatSequence).padStart(2, "0")}`;
  }
  return `${floorNumber}${String(flatSequence).padStart(2, "0")}`;
}

async function getTowerById(towerId, societyId = null) {
  const { rows } = await db.query(
    `SELECT id, society_id, tower_name, tower_code, total_floors, flats_per_floor, flat_number_format,
            starting_floor, status, created_by, created_at, updated_at
     FROM towers
     WHERE id = ?
       ${societyId ? "AND society_id = ?" : ""}
     LIMIT 1`,
    [towerId, ...(societyId ? [societyId] : [])]
  );
  return rows[0] || null;
}

async function listTowersWithStats({ societyId } = {}) {
  const params = [];
  const filters = [];
  if (societyId) {
    filters.push("t.society_id = ?");
    params.push(societyId);
  }
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const { rows } = await db.query(
    `SELECT t.id, t.society_id, t.tower_name, t.tower_code, t.total_floors, t.flats_per_floor, t.flat_number_format,
            t.starting_floor, t.status, t.created_by, t.created_at, t.updated_at,
            COUNT(f.id) AS total_flats,
            SUM(CASE WHEN f.occupancy_status = 'vacant' THEN 1 ELSE 0 END) AS vacant_flats,
            SUM(CASE WHEN f.occupancy_status = 'owner_occupied' THEN 1 ELSE 0 END) AS owner_occupied_flats,
            SUM(CASE WHEN f.occupancy_status = 'tenant_occupied' THEN 1 ELSE 0 END) AS tenant_occupied_flats,
            SUM(CASE WHEN f.occupancy_status = 'reserved' THEN 1 ELSE 0 END) AS reserved_flats,
            SUM(CASE WHEN f.occupancy_status = 'under_maintenance' THEN 1 ELSE 0 END) AS maintenance_flats
     FROM towers t
     LEFT JOIN flats f ON f.tower_id = t.id AND f.archived_at IS NULL
     ${whereClause}
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    params
  );
  return rows;
}

async function createTower({ societyId, towerName, totalFloors, flatsPerFloor, flatNumberFormat, createdBy }) {
  const existing = await listTowersWithStats({ societyId });
  const existingCodes = new Set(existing.map((tower) => String(tower.tower_code || "").toUpperCase()));
  const towerCode = deriveTowerCode(towerName, existingCodes);

  const { rows: result } = await db.query(
    `INSERT INTO towers (
      society_id, tower_name, tower_code, total_floors, flats_per_floor, flat_number_format, created_by
     ) VALUES (?, ?, ?, ?, ?, ?, ?)` ,
    [societyId, normalizeText(towerName), towerCode, Number(totalFloors) || 1, Number(flatsPerFloor) || 1, flatNumberFormat || "floor_sequence", createdBy]
  );

  return getTowerById(result.insertId, societyId);
}

async function generateFlatsForTower({ towerId, societyId, createdBy, flatType = null }) {
  const tower = await getTowerById(towerId, societyId);
  if (!tower) return { tower: null, created: 0, flats: [] };

  const generated = [];
  const floorStart = Number(tower.starting_floor) || 1;
  const towerCode = tower.tower_code;

  for (let floor = floorStart; floor < floorStart + Number(tower.total_floors || 1); floor += 1) {
    for (let sequence = 1; sequence <= Number(tower.flats_per_floor || 1); sequence += 1) {
      generated.push({
        societyId,
        towerId: tower.id,
        buildingName: tower.tower_name,
        wing: towerCode,
        flatNumber: buildFlatNumber({ format: tower.flat_number_format, floor, sequence, towerCode }),
        floor,
        flatType,
        occupancyStatus: "vacant",
        approvalStatus: "approved",
        createdBy,
      });
    }
  }

  const connection = await db.getConnection();
  const inserted = [];
  try {
    await connection.beginTransaction();
    for (const row of generated) {
      const [result] = await connection.query(
        `INSERT IGNORE INTO flats (
          society_id, tower_id, building_name, wing, flat_number, floor, flat_type, status, occupancy_status, approval_status, created_by
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 'vacant', ?, ?, ?)` ,
        [row.societyId, row.towerId, row.buildingName, row.wing, row.flatNumber, String(row.floor), row.flatType, row.occupancyStatus, row.approvalStatus, row.createdBy]
      );
      if (result.affectedRows) {
        inserted.push(row);
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return { tower, created: inserted.length, flats: inserted };
}

async function bulkArchiveFlats({ flatIds, societyId }) {
  if (!flatIds.length) return 0;
  const { rows: result } = await db.query(
    `UPDATE flats
     SET archived_at = NOW(), status = 'vacant', occupancy_status = 'vacant'
     WHERE society_id = ? AND id IN (?)`,
    [societyId, flatIds]
  );
  return result.affectedRows || 0;
}

async function bulkDeleteFlats({ flatIds, societyId }) {
  if (!flatIds.length) return 0;
  const { rows: result } = await db.query(
    `DELETE FROM flats
     WHERE society_id = ? AND id IN (?)
       AND id NOT IN (
         SELECT DISTINCT flat_id FROM flat_residents WHERE is_active = 1
       )`,
    [societyId, flatIds]
  );
  return result.affectedRows || 0;
}

module.exports = {
  createTower,
  generateFlatsForTower,
  getTowerById,
  listTowersWithStats,
  bulkArchiveFlats,
  bulkDeleteFlats,
};
