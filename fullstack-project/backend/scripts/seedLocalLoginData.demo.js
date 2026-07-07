const bcrypt = require("bcrypt");
const db = require("../config/db");

const PASSWORD = process.env.LOCAL_SEED_PASSWORD || "Green@123";
const SOCIETY_CODE = "GRR-0001";

const users = [
  {
    name: "Green Valley Chairman",
    email: "chairman@greenvalley.local",
    role: "admin",
    phone: "9000000001",
  },
  {
    name: "Green Valley Staff",
    email: "staff@greenvalley.local",
    role: "staff",
    phone: "9000000002",
  },
  {
    name: "Green Valley Security",
    email: "security@greenvalley.local",
    role: "security",
    phone: "9000000003",
  },
  {
    name: "Green Valley Resident",
    email: "resident@greenvalley.local",
    role: "resident",
    resident_type: "owner",
    phone: "9000000004",
    flat_number: "A-101",
  },
];

async function upsertSociety() {
  const { rows } = await db.query(
    `INSERT INTO societies
      (code, slug, subdomain, name, society_name, address, city, state, pincode, contact_email, contact_phone, status, subscription_plan, default_language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'starter', 'en')
     ON CONFLICT (code) DO UPDATE SET
       name = EXCLUDED.name,
       society_name = EXCLUDED.society_name,
       address = EXCLUDED.address,
       city = EXCLUDED.city,
       state = EXCLUDED.state,
       pincode = EXCLUDED.pincode,
       contact_email = EXCLUDED.contact_email,
       contact_phone = EXCLUDED.contact_phone,
       status = 'active',
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, code, name`,
    [
      SOCIETY_CODE,
      "green-valley",
      "green-valley",
      "Green Valley",
      "Green Valley",
      "Green Valley Road",
      "Pune",
      "Maharashtra",
      "411001",
      "admin@greenvalley.local",
      "9000000000",
    ]
  );

  return rows[0];
}

async function upsertUser(user, societyId, passwordHash) {
  const { rows } = await db.query(
    `INSERT INTO users
      (name, full_name, email, password, phone, role, resident_type, status, is_verified, society_id, flat_number, approval_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active', true, ?, ?, 'approved')
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       full_name = EXCLUDED.full_name,
       password = EXCLUDED.password,
       phone = EXCLUDED.phone,
       role = EXCLUDED.role,
       resident_type = EXCLUDED.resident_type,
       status = 'active',
       is_verified = true,
       society_id = EXCLUDED.society_id,
       flat_number = EXCLUDED.flat_number,
       approval_status = 'approved',
       deleted_at = NULL,
       is_deleted = false,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id, email, role, society_id`,
    [
      user.name,
      user.name,
      user.email,
      passwordHash,
      user.phone || null,
      user.role,
      user.resident_type || null,
      societyId,
      user.flat_number || null,
    ]
  );

  return rows[0];
}

async function ensureFlatAndResident(societyId, residentId) {
  let { rows } = await db.query(
    `SELECT id FROM flats WHERE society_id = ? AND flat_number = ? LIMIT 1`,
    [societyId, "A-101"]
  );

  if (!rows[0]) {
    ({ rows } = await db.query(
      `INSERT INTO flats (society_id, wing, flat_number, floor, block, status, resident_id, area_sqft)
       VALUES (?, 'A', 'A-101', '1', 'A', 'occupied', ?, 950)
       RETURNING id`,
      [societyId, residentId]
    ));
  } else {
    await db.query(
      `UPDATE flats SET resident_id = ?, status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [residentId, rows[0].id]
    );
  }

  const flat = rows[0];
  if (flat?.id) {
    await db.query(
      `UPDATE users SET flat_id = ?, flat_number = 'A-101', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [flat.id, residentId]
    );
  }

  return flat;
}

async function seedDashboardRows({ societyId, chairmanId, residentId }) {
  await db.query(
    `INSERT INTO notices (society_id, title, message, status, created_by, expires_at)
     SELECT ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP + INTERVAL '30 days'
     WHERE NOT EXISTS (
       SELECT 1 FROM notices WHERE society_id = ? AND title = ?
     )`,
    [
      societyId,
      "Welcome to Green Valley",
      "Local demo data is ready for dashboard testing.",
      chairmanId,
      societyId,
      "Welcome to Green Valley",
    ]
  );

  await db.query(
    `INSERT INTO complaints (resident_id, society_id, title, description, category, status)
     SELECT ?, ?, ?, ?, 'maintenance', 'pending'
     WHERE NOT EXISTS (
       SELECT 1 FROM complaints WHERE society_id = ? AND title = ?
     )`,
    [
      residentId,
      societyId,
      "Lobby light maintenance",
      "Replace flickering lobby light near Tower A entrance.",
      societyId,
      "Lobby light maintenance",
    ]
  );

  await db.query(
    `INSERT INTO security_alerts (society_id, alert_type, severity, message, location)
     SELECT ?, 'maintenance', 'medium', 'Demo security alert for local dashboard testing.', 'Main Gate'
     WHERE NOT EXISTS (
       SELECT 1 FROM security_alerts WHERE society_id = ? AND message = ?
     )`,
    [societyId, societyId, "Demo security alert for local dashboard testing."]
  );

  await db.query(
    `INSERT INTO visitors (society_id, resident_id, name, visitor_name, phone, purpose, visitor_type, visit_date, visit_time, status)
     SELECT ?, ?, 'Demo Visitor', 'Demo Visitor', '9000000099', 'Local dashboard test', 'guest', CURRENT_DATE, CURRENT_TIME, 'checked_in'
     WHERE NOT EXISTS (
       SELECT 1 FROM visitors WHERE society_id = ? AND phone = ?
     )`,
    [societyId, residentId, societyId, "9000000099"]
  );
}

async function run() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const society = await upsertSociety();
  const createdUsers = {};

  for (const user of users) {
    createdUsers[user.role === "admin" ? "chairman" : user.role] = await upsertUser(user, society.id, passwordHash);
  }

  await db.query(
    `UPDATE societies SET primary_admin_user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [createdUsers.chairman.id, society.id]
  );

  await ensureFlatAndResident(society.id, createdUsers.resident.id);
  await seedDashboardRows({
    societyId: society.id,
    chairmanId: createdUsers.chairman.id,
    residentId: createdUsers.resident.id,
  });

  console.log("Local login seed complete");
  console.table([
    { role: "chairman", email: "chairman@greenvalley.local", password: PASSWORD, societyCode: SOCIETY_CODE },
    { role: "staff", email: "staff@greenvalley.local", password: PASSWORD, societyCode: SOCIETY_CODE },
    { role: "security", email: "security@greenvalley.local", password: PASSWORD, societyCode: SOCIETY_CODE },
  ]);
}

run()
  .catch((error) => {
    console.error("[seedLocalLoginData] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
