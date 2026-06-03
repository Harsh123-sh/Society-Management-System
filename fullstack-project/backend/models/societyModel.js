const db = require("../db");

async function getSocietyByCode(code) {
  if (!code) {
    return null;
  }

  const normalizedCode = String(code).trim().toUpperCase();
  const { rows } = await db.query(
    `SELECT id, code, code AS society_code, slug, subdomain,
            COALESCE(society_name, name) AS name,
            COALESCE(society_name, name) AS society_name,
            logo_url,
            address, city, state, pincode, contact_email, contact_phone, builder_id, status, subscription_plan, default_language, created_by, primary_admin_user_id, created_at
     FROM societies
     WHERE code = ?
     LIMIT 1`,
    [normalizedCode]
  );

  return rows[0] || null;
}

async function getSocietyById(id) {
  const { rows } = await db.query(
    `SELECT id, code, code AS society_code, slug, subdomain,
            COALESCE(society_name, name) AS name,
            COALESCE(society_name, name) AS society_name,
            logo_url,
            address, city, state, pincode, contact_email, contact_phone, builder_id, status, subscription_plan, default_language, created_by, primary_admin_user_id, created_at
     FROM societies
     WHERE id = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] || null;
}

async function listSocieties() {
  const { rows } = await db.query(
    `SELECT id, code, code AS society_code, slug, subdomain,
            COALESCE(society_name, name) AS name,
            COALESCE(society_name, name) AS society_name,
            address, city, state, pincode, contact_email, contact_phone, builder_id, status, subscription_plan, subscription_plan AS plan, default_language, created_by, primary_admin_user_id, created_at
     FROM societies
     ORDER BY name ASC, code ASC`
  );

  return rows;
}

async function getSocietyBySlug(slug) {
  if (!slug) {
    return null;
  }

  const normalizedSlug = String(slug).trim().toLowerCase();
  const { rows } = await db.query(
    `SELECT id, code, code AS society_code, slug, subdomain,
            COALESCE(society_name, name) AS name,
            COALESCE(society_name, name) AS society_name,
            logo_url,
            address, city, state, pincode, contact_email, contact_phone, builder_id, status, subscription_plan, default_language, created_by, primary_admin_user_id, created_at
     FROM societies
     WHERE slug = ?
     LIMIT 1`,
    [normalizedSlug]
  );

  return rows[0] || null;
}

async function getSocietyBySubdomain(subdomain) {
  if (!subdomain) {
    return null;
  }

  const normalizedSubdomain = String(subdomain).trim().toLowerCase();
  const { rows } = await db.query(
    `SELECT id, code, code AS society_code, slug, subdomain,
            COALESCE(society_name, name) AS name,
            COALESCE(society_name, name) AS society_name,
            logo_url,
            address, city, state, pincode, contact_email, contact_phone, builder_id, status, subscription_plan, default_language, created_by, primary_admin_user_id, created_at
     FROM societies
     WHERE subdomain = ?
     LIMIT 1`,
    [normalizedSubdomain]
  );

  return rows[0] || null;
}

async function createSociety({
  code,
  name,
  societyName,
  slug,
  subdomain,
  address = null,
  city = null,
  state = null,
  pincode = null,
  contactEmail = null,
  contactPhone = null,
  builderId = null,
  status = "active",
  subscriptionPlan = "starter",
  defaultLanguage = "en",
  createdBy = null,
  primaryAdminUserId = null,
}) {
  const normalizedCode = String(code).trim().toUpperCase();
  const normalizedName = String(societyName || name).trim();
  const normalizedSlug = slug ? String(slug).trim().toLowerCase() : normalizedCode.toLowerCase();
  const normalizedSubdomain = subdomain ? String(subdomain).trim().toLowerCase() : normalizedSlug;

  const { rows: result } = await db.query(
    `INSERT INTO societies
      (code, slug, subdomain, name, society_name, address, city, state, pincode, contact_email, contact_phone, builder_id, status, subscription_plan, default_language, created_by, primary_admin_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      normalizedCode,
      normalizedSlug,
      normalizedSubdomain,
      normalizedName,
      normalizedName,
      address || null,
      city || null,
      state || null,
      pincode || null,
      contactEmail || null,
      contactPhone || null,
      builderId || null,
      status,
      subscriptionPlan,
      defaultLanguage,
      createdBy || null,
      primaryAdminUserId || null,
    ]
  );

  return getSocietyById(result.insertId);
}

