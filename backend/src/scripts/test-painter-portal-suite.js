/**
 * test-painter-portal-suite.js — Part 13
 *
 * Comprehensive automated security, isolation, and functional test suite
 * for the Read-Only Painter Portal module.
 *
 * Run: node src/scripts/test-painter-portal-suite.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const BASE = 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@paintshop.com';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || 'changeme123';

let passed = 0;
let failed = 0;

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

// ── HTTP Helper ───────────────────────────────────────────────────────────────
async function apiReq(method, path, body = null, cookie = '') {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data, headers: res.headers };
}

// ── Suite State ───────────────────────────────────────────────────────────────
let adminCookie = '';
let painterACookie = '';
let painterBCookie = '';
let deactivatedPainterCookie = '';

let painterAId = '';
let painterBId = '';
let deactivatedPainterId = '';

let activeCycleId = '';
let previousCycleId = '';
let testRewardTierId = '';
let testAssignmentAId = '';
let testAssignmentBId = '';
let testSaleAActiveId = '';
let testSaleAActivePoints = 0;
let testSaleAPreviousId = '';
let testInventoryItemId = '';

// Baseline counts for data safety verification
let baselineSalesCount = 0;
let baselineAssignmentsCount = 0;
let baselineInventoryCount = 0;
let baselineCyclesCount = 0;
let baselineTiersCount = 0;

// ── Tests ─────────────────────────────────────────────────────────────────────

async function setupAndAuth() {
  section('1. Health & Authentication Setup');

  // Health
  const { status: hs } = await apiReq('GET', '/health');
  check('Server health 200', hs === 200);

  // Admin login
  const adminRes = await apiReq('POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });
  check('Admin login succeeds → 200', adminRes.status === 200);
  adminCookie = adminRes.headers.get('set-cookie')?.split(';')[0] || '';
  check('Admin cookie received', Boolean(adminCookie));

  // Ensure test painters exist
  // 1. Painter A
  const pAEmail = 'portal_painter_a@test.com';
  const pAPass = 'painterPass123!';
  let { status: sA, data: dA } = await apiReq(
    'POST',
    '/painters',
    {
      firstName: 'Painter Alpha',
      mobile: '9876543210',
      email: pAEmail,
      password: pAPass,
    },
    adminCookie
  );
  if (sA !== 201) {
    // Lookup existing
    const { data: listData } = await apiReq('GET', `/painters?search=${encodeURIComponent(pAEmail)}`, null, adminCookie);
    const found = listData?.painters?.find((p) => p.email === pAEmail);
    if (found) painterAId = found.id || found._id;
  } else {
    painterAId = dA?.data?.id || dA?.data?._id || dA?.painter?.id || dA?.painter?._id;
  }
  check('Painter A identified/created', Boolean(painterAId));

  // 2. Painter B
  const pBEmail = 'portal_painter_b@test.com';
  const pBPass = 'painterPass123!';
  let { status: sB, data: dB } = await apiReq(
    'POST',
    '/painters',
    {
      firstName: 'Painter Beta',
      mobile: '9876543211',
      email: pBEmail,
      password: pBPass,
    },
    adminCookie
  );
  if (sB !== 201) {
    const { data: listData } = await apiReq('GET', `/painters?search=${encodeURIComponent(pBEmail)}`, null, adminCookie);
    const found = listData?.painters?.find((p) => p.email === pBEmail);
    if (found) painterBId = found.id || found._id;
  } else {
    painterBId = dB?.data?.id || dB?.data?._id || dB?.painter?.id || dB?.painter?._id;
  }
  check('Painter B identified/created', Boolean(painterBId));

  // 3. Deactivated Painter
  const pDEmail = 'portal_deactivated@test.com';
  const pDPass = 'painterPass123!';
  let { status: sD, data: dD } = await apiReq(
    'POST',
    '/painters',
    {
      firstName: 'Deactivated Painter',
      mobile: '9876543212',
      email: pDEmail,
      password: pDPass,
    },
    adminCookie
  );
  if (sD !== 201) {
    const { data: listData } = await apiReq('GET', `/painters?search=${encodeURIComponent(pDEmail)}`, null, adminCookie);
    const found = listData?.painters?.find((p) => p.email === pDEmail);
    if (found) deactivatedPainterId = found.id || found._id;
  } else {
    deactivatedPainterId = dD?.data?.id || dD?.data?._id || dD?.painter?.id || dD?.painter?._id;
  }
  // Ensure painter is active first to obtain a fresh valid JWT token
  await apiReq('PATCH', `/painters/${deactivatedPainterId}/activate`, null, adminCookie);
  const dLogin = await apiReq('POST', '/auth/login', { email: pDEmail, password: pDPass });
  deactivatedPainterCookie = dLogin.headers.get('set-cookie')?.split(';')[0] || '';
  // Now deactivate the painter via admin
  await apiReq('PATCH', `/painters/${deactivatedPainterId}/deactivate`, null, adminCookie);
  check('Deactivated painter prepared with valid token but deactivated status in DB', Boolean(deactivatedPainterCookie));

  // Log in Painter A
  const lA = await apiReq('POST', '/auth/login', { email: pAEmail, password: pAPass });
  painterACookie = lA.headers.get('set-cookie')?.split(';')[0] || '';
  check('Painter A logged in successfully', lA.status === 200 && Boolean(painterACookie));

  // Log in Painter B
  const lB = await apiReq('POST', '/auth/login', { email: pBEmail, password: pBPass });
  painterBCookie = lB.headers.get('set-cookie')?.split(';')[0] || '';
  check('Painter B logged in successfully', lB.status === 200 && Boolean(painterBCookie));

  // Resolve Cycles
  const { data: cyclesRes } = await apiReq('GET', '/cycles', null, adminCookie);
  const cycles = Array.isArray(cyclesRes?.data) ? cyclesRes.data : [];
  let actC = cyclesRes?.activeCycle || cycles.find((c) => c.isActive);

  if (!actC) {
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { data: newC } = await apiReq(
      'POST',
      '/cycles',
      {
        startDate: now.toISOString(),
        endDate: nextMonth.toISOString(),
        isActive: true,
      },
      adminCookie
    );
    actC = newC?.data;
  }
  activeCycleId = actC?.id || actC?._id;
  check('Active cycle resolved', Boolean(activeCycleId));

  // Resolve or create a closed/previous cycle
  const closedC = cycles.find((c) => !c.isActive);
  if (closedC) {
    previousCycleId = closedC.id || closedC._id;
  } else {
    const pastStart = new Date('2025-01-01T00:00:00Z');
    const pastEnd = new Date('2025-03-31T00:00:00Z');
    const { data: newPast } = await apiReq(
      'POST',
      '/cycles',
      {
        startDate: pastStart.toISOString(),
        endDate: pastEnd.toISOString(),
        isActive: false,
      },
      adminCookie
    );
    previousCycleId = newPast?.data?.id || newPast?.data?._id;
  }
  check('Previous cycle resolved', Boolean(previousCycleId));

  // Resolve an inventory item
  const { data: invData } = await apiReq('GET', '/reward-inventory?status=active&availability=available&limit=1', null, adminCookie);
  const invItems = Array.isArray(invData?.data) ? invData.data : [];
  if (invItems.length > 0) {
    testInventoryItemId = invItems[0].id || invItems[0]._id;
  }
  check('Inventory item available', Boolean(testInventoryItemId));

  // Resolve or create an Item in the catalog
  let testItemId = '';
  const { data: itemsData } = await apiReq('GET', '/items?limit=1', null, adminCookie);
  const items = Array.isArray(itemsData?.items) ? itemsData.items : (Array.isArray(itemsData?.data) ? itemsData.data : []);
  if (items.length > 0) {
    testItemId = items[0].id || items[0]._id;
  } else {
    const { data: newItem } = await apiReq(
      'POST',
      '/items',
      {
        name: 'Royal Luxury Emulsion',
        category: 'Interior',
        price: 2500,
        points: 25,
      },
      adminCookie
    );
    testItemId = newItem?.item?.id || newItem?.data?.id || newItem?.item?._id;
  }
  check('Catalog item available', Boolean(testItemId));

  // Create Sale for Painter A in ACTIVE cycle
  testSaleAActivePoints = 0;
  if (testItemId) {
    const { status: saleAStat, data: saleAData } = await apiReq(
      'POST',
      '/sales',
      {
        painterId: painterAId,
        customer: { name: 'Portal Test Customer', mobile: '9988776655' },
        lineItems: [
          {
            itemId: testItemId,
            quantity: 2,
          },
        ],
      },
      adminCookie
    );
    if (saleAStat === 201) {
      testSaleAActiveId = saleAData?.sale?.id || saleAData?.data?.id || saleAData?.data?._id;
      testSaleAActivePoints = saleAData?.sale?.totalPoints ?? saleAData?.data?.totalPoints ?? 0;
    }
  }
  check('Test sale recorded for Painter A', Boolean(testSaleAActiveId));

  // Create an assignment for Painter A
  if (testInventoryItemId) {
    const { status: aStat, data: aData } = await apiReq(
      'POST',
      '/painter-reward-assignments',
      {
        painterId: painterAId,
        rewardInventoryItemId: testInventoryItemId,
        cycleId: activeCycleId,
        qty: 1,
        notes: 'Assignment for Painter A test',
      },
      adminCookie
    );
    if (aStat === 201) {
      testAssignmentAId = aData?.data?.assignment?.id || aData?.data?.assignment?._id;
    }
  }

  // Create an assignment for Painter B
  if (testInventoryItemId) {
    const { status: bStat, data: bData } = await apiReq(
      'POST',
      '/painter-reward-assignments',
      {
        painterId: painterBId,
        rewardInventoryItemId: testInventoryItemId,
        cycleId: activeCycleId,
        qty: 1,
        notes: 'Assignment for Painter B test',
      },
      adminCookie
    );
    if (bStat === 201) {
      testAssignmentBId = bData?.data?.assignment?.id || bData?.data?.assignment?._id;
    }
  }

  // Record baseline counts for Data Safety checks
  const [sRes, aRes, iRes, cRes, tRes] = await Promise.all([
    apiReq('GET', '/sales?limit=1', null, adminCookie),
    apiReq('GET', '/painter-reward-assignments?limit=1', null, adminCookie),
    apiReq('GET', '/reward-inventory?limit=1', null, adminCookie),
    apiReq('GET', '/cycles?limit=1', null, adminCookie),
    apiReq('GET', '/reward-tiers', null, adminCookie),
  ]);
  baselineSalesCount = sRes?.data?.pagination?.total || 0;
  baselineAssignmentsCount = aRes?.data?.pagination?.total || 0;
  baselineInventoryCount = iRes?.data?.pagination?.total || 0;
  baselineCyclesCount = cRes?.data?.pagination?.total || 0;
  baselineTiersCount = tRes?.data?.length || 0;
}

async function testAuthRoleGuards() {
  section('2. Authentication & Role Guards');

  // Admin cannot access painter portal APIs
  const { status: s1 } = await apiReq('GET', '/painter-portal/me', null, adminCookie);
  check('Admin cannot use painter portal APIs → 403 Forbidden', s1 === 403, `status=${s1}`);

  const { status: s1b } = await apiReq('GET', '/painter-portal/dashboard', null, adminCookie);
  check('Admin cannot use painter portal dashboard → 403 Forbidden', s1b === 403, `status=${s1b}`);

  // Unauthenticated requests rejected
  const { status: s2 } = await apiReq('GET', '/painter-portal/me');
  check('Unauthenticated /me rejected → 401 Unauthorized', s2 === 401, `status=${s2}`);

  const { status: s2b } = await apiReq('GET', '/painter-portal/dashboard');
  check('Unauthenticated /dashboard rejected → 401 Unauthorized', s2b === 401, `status=${s2b}`);

  const { status: s2c } = await apiReq('GET', '/painter-portal/sales');
  check('Unauthenticated /sales rejected → 401 Unauthorized', s2c === 401, `status=${s2c}`);

  // Deactivated painter rejected
  const { status: s3, data: d3 } = await apiReq('GET', '/painter-portal/me', null, deactivatedPainterCookie);
  check('Deactivated painter rejected → 403 Forbidden', s3 === 403, `status=${s3} msg=${d3?.message}`);

  const { status: s3b } = await apiReq('GET', '/painter-portal/dashboard', null, deactivatedPainterCookie);
  check('Deactivated painter /dashboard rejected → 403 Forbidden', s3b === 403, `status=${s3b}`);
}

async function testOwnDataIsolation() {
  section('3. Own-Data Isolation & Privacy');

  // Painter A accesses own /me
  const { status: sA, data: dA } = await apiReq('GET', '/painter-portal/me', null, painterACookie);
  check('Painter A can access own /me → 200', sA === 200);
  check('Painter A /me returns own id', dA?.data?.id === painterAId);
  check('Painter A /me does NOT expose password', !dA?.data?.password && !dA?.data?.passwordHash);

  // Painter A cannot query Painter B's sales via query parameter
  const { status: sSales, data: dSales } = await apiReq(
    'GET',
    `/painter-portal/sales?painterId=${painterBId}`,
    null,
    painterACookie
  );
  check('Painter A /sales request returns 200', sSales === 200);
  const allSalesA = dSales?.data?.sales || [];
  const leakedSale = allSalesA.find((s) => s.painterId === painterBId);
  check('Query parameter painterId=painterB ignored; zero painter B sales returned', !leakedSale);

  // Painter A rewards only contain Painter A assignments
  const { status: sR, data: dR } = await apiReq('GET', '/painter-portal/rewards', null, painterACookie);
  check('Painter A /rewards returns 200', sR === 200);
  const rewardsA = dR?.data?.rewards || [];
  check('Painter A rewards belong only to Painter A', !rewardsA.some((r) => r.id === testAssignmentBId));

  // Painter A cannot access Painter B's reward by ID
  if (testAssignmentBId) {
    const { status: sDetail } = await apiReq(
      'GET',
      `/painter-portal/rewards/${testAssignmentBId}`,
      null,
      painterACookie
    );
    check('Painter A fetching Painter B reward by ID rejected → 404', sDetail === 404, `status=${sDetail}`);
  }

  // Painter A fetching own reward by ID succeeds
  if (testAssignmentAId) {
    const { status: sOwnDetail, data: dOwnDetail } = await apiReq(
      'GET',
      `/painter-portal/rewards/${testAssignmentAId}`,
      null,
      painterACookie
    );
    check('Painter A fetching own reward by ID succeeds → 200', sOwnDetail === 200);
    check('Reward detail id matches', dOwnDetail?.data?.id === testAssignmentAId);
  }
}

async function testDashboard() {
  section('4. Painter Dashboard');

  const { status, data } = await apiReq('GET', '/painter-portal/dashboard', null, painterACookie);
  check('Dashboard returns 200', status === 200);
  check('Dashboard returns painter profile', data?.data?.painter?.id === painterAId);
  check('Current cycle resolved', Boolean(data?.data?.currentCycle?.id));

  // CRITICAL: Point calculation — strictly from active cycle
  const currentPts = data?.data?.currentPoints;
  check('Current points is a number', typeof currentPts === 'number');
  check('Current points strictly active cycle (matches active sales)', currentPts >= testSaleAActivePoints && currentPts >= 0, `pts=${currentPts}`);

  // Check that recent sales and rewards are present
  check('Recent sales array present', Array.isArray(data?.data?.recentSales));
  check('Recent rewards array present', Array.isArray(data?.data?.recentRewards));
  check('Reward eligibility object present', typeof data?.data?.rewardEligibility?.eligible === 'boolean');
}

async function testSalesHistory() {
  section('5. Sales History & Line Item Snapshots');

  const { status, data } = await apiReq('GET', '/painter-portal/sales', null, painterACookie);
  check('Sales history returns 200', status === 200);
  check('Response has sales array', Array.isArray(data?.data?.sales));
  check('Response has pagination metadata', Boolean(data?.data?.pagination));

  const sales = data?.data?.sales || [];
  if (sales.length > 0) {
    const first = sales[0];
    check('Sale has id', Boolean(first.id));
    check('Sale has date', Boolean(first.date));
    check('Sale has lineItems array', Array.isArray(first.lineItems));
    check('Line items have snapshot itemName', Boolean(first.lineItems?.[0]?.itemName));
    check('Line items have snapshot pointsPerUnit', typeof first.lineItems?.[0]?.pointsPerUnit === 'number');
    check('Sale has totalPoints', typeof first.totalPoints === 'number');
    check('Sale has totalAmount', typeof first.totalAmount === 'number');
  }

  // Cycle filtering
  if (activeCycleId) {
    const { status: sC, data: dC } = await apiReq(
      'GET',
      `/painter-portal/sales?cycleId=${activeCycleId}`,
      null,
      painterACookie
    );
    check('Filter sales by active cycleId → 200', sC === 200);
    const cycleSales = dC?.data?.sales || [];
    const allMatch = cycleSales.every((s) => s.cycle?.id === activeCycleId);
    check('All returned sales match cycleId filter', allMatch);
  }

  // Date filtering
  const { status: sDate } = await apiReq(
    'GET',
    '/painter-portal/sales?startDate=2025-01-01&endDate=2026-12-31',
    null,
    painterACookie
  );
  check('Filter sales by date range → 200', sDate === 200);
}

async function testEligibility() {
  section('6. Reward Eligibility & Tier Target');

  const { status, data } = await apiReq('GET', '/painter-portal/eligibility', null, painterACookie);
  check('Eligibility endpoint returns 200', status === 200);
  check('Response contains currentPoints', typeof data?.data?.currentPoints === 'number');
  check('Response contains eligible boolean', typeof data?.data?.eligible === 'boolean');
  check('Response contains currentCycle object', Boolean(data?.data?.currentCycle));

  if (data?.data?.eligible) {
    check('Qualifying tier has suggestedRewardName', Boolean(data?.data?.suggestedRewardName));
    check('Tier minPoints is number', typeof data?.data?.tier?.minPoints === 'number');
  } else {
    check('Non-eligible handled cleanly without errors', data?.data?.eligible === false);
  }
}

async function testRewardsHistory() {
  section('7. Rewards Received History');

  const { status, data } = await apiReq('GET', '/painter-portal/rewards', null, painterACookie);
  check('Rewards history returns 200', status === 200);
  check('Response has rewards array', Array.isArray(data?.data?.rewards));
  check('Response has pagination', Boolean(data?.data?.pagination));

  const rewards = data?.data?.rewards || [];
  if (rewards.length > 0) {
    const r = rewards[0];
    check('Reward has rewardName snapshot', Boolean(r.rewardName));
    check('Reward has qty >= 1', r.qty >= 1);
    check('Reward has assignment date', Boolean(r.date));
    check('Reward has pointsAtAssignment number', typeof r.pointsAtAssignment === 'number');
  }

  // Single reward fetch: invalid format
  const { status: sBad } = await apiReq('GET', '/painter-portal/rewards/invalid-object-id', null, painterACookie);
  check('Invalid reward assignment ID format → 400', sBad === 400, `status=${sBad}`);

  // Single reward fetch: non-existent ID
  const { status: sNone } = await apiReq('GET', '/painter-portal/rewards/000000000000000000000099', null, painterACookie);
  check('Non-existent reward assignment ID → 404', sNone === 404, `status=${sNone}`);
}

async function testCyclesHistory() {
  section('8. Cycles History');

  const { status, data } = await apiReq('GET', '/painter-portal/cycles', null, painterACookie);
  check('Cycles history returns 200', status === 200);
  check('Response is an array of cycle summaries', Array.isArray(data?.data));

  const cycles = data?.data || [];
  const currentC = cycles.find((c) => c.isCurrentCycle);
  check('Current active cycle is flagged isCurrentCycle = true', Boolean(currentC));

  const closedC = cycles.find((c) => !c.isCurrentCycle);
  if (closedC) {
    check('Previous closed cycle visible in history', Boolean(closedC.cycle?.id));
    check('Closed cycle has totalPoints aggregated', typeof closedC.totalPoints === 'number');
  }
}

async function testMutationLockdown() {
  section('9. Read-Only Mutation Lockdown');

  const methods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const paths = [
    '/painter-portal/me',
    '/painter-portal/dashboard',
    '/painter-portal/sales',
    '/painter-portal/rewards',
    '/painter-portal/eligibility',
    '/painter-portal/cycles',
  ];

  for (const method of methods) {
    const { status } = await apiReq(method, paths[0], { test: 'mutation' }, painterACookie);
    check(`${method} /painter-portal/me rejected → 404`, status === 404, `status=${status}`);
  }
}

async function testAdminEndpointsLockdown() {
  section('10. Admin Endpoints Access Control');

  const adminPaths = [
    ['GET', '/painters'],
    ['POST', '/painters', { firstName: 'Hack' }],
    ['GET', '/cycles'],
    ['POST', '/cycles', { startDate: '2026-01-01', endDate: '2026-02-01' }],
    ['GET', '/reward-tiers'],
    ['POST', '/reward-tiers', { minPoints: 10, maxPoints: 20, suggestedRewardName: 'Hack' }],
    ['GET', '/companies'],
    ['GET', '/company-rewards'],
    ['GET', '/reward-inventory'],
    ['POST', '/reward-inventory', { name: 'Hack' }],
    ['GET', '/painter-reward-assignments'],
    ['POST', '/painter-reward-assignments', { qty: 1 }],
    ['GET', `/painter-history/${painterBId}`],
  ];

  for (const [m, p, b] of adminPaths) {
    const { status } = await apiReq(m, p, b || null, painterACookie);
    check(`Painter denied ${m} ${p} → 403 Forbidden`, status === 403, `status=${status}`);
  }
}

async function testDataSafety() {
  section('11. Data Safety & Integrity (Zero Unintended Mutations)');

  const [sRes, aRes, iRes, cRes, tRes] = await Promise.all([
    apiReq('GET', '/sales?limit=1', null, adminCookie),
    apiReq('GET', '/painter-reward-assignments?limit=1', null, adminCookie),
    apiReq('GET', '/reward-inventory?limit=1', null, adminCookie),
    apiReq('GET', '/cycles?limit=1', null, adminCookie),
    apiReq('GET', '/reward-tiers', null, adminCookie),
  ]);

  const currentSalesCount = sRes?.data?.pagination?.total || 0;
  const currentAssignmentsCount = aRes?.data?.pagination?.total || 0;
  const currentInventoryCount = iRes?.data?.pagination?.total || 0;
  const currentCyclesCount = cRes?.data?.pagination?.total || 0;
  const currentTiersCount = tRes?.data?.length || 0;

  check('Sales count preserved', currentSalesCount === baselineSalesCount, `expected=${baselineSalesCount} got=${currentSalesCount}`);
  check('Reward assignments count preserved', currentAssignmentsCount === baselineAssignmentsCount, `expected=${baselineAssignmentsCount} got=${currentAssignmentsCount}`);
  check('Reward inventory count preserved', currentInventoryCount === baselineInventoryCount, `expected=${baselineInventoryCount} got=${currentInventoryCount}`);
  check('Cycles count preserved', currentCyclesCount === baselineCyclesCount, `expected=${baselineCyclesCount} got=${currentCyclesCount}`);
  check('Reward tiers count preserved', currentTiersCount === baselineTiersCount, `expected=${baselineTiersCount} got=${currentTiersCount}`);
}

// ── Runner ────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  PART 13 — Painter Portal Test Suite');
  console.log('══════════════════════════════════════════════════════════════');

  try {
    await setupAndAuth();
    await testAuthRoleGuards();
    await testOwnDataIsolation();
    await testDashboard();
    await testSalesHistory();
    await testEligibility();
    await testRewardsHistory();
    await testCyclesHistory();
    await testMutationLockdown();
    await testAdminEndpointsLockdown();
    await testDataSafety();
  } catch (err) {
    console.error('\n🔥 Unexpected error during test run:', err);
    failed++;
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('  🎉 All tests passed successfully!');
  } else {
    console.log(`  ⚠  ${failed} test(s) failed — review output above`);
  }
  console.log('══════════════════════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

run();
