import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import Painter from './src/models/Painter.js';
import Admin from './src/models/Admin.js';

dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function runTestSuite() {
  console.log('==================================================');
  console.log('   AUTHENTICATION SYSTEM FULL VERIFICATION SUITE   ');
  console.log('==================================================\n');

  // Connect to DB directly for test setup / tear-down
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/paintshop_dev';
  await mongoose.connect(uri);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Backend Health / Server running
    const healthRes = await fetch(`${API_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', '1. Backend is running and health check returns 200 ok');

    // 2. MongoDB connection
    assert(mongoose.connection.readyState === 1, '2. MongoDB connection is active');

    // 3. Admin seed verification
    const adminInDb = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@paintshop.com' });
    assert(adminInDb !== null, '3. Admin user exists in database');

    // 4. Admin login with correct password
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@paintshop.com',
        password: process.env.ADMIN_PASSWORD || 'changeme123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminSetCookie = adminLoginRes.headers.get('set-cookie');
    assert(
      adminLoginRes.status === 200 &&
      adminLoginData.success === true &&
      adminLoginData.token &&
      adminLoginData.user?.role === 'admin' &&
      adminSetCookie && adminSetCookie.includes('auth_token='),
      '4. Admin login succeeds with JWT, role="admin", and httpOnly auth_token cookie'
    );
    const adminToken = adminLoginData.token;

    // Create a temporary painter for Painter tests
    const testPainterEmail = `test_painter_${Date.now()}@paintshop.com`;
    await Painter.deleteOne({ email: testPainterEmail });
    const painter = await Painter.create({
      firstName: 'Tariq',
      email: testPainterEmail,
      mobile: '9876543210',
      password: 'painterpassword123',
      status: 'active',
    });

    // 5. Painter login with valid credentials
    const painterLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPainterEmail,
        password: 'painterpassword123',
      }),
    });
    const painterLoginData = await painterLoginRes.json();
    assert(
      painterLoginRes.status === 200 &&
      painterLoginData.success === true &&
      painterLoginData.user?.role === 'painter' &&
      painterLoginData.user?.firstName === 'Tariq',
      '5. Active painter can log in and receives role="painter"'
    );
    const painterToken = painterLoginData.token;

    // 6. Invalid password rejected
    const invalidPwRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPainterEmail,
        password: 'wrong_password',
      }),
    });
    const invalidPwData = await invalidPwRes.json();
    assert(
      invalidPwRes.status === 401 &&
      invalidPwData.success === false &&
      invalidPwData.message === 'Invalid email or password.',
      '6. Invalid password rejected with 401 and generic error message'
    );

    // 7. Missing token rejected on protected endpoint
    const noTokenRes = await fetch(`${API_URL}/auth/me`);
    const noTokenData = await noTokenRes.json();
    assert(
      noTokenRes.status === 401 &&
      noTokenData.success === false &&
      noTokenData.message.includes('Authentication required'),
      '7. Missing token is rejected with 401 on protected endpoint (/api/auth/me)'
    );

    // 8. Invalid token rejected
    const invalidTokenRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: 'Bearer invalid.fake.token' },
    });
    const invalidTokenData = await invalidTokenRes.json();
    assert(
      invalidTokenRes.status === 401 &&
      invalidTokenData.message.includes('Invalid token'),
      '8. Invalid/tampered token is rejected with 401'
    );

    // 9. Expired token rejected
    const expiredToken = jwt.sign(
      { userId: String(painter._id), role: 'painter' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const expiredTokenRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const expiredTokenData = await expiredTokenRes.json();
    assert(
      expiredTokenRes.status === 401 &&
      expiredTokenData.message.includes('Session expired'),
      '9. Expired token is rejected with 401 and "Session expired" message'
    );

    // 10. Deactivated painter cannot log in
    painter.status = 'deactivated';
    await painter.save();
    const deactivatedLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPainterEmail,
        password: 'painterpassword123',
      }),
    });
    const deactivatedLoginData = await deactivatedLoginRes.json();
    assert(
      deactivatedLoginRes.status === 403 &&
      deactivatedLoginData.success === false &&
      deactivatedLoginData.message.includes('deactivated'),
      '10. Deactivated painter cannot log in (returns 403 with deactivation message)'
    );

    // 11. GET /api/auth/me works with authentication (Bearer token)
    const meRes = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 &&
      meData.success === true &&
      meData.user?.role === 'admin' &&
      meData.user?.email === (process.env.ADMIN_EMAIL || 'admin@paintshop.com'),
      '11. GET /api/auth/me works with authentication (returns safe user profile)'
    );

    // 12. GET /api/auth/me fails without authentication
    const meUnauthRes = await fetch(`${API_URL}/auth/me`);
    assert(
      meUnauthRes.status === 401,
      '12. GET /api/auth/me fails without authentication (401)'
    );

    // 13. Logout endpoint clears cookie
    const logoutRes = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
    });
    const logoutData = await logoutRes.json();
    const logoutCookie = logoutRes.headers.get('set-cookie');
    assert(
      logoutRes.status === 200 &&
      logoutData.success === true &&
      logoutCookie && (logoutCookie.includes('Max-Age=0') || logoutCookie.includes('Expires=')),
      '13. POST /api/auth/logout clears auth_token cookie and returns 200 success'
    );

    // Clean up temporary test painter
    await Painter.deleteOne({ _id: painter._id });

  } catch (err) {
    console.error('Error running test suite:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n--------------------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

runTestSuite();
