require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');

(async () => {
  try {
    const [rows] = await db.query("SELECT id, code, name, status, created_at FROM societies ORDER BY id DESC");
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error(error.code || 'ERROR', error.sqlMessage || error.message);
    process.exitCode = 1;
  } finally {
    await db.end().catch(() => null);
  }
})();
