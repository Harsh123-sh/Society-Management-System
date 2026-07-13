const db = require("../config/db");
const societyModel = require("./societyModel");

let schemaReady = false;

function clean(value) {
  return String(value || "").trim();
}

function upper(value) {
  return clean(value).toUpperCase();
}

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeStatus(value, fallback = "active") {
  return clean(value).toLowerCase().replace(/\s+/g, "_") || fallback;
}

function resolveSocietyId(user, explicitSocietyId = null) {
  if (explicitSocietyId) return Number(explicitSocietyId);
  return Number(user?.societyId || user?.society_id || 0) || null;
}

async function ensureStructureSchema() {
  if (schemaReady) return;

  await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_towers INT DEFAULT 0`);
  await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_wings INT DEFAULT 0`);
  await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_floors INT DEFAULT 0`);
  await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_flats INT DEFAULT 0`);
  await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS total_gates INT DEFAULT 0`);
  await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS towers (
      id SERIAL PRIMARY KEY,
      society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      tower_name VARCHAR(120) NOT NULL,
      tower_code VARCHAR(40) NOT NULL,
      total_floors INT DEFAULT 0,
      total_flats INT DEFAULT 0,
      flats_per_floor INT DEFAULT 0,
      flat_number_format VARCHAR(50) DEFAULT 'floor_sequence',
      starting_floor INT DEFAULT 1,
      status VARCHAR(50) DEFAULT 'active',
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`ALTER TABLE towers ADD COLUMN IF NOT EXISTS total_flats INT DEFAULT 0`);
  await db.query(`ALTER TABLE towers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_towers_society_code_active ON towers(society_id, tower_code) WHERE status != 'deleted'`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_towers_society_id ON towers(society_id)`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS wings (
      id SERIAL PRIMARY KEY,
      society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      tower_id INT REFERENCES towers(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      code VARCHAR(40) NOT NULL,
      total_floors INT DEFAULT 0,
      total_flats INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`ALTER TABLE wings ADD COLUMN IF NOT EXISTS total_floors INT DEFAULT 0`);
  await db.query(`ALTER TABLE wings ADD COLUMN IF NOT EXISTS total_flats INT DEFAULT 0`);
  await db.query(`ALTER TABLE wings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_wings_tower_code_active ON wings(tower_id, code) WHERE status != 'deleted'`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_wings_society_id ON wings(society_id)`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS floors (
      id SERIAL PRIMARY KEY,
      society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      tower_id INT REFERENCES towers(id) ON DELETE CASCADE,
      wing_id INT REFERENCES wings(id) ON DELETE CASCADE,
      floor_number INT NOT NULL,
      floor_label VARCHAR(80),
      total_flats INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`ALTER TABLE floors ADD COLUMN IF NOT EXISTS wing_id INT REFERENCES wings(id) ON DELETE CASCADE`);
  await db.query(`ALTER TABLE floors ADD COLUMN IF NOT EXISTS floor_label VARCHAR(80)`);
  await db.query(`ALTER TABLE floors ADD COLUMN IF NOT EXISTS total_flats INT DEFAULT 0`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_floors_wing_number ON floors(society_id, COALESCE(tower_id, 0), COALESCE(wing_id, 0), floor_number)`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS flats (
      id SERIAL PRIMARY KEY,
      society_id INT REFERENCES societies(id) ON DELETE CASCADE,
      tower_id INT REFERENCES towers(id) ON DELETE SET NULL,
      wing_id INT REFERENCES wings(id) ON DELETE SET NULL,
      floor_id INT REFERENCES floors(id) ON DELETE SET NULL,
      building_name VARCHAR(120),
      wing VARCHAR(100),
      flat_number VARCHAR(50) NOT NULL,
      house_number VARCHAR(80),
      floor VARCHAR(50),
      flat_type VARCHAR(80),
      bedrooms INT,
      area_sqft NUMERIC(10,2),
      status VARCHAR(50) DEFAULT 'vacant',
      occupancy_status VARCHAR(50) DEFAULT 'vacant',
      owner_id INT REFERENCES users(id) ON DELETE SET NULL,
      tenant_id INT REFERENCES users(id) ON DELETE SET NULL,
      parking_slot_id INT,
      approval_status VARCHAR(50) DEFAULT 'approved',
      approved_by INT REFERENCES users(id) ON DELETE SET NULL,
      approved_at TIMESTAMP,
      archived_at TIMESTAMP,
      created_by INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS tower_id INT REFERENCES towers(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS wing_id INT REFERENCES wings(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS floor_id INT REFERENCES floors(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS house_number VARCHAR(80)`);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS bedrooms INT`);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS area_sqft NUMERIC(10,2)`);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS owner_id INT REFERENCES users(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES users(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS parking_slot_id INT`);
  await db.query(`ALTER TABLE flats ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_flats_floor_number_active ON flats(society_id, COALESCE(tower_id, 0), COALESCE(wing_id, 0), COALESCE(floor_id, 0), flat_number) WHERE archived_at IS NULL`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_flats_society_id ON flats(society_id)`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS gates (
      id SERIAL PRIMARY KEY,
      society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      gate_name VARCHAR(120) NOT NULL,
      gate_number VARCHAR(40) NOT NULL,
      gate_type VARCHAR(50) DEFAULT 'main',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_gates_society_number_active ON gates(society_id, gate_number) WHERE status != 'deleted'`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS parking_slots (
      id SERIAL PRIMARY KEY,
      society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      tower_id INT REFERENCES towers(id) ON DELETE SET NULL,
      wing_id INT REFERENCES wings(id) ON DELETE SET NULL,
      flat_id INT REFERENCES flats(id) ON DELETE SET NULL,
      slot_number VARCHAR(80) NOT NULL,
      vehicle_type VARCHAR(50) DEFAULT 'car',
      status VARCHAR(50) DEFAULT 'available',
      deleted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS tower_id INT REFERENCES towers(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS wing_id INT REFERENCES wings(id) ON DELETE SET NULL`);
  await db.query(`ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP`);
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_parking_society_slot_active ON parking_slots(society_id, slot_number) WHERE deleted_at IS NULL`);

  await db.query(`
    CREATE TABLE IF NOT EXISTS resident_profiles (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      society_id INT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      flat_id INT REFERENCES flats(id) ON DELETE SET NULL,
      tower_id INT REFERENCES towers(id) ON DELETE SET NULL,
      wing_id INT REFERENCES wings(id) ON DELETE SET NULL,
      floor_id INT REFERENCES floors(id) ON DELETE SET NULL,
      resident_type VARCHAR(50) NOT NULL,
      family_members_count INT DEFAULT 0,
      vehicle_details JSONB,
      document_url VARCHAR(500),
      move_in_date DATE,
      ownership_status VARCHAR(50),
      owner_name VARCHAR(160),
      owner_contact VARCHAR(80),
      approval_status VARCHAR(50) DEFAULT 'pending',
      reviewed_by INT REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMP,
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_resident_profiles_society_status ON resident_profiles(society_id, approval_status)`);

  schemaReady = true;
}

async function refreshSocietyCounts(societyId) {
  await ensureStructureSchema();
  await db.query(
    `UPDATE societies
     SET total_towers = (SELECT COUNT(*) FROM towers WHERE society_id = $1 AND status != 'deleted'),
         total_wings = (SELECT COUNT(*) FROM wings WHERE society_id = $1 AND status != 'deleted'),
         total_floors = (SELECT COUNT(*) FROM floors WHERE society_id = $1),
         total_flats = (SELECT COUNT(*) FROM flats WHERE society_id = $1 AND archived_at IS NULL),
         total_gates = (SELECT COUNT(*) FROM gates WHERE society_id = $1 AND status != 'deleted'),
         updated_at = NOW()
     WHERE id = $1`,
    [societyId]
  );
}

async function createTower({ societyId, towerName, towerCode, totalFloors = 0, totalFlats = 0, flatsPerFloor = 0, flatNumberFormat = "floor_sequence", startingFloor = 1, createdBy = null }) {
  await ensureStructureSchema();
  const name = clean(towerName);
  const code = upper(towerCode || towerName).replace(/[^A-Z0-9]+/g, "").slice(0, 40) || "TOWER";
  const { rows } = await db.query(
    `INSERT INTO towers (society_id, tower_name, tower_code, total_floors, total_flats, flats_per_floor, flat_number_format, starting_floor, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [societyId, name, code, toInt(totalFloors), toInt(totalFlats), toInt(flatsPerFloor), flatNumberFormat || "floor_sequence", toInt(startingFloor, 1), createdBy]
  );
  await refreshSocietyCounts(societyId);
  return rows[0];
}

async function listTowers(societyId) {
  await ensureStructureSchema();
  const { rows } = await db.query(
    `SELECT t.*,
            COUNT(DISTINCT w.id) AS wing_count,
            COUNT(DISTINCT fl.id) AS floor_count,
            COUNT(DISTINCT f.id) FILTER (WHERE f.archived_at IS NULL) AS flat_count
     FROM towers t
     LEFT JOIN wings w ON w.tower_id = t.id AND w.status != 'deleted'
     LEFT JOIN floors fl ON fl.tower_id = t.id
     LEFT JOIN flats f ON f.tower_id = t.id
     WHERE t.society_id = $1 AND t.status != 'deleted'
     GROUP BY t.id
     ORDER BY t.tower_name ASC`,
    [societyId]
  );
  return rows;
}

async function updateTower(id, societyId, updates = {}) {
  await ensureStructureSchema();
  const fields = [];
  const params = [];
  const assign = (column, value) => {
    if (value !== undefined) {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  };
  assign("tower_name", updates.towerName ?? updates.tower_name);
  if (updates.towerCode !== undefined || updates.tower_code !== undefined) assign("tower_code", upper(updates.towerCode ?? updates.tower_code));
  assign("total_floors", updates.totalFloors ?? updates.total_floors);
  assign("total_flats", updates.totalFlats ?? updates.total_flats);
  assign("flats_per_floor", updates.flatsPerFloor ?? updates.flats_per_floor);
  assign("status", updates.status);
  if (!fields.length) return getTower(id, societyId);
  params.push(id, societyId);
  const { rows } = await db.query(`UPDATE towers SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${params.length - 1} AND society_id = $${params.length} RETURNING *`, params);
  await refreshSocietyCounts(societyId);
  return rows[0] || null;
}

async function getTower(id, societyId) {
  await ensureStructureSchema();
  const { rows } = await db.query(`SELECT * FROM towers WHERE id = $1 AND society_id = $2 LIMIT 1`, [id, societyId]);
  return rows[0] || null;
}

async function deleteTower(id, societyId) {
  await ensureStructureSchema();
  const linked = await db.query(`SELECT COUNT(*)::int AS count FROM flats WHERE tower_id = $1 AND archived_at IS NULL`, [id]);
  if (linked.rows[0].count > 0) {
    await db.query(`UPDATE towers SET status = 'deleted', updated_at = NOW() WHERE id = $1 AND society_id = $2`, [id, societyId]);
  } else {
    await db.query(`DELETE FROM towers WHERE id = $1 AND society_id = $2`, [id, societyId]);
  }
  await refreshSocietyCounts(societyId);
  return true;
}

async function createWing({ societyId, towerId, wingName, wingCode, totalFloors = 0, totalFlats = 0, createdBy = null }) {
  await ensureStructureSchema();
  const name = clean(wingName);
  const code = upper(wingCode || wingName);
  const { rows } = await db.query(
    `INSERT INTO wings (society_id, tower_id, name, code, total_floors, total_flats, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [societyId, towerId || null, name, code, toInt(totalFloors), toInt(totalFlats), createdBy]
  );
  await refreshSocietyCounts(societyId);
  return rows[0];
}

async function listWings({ societyId, towerId = null }) {
  await ensureStructureSchema();
  const params = [societyId];
  const where = ["w.society_id = $1", "w.status != 'deleted'"];
  if (towerId) {
    params.push(towerId);
    where.push(`w.tower_id = $${params.length}`);
  }
  const { rows } = await db.query(
    `SELECT w.*, t.tower_name, COUNT(DISTINCT f.id) FILTER (WHERE f.archived_at IS NULL) AS flat_count
     FROM wings w
     LEFT JOIN towers t ON t.id = w.tower_id
     LEFT JOIN flats f ON f.wing_id = w.id
     WHERE ${where.join(" AND ")}
     GROUP BY w.id, t.tower_name
     ORDER BY t.tower_name ASC, w.name ASC`,
    params
  );
  return rows;
}

async function updateWing(id, societyId, updates = {}) {
  await ensureStructureSchema();
  const fields = [];
  const params = [];
  const assign = (column, value) => {
    if (value !== undefined) {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    }
  };
  assign("name", updates.wingName ?? updates.name);
  if (updates.wingCode !== undefined || updates.code !== undefined) assign("code", upper(updates.wingCode ?? updates.code));
  assign("total_floors", updates.totalFloors ?? updates.total_floors);
  assign("total_flats", updates.totalFlats ?? updates.total_flats);
  assign("status", updates.status);
  if (!fields.length) return null;
  params.push(id, societyId);
  const { rows } = await db.query(`UPDATE wings SET ${fields.join(", ")}, updated_at = NOW() WHERE id = $${params.length - 1} AND society_id = $${params.length} RETURNING *`, params);
  await refreshSocietyCounts(societyId);
  return rows[0] || null;
}

async function deleteWing(id, societyId) {
  await ensureStructureSchema();
  const linked = await db.query(`SELECT COUNT(*)::int AS count FROM flats WHERE wing_id = $1 AND archived_at IS NULL`, [id]);
  if (linked.rows[0].count > 0) {
    await db.query(`UPDATE wings SET status = 'deleted', updated_at = NOW() WHERE id = $1 AND society_id = $2`, [id, societyId]);
  } else {
    await db.query(`DELETE FROM wings WHERE id = $1 AND society_id = $2`, [id, societyId]);
  }
  await refreshSocietyCounts(societyId);
  return true;
}

async function createFloor({ societyId, towerId, wingId, floorNumber, floorLabel = null, totalFlats = 0 }) {
  await ensureStructureSchema();
  const existing = await db.query(
    `SELECT *
     FROM floors
     WHERE society_id = $1
       AND COALESCE(tower_id, 0) = COALESCE($2, 0)
       AND COALESCE(wing_id, 0) = COALESCE($3, 0)
       AND floor_number = $4
     LIMIT 1`,
    [societyId, towerId || null, wingId || null, toInt(floorNumber)]
  );
  if (existing.rows[0]) {
    const { rows } = await db.query(
      `UPDATE floors
       SET floor_label = $1, total_flats = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [floorLabel || `Floor ${floorNumber}`, toInt(totalFlats), existing.rows[0].id]
    );
    return rows[0];
  }
  const { rows } = await db.query(
    `INSERT INTO floors (society_id, tower_id, wing_id, floor_number, floor_label, total_flats)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [societyId, towerId || null, wingId || null, toInt(floorNumber), floorLabel || `Floor ${floorNumber}`, toInt(totalFlats)]
  );
  await refreshSocietyCounts(societyId);
  return rows[0];
}

async function listFloors({ societyId, towerId = null, wingId = null }) {
  await ensureStructureSchema();
  const params = [societyId];
  const where = ["society_id = $1"];
  if (towerId) {
    params.push(towerId);
    where.push(`tower_id = $${params.length}`);
  }
  if (wingId) {
    params.push(wingId);
    where.push(`wing_id = $${params.length}`);
  }
  const { rows } = await db.query(`SELECT * FROM floors WHERE ${where.join(" AND ")} ORDER BY floor_number ASC`, params);
  return rows;
}

async function updateFloor(id, societyId, updates = {}) {
  await ensureStructureSchema();
  const { rows } = await db.query(
    `UPDATE floors
     SET floor_number = COALESCE($1, floor_number),
         floor_label = COALESCE($2, floor_label),
         total_flats = COALESCE($3, total_flats),
         updated_at = NOW()
     WHERE id = $4 AND society_id = $5
     RETURNING *`,
    [updates.floorNumber ?? updates.floor_number ?? null, updates.floorLabel ?? updates.floor_label ?? null, updates.totalFlats ?? updates.total_flats ?? null, id, societyId]
  );
  return rows[0] || null;
}

async function deleteFloor(id, societyId) {
  await ensureStructureSchema();
  const linked = await db.query(`SELECT COUNT(*)::int AS count FROM flats WHERE floor_id = $1 AND archived_at IS NULL`, [id]);
  if (linked.rows[0].count > 0) {
    await db.query(`UPDATE flats SET floor_id = NULL WHERE floor_id = $1 AND society_id = $2`, [id, societyId]);
  }
  await db.query(`DELETE FROM floors WHERE id = $1 AND society_id = $2`, [id, societyId]);
  await refreshSocietyCounts(societyId);
  return true;
}

function buildFlatNumber({ floorNumber, sequence, prefix = "", pattern = "floor_sequence" }) {
  const suffix = `${floorNumber}${String(sequence).padStart(2, "0")}`;
  if (pattern === "floor_pad_sequence") return `${String(floorNumber).padStart(2, "0")}${String(sequence).padStart(2, "0")}`;
  return prefix ? `${prefix}-${suffix}` : suffix;
}

async function createFlat({ societyId, towerId = null, wingId = null, floorId = null, flatNumber, houseNumber = null, flatType = null, bedrooms = null, areaSqft = null, createdBy = null }) {
  await ensureStructureSchema();
  const tower = towerId ? await getTower(towerId, societyId) : null;
  const wing = wingId ? (await listWings({ societyId })).find((item) => Number(item.id) === Number(wingId)) : null;
  const floor = floorId ? (await listFloors({ societyId })).find((item) => Number(item.id) === Number(floorId)) : null;
  const { rows } = await db.query(
    `INSERT INTO flats (society_id, tower_id, wing_id, floor_id, building_name, wing, flat_number, house_number, floor, flat_type, bedrooms, area_sqft, status, occupancy_status, approval_status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'vacant', 'vacant', 'approved', $13)
     RETURNING *`,
    [societyId, towerId, wingId, floorId, tower?.tower_name || null, wing?.code || null, clean(flatNumber), houseNumber || clean(flatNumber), floor?.floor_number ? String(floor.floor_number) : null, flatType, bedrooms || null, areaSqft || null, createdBy]
  );
  await refreshSocietyCounts(societyId);
  return rows[0];
}

async function listFlats({ societyId, towerId = null, wingId = null, floorId = null, vacantOnly = false }) {
  await ensureStructureSchema();
  const params = [societyId];
  const where = ["f.society_id = $1", "f.archived_at IS NULL"];
  if (towerId) {
    params.push(towerId);
    where.push(`f.tower_id = $${params.length}`);
  }
  if (wingId) {
    params.push(wingId);
    where.push(`f.wing_id = $${params.length}`);
  }
  if (floorId) {
    params.push(floorId);
    where.push(`f.floor_id = $${params.length}`);
  }
  if (vacantOnly) where.push(`f.occupancy_status = 'vacant'`);
  const { rows } = await db.query(
    `SELECT f.*, t.tower_name, w.name AS wing_name, w.code AS wing_code, fl.floor_number, fl.floor_label
     FROM flats f
     LEFT JOIN towers t ON t.id = f.tower_id
     LEFT JOIN wings w ON w.id = f.wing_id
     LEFT JOIN floors fl ON fl.id = f.floor_id
     WHERE ${where.join(" AND ")}
     ORDER BY t.tower_name ASC, w.name ASC, fl.floor_number ASC, f.flat_number ASC`,
    params
  );
  return rows;
}

async function updateFlat(id, societyId, updates = {}) {
  await ensureStructureSchema();
  const { rows } = await db.query(
    `UPDATE flats
     SET flat_number = COALESCE($1, flat_number),
         house_number = COALESCE($2, house_number),
         flat_type = COALESCE($3, flat_type),
         bedrooms = COALESCE($4, bedrooms),
         area_sqft = COALESCE($5, area_sqft),
         occupancy_status = COALESCE($6, occupancy_status),
         status = COALESCE($7, status),
         updated_at = NOW()
     WHERE id = $8 AND society_id = $9
     RETURNING *`,
    [updates.flatNumber ?? updates.flat_number ?? null, updates.houseNumber ?? updates.house_number ?? null, updates.flatType ?? updates.flat_type ?? null, updates.bedrooms ?? null, updates.areaSqft ?? updates.area_sqft ?? null, updates.occupancyStatus ?? updates.occupancy_status ?? null, updates.status ?? null, id, societyId]
  );
  return rows[0] || null;
}

async function deleteFlat(id, societyId) {
  await ensureStructureSchema();
  const { rows } = await db.query(`SELECT owner_id, tenant_id FROM flats WHERE id = $1 AND society_id = $2`, [id, societyId]);
  if (rows[0]?.owner_id || rows[0]?.tenant_id) {
    await db.query(`UPDATE flats SET archived_at = NOW(), status = 'archived', updated_at = NOW() WHERE id = $1 AND society_id = $2`, [id, societyId]);
  } else {
    await db.query(`DELETE FROM flats WHERE id = $1 AND society_id = $2`, [id, societyId]);
  }
  await refreshSocietyCounts(societyId);
  return true;
}

async function generateFlats({ societyId, towerId, wingId = null, startFloor = 1, floors = 1, flatsPerFloor = 4, prefix = "", pattern = "floor_sequence", flatType = null, createdBy = null }) {
  await ensureStructureSchema();
  const created = [];
  for (let offset = 0; offset < toInt(floors, 1); offset += 1) {
    const floorNumber = toInt(startFloor, 1) + offset;
    const floor = await createFloor({ societyId, towerId, wingId, floorNumber, totalFlats: flatsPerFloor });
    for (let sequence = 1; sequence <= toInt(flatsPerFloor, 1); sequence += 1) {
      try {
        const flat = await createFlat({
          societyId,
          towerId,
          wingId,
          floorId: floor.id,
          flatNumber: buildFlatNumber({ floorNumber, sequence, prefix, pattern }),
          flatType,
          createdBy,
        });
        created.push(flat);
      } catch (error) {
        if (error.code !== "23505") throw error;
      }
    }
  }
  await refreshSocietyCounts(societyId);
  return created;
}

async function createGate({ societyId, gateName, gateNumber, gateType = "main" }) {
  await ensureStructureSchema();
  const { rows } = await db.query(
    `INSERT INTO gates (society_id, gate_name, gate_number, gate_type)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [societyId, clean(gateName), clean(gateNumber), normalizeStatus(gateType, "main")]
  );
  await refreshSocietyCounts(societyId);
  return rows[0];
}

async function listGates(societyId) {
  await ensureStructureSchema();
  const { rows } = await db.query(`SELECT * FROM gates WHERE society_id = $1 AND status != 'deleted' ORDER BY gate_number ASC`, [societyId]);
  return rows;
}

async function updateGate(id, societyId, updates = {}) {
  await ensureStructureSchema();
  const { rows } = await db.query(
    `UPDATE gates
     SET gate_name = COALESCE($1, gate_name),
         gate_number = COALESCE($2, gate_number),
         gate_type = COALESCE($3, gate_type),
         status = COALESCE($4, status),
         updated_at = NOW()
     WHERE id = $5 AND society_id = $6
     RETURNING *`,
    [updates.gateName ?? updates.gate_name ?? null, updates.gateNumber ?? updates.gate_number ?? null, updates.gateType ?? updates.gate_type ?? null, updates.status ?? null, id, societyId]
  );
  await refreshSocietyCounts(societyId);
  return rows[0] || null;
}

async function deleteGate(id, societyId) {
  await ensureStructureSchema();
  await db.query(`UPDATE gates SET status = 'deleted', updated_at = NOW() WHERE id = $1 AND society_id = $2`, [id, societyId]);
  await refreshSocietyCounts(societyId);
  return true;
}

async function createStructureForSociety(societyId, setup = {}, createdBy = null) {
  await ensureStructureSchema();
  const towers = Array.isArray(setup.towers) ? setup.towers : [];
  const created = { towers: [], wings: [], floors: [], flats: [], gates: [] };

  for (const towerInput of towers) {
    const tower = await createTower({
      societyId,
      towerName: towerInput.towerName || towerInput.name,
      towerCode: towerInput.towerCode || towerInput.code,
      totalFloors: towerInput.totalFloors,
      flatsPerFloor: towerInput.flatsPerFloor,
      flatNumberFormat: towerInput.flatNumberFormat,
      createdBy,
    });
    created.towers.push(tower);
    const wings = Array.isArray(towerInput.wings) && towerInput.wings.length ? towerInput.wings : [{ wingName: tower.tower_code, wingCode: tower.tower_code }];
    for (const wingInput of wings) {
      const wing = await createWing({
        societyId,
        towerId: tower.id,
        wingName: wingInput.wingName || wingInput.name,
        wingCode: wingInput.wingCode || wingInput.code,
        totalFloors: wingInput.totalFloors || towerInput.totalFloors,
        createdBy,
      });
      created.wings.push(wing);
      const generated = await generateFlats({
        societyId,
        towerId: tower.id,
        wingId: wing.id,
        startFloor: wingInput.startFloor || towerInput.startingFloor || 1,
        floors: wingInput.totalFloors || towerInput.totalFloors || 1,
        flatsPerFloor: wingInput.flatsPerFloor || towerInput.flatsPerFloor || 1,
        prefix: wingInput.prefix || wing.code,
        pattern: wingInput.flatNumberPattern || towerInput.flatNumberPattern || "floor_sequence",
        createdBy,
      });
      created.flats.push(...generated);
    }
  }

  const gates = Array.isArray(setup.gates) ? setup.gates : [];
  for (const gate of gates) {
    created.gates.push(await createGate({ societyId, gateName: gate.gateName || gate.name, gateNumber: gate.gateNumber || gate.number, gateType: gate.gateType || gate.type }));
  }

  await refreshSocietyCounts(societyId);
  return created;
}

async function getSocietyStructure(societyId) {
  await ensureStructureSchema();
  const society = await societyModel.getSocietyById(societyId);
  const towers = await listTowers(societyId);
  const wings = await listWings({ societyId });
  const floors = await listFloors({ societyId });
  const flats = await listFlats({ societyId });
  const gates = await listGates(societyId);
  const tree = towers.map((tower) => ({
    ...tower,
    wings: wings
      .filter((wing) => Number(wing.tower_id) === Number(tower.id))
      .map((wing) => ({
        ...wing,
        floors: floors
          .filter((floor) => Number(floor.wing_id) === Number(wing.id))
          .map((floor) => ({
            ...floor,
            flats: flats.filter((flat) => Number(flat.floor_id) === Number(floor.id)),
          })),
      })),
  }));
  return { society, towers, wings, floors, flats, gates, tree };
}

async function getResidentStructure(societyCode) {
  await ensureStructureSchema();
  const society = await societyModel.getSocietyByCode(societyCode);
  if (!society) return null;
  const structure = await getSocietyStructure(society.id);
  return {
    society,
    towers: structure.towers,
    wings: structure.wings,
    floors: structure.floors,
    flats: structure.flats,
  };
}

async function submitResidenceRequest({ userId, societyId, towerId, wingId, floorId, flatId, residentType, familyMembersCount = 0, vehicleDetails = null, documentUrl = null, moveInDate = null, ownerName = null, ownerContact = null }) {
  await ensureStructureSchema();
  const { rows } = await db.query(
    `INSERT INTO resident_profiles
      (user_id, society_id, tower_id, wing_id, floor_id, flat_id, resident_type, family_members_count, vehicle_details, document_url, move_in_date, ownership_status, owner_name, owner_contact, approval_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending')
     RETURNING *`,
    [userId, societyId, towerId || null, wingId || null, floorId || null, flatId || null, normalizeStatus(residentType, "owner"), toInt(familyMembersCount), vehicleDetails ? JSON.stringify(vehicleDetails) : null, documentUrl, moveInDate, normalizeStatus(residentType, "owner"), ownerName, ownerContact]
  );
  return rows[0];
}

async function getProfileStatus(userId) {
  await ensureStructureSchema();
  const { rows } = await db.query(
    `SELECT rp.*, s.code AS society_code, s.name AS society_name, f.flat_number, t.tower_name, w.name AS wing_name, fl.floor_label
     FROM resident_profiles rp
     LEFT JOIN societies s ON s.id = rp.society_id
     LEFT JOIN flats f ON f.id = rp.flat_id
     LEFT JOIN towers t ON t.id = rp.tower_id
     LEFT JOIN wings w ON w.id = rp.wing_id
     LEFT JOIN floors fl ON fl.id = rp.floor_id
     WHERE rp.user_id = $1
     ORDER BY rp.id DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function listResidenceRequests(societyId) {
  await ensureStructureSchema();
  const { rows } = await db.query(
    `SELECT rp.*, u.name AS resident_name, u.email AS resident_email, s.code AS society_code,
            t.tower_name, w.name AS wing_name, fl.floor_label, f.flat_number
     FROM resident_profiles rp
     JOIN users u ON u.id = rp.user_id
     JOIN societies s ON s.id = rp.society_id
     LEFT JOIN towers t ON t.id = rp.tower_id
     LEFT JOIN wings w ON w.id = rp.wing_id
     LEFT JOIN floors fl ON fl.id = rp.floor_id
     LEFT JOIN flats f ON f.id = rp.flat_id
     WHERE rp.society_id = $1
     ORDER BY rp.created_at DESC`,
    [societyId]
  );
  return rows;
}

async function reviewResidenceRequest({ requestId, societyId, approved, reviewedBy, rejectionReason = null }) {
  await ensureStructureSchema();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    console.log("[Approve] Request ID:", requestId);
    const profileResult = await connection.query(
      `SELECT * FROM resident_profiles WHERE id = $1 AND society_id = $2 FOR UPDATE`,
      [requestId, societyId]
    );
    console.log("[Approve] Request Result:", profileResult);
    if (!profileResult || !Array.isArray(profileResult.rows) || profileResult.rows.length === 0) {
      await connection.rollback();
      const err = new Error("Residence request not found");
      err.code = "REQUEST_NOT_FOUND";
      throw err;
    }
    const profile = profileResult.rows[0];

    if (!approved) {
      const { rows } = await connection.query(
        `UPDATE resident_profiles SET approval_status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2, updated_at = NOW() WHERE id = $3 AND society_id = $4 RETURNING *`,
        [reviewedBy, rejectionReason, requestId, societyId]
      );
      await connection.commit();
      return rows[0] || null;
    }

    // Approve flow: verify resident user
    const userResult = await connection.query(`SELECT id, resident_type FROM users WHERE id = $1 FOR UPDATE`, [profile.user_id]);
    console.log("[Approve] Resident Result:", userResult);
    if (!userResult || !Array.isArray(userResult.rows) || userResult.rows.length === 0) {
      await connection.rollback();
      const err = new Error("Resident not found");
      err.code = "RESIDENT_NOT_FOUND";
      throw err;
    }
    const user = userResult.rows[0];

    // Verify referenced structure entities if provided
    if (profile.tower_id) {
      const towerResult = await connection.query(`SELECT id FROM towers WHERE id = $1 AND society_id = $2 LIMIT 1`, [profile.tower_id, societyId]);
      console.log("[Approve] Tower Result:", towerResult);
      if (!towerResult || !Array.isArray(towerResult.rows) || towerResult.rows.length === 0) {
        await connection.rollback();
        const err = new Error("Tower not found");
        err.code = "TOWER_NOT_FOUND";
        throw err;
      }
    }
    if (profile.wing_id) {
      const wingResult = await connection.query(`SELECT id FROM wings WHERE id = $1 AND society_id = $2 LIMIT 1`, [profile.wing_id, societyId]);
      console.log("[Approve] Wing Result:", wingResult);
      if (!wingResult || !Array.isArray(wingResult.rows) || wingResult.rows.length === 0) {
        await connection.rollback();
        const err = new Error("Wing not found");
        err.code = "WING_NOT_FOUND";
        throw err;
      }
    }
    if (profile.floor_id) {
      const floorResult = await connection.query(`SELECT id FROM floors WHERE id = $1 AND society_id = $2 LIMIT 1`, [profile.floor_id, societyId]);
      console.log("[Approve] Floor Result:", floorResult);
      if (!floorResult || !Array.isArray(floorResult.rows) || floorResult.rows.length === 0) {
        await connection.rollback();
        const err = new Error("Floor not found");
        err.code = "FLOOR_NOT_FOUND";
        throw err;
      }
    }

    // Flat must exist for assignment
    const flatId = Number(profile.flat_id || 0);
    if (!flatId) {
      await connection.rollback();
      const err = new Error("Flat not found");
      err.code = "FLAT_NOT_FOUND";
      throw err;
    }

    const flatResult = await connection.query(`SELECT * FROM flats WHERE id = $1 AND society_id = $2 FOR UPDATE`, [flatId, societyId]);
    console.log("[Approve] Flat Result:", flatResult);
    if (!flatResult || !Array.isArray(flatResult.rows) || flatResult.rows.length === 0) {
      await connection.rollback();
      const err = new Error("Flat not found");
      err.code = "FLAT_NOT_FOUND";
      throw err;
    }
    const flat = flatResult.rows[0];

    // Check existing active assignment
    const activeResult = await connection.query(`SELECT id FROM flat_residents WHERE flat_id = $1 AND is_active = TRUE LIMIT 1 FOR UPDATE`, [flat.id]);
    console.log("[Approve] Active Assignment Result:", activeResult);
    if (activeResult && Array.isArray(activeResult.rows) && activeResult.rows.length > 0) {
      await connection.rollback();
      const err = new Error("Flat already occupied");
      err.code = "FLAT_OCCUPIED";
      throw err;
    }

    // Insert flat_resident assignment
    const moveInDate = profile.move_in_date || new Date();
    await connection.query(`INSERT INTO flat_residents (flat_id, resident_id, move_in_date, is_active, assigned_by) VALUES ($1, $2, $3, TRUE, $4)`, [flat.id, profile.user_id, moveInDate, reviewedBy]);

    // Update flat owner/tenant and occupancy fields
    const updates = [];
    const params = [];
    if (profile.resident_type === "tenant") {
      updates.push(`tenant_id = $${params.length + 1}`);
      params.push(profile.user_id);
    } else {
      updates.push(`owner_id = $${params.length + 1}`);
      params.push(profile.user_id);
    }
    updates.push(`occupancy_status = $${params.length + 1}`);
    params.push(profile.resident_type === "tenant" ? "tenant_occupied" : "owner_occupied");
    updates.push(`status = $${params.length + 1}`);
    params.push("occupied");
    params.push(flat.id, societyId);
    await connection.query(`UPDATE flats SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${params.length - 1} AND society_id = $${params.length}`, params);

    // Update user
    const flatLookupResult = await connection.query(`SELECT flat_number FROM flats WHERE id = $1 AND society_id = $2`, [flat.id, societyId]);
    console.log("[Approve] Flat Lookup Result:", flatLookupResult);
    const flatNumber = flatLookupResult && Array.isArray(flatLookupResult.rows) && flatLookupResult.rows[0] ? flatLookupResult.rows[0].flat_number : null;
    await connection.query(`UPDATE users SET flat_id = $1, flat_number = $2, society_id = $3, approval_status = 'approved', status = 'active', is_verified = TRUE, approved_at = NOW() WHERE id = $4`, [flat.id, flatNumber, societyId, profile.user_id]);

    // Update resident profile
    const { rows: updatedProfileRows } = await connection.query(`UPDATE resident_profiles SET approval_status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW() WHERE id = $2 AND society_id = $3 RETURNING *`, [reviewedBy, requestId, societyId]);

    // Activity log
    try {
      await connection.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata) VALUES ($1, 'approve_residence_profile', 'resident_profile', $2, $3::jsonb)`,
        [reviewedBy || null, requestId, JSON.stringify({ reviewedBy, requestId, userId: profile.user_id, flatId: flat.id })]
      );
    } catch (e) {
      // ignore logging failures
    }

    await connection.commit();
    // Refresh counts asynchronously
    try {
      await refreshSocietyCounts(societyId);
    } catch (e) {}

    return updatedProfileRows[0] || null;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (e) {}
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  resolveSocietyId,
  ensureStructureSchema,
  refreshSocietyCounts,
  createStructureForSociety,
  getSocietyStructure,
  createTower,
  listTowers,
  updateTower,
  deleteTower,
  createWing,
  listWings,
  updateWing,
  deleteWing,
  createFloor,
  listFloors,
  updateFloor,
  deleteFloor,
  createFlat,
  listFlats,
  updateFlat,
  deleteFlat,
  generateFlats,
  createGate,
  listGates,
  updateGate,
  deleteGate,
  getResidentStructure,
  submitResidenceRequest,
  getProfileStatus,
  listResidenceRequests,
  reviewResidenceRequest,
};
