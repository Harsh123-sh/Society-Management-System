const crypto = require('crypto');
const db = require('../config/db');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

(async () => {
  try {
    const email = `api.test+${Date.now()}@example.com`;
    const password = 'TestPass123!';
    console.log('Registering', email);
    const registerRes = await (await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'API Test User', email, password, societyCode: 'GRR-0001', role: 'staff' }),
    })).json();

    console.log('Register response:', registerRes.message);
    if (!registerRes.success) {
      console.error('Registration failed', registerRes);
      process.exit(1);
    }

    // Insert known OTP into DB for verify endpoint
    const otpPlain = '654321';
    const otpHash = hashOtp(otpPlain);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query('INSERT INTO user_otps (user_id, email, otp_hash, purpose, expires_at) VALUES (?, ?, ?, ?, ?)', [registerRes.data.id, email, otpHash, 'email_verification', expiresAt]);
    console.log('Inserted OTP for', email);

    // Call verify endpoint
    const verifyRes = await (await fetch('http://localhost:5000/api/auth/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: otpPlain }),
    })).json();

    console.log('Verify response:', JSON.stringify(verifyRes, null, 2));

    // Mark the user as active (simulate admin approval) so login succeeds
    await db.query("UPDATE users SET status = 'active' WHERE id = ?", [registerRes.data.id]);

    // Attempt login
    const loginRes = await (await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, societyCode: 'GRR-0001' }),
    })).json();

    console.log('Login response:', JSON.stringify(loginRes, null, 2));

    if (loginRes.success) {
      const token = loginRes.token;
      // call profile
      const profileRes = await (await fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })).json();
      console.log('Profile:', JSON.stringify(profileRes, null, 2));

      // refresh token
      const refreshRes = await (await fetch('http://localhost:5000/api/auth/refresh-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })).json();
      console.log('Refresh:', JSON.stringify(refreshRes, null, 2));

      // logout
      const logoutRes = await (await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })).json();
      console.log('Logout:', JSON.stringify(logoutRes, null, 2));
    }

    // Clean up
    await db.query('DELETE FROM user_otps WHERE email = ?', [email]);
    await db.query('DELETE FROM users WHERE email = ?', [email]);
    console.log('Clean up done');

    process.exit(0);
  } catch (e) {
    console.error('Error in api test:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
