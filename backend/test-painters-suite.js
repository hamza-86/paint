import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import app from './src/app.js';
import Painter from './src/models/Painter.js';
import Admin from './src/models/Admin.js';
import { getTestMongoUri } from './src/config/testDb.js';

dotenv.config();

const PORT = 5002;
const API_URL = `http://localhost:${PORT}/api`;

async function runTestSuite() {
  console.log('==================================================');
  console.log('   PAINTER MANAGEMENT BACKEND VERIFICATION SUITE   ');
  console.log('==================================================\n');

  // Connect to DB
  const uri = getTestMongoUri();
  await mongoose.connect(uri);

  // Start test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running on port ${PORT}\n`);

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
    // 1. Health check
    const healthRes = await fetch(`${API_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', '1. Backend starts successfully and health check returns 200');

    // Setup: Get Admin Token
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@paintshop.com',
        password: process.env.ADMIN_PASSWORD || 'changeme123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    assert(adminToken && adminLoginData.user?.role === 'admin', 'Setup: Admin token obtained');

    // Setup: Create a temporary painter for testing role restriction
    const roleTestEmail = `role_painter_${Date.now()}@paintshop.com`;
    const rolePainter = await Painter.create({
      firstName: 'RoleTester',
      mobile: '9123456780',
      email: roleTestEmail,
      password: 'painterpassword123',
      status: 'active',
    });

    const painterLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: roleTestEmail,
        password: 'painterpassword123',
      }),
    });
    const painterLoginData = await painterLoginRes.json();
    const painterToken = painterLoginData.token;
    assert(painterToken && painterLoginData.user?.role === 'painter', 'Setup: Painter token obtained');

    // 2. GET /api/painters requires authentication
    const unauthRes = await fetch(`${API_URL}/painters`);
    const unauthData = await unauthRes.json();
    assert(
      unauthRes.status === 401 && unauthData.success === false,
      '2. GET /api/painters requires authentication (returns 401 Unauthorized)'
    );

    // 3. GET /api/painters rejects painter role
    const painterRoleRes = await fetch(`${API_URL}/painters`, {
      headers: { Authorization: `Bearer ${painterToken}` },
    });
    const painterRoleData = await painterRoleRes.json();
    assert(
      painterRoleRes.status === 403 &&
      painterRoleData.success === false &&
      painterRoleData.message.includes('Access denied'),
      '3. GET /api/painters rejects painter role (returns 403 Forbidden)'
    );

    // Also check POST /api/painters rejects painter role
    const painterPostRes = await fetch(`${API_URL}/painters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${painterToken}`,
      },
      body: JSON.stringify({ firstName: 'Fake' }),
    });
    assert(painterPostRes.status === 403, '3b. POST /api/painters rejects painter role (returns 403)');

    // 4. Admin can list painters with pagination and global counts
    const listRes = await fetch(`${API_URL}/painters?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(
      listRes.status === 200 &&
      listData.success === true &&
      Array.isArray(listData.painters) &&
      listData.pagination &&
      listData.pagination.page === 1 &&
      listData.pagination.limit === 5 &&
      listData.counts &&
      typeof listData.counts.total === 'number' &&
      typeof listData.counts.active === 'number' &&
      typeof listData.counts.deactivated === 'number',
      '4. Admin can list painters with pagination metadata and global counts'
    );

    // 5. Admin can create painter
    const newPainterEmail = `unique_painter_${Date.now()}@paintshop.com`;
    const createRes = await fetch(`${API_URL}/painters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        firstName: 'Amit Sharma',
        mobile: '9876543210',
        email: newPainterEmail,
        password: 'securePassword123',
        photoUrl: 'https://example.com/avatar.jpg',
      }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 &&
      createData.success === true &&
      createData.painter &&
      createData.painter.firstName === 'Amit Sharma' &&
      createData.painter.email === newPainterEmail &&
      createData.painter.status === 'active' &&
      createData.painter.id,
      '7. Admin can create painter (returns 201 Created and safe painter object)'
    );
    const createdPainterId = createData.painter?.id;

    // 8. Duplicate painter email is rejected with 409 Conflict
    const dupRes = await fetch(`${API_URL}/painters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        firstName: 'Duplicate Name',
        mobile: '9876543219',
        email: newPainterEmail,
        password: 'anotherPassword123',
      }),
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 409 &&
      dupData.success === false &&
      dupData.message === 'Painter with this email already exists.',
      '8. Duplicate painter email is rejected with 409 Conflict'
    );

    // 9. Painter password is hashed in database
    const painterInDb = await Painter.findById(createdPainterId).select('+password');
    assert(
      painterInDb &&
      painterInDb.password &&
      painterInDb.password.startsWith('$2') &&
      painterInDb.password !== 'securePassword123',
      '9. Painter password is encrypted with bcrypt salt/hash in MongoDB'
    );

    // 10. Password is never returned in API responses
    assert(
      createData.painter.password === undefined &&
      createData.painter.passwordHash === undefined,
      '10. Password and hash are never returned in create response'
    );

    // 5. Admin can search painters (by firstName, mobile, email)
    const searchNameRes = await fetch(`${API_URL}/painters?search=Amit`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchNameData = await searchNameRes.json();
    const foundByName = searchNameData.painters.some((p) => p.email === newPainterEmail);

    const searchMobileRes = await fetch(`${API_URL}/painters?search=9876543210`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchMobileData = await searchMobileRes.json();
    const foundByMobile = searchMobileData.painters.some((p) => p.email === newPainterEmail);

    const searchEmailRes = await fetch(`${API_URL}/painters?search=${newPainterEmail}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchEmailData = await searchEmailRes.json();
    const foundByEmail = searchEmailData.painters.some((p) => p.email === newPainterEmail);

    assert(
      foundByName && foundByMobile && foundByEmail,
      '5. Admin can search painters by firstName, mobile, and email'
    );

    // 11. Admin can get a single painter
    const singleRes = await fetch(`${API_URL}/painters/${createdPainterId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const singleData = await singleRes.json();
    assert(
      singleRes.status === 200 &&
      singleData.success === true &&
      singleData.painter &&
      singleData.painter.id === createdPainterId &&
      singleData.painter.firstName === 'Amit Sharma' &&
      singleData.painter.password === undefined,
      '11. Admin can get single painter profile (password excluded)'
    );

    // 12. Admin can deactivate painter
    const deactRes = await fetch(`${API_URL}/painters/${createdPainterId}/deactivate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deactData = await deactRes.json();
    assert(
      deactRes.status === 200 &&
      deactData.success === true &&
      deactData.painter?.status === 'deactivated',
      '12. Admin can deactivate painter (status becomes deactivated)'
    );

    // 6. Admin can filter active / deactivated painters
    const deactFilterRes = await fetch(`${API_URL}/painters?status=deactivated`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deactFilterData = await deactFilterRes.json();
    const containsDeactivated = deactFilterData.painters.some((p) => p.id === createdPainterId);
    assert(containsDeactivated, '6. Admin can filter active/deactivated painters');

    // 14. Deactivated painter cannot log in
    const deactLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newPainterEmail,
        password: 'securePassword123',
      }),
    });
    const deactLoginData = await deactLoginRes.json();
    assert(
      deactLoginRes.status === 403 &&
      deactLoginData.success === false &&
      deactLoginData.message.includes('deactivated'),
      '14. Deactivated painter cannot log in (returns 403 with deactivation message)'
    );

    // 13. Admin can reactivate painter
    const reactRes = await fetch(`${API_URL}/painters/${createdPainterId}/activate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reactData = await reactRes.json();
    assert(
      reactRes.status === 200 &&
      reactData.success === true &&
      reactData.painter?.status === 'active',
      '13. Admin can reactivate painter (status becomes active)'
    );

    // Active painter can log in again
    const activeLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newPainterEmail,
        password: 'securePassword123',
      }),
    });
    assert(
      activeLoginRes.status === 200,
      '13b. Reactivated painter can successfully log in again'
    );

    // 15. Historical data preserved & DELETE endpoint does not exist
    const deleteRes = await fetch(`${API_URL}/painters/${createdPainterId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      deleteRes.status === 404,
      '15. DELETE /api/painters/:id does NOT exist (returns 404 - no hard delete)'
    );

    // Cleanup test records
    await Painter.deleteOne({ _id: createdPainterId });
    await Painter.deleteOne({ _id: rolePainter._id });

  } catch (err) {
    console.error('Error running test suite:', err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  console.log('\n--------------------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

runTestSuite();
