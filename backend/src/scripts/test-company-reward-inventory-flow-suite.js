/**
 * Test Suite — Company Reward to Inventory End-to-End Flow (Part 14 Request 7)
 * Paint Shop Painter Reward Management Platform
 *
 * Tests the complete flow:
 * COMPANY REWARD RECEIVED
 *         ↓
 * REWARD INVENTORY (Auto-synced, idempotent)
 *         ↓
 * REWARD TIER SUGGESTION (Picks actual inventory item)
 *         ↓
 * PAINTER REWARD ASSIGNMENT (Validates stock & decrements atomically)
 *         ↓
 * INVENTORY STOCK DECREASES
 *         ↓
 * ASSIGNMENT HISTORY & SAFE COMPANY REWARD UPDATES
 *
 * Run: node src/scripts/test-company-reward-inventory-flow-suite.js
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@paintshop.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

let cookieHeader = '';
let passed = 0;
let failed = 0;

function request(method, pathUrl, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathUrl, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...extraHeaders,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.headers['set-cookie']) {
          cookieHeader = res.headers['set-cookie']
            .map((c) => c.split(';')[0])
            .join('; ');
        }
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, message, details = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

function section(name) {
  console.log(`\n────────────────────────────────────────────────────────────\n📋 ${name}\n────────────────────────────────────────────────────────────`);
}

async function run() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  Company Reward → Inventory End-to-End Business Flow Suite');
  console.log('══════════════════════════════════════════════════════════════\n');

  // 1. Health & Auth
  section('1. Health & Admin Login');
  const healthRes = await request('GET', '/api/health');
  assert(healthRes.status === 200, 'Server health check returns 200 ok');

  const loginRes = await request('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  assert(loginRes.status === 200 && loginRes.body.user?.role === 'admin', 'Admin login succeeds');

  // 2. Setup Active Cycle and Painter
  section('2. Setup Active Cycle & Active Painter');
  let cycleRes = await request('GET', '/api/cycles');
  let activeCycle = cycleRes.body?.activeCycle;
  if (!activeCycle) {
    const now = new Date();
    const cRes = await request('POST', '/api/cycles', {
      startDate: now.toISOString(),
      endDate: new Date(now.getTime() + 10 * 3600000).toISOString(),
      isActive: true,
    });
    activeCycle = cRes.body?.data;
  }
  assert(Boolean(activeCycle), 'Active cycle available for tests');

  const paintersRes = await request('GET', '/api/painters?status=active');
  let testPainter = paintersRes.body?.painters?.[0];
  if (!testPainter) {
    const pCreate = await request('POST', '/api/painters', {
      name: 'Flow Test Painter',
      mobile: '9888877777',
      password: 'password123',
    });
    testPainter = pCreate.body?.data || pCreate.body?.painter;
  }
  assert(Boolean(testPainter), 'Active painter available for tests');

  // 3. TEST 1: Create Company (Panasonic)
  section('3. TEST 1: Create Company');
  const companyName = `Panasonic Flow Test ${Date.now()}`;
  const compRes = await request('POST', '/api/companies', { name: companyName });
  const company = compRes.body?.data;
  assert(compRes.status === 201 && Boolean(company?.id), 'Company created successfully');

  // 4. TEST 2: Create Company Reward Entry (Panasonic TV × 10)
  section('4. TEST 2: Create Company Reward Entry');
  const entryRes = await request('POST', '/api/company-rewards', {
    companyId: company.id,
    dateFrom: '2026-09-01',
    dateTo: '2026-09-30',
    quantitySold: 500,
    saleValue: 1000000,
    rewardItems: [{ name: 'Panasonic 43" Smart TV', quantity: 10, imageUrl: 'https://example.com/tv.jpg' }],
  });
  const companyRewardEntry = entryRes.body?.data;
  assert(entryRes.status === 201 && Boolean(companyRewardEntry?.id), 'Company reward entry created (201)');

  // 5. TEST 3: Verify Reward Inventory (Panasonic TV Total = 10, Remaining = 10)
  section('5. TEST 3: Verify Auto-Synced Reward Inventory');
  const invRes = await request('GET', `/api/reward-inventory?companyId=${company.id}`);
  assert(invRes.status === 200, 'GET /api/reward-inventory returns 200');
  const invItems = invRes.body?.data || [];
  const tvInventoryItem = invItems.find((i) => i.name.includes('Panasonic 43" Smart TV'));
  assert(Boolean(tvInventoryItem), 'Panasonic TV exists in Reward Inventory');
  assert(tvInventoryItem?.totalQty === 10, 'Total quantity is 10');
  assert(tvInventoryItem?.remainingQty === 10, 'Remaining quantity is 10');
  assert(tvInventoryItem?.assignedQty === 0, 'Assigned quantity is 0');
  assert(tvInventoryItem?.status === 'active', 'Inventory item is active');

  // 6. TEST 4: Reload / list inventory: verify still Total = 10, Remaining = 10 (Idempotency)
  section('6. TEST 4: Reload Inventory to Verify Idempotency (No Duplicates)');
  const invReloadRes = await request('GET', `/api/reward-inventory?companyId=${company.id}`);
  const reloadedItems = invReloadRes.body?.data || [];
  assert(reloadedItems.length === 1, 'Exactly 1 inventory record exists for company (no duplicates)');
  assert(reloadedItems[0].totalQty === 10 && reloadedItems[0].remainingQty === 10, 'Quantities remain 10/10');

  // 7. TEST 5: Create Reward Tier: High non-overlapping range, Suggested reward = Panasonic TV
  section('7. TEST 5: Create Reward Tier with Inventory Item');
  const existingTiersRes = await request('GET', '/api/reward-tiers?limit=100');
  const existingTiers = existingTiersRes.body?.data || [];
  const maxExisting = existingTiers.reduce((max, t) => Math.max(max, t.maxPoints || 0), 0);
  const uniqueMin = maxExisting + 100;
  const uniqueMax = uniqueMin + 100;
  const tierRes = await request('POST', '/api/reward-tiers', {
    minPoints: uniqueMin,
    maxPoints: uniqueMax,
    suggestedRewardName: 'Panasonic 43" Smart TV',
    suggestedInventoryItemId: tvInventoryItem.id,
  });
  const rewardTier = tierRes.body?.data;
  assert(tierRes.status === 201 && Boolean(rewardTier?.id), 'Reward tier created with inventory item (201)');
  const tierInvId = rewardTier?.suggestedInventoryItemId?._id || rewardTier?.suggestedInventoryItemId?.id || rewardTier?.suggestedInventoryItemId;
  assert(String(tierInvId) === String(tvInventoryItem.id || tvInventoryItem._id), 'Tier references suggestedInventoryItemId');

  // Verify inventory stock was NOT decremented by tier creation
  const invAfterTier = await request('GET', `/api/reward-inventory/${tvInventoryItem.id}`);
  assert(invAfterTier.body?.data?.totalQty === 10, 'Inventory totalQty still 10 after tier creation');
  assert(invAfterTier.body?.data?.remainingQty === 10, 'Inventory remainingQty still 10 after tier creation');

  // 8. TEST 6: Painter Reward Eligibility
  section('8. TEST 6: Painter Reward Eligibility Check');
  const eligRes = await request('GET', `/api/painter-reward-assignments/eligibility/${testPainter.id}`);
  assert(eligRes.status === 200, 'Painter eligibility returns 200');
  const availableItems = eligRes.body?.data?.suggestedInventoryItems;
  assert(Array.isArray(availableItems), 'Eligibility contains available inventory items');

  // 9. TEST 7: Assign Panasonic TV × 1 -> Inventory Remaining becomes 9
  section('9. TEST 7: Assign Reward to Painter');
  const assignRes = await request('POST', '/api/painter-reward-assignments', {
    painterId: testPainter.id,
    cycleId: activeCycle.id || activeCycle._id,
    rewardInventoryItemId: tvInventoryItem.id,
    qty: 1,
    notes: 'End-to-End Flow Test Assignment',
  });
  const createdAssignment = assignRes.body?.data?.assignment;
  const inventoryAfter = assignRes.body?.data?.inventoryAfter;
  assert(assignRes.status === 201, 'Reward assigned successfully (201)');
  assert(createdAssignment?.qty === 1, 'Assigned quantity is 1');
  assert(inventoryAfter?.remainingQty === 9, 'inventoryAfter shows remainingQty 9');

  const invAfterAssign = await request('GET', `/api/reward-inventory/${tvInventoryItem.id}`);
  assert(invAfterAssign.body?.data?.totalQty === 10, 'Total quantity remains 10');
  assert(invAfterAssign.body?.data?.remainingQty === 9, 'Remaining quantity decreased to 9');
  assert(invAfterAssign.body?.data?.assignedQty === 1, 'Assigned quantity increased to 1');

  // 10. TEST 8: Assignment History Verification
  section('10. TEST 8: Assignment History Verification');
  const historyRes = await request('GET', `/api/painter-reward-assignments?painterId=${testPainter.id}`);
  assert(historyRes.status === 200, 'Assignment history returns 200');
  const assignments = historyRes.body?.data?.assignments || [];
  const myAssignment = assignments.find((a) => a.id === createdAssignment?.id || a._id === createdAssignment?._id);
  assert(Boolean(myAssignment), 'Assignment appears in history');
  assert(myAssignment?.rewardName === 'Panasonic 43" Smart TV', 'Snapshot rewardName is preserved');
  assert(Boolean(myAssignment?.painterName), 'Snapshot painterName is preserved');

  // 11. TEST 9: Edit Company Reward from 10 -> 15 (Total = 15, Remaining = 14)
  section('11. TEST 9: Edit Company Reward to Increase Quantity');
  const updateRes = await request('PATCH', `/api/company-rewards/${companyRewardEntry.id}`, {
    rewardItems: [{ _id: companyRewardEntry.rewardItems[0]._id, name: 'Panasonic 43" Smart TV', quantity: 15 }],
  });
  assert(updateRes.status === 200, 'Company reward updated to 15 (200)');

  const invAfterIncrease = await request('GET', `/api/reward-inventory/${tvInventoryItem.id}`);
  assert(invAfterIncrease.body?.data?.totalQty === 15, 'Inventory totalQty increased to 15');
  assert(invAfterIncrease.body?.data?.assignedQty === 1, 'Inventory assignedQty remains 1');
  assert(invAfterIncrease.body?.data?.remainingQty === 14, 'Inventory remainingQty is 14 (15 - 1)');

  // 12. TEST 10: Try reducing company reward below assigned quantity (15 -> 0) -> Must reject!
  section('12. TEST 10: Safe Edit Protection (Reject Reduction Below Assigned)');
  const rejectUpdate = await request('PATCH', `/api/company-rewards/${companyRewardEntry.id}`, {
    rewardItems: [{ _id: companyRewardEntry.rewardItems[0]._id, name: 'Panasonic 43" Smart TV', quantity: 0 }],
  });
  assert(rejectUpdate.status === 400, 'Quantity 0 rejected with 400');

  const rejectUpdateBelow = await request('PATCH', `/api/company-rewards/${companyRewardEntry.id}`, {
    rewardItems: [{ _id: companyRewardEntry.rewardItems[0]._id, name: 'Panasonic 43" Smart TV', quantity: 0 }],
  });
  assert(rejectUpdateBelow.status === 400, 'Reducing quantity below assigned units rejected with 400');

  // 13. TEST 11: Try assigning 20 when only 14 remain -> Must reject!
  section('13. TEST 11: Over-Allocation Protection on Assignment');
  const excessAssign = await request('POST', '/api/painter-reward-assignments', {
    painterId: testPainter.id,
    cycleId: activeCycle.id || activeCycle._id,
    rewardInventoryItemId: tvInventoryItem.id,
    qty: 20,
  });
  assert(excessAssign.status === 400, 'Assigning quantity greater than remaining stock rejected with 400');

  // 14. TEST 12: Multiple Reward Products in Single Company Reward Entry
  section('14. TEST 12: Multiple Reward Products in Single Entry');
  const multiCompRes = await request('POST', '/api/companies', { name: `Multi Comp ${Date.now()}` });
  const multiComp = multiCompRes.body?.data;

  const multiEntryRes = await request('POST', '/api/company-rewards', {
    companyId: multiComp.id,
    dateFrom: '2026-09-01',
    dateTo: '2026-09-30',
    quantitySold: 1000,
    saleValue: 2000000,
    rewardItems: [
      { name: 'Panasonic TV', quantity: 10 },
      { name: 'Refrigerator', quantity: 5 },
      { name: 'Laptop', quantity: 3 },
    ],
  });
  assert(multiEntryRes.status === 201, 'Company reward with 3 products created (201)');

  const multiInvRes = await request('GET', `/api/reward-inventory?companyId=${multiComp.id}`);
  const multiInvItems = multiInvRes.body?.data || [];
  assert(multiInvItems.length === 3, 'Exactly 3 separate inventory items created');

  const multiTV = multiInvItems.find((i) => i.name === 'Panasonic TV');
  const multiFridge = multiInvItems.find((i) => i.name === 'Refrigerator');
  const multiLaptop = multiInvItems.find((i) => i.name === 'Laptop');

  assert(multiTV?.remainingQty === 10, 'Panasonic TV has 10 remaining');
  assert(multiFridge?.remainingQty === 5, 'Refrigerator has 5 remaining');
  assert(multiLaptop?.remainingQty === 3, 'Laptop has 3 remaining');

  // Assign 2 Panasonic TVs
  const multiAssignRes = await request('POST', '/api/painter-reward-assignments', {
    painterId: testPainter.id,
    cycleId: activeCycle.id || activeCycle._id,
    rewardInventoryItemId: multiTV.id,
    qty: 2,
  });
  assert(multiAssignRes.status === 201, 'Assigned 2 Panasonic TVs');

  // Verify no cross-contamination
  const checkTV = (await request('GET', `/api/reward-inventory/${multiTV.id}`)).body?.data;
  const checkFridge = (await request('GET', `/api/reward-inventory/${multiFridge.id}`)).body?.data;
  const checkLaptop = (await request('GET', `/api/reward-inventory/${multiLaptop.id}`)).body?.data;

  assert(checkTV?.remainingQty === 8, 'TV remaining is 8 (10 - 2)');
  assert(checkFridge?.remainingQty === 5, 'Refrigerator remaining unchanged at 5');
  assert(checkLaptop?.remainingQty === 3, 'Laptop remaining unchanged at 3');

  // 15. Final Summary
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`🏁 Flow Suite Results: ${passed}/${passed + failed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
