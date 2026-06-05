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
  flats: [
    "id",
    "society_id",
    "wing",
    "flat_number",
    "status",
    "created_at",
    "updated_at",
  ],
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
  user_approvals: [
    "id",
    "user_id",
    "society_id",
    "approval_type",
    "status",
    "created_at",
    "updated_at",
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
