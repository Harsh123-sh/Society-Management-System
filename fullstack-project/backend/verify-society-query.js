const db = require('./config/db');
db.query('SELECT id, name, code FROM societies WHERE code = $1 ORDER BY id DESC LIMIT 10', ['GRR-0001'])
  .then((res) => {
    console.log(JSON.stringify(res.rows, null, 2));
    db.end();
  })
  .catch((err) => {
    console.error(err);
    db.end();
    process.exit(1);
  });
