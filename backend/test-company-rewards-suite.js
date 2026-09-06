/**
 * Test Suite — Company Reward History API
 * Part 10 of Paint Shop Painter Reward Management
 *
 * Run: node test-company-rewards-suite.js
 *
 * Requires:
 *  - Backend running on http://localhost:5000
 *  - MongoDB seeded with at least one admin user
 */

import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@paintshop.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

// ── Helpers ───────────────────────────────────────────────────────────────────
let cookieHeader = '';
let testResults = [];
let passed = 0;
let failed = 0;

function request(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
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
        // Capture Set-Cookie
        if (res.headers['set-cookie']) {
          cookieHeader = res.headers['set-cookie']
            .map((c) => c.split(';')[0])
            .join('; ');
        }
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
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
    testResults.push(`  ✅ ${message}`);
  } else {
    failed++;
    testResults.push(`  ❌ FAIL: ${message}`);
  }
}

function section(name) {
  testResults.push(`\n${'─'.repeat(60)}\n📋 ${name}\n${'─'.repeat(60)}`);
}

// ── Test state ────────────────────────────────────────────────────────────────
let companyId1 = null;
let companyId2 = null;
let entryId1 = null;
let entryId2 = null;

// ── Tests ─────────────────────────────────────────────────────────────────────

async function testHealth() {
  section('Health Check');
  const res = await request('GET', '/api/health');
  assert(res.status === 200, 'GET /api/health returns 200');
  assert(res.body.status === 'ok', 'Health response has status ok');
}

