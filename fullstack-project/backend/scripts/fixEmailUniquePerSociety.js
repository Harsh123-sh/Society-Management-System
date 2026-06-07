require("dotenv").config({ path: __dirname + "/../.env" });
const pool = require("../config/db");

(async () => {
  try {
    await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;`);
    await pool.query(`DROP INDEX IF EXISTS users_email_key;`);
    await pool.query(`DROP INDEX IF EXISTS users_email_unique;`);
    await pool.query(`DROP INDEX IF EXISTS users_email_society_unique;`);

    await pool.query(`
      CREATE UNIQUE INDEX users_email_society_unique
      ON users (LOWER(email), society_id)
      WHERE society_id IS NOT NULL AND deleted_at IS NULL;
    `);

    console.log("Fixed: email unique per society");
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();