async function updateSocietyById(id, updates = {}) {
  const fields = [];
  const params = [];

  if (updates.code !== undefined) {
    fields.push("code = ?");
    params.push(String(updates.code).trim().toUpperCase());
  }

  if (updates.slug !== undefined) {
    fields.push("slug = ?");
    params.push(String(updates.slug).trim().toLowerCase());
  }

  if (updates.subdomain !== undefined) {
    fields.push("subdomain = ?");
    params.push(String(updates.subdomain).trim().toLowerCase());
  }

  if (updates.name !== undefined) {
    fields.push("name = ?");
    params.push(String(updates.name).trim());
  }

  if (updates.societyName !== undefined) {
    fields.push("society_name = ?");
    params.push(String(updates.societyName).trim());
  }

  if (updates.address !== undefined) {
    fields.push("address = ?");
    params.push(updates.address || null);
  }

  if (updates.city !== undefined) {
    fields.push("city = ?");
    params.push(updates.city || null);
  }

  if (updates.state !== undefined) {
    fields.push("state = ?");
    params.push(updates.state || null);
  }

  if (updates.pincode !== undefined) {
    fields.push("pincode = ?");
    params.push(updates.pincode || null);
  }

  if (updates.contactEmail !== undefined) {
    fields.push("contact_email = ?");
    params.push(updates.contactEmail || null);
  }

  if (updates.contactPhone !== undefined) {
    fields.push("contact_phone = ?");
    params.push(updates.contactPhone || null);
  }

  if (updates.builderId !== undefined) {
    fields.push("builder_id = ?");
    params.push(updates.builderId || null);
  }

  if (updates.status !== undefined) {
    fields.push("status = ?");
    params.push(updates.status);
  }

  if (updates.subscriptionPlan !== undefined) {
    fields.push("subscription_plan = ?");
    params.push(updates.subscriptionPlan);
  }

  if (updates.defaultLanguage !== undefined) {
    fields.push("default_language = ?");
    params.push(updates.defaultLanguage);
  }

  if (updates.createdBy !== undefined) {
    fields.push("created_by = ?");
    params.push(updates.createdBy || null);
  }

  if (updates.primaryAdminUserId !== undefined) {
    fields.push("primary_admin_user_id = ?");
    params.push(updates.primaryAdminUserId || null);
  }

  if (!fields.length) {
    return getSocietyById(id);
  }

  params.push(id);
  await db.query(`UPDATE societies SET ${fields.join(", ")} WHERE id = ?`, params);

  return getSocietyById(id);
}

async function listSocietiesByBuilder(builderId, limit = 50, offset = 0) {
  const { rows } = await db.query(
    `SELECT id, code, code AS society_code, slug, subdomain,
            COALESCE(society_name, name) AS name,
            COALESCE(society_name, name) AS society_name,
            address, city, state, pincode, contact_email, contact_phone, builder_id, status, subscription_plan, default_language, created_by, primary_admin_user_id, created_at
     FROM societies
     WHERE builder_id = ? AND status != 'archived'
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [builderId, limit, offset]
  );
  return rows;
}

async function getSocietyCountByBuilder(builderId) {
  const { rows } = await db.query(
    `SELECT COUNT(*) as count FROM societies WHERE builder_id = ? AND status != 'archived'`,
    [builderId]
  );
  return rows[0]?.count || 0;
}

module.exports = {
  getSocietyByCode,
  getSocietyById,
  getSocietyBySlug,
  getSocietyBySubdomain,
  listSocieties,
  listSocietiesByBuilder,
  getSocietyCountByBuilder,
  createSociety,
  updateSocietyById,
};
