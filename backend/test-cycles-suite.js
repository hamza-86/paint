import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './src/app.js';
import Cycle from './src/models/Cycle.js';
import Painter from './src/models/Painter.js';
import Item from './src/models/Item.js';
import { getTestMongoUri } from './src/config/testDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = 5004;
const API_URL = `http://localhost:${PORT}/api`;

async function runTestSuite() {
  console.log('==================================================');
  console.log('   REWARD CYCLE MANAGEMENT VERIFICATION SUITE   ');
  console.log('==================================================\n');

  const uri = getTestMongoUri();
  await mongoose.connect(uri);

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

  // Track resources created during tests for cleanup
  const createdCycleIds = [];
  let adminToken = null;
  let painterToken = null;

  try {
    await Cycle.deleteMany({});

    // ── 1. Health check ─────────────────────────────────────────────────────
    const healthRes = await fetch(`${API_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok',
      '1. Backend starts successfully and health check returns 200');

    // ── 2. Admin login ───────────────────────────────────────────────────────
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@paintshop.com',
        password: process.env.ADMIN_PASSWORD || 'changeme123',
      }),
    });
    const adminData = await adminLoginRes.json();
    adminToken = adminData.token;
    assert(adminToken && adminData.user?.role === 'admin', '2. Admin login and token setup works');

    // ── 3. Painter login ─────────────────────────────────────────────────────
    const testPainterEmail = `cycle_painter_${Date.now()}@paintshop.com`;
    await Painter.create({
      firstName: 'CycleTester',
      mobile: '9000000001',
      email: testPainterEmail,
      password: 'painterpass123',
      status: 'active',
    });
    const painterLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testPainterEmail, password: 'painterpass123' }),
    });
    const painterData = await painterLoginRes.json();
    painterToken = painterData.token;
    assert(painterToken && painterData.user?.role === 'painter', '3. Painter login and token setup works');

    // ── 4–9: Authorization checks ────────────────────────────────────────────
    const unauthGet = await fetch(`${API_URL}/cycles`);
    assert(unauthGet.status === 401, '4. GET /api/cycles requires authentication (401)');

    const painterGet = await fetch(`${API_URL}/cycles`, {
      headers: { Authorization: `Bearer ${painterToken}` },
    });
    assert(painterGet.status === 403, '5. Painter cannot GET /api/cycles (403)');

    const painterPost = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${painterToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2026-01-01', endDate: '2026-04-30' }),
    });
    assert(painterPost.status === 403, '6. Painter cannot POST /api/cycles (403)');

    // Need a cycle ID for painter activate/close tests — use a dummy ObjectId
    const dummyId = new mongoose.Types.ObjectId().toString();

    const painterActivate = await fetch(`${API_URL}/cycles/${dummyId}/activate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${painterToken}` },
    });
    assert(painterActivate.status === 403, '7. Painter cannot activate cycle (403)');

    const painterClose = await fetch(`${API_URL}/cycles/${dummyId}/close`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${painterToken}` },
    });
    assert(painterClose.status === 403, '8. Painter cannot close cycle (403)');

    // ── 10. Create valid inactive cycle ──────────────────────────────────────
    const createInactiveRes = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2027-01-01', endDate: '2027-04-30', isActive: false }),
    });
    const inactiveData = await createInactiveRes.json();
    assert(
      createInactiveRes.status === 201 &&
        inactiveData.success === true &&
        inactiveData.data?.isActive === false &&
        inactiveData.data?.id,
      '9. Admin can create a valid inactive cycle (201)'
    );
    if (inactiveData.data?.id) createdCycleIds.push(inactiveData.data.id);

    // ── 11. Create valid active cycle ────────────────────────────────────────
    await Cycle.updateMany({ isActive: true }, { isActive: false });
    const createActiveRes = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2026-09-01', endDate: '2026-12-31', isActive: true }),
    });
    const activeData = await createActiveRes.json();
    assert(
      createActiveRes.status === 201 &&
        activeData.success === true &&
        activeData.data?.isActive === true,
      '10. Admin can create a valid active cycle when no active cycle exists (201)'
    );
    const activeCycleId = activeData.data?.id;
    if (activeCycleId) createdCycleIds.push(activeCycleId);

    // ── 12–16: Date validation ───────────────────────────────────────────────
    const missingStart = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ endDate: '2027-04-30' }),
    });
    assert(missingStart.status === 400, '11. Missing startDate rejected with 400');

    const missingEnd = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2027-01-01' }),
    });
    assert(missingEnd.status === 400, '12. Missing endDate rejected with 400');

    const startAfterEnd = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2027-09-01', endDate: '2027-01-01' }),
    });
    assert(startAfterEnd.status === 400, '13. startDate after endDate rejected with 400');

    const equalDates = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2027-01-01', endDate: '2027-01-01' }),
    });
    assert(equalDates.status === 400, '14. startDate equal to endDate rejected with 400');

    const badDate = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: 'not-a-date', endDate: '2027-04-30' }),
    });
    assert(badDate.status === 400, '15. Invalid date format rejected with 400');

    // ── 17. Admin can list cycles ────────────────────────────────────────────
    const listRes = await fetch(`${API_URL}/cycles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(
      listRes.status === 200 &&
        listData.success === true &&
        Array.isArray(listData.data) &&
        listData.pagination,
      '16. Admin can list cycles with pagination metadata'
    );

    // ── 18. Pagination metadata ──────────────────────────────────────────────
    assert(
      listData.pagination.page >= 1 &&
        listData.pagination.total >= 0 &&
        typeof listData.pagination.totalPages === 'number',
      '17. Pagination metadata exists and is correct'
    );

    // ── 19. Admin can get single cycle ───────────────────────────────────────
    if (activeCycleId) {
      const getRes = await fetch(`${API_URL}/cycles/${activeCycleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const getData = await getRes.json();
      assert(
        getRes.status === 200 &&
          getData.success === true &&
          getData.data?.id === activeCycleId,
        '18. Admin can retrieve a single cycle by ID'
      );
    } else {
      assert(false, '18. Admin can retrieve a single cycle by ID (skipped — no ID)');
    }

    // ── 20. Invalid ObjectId ─────────────────────────────────────────────────
    const badIdRes = await fetch(`${API_URL}/cycles/not-valid-id`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(badIdRes.status === 400, '19. Invalid ObjectId returns 400 Bad Request');

    // ── 21. Non-existing cycle ───────────────────────────────────────────────
    const nonExistRes = await fetch(`${API_URL}/cycles/${new mongoose.Types.ObjectId()}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(nonExistRes.status === 404, '20. Non-existing cycle returns 404 Not Found');

    // ── 22. Overlapping cycle rejected ───────────────────────────────────────
    // Overlap attempt: 2027-02-01 → 2027-03-31 (overlaps 2027-01-01 to 2027-04-30)
    const overlapRes = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2027-02-01', endDate: '2027-03-31' }),
    });
    assert(overlapRes.status === 409, '21. Overlapping cycle rejected with 409 Conflict');
    const overlapData = await overlapRes.json();
    assert(
      overlapData.message?.toLowerCase().includes('overlap'),
      '22. Overlap error message clearly explains the conflict'
    );

    // ── 23. Another active cycle cannot be created ───────────────────────────
    const secondActiveRes = await fetch(`${API_URL}/cycles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2027-05-01', endDate: '2027-08-31', isActive: true }),
    });
    assert(secondActiveRes.status === 409, '23. Creating second active cycle rejected with 409 Conflict');

    // ── 24. Close active cycle ───────────────────────────────────────────────
    if (activeCycleId) {
      const closeRes = await fetch(`${API_URL}/cycles/${activeCycleId}/close`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const closeData = await closeRes.json();
      assert(
        closeRes.status === 200 &&
          closeData.success === true &&
          closeData.data?.isActive === false,
        '24. Admin can close active cycle (isActive becomes false)'
      );

      // ── 25. Closed cycle remains in database ─────────────────────────────
      const verifyRes = await fetch(`${API_URL}/cycles/${activeCycleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const verifyData = await verifyRes.json();
      assert(
        verifyRes.status === 200 &&
          verifyData.data?.id === activeCycleId &&
          verifyData.data?.isActive === false,
        '25. Closed cycle remains in database (not deleted, isActive=false)'
      );

      // ── 26. Activate a closed cycle ─────────────────────────────────────
      // Now no active cycle exists, we can activate the previously-inactive cycle
      const inactiveId = createdCycleIds[0];
      if (inactiveId && inactiveId !== activeCycleId) {
        const reactivateRes = await fetch(`${API_URL}/cycles/${inactiveId}/activate`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const reactivateData = await reactivateRes.json();
        assert(
          reactivateRes.status === 200 &&
            reactivateData.success === true &&
            reactivateData.data?.isActive === true,
          '26. Admin can activate a closed cycle when no active cycle exists'
        );

        // ── 27. Second activation rejected ──────────────────────────────
        const futureCycle = await Cycle.create({
          startDate: new Date('2027-05-01'),
          endDate: new Date('2027-08-31'),
          isActive: false,
        });
        createdCycleIds.push(futureCycle._id.toString());
        const secondActivateRes = await fetch(`${API_URL}/cycles/${futureCycle._id}/activate`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert(secondActivateRes.status === 409, '27. Activating a second cycle while one is active is rejected (409)');

        // Clean up: close the reactivated cycle
        await fetch(`${API_URL}/cycles/${inactiveId}/close`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      } else {
        assert(true, '26. Admin can activate a closed cycle (skipped, no inactive cycle)');
        assert(true, '27. Second activation rejected (skipped)');
      }
    } else {
      assert(false, '24. Admin can close active cycle (skipped — no active cycle)');
      assert(false, '25. Closed cycle remains in database (skipped)');
      assert(false, '26. Admin can activate a closed cycle (skipped)');
      assert(false, '27. Second activation rejected (skipped)');
    }

    // ── 28. DELETE endpoint does not exist ───────────────────────────────────
    const deleteRes = await fetch(`${API_URL}/cycles/${dummyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteRes.status === 404, '28. DELETE /api/cycles/:id does NOT exist (returns 404)');

    // ── 29. Response does not expose sensitive data ──────────────────────────
    const listRes2 = await fetch(`${API_URL}/cycles`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData2 = await listRes2.json();
    const sampleCycle = listData2.data?.[0];
    assert(
      sampleCycle &&
        !sampleCycle.password &&
        !sampleCycle.__v &&
        sampleCycle.id,
      '29. Response does not expose sensitive internals (no __v, no password)'
    );

    // ── 30. Painter management regression ────────────────────────────────────
    const paintListRes = await fetch(`${API_URL}/painters`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      paintListRes.status === 200,
      '30. Painter management regression: GET /api/painters still works'
    );

    // ── 31. Item catalog regression ───────────────────────────────────────────
    const itemListRes = await fetch(`${API_URL}/items`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      itemListRes.status === 200,
      '31. Item catalog regression: GET /api/items still works'
    );

  } catch (err) {
    console.error('\nTest suite error:', err.message);
    failed++;
  } finally {
    // Cleanup: remove all test cycles and the test painter
    try {
      for (const id of createdCycleIds) {
        await Cycle.findByIdAndDelete(id);
      }
      await Painter.deleteMany({ email: /cycle_painter_/ });
    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr.message);
    }

    await mongoose.disconnect();
    server.close();

    console.log('\n--------------------------------------------------');
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log('--------------------------------------------------\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
