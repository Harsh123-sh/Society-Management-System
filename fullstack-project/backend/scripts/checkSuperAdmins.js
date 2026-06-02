require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');

(async () => {
  try {
    const [rows] = await db.query("SELECT id, email, role FROM users WHERE role='super_admin' LIMIT 10");
    console.log('super_admins:', rows);
    process.exit(0);
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();
