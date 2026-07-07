const db = require("../config/db");
const societyModel = require("./societyModel");
const userModel = require("./userModel");

const DEFAULT_NOTIFICATIONS = {
  notices: true,
  complaints: true,
  visitors: true,
  billing: true,
  email: true,
  push: true,
};

const DEFAULT_APPEARANCE = {
  theme: "auto",
  language: "en",
};

async function ensureSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS chairman_settings (
      user_id INTEGER PRIMARY KEY,
      society_id INTEGER NOT NULL,
      notification_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      appearance_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(120)`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500)`);
  await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS registration_number VARCHAR(120)`);
  await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS office_timing VARCHAR(120)`);
  await db.query(`ALTER TABLE societies ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)`);
}

function normalizeSettings(row = {}) {
  return {
    notifications: { ...DEFAULT_NOTIFICATIONS, ...(row.notification_settings || {}) },
    appearance: { ...DEFAULT_APPEARANCE, ...(row.appearance_settings || {}) },
  };
}

async function upsertSettings({ userId, societyId, notifications, appearance }) {
  await ensureSchema();
  const current = await getSettingsRow(userId, societyId);
  const nextNotifications = { ...DEFAULT_NOTIFICATIONS, ...(current?.notification_settings || {}), ...(notifications || {}) };
  const nextAppearance = { ...DEFAULT_APPEARANCE, ...(current?.appearance_settings || {}), ...(appearance || {}) };

  const { rows } = await db.query(
    `INSERT INTO chairman_settings (user_id, society_id, notification_settings, appearance_settings, updated_at)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET society_id = EXCLUDED.society_id,
       notification_settings = EXCLUDED.notification_settings,
       appearance_settings = EXCLUDED.appearance_settings,
       updated_at = NOW()
     RETURNING *`,
    [userId, societyId, JSON.stringify(nextNotifications), JSON.stringify(nextAppearance)]
  );
  return rows[0];
}

async function getSettingsRow(userId, societyId) {
  await ensureSchema();
  const { rows } = await db.query(
    `SELECT * FROM chairman_settings WHERE user_id = $1 AND society_id = $2 LIMIT 1`,
    [userId, societyId]
  );
  return rows[0] || null;
}

async function getChairmanSettings({ userId, societyId }) {
  await ensureSchema();
  const [user, society, settingsRow] = await Promise.all([
    userModel.getUserById(userId),
    societyModel.getSocietyById(societyId),
    getSettingsRow(userId, societyId),
  ]);

  return {
    profile: {
      photo: user?.profile_photo_url || user?.profile_photo || "",
      fullName: user?.name || user?.full_name || "",
      email: user?.email || "",
      mobile: user?.phone || "",
      designation: user?.designation || "Chairman",
    },
    society: {
      logo: society?.logo_url || "",
      name: society?.society_name || society?.name || "",
      registrationNumber: society?.registration_number || "",
      code: society?.society_code || society?.code || "",
      address: society?.address || "",
      phone: society?.contact_phone || "",
      email: society?.contact_email || "",
      officeTiming: society?.office_timing || "",
    },
    ...normalizeSettings(settingsRow || {}),
  };
}

async function updateProfile({ userId, societyId, profile }) {
  await ensureSchema();
  const existing = await userModel.getUserById(userId);
  if (!existing || Number(existing.society_id) !== Number(societyId)) {
    return null;
  }

  return userModel.updateUserById(userId, {
    name: profile.fullName,
    email: profile.email,
    phone: profile.mobile,
    designation: profile.designation,
    profilePhotoUrl: profile.photo,
  });
}

async function updateSocietyProfile({ societyId, society }) {
  await ensureSchema();
  await db.query(
    `UPDATE societies
     SET society_name = $1,
         name = $1,
         registration_number = $2,
         address = $3,
         contact_phone = $4,
         contact_email = $5,
         office_timing = $6,
         logo_url = COALESCE($7, logo_url)
     WHERE id = $8`,
    [
      society.name,
      society.registrationNumber || null,
      society.address || null,
      society.phone || null,
      society.email || null,
      society.officeTiming || null,
      society.logo === "" ? "" : society.logo || null,
      societyId,
    ]
  );
  return societyModel.getSocietyById(societyId);
}

async function updateNotificationSettings({ userId, societyId, notifications }) {
  const row = await upsertSettings({ userId, societyId, notifications });
  return normalizeSettings(row).notifications;
}

async function updateAppearanceSettings({ userId, societyId, appearance }) {
  const row = await upsertSettings({ userId, societyId, appearance });
  return normalizeSettings(row).appearance;
}

async function updateProfileImage({ userId, societyId, imageUrl }) {
  const existing = await userModel.getUserById(userId);
  if (!existing || Number(existing.society_id) !== Number(societyId)) {
    return null;
  }
  return userModel.updateUserById(userId, { profilePhotoUrl: imageUrl });
}

async function updateSocietyLogo({ societyId, logoUrl }) {
  await ensureSchema();
  await db.query(`UPDATE societies SET logo_url = $1 WHERE id = $2`, [logoUrl, societyId]);
  return societyModel.getSocietyById(societyId);
}

module.exports = {
  getChairmanSettings,
  updateProfile,
  updateSocietyProfile,
  updateNotificationSettings,
  updateAppearanceSettings,
  updateProfileImage,
  updateSocietyLogo,
};
