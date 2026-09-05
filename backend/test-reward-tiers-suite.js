import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './src/app.js';
import Cycle from './src/models/Cycle.js';
import Sale from './src/models/Sale.js';
import Customer from './src/models/Customer.js';
import Painter from './src/models/Painter.js';
import Item from './src/models/Item.js';
import RewardTier from './src/models/RewardTier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = 5007;
const API = `http://localhost:${PORT}/api`;

async function run() {
  console.log('==================================================');
  console.log('   PART 8 — REWARD TIER SYSTEM VERIFICATION       ');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paintshop_dev');
  const server = http.createServer(app);
  await new Promise((r) => server.listen(PORT, r));
  console.log(`Test server running on port ${PORT}\n`);

  let passed = 0;
  let failed = 0;
  const created = {
    tiers: [],
    cycles: [],
    sales: [],
    customers: [],
    painters: [],
    items: [],
  };
  let adminToken = null;
  let painterToken = null;

  function ok(cond, msg) {
    if (cond) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  async function post(endpoint, body, token) {
    return fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  }

  async function get(endpoint, token) {
    return fetch(`${API}${endpoint}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  async function patch(endpoint, body, token) {
    return fetch(`${API}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async function del(endpoint, token) {
    return fetch(`${API}${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  try {
    // ── A. Server / Auth ──────────────────────────────────────────────────────
    // 1. Health endpoint
    const healthRes = await get('/health');
    const healthData = await healthRes.json();
    ok(healthRes.status === 200 && healthData.status === 'ok', '1. Server health check works');

    // 2. Admin login
    const adminLoginRes = await post('/auth/login', {
      email: process.env.ADMIN_EMAIL || 'admin@paintshop.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;
    ok(adminLoginRes.status === 200 && adminToken, '2. Admin login works');

    // Create Painter A for auth and eligibility testing
    const painterA = await Painter.create({
      firstName: 'TierTester Painter',
      mobile: '9888877770',
      email: `tiertest.${Date.now()}@painter.com`,
      password: 'Painter@123456',
      status: 'active',
    });
    created.painters.push(painterA._id);

    // 3. Painter login
    const painterLoginRes = await post('/auth/login', {
      email: painterA.email,
      password: 'Painter@123456',
    });
    const painterLoginData = await painterLoginRes.json();
    painterToken = painterLoginData.token;
    ok(painterLoginRes.status === 200 && painterToken, '3. Painter login works');

    // 4. Unauthenticated request returns 401
    const unauthRes = await get('/reward-tiers');
    ok(unauthRes.status === 401, '4. Unauthenticated request returns 401');

    // 5. Painter GET reward tiers returns 403
    const painterGetRes = await get('/reward-tiers', painterToken);
    ok(painterGetRes.status === 403, '5. Painter GET reward tiers returns 403');

    // 6. Painter POST reward tier returns 403
    const painterPostRes = await post('/reward-tiers', { minPoints: 1, maxPoints: 10, suggestedRewardName: 'Cap' }, painterToken);
    ok(painterPostRes.status === 403, '6. Painter POST reward tier returns 403');

    // 7. Painter PATCH reward tier returns 403
    const fakeId = new mongoose.Types.ObjectId();
    const painterPatchRes = await patch(`/reward-tiers/${fakeId}`, { suggestedRewardName: 'Cap' }, painterToken);
    ok(painterPatchRes.status === 403, '7. Painter PATCH reward tier returns 403');

    // 7b. Painter GET current reward tier returns 403
    const painterEligRes = await get(`/reward-tiers/painter/${painterA._id}`, painterToken);
    ok(painterEligRes.status === 403, '7b. Painter GET painter reward eligibility returns 403');

    // ── B. CRUD & Validation ──────────────────────────────────────────────────
    // Clean any prior reward tiers from previous testing
    await RewardTier.deleteMany({});

    // 8. Admin GET tiers works (initially empty)
    const initListRes = await get('/reward-tiers', adminToken);
    const initListData = await initListRes.json();
    ok(initListRes.status === 200 && Array.isArray(initListData.data), '8. Admin GET tiers works');

    // 10. Create valid tier (100–199 → LCD TV)
    const createTier1Res = await post('/reward-tiers', {
      minPoints: 100,
      maxPoints: 199,
      suggestedRewardName: 'LCD TV',
    }, adminToken);
    const createTier1Data = await createTier1Res.json();
    ok(createTier1Res.status === 201 && createTier1Data.data.suggestedRewardName === 'LCD TV', '10. Create valid tier');
    const tier1Id = createTier1Data.data.id || createTier1Data.data._id;
    created.tiers.push(tier1Id);

    // 9. Admin GET single tier works
    const singleTierRes = await get(`/reward-tiers/${tier1Id}`, adminToken);
    const singleTierData = await singleTierRes.json();
    ok(singleTierRes.status === 200 && singleTierData.data.suggestedRewardName === 'LCD TV', '9. Admin GET single tier works');

    // 11. Reject negative minPoints
    const negMinRes = await post('/reward-tiers', { minPoints: -10, maxPoints: 50, suggestedRewardName: 'Watch' }, adminToken);
    ok(negMinRes.status === 400, '11. Reject negative minPoints');

    // 12. Reject negative maxPoints
    const negMaxRes = await post('/reward-tiers', { minPoints: 10, maxPoints: -50, suggestedRewardName: 'Watch' }, adminToken);
    ok(negMaxRes.status === 400, '12. Reject negative maxPoints');

    // 13. Reject minPoints > maxPoints
    const minGtMaxRes = await post('/reward-tiers', { minPoints: 200, maxPoints: 150, suggestedRewardName: 'Watch' }, adminToken);
    ok(minGtMaxRes.status === 400, '13. Reject minPoints > maxPoints');

    // 14. Reject missing reward name
    const missingNameRes = await post('/reward-tiers', { minPoints: 200, maxPoints: 299, suggestedRewardName: '   ' }, adminToken);
    ok(missingNameRes.status === 400, '14. Reject missing reward name');

    // 15. Reject overlapping tier (150–250 overlaps with 100–199)
    const overlapRes = await post('/reward-tiers', { minPoints: 150, maxPoints: 250, suggestedRewardName: 'Smartphone' }, adminToken);
    ok(overlapRes.status === 400, '15. Reject overlapping tier');

    // Create tier 2: 200–299 → Refrigerator
    const createTier2Res = await post('/reward-tiers', {
      minPoints: 200,
      maxPoints: 299,
      suggestedRewardName: 'Refrigerator',
    }, adminToken);
    const createTier2Data = await createTier2Res.json();
    const tier2Id = createTier2Data.data.id || createTier2Data.data._id;
    created.tiers.push(tier2Id);

    // 16. Update valid tier (change 100–199 name to "Smart LCD TV")
    const updateTier1Res = await patch(`/reward-tiers/${tier1Id}`, { suggestedRewardName: 'Smart LCD TV' }, adminToken);
    const updateTier1Data = await updateTier1Res.json();
    ok(updateTier1Res.status === 200 && updateTier1Data.data.suggestedRewardName === 'Smart LCD TV', '16. Update valid tier');

    // 17. Reject update creating overlap (trying to expand tier 1 to 100–250 which overlaps tier 2's 200–299)
    const updateOverlapRes = await patch(`/reward-tiers/${tier1Id}`, { maxPoints: 250 }, adminToken);
    ok(updateOverlapRes.status === 400, '17. Reject update creating overlap');

    // 18. Deactivate tier
    const deactRes = await patch(`/reward-tiers/${tier2Id}/deactivate`, {}, adminToken);
    const deactData = await deactRes.json();
    ok(deactRes.status === 200 && deactData.data.status === 'deactivated', '18. Deactivate tier');

    // 19. Deactivated tier remains stored
    const checkDeactRes = await get(`/reward-tiers/${tier2Id}`, adminToken);
    const checkDeactData = await checkDeactRes.json();
    ok(checkDeactRes.status === 200 && checkDeactData.data.status === 'deactivated', '19. Deactivated tier remains stored');

    // While tier 2 (200–299) is deactivated, an overlapping tier 3 (250–350) can be created:
    const createTier3Res = await post('/reward-tiers', {
      minPoints: 250,
      maxPoints: 350,
      suggestedRewardName: 'Microwave Oven',
    }, adminToken);
    const createTier3Data = await createTier3Res.json();
    const tier3Id = createTier3Data.data.id || createTier3Data.data._id;
    created.tiers.push(tier3Id);

    // 21. Reject activation causing overlap (activating tier 2 200–299 overlaps active tier 3 250–350)
    const reactOverlapRes = await patch(`/reward-tiers/${tier2Id}/activate`, {}, adminToken);
    ok(reactOverlapRes.status === 400, '21. Reject activation causing overlap');

    // Deactivate tier 3 so tier 2 can be cleanly activated
    await patch(`/reward-tiers/${tier3Id}/deactivate`, {}, adminToken);

    // 20. Activate tier 2
    const reactRes = await patch(`/reward-tiers/${tier2Id}/activate`, {}, adminToken);
    const reactData = await reactRes.json();
    ok(reactRes.status === 200 && reactData.data.status === 'active', '20. Activate tier');

    // 22. DELETE returns 404
    const delRes = await del(`/reward-tiers/${tier1Id}`, adminToken);
    ok(delRes.status === 404, '22. DELETE returns 404 (no hard delete endpoint)');

    // ── C. Current Reward Eligibility ─────────────────────────────────────────
    // Setup cycles:
    // Close any currently active cycle
    await Cycle.updateMany({ isActive: true }, { isActive: false });

    // Past Cycle A (closed)
    const pastCycle = await Cycle.create({
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.999Z'),
      isActive: false,
    });
    created.cycles.push(pastCycle._id);

    // Current Active Cycle B
    const activeCycle = await Cycle.create({
      startDate: new Date('2026-05-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
      isActive: true,
    });
    created.cycles.push(activeCycle._id);

    // 23. Find active cycle
    const foundActive = await Cycle.findOne({ isActive: true });
    ok(foundActive && String(foundActive._id) === String(activeCycle._id), '23. Find active cycle');

    // Setup Customer & Item
    const customer = await Customer.create({ name: 'Tier Customer', mobile: '9777766660' });
    created.customers.push(customer._id);

    const testItem = await Item.create({
      name: 'Weather Proof Emulsion 10L',
      price: 3000,
      points: 50,
      brand: 'Asian Paints',
      category: 'Exterior',
      status: 'active',
    });
    created.items.push(testItem._id);

    // Sale in Past Cycle (500 pts) — MUST NOT COUNT towards active cycle eligibility
    const pastSale = await Sale.create({
      painterId: painterA._id,
      customerId: customer._id,
      cycleId: pastCycle._id,
      date: new Date('2026-02-01T10:00:00.000Z'),
      totalAmount: 15000,
      totalPoints: 500,
      lineItems: [
        {
          itemId: testItem._id,
          itemName: testItem.name,
          quantity: 10,
          pricePerUnit: 3000,
          pointsPerUnit: 50,
          pointsEarned: 500,
          lineTotal: 15000,
        },
      ],
    });
    created.sales.push(pastSale._id);

    // Before any sale in current cycle: currentPoints = 0
    const zeroSaleEligRes = await get(`/reward-tiers/painter/${painterA._id}`, adminToken);
    const zeroSaleEligData = await zeroSaleEligRes.json();
    ok(zeroSaleEligData.data.currentPoints === 0 && zeroSaleEligData.data.tier === null, '31. Lifetime points are NOT used (past cycle excluded)');

    // Sale 1 in Current Active Cycle: 3 items × 50 pts = 150 pts
    const activeSale1 = await Sale.create({
      painterId: painterA._id,
      customerId: customer._id,
      cycleId: activeCycle._id,
      date: new Date('2026-06-01T10:00:00.000Z'),
      totalAmount: 9000,
      totalPoints: 150,
      lineItems: [
        {
          itemId: testItem._id,
          itemName: testItem.name,
          quantity: 3,
          pricePerUnit: 3000,
          pointsPerUnit: 50,
          pointsEarned: 150,
          lineTotal: 9000,
        },
      ],
    });
    created.sales.push(activeSale1._id);

    // 24. Calculate current painter points from Sales (150 pts)
    const elig1Res = await get(`/reward-tiers/painter/${painterA._id}`, adminToken);
    const elig1Data = await elig1Res.json();
    ok(elig1Data.data.currentPoints === 150, '24. Calculate current painter points from Sales');

    // 25. Correct tier selected (150 pts falls in Tier 1: 100–199 → Smart LCD TV)
    ok(elig1Data.data.tier && elig1Data.data.tier.suggestedRewardName === 'Smart LCD TV', '25. Correct tier selected');

    // 32. Closed-cycle points are NOT included (total is 150, not 650)
    ok(elig1Data.data.currentPoints === 150, '32. Closed-cycle points are NOT included');

    // Test boundary: exactly 100 points
    // Let's create Painter B for exact boundary tests
    const painterB = await Painter.create({
      firstName: 'Boundary Tester',
      mobile: '9888877771',
      email: `boundary.${Date.now()}@painter.com`,
      password: 'Painter@123456',
      status: 'active',
    });
    created.painters.push(painterB._id);

    const saleB1 = await Sale.create({
      painterId: painterB._id,
      customerId: customer._id,
      cycleId: activeCycle._id,
      date: new Date('2026-06-05T10:00:00.000Z'),
      totalAmount: 6000,
      totalPoints: 100, // exact lower boundary
      lineItems: [
        {
          itemId: testItem._id,
          itemName: testItem.name,
          quantity: 2,
          pricePerUnit: 3000,
          pointsPerUnit: 50,
          pointsEarned: 100,
          lineTotal: 6000,
        },
      ],
    });
    created.sales.push(saleB1._id);

    // 26. Lower boundary inclusive (100 pts gets Tier 1 100–199)
    const lowerBoundRes = await get(`/reward-tiers/painter/${painterB._id}`, adminToken);
    const lowerBoundData = await lowerBoundRes.json();
    ok(lowerBoundData.data.currentPoints === 100 && lowerBoundData.data.tier?.id === String(tier1Id), '26. Lower boundary inclusive');

    // Test boundary: exactly 199 points
    await Sale.updateOne({ _id: saleB1._id }, { totalPoints: 199 });
    // 27. Upper boundary inclusive (199 pts gets Tier 1 100–199)
    const upperBoundRes = await get(`/reward-tiers/painter/${painterB._id}`, adminToken);
    const upperBoundData = await upperBoundRes.json();
    ok(upperBoundData.data.currentPoints === 199 && upperBoundData.data.tier?.id === String(tier1Id), '27. Upper boundary inclusive');

    // Test: 50 points (no matching tier)
    await Sale.updateOne({ _id: saleB1._id }, { totalPoints: 50 });
    // 28. No matching tier returns null
    const noMatchRes = await get(`/reward-tiers/painter/${painterB._id}`, adminToken);
    const noMatchData = await noMatchRes.json();
    ok(noMatchData.data.currentPoints === 50 && noMatchData.data.tier === null, '28. No matching tier returns null');

    // 29. No active cycle returns null/zero safely
    await Cycle.updateOne({ _id: activeCycle._id }, { isActive: false });
    const noCycleRes = await get(`/reward-tiers/painter/${painterA._id}`, adminToken);
    const noCycleData = await noCycleRes.json();
    ok(
      noCycleData.data.cycle === null &&
      noCycleData.data.currentPoints === 0 &&
      noCycleData.data.tier === null,
      '29. No active cycle returns null/zero safely'
    );
    // Restore active cycle
    await Cycle.updateOne({ _id: activeCycle._id }, { isActive: true });

    // 30. Deactivated painter history/eligibility remains accessible
    const deactPainter = await Painter.create({
      firstName: 'Deactivated Worker',
      mobile: '9888877779',
      email: `deactworker.${Date.now()}@painter.com`,
      password: 'Painter@123456',
      status: 'deactivated',
    });
    created.painters.push(deactPainter._id);

    const deactSale = await Sale.create({
      painterId: deactPainter._id,
      customerId: customer._id,
      cycleId: activeCycle._id,
      date: new Date('2026-06-10T10:00:00.000Z'),
      totalAmount: 6000,
      totalPoints: 150,
      lineItems: [
        {
          itemId: testItem._id,
          itemName: testItem.name,
          quantity: 2,
          pricePerUnit: 3000,
          pointsPerUnit: 50,
          pointsEarned: 100,
          lineTotal: 6000,
        },
      ],
    });
    created.sales.push(deactSale._id);

    const deactEligRes = await get(`/reward-tiers/painter/${deactPainter._id}`, adminToken);
    const deactEligData = await deactEligRes.json();
    ok(
      deactEligRes.status === 200 &&
      deactEligData.data.painter.status === 'deactivated' &&
      deactEligData.data.currentPoints === 150 &&
      deactEligData.data.tier !== null,
      '30. Deactivated painter history/eligibility remains accessible'
    );

    // ── D. Historical Safety ──────────────────────────────────────────────────
    // 33 & 34. Changing Item.points / Item.price does not mutate Sale record
    await Item.updateOne({ _id: testItem._id }, { points: 9999, price: 88888 });
    const freshSale = await Sale.findById(activeSale1._id);
    ok(freshSale.totalPoints === 150, '33. Changing Item.points does not change current/historical Sale points');
    ok(freshSale.totalAmount === 9000, '34. Changing Item.price does not change Sale totals');

    // 35 & 36. Reward tier changes do not modify Sale.totalPoints or totalAmount
    await patch(`/reward-tiers/${tier1Id}`, { suggestedRewardName: 'Ultra 4K OLED TV' }, adminToken);
    const freshSaleAfterTierChange = await Sale.findById(activeSale1._id);
    ok(freshSaleAfterTierChange.totalPoints === 150, '35. Reward tier changes do not modify Sale.totalPoints');
    ok(freshSaleAfterTierChange.totalAmount === 9000, '36. Reward tier changes do not modify Sale.totalAmount');

    // ── E. Response / Data Safety ─────────────────────────────────────────────
    // 37. No password/hash fields
    const eligPayload = JSON.stringify(elig1Data);
    ok(
      !eligPayload.includes('password') &&
      !eligPayload.includes('salt') &&
      !eligPayload.includes('$2a$'),
      '37. No password/hash fields in eligibility response'
    );

    // 38. Correct painter returned
    ok(elig1Data.data.painter.id === String(painterA._id), '38. Correct painter returned');

    // 39. Correct active cycle returned
    ok(elig1Data.data.cycle.id === String(activeCycle._id) && elig1Data.data.cycle.isActive === true, '39. Correct active cycle returned');

    // 40. Correct tier fields returned
    const tFields = elig1Data.data.tier;
    ok(
      tFields &&
      tFields.minPoints === 100 &&
      tFields.maxPoints === 199 &&
      typeof tFields.suggestedRewardName === 'string',
      '40. Correct tier fields returned'
    );

    // 41. Pagination metadata correct
    const listRes = await get('/reward-tiers?page=1&limit=2', adminToken);
    const listData = await listRes.json();
    ok(
      listData.pagination &&
      listData.pagination.page === 1 &&
      listData.pagination.limit === 2 &&
      listData.pagination.total >= 2,
      '41. Pagination metadata correct'
    );

    // 42. Status filtering works
    const activeListRes = await get('/reward-tiers?status=active', adminToken);
    const activeListData = await activeListRes.json();
    ok(
      activeListData.data.every((t) => t.status === 'active'),
      '42. Status filtering works'
    );

    // 43. Sorting by minPoints works
    const sortedListRes = await get('/reward-tiers', adminToken);
    const sortedListData = await sortedListRes.json();
    let isSorted = true;
    for (let i = 1; i < sortedListData.data.length; i++) {
      if (sortedListData.data[i].minPoints < sortedListData.data[i - 1].minPoints) {
        isSorted = false;
        break;
      }
    }
    ok(isSorted, '43. Sorting by minPoints works');

    // ── F. Regression Checks ──────────────────────────────────────────────────
    // 44. Auth regression
    const authMeRes = await get('/auth/me', adminToken);
    ok(authMeRes.status === 200, '44. Auth tests pass (GET /api/auth/me)');

    // 45. Painter regression
    const paintersListRes = await get('/painters', adminToken);
    ok(paintersListRes.status === 200, '45. Painter tests pass (GET /api/painters)');

    // 46. Item regression
    const itemsListRes = await get('/items', adminToken);
    ok(itemsListRes.status === 200, '46. Item tests pass (GET /api/items)');

    // 47. Cycle regression
    const cyclesListRes = await get('/cycles', adminToken);
    ok(cyclesListRes.status === 200, '47. Cycle tests pass (GET /api/cycles)');

    // 48. Sales regression
    const salesListRes = await get('/sales', adminToken);
    ok(salesListRes.status === 200, '48. Sales tests pass (GET /api/sales)');

    // 49. Painter History regression
    const pHistRes = await get(`/painter-history/${painterA._id}`, adminToken);
    ok(pHistRes.status === 200, '49. Painter History regression (GET /api/painter-history/:id)');

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  } finally {
    console.log('\nCleaning up test artifacts...');
    if (created.tiers.length) await RewardTier.deleteMany({ _id: { $in: created.tiers } });
    if (created.sales.length) await Sale.deleteMany({ _id: { $in: created.sales } });
    if (created.customers.length) await Customer.deleteMany({ _id: { $in: created.customers } });
    if (created.painters.length) await Painter.deleteMany({ _id: { $in: created.painters } });
    if (created.items.length) await Item.deleteMany({ _id: { $in: created.items } });
    if (created.cycles.length) await Cycle.deleteMany({ _id: { $in: created.cycles } });

    await new Promise((r) => server.close(r));
    await mongoose.disconnect();
  }

  console.log('\n--------------------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('--------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
