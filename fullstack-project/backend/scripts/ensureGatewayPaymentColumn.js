require("dotenv").config();
const db = require("../db");

async function main() {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS c
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'bill_payments'
       AND COLUMN_NAME = 'gateway_payment_id'`
  );

  if (!rows[0]?.c) {
    // Ensure gateway_order_id exists before adding gateway_payment_id
    const [orderCol] = await db.query(
      `SELECT COUNT(*) AS c
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'bill_payments'
         AND COLUMN_NAME = 'gateway_order_id'`
    );

    if (!orderCol[0]?.c) {
      await db.query("ALTER TABLE bill_payments ADD COLUMN gateway_order_id VARCHAR(120) NULL");
      console.log("Added bill_payments.gateway_order_id");
    }

    await db.query("ALTER TABLE bill_payments ADD COLUMN gateway_payment_id VARCHAR(120) NULL");
    console.log("Added bill_payments.gateway_payment_id");
  } else {
    console.log("bill_payments.gateway_payment_id already exists");
  }
}

main()
  .catch((error) => {
    console.error(error.code || "ERROR", error.sqlMessage || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end().catch(() => null);
  });
