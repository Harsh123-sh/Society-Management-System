require("dotenv").config();
const db = require("../db");

async function ensureColumnExists(tableName, columnName, alterSql) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  if (!rows[0]?.c) {
    await db.query(alterSql);
    console.log(`Added ${tableName}.${columnName}`);
  } else {
    console.log(`${tableName}.${columnName} already exists`);
  }
}

async function main() {
  await db.query(
    "ALTER TABLE societies MODIFY status ENUM('active', 'inactive', 'suspended', 'trial', 'archived', 'deleted') NOT NULL DEFAULT 'active'"
  );
  console.log("Ensured societies.status supports active/inactive/suspended/trial/archived/deleted");

  await ensureColumnExists(
    "bill_payments",
    "amount",
    "ALTER TABLE bill_payments ADD COLUMN amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER resident_id"
  );

  await ensureColumnExists(
    "bill_payments",
    "gateway_payment_id",
    "ALTER TABLE bill_payments ADD COLUMN gateway_payment_id VARCHAR(120) NULL AFTER gateway_order_id"
  );

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_approvals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      society_id INT NOT NULL,
      approval_type ENUM('registration', 'owner_verification', 'tenant_verification', 'staff_verification', 'reactivation') NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      requested_by INT NULL,
      approved_by INT NULL,
      approval_comments VARCHAR(1000) NULL,
      documents_json LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_approvals_society_status (society_id, status),
      INDEX idx_approvals_user_type (user_id, approval_type),
      CONSTRAINT fk_user_approvals_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_user_approvals_society
        FOREIGN KEY (society_id) REFERENCES societies(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_user_approvals_requested_by
        FOREIGN KEY (requested_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_user_approvals_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    )
  `);

  console.log("Ensured user_approvals table");
}

main()
  .catch((error) => {
    console.error(error.code || "ERROR", error.sqlMessage || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end().catch(() => null);
  });
