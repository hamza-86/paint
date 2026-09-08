/**
 * Test Suite — Reward Inventory API (Part 11)
 * Paint Shop Painter Reward Management
 *
 * Run: node src/scripts/test-reward-inventory-suite.js
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getTestMongoUri } from '../config/testDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

// Models for baseline safety checks
import CompanyRewardEntry from '../models/CompanyRewardEntry.js';
import Sale from '../models/Sale.js';
import Painter from '../models/Painter.js';
import Cycle from '../models/Cycle.js';
import RewardTier from '../models/RewardTier.js';
import RewardInventoryItem from '../models/RewardInventoryItem.js';

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@paintshop.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

let cookieHeader = '';
let testResults = [];
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
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(condition, message) {
  if (condition) {
    passed++;
    testResults.push(`  ✅ PASS: ${message}`);
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failed++;
    testResults.push(`  ❌ FAIL: ${message}`);
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function section(name) {
  console.log(`\n${'─'.repeat(60)}\n📋 ${name}\n${'─'.repeat(60)}`);
  testResults.push(`\n${'─'.repeat(60)}\n📋 ${name}\n${'─'.repeat(60)}`);
}

// State across tests
let testCompanyId = null;
let testSourceEntryId = null;
let testRewardItemTV = null;
let testRewardItemWatch = null;
let inventoryItemId1 = null;
let inventoryItemId2 = null;
let painterCookieHeader = '';

async function run() {
  console.log('==================================================');
  console.log('   PART 11 — REWARD INVENTORY TEST SUITE          ');
  console.log('==================================================\n');

  await mongoose.connect(getTestMongoUri());

  // Baseline counts for data safety
  const baselineSales = await Sale.countDocuments();
  const baselinePainters = await Painter.countDocuments();
  const baselineCycles = await Cycle.countDocuments();
  const baselineTiers = await RewardTier.countDocuments();
  const baselineCompanyRewards = await CompanyRewardEntry.countDocuments();

  try {
    // ── 1. HEALTH & AUTH ────────────────────────────────────────────────────────
    section('1. Health & Admin Login');

    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200 && healthRes.body.status === 'ok', 'Server health check returns 200 ok');

    const loginRes = await request('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    assert(loginRes.status === 200 && loginRes.body.user?.role === 'admin', 'Admin login succeeds with admin role');

    // Create a painter for role testing
    const testPainterEmail = `painter.inv.${Date.now()}@test.com`;
    const painterDoc = await Painter.create({
      firstName: 'InventoryTester',
      lastName: 'Painter',
      mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: testPainterEmail,
      password: 'Painter@123456',
      status: 'active',
    });

    const painterLogin = await request('POST', '/api/auth/login', {
      email: testPainterEmail,
      password: 'Painter@123456',
    });
    assert(painterLogin.status === 200 && painterLogin.body.user?.role === 'painter', 'Painter login succeeds');
    if (painterLogin.headers['set-cookie']) {
      painterCookieHeader = painterLogin.headers['set-cookie']
        .map((c) => c.split(';')[0])
        .join('; ');
    }

    // Re-login as Admin to reset cookieHeader
    await request('POST', '/api/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    // ── 2. ROLE AUTHORIZATION GUARDS ───────────────────────────────────────────
    section('2. Role Authorization Guards');

    const pGet = await request('GET', '/api/reward-inventory', null, { Cookie: painterCookieHeader });
    assert(pGet.status === 403, 'Painter GET /api/reward-inventory returns 403 Forbidden');

    const pPost = await request('POST', '/api/reward-inventory', {}, { Cookie: painterCookieHeader });
    assert(pPost.status === 403, 'Painter POST /api/reward-inventory returns 403 Forbidden');

    const pPatch = await request('PATCH', '/api/reward-inventory/507f1f77bcf86cd799439011', {}, { Cookie: painterCookieHeader });
    assert(pPatch.status === 403, 'Painter PATCH /api/reward-inventory/:id returns 403 Forbidden');

    const noAuthGet = await request('GET', '/api/reward-inventory', null, { Cookie: '' });
    assert(noAuthGet.status === 401, 'Unauthenticated GET /api/reward-inventory returns 401');

    const noAuthPost = await request('POST', '/api/reward-inventory', {}, { Cookie: '' });
    assert(noAuthPost.status === 401, 'Unauthenticated POST /api/reward-inventory returns 401');

    // ── 3. SETUP: Create Source Company & CompanyRewardEntry ─────────────────────
    section('3. Setup: Source Company & Reward Entry');

    const compRes = await request('POST', '/api/companies', {
      name: `Inventory Source Corp ${Date.now()}`,
      details: 'Manufacturer providing TVs and Watches',
    });
    testCompanyId = compRes.body.data?.id;
    assert(compRes.status === 201 && Boolean(testCompanyId), 'Test company created');

    const entryRes = await request('POST', '/api/company-rewards', {
      companyId: testCompanyId,
      dateFrom: '2026-01-01',
      dateTo: '2026-03-31',
      quantitySold: 500,
      saleValue: 1000000,
      rewardReceivedDescription: 'Q1 Incentive: 5 Smart TVs and 10 Smart Watches',
      rewardItems: [
        { name: 'Sony 43" Smart TV', quantity: 5, imageUrl: 'https://images.unsplash.com/photo-sony-tv' },
        { name: 'Samsung Galaxy Watch', quantity: 10, imageUrl: 'https://images.unsplash.com/photo-watch' },
      ],
    });
    testSourceEntryId = entryRes.body.data?.id;
    assert(entryRes.status === 201 && Boolean(testSourceEntryId), 'Source CompanyRewardEntry created');

    const fetchedEntry = await CompanyRewardEntry.findById(testSourceEntryId);
    testRewardItemTV = fetchedEntry.rewardItems.find((i) => i.name.includes('Smart TV'));
    testRewardItemWatch = fetchedEntry.rewardItems.find((i) => i.name.includes('Watch'));
    assert(Boolean(testRewardItemTV?._id), 'Source TV subdocument ID identified');
    assert(Boolean(testRewardItemWatch?._id), 'Source Watch subdocument ID identified');

    // ── 4. VALIDATION ON CREATION ──────────────────────────────────────────────
    section('4. Creation Validation');

    const v1 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      totalQty: 2,
    });
    assert(v1.status === 400, 'Missing sourceCompanyRewardEntryId returns 400');

    const v2 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: 'invalid-id',
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      totalQty: 2,
    });
    assert(v2.status === 400, 'Invalid sourceCompanyRewardEntryId format returns 400');

    const v3 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: '507f1f77bcf86cd799439011',
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      totalQty: 2,
    });
    assert(v3.status === 404, 'Non-existent sourceCompanyRewardEntryId returns 404');

    const v4 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      totalQty: 2,
    });
    assert(v4.status === 400, 'Missing sourceCompanyRewardItemId returns 400');

    const v5 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: 'invalid-item-id',
      totalQty: 2,
    });
    assert(v5.status === 400, 'Invalid sourceCompanyRewardItemId format returns 400');

    const v6 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: '507f1f77bcf86cd799439011',
      totalQty: 2,
    });
    assert(v6.status === 400, 'Non-matching sourceCompanyRewardItemId returns 400');

    const v7 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      totalQty: 0,
    });
    assert(v7.status === 400, 'Quantity 0 returns 400');

    const v8 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      totalQty: -3,
    });
    assert(v8.status === 400, 'Negative quantity returns 400');

    const v9 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      totalQty: 2.5,
    });
    assert(v9.status === 400, 'Non-integer quantity returns 400');

    const v10 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      totalQty: 2,
      name: '   ',
    });
    assert(v10.status === 400, 'Blank name returns 400');

    const v11 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      totalQty: 2,
      remainingQty: 5,
    });
    assert(v11.status === 400, 'remainingQty > totalQty returns 400');

    const v12 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      totalQty: 2,
      remainingQty: -1,
    });
    assert(v12.status === 400, 'Negative remainingQty returns 400');

    // ── 5. SUCCESSFUL INVENTORY CREATION ───────────────────────────────────────
    section('5. Successful Inventory Creation & Over-allocation Safety');

    // Partial creation: 3 of 5 TVs
    const c1 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      name: 'Sony 43" Smart TV - Batch A',
      totalQty: 3,
    });
    assert(c1.status === 201, 'Partial inventory created (3 of 5 TVs) -> 201');
    assert(c1.body.data?.totalQty === 3, 'Total quantity stored correctly (3)');
    assert(c1.body.data?.remainingQty === 3, 'remainingQty defaults to totalQty (3)');
    assert(c1.body.data?.assignedQty === 0, 'assignedQty is 0');
    assert(c1.body.data?.status === 'active', 'Initial status is active');
    assert(Boolean(c1.body.data?.sourceReward?.company?.name), 'Source company name populated');
    assert(c1.body.data?.sourceReward?.rewardItem?.name === testRewardItemTV.name, 'Source reward item populated');
    inventoryItemId1 = c1.body.data?.id;

    // Remaining allocation: 2 of 5 TVs
    const c2 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      name: 'Sony 43" Smart TV - Batch B',
      totalQty: 2,
    });
    assert(c2.status === 201, 'Second batch created for remaining quantity (2 of 5 TVs) -> 201');
    inventoryItemId2 = c2.body.data?.id;

    // Attempt over-allocation (now 3 + 2 = 5 TVs allocated; source has 5)
    const c3 = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemTV._id),
      name: 'Sony 43" Smart TV - Over allocate',
      totalQty: 1,
    });
    assert(c3.status === 400, 'Creation exceeding source reward quantity rejected with 400');
    assert(c3.body.message && c3.body.message.includes('exceeds available source reward quantity'), 'Error message mentions available source quantity limit');

    // Create inventory for the second item (10 Watches)
    const cWatch = await request('POST', '/api/reward-inventory', {
      sourceCompanyRewardEntryId: testSourceEntryId,
      sourceCompanyRewardItemId: String(testRewardItemWatch._id),
      totalQty: 10,
    });
    assert(cWatch.status === 201, 'Separate inventory record created for second reward item (10 Watches) -> 201');
    assert(cWatch.body.data?.totalQty === 10, 'Watch quantity stored correctly (10)');

    // ── 6. LISTING, SEARCH, AND FILTERING ──────────────────────────────────────
    section('6. Listing, Search, Pagination & Summary Metrics');

    const listRes = await request('GET', '/api/reward-inventory');
    assert(listRes.status === 200, 'GET /api/reward-inventory returns 200');
    assert(Array.isArray(listRes.body.data), 'Response data is an array');
    assert(Boolean(listRes.body.pagination), 'Pagination metadata present');
    assert(Boolean(listRes.body.summary), 'Summary object present');
    assert(listRes.body.summary?.totalInventoryItems >= 3, 'Summary totalInventoryItems >= 3');
    assert(listRes.body.summary?.totalQuantity >= 15, 'Summary totalQuantity includes all created items');

    // Search
    const searchRes = await request('GET', '/api/reward-inventory?search=Batch%20A');
    assert(searchRes.status === 200 && searchRes.body.data.length >= 1, 'Search by name returns matching item');

    // Company filter
    const compFilterRes = await request('GET', `/api/reward-inventory?companyId=${testCompanyId}`);
    assert(compFilterRes.status === 200 && compFilterRes.body.data.length >= 3, 'Company filter returns matching items');

    // Availability filter
    const availRes = await request('GET', '/api/reward-inventory?availability=available');
    assert(availRes.status === 200 && availRes.body.data.every((i) => i.remainingQty > 0), 'availability=available returns only items with remainingQty > 0');

    // ── 7. GET SINGLE ITEM ─────────────────────────────────────────────────────
    section('7. GET Single Inventory Item');

    const getSingle = await request('GET', `/api/reward-inventory/${inventoryItemId1}`);
    assert(getSingle.status === 200, 'GET by ID returns 200');
    assert(getSingle.body.data?.id === inventoryItemId1, 'Returned item ID matches');
    assert(Boolean(getSingle.body.data?.sourceReward?.company), 'Populated source reward company present');
    assert(getSingle.body.data?.totalQty === 3, 'Correct totalQty returned');

    const badId = await request('GET', '/api/reward-inventory/bad-format-id');
    assert(badId.status === 400, 'Malformed ObjectId returns 400');

    const nonExistentId = await request('GET', '/api/reward-inventory/507f1f77bcf86cd799439011');
    assert(nonExistentId.status === 404, 'Non-existent ID returns 404');

    // ── 8. UPDATES (PATCH) ─────────────────────────────────────────────────────
    section('8. Safe Updates');

    // Update metadata (name, imageUrl)
    const updateMeta = await request('PATCH', `/api/reward-inventory/${inventoryItemId1}`, {
      name: 'Sony 43" Smart TV - Batch A (Premium)',
      imageUrl: 'https://new-image.url/tv.jpg',
    });
    assert(updateMeta.status === 200, 'PATCH metadata returns 200');
    assert(updateMeta.body.data?.name === 'Sony 43" Smart TV - Batch A (Premium)', 'Name successfully updated');
    assert(updateMeta.body.data?.imageUrl === 'https://new-image.url/tv.jpg', 'Image URL successfully updated');

    // Blank name update rejected
    const updateBlankName = await request('PATCH', `/api/reward-inventory/${inventoryItemId1}`, {
      name: '   ',
    });
    assert(updateBlankName.status === 400, 'PATCH blank name returns 400');

    // Cannot increase totalQty beyond available source quantity
    // TV item 1 has totalQty=3, TV item 2 has totalQty=2. Total=5. Attempt to set item 1 to 4:
    const updateExceedSource = await request('PATCH', `/api/reward-inventory/${inventoryItemId1}`, {
      totalQty: 4,
    });
    assert(updateExceedSource.status === 400, 'PATCH increasing totalQty beyond source limit returns 400');

    // Manually set remainingQty = 1 (assigned = 2) to test reduction below assigned safety
    await RewardInventoryItem.findByIdAndUpdate(inventoryItemId1, { remainingQty: 1 });
    // Now assignedQty = 3 - 1 = 2
    const updateBelowAssigned = await request('PATCH', `/api/reward-inventory/${inventoryItemId1}`, {
      totalQty: 1, // trying to set total to 1 when 2 already assigned!
    });
    assert(updateBelowAssigned.status === 400, 'PATCH reducing totalQty below assigned returns 400');

    // Safe total reduction (e.g. reduce from 3 to 2, which matches assigned 2)
    const safeReduction = await request('PATCH', `/api/reward-inventory/${inventoryItemId1}`, {
      totalQty: 2,
    });
    assert(safeReduction.status === 200, 'Safe totalQty update within bounds returns 200');
    assert(safeReduction.body.data?.totalQty === 2, 'New totalQty is 2');
    assert(safeReduction.body.data?.remainingQty === 0, 'remainingQty updated to reflect remaining after assigned (0)');

    // ── 9. STATUS LIFECYCLE: DEACTIVATE & ACTIVATE ──────────────────────────────
    section('9. Deactivate & Reactivate Lifecycle');

    const deactRes = await request('PATCH', `/api/reward-inventory/${inventoryItemId1}/deactivate`);
    assert(deactRes.status === 200, 'Deactivate returns 200');
    assert(deactRes.body.data?.status === 'deactivated', 'Status changed to deactivated');

    // Deactivated item visible in deactivated filter
    const deactList = await request('GET', '/api/reward-inventory?status=deactivated');
    assert(deactList.status === 200 && deactList.body.data.some((i) => i.id === inventoryItemId1), 'Deactivated item appears in status=deactivated filter');

    // Reactivate
    const actRes = await request('PATCH', `/api/reward-inventory/${inventoryItemId1}/activate`);
    assert(actRes.status === 200, 'Activate returns 200');
    assert(actRes.body.data?.status === 'active', 'Status changed back to active');

    // ── 10. ZERO DELETION POLICY & DATA INTEGRITY ──────────────────────────────
    section('10. Zero Deletion Policy & Historical Integrity');

    const delRes = await request('DELETE', `/api/reward-inventory/${inventoryItemId1}`);
    assert(delRes.status === 404, 'DELETE /api/reward-inventory/:id returns 404 Not Found (zero deletion policy)');

    // Check baseline data integrity
    const endSales = await Sale.countDocuments();
    const endPainters = await Painter.countDocuments();
    const endCycles = await Cycle.countDocuments();
    const endTiers = await RewardTier.countDocuments();
    const endCompanyRewards = await CompanyRewardEntry.countDocuments();

    assert(endSales === baselineSales, 'Zero Sales modified');
    assert(endPainters === baselinePainters + 1, 'Zero existing Painter records modified (only test painter added)');
    assert(endCycles === baselineCycles, 'Zero Cycle records modified');
    assert(endTiers === baselineTiers, 'Zero RewardTier records modified');
    assert(endCompanyRewards === baselineCompanyRewards + 1, 'Zero existing CompanyRewardEntry modified (only setup entry added)');

    // Cleanup test painter
    await Painter.findByIdAndDelete(painterDoc._id);

    console.log(`\n════════════════════════════════════════════════════════════`);
    console.log(`🏁 Results: ${passed}/${passed + failed} passed, ${failed} failed`);
    console.log(`════════════════════════════════════════════════════════════\n`);

    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('💥 Test suite error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

run();
