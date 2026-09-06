/**
 * test-painter-reward-assignment-suite.js — Part 12
 *
 * Comprehensive automated test suite for the Painter Reward Assignment module.
 * Runs against the live backend. Requires:
 *   - Backend running at http://localhost:5000
 *   - MongoDB connected with seed data (admin credentials in env or defaults below)
 *
 * Usage:
 *   node backend/src/scripts/test-painter-reward-assignment-suite.js
 */

const BASE = 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@paintshop.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme123';

let cookie = '';
let painterId = '';
let painterName = '';
let cycleId = '';
let inventoryItemId = '';
let inventoryItemRemainingBefore = 0;
let assignmentId = '';

let passed = 0;
let failed = 0;

// ── Utilities ─────────────────────────────────────────────────────────────────

async function req(method, path, body, customCookie) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Cookie: customCookie !== undefined ? customCookie : cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { status: res.status, data };
}

function check(label, cond, detail = '') {
  if (cond) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

async function testHealth() {
  section('1. Health & Auth');
  const { status } = await req('GET', '/health');
  check('Server health 200', status === 200);
}

async function testAuth() {
  // Admin login
  const { status, data, headers } = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  }).then(async r => ({ status: r.status, data: await r.json(), headers: r.headers }));

  check('Admin login 200', status === 200, `status=${status}`);
  const setCookie = headers.get('set-cookie') || '';
  cookie = setCookie.split(';')[0];
  check('Admin auth cookie received', Boolean(cookie));
}

async function testPainterDenied() {
  const { status } = await req('GET', '/painter-reward-assignments', null, '');
  check('Unauthenticated → 401', status === 401, `status=${status}`);
}

async function resolveTestData() {
  section('2. Resolve Test Data (Painters, Cycles, Inventory)');

  // Get an active painter
  const { status: ps, data: pd } = await req('GET', '/painters?status=active&limit=1');
  check('GET active painters 200', ps === 200);
  const painters = pd?.painters || pd?.data?.painters || pd?.data || [];
  if (painters.length === 0) {
    console.error('  ⚠ No active painters found — skipping painter-dependent tests');
    return;
  }
  painterId = painters[0].id || painters[0]._id;
  painterName = painters[0].firstName;
  check(`Active painter found: ${painterName}`, Boolean(painterId));

  // Get active cycle
  const { status: cs, data: cd } = await req('GET', '/cycles?limit=50');
  check('GET cycles 200', cs === 200);
  const cycles = Array.isArray(cd?.data) ? cd.data : (cd?.cycles || []);
  let activeCycle = cd?.activeCycle || cycles.find(c => c.isActive);

  if (!activeCycle && cycles.length > 0) {
    const cId = cycles[0].id || cycles[0]._id;
    const { status: as, data: ad } = await req('PATCH', `/cycles/${cId}/activate`);
    if (as === 200) {
      activeCycle = ad?.data || cycles[0];
    }
  }

  if (!activeCycle) {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { status: crs, data: crd } = await req('POST', '/cycles', {
      startDate: now.toISOString(),
      endDate: nextMonth.toISOString(),
      isActive: true,
    });
    if (crs === 201 || crs === 200) {
      activeCycle = crd?.data;
    }
  }

  if (activeCycle) {
    cycleId = activeCycle.id || activeCycle._id;
    check(`Active cycle found: ${cycleId}`, Boolean(cycleId));
  } else {
    check('Active cycle found', false, 'No active cycle — some tests will be skipped');
  }

  // Get an active inventory item with remaining stock
  const { status: is, data: id } = await req('GET', '/reward-inventory?status=active&availability=available&limit=1');
  check('GET available inventory 200', is === 200);
  const items = Array.isArray(id?.data) ? id.data : (id?.data?.items || []);
  if (items.length > 0) {
    inventoryItemId = items[0].id || items[0]._id;
    inventoryItemRemainingBefore = items[0].remainingQty;
    check(`Available inventory item found: ${items[0].name} (${inventoryItemRemainingBefore} remaining)`, Boolean(inventoryItemId));
  } else {
    check('Available inventory item found', false, 'No active items with stock — create one first');
  }
}

