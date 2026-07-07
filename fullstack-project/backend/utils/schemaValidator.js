const db = require("../config/db");

const requiredSchema = {
  users: [
    "id",
    "name",
    "email",
    "password",
    "role",
    "status",
    "is_verified",
    "society_id",
    "flat_id",
    "flat_number",
    "created_at",
    "updated_at",
    "last_login",
    "deleted_at",
    "deleted_by",
    "delete_reason",
    "original_email",
    "permanently_deleted_at",
  ],
  societies: [
    "id",
    "code",
    "slug",
    "subdomain",
    "name",
    "status",
    "subscription_plan",
    "city",
    "state",
  ],
  builders: ["id", "name", "email", "slug", "status", "created_at"],
  flats: ["id", "society_id", "wing", "flat_number", "status", "created_at", "updated_at"],
  towers: ["id", "society_id", "tower_name", "tower_code", "status", "created_at"],
  wings: ["id", "society_id", "name", "code", "created_at"],
  visitors: ["id", "society_id", "name", "status", "created_at"],
  visitor_preapprovals: ["id", "owner_id", "visitor_name", "status", "created_at"],
  visitor_vehicle_entries: ["id", "visitor_id", "vehicle_number", "status", "created_at"],
  visitor_delivery_entries: ["id", "visitor_id", "delivery_type", "status", "created_at"],
  complaints: ["id", "resident_id", "society_id", "title", "status", "created_at"],
  complaint_comments: ["id", "complaint_id", "user_id", "comment_text", "created_at"],
  bills: ["id", "society_id", "user_id", "amount", "status", "created_at"],
  bill_items: ["id", "bill_id", "item_name", "amount", "created_at"],
  payments: ["id", "bill_id", "amount", "payment_status", "created_at"],
  notices: ["id", "society_id", "title", "status", "created_at"],
  documents: ["id", "user_id", "society_id", "document_type", "file_url", "created_at"],
  user_approvals: ["id", "user_id", "society_id", "approval_type", "status", "created_at", "updated_at"],
  staff: ["id", "user_id", "society_id", "department", "status", "created_at"],
  security: ["id", "user_id", "society_id", "shift", "status", "created_at"],
  attendance: ["id", "user_id", "society_id", "attendance_date", "status", "created_at"],
  chat_threads: ["id", "society_id", "thread_type", "created_at"],
  chat_messages: ["id", "thread_id", "sender_id", "created_at"],
  notifications: ["id", "target_user_id", "society_id", "status", "created_at"],
  audit_logs: ["id", "user_id", "action", "status", "created_at"],
  user_otps: [
    "id",
    "user_id",
    "email",
    "otp_hash",
    "purpose",
    "expires_at",
    "used_at",
    "created_at",
  ],
};

async function tableExists(tableName) {
  const { rows } = await db.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

async function getTableColumns(tableName) {
  const { rows } = await db.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return new Set(rows.map((row) => row.column_name));
}

async function validateSchema() {
  const issues = [];

  for (const [tableName, columns] of Object.entries(requiredSchema)) {
    if (!(await tableExists(tableName))) {
      issues.push(`Missing required table: ${tableName}`);
      continue;
    }

    const existingColumns = await getTableColumns(tableName);
    const missingColumns = columns.filter((column) => !existingColumns.has(column));
    if (missingColumns.length > 0) {
      issues.push(`Missing columns in ${tableName}: ${missingColumns.join(", ")}`);
    }
  }

  if (issues.length > 0) {
    const message = `Schema validation failed:\n${issues.join("\n")}`;
    const error = new Error(message);
    error.details = issues;
    throw error;
  }

  console.log("✓ Auth schema validation passed");
  return true;
}

module.exports = {
  validateSchema,
  requiredSchema,
};
