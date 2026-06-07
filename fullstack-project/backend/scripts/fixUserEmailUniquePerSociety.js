require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    await pool.query(`
      DROP INDEX IF EXISTS users_email_society_unique;
      DROP INDEX IF EXISTS super_admin_email_unique;
    `);

    await pool.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
    `);

    await pool.query(`
      CREATE UNIQUE INDEX users_email_society_unique
      ON users (LOWER(email), society_id)
      WHERE society_id IS NOT NULL AND deleted_at IS NULL;
    `);

    await pool.query(`
      CREATE UNIQUE INDEX super_admin_email_unique
      ON users (LOWER(email))
      WHERE role = 'super_admin' AND deleted_at IS NULL;
    `);

    console.log("Email uniqueness fixed per society");
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();