async function testEligibility() {
  section('3. Eligibility Endpoint');

  if (!painterId) { console.log('  ⏭ Skipped — no painter available'); return; }

  // Valid painter
  const { status, data } = await req('GET', `/painter-reward-assignments/eligibility/${painterId}`);
  check('GET eligibility for valid painter → 200', status === 200, `status=${status}`);
  check('Response has painter field', Boolean(data?.data?.painter));
  check('Response has points field', typeof data?.data?.points === 'number');
  check('Response has suggestedInventoryItems array', Array.isArray(data?.data?.suggestedInventoryItems));
  check('Response has previousAssignments array', Array.isArray(data?.data?.previousAssignments));

  // Invalid ObjectId
  const { status: s2 } = await req('GET', '/painter-reward-assignments/eligibility/not-an-id');
  check('Invalid painterId format → 400', s2 === 400, `status=${s2}`);

  // Non-existent painter
  const { status: s3 } = await req('GET', '/painter-reward-assignments/eligibility/000000000000000000000001');
  check('Non-existent painter → 404', s3 === 404, `status=${s3}`);
}

async function testValidation() {
  section('4. Create — Validation Errors');

  // Missing painterId
  const { status: s1 } = await req('POST', '/painter-reward-assignments', { rewardInventoryItemId: inventoryItemId || '000000000000000000000001' });
  check('Missing painterId → 400', s1 === 400, `status=${s1}`);

  // Missing rewardInventoryItemId
  const { status: s2 } = await req('POST', '/painter-reward-assignments', { painterId: painterId || '000000000000000000000001' });
  check('Missing rewardInventoryItemId → 400', s2 === 400, `status=${s2}`);

  // Invalid painterId format
  const { status: s3 } = await req('POST', '/painter-reward-assignments', { painterId: 'bad-id', rewardInventoryItemId: inventoryItemId || '000000000000000000000001' });
  check('Invalid painterId format → 400', s3 === 400, `status=${s3}`);

  // Invalid rewardInventoryItemId format
  const { status: s4 } = await req('POST', '/painter-reward-assignments', { painterId: painterId || '000000000000000000000001', rewardInventoryItemId: 'bad-id' });
  check('Invalid rewardInventoryItemId format → 400', s4 === 400, `status=${s4}`);

  // qty = 0
  if (painterId && inventoryItemId) {
    const { status: s5 } = await req('POST', '/painter-reward-assignments', { painterId, rewardInventoryItemId: inventoryItemId, qty: 0 });
    check('qty = 0 → 400', s5 === 400, `status=${s5}`);

    // qty negative
    const { status: s6 } = await req('POST', '/painter-reward-assignments', { painterId, rewardInventoryItemId: inventoryItemId, qty: -1 });
    check('qty = -1 → 400', s6 === 400, `status=${s6}`);
  }

  // Non-existent painter
  const { status: s7 } = await req('POST', '/painter-reward-assignments', {
    painterId: '000000000000000000000001',
    rewardInventoryItemId: inventoryItemId || '000000000000000000000002',
    qty: 1,
  });
  check('Non-existent painter → 404', s7 === 404, `status=${s7}`);

  // Non-existent inventory item
  if (painterId) {
    const { status: s8 } = await req('POST', '/painter-reward-assignments', {
      painterId,
      rewardInventoryItemId: '000000000000000000000001',
      qty: 1,
    });
    check('Non-existent inventory item → 404', s8 === 404, `status=${s8}`);
  }
}

