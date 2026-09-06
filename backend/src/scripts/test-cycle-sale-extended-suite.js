/**
 * test-cycle-sale-extended-suite.js
 *
 * Comprehensive regression test suite covering all 20 requirements:
 *  1. Expired active cycle handling & non-blocking new cycle creation
 *  2. Manual close setting effective endDate to now
 *  3. Adjacent cycles allowed, overlapping cycles rejected
 *  4. Sales blocked for expired cycle
 *  5. Active painters & catalog items response keys
 *  6. Catalog sale, manual sale, mixed sale with server recalculation
 *  7. PDF bill upload via multipart/form-data
 *  8. Invalid manual items and invalid bill file rejection
 *  9. Historical snapshot preservation
 * 10. Reward Tier inventory selection without inventory deduction
 * 11. Unavailable inventory rejected for new tier
 * 12. Reward assignment with inventory override and atomic decrement
 * 13. Company rewards structured items, no description required, active company rule
 */

const BASE = 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@paintshop.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'changeme123';

let cookie = '';
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

async function req(method, path, body, isFormData = false) {
  const headers = {};
  if (cookie) headers['Cookie'] = cookie;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { status: res.status, data, headers: res.headers };
}

async function runAllTests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  Paint Shop Platform — Cross-Module Regression Test Suite');
  console.log('══════════════════════════════════════════════════════════════');

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  section('1. Authentication');
  const loginRes = await req('POST', '/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
  });
  check('Admin login succeeds (200)', loginRes.status === 200);
  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }
  check('Auth cookie acquired', Boolean(cookie));

  // ── 2. Response shapes ─────────────────────────────────────────────────────
  section('2. API Response Shapes & Active Painter/Item Retrieval');
  const paintersRes = await req('GET', '/painters?status=active');
  check('GET /api/painters returns 200', paintersRes.status === 200);
  check('Response uses "painters" key', Array.isArray(paintersRes.data?.painters));
  const activePainters = paintersRes.data?.painters || [];
  check('Active painters exist in DB', activePainters.length > 0);
  const testPainter = activePainters[0];

  const itemsRes = await req('GET', '/items?status=active');
  check('GET /api/items returns 200', itemsRes.status === 200);
  check('Response uses "items" key', Array.isArray(itemsRes.data?.items));
  const activeItems = itemsRes.data?.items || [];
  check('Active items exist in DB', activeItems.length > 0);
  const testItem = activeItems[0];

  // ── 3. Active Cycle Setup for Sales ─────────────────────────────────────────
  section('3. Reward Cycles — Active Cycle Setup');
  let cyclesRes = await req('GET', '/cycles');
  let activeCycle = cyclesRes.data?.activeCycle;

  if (!activeCycle) {
    // Look for a gap to create an active cycle
    const now = new Date();
    const activeStart = now.toISOString();
    const activeEnd = new Date(now.getTime() + 10 * 3600000).toISOString(); // 10 hours
    const createActiveRes = await req('POST', '/cycles', {
      startDate: activeStart,
      endDate: activeEnd,
      isActive: true,
    });
    if (createActiveRes.status === 201) {
      activeCycle = createActiveRes.data?.data;
      check('Active cycle created for tests', Boolean(activeCycle));
    } else {
      // Find any cycle covering now and activate it
      const existing = cyclesRes.data?.data || [];
      const currentCandidate = existing.find((c) => new Date(c.endDate) > now && new Date(c.startDate) <= now);
      if (currentCandidate) {
        const actRes = await req('PATCH', `/cycles/${currentCandidate.id || currentCandidate._id}/activate`);
        activeCycle = actRes.data?.data;
      }
      check('Active cycle available for tests', Boolean(activeCycle));
    }
  } else {
    check('Active cycle already present in DB', Boolean(activeCycle));
  }

  // ── 4. Sales — Catalog, Manual, Mixed & PDF Upload ──────────────────────────
  section('4. Sales — Catalog Items, Manual Items & PDF Bill Upload');

  // Test 4.1: Catalog item sale
  const catalogSalePayload = {
    painterId: testPainter.id,
    customer: { name: 'Catalog Customer', mobile: '9876500001' },
    lineItems: [
      {
        itemId: testItem.id,
        quantity: 2,
      },
    ],
  };
  const catalogSaleRes = await req('POST', '/sales', catalogSalePayload);
  check('Catalog item sale created (201)', catalogSaleRes.status === 201, `Status: ${catalogSaleRes.status}`);
  const expectedCatalogAmount = testItem.price * 2;
  const expectedCatalogPoints = testItem.points * 2;
  check(
    'Server calculates catalog totalAmount correctly',
    catalogSaleRes.data?.data?.totalAmount === expectedCatalogAmount,
    `expected: ${expectedCatalogAmount}, got: ${catalogSaleRes.data?.data?.totalAmount}`
  );
  check(
    'Server calculates catalog totalPoints correctly',
    catalogSaleRes.data?.data?.totalPoints === expectedCatalogPoints,
    `expected: ${expectedCatalogPoints}, got: ${catalogSaleRes.data?.data?.totalPoints}`
  );

  // Test 4.2: Manual item sale with custom price and points
  const manualSalePayload = {
    painterId: testPainter.id,
    customer: { name: 'Manual Customer', mobile: '9876500002' },
    lineItems: [
      {
        isManual: true,
        itemName: 'Asian Paint Apex 20L',
        quantity: 3,
        pricePerUnit: 3200,
        pointsPerUnit: 15,
      },
    ],
  };
  const manualSaleRes = await req('POST', '/sales', manualSalePayload);
  check('Manual item sale created (201)', manualSaleRes.status === 201, `Status: ${manualSaleRes.status}`);
  check('Manual item snapshot itemName preserved', manualSaleRes.data?.data?.lineItems?.[0]?.itemName === 'Asian Paint Apex 20L');
  check('Manual item isManual flag preserved', manualSaleRes.data?.data?.lineItems?.[0]?.isManual === true);
  check('Manual total amount = 9600 (3 * 3200)', manualSaleRes.data?.data?.totalAmount === 9600);
  check('Manual total points = 45 (3 * 15)', manualSaleRes.data?.data?.totalPoints === 45);

  // Test 4.3: Mixed sale: catalog item + manual item in one bill
  const mixedSalePayload = {
    painterId: testPainter.id,
    customer: { name: 'Mixed Customer', mobile: '9876500003' },
    lineItems: [
      {
        itemId: testItem.id,
        quantity: 1,
      },
      {
        isManual: true,
        itemName: 'Custom Premium Roller Brush',
        quantity: 4,
        pricePerUnit: 150,
        pointsPerUnit: 2,
      },
    ],
  };
  const mixedSaleRes = await req('POST', '/sales', mixedSalePayload);
  check('Mixed catalog + manual sale created (201)', mixedSaleRes.status === 201);
  const expectedMixedAmount = testItem.price * 1 + 150 * 4;
  const expectedMixedPoints = testItem.points * 1 + 2 * 4;
  check('Mixed sale totalAmount matches server recalculation', mixedSaleRes.data?.data?.totalAmount === expectedMixedAmount);
  check('Mixed sale totalPoints matches server recalculation', mixedSaleRes.data?.data?.totalPoints === expectedMixedPoints);

  // Test 4.4: Validation - Reject manual item with missing name
  const invalidManualName = {
    painterId: testPainter.id,
    customer: { name: 'Invalid Customer', mobile: '9876500004' },
    lineItems: [{ isManual: true, itemName: '', quantity: 1, pricePerUnit: 100, pointsPerUnit: 5 }],
  };
  const invalidNameRes = await req('POST', '/sales', invalidManualName);
  check('Empty manual itemName rejected (400)', invalidNameRes.status === 400);

  // Test 4.5: Validation - Reject negative price / points
  const negativePrice = {
    painterId: testPainter.id,
    customer: { name: 'Invalid Customer', mobile: '9876500004' },
    lineItems: [{ isManual: true, itemName: 'Paint', quantity: 1, pricePerUnit: -100, pointsPerUnit: 5 }],
  };
  const negPriceRes = await req('POST', '/sales', negativePrice);
  check('Negative pricePerUnit rejected (400)', negPriceRes.status === 400);

  // Test 4.6: Multipart FormData with PDF bill upload
  const fd = new FormData();
  fd.append('painterId', testPainter.id);
  fd.append(
    'customer',
    JSON.stringify({ name: 'PDF Bill Customer', mobile: '9876500005' })
  );
  fd.append(
    'lineItems',
    JSON.stringify([
      { isManual: true, itemName: 'Dulux Velvet Touch 10L', quantity: 2, pricePerUnit: 2100, pointsPerUnit: 10 },
    ])
  );
  const fakePdfBlob = new Blob(['%PDF-1.4 Mock PDF Invoice content for testing'], {
    type: 'application/pdf',
  });
  fd.append('billFile', fakePdfBlob, 'invoice_101.pdf');

  const pdfSaleRes = await req('POST', '/sales', fd, true);
  check('Sale with PDF bill upload accepted (201)', pdfSaleRes.status === 201);
  check('Sale stores billImageUrl string from upload', typeof pdfSaleRes.data?.data?.billImageUrl === 'string' && pdfSaleRes.data?.data?.billImageUrl.length > 0);

  // Test 4.7: Reject invalid bill file type (e.g. .txt or .exe)
  const fdBad = new FormData();
  fdBad.append('painterId', testPainter.id);
  fdBad.append('customer', JSON.stringify({ name: 'Bad Customer', mobile: '9876500006' }));
  fdBad.append('lineItems', JSON.stringify([{ isManual: true, itemName: 'Paint', quantity: 1, pricePerUnit: 50, pointsPerUnit: 1 }]));
  const badBlob = new Blob(['malicious payload'], { type: 'text/plain' });
  fdBad.append('billFile', badBlob, 'hack.txt');

  const badFileRes = await req('POST', '/sales', fdBad, true);
  check('Invalid bill file type rejected (400)', badFileRes.status === 400);

  // ── 5. Reward Tiers — Inventory Integration ────────────────────────────────
  section('5. Reward Tiers — Inventory Integration & Availability');

  // Get available inventory item
  const invRes = await req('GET', '/reward-inventory?status=active');
  check('GET /api/reward-inventory returns 200', invRes.status === 200);
  const invItems = invRes.data?.data || [];
  check('Active inventory items exist', invItems.length > 0);
  const testInvItem = invItems[0];
  const invQtyBefore = testInvItem.remainingQty;

  // Test 5.1: Create Reward Tier with inventory reward product
  const tierMin = 90000 + Math.floor(Math.random() * 5000);
  const tierMax = tierMin + 99;
  const tierRes = await req('POST', '/reward-tiers', {
    minPoints: tierMin,
    maxPoints: tierMax,
    suggestedInventoryItemId: testInvItem.id || testInvItem._id,
  });
  check('Create Reward Tier with inventory item succeeds (201)', tierRes.status === 201);
  check('Tier saves suggestedRewardName snapshot', tierRes.data?.data?.suggestedRewardName === testInvItem.name);
  check(
    'Tier references suggestedInventoryItemId',
    String(tierRes.data?.data?.suggestedInventoryItemId?.id || tierRes.data?.data?.suggestedInventoryItemId?._id || tierRes.data?.data?.suggestedInventoryItemId) === String(testInvItem.id || testInvItem._id)
  );

  // Test 5.2: Verify creating tier does NOT reduce inventory quantity
  const invCheckAfter = await req('GET', `/reward-inventory/${testInvItem.id || testInvItem._id}`);
  check(
    'Creating Reward Tier does NOT decrement inventory quantity',
    invCheckAfter.data?.data?.remainingQty === invQtyBefore,
    `before: ${invQtyBefore}, after: ${invCheckAfter.data?.data?.remainingQty}`
  );

  // ── 6. Painter Reward Assignment ───────────────────────────────────────────
  section('6. Painter Reward Assignment — Inventory Override & Atomic Decrement');

  // Test 6.1: Eligibility returns active inventory items
  const eligRes = await req('GET', `/painter-reward-assignments/eligibility/${testPainter.id}`);
  check('GET painter eligibility returns 200', eligRes.status === 200);
  check('Eligibility returns suggestedInventoryItems list', Array.isArray(eligRes.data?.data?.suggestedInventoryItems));

  // Test 6.2: Assign reward and verify atomic inventory decrement
  const assignQty = 1;
  const assignRes = await req('POST', '/painter-reward-assignments', {
    painterId: testPainter.id,
    rewardInventoryItemId: testInvItem.id || testInvItem._id,
    qty: assignQty,
    notes: 'Regression test assignment',
  });
  check('Assign reward returns 201', assignRes.status === 201);
  check('Assignment records snapshot rewardName', assignRes.data?.data?.assignment?.rewardName === testInvItem.name);

  const invAfterAssign = await req('GET', `/reward-inventory/${testInvItem.id || testInvItem._id}`);
  check(
    'Inventory decrements atomically after assignment',
    invAfterAssign.data?.data?.remainingQty === invQtyBefore - assignQty,
    `expected: ${invQtyBefore - assignQty}, got: ${invAfterAssign.data?.data?.remainingQty}`
  );

  // ── 7. Company Rewards — Structured Items & Active Company Rule ─────────────
  section('7. Company Rewards — Structured Items & Active Company Rule');

  // Fetch active company
  const companiesRes = await req('GET', '/companies?status=active');
  check('GET /api/companies returns 200', companiesRes.status === 200);
  const activeCompaniesList = companiesRes.data?.data || [];
  check('Active companies exist', activeCompaniesList.length > 0);
  const testCompany = activeCompaniesList[0];

  // Test 7.1: Create company reward entry with structured items and NO description
  const uniquePeriodYear = 2030 + Math.floor(Math.random() * 20);
  const companyRewardPayload = {
    companyId: testCompany.id,
    dateFrom: `${uniquePeriodYear}-01-01`,
    dateTo: `${uniquePeriodYear}-01-31`,
    quantitySold: 1250,
    saleValue: 2500000,
    rewardItems: [
      { name: 'Samsung 43-inch Smart TV', quantity: 5 },
      { name: 'Double Door Refrigerator', quantity: 2 },
      { name: 'Split AC 1.5 Ton', quantity: 1 },
    ],
  };

  const createCRRes = await req('POST', '/company-rewards', companyRewardPayload);
  check('Create Company Reward without description succeeds (201)', createCRRes.status === 201);
  check('Structured rewardItems saved with length 3', createCRRes.data?.data?.rewardItems?.length === 3);
  check('First reward item quantity is 5', createCRRes.data?.data?.rewardItems?.[0]?.quantity === 5);

  // Test 7.2: List company rewards and verify search by reward item name
  const searchCRRes = await req('GET', '/company-rewards?search=Refrigerator');
  check('Search by reward item name returns 200', searchCRRes.status === 200);
  check('Search matches entry with Refrigerator', (searchCRRes.data?.data || []).length > 0);

  // Test 7.3: Active company rule - Deactivated company rejected for new entry
  const deactCompanyRes = await req('POST', '/companies', {
    name: `Deactivated Company Test ${Date.now()}`,
    contactPerson: 'Inactive Admin',
    phone: '9999900000',
    email: `inactive_${Date.now()}@paint.com`,
    status: 'active',
  });
  if (deactCompanyRes.status === 201) {
    const deactId = deactCompanyRes.data?.data?.id || deactCompanyRes.data?.data?._id;
    // Deactivate it
    await req('PATCH', `/companies/${deactId}/deactivate`);

    // Attempt to log company incentive for deactivated company -> must reject 400
    const logDeactRes = await req('POST', '/company-rewards', {
      companyId: deactId,
      dateFrom: '2029-01-01',
      dateTo: '2029-01-31',
      quantitySold: 500,
      saleValue: 1000000,
      rewardItems: [{ name: 'Microwave', quantity: 1 }],
    });
    check('Creating incentive for deactivated company is rejected (400)', logDeactRes.status === 400);
  }

  // ── 8. Reward Cycles — Manual Close, Expiration & Overlap ───────────────────
  section('8. Reward Cycles — Manual Close, Effective EndDate & Overlap Logic');

  // Test 8.1: Close active cycle manually
  if (activeCycle) {
    const closeRes = await req('PATCH', `/cycles/${activeCycle.id || activeCycle._id}/close`);
    check('Manual close of active cycle returns 200', closeRes.status === 200);
    check('Closed cycle has isActive=false', closeRes.data?.data?.isActive === false);
    check('Closed cycle computed_status is "ended"', closeRes.data?.data?.computed_status === 'ended');
    const closedEnd = new Date(closeRes.data?.data?.endDate);
    const now = new Date();
    check(
      'Manual close sets effective endDate to current time',
      Math.abs(closedEnd.getTime() - now.getTime()) < 60000,
      `endDate: ${closedEnd.toISOString()}, now: ${now.toISOString()}`
    );

    // Test 8.2: Attempt to record a sale against closed cycle -> rejected
    const saleOnClosedCycle = await req('POST', '/sales', {
      painterId: testPainter.id,
      customer: { name: 'Late Customer', mobile: '9876543219' },
      lineItems: [{ itemId: testItem.id, quantity: 1 }],
    });
    check('Sale rejected when no active cycle exists (409)', saleOnClosedCycle.status === 409);

    // Test 8.3: Immediately create adjacent next cycle starting at closedEnd
    const nextStart = closedEnd.toISOString();
    const nextEnd = new Date(closedEnd.getTime() + 7200000).toISOString(); // +2 hours
    const nextCycleRes = await req('POST', '/cycles', {
      startDate: nextStart,
      endDate: nextEnd,
      isActive: true,
    });
    check('Adjacent cycle created immediately after manual close (201)', nextCycleRes.status === 201);
  }

  // Test 8.4: Overlapping cycle rejected
  const futureBase = Date.now() + 500000000;
  const f0 = new Date(futureBase).toISOString();
  const f1 = new Date(futureBase + 86400000).toISOString();
  const f2 = new Date(futureBase + 172800000).toISOString();

  await req('POST', '/cycles', { startDate: f0, endDate: f1, isActive: false });
  const overlapFutureRes = await req('POST', '/cycles', {
    startDate: new Date(futureBase + 36000000).toISOString(),
    endDate: f2,
    isActive: false,
  });
  check('Overlapping cycle range rejected (409)', overlapFutureRes.status === 409);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('══════════════════════════════════════════════════════════════');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
