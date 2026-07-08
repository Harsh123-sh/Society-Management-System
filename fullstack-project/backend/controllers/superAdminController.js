const crypto = require("crypto");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const societyModel = require("../models/societyModel");
const userModel = require("../models/userModel");
const tenantModel = require("../models/tenantModel");
const auditModel = require("../models/auditModel");
const UserApprovalModel = require("../models/userApprovalModel");

const SOCIETY_STATUSES = new Set([
  "active",
  "inactive",
  "suspended",
  "trial",
  "pending_chairman_registration",
  "pending_approval",
  "rejected",
  "archived",
  "deleted",
]);

const PLAN_PRICING = {
  starter: 4999,
  professional: 12999,
  premium: 12999,
  enterprise: 29999,
};

function normalizeText(value) {
  return value == null ? null : String(value).trim();
}

function normalizeSlug(value) {
  const text = normalizeText(value);
  if (!text) return null;
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCode(value) {
  const text = normalizeText(value);
  if (!text) return null;
  const normalized = text.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  return /^[A-Z0-9-]{2,30}$/.test(normalized) ? normalized : null;
}

function normalizeSocietyStatus(value, fallback = "active") {
  const normalized = normalizeText(value)?.toLowerCase();
  return SOCIETY_STATUSES.has(normalized) ? normalized : fallback;
}

function buildSocietyCodePrefix(societyName) {
  const normalized = normalizeText(societyName) || "SOCIETY";
  const firstWord = normalized.split(/\s+/)[0] || normalized;
  const letters = firstWord.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return (letters.slice(0, 3) || "SOC").padEnd(3, "X");
}

async function generateSocietyCode(societyName) {
  const prefix = buildSocietyCodePrefix(societyName);
  const { rows } = await db.query(
    `SELECT code
     FROM societies
     WHERE code ILIKE $1
     ORDER BY CAST(COALESCE(NULLIF(split_part(code, '-', 2), ''), '0') AS INTEGER) DESC, id DESC
     LIMIT 1`,
    [`${prefix}-%`]
  );

  const lastCode = rows[0]?.code || null;
  const lastSequence = lastCode ? Number.parseInt(lastCode.split("-").pop(), 10) || 0 : 0;
  return `${prefix}-${String(lastSequence + 1).padStart(4, "0")}`;
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function buildPagination({ page, pageSize, total }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

async function ensureSuperAdmin(req, res) {
  if (req.user?.role !== "super_admin") {
    res.status(403).json({ success: false, message: "Super admin access required" });
    return false;
  }

  return true;
}

function mapRoleLabel(role) {
  if (role === "chairman") return "Chairman";
  if (role === "admin") return "Chairman";
  if (role === "secretary") return "Secretary";
  if (role === "resident") return "Resident";
  if (role === "staff") return "Admin";
  if (role === "security") return "Security";
  return role ? role.replace(/_/g, " ") : "Unknown";
}

function isChairmanRole(role) {
  return ["chairman", "admin"].includes(String(role || "").toLowerCase());
}

async function createPlatformUser({ name, email, role, societyId }) {
  const temporaryPassword = crypto.randomBytes(8).toString("hex");
  const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

  const user = await userModel.createUser({
    name,
    email,
    password: hashedPassword,
    role,
    status: "pending",
    isVerified: false,
    societyId,
  });

  const approval = await UserApprovalModel.createApprovalRequest({
    userId: user.id,
    societyId,
    approvalType: "registration",
    requestedBy: null,
  });

  return { user, approval, temporaryPassword };
}

async function getPlatformStats(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const { rows: societyStatsRows } = await db.query(`
      SELECT
        COUNT(CASE WHEN status IN ('active', 'inactive', 'suspended', 'trial') AND COALESCE(code, '') <> 'DEFAULT' THEN 1 END) AS total_societies,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_societies,
        COUNT(CASE WHEN status = 'trial' THEN 1 END) AS pending_society_requests,
        COUNT(CASE WHEN status = 'pending_chairman_registration' THEN 1 END) AS pending_chairman_registrations,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) AS suspended_societies
      FROM societies
    `);

    const { rows: userStatsRows } = await db.query(`
      SELECT
        COUNT(*) AS total_users,
        COUNT(CASE WHEN role = 'resident' AND status = 'active' THEN 1 END) AS active_residents,
        COUNT(CASE WHEN role IN ('admin', 'chairman') AND status = 'pending' THEN 1 END) AS chairman_requests,
        COUNT(CASE WHEN role = 'secretary' AND status = 'pending' THEN 1 END) AS secretary_requests,
        COUNT(CASE WHEN role = 'security' AND status = 'active' THEN 1 END) AS active_security_staff
      FROM users
    `);

    const { rows: complaintStatsRows } = await db.query(`
      SELECT
        COUNT(*) AS total_complaints,
        COUNT(CASE WHEN c.status = 'pending' THEN 1 END) AS pending_complaints,
        COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) AS resolved_complaints
      FROM complaints c
    `);

    const { rows: flatStatsRows } = await db.query(`
      SELECT
        COUNT(*) AS total_flats,
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) AS occupied_flats,
        COUNT(CASE WHEN status = 'vacant' THEN 1 END) AS vacant_flats
      FROM flats
    `);

    const { rows: subscriptionStatsRows } = await db.query(`
      SELECT
        COUNT(*) AS total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_subscriptions,
        COUNT(CASE WHEN status = 'trial' THEN 1 END) AS trial_subscriptions,
        COUNT(CASE WHEN status = 'past_due' THEN 1 END) AS past_due_subscriptions,
        COUNT(CASE WHEN renewal_at IS NOT NULL AND renewal_at <= NOW() + INTERVAL '14 days' THEN 1 END) AS expiring_soon
      FROM society_subscriptions
    `);

    const { rows: revenueRows } = await db.query(`
      SELECT COALESCE(SUM(amount), 0) AS collected_revenue, COUNT(*) AS paid_payments
      FROM bill_payments
      WHERE status IN ('authorized', 'captured') OR gateway_payment_id IS NOT NULL
    `);

    const { rows: approvalRows } = await db.query(`
      SELECT COUNT(*) AS pending_approvals
      FROM user_approvals
      WHERE status = 'pending'
    `);

    const { rows: loginRows } = await db.query(`
      SELECT COUNT(*) AS login_events
      FROM audit_logs
      WHERE action LIKE '%login%'
         OR action IN ('security_login', 'login_success', 'super_admin_login')
    `);

    const societyStats = societyStatsRows[0] || {};
    const userStats = userStatsRows[0] || {};
    const complaintStats = complaintStatsRows[0] || {};
    const flatStats = flatStatsRows[0] || {};
    const subscriptionStats = subscriptionStatsRows[0] || {};
    const revenueStats = revenueRows[0] || {};
    const approvalStats = approvalRows[0] || {};
    const loginStats = loginRows[0] || {};

    return res.json({
      success: true,
      data: {
        cards: {
          totalSocieties: Number(societyStats.total_societies || 0),
          activeSocieties: Number(societyStats.active_societies || 0),
          pendingSocietyRequests: Number(societyStats.pending_society_requests || 0),
          pendingChairmanRegistrations: Number(societyStats.pending_chairman_registrations || 0),
          totalPlatformUsers: Number(userStats.total_users || 0),
          activeResidents: Number(userStats.active_residents || 0),
          chairmanRequests: Number(userStats.chairman_requests || 0),
          secretaryRequests: Number(userStats.secretary_requests || 0),
          revenue: Number(revenueStats.collected_revenue || 0),
          activeSubscriptions: Number(subscriptionStats.active_subscriptions || 0),
          totalComplaints: Number(complaintStats.total_complaints || 0),
          activeSecurityStaff: Number(userStats.active_security_staff || 0),
          totalFlats: Number(flatStats.total_flats || 0),
          pendingApprovals: Number(approvalStats.pending_approvals || 0),
          expiringSubscriptions: Number(subscriptionStats.expiring_soon || 0),
          loginEvents: Number(loginStats.login_events || 0),
        },
        breakdown: {
          complaintStats,
          flatStats,
          subscriptionStats,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch platform stats" });
  }
}

async function listSocieties(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    console.log("[SuperAdmin] GET /societies", { query: req.query, userId: req.user?.id });

    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 10), 100);
    const offset = (page - 1) * pageSize;
    const search = normalizeText(req.query.search);
    const status = normalizeText(req.query.status);
    const plan = normalizeText(req.query.plan);
    const sortBy = normalizeText(req.query.sortBy) || "created_at";
    const sortOrder = String(req.query.sortOrder || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    const allowedSorts = new Set(["created_at", "name", "code", "status", "subscription_plan", "city"]);
    const orderColumn = allowedSorts.has(sortBy) ? sortBy : "created_at";

    const filters = [];
    const params = [];

    if (search) {
      filters.push("(s.name ILIKE $" + (params.length + 1) + " OR s.code ILIKE $" + (params.length + 2) + " OR s.city ILIKE $" + (params.length + 3) + " OR s.state ILIKE $" + (params.length + 4) + " OR s.address ILIKE $" + (params.length + 5) + " OR s.pincode ILIKE $" + (params.length + 6) + ")");
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    if (status === "deleted") {
      filters.push(`s.status = $${params.length + 1}`);
      params.push(status);
    } else if (SOCIETY_STATUSES.has(status)) {
      filters.push(`s.status = $${params.length + 1}`);
      params.push(status);
    } else {
      filters.push("s.status <> 'deleted'");
    }

    if (plan) {
      filters.push(`s.subscription_plan = $${params.length + 1}`);
      params.push(plan);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) AS count FROM societies s ${whereClause}`,
      params
    );

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const { rows } = await db.query(
      `SELECT
         s.id,
         s.code,
         s.code AS society_code,
         s.name,
         COALESCE(s.society_name, s.name) AS society_name,
         s.address,
         s.city,
         s.state,
         s.pincode,
         s.status,
         s.subscription_plan,
         s.created_at,
         chairman.name AS chairman_name,
         chairman.email AS chairman_email,
         secretary.name AS secretary_name,
         secretary.email AS secretary_email,
         COALESCE(flat_stats.total_flats, 0) AS total_flats,
         COALESCE(resident_stats.total_residents, 0) AS total_residents,
         COALESCE(subscription.status, 'trial') AS billing_status,
         COALESCE(subscription.billing_cycle, 'monthly') AS billing_cycle,
         subscription.renewal_at,
         subscription.provider_name,
         subscription.plan_name,
         COALESCE(revenue.total_revenue, 0) AS society_revenue
       FROM societies s
       LEFT JOIN users chairman ON chairman.id = s.primary_admin_user_id
       LEFT JOIN (
         SELECT u1.*
         FROM users u1
         INNER JOIN (
           SELECT society_id, MAX(id) AS latest_id
           FROM users
           WHERE role = 'secretary'
           GROUP BY society_id
         ) latest_secretary ON latest_secretary.latest_id = u1.id
       ) secretary ON secretary.society_id = s.id
       LEFT JOIN (
         SELECT society_id, COUNT(*) AS total_flats
         FROM flats
         GROUP BY society_id
       ) flat_stats ON flat_stats.society_id = s.id
       LEFT JOIN (
         SELECT society_id, COUNT(*) AS total_residents
         FROM users
         WHERE role = 'resident' AND status = 'active'
         GROUP BY society_id
       ) resident_stats ON resident_stats.society_id = s.id
       LEFT JOIN society_subscriptions subscription ON subscription.society_id = s.id
       LEFT JOIN (
         SELECT b.society_id, COALESCE(SUM(bp.amount), 0) AS total_revenue
         FROM bill_payments bp
         INNER JOIN bills b ON b.id = bp.bill_id
         WHERE bp.status IN ('authorized', 'captured')
         GROUP BY b.society_id
       ) revenue ON revenue.society_id = s.id
       ${whereClause}
       ORDER BY ${orderColumn} ${sortOrder}
       LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      [...params, pageSize, offset]
    );

    console.log("[SuperAdmin] GET /societies result", { count: rows.length, total: Number(countRows[0]?.count || 0) });

    return res.json({
      success: true,
      data: rows,
      pagination: buildPagination({ page, pageSize, total: Number(countRows[0]?.count || 0) }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch societies" });
  }
}

async function exportSocieties(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const search = normalizeText(req.query.search);
    const status = normalizeText(req.query.status);
    const plan = normalizeText(req.query.plan);
    const sortBy = normalizeText(req.query.sortBy) || 'created_at';
    const sortOrder = String(req.query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const allowedSorts = new Set(['created_at', 'name', 'code', 'status', 'subscription_plan', 'city']);
    const orderColumn = allowedSorts.has(sortBy) ? sortBy : 'created_at';

    const filters = [];
    const params = [];

    if (search) {
      filters.push("(s.name ILIKE $" + (params.length + 1) + " OR s.code ILIKE $" + (params.length + 2) + " OR s.city ILIKE $" + (params.length + 3) + " OR s.state ILIKE $" + (params.length + 4) + " OR s.address ILIKE $" + (params.length + 5) + " OR s.pincode ILIKE $" + (params.length + 6) + ")");
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like);
    }

    if (status === 'deleted') {
      filters.push(`s.status = $${params.length + 1}`);
      params.push(status);
    } else if (SOCIETY_STATUSES.has(status)) {
      filters.push(`s.status = $${params.length + 1}`);
      params.push(status);
    } else {
      filters.push("s.status <> 'deleted'");
    }

    if (plan) {
      filters.push(`s.subscription_plan = $${params.length + 1}`);
      params.push(plan);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT s.id, s.code, COALESCE(s.society_name, s.name) AS name, s.city, s.state, s.pincode, s.status, s.subscription_plan, s.created_at
       FROM societies s
       ${whereClause}
       ORDER BY ${orderColumn} ${sortOrder}`,
      params
    );

    // Build CSV
    const headers = ['id','code','name','city','state','pincode','status','subscription_plan','created_at'];
    const csvRows = [headers.join(',')];
    for (const r of rows) {
      const line = headers.map(h => {
        const v = r[h] === null || r[h] === undefined ? '' : String(r[h]);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(',');
      csvRows.push(line);
    }

    const csv = csvRows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="societies.csv"');
    return res.send(csv);
  } catch (error) {
    console.error('[SuperAdmin] exportSocieties failed', error.message || error);
    return res.status(500).json({ success: false, message: 'Failed to export societies' });
  }
}

async function bulkUpdateSocieties(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const { action, ids } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }

    const allowedActions = new Set(['suspend', 'activate', 'delete']);
    if (!allowedActions.has(action)) {
      return res.status(400).json({ success: false, message: 'invalid action' });
    }

    let nextStatus = 'active';
    if (action === 'suspend') nextStatus = 'suspended';
    if (action === 'delete') nextStatus = 'deleted';

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(`UPDATE societies SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = ANY($2::int[])`, [nextStatus, ids]);

      await auditModel.createAuditLog({
        userId: req.user.id,
        action: `societies_bulk_${action}`,
        resourceType: 'society',
        resourceId: null,
        details: { ids, action },
        status: 'success',
      });

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return res.json({ success: true, message: 'Bulk update applied', count: ids.length });
  } catch (error) {
    console.error('[SuperAdmin] bulkUpdateSocieties failed', error.message || error);
    return res.status(500).json({ success: false, message: 'Failed to perform bulk update' });
  }
}

async function createSociety(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    console.log("[SuperAdmin] POST /societies", { bodyKeys: Object.keys(req.body || {}), userId: req.user?.id });

    const {
      code,
      societyCode,
      society_code,
      name,
      society_name,
      societyName,
      address,
      city,
      state,
      pincode,
      contact_email,
      contact_phone,
      contactEmail,
      contactPhone,
      chairmanName,
      chairman_email,
      chairmanEmail: chairmanEmailCamel,
      chairman_mobile,
      chairmanMobile,
      secretaryName,
      secretary_email,
      secretaryEmail: secretaryEmailCamel,
      subscriptionPlan = "starter",
      subscription_plan,
      status = "active",
      defaultLanguage = "en",
      default_language,
    } = req.body || {};

    const normalizedSocietyName = normalizeText(society_name || societyName || name);
    if (!normalizedSocietyName) {
      return res.status(400).json({ success: false, message: "Society name is required" });
    }

    const normalizedChairmanEmail = normalizeText(chairman_email || chairmanEmailCamel);
    const normalizedChairmanMobile = normalizeText(chairman_mobile || chairmanMobile);
    if ((normalizedChairmanEmail && !normalizedChairmanMobile) || (!normalizedChairmanEmail && normalizedChairmanMobile)) {
      return res.status(400).json({ success: false, message: "Chairman email and mobile are required together" });
    }

    const normalizedStatus = normalizedChairmanEmail
      ? "pending_chairman_registration"
      : normalizeSocietyStatus(status, "active");
    const normalizedSubscriptionPlan = normalizeText(subscriptionPlan || subscription_plan) || "starter";
    const normalizedDefaultLanguage = normalizeText(defaultLanguage || default_language) || "en";

    const requestedCodeInput = code ?? societyCode ?? society_code ?? null;
    const normalizedCodeInput = normalizeCode(requestedCodeInput);

    if (requestedCodeInput !== null && requestedCodeInput !== undefined && String(requestedCodeInput).trim() !== "" && !normalizedCodeInput) {
      return res.status(400).json({ success: false, message: "Society code must be 2 to 30 characters using only uppercase letters, numbers, and hyphens." });
    }

    const normalizedCode = normalizedCodeInput || (await generateSocietyCode(normalizedSocietyName));

    if (normalizedCodeInput) {
      const existingSociety = await societyModel.getSocietyByCode(normalizedCode);
      if (existingSociety) {
        return res.status(409).json({ success: false, message: "Society code already exists." });
      }
    }

    const society = await societyModel.createSociety({
      code: normalizedCode,
      name: normalizedSocietyName,
      societyName: normalizedSocietyName,
      slug: normalizeSlug(`${normalizedSocietyName}-${normalizedCode}`) || normalizedCode.toLowerCase(),
      subdomain: normalizeSlug(normalizedCode) || normalizedCode.toLowerCase(),
      address: normalizeText(address),
      city: normalizeText(city),
      state: normalizeText(state),
      pincode: normalizeText(pincode),
      contactEmail: normalizeText(contact_email || contactEmail || normalizedChairmanEmail),
      contactPhone: normalizeText(contact_phone || contactPhone || normalizedChairmanMobile),
      status: normalizedStatus,
      subscriptionPlan: normalizedSubscriptionPlan,
      defaultLanguage: normalizedDefaultLanguage,
      createdBy: req.user.id,
    });

    await tenantModel.updateTenantSubscription(society.id, {
      planName: normalizedSubscriptionPlan,
      status: normalizedStatus === "active" ? "active" : "trial",
      billingCycle: "monthly",
      renewalAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      providerName: "platform",
      limits: {
        seats: normalizedSubscriptionPlan === "enterprise" ? 5000 : normalizedSubscriptionPlan === "premium" ? 2500 : 500,
      },
    });

    let chairman = null;

    let secretary = null;
    if (secretaryName && secretaryEmail) {
      secretary = await createPlatformUser({
        name: normalizeText(secretaryName),
        email: normalizeText(secretaryEmail),
        role: "secretary",
        societyId: society.id,
      });
    }

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "society_created",
      resourceType: "society",
      resourceId: society.id,
      details: { code: normalizedCode, name: normalizedSocietyName, plan: normalizedSubscriptionPlan },
      status: "success",
      societyId: society.id,
    });

    return res.status(201).json({
      success: true,
      message: "Society created successfully",
      data: {
        society: await societyModel.getSocietyById(society.id),
        chairman: chairman?.user || null,
        secretary: secretary?.user || null,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, message: "Society code already exists" });
    }

    console.error("[SuperAdmin] Failed to create society", error.code || error.message, error.sqlMessage || "");

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to create society",
      details: error?.sqlMessage || null,
    });
  }
}

async function updateSociety(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    console.log("[SuperAdmin] PUT/PATCH /societies/:id", {
      societyId: req.params.id,
      bodyKeys: Object.keys(req.body || {}),
      userId: req.user?.id,
    });

    const societyId = Number(req.params.id);
    const society = await societyModel.getSocietyById(societyId);
    if (!society) {
      return res.status(404).json({ success: false, message: "Society not found" });
    }

    const updates = {};
    [
      "name",
      "societyName",
      "address",
      "city",
      "state",
      "pincode",
      "contactEmail",
      "contactPhone",
      "status",
      "subscriptionPlan",
      "defaultLanguage",
    ].forEach((field) => {
      if (req.body?.[field] !== undefined) {
        updates[field] = field === "status" ? normalizeSocietyStatus(req.body[field], society.status || "active") : normalizeText(req.body[field]);
      }
    });

    if (req.body?.code !== undefined) {
      const nextCode = normalizeCode(req.body.code);
      if (!nextCode) {
        return res.status(400).json({ success: false, message: "Invalid society code" });
      }
      updates.code = nextCode;
      updates.slug = normalizeSlug(`${req.body.slug || society.name}-${nextCode}`) || nextCode.toLowerCase();
      updates.subdomain = normalizeSlug(req.body.subdomain || nextCode) || nextCode.toLowerCase();
    }

    await societyModel.updateSocietyById(societyId, updates);

    const auditAction = updates.status === "deleted" ? "society_deleted" : updates.status === "suspended" ? "society_suspended" : "society_updated";

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: auditAction,
      resourceType: "society",
      resourceId: societyId,
      details: { fields: Object.keys(updates) },
      status: "success",
      societyId,
    });

    return res.json({
      success: true,
      message: "Society updated successfully",
      data: await societyModel.getSocietyById(societyId),
    });
  } catch (error) {
    console.error("[SuperAdmin] Failed to update society", error.code || error.message, error.sqlMessage || "");
    return res.status(500).json({ success: false, message: "Failed to update society" });
  }
}

async function getSocietyDetails(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const societyId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(societyId) || societyId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid society id" });
    }

    console.log("[SuperAdmin] GET /societies/:id", { societyId, params: req.params, userId: req.user?.id });

    const society = await societyModel.getSocietyById(societyId);
    if (!society) {
      return res.status(404).json({ success: false, message: "Society not found" });
    }

    const results = await Promise.all([
      db.query(
        `SELECT
          COUNT(*) AS total_users,
          COUNT(CASE WHEN role = 'resident' AND status = 'active' THEN 1 END) AS total_residents,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) AS chairman_count,
          COUNT(CASE WHEN role = 'secretary' THEN 1 END) AS secretary_count,
          COUNT(CASE WHEN role = 'security' AND status = 'active' THEN 1 END) AS active_security_staff
         FROM users
         WHERE society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT
          COUNT(*) AS total_flats,
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) AS occupied_flats,
          COUNT(CASE WHEN status = 'vacant' THEN 1 END) AS vacant_flats
         FROM flats
         WHERE society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT
          COUNT(*) AS total_complaints,
          COUNT(CASE WHEN c.status = 'pending' THEN 1 END) AS pending_complaints,
          COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) AS resolved_complaints
         FROM complaints c
         JOIN users u ON u.id = c.resident_id
         WHERE u.society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT COUNT(*) AS total_visitors
         FROM visitors v
         LEFT JOIN flats f ON f.id = v.flat_id
         WHERE f.society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT
          COUNT(*) AS total_payment_records,
          COUNT(DISTINCT b.id) AS total_bills,
          COALESCE(SUM(bp.amount), 0) AS total_payments
         FROM bill_payments bp
         INNER JOIN bills b ON b.id = bp.bill_id
         WHERE b.society_id = $1 AND bp.status IN ('authorized', 'captured')`,
        [societyId]
      ),
      db.query(
        `SELECT COUNT(*) AS total_notices
         FROM notices
         WHERE society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT id, plan_name, status, billing_cycle, renewal_at, provider_name, provider_subscription_id
         FROM society_subscriptions
         WHERE society_id = $1
         LIMIT 1`,
        [societyId]
      ),
    ]);

    const userRows = results[0].rows;
    const flatRows = results[1].rows;
    const complaintRows = results[2].rows;
    const visitorRows = results[3].rows;
    const paymentRows = results[4].rows;
    const noticeRows = results[5].rows;
    const subscriptionRows = results[6].rows;

    const detail = null;
    const analytics = [];

    const societyData = {
      
      ...society,
      ...(detail?.society || {}),
};
    console.log("[SuperAdmin] Society detail loaded", {
      societyId,
      totalUsers: Number(userRows[0]?.total_users || 0),
      totalFlats: Number(flatRows[0]?.total_flats || 0),
      totalComplaints: Number(complaintRows[0]?.total_complaints || 0),
      totalNotices: Number(noticeRows[0]?.total_notices || 0),
      totalBills: Number(paymentRows[0]?.total_bills || 0),
      totalPaymentRecords: Number(paymentRows[0]?.total_payment_records || 0),
    });

    return res.json({
      success: true,
      data: {
        society: societyData,
        branding: detail?.branding || null,
        settings: detail?.settings || null,
        subscription: subscriptionRows[0] || detail?.subscription || null,
        counts: {
          totalUsers: Number(userRows[0]?.total_users || 0),
          totalResidents: Number(userRows[0]?.total_residents || 0),
          chairmanCount: Number(userRows[0]?.chairman_count || 0),
          secretaryCount: Number(userRows[0]?.secretary_count || 0),
          activeSecurityStaff: Number(userRows[0]?.active_security_staff || 0),
          totalFlats: Number(flatRows[0]?.total_flats || 0),
          occupiedFlats: Number(flatRows[0]?.occupied_flats || 0),
          vacantFlats: Number(flatRows[0]?.vacant_flats || 0),
          totalComplaints: Number(complaintRows[0]?.total_complaints || 0),
          pendingComplaints: Number(complaintRows[0]?.pending_complaints || 0),
          resolvedComplaints: Number(complaintRows[0]?.resolved_complaints || 0),
          totalVisitors: Number(visitorRows[0]?.total_visitors || 0),
          totalPayments: Number(paymentRows[0]?.total_payments || 0),
          totalBills: Number(paymentRows[0]?.total_bills || 0),
          totalPaymentRecords: Number(paymentRows[0]?.total_payment_records || 0),
          totalNotices: Number(noticeRows[0]?.total_notices || 0),
        },
        analytics,
      },
    });
  } catch (error) {
    console.error("[SuperAdmin] Failed to load society details", error.code || error.message, error.sqlMessage || "");
    return res.status(500).json({ success: false, message: "Failed to fetch society details" });
  }
}

async function changeSocietyCode(req, res) {
  req.body = { code: req.body?.code };
  return updateSociety(req, res);
}

async function suspendSociety(req, res) {
  req.body = { status: "suspended" };
  return updateSociety(req, res);
}

async function archiveSociety(req, res) {
  req.body = { status: "deleted" };
  return updateSociety(req, res);
}

async function getPendingApprovals(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    await societyModel.ensureChairmanColumn();
    await userModel.ensureChairmanRegistrationColumns();
    await societyModel.cleanupStaleChairmanIds();
    await UserApprovalModel.ensureSchema();

    const role = normalizeText(req.query.role);
    const validRoles = ["chairman", "secretary"];
    const approvalParams = [];
    let approvalRoleClause = "";
    if (role && validRoles.includes(role)) {
      if (role === "chairman") {
        approvalRoleClause = " AND u.role IN ('chairman', 'admin')";
      } else {
        approvalParams.push(role);
        approvalRoleClause = ` AND u.role = $${approvalParams.length}`;
      }
    }

    const { rows: approvalRows } = await db.query(
      `SELECT ua.id AS approval_id, u.id AS user_id, ua.society_id, ua.approval_type, ua.status, ua.created_at,
              u.name, u.email, COALESCE(u.mobile, u.phone) AS mobile, u.role, u.resident_type, u.is_verified,
              s.code AS society_code, s.name AS society_name
       FROM user_approvals ua
       JOIN users u ON u.id = ua.user_id
       JOIN societies s ON s.id = ua.society_id
       WHERE ua.status = 'pending'
         AND ua.approval_type IN ('registration', 'chairman_registration')
         AND u.role IN ('chairman', 'admin', 'secretary')${approvalRoleClause}
       ORDER BY ua.created_at ASC`,
      approvalParams
    );

    const rows = approvalRows.map((item) => ({
        id: item.approval_id,
        approval_id: item.approval_id,
        user_id: item.user_id,
        source: "approval",
        ...item,
      }));

    const counts = rows.reduce((acc, item) => {
      const key = isChairmanRole(item.role) ? "chairman" : item.role;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, { chairman: 0, secretary: 0 });

    return res.json({
      success: true,
      data: rows.map((item) => ({ ...item, role_label: mapRoleLabel(item.role) })),
      meta: { total: rows.length, counts },
    });
  } catch (error) {
    console.error("[SuperAdmin] Failed to fetch pending approvals", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to fetch pending approvals" });
  }
}

async function approvePendingUser(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    await societyModel.ensureChairmanColumn();
    await userModel.ensureChairmanRegistrationColumns();
    await societyModel.cleanupStaleChairmanIds();
    await UserApprovalModel.ensureSchema();

    const approvalId = Number(req.params.approvalId);
    if (!Number.isInteger(approvalId)) {
      return res.status(400).json({ success: false, message: "Invalid approval id" });
    }

    let approvalRow = null;
    let directUser = null;

    if (approvalId > 0) {
      approvalRow = await UserApprovalModel.getApprovalById(approvalId);
    } else {
      const userId = Math.abs(approvalId);

      const { rows: userRows } = await db.query(
        `SELECT id, role, status, society_id, is_verified
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [userId]
      );

      directUser = userRows[0] || null;
    }

    if (approvalRow) {
      const { rows: approvalUserRows } = await db.query(`SELECT id, role, society_id, is_verified FROM users WHERE id = $1 LIMIT 1`, [approvalRow.user_id]);
      const approvalUser = approvalUserRows[0] || null;
      const approvalUserRole = approvalUser?.role || null;
      if (!["chairman", "admin", "secretary"].includes(approvalUserRole) || !["registration", "chairman_registration"].includes(approvalRow.approval_type)) {
        return res.status(403).json({
          success: false,
          message: "Super admin can approve only chairman/secretary registration requests",
        });
      }

      if (approvalRow.status !== "pending") {
        return res.status(404).json({ success: false, message: "Approval not found" });
      }

      if (isChairmanRole(approvalUserRole) && !approvalUser.is_verified) {
        return res.status(400).json({ success: false, message: "Chairman must verify OTP before approval." });
      }

      if (isChairmanRole(approvalUserRole)) {
        const { rows: existingChairmanRows } = await db.query(
          `SELECT id
           FROM users
           WHERE society_id = $1
             AND role IN ('chairman', 'admin')
             AND status = 'active'
             AND id <> $2
             AND deleted_at IS NULL
           LIMIT 1`,
          [approvalUser.society_id, approvalUser.id]
        );
        if (existingChairmanRows.length) {
          return res.status(409).json({ success: false, message: "This society already has an active Chairman" });
        }
      }

      const approval = await UserApprovalModel.approveUser(approvalId, req.user.id, req.body?.comments || null);
      if (!approval) {
        return res.status(404).json({ success: false, message: "Approval not found" });
      }

      if (isChairmanRole(approvalUserRole)) {
        await societyModel.updateSocietyById(approvalUser.society_id, {
          status: "active",
          chairmanId: approvalUser.id,
        });
      }

      return res.json({ success: true, message: "User approved successfully", data: approval });
    }

    if (!directUser || !["pending", "pending_approval"].includes(directUser.status) || !["chairman", "admin", "secretary"].includes(directUser.role)) {
      return res.status(404).json({ success: false, message: "Approval not found" });
    }

    if (isChairmanRole(directUser.role) && !directUser.is_verified) {
      return res.status(400).json({ success: false, message: "Chairman must verify OTP before approval." });
    }

    if (isChairmanRole(directUser.role)) {
      const { rows: existingChairmanRows } = await db.query(
        `SELECT id
         FROM users
         WHERE society_id = $1
           AND role IN ('chairman', 'admin')
           AND status = 'active'
           AND id <> $2
           AND deleted_at IS NULL
         LIMIT 1`,
        [directUser.society_id, directUser.id]
      );
      if (existingChairmanRows.length) {
        return res.status(409).json({ success: false, message: "This society already has an active Chairman" });
      }
    }

    await db.query(`UPDATE users SET status = 'active', is_verified = TRUE WHERE id = $1`, [directUser.id]);
    if (isChairmanRole(directUser.role)) {
      await societyModel.updateSocietyById(directUser.society_id, {
        status: "active",
        chairmanId: directUser.id,
      });
    }
    const response = { user_id: directUser.id, role: directUser.role, status: "active", approved_by: req.user.id };

    return res.json({ success: true, message: "User approved successfully", data: response });
  } catch (error) {
    console.error("[SuperAdmin] Failed to approve pending user", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to approve user" });
  }
}

async function assignChairman(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const societyId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(societyId) || societyId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid society id' });
    }

    const { userId, userEmail } = req.body || {};
    if (!userId && !userEmail) {
      return res.status(400).json({ success: false, message: 'userId or userEmail is required' });
    }

    // find society
    const society = await societyModel.getSocietyById(societyId);
    if (!society) return res.status(404).json({ success: false, message: 'Society not found' });

    // find user
    let userRow = null;
    if (userId) {
      const { rows } = await db.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
      userRow = rows[0] || null;
    } else {
      const { rows } = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [String(userEmail).trim()]);
      userRow = rows[0] || null;
    }

    if (!userRow) return res.status(404).json({ success: false, message: 'User not found' });

    // perform assignment inside transaction
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE users SET role = $1, status = $2, society_id = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
        ['chairman', 'active', societyId, userRow.id]
      );

      await conn.query(
        `UPDATE societies SET chairman_id = $1, primary_admin_user_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [userRow.id, societyId]
      );

      await auditModel.createAuditLog({
        userId: req.user.id,
        action: 'assign_chairman',
        resourceType: 'society',
        resourceId: societyId,
        details: { assignedUserId: userRow.id, assignedUserEmail: userRow.email },
        status: 'success',
        societyId,
      });

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    return res.json({ success: true, message: 'Chairman assigned', data: { userId: userRow.id } });
  } catch (error) {
    console.error('[SuperAdmin] assignChairman failed', error?.message || error);
    return res.status(500).json({ success: false, message: 'Failed to assign chairman' });
  }
}

async function searchUsers(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const q = normalizeText(req.query.query || req.query.q || '');
    const limit = Math.min(parsePositiveInt(req.query.limit, 10), 50);

    if (!q) return res.json({ success: true, data: [] });

    const like = `%${q}%`;
    const { rows } = await db.query(
      `SELECT id, name, email, role, society_id FROM users WHERE (LOWER(name) ILIKE $1 OR LOWER(email) ILIKE $1) AND deleted_at IS NULL ORDER BY id DESC LIMIT $2`,
      [like, limit]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('[SuperAdmin] searchUsers failed', error.message || error);
    return res.status(500).json({ success: false, message: 'Failed to search users' });
  }
}

async function rejectPendingUser(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    await userModel.ensureChairmanRegistrationColumns();
    await UserApprovalModel.ensureSchema();

    const approvalId = Number(req.params.approvalId);
    const reason = normalizeText(req.body?.reason);
    if (!reason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required" });
    }

    if (!Number.isInteger(approvalId)) {
      return res.status(400).json({ success: false, message: "Invalid approval id" });
    }

    let approvalRow = null;
    let directUser = null;

    if (approvalId > 0) {
      approvalRow = await UserApprovalModel.getApprovalById(approvalId);
    } else {
      const userId = Math.abs(approvalId);

      const { rows: userRows } = await db.query(
        `SELECT id, role, status, society_id
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [userId]
      );

      directUser = userRows[0] || null;
    }

    if (approvalRow) {
      const { rows: approvalUserRows } = await db.query(`SELECT role FROM users WHERE id = $1 LIMIT 1`, [approvalRow.user_id]);
      const approvalUserRole = approvalUserRows[0]?.role || null;
      if (!["chairman", "admin", "secretary"].includes(approvalUserRole) || !["registration", "chairman_registration"].includes(approvalRow.approval_type)) {
        return res.status(403).json({
          success: false,
          message: "Super admin can reject only chairman/secretary registration requests",
        });
      }

      if (approvalRow.status !== "pending") {
        return res.status(404).json({ success: false, message: "Approval not found" });
      }

      const approval = await UserApprovalModel.rejectUser(approvalId, req.user.id, reason);
      if (!approval) {
        return res.status(404).json({ success: false, message: "Approval not found" });
      }

      return res.json({ success: true, message: "User rejected successfully", data: approval });
    }

    if (!directUser || !["pending", "pending_approval"].includes(directUser.status) || !["chairman", "admin", "secretary"].includes(directUser.role)) {
      return res.status(404).json({ success: false, message: "Approval not found" });
    }

    await db.query(`UPDATE users SET status = 'rejected' WHERE id = $1`, [directUser.id]);
    const response = { user_id: directUser.id, role: directUser.role, status: "rejected", rejected_by: req.user.id, rejection_reason: reason };

    return res.json({ success: true, message: "User rejected successfully", data: response });
  } catch (error) {
    console.error("[SuperAdmin] Failed to reject pending user", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to reject user" });
  }
}