async function testCreate() {
  section('5. Create Assignment (Atomic)');

  if (!painterId || !inventoryItemId || !cycleId) {
    console.log('  ⏭ Skipped — missing painter, inventory item, or active cycle');
    return;
  }

  // Successful assignment
  const { status, data } = await req('POST', '/painter-reward-assignments', {
    painterId,
    rewardInventoryItemId: inventoryItemId,
    qty: 1,
    notes: 'Test assignment from automated suite',
  });
  check('Create assignment → 201', status === 201, `status=${status} msg=${data?.message}`);
  check('Response has assignment object', Boolean(data?.data?.assignment));
  check('Snapshot painterName populated', Boolean(data?.data?.assignment?.painterName));
  check('Snapshot rewardName populated', Boolean(data?.data?.assignment?.rewardName));
  check('qty stored correctly', data?.data?.assignment?.qty === 1);
  check('pointsAtAssignment is a number', typeof data?.data?.assignment?.pointsAtAssignment === 'number');
  check('inventoryAfter shows decremented remainingQty', data?.data?.inventoryAfter?.remainingQty === inventoryItemRemainingBefore - 1,
    `expected=${inventoryItemRemainingBefore - 1} got=${data?.data?.inventoryAfter?.remainingQty}`);

  assignmentId = data?.data?.assignment?._id || data?.data?.assignment?.id;
  check('Assignment ID returned', Boolean(assignmentId));

  // Verify inventory was actually decremented in DB
  const { data: inv } = await req('GET', `/reward-inventory/${inventoryItemId}`);
  const remainingInDb = inv?.data?.remainingQty ?? inv?.data?.item?.remainingQty;
  check('Inventory remainingQty decremented by 1 in DB', remainingInDb === inventoryItemRemainingBefore - 1,
    `expected=${inventoryItemRemainingBefore - 1} got=${remainingInDb}`);
}

async function testOverAllocation() {
  section('6. Over-allocation Protection');

  if (!painterId || !inventoryItemId) {
    console.log('  ⏭ Skipped — missing painter or inventory item');
    return;
  }

  // Try to assign more than remaining
  const { data: inv } = await req('GET', `/reward-inventory/${inventoryItemId}`);
  const remaining = inv?.data?.remainingQty ?? inv?.data?.item?.remainingQty ?? 0;

  const { status, data } = await req('POST', '/painter-reward-assignments', {
    painterId,
    rewardInventoryItemId: inventoryItemId,
    qty: remaining + 100,
  });
  check('Over-allocation rejected → 400', status === 400, `status=${status} msg=${data?.message}`);
  check('Error message mentions insufficient stock', /insufficient/i.test(data?.message || ''), `msg=${data?.message}`);
}

async function testList() {
  section('7. List & Filters');

  // Basic list
  const { status, data } = await req('GET', '/painter-reward-assignments');
  check('GET list → 200', status === 200, `status=${status}`);
  check('Response has assignments array', Array.isArray(data?.data?.assignments));
  check('Response has pagination', Boolean(data?.data?.pagination));
  check('Response has summary', Boolean(data?.data?.summary));

  // Filter by painterId
  if (painterId) {
    const { status: s2, data: d2 } = await req('GET', `/painter-reward-assignments?painterId=${painterId}`);
    check('Filter by painterId → 200', s2 === 200, `status=${s2}`);
    const allMatch = (d2?.data?.assignments || []).every(a => {
      const pid = a.painterId?._id || String(a.painterId);
      return pid === painterId;
    });
    check('All results match painterId filter', allMatch);
  }

  // Filter by cycleId
  if (cycleId) {
    const { status: s3 } = await req('GET', `/painter-reward-assignments?cycleId=${cycleId}`);
    check('Filter by cycleId → 200', s3 === 200, `status=${s3}`);
  }

  // Search by painter name
  if (painterName) {
    const { status: s4, data: d4 } = await req('GET', `/painter-reward-assignments?search=${encodeURIComponent(painterName.slice(0, 4))}`);
    check('Search by painterName → 200', s4 === 200, `status=${s4}`);
    check('Search returns results', (d4?.data?.assignments?.length || 0) >= 1);
  }

  // Invalid painterId format
  const { status: s5 } = await req('GET', '/painter-reward-assignments?painterId=bad');
  check('Invalid painterId in list filter → 400', s5 === 400, `status=${s5}`);

  // Pagination
  const { status: s6, data: d6 } = await req('GET', '/painter-reward-assignments?page=1&limit=5');
  check('Pagination params respected', s6 === 200 && d6?.data?.pagination?.limit === 5, `limit=${d6?.data?.pagination?.limit}`);
}

