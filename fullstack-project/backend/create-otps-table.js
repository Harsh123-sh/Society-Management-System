const db = require('./config/db');

(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_otps (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_otps_email_purpose ON user_otps(email, purpose)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_user_otps_expires_at ON user_otps(expires_at)`);
    
    console.log('✓ user_otps table created successfully');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
