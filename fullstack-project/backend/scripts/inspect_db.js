(function(){
  const p = require('path');
  require('dotenv').config({ path: p.join(__dirname, '..', '.env') });
})();
(async () => {
  const mysql = require('mysql2/promise');
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const [db] = await c.query('SELECT DATABASE() as db');
    console.log('Using DB:', db[0].db);

    const [cols] = await c.query(
      "SELECT COLUMN_NAME,COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='societies'",
      [process.env.DB_NAME]
    );
    console.log('Societies columns:', cols);

    const [ddl] = await c.query('SHOW CREATE TABLE societies');
    if (ddl[0] && ddl[0]['Create Table']) {
      console.log('SHOW CREATE TABLE (truncated 2000 chars):\n', ddl[0]['Create Table'].slice(0, 2000));
    } else {
      console.log('No DDL available');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await c.end();
  }
})();