async function testAuth() {
  section('Authentication');
  const res = await request('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  assert(res.status === 200, `Admin login succeeds (status ${res.status})`);
  assert(res.body.success === true, 'Login response has success: true');
  assert(res.body.user?.role === 'admin', 'Logged in user is admin');
}

async function testCreateCompanies() {
  section('Setup: Create Test Companies');

  const r1 = await request('POST', '/api/companies', { name: `TestCo Alpha ${Date.now()}` });
  assert(r1.status === 201, 'Company 1 created (201)');
  companyId1 = r1.body.data?.id;
  assert(Boolean(companyId1), 'Company 1 has an id');

  const r2 = await request('POST', '/api/companies', { name: `TestCo Beta ${Date.now()}` });
  assert(r2.status === 201, 'Company 2 created (201)');
  companyId2 = r2.body.data?.id;
  assert(Boolean(companyId2), 'Company 2 has an id');
}

async function testCreateRewardEntry() {
  section('POST /api/company-rewards — Create');

  // Valid entry
  const payload = {
    companyId: companyId1,
    dateFrom: '2026-01-01',
    dateTo: '2026-04-30',
    quantitySold: 1250,
    saleValue: 2000000,
    rewardReceivedDescription: '20 Smart TVs',
    rewardItems: [
      { name: 'Samsung 43" TV', quantity: 15 },
      { name: 'LG 32" TV', quantity: 5 },
    ],
  };
  const res = await request('POST', '/api/company-rewards', payload);
  assert(res.status === 201, `Valid entry created (got ${res.status})`);
  assert(res.body.success === true, 'Response success: true');
  assert(Boolean(res.body.data?.id), 'Response has entry id');
  assert(res.body.data?.company?.name !== undefined, 'Response includes company.name');
  assert(res.body.data?.quantitySold === 1250, 'quantitySold stored correctly');
  assert(res.body.data?.saleValue === 2000000, 'saleValue stored correctly');
  assert(res.body.data?.rewardItems?.length === 2, 'rewardItems array has 2 items');
  entryId1 = res.body.data?.id;

  // Second entry for the same company — non-overlapping
  const res2 = await request('POST', '/api/company-rewards', {
    companyId: companyId1,
    dateFrom: '2026-05-01',
    dateTo: '2026-08-31',
    quantitySold: 800,
    saleValue: 1500000,
    rewardReceivedDescription: '5 Refrigerators',
    rewardItems: [],
  });
  assert(res2.status === 201, 'Non-overlapping second entry created (201)');
  entryId2 = res2.body.data?.id;
}

async function testCreateValidation() {
  section('POST /api/company-rewards — Validation');

  // Missing companyId
  const r1 = await request('POST', '/api/company-rewards', {
    dateFrom: '2026-01-01', dateTo: '2026-04-30',
    quantitySold: 100, saleValue: 50000,
    rewardReceivedDescription: 'Some reward',
  });
  assert(r1.status === 400, 'Missing companyId → 400');

  // Invalid companyId format
  const r2 = await request('POST', '/api/company-rewards', {
    companyId: 'not-a-valid-id',
    dateFrom: '2026-01-01', dateTo: '2026-04-30',
    quantitySold: 100, saleValue: 50000,
    rewardReceivedDescription: 'Some reward',
  });
  assert(r2.status === 400, 'Invalid companyId format → 400');

  // Non-existent companyId
  const r3 = await request('POST', '/api/company-rewards', {
    companyId: '507f1f77bcf86cd799439011',
    dateFrom: '2026-01-01', dateTo: '2026-04-30',
    quantitySold: 100, saleValue: 50000,
    rewardReceivedDescription: 'Some reward',
  });
  assert(r3.status === 404, 'Non-existent companyId → 404');

  // dateFrom after dateTo
  const r4 = await request('POST', '/api/company-rewards', {
    companyId: companyId1,
    dateFrom: '2026-05-01',
    dateTo: '2026-01-01',
    quantitySold: 100, saleValue: 50000,
    rewardReceivedDescription: 'Some reward',
  });
  assert(r4.status === 400, 'dateFrom after dateTo → 400');

  // Missing dateFrom
  const r5 = await request('POST', '/api/company-rewards', {
    companyId: companyId1,
    dateTo: '2026-04-30',
    quantitySold: 100, saleValue: 50000,
    rewardReceivedDescription: 'Some reward',
  });
  assert(r5.status === 400, 'Missing dateFrom → 400');

  // Negative quantitySold
  const r6 = await request('POST', '/api/company-rewards', {
    companyId: companyId2,
    dateFrom: '2026-01-01', dateTo: '2026-04-30',
    quantitySold: -10, saleValue: 50000,
    rewardReceivedDescription: 'Some reward',
  });
  assert(r6.status === 400, 'Negative quantitySold → 400');

  // Negative saleValue
  const r7 = await request('POST', '/api/company-rewards', {
    companyId: companyId2,
    dateFrom: '2026-01-01', dateTo: '2026-04-30',
    quantitySold: 100, saleValue: -1,
    rewardReceivedDescription: 'Some reward',
  });
  assert(r7.status === 400, 'Negative saleValue → 400');

  // Missing reward description
  const r8 = await request('POST', '/api/company-rewards', {
    companyId: companyId2,
    dateFrom: '2026-01-01', dateTo: '2026-04-30',
    quantitySold: 100, saleValue: 50000,
    rewardReceivedDescription: '',
  });
  assert(r8.status === 400, 'Empty rewardReceivedDescription → 400');

  // Blank description (spaces only)
  const r9 = await request('POST', '/api/company-rewards', {
    companyId: companyId2,
    dateFrom: '2026-01-01', dateTo: '2026-04-30',
    quantitySold: 100, saleValue: 50000,
    rewardReceivedDescription: '   ',
  });
  assert(r9.status === 400, 'Whitespace-only description → 400');

  // Reward item with empty name
  const r10 = await request('POST', '/api/company-rewards', {
    companyId: companyId2,
    dateFrom: '2026-01-01', dateTo: '2026-04-30',
    quantitySold: 100, saleValue: 50000,
    rewardReceivedDescription: 'Some reward',
    rewardItems: [{ name: '', quantity: 1 }],
  });
  assert(r10.status === 400, 'Reward item with empty name → 400');

  // Reward item with quantity < 1
  const r11 = await request('POST', '/api/company-rewards', {
    companyId: companyId2,
    dateFrom: '2026-01-01', dateTo: '2026-04-30',
    quantitySold: 100, saleValue: 50000,
    rewardReceivedDescription: 'Some reward',
    rewardItems: [{ name: 'TV', quantity: 0 }],
  });
  assert(r11.status === 400, 'Reward item with quantity 0 → 400');
}

async function testOverlapDetection() {
  section('POST /api/company-rewards — Overlap Detection');

  // Same company exact overlap
  const r1 = await request('POST', '/api/company-rewards', {
    companyId: companyId1,
    dateFrom: '2026-01-01',
    dateTo: '2026-04-30',
    quantitySold: 100,
    saleValue: 50000,
    rewardReceivedDescription: 'Duplicate period',
  });
  assert(r1.status === 409, 'Exact period overlap for same company → 409');
  assert(
    typeof r1.body.message === 'string' && r1.body.message.includes('already exists'),
    'Overlap error message mentions "already exists"'
  );

  // Partial overlap (start inside existing period)
  const r2 = await request('POST', '/api/company-rewards', {
    companyId: companyId1,
    dateFrom: '2026-03-01',
    dateTo: '2026-06-30',
    quantitySold: 100,
    saleValue: 50000,
    rewardReceivedDescription: 'Partial overlap',
  });
  assert(r2.status === 409, 'Partial period overlap → 409');

  // Different company, same period — MUST be allowed
  const r3 = await request('POST', '/api/company-rewards', {
    companyId: companyId2,
    dateFrom: '2026-01-01',
    dateTo: '2026-04-30',
    quantitySold: 500,
    saleValue: 800000,
    rewardReceivedDescription: '10 ACs from Beta company',
    rewardItems: [{ name: 'Samsung AC', quantity: 10 }],
  });
  assert(r3.status === 201, 'Same period for DIFFERENT company → 201 (allowed)');
}

async function testGetList() {
  section('GET /api/company-rewards — List & Pagination');

  const r1 = await request('GET', '/api/company-rewards');
  assert(r1.status === 200, 'GET list returns 200');
  assert(Array.isArray(r1.body.data), 'Response data is array');
  assert(typeof r1.body.pagination === 'object', 'Response includes pagination');
  assert(typeof r1.body.summary === 'object', 'Response includes summary');
  assert(r1.body.summary.totalEntries >= 3, 'Summary totalEntries >= 3');
  assert(typeof r1.body.summary.totalSaleValue === 'number', 'summary.totalSaleValue is number');

  // Pagination
  const r2 = await request('GET', '/api/company-rewards?page=1&limit=2');
  assert(r2.status === 200, 'Pagination page=1 limit=2 returns 200');
  assert(r2.body.data.length <= 2, 'Pagination respects limit=2');
  assert(r2.body.pagination.limit === 2, 'pagination.limit is 2');

  // Company filter
  const r3 = await request('GET', `/api/company-rewards?companyId=${companyId1}`);
  assert(r3.status === 200, 'Company filter returns 200');
  assert(
    r3.body.data.every((e) => e.company?.id === companyId1 || e.companyId === companyId1),
    'All results belong to filtered company'
  );

  // Invalid companyId filter
  const r4 = await request('GET', '/api/company-rewards?companyId=badid');
  assert(r4.status === 400, 'Invalid companyId filter → 400');

  // Search by reward description
  const r5 = await request('GET', '/api/company-rewards?search=Smart+TVs');
  assert(r5.status === 200, 'Search by reward description returns 200');
  assert(r5.body.data.length >= 1, 'Search returns at least 1 result');
}

async function testGetById() {
  section('GET /api/company-rewards/:id — Single Entry');

  const r1 = await request('GET', `/api/company-rewards/${entryId1}`);
  assert(r1.status === 200, 'GET by valid id returns 200');
  assert(r1.body.data?.id === entryId1, 'Returned entry id matches');
  assert(r1.body.data?.company?.name !== undefined, 'Returned entry includes company.name');
  assert(Array.isArray(r1.body.data?.rewardItems), 'rewardItems is array');

  // Bad ID format
  const r2 = await request('GET', '/api/company-rewards/not-an-id');
  assert(r2.status === 400, 'Bad id format → 400');

  // Non-existent ID
  const r3 = await request('GET', '/api/company-rewards/507f1f77bcf86cd799439011');
  assert(r3.status === 404, 'Non-existent id → 404');
}

async function testUpdateEntry() {
  section('PATCH /api/company-rewards/:id — Update');

  // Update description and quantity
  const r1 = await request('PATCH', `/api/company-rewards/${entryId1}`, {
    rewardReceivedDescription: '20 Smart TVs + 2 Laptops',
    quantitySold: 1300,
  });
  assert(r1.status === 200, 'PATCH valid update returns 200');
  assert(r1.body.data?.rewardReceivedDescription === '20 Smart TVs + 2 Laptops', 'Description updated');
  assert(r1.body.data?.quantitySold === 1300, 'quantitySold updated');

  // Update reward items
  const r2 = await request('PATCH', `/api/company-rewards/${entryId1}`, {
    rewardItems: [{ name: 'Updated TV', quantity: 20 }],
  });
  assert(r2.status === 200, 'PATCH rewardItems returns 200');
  assert(r2.body.data?.rewardItems?.length === 1, 'rewardItems replaced correctly');
  assert(r2.body.data?.rewardItems[0].name === 'Updated TV', 'New item name saved');

  // Update saleValue
  const r3 = await request('PATCH', `/api/company-rewards/${entryId1}`, {
    saleValue: 2500000,
  });
  assert(r3.status === 200, 'PATCH saleValue returns 200');
  assert(r3.body.data?.saleValue === 2500000, 'saleValue updated correctly');
}

async function testUpdateValidation() {
  section('PATCH /api/company-rewards/:id — Validation');

  // dateFrom after dateTo on update
  const r1 = await request('PATCH', `/api/company-rewards/${entryId1}`, {
    dateFrom: '2026-12-01',
    dateTo: '2026-01-01',
  });
  assert(r1.status === 400, 'PATCH dateFrom > dateTo → 400');

  // Invalid companyId
  const r2 = await request('PATCH', `/api/company-rewards/${entryId1}`, {
    companyId: 'bad-id',
  });
  assert(r2.status === 400, 'PATCH invalid companyId → 400');

  // Blank description
  const r3 = await request('PATCH', `/api/company-rewards/${entryId1}`, {
    rewardReceivedDescription: '   ',
  });
  assert(r3.status === 400, 'PATCH blank description → 400');

  // Bad id format
  const r4 = await request('PATCH', '/api/company-rewards/badid', {
    quantitySold: 10,
  });
  assert(r4.status === 400, 'PATCH bad id format → 400');

  // Non-existent id
  const r5 = await request('PATCH', '/api/company-rewards/507f1f77bcf86cd799439011', {
    quantitySold: 10,
  });
  assert(r5.status === 404, 'PATCH non-existent id → 404');
}

async function testUpdateOverlapDetection() {
  section('PATCH /api/company-rewards/:id — Overlap on Update');

  // Try to move entry2 into entry1's period (both under companyId1)
  const r1 = await request('PATCH', `/api/company-rewards/${entryId2}`, {
    dateFrom: '2026-02-01',
    dateTo: '2026-06-01',
  });
  assert(r1.status === 409, 'Moving dates into overlapping range → 409');

  // Self-overlap must NOT trigger (updating same record with same dates)
  const current = await request('GET', `/api/company-rewards/${entryId2}`);
  const r2 = await request('PATCH', `/api/company-rewards/${entryId2}`, {
    dateFrom: current.body.data.dateFrom?.slice(0, 10),
    dateTo: current.body.data.dateTo?.slice(0, 10),
    rewardReceivedDescription: 'Same period update is fine',
  });
  assert(r2.status === 200, 'Self-update with same dates does NOT trigger overlap (200)');
}

async function testDeactivatedCompanyCreation() {
  section('Deactivated Company — Create Entry Blocked');

  // Deactivate company2
  await request('PATCH', `/api/companies/${companyId2}/deactivate`);

  // Try to create entry for deactivated company
  const r = await request('POST', '/api/company-rewards', {
    companyId: companyId2,
    dateFrom: '2026-09-01',
    dateTo: '2026-12-31',
    quantitySold: 100,
    saleValue: 50000,
    rewardReceivedDescription: 'Blocked by deactivation',
  });
  assert(r.status === 400, 'Creating entry for deactivated company → 400');
  assert(
    r.body.message?.toLowerCase().includes('deactivated'),
    'Error message mentions "deactivated"'
  );

  // Reactivate for cleanup
  await request('PATCH', `/api/companies/${companyId2}/activate`);
}

async function testNoDeleteEndpoint() {
  section('No DELETE Endpoint');

  const r = await request('DELETE', `/api/company-rewards/${entryId1}`);
  assert(r.status === 404 || r.status === 405, 'DELETE endpoint does not exist (404 or 405)');
}

async function testUnauthenticatedAccess() {
  section('Authentication Guard');

  // Store and clear cookie
  const savedCookie = cookieHeader;
  cookieHeader = '';

  const r1 = await request('GET', '/api/company-rewards');
  assert(r1.status === 401, 'GET without auth → 401');

  const r2 = await request('POST', '/api/company-rewards', {});
  assert(r2.status === 401, 'POST without auth → 401');

  const r3 = await request('PATCH', `/api/company-rewards/${entryId1}`, {});
  assert(r3.status === 401, 'PATCH without auth → 401');

  // Restore cookie
  cookieHeader = savedCookie;
}

// ── Runner ────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🎨 Company Reward History — Test Suite (Part 10)\n');

  try {
    await testHealth();
    await testAuth();
    await testCreateCompanies();
    await testCreateRewardEntry();
    await testCreateValidation();
    await testOverlapDetection();
    await testGetList();
    await testGetById();
    await testUpdateEntry();
    await testUpdateValidation();
    await testUpdateOverlapDetection();
    await testDeactivatedCompanyCreation();
    await testNoDeleteEndpoint();
    await testUnauthenticatedAccess();
  } catch (err) {
    console.error('\n💥 Test runner error:', err.message);
    process.exitCode = 1;
  }

  console.log(testResults.join('\n'));

  const total = passed + failed;
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🏁 Results: ${passed}/${total} passed, ${failed} failed`);
  console.log(`${'═'.repeat(60)}\n`);

  if (failed > 0) process.exitCode = 1;
}

run();
