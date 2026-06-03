const db = require("../config/db");

async function createOtp({ userId, email, otpHash, purpose, expiresAt }) {
  const { rows: result } = await db.query(
    `INSERT INTO user_otps (user_id, email, otp_hash, purpose, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId || null, email, otpHash, purpose, expiresAt]
  );

  return result.insertId;
}

async function invalidateActiveOtps(email, purpose) {
  await db.query(
    `UPDATE user_otps
     SET used_at = NOW()
     WHERE email = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW()`,
    [email, purpose]
  );
}

async function getLatestActiveOtp(email, purpose) {
  const { rows } = await db.query(
    `SELECT id, user_id, email, otp_hash, purpose, expires_at
     FROM user_otps
     WHERE email = ? AND purpose = ? AND used_at IS NULL AND expires_at > NOW()
     ORDER BY id DESC
     LIMIT 1`,
    [email, purpose]
  );

  return rows[0] || null;
}

async function markOtpAsUsed(id) {
  await db.query("UPDATE user_otps SET used_at = NOW() WHERE id = ?", [id]);
}

module.exports = {
  createOtp,
  invalidateActiveOtps,
  getLatestActiveOtp,
  markOtpAsUsed,
};