async function getActivityLogs(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 25), 100);
    const offset = (page - 1) * pageSize;
    const search = normalizeText(req.query.search);
    const action = normalizeText(req.query.action);

    const filters = [];
    const params = [];

    if (search) {
      filters.push(`(al.action ILIKE $${params.length + 1} OR u.name ILIKE $${params.length + 2} OR u.email ILIKE $${params.length + 3} OR al.details ILIKE $${params.length + 4})`);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }

    if (action) {
      filters.push(`al.action = $${params.length + 1}`);
      params.push(action);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) AS count FROM audit_logs al LEFT JOIN users u ON u.id = al.user_id ${whereClause}`,
      params
    );

    const { rows } = await db.query(
      `SELECT al.id, al.user_id, al.action, al.resource_type, al.resource_id, al.details, al.status, al.ip_address, al.user_agent, al.society_id, al.builder_id, al.created_at,
              u.name AS user_name, u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    const pagination = buildPagination({ page, pageSize, total: Number(countRows[0]?.count || 0) });
    return res.json({
      success: true,
      activities: rows,
      total: pagination.total,
      page: pagination.page,
      limit: pagination.pageSize,
      totalPages: pagination.totalPages,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
  }
}

async function getSubscriptions(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const { rows } = await db.query(
      `SELECT s.id, s.society_id, s.plan_name, s.status, s.billing_cycle, s.renewal_at, s.provider_name, s.provider_subscription_id,
              soc.name AS society_name, soc.code AS society_code, soc.status AS society_status,
              CASE
                WHEN s.plan_name = 'enterprise' THEN ${PLAN_PRICING.enterprise}
                WHEN s.plan_name IN ('professional', 'premium') THEN ${PLAN_PRICING.professional}
                ELSE ${PLAN_PRICING.starter}
              END AS monthly_value
       FROM society_subscriptions s
       JOIN societies soc ON soc.id = s.society_id
       ORDER BY s.updated_at DESC, s.id DESC`
    );

    const summary = rows.reduce((acc, item) => {
      acc.total += 1;
      acc[item.status] = (acc[item.status] || 0) + 1;
      acc.revenue += Number(item.monthly_value || 0);
      return acc;
    }, { total: 0, active: 0, trial: 0, past_due: 0, cancelled: 0, revenue: 0 });

    return res.json({
      success: true,
      data: {
        summary,
        plans: [
          { name: "Starter", key: "starter", price: PLAN_PRICING.starter },
          { name: "Premium", key: "premium", price: PLAN_PRICING.premium },
          { name: "Enterprise", key: "enterprise", price: PLAN_PRICING.enterprise },
        ],
        subscriptions: rows,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch subscriptions" });
  }
}

async function getPlatformAnalytics(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const { rows: societyGrowth } = await db.query(`
      SELECT to_char(created_at, 'YYYY-MM') AS period, COUNT(*) AS total
      FROM societies
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `);

    const { rows: userGrowth } = await db.query(`
      SELECT to_char(created_at, 'YYYY-MM') AS period, COUNT(*) AS total
      FROM users
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `);

    const { rows: complaintTrend } = await db.query(`
      SELECT to_char(created_at, 'YYYY-MM') AS period, COUNT(*) AS total
      FROM complaints
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `);

    const { rows: revenueTrend } = await db.query(`
      SELECT to_char(bp.created_at, 'YYYY-MM') AS period, COALESCE(SUM(bp.amount), 0) AS total
      FROM bill_payments bp
      WHERE bp.status IN ('authorized', 'captured')
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `);

    const { rows: loginTrend } = await db.query(`
      SELECT to_char(created_at, 'YYYY-MM') AS period, COUNT(*) AS total
      FROM audit_logs
      WHERE action ILIKE '%login%'
         OR action IN ('security_login', 'login_success', 'super_admin_login')
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `);

    return res.json({
      success: true,
      data: {
        societyGrowth: societyGrowth.reverse(),
        userGrowth: userGrowth.reverse(),
        complaintTrend: complaintTrend.reverse(),
        revenueTrend: revenueTrend.reverse(),
        loginTrend: loginTrend.reverse(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
}

async function getSocietyAnalytics(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const societyId = Number(req.params.id);
    const society = await societyModel.getSocietyById(societyId);
    if (!society) {
      return res.status(404).json({ success: false, message: "Society not found" });
    }

    const analyticsResults = await Promise.all([
      db.query(
        `SELECT
          COUNT(*) AS total_users,
          COUNT(CASE WHEN role = 'resident' AND status = 'active' THEN 1 END) AS active_residents,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) AS chairman_count,
          COUNT(CASE WHEN role = 'secretary' THEN 1 END) AS secretary_count,
          COUNT(CASE WHEN role = 'security' AND status = 'active' THEN 1 END) AS active_security_staff
         FROM users
         WHERE society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT
          COUNT(*) AS total_flats,
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) AS occupied_flats,
          COUNT(CASE WHEN status = 'vacant' THEN 1 END) AS vacant_flats
         FROM flats
         WHERE society_id = $1`,
        [societyId]
      ),
      db.query(
        `ELECT COUNT(*) AS total_complaints,,
                COUNT(CASE WHEN c.status = 'pending' THEN 1 END) AS pending_complaints,
              COUNT(CASE WHEN c.status = 'resolved' THEN 1 END) AS resolved_complaints
         FROM complaints c
         JOIN users u ON u.id = c.resident_id
         WHERE u.society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT
          COUNT(*) AS total_visitors,
          COUNT(CASE WHEN v.status = 'in_premises' THEN 1 END) AS active_visitors
         FROM visitors v
         LEFT JOIN flats f ON f.id = v.flat_id
         WHERE f.society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT
          COUNT(*) AS total_bills,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_bills,
          COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) AS unpaid_bills,
          COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN paid_amount ELSE 0 END), 0) AS monthly_collection
         FROM bills
         WHERE society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT COUNT(*) AS total_activity
         FROM audit_logs
         WHERE society_id = $1`,
        [societyId]
      ),
      db.query(
        `SELECT plan_name, status, billing_cycle, renewal_at, provider_name
         FROM society_subscriptions
         WHERE society_id = $1
         LIMIT 1`,
        [societyId]
      ),
    ]);

    const userStats = analyticsResults[0].rows;
    const flatStats = analyticsResults[1].rows;
    const complaintStats = analyticsResults[2].rows;
    const visitorStats = analyticsResults[3].rows;
    const billStats = analyticsResults[4].rows;
    const activityStats = analyticsResults[5].rows;
    const subscriptionStats = analyticsResults[6].rows;

    console.log("[SuperAdmin] Society analytics loaded", {
      societyId,
      totalResidents: Number(userStats[0]?.active_residents || 0),
      totalFlats: Number(flatStats[0]?.total_flats || 0),
      activeVisitors: Number(visitorStats[0]?.active_visitors || 0),
      paidBills: Number(billStats[0]?.paid_bills || 0),
      unpaidBills: Number(billStats[0]?.unpaid_bills || 0),
    });

    return res.json({
      success: true,
      data: {
        society,
        userStats: userStats[0] || {},
        flatStats: flatStats[0] || {},
        complaintStats: complaintStats[0] || {},
        visitorStats: visitorStats[0] || {},
        billStats: billStats[0] || {},
        activityStats: activityStats[0] || {},
        subscription: subscriptionStats[0] || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch society analytics" });
  }
}

async function tableExists(tableName) {
  const { rows } = await db.query("SELECT to_regclass($1) AS table_name", [`public.${tableName}`]);
  return Boolean(rows[0]?.table_name);
}

async function listUsers(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const page = parsePositiveInt(req.query.page, 1);
    const pageSize = Math.min(parsePositiveInt(req.query.pageSize, 25), 100);
    const offset = (page - 1) * pageSize;
    const search = normalizeText(req.query.search);
    const role = normalizeText(req.query.role);
    const status = normalizeText(req.query.status);
    const sortBy = normalizeText(req.query.sortBy) || "created_at";
    const sortOrder = String(req.query.sortOrder || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
    const allowedSorts = new Set(["created_at", "name", "email", "role", "status"]);
    const orderColumn = allowedSorts.has(sortBy) ? sortBy : "created_at";

    const filters = ["u.deleted_at IS NULL"];
    const params = [];

    if (search) {
      const like = `%${search}%`;
      filters.push(`(u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 2} OR s.name ILIKE $${params.length + 3} OR s.code ILIKE $${params.length + 4})`);
      params.push(like, like, like, like);
    }

    if (role) {
      filters.push(`u.role = $${params.length + 1}`);
      params.push(role);
    }

    if (status) {
      filters.push(`u.status = $${params.length + 1}`);
      params.push(status);
    }

    const whereClause = `WHERE ${filters.join(" AND ")}`;
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) AS count
       FROM users u
       LEFT JOIN societies s ON s.id = u.society_id
       ${whereClause}`,
      params
    );

    const { rows } = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.is_verified, u.society_id, u.created_at,
              s.name AS society_name, s.code AS society_code
       FROM users u
       LEFT JOIN societies s ON s.id = u.society_id
       ${whereClause}
       ORDER BY u.${orderColumn} ${sortOrder}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset]
    );

    return res.json({
      success: true,
      data: rows,
      pagination: buildPagination({ page, pageSize, total: Number(countRows[0]?.count || 0) }),
    });
  } catch (error) {
    console.error("[SuperAdmin] listUsers failed", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
}

async function updateUserStatus(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const userId = Number.parseInt(req.params.id, 10);
    const status = normalizeText(req.body?.status)?.toLowerCase();
    const allowedStatuses = new Set(["active", "pending", "pending_approval", "suspended", "rejected", "inactive"]);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }
    if (!allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, message: "Invalid user status" });
    }

    const { rows } = await db.query(
      `UPDATE users
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, name, email, role, status`,
      [status, userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: `user_${status}`,
      resourceType: "user",
      resourceId: userId,
      details: { status },
      status: "success",
    });

    return res.json({ success: true, message: "User status updated", data: rows[0] });
  } catch (error) {
    console.error("[SuperAdmin] updateUserStatus failed", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to update user status" });
  }
}

async function deleteUser(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const userId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const { rows } = await db.query(
      `UPDATE users
       SET deleted_at = CURRENT_TIMESTAMP, status = 'inactive', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await auditModel.createAuditLog({
      userId: req.user.id,
      action: "user_deleted",
      resourceType: "user",
      resourceId: userId,
      details: {},
      status: "success",
    });

    return res.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error("[SuperAdmin] deleteUser failed", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to delete user" });
  }
}

async function getRevenueStats(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const hasPayments = await tableExists("bill_payments");
    const hasBills = await tableExists("bills");
    if (!hasPayments || !hasBills) {
      return res.json({ success: true, data: { summary: {}, invoices: [], trend: [] } });
    }

    const { rows: summaryRows } = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN bp.status IN ('authorized', 'captured') OR bp.gateway_payment_id IS NOT NULL THEN bp.amount ELSE 0 END), 0) AS monthly_revenue,
        COUNT(CASE WHEN bp.status IN ('authorized', 'captured') OR bp.gateway_payment_id IS NOT NULL THEN 1 END) AS paid_payments,
        COUNT(CASE WHEN b.payment_status IN ('pending', 'unpaid') THEN 1 END) AS pending_payments,
        COUNT(CASE WHEN b.due_date < CURRENT_DATE AND b.payment_status <> 'paid' THEN 1 END) AS expired_payments
      FROM bills b
      LEFT JOIN bill_payments bp ON bp.bill_id = b.id
      WHERE b.created_at >= date_trunc('month', CURRENT_DATE)
    `);

    const { rows: trend } = await db.query(`
      SELECT to_char(bp.created_at, 'YYYY-MM') AS period, COALESCE(SUM(bp.amount), 0) AS total
      FROM bill_payments bp
      WHERE bp.status IN ('authorized', 'captured') OR bp.gateway_payment_id IS NOT NULL
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `);

    const { rows: invoices } = await db.query(`
      SELECT b.id, b.title, b.total_amount AS amount, b.payment_status, b.due_date, b.created_at,
             s.name AS society_name, s.code AS society_code
      FROM bills b
      LEFT JOIN societies s ON s.id = b.society_id
      ORDER BY b.created_at DESC
      LIMIT 25
    `);

    return res.json({
      success: true,
      data: {
        summary: summaryRows[0] || {},
        trend: trend.reverse(),
        invoices,
      },
    });
  } catch (error) {
    console.error("[SuperAdmin] getRevenueStats failed", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to fetch revenue stats" });
  }
}

async function getSupportTickets(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const hasComplaints = await tableExists("complaints");
    if (!hasComplaints) {
      return res.json({ success: true, data: [], summary: { open: 0, in_progress: 0, resolved: 0, escalated: 0 } });
    }

    const status = normalizeText(req.query.status);
    const filters = [];
    const params = [];
    if (status) {
      filters.push(`c.status = $${params.length + 1}`);
      params.push(status);
    }
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const { rows } = await db.query(
      `SELECT c.id, c.title, c.description, c.status, c.category, c.created_at, c.updated_at,
              u.name AS requester_name, u.email AS requester_email,
              s.name AS society_name, s.code AS society_code
       FROM complaints c
       LEFT JOIN users u ON u.id = c.resident_id
       LEFT JOIN societies s ON s.id = COALESCE(c.society_id, u.society_id)
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT 100`,
      params
    );

    const summary = rows.reduce((acc, row) => {
      const key = row.status || "open";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, { open: 0, pending: 0, in_progress: 0, resolved: 0, escalated: 0 });

    return res.json({ success: true, data: rows, summary });
  } catch (error) {
    console.error("[SuperAdmin] getSupportTickets failed", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to fetch support tickets" });
  }
}

async function updateSupportTicketStatus(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const hasComplaints = await tableExists("complaints");
    if (!hasComplaints) {
      return res.status(404).json({ success: false, message: "Support table not found" });
    }

    const ticketId = Number.parseInt(req.params.id, 10);
    const status = normalizeText(req.body?.status)?.toLowerCase();
    const allowedStatuses = new Set(["open", "pending", "in_progress", "resolved", "closed", "escalated"]);
    if (!Number.isInteger(ticketId) || ticketId <= 0 || !allowedStatuses.has(status)) {
      return res.status(400).json({ success: false, message: "Invalid ticket update" });
    }

    const { rows } = await db.query(
      `UPDATE complaints
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status`,
      [status, ticketId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    return res.json({ success: true, message: "Ticket updated", data: rows[0] });
  } catch (error) {
    console.error("[SuperAdmin] updateSupportTicketStatus failed", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to update support ticket" });
  }
}

async function getSystemHealth(req, res) {
  try {
    if (!(await ensureSuperAdmin(req, res))) return;

    const started = Date.now();
    const { rows: dbRows } = await db.query("SELECT NOW() AS checked_at");
    const latencyMs = Date.now() - started;
    const hasAuditLogs = await tableExists("audit_logs");

    let failedLogins = 0;
    let activeSessions = 0;
    if (hasAuditLogs) {
      const { rows } = await db.query(`
        SELECT
          COUNT(CASE WHEN status = 'failed' OR action ILIKE '%failed%' THEN 1 END) AS failed_logins,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' AND action ILIKE '%login%' THEN 1 END) AS active_sessions
        FROM audit_logs
      `);
      failedLogins = Number(rows[0]?.failed_logins || 0);
      activeSessions = Number(rows[0]?.active_sessions || 0);
    }

    return res.json({
      success: true,
      data: {
        backend: { status: "operational", uptimeSeconds: Math.round(process.uptime()) },
        database: { status: "connected", checkedAt: dbRows[0]?.checked_at, latencyMs },
        api: { status: latencyMs < 800 ? "healthy" : "degraded", latencyMs },
        storage: { status: "available", usagePercent: null },
        sessions: { active: activeSessions, failedLogins },
        supabase: { status: "connected", host: db.getDatabaseHost ? db.getDatabaseHost() : "configured" },
      },
    });
  } catch (error) {
    console.error("[SuperAdmin] getSystemHealth failed", error.message || error);
    return res.status(500).json({ success: false, message: "Failed to fetch system health" });
  }
}

module.exports = {
  getPlatformStats,
  listSocieties,
  createSociety,
  updateSociety,
  getSocietyDetails,
  changeSocietyCode,
  suspendSociety,
  archiveSociety,
  getPendingApprovals,
  approvePendingUser,
  rejectPendingUser,
  assignChairman,
  exportSocieties,
  bulkUpdateSocieties,
  searchUsers,
  listUsers,
  updateUserStatus,
  deleteUser,
  getActivityLogs,
  getSubscriptions,
  getRevenueStats,
  getSupportTickets,
  updateSupportTicketStatus,
  getSystemHealth,
  getPlatformAnalytics,
  getSocietyAnalytics,
};
