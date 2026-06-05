require('dotenv').config({ path: __dirname + '/../.env' });
const db = require('../db');

async function main() {
  const societyId = Number(process.argv[2] || 353);
  const queries = [
    ['residentRows', `SELECT COUNT(*) AS total_residents FROM users WHERE role = 'resident' AND society_id = ?`, [societyId]],
    ['flatRows', `SELECT COUNT(*) AS total_flats, COALESCE(SUM(status = 'occupied'), 0) AS occupied_flats FROM flats WHERE society_id = ?`, [societyId]],
    ['complaintRows', `SELECT COUNT(*) AS pending_complaints FROM complaints c JOIN users resident ON resident.id = c.resident_id WHERE resident.society_id = ? AND c.status = 'pending'`, [societyId]],
    ['visitorRows', `SELECT COUNT(*) AS today_visitors FROM visitors v JOIN flats f ON f.id = v.flat_id WHERE f.society_id = ? AND DATE(v.entry_time) = CURRENT_DATE`, [societyId]],
    ['paymentRows', `SELECT COALESCE(SUM(total_amount), 0) AS total_collections FROM bills WHERE society_id = ? AND status = 'paid'`, [societyId]],
    ['aiRows', `SELECT COUNT(*) AS ai_task_count FROM ai_chats WHERE society_id = ?`, [societyId]],
    ['noticeRows', `SELECT n.id, n.title, n.message, n.created_at, u.name AS created_by FROM notices n JOIN users u ON u.id = n.created_by WHERE u.society_id = ? ORDER BY n.created_at DESC LIMIT 3`, [societyId]],
    ['maintenanceRows', `SELECT c.id, c.title, c.description, c.status, c.created_at, resident.name AS resident_name FROM complaints c JOIN users resident ON resident.id = c.resident_id WHERE resident.society_id = ? AND c.status = 'pending' ORDER BY c.created_at DESC LIMIT 3`, [societyId]],
  ];

  try {
    for (const [label, sql, params] of queries) {
      try {
        const { rows } = await db.query(sql, params);
        console.log(label, 'OK', rows[0]);
      } catch (error) {
        console.log(label, 'ERR', error.code, error.sqlMessage || error.message);
      }
    }
  } finally {
    await db.end().catch(() => null);
  }
}

main().catch((error) => {
  console.error('FATAL', error.code || error.message);
  process.exitCode = 1;
});
