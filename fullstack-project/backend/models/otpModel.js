const db = require("../config/db");

async function createOtp({ userId, email, otpHash, purpose, expiresAt }) {
  const { rows } = await db.query(
    `INSERT INTO user_otps (user_id, email, otp_hash, purpose, expires_at)
     VALUES (?, ?, ?, ?, ?) RETURNING id`,
    [userId || null, email, otpHash, purpose, expiresAt]
  );

  return rows[0]?.id || null;
}

async function invalidateActiveOtps(email, purpose, userId = null) {
  const baseQuery = `UPDATE user_otps
     SET used_at = NOW()
     WHERE email = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW()`;
  const params = [email, purpose];

  if (userId) {
    await db.query(`${baseQuery} AND user_id = ?`, [...params, userId]);
  } else {
    await db.query(baseQuery, params);
  }
}

async function getLatestActiveOtp(email, purpose, userId = null) {
  const baseQuery = `SELECT id, user_id, email, otp_hash, purpose, expires_at
     FROM user_otps
     WHERE email = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW()`;
  const params = [email, purpose];

  const query = userId
    ? `${baseQuery} AND user_id = ? ORDER BY id DESC LIMIT 1`
    : `${baseQuery} ORDER BY id DESC LIMIT 1`;

  const { rows } = await db.query(query, userId ? [...params, userId] : params);
  return rows[0] || null;
}

async function markOtpAsUsed(id) {
  await db.query("UPDATE user_otps SET used_at = NOW() WHERE id = ?", [id]);
}

async function countOtpsCreatedSince(email, purpose, minutes, userId = null) {
  const baseQuery = `SELECT COUNT(*) AS count
     FROM user_otps
     WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
       AND purpose = ?
       AND created_at >= NOW() - (? * INTERVAL '1 minute')`;
  const params = [email, purpose, minutes];

  const query = userId
    ? `${baseQuery} AND user_id = ?`
    : baseQuery;

  const { rows } = await db.query(query, userId ? [...params, userId] : params);
  return Number(rows[0]?.count || 0);
}

module.exports = {
  createOtp,
  invalidateActiveOtps,
  getLatestActiveOtp,
  markOtpAsUsed,
  countOtpsCreatedSince,
};
