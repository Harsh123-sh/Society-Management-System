require("dotenv").config();
const db = require("../db");

async function main() {
  const { rows } = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'bill_payments'
     ORDER BY ORDINAL_POSITION`
  );

  console.log(rows.map((row) => row.COLUMN_NAME).join(", "));
}

main()
  .catch((error) => {
    console.error(error.code || "ERROR", error.sqlMessage || error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end().catch(() => null);
  });
