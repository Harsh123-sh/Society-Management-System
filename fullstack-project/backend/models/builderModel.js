const db = require("../db");

async function getBuilderById(id) {
  const [rows] = await db.query(
    `SELECT id, name, email, slug, logo_url, website, status, subscription_plan, max_societies, max_users, created_at
     FROM builders WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getBuilderByEmail(email) {
  const [rows] = await db.query(
    `SELECT id, name, email, slug, logo_url, website, status, subscription_plan, max_societies, max_users, created_at
     FROM builders WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function getBuilderBySlug(slug) {
  const [rows] = await db.query(
    `SELECT id, name, email, slug, logo_url, website, status, subscription_plan, max_societies, max_users, created_at
     FROM builders WHERE slug = ? LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

async function createBuilder({ name, email, slug, logoUrl, website, subscriptionPlan, maxSocieties, maxUsers }) {
  const [result] = await db.query(
    `INSERT INTO builders (name, email, slug, logo_url, website, subscription_plan, max_societies, max_users, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [name, email, slug, logoUrl || null, website || null, subscriptionPlan || 'starter', maxSocieties || 10, maxUsers || 1000]
  );
  return getBuilderById(result.insertId);
}

async function updateBuilder(id, updates) {
  const allowedFields = ['name', 'logo_url', 'website', 'status', 'subscription_plan', 'max_societies', 'max_users'];
  const fields = Object.keys(updates).filter(k => allowedFields.includes(k));
  if (fields.length === 0) return getBuilderById(id);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => updates[f]);
  
  await db.query(`UPDATE builders SET ${setClause} WHERE id = ?`, [...values, id]);
  return getBuilderById(id);
}

async function listBuilders(limit = 50, offset = 0) {
  const [rows] = await db.query(
    `SELECT id, name, email, slug, status, subscription_plan, max_societies, max_users, created_at
     FROM builders ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  return rows;
}

async function getSocietyCountForBuilder(builderId) {
  const [rows] = await db.query(
    `SELECT COUNT(*) as count FROM societies WHERE builder_id = ? AND status != 'archived'`,
    [builderId]
  );
  return rows[0]?.count || 0;
}

async function getUserCountForBuilder(builderId) {
  const [rows] = await db.query(
    `SELECT COUNT(DISTINCT u.id) as count 
     FROM users u
     JOIN societies s ON u.society_id = s.id
     WHERE s.builder_id = ?`,
    [builderId]
  );
  return rows[0]?.count || 0;
}

module.exports = {
  getBuilderById,
  getBuilderByEmail,
  getBuilderBySlug,
  createBuilder,
  updateBuilder,
  listBuilders,
  getSocietyCountForBuilder,
  getUserCountForBuilder,
};
