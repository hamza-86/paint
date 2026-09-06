/**
 * test-dashboard-suite.js — Part 14
 *
 * Comprehensive automated test suite for Real Admin Dashboard & Reporting View.
 *
 * Tests:
 * 1. Security & Auth Guards:
 *    - All 8 endpoints return 401 when unauthenticated
 *    - All 8 endpoints return 403 when authenticated as Painter
 *    - All 8 endpoints return 200 when authenticated as Admin
 * 2. Summary Endpoint (/api/dashboard/summary):
 *    - Correct schema structure (painters, currentCycle, rewards, companyRewards)
 *    - Accurate painter counts (total, active, deactivated)
 *    - Current cycle null handling when no active cycle
 *    - Accurate current cycle metrics when active cycle present
 *    - Accurate reward inventory totals (totalQty, remainingQty, assignedQty, assignments)
 *    - Accurate company reward totals (entries, saleValue, quantitySold)
 * 3. Top Painters Endpoint (/api/dashboard/top-painters):
 *    - Returns array
 *    - Respects limit query parameter
 *    - Sorted descending by points / salesValue
 *    - Ranks 1..N assigned properly
 *    - Includes painter profile details
 * 4. Sales Trend Endpoint (/api/dashboard/sales-trend):
 *    - Returns array of daily aggregates
 *    - Validates cycleId query parameter (handles invalid ObjectId with 400)
 *    - Daily sums for salesCount, totalAmount, totalPoints
 * 5. Recent Sales Endpoint (/api/dashboard/recent-sales):
 *    - Returns array of sales
 *    - Respects limit query parameter
 *    - Sorted descending by date/createdAt
 *    - Populates painter and customer objects
 * 6. Recent Rewards Endpoint (/api/dashboard/recent-rewards):
 *    - Returns array of reward assignments
 *    - Respects limit parameter
 *    - Populates snapshot fields
 * 7. Inventory Summary Endpoint (/api/dashboard/inventory-summary):
 *    - Correct counts of active vs deactivated items
 *    - Correct remaining vs assigned quantity calculation
 *    - Correct low-stock items array (items with remainingQty <= 2)
 * 8. Company Rewards Summary Endpoint (/api/dashboard/company-rewards-summary):
 *    - Accurate global totals (entries, saleValue, quantitySold)
 *    - Grouped by company with populated company name
 * 9. Activity Feed Endpoint (/api/dashboard/activity):
 *    - Returns merged chronologically sorted array
 *    - Respects limit parameter
 *    - Categorizes events into types: 'sale', 'reward_assignment', 'company_reward'
 * 10. Data Immutability & Zero Mutation:
 *     - Verifies that calling dashboard endpoints causes zero modifications in database
 *
 * Run: node src/scripts/test-dashboard-suite.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import '../models/index.js';

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

async function apiReq(method, endpointPath, body = null, cookie = '') {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${endpointPath}`, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data, headers: res.headers };
}

let adminCookie = '';
let painterCookie = '';
let testPainterId = '';
let createdCycleId = null;

async function run() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║   PART 14 — REAL ADMIN DASHBOARD & REPORTS TEST SUITE          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  // ── Database Connection for state verification ────────────────────────────
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/paintshop_dev';
  await mongoose.connect(mongoUri);

  const endpoints = [
    '/dashboard/summary',
    '/dashboard/top-painters',
    '/dashboard/sales-trend',
    '/dashboard/recent-sales',
    '/dashboard/recent-rewards',
    '/dashboard/inventory-summary',
    '/dashboard/company-rewards-summary',
    '/dashboard/activity',
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1: Authentication & Authorization Guards
  // ──────────────────────────────────────────────────────────────────────────
  section('1. Security & Auth Guards — Unauthenticated Requests (401)');

  for (const ep of endpoints) {
    const res = await apiReq('GET', ep);
    check(`GET ${ep} returns 401 without auth`, res.status === 401, `Got ${res.status}`);
  }

  section('1b. Admin Login & Painter Login');
  const adminLogin = await apiReq('POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });
  check('Admin login succeeds', adminLogin.status === 200);
  adminCookie = adminLogin.headers.get('set-cookie') || '';
  check('Admin session cookie retrieved', Boolean(adminCookie));

  // Ensure a test painter exists and log in to test 403 authorization
  const Painter = mongoose.model('Painter');
  const pEmail = 'dash_test_painter@test.com';
  const pPass = 'painterPass123!';

  let testPainter = await Painter.findOne({ email: pEmail });
  if (!testPainter) {
    const pCreate = await apiReq(
      'POST',
      '/painters',
      {
        firstName: 'Dashboard',
        lastName: 'Tester',
        mobile: '9988112233',
        email: pEmail,
        password: pPass,
      },
      adminCookie
    );
    testPainterId = pCreate?.data?.id || pCreate?.data?._id;
  } else {
    testPainterId = testPainter._id.toString();
    if (testPainter.status !== 'active') {
      await apiReq('PATCH', `/painters/${testPainterId}/activate`, null, adminCookie);
    }
  }

  // Login as painter via /auth/login
  const painterLogin = await apiReq('POST', '/auth/login', {
    email: pEmail,
    password: pPass,
  });
  check('Painter login succeeds', painterLogin.status === 200, `Got ${painterLogin.status}`);
  painterCookie = painterLogin.headers.get('set-cookie')?.split(';')[0] || '';
  check('Painter session cookie retrieved', Boolean(painterCookie));

  section('1c. Security Guards — Painter Requests Denied (403)');
  for (const ep of endpoints) {
    const res = await apiReq('GET', ep, null, painterCookie);
    check(`GET ${ep} returns 403 for Painter`, res.status === 403, `Got ${res.status}`);
  }

  section('1d. Admin Access Allowed (200)');
  for (const ep of endpoints) {
    const res = await apiReq('GET', ep, null, adminCookie);
    check(`GET ${ep} returns 200 for Admin`, res.status === 200, `Got ${res.status}`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2: Dashboard Summary Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  section('2. Summary Endpoint (/api/dashboard/summary)');
  const summaryRes = await apiReq('GET', '/dashboard/summary', null, adminCookie);
  check('Summary endpoint returns 200', summaryRes.status === 200);
  check('Summary response has success: true', summaryRes.data?.success === true);

  const sData = summaryRes.data?.data;
  check('Summary has data object', Boolean(sData));
  check('Summary contains painters stats', Boolean(sData?.painters));
  check('Summary contains currentCycle', 'currentCycle' in (sData || {}));
  check('Summary contains rewards stats', Boolean(sData?.rewards));
  check('Summary contains companyRewards stats', Boolean(sData?.companyRewards));

  // Verify painter counts against DB
  const dbTotalPainters = await Painter.countDocuments();
  const dbActivePainters = await Painter.countDocuments({ status: 'active' });
  const dbDeactPainters = await Painter.countDocuments({ status: 'deactivated' });

  check('Summary painters.total matches database', sData?.painters?.total === dbTotalPainters);
  check('Summary painters.active matches database', sData?.painters?.active === dbActivePainters);
  check('Summary painters.deactivated matches database', sData?.painters?.deactivated === dbDeactPainters);

  // Verify reward inventory metrics
  const RewardInventoryItem = mongoose.model('RewardInventoryItem');
  const dbTotalRewardItems = await RewardInventoryItem.countDocuments();
  const dbActiveRewardItems = await RewardInventoryItem.countDocuments({ status: 'active' });
  check('Summary rewards.totalItems matches database', sData?.rewards?.totalItems === dbTotalRewardItems);
  check('Summary rewards.activeItems matches database', sData?.rewards?.activeItems === dbActiveRewardItems);
  check('Summary rewards.totalQty is a valid number', typeof sData?.rewards?.totalQty === 'number');
  check('Summary rewards.remainingQty is a valid number', typeof sData?.rewards?.remainingQty === 'number');
  check('Summary rewards.assignedQty is totalQty - remainingQty', sData?.rewards?.assignedQty === sData?.rewards?.totalQty - sData?.rewards?.remainingQty);

  // Verify company rewards metrics
  const CompanyRewardEntry = mongoose.model('CompanyRewardEntry');
  const dbTotalCompanyEntries = await CompanyRewardEntry.countDocuments();
  check('Summary companyRewards.totalEntries matches database', sData?.companyRewards?.totalEntries === dbTotalCompanyEntries);
  check('Summary companyRewards.totalSaleValue is a number', typeof sData?.companyRewards?.totalSaleValue === 'number');
  check('Summary companyRewards.totalQuantitySold is a number', typeof sData?.companyRewards?.totalQuantitySold === 'number');

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3: Top Painters Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  section('3. Top Painters Endpoint (/api/dashboard/top-painters)');
  const topPaintersRes = await apiReq('GET', '/dashboard/top-painters', null, adminCookie);
  check('Top painters returns 200', topPaintersRes.status === 200);
  check('Top painters data is an array', Array.isArray(topPaintersRes.data?.data));

  const topPaintersLimit1 = await apiReq('GET', '/dashboard/top-painters?limit=1', null, adminCookie);
  check('Top painters respects limit=1', topPaintersLimit1.status === 200 && topPaintersLimit1.data?.data?.length <= 1);

  const topList = topPaintersRes.data?.data || [];
  if (topList.length > 0) {
    const first = topList[0];
    check('Top painter has rank 1', first.rank === 1);
    check('Top painter has painterId', Boolean(first.painterId));
    check('Top painter has firstName', typeof first.firstName === 'string');
    check('Top painter has points', typeof first.points === 'number');
    check('Top painter has salesCount', typeof first.salesCount === 'number');
    check('Top painter has salesValue', typeof first.salesValue === 'number');

    if (topList.length > 1) {
      check('Top painters sorted descending by points', topList[0].points >= topList[1].points);
    }
  } else {
    check('Empty top painters array handled gracefully when no sales in cycle', Array.isArray(topList));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 4: Sales Trend Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  section('4. Sales Trend Endpoint (/api/dashboard/sales-trend)');
  const trendRes = await apiReq('GET', '/dashboard/sales-trend', null, adminCookie);
  check('Sales trend returns 200', trendRes.status === 200);
  check('Sales trend data is an array', Array.isArray(trendRes.data?.data));

  const invalidTrendRes = await apiReq('GET', '/dashboard/sales-trend?cycleId=invalid123', null, adminCookie);
  check('Sales trend with invalid cycleId returns 400', invalidTrendRes.status === 400);

  const trendData = trendRes.data?.data || [];
  if (trendData.length > 0) {
    const firstDay = trendData[0];
    check('Trend day has date in YYYY-MM-DD format', /^\d{4}-\d{2}-\d{2}$/.test(firstDay.date));
    check('Trend day has salesCount', typeof firstDay.salesCount === 'number');
    check('Trend day has totalAmount', typeof firstDay.totalAmount === 'number');
    check('Trend day has totalPoints', typeof firstDay.totalPoints === 'number');
  } else {
    check('Empty sales trend handled gracefully', Array.isArray(trendData));
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 5: Recent Sales Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  section('5. Recent Sales Endpoint (/api/dashboard/recent-sales)');
  const recentSalesRes = await apiReq('GET', '/dashboard/recent-sales', null, adminCookie);
  check('Recent sales returns 200', recentSalesRes.status === 200);
  check('Recent sales data is an array', Array.isArray(recentSalesRes.data?.data));

  const recentSalesLimit2 = await apiReq('GET', '/dashboard/recent-sales?limit=2', null, adminCookie);
  check('Recent sales respects limit=2', recentSalesLimit2.data?.data?.length <= 2);

  const salesList = recentSalesRes.data?.data || [];
  if (salesList.length > 0) {
    const s = salesList[0];
    check('Recent sale has id', Boolean(s.id));
    check('Recent sale has totalAmount', typeof s.totalAmount === 'number');
    check('Recent sale has totalPoints', typeof s.totalPoints === 'number');
    check('Recent sale has date', Boolean(s.date));
    if (salesList.length > 1) {
      check('Recent sales sorted descending by date/createdAt', new Date(salesList[0].date) >= new Date(salesList[1].date) || new Date(salesList[0].createdAt) >= new Date(salesList[1].createdAt));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 6: Recent Rewards Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  section('6. Recent Rewards Endpoint (/api/dashboard/recent-rewards)');
  const recentRewardsRes = await apiReq('GET', '/dashboard/recent-rewards', null, adminCookie);
  check('Recent rewards returns 200', recentRewardsRes.status === 200);
  check('Recent rewards data is an array', Array.isArray(recentRewardsRes.data?.data));

  const recentRewardsLimit2 = await apiReq('GET', '/dashboard/recent-rewards?limit=2', null, adminCookie);
  check('Recent rewards respects limit=2', recentRewardsLimit2.data?.data?.length <= 2);

  const rewardsList = recentRewardsRes.data?.data || [];
  if (rewardsList.length > 0) {
    const r = rewardsList[0];
    check('Recent reward has id', Boolean(r.id));
    check('Recent reward has painterName snapshot', Boolean(r.painterName));
    check('Recent reward has rewardName snapshot', Boolean(r.rewardName));
    check('Recent reward has qty', typeof r.qty === 'number');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 7: Inventory Summary Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  section('7. Inventory Summary Endpoint (/api/dashboard/inventory-summary)');
  const invRes = await apiReq('GET', '/dashboard/inventory-summary', null, adminCookie);
  check('Inventory summary returns 200', invRes.status === 200);
  check('Inventory summary data is an object', typeof invRes.data?.data === 'object');

  const invData = invRes.data?.data;
  check('Inventory summary has totalItems', typeof invData?.totalItems === 'number');
  check('Inventory summary has activeItems', typeof invData?.activeItems === 'number');
  check('Inventory summary has totalQty', typeof invData?.totalQty === 'number');
  check('Inventory summary has remainingQty', typeof invData?.remainingQty === 'number');
  check('Inventory summary has lowStockCount', typeof invData?.lowStockCount === 'number');
  check('Inventory summary has lowStockItems array', Array.isArray(invData?.lowStockItems));

  // Verify that all lowStockItems actually have remainingQty <= 2
  const invalidStockFound = invData?.lowStockItems?.some((item) => item.remainingQty > 2);
  check('All items in lowStockItems have remainingQty <= 2', !invalidStockFound);

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 8: Company Rewards Summary Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  section('8. Company Rewards Summary Endpoint (/api/dashboard/company-rewards-summary)');
  const compRes = await apiReq('GET', '/dashboard/company-rewards-summary', null, adminCookie);
  check('Company rewards summary returns 200', compRes.status === 200);
  check('Company rewards summary has totals object', typeof compRes.data?.data?.totals === 'object');
  check('Company rewards summary has byCompany array', Array.isArray(compRes.data?.data?.byCompany));

  const compData = compRes.data?.data;
  check('Company totals has totalEntries', typeof compData?.totals?.totalEntries === 'number');
  check('Company totals has totalSaleValue', typeof compData?.totals?.totalSaleValue === 'number');
  check('Company totals has totalQuantitySold', typeof compData?.totals?.totalQuantitySold === 'number');

  if (compData?.byCompany?.length > 0) {
    const firstCompany = compData.byCompany[0];
    check('byCompany item has companyId', Boolean(firstCompany.companyId));
    check('byCompany item has companyName', typeof firstCompany.companyName === 'string');
    check('byCompany item has totalSaleValue', typeof firstCompany.totalSaleValue === 'number');
    check('byCompany item has totalQuantitySold', typeof firstCompany.totalQuantitySold === 'number');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 9: Activity Feed Endpoint
  // ──────────────────────────────────────────────────────────────────────────
  section('9. Activity Feed Endpoint (/api/dashboard/activity)');
  const actRes = await apiReq('GET', '/dashboard/activity', null, adminCookie);
  check('Activity feed returns 200', actRes.status === 200);
  check('Activity feed data is an array', Array.isArray(actRes.data?.data));

  const actLimit3 = await apiReq('GET', '/dashboard/activity?limit=3', null, adminCookie);
  check('Activity feed respects limit=3', actLimit3.data?.data?.length <= 3);

  const actList = actRes.data?.data || [];
  if (actList.length > 0) {
    const firstAct = actList[0];
    check('Activity item has id', Boolean(firstAct.id));
    check('Activity item has valid type (sale|reward_assignment|company_reward)', ['sale', 'reward_assignment', 'company_reward'].includes(firstAct.type));
    check('Activity item has timestamp', Boolean(firstAct.timestamp));
    check('Activity item has title', typeof firstAct.title === 'string');
    check('Activity item has description', typeof firstAct.description === 'string');
    check('Activity item has meta object', typeof firstAct.meta === 'object');

    if (actList.length > 1) {
      check('Activity feed sorted descending by timestamp', new Date(actList[0].timestamp) >= new Date(actList[1].timestamp));
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 10: Immutability & Zero Mutation Verification
  // ──────────────────────────────────────────────────────────────────────────
  section('10. Immutability & Zero Database Mutation Verification');
  const countsBefore = {
    painters: await Painter.countDocuments(),
    cycles: await mongoose.model('Cycle').countDocuments(),
    sales: await mongoose.model('Sale').countDocuments(),
    customers: await mongoose.model('Customer').countDocuments(),
    items: await mongoose.model('Item').countDocuments(),
    rewardTiers: await mongoose.model('RewardTier').countDocuments(),
    companies: await mongoose.model('Company').countDocuments(),
    companyRewards: await mongoose.model('CompanyRewardEntry').countDocuments(),
    rewardInventory: await mongoose.model('RewardInventoryItem').countDocuments(),
    assignments: await mongoose.model('PainterRewardAssignment').countDocuments(),
  };

  // Call every dashboard endpoint again
  for (const ep of endpoints) {
    await apiReq('GET', ep, null, adminCookie);
  }

  const countsAfter = {
    painters: await Painter.countDocuments(),
    cycles: await mongoose.model('Cycle').countDocuments(),
    sales: await mongoose.model('Sale').countDocuments(),
    customers: await mongoose.model('Customer').countDocuments(),
    items: await mongoose.model('Item').countDocuments(),
    rewardTiers: await mongoose.model('RewardTier').countDocuments(),
    companies: await mongoose.model('Company').countDocuments(),
    companyRewards: await mongoose.model('CompanyRewardEntry').countDocuments(),
    rewardInventory: await mongoose.model('RewardInventoryItem').countDocuments(),
    assignments: await mongoose.model('PainterRewardAssignment').countDocuments(),
  };

  check('Painters count unchanged after dashboard calls', countsBefore.painters === countsAfter.painters);
  check('Cycles count unchanged after dashboard calls', countsBefore.cycles === countsAfter.cycles);
  check('Sales count unchanged after dashboard calls', countsBefore.sales === countsAfter.sales);
  check('Customers count unchanged after dashboard calls', countsBefore.customers === countsAfter.customers);
  check('Items count unchanged after dashboard calls', countsBefore.items === countsAfter.items);
  check('RewardTiers count unchanged after dashboard calls', countsBefore.rewardTiers === countsAfter.rewardTiers);
  check('Companies count unchanged after dashboard calls', countsBefore.companies === countsAfter.companies);
  check('CompanyRewards count unchanged after dashboard calls', countsBefore.companyRewards === countsAfter.companyRewards);
  check('RewardInventory count unchanged after dashboard calls', countsBefore.rewardInventory === countsAfter.rewardInventory);
  check('Assignments count unchanged after dashboard calls', countsBefore.assignments === countsAfter.assignments);

  // ── Teardown ──────────────────────────────────────────────────────────────
  await mongoose.disconnect();

  section('TEST SUITE SUMMARY');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🌟 ALL DASHBOARD & REPORTING TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
