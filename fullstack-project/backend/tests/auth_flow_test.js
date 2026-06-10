const crypto = require('crypto');
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const otpModel = require('../models/otpModel');
const societyModel = require('../models/societyModel');
const db = require('../config/db');

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function run() {
  try {
    console.log('Starting auth flow model-level test');

    const societies = await societyModel.listSocieties();
    const society = await societyModel.getSocietyByCode('GRR-0001');
    if (!society) {
      console.error('Test requires society GRR-0001 to exist');
      process.exit(1);
    }

    const alternateSociety = societies.find((item) => item.id !== society.id);
    const testEmail = `test.user+${Date.now()}@example.com`;
    const password = 'TestPass123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Creating user', testEmail);
    const user = await userModel.createUser({
      name: 'Test User',
      email: testEmail,
      password: hashedPassword,
      role: 'staff',
      residentType: null,
      status: 'pending',
      isVerified: false,
      societyId: society.id,
      flatId: null,
      flatNumber: null,
    });

    console.log('Created user id', user.id);

    if (alternateSociety) {
      const crossSocietyLookup = await userModel.getUserByEmail(testEmail, alternateSociety.id);
      if (crossSocietyLookup) {
        console.error('Email lookup is not properly scoped by society id');
        process.exit(1);
      }

      const secondUser = await userModel.createUser({
        name: 'Test User Alt Society',
        email: testEmail,
        password: hashedPassword,
        role: 'staff',
        residentType: null,
        status: 'pending',
        isVerified: false,
        societyId: alternateSociety.id,
        flatId: null,
        flatNumber: null,
      });
      console.log('Created second user in alternate society id', secondUser.id);
    }

    // Create OTP for email verification
    const otpPlain = '123456';
    const otpHash = hashOtp(otpPlain);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await otpModel.invalidateActiveOtps(testEmail, 'email_verification');
    const otpId = await otpModel.createOtp({ userId: user.id, email: testEmail, otpHash, purpose: 'email_verification', expiresAt });
    console.log('Inserted OTP id', otpId);

    const activeOtp = await otpModel.getLatestActiveOtp(testEmail, 'email_verification');
    if (!activeOtp) {
      console.error('Failed to read back OTP');
      process.exit(1);
    }

    console.log('Active OTP row id:', activeOtp.id);

    // Validate hash matches
    if (activeOtp.otp_hash !== otpHash) {
      console.error('Stored OTP hash mismatch');
      process.exit(1);
    }

    console.log('Marking OTP as used and verifying user');
    await otpModel.markOtpAsUsed(activeOtp.id);
    await userModel.verifyUserByEmail(testEmail);

    const verifiedUser = await userModel.getUserByEmail(testEmail);
    console.log('Verified user is_verified:', verifiedUser.is_verified);

    // Simulate login password check
    const isPasswordValid = await bcrypt.compare(password, verifiedUser.password);
    console.log('Password check ok:', isPasswordValid);

    // Clean up: delete test user and OTP entries
    try {
      await db.query('DELETE FROM user_otps WHERE email = ?', [testEmail]);
      await db.query('DELETE FROM users WHERE email = ?', [testEmail]);
      console.log('Clean up completed');
    } catch (e) {
      console.warn('Cleanup failed', e.message);
    }

    console.log('Auth model-level test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

run();