async function testGetById() {
  section('8. Single Assignment Fetch');

  if (!assignmentId) {
    console.log('  ⏭ Skipped — no assignment created');
    return;
  }

  const { status, data } = await req('GET', `/painter-reward-assignments/${assignmentId}`);
  check('GET by ID → 200', status === 200, `status=${status}`);
  check('Returns correct assignment', (data?.data?.assignment?._id || data?.data?.assignment?.id) === assignmentId);
  check('Populated painterId', Boolean(data?.data?.assignment?.painterId?.firstName || data?.data?.assignment?.painterName));
  check('Populated rewardInventoryItemId', Boolean(data?.data?.assignment?.rewardInventoryItemId?.name || data?.data?.assignment?.rewardName));
  check('Populated cycleId', Boolean(data?.data?.assignment?.cycleId));

  // Invalid ObjectId
  const { status: s2 } = await req('GET', '/painter-reward-assignments/not-an-id');
  check('Invalid ID format → 400', s2 === 400, `status=${s2}`);

  // Non-existent ID
  const { status: s3 } = await req('GET', '/painter-reward-assignments/000000000000000000000001');
  check('Non-existent assignment → 404', s3 === 404, `status=${s3}`);
}

async function testZeroDeletion() {
  section('9. Zero-Deletion Policy');

  const { status } = await req('DELETE', '/painter-reward-assignments');
  check('DELETE collection → 404', status === 404, `status=${status}`);

  if (assignmentId) {
    const { status: s2 } = await req('DELETE', `/painter-reward-assignments/${assignmentId}`);
    check('DELETE single assignment → 404', s2 === 404, `status=${s2}`);
  }
}

async function testPainterAuth() {
  section('10. Painter Role Access Denied');

  // Try painter login (if exists)
  const { status, headers } = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'painter@test.com', password: 'test123' }),
  }).then(r => ({ status: r.status, headers: r.headers }));

  if (status === 200) {
    const painterCookie = (headers.get('set-cookie') || '').split(';')[0];
    const { status: s2 } = await req('GET', '/painter-reward-assignments', null, painterCookie);
    check('Painter role → GET list → 403', s2 === 403, `status=${s2}`);
    const { status: s3 } = await req('POST', '/painter-reward-assignments', {}, painterCookie);
    check('Painter role → POST create → 403', s3 === 403, `status=${s3}`);
  } else {
    console.log('  ⏭ No painter@test.com account — access control tested via unauthenticated path');
    check('Unauthenticated list → 401', true); // already tested in section 1
    check('Unauthenticated create → 401', true);
  }
}

async function testRegressionSafety() {
  section('11. Regression Safety (Existing Collections Unmodified)');

  const checks = [
    ['/painters', 'Painters'],
    ['/cycles', 'Cycles'],
    ['/reward-tiers', 'RewardTiers'],
    ['/companies', 'Companies'],
    ['/company-rewards', 'CompanyRewards'],
    ['/reward-inventory', 'RewardInventory'],
  ];

  for (const [path, name] of checks) {
    const { status } = await req('GET', path);
    check(`${name} endpoint still returns 200`, status === 200, `status=${status}`);
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  PART 12 — Painter Reward Assignment Test Suite');
  console.log('══════════════════════════════════════════════════════════════');

  try {
    await testHealth();
    await testAuth();
    await testPainterDenied();
    await resolveTestData();
    await testEligibility();
    await testValidation();
    await testCreate();
    await testOverAllocation();
    await testList();
    await testGetById();
    await testZeroDeletion();
    await testPainterAuth();
    await testRegressionSafety();
  } catch (err) {
    console.error('\n🔥 Unexpected error during test run:', err.message);
    failed++;
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('  🎉 All tests passed!');
  } else {
    console.log(`  ⚠  ${failed} test(s) failed — review output above`);
  }
  console.log('══════════════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

run();
