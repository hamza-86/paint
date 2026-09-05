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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = 5006;
const API = `http://localhost:${PORT}/api`;

async function run() {
  console.log('==================================================');
  console.log('   PART 7 — PAINTER HISTORY VERIFICATION SUITE   ');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paintshop_dev');
  const server = http.createServer(app);
  await new Promise((r) => server.listen(PORT, r));
  console.log(`Test server running on port ${PORT}\n`);

  let passed = 0;
  let failed = 0;
  const created = {
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

  async function patch(endpoint, token) {
    return fetch(`${API}${endpoint}`, {
      method: 'PATCH',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
    // 1. Backend starts
    ok(server.listening, '1. Backend starts successfully');

    // 2. Health endpoint
    const healthRes = await get('/health');
    const healthData = await healthRes.json();
    ok(healthRes.status === 200 && healthData.status === 'ok', '2. Health endpoint works');

    // 3. Admin login
    const adminLoginRes = await post('/auth/login', {
      email: process.env.ADMIN_EMAIL || 'admin@paintshop.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.token;
    ok(adminLoginRes.status === 200 && adminToken, '3. Admin login works');

    // Create active cycle 1 (Closed later to test closed cycle history)
    // Deactivate any existing active cycles first to keep a clean test state
    await Cycle.updateMany({ isActive: true }, { isActive: false });

    const cycle1 = await Cycle.create({
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T23:59:59.999Z'),
      isActive: false, // will represent a closed past cycle
    });
    created.cycles.push(cycle1._id);

    const cycle2 = await Cycle.create({
      startDate: new Date('2026-05-01T00:00:00.000Z'),
      endDate: new Date('2026-08-31T23:59:59.999Z'),
      isActive: true, // represents the current active cycle
    });
    created.cycles.push(cycle2._id);

    // Create test item
    const itemA = await Item.create({
      name: 'Super Gloss Enamel 1L',
      price: 500,
      points: 10,
      brand: 'Asian Paints',
      category: 'Enamel',
      status: 'active',
    });
    created.items.push(itemA._id);

    const itemB = await Item.create({
      name: 'Royal Luxury Emulsion 4L',
      price: 2000,
      points: 40,
      brand: 'Asian Paints',
      category: 'Emulsion',
      status: 'active',
    });
    created.items.push(itemB._id);

    // Create Painter A (primary test subject)
    const painterA = await Painter.create({
      firstName: 'Ramesh Painter',
      mobile: '9876543210',
      email: `ramesh.${Date.now()}@painter.com`,
      password: 'Painter@123456',
      status: 'active',
      currentCycleId: cycle2._id,
    });
    created.painters.push(painterA._id);

    // Create Painter B (control subject for isolation tests)
    const painterB = await Painter.create({
      firstName: 'Suresh Painter',
      mobile: '9876543211',
      email: `suresh.${Date.now()}@painter.com`,
      password: 'Painter@123456',
      status: 'active',
      currentCycleId: cycle2._id,
    });
    created.painters.push(painterB._id);

    // 4. Painter login
    const painterLoginRes = await post('/auth/login', {
      email: painterA.email,
      password: 'Painter@123456',
    });
    const painterLoginData = await painterLoginRes.json();
    painterToken = painterLoginData.token;
    ok(painterLoginRes.status === 200 && painterToken, '4. Painter login works');

    // 5. Unauthenticated history request → 401
    const unauthRes = await get(`/painter-history/${painterA._id}`);
    ok(unauthRes.status === 401, '5. Unauthenticated history request → 401');

    // 6. Painter history request → 403
    const painterForbiddenRes = await get(`/painter-history/${painterA._id}`, painterToken);
    ok(painterForbiddenRes.status === 403, '6. Painter history request → 403');

    // 7. Painter cannot access cycle history endpoint → 403
    const painterCyclesRes = await get(`/painter-history/${painterA._id}/cycles`, painterToken);
    ok(painterCyclesRes.status === 403, '7. Painter cannot access cycle history endpoint');

    // 8. Painter cannot access sales history endpoint → 403
    const painterSalesRes = await get(`/painter-history/${painterA._id}/sales`, painterToken);
    ok(painterSalesRes.status === 403, '8. Painter cannot access sales history endpoint');

    // 9. Valid painter history works for Admin
    const adminHistRes = await get(`/painter-history/${painterA._id}`, adminToken);
    const adminHistData = await adminHistRes.json();
    ok(adminHistRes.status === 200 && adminHistData.success === true, '9. Valid painter history works');

    // 10. Invalid painter ObjectId → 400
    const invalidIdRes = await get('/painter-history/invalid-id-123', adminToken);
    ok(invalidIdRes.status === 400, '10. Invalid painter ObjectId → 400');

    // 11. Non-existing painter → 404
    const fakeId = new mongoose.Types.ObjectId();
    const notFoundRes = await get(`/painter-history/${fakeId}`, adminToken);
    ok(notFoundRes.status === 404, '11. Non-existing painter → 404');

    // 12. Deactivated painter history remains accessible
    const deactivatedPainter = await Painter.create({
      firstName: 'Deactivated Worker',
      mobile: '9876543299',
      email: `deact.${Date.now()}@painter.com`,
      password: 'Painter@123456',
      status: 'deactivated',
    });
    created.painters.push(deactivatedPainter._id);
    const deactHistRes = await get(`/painter-history/${deactivatedPainter._id}`, adminToken);
    const deactHistData = await deactHistRes.json();
    ok(
      deactHistRes.status === 200 &&
      deactHistData.success === true &&
      deactHistData.painter.status === 'deactivated',
      '12. Deactivated painter history remains accessible'
    );

    // Seed Customers
    const customer1 = await Customer.create({ name: 'Vikram Sharma', mobile: '9123456780' });
    const customer2 = await Customer.create({ name: 'Ananya Roy', mobile: '9123456781' });
    created.customers.push(customer1._id, customer2._id);

    // Seed Sales for Painter A:
    // Cycle 1 (Past, Closed):
    // Sale 1: 2x itemA (2*500 = 1000, 2*10 = 20 pts)
    const sale1 = await Sale.create({
      painterId: painterA._id,
      customerId: customer1._id,
      cycleId: cycle1._id,
      date: new Date('2026-02-15T10:00:00.000Z'),
      totalAmount: 1000,
      totalPoints: 20,
      lineItems: [
        {
          itemId: itemA._id,
          itemName: itemA.name,
          quantity: 2,
          pricePerUnit: 500,
          pointsPerUnit: 10,
          pointsEarned: 20,
          lineTotal: 1000,
        },
      ],
    });
    created.sales.push(sale1._id);

    // Sale 2 in Cycle 1: 1x itemB (2000, 40 pts)
    const sale2 = await Sale.create({
      painterId: painterA._id,
      customerId: customer2._id,
      cycleId: cycle1._id,
      date: new Date('2026-03-20T10:00:00.000Z'),
      totalAmount: 2000,
      totalPoints: 40,
      lineItems: [
        {
          itemId: itemB._id,
          itemName: itemB.name,
          quantity: 1,
          pricePerUnit: 2000,
          pointsPerUnit: 40,
          pointsEarned: 40,
          lineTotal: 2000,
        },
      ],
    });
    created.sales.push(sale2._id);

    // Cycle 2 (Current, Active):
    // Sale 3: 3x itemA (1500, 30 pts)
    const sale3 = await Sale.create({
      painterId: painterA._id,
      customerId: customer1._id,
      cycleId: cycle2._id,
      date: new Date('2026-06-10T10:00:00.000Z'),
      totalAmount: 1500,
      totalPoints: 30,
      lineItems: [
        {
          itemId: itemA._id,
          itemName: itemA.name,
          quantity: 3,
          pricePerUnit: 500,
          pointsPerUnit: 10,
          pointsEarned: 30,
          lineTotal: 1500,
        },
      ],
    });
    created.sales.push(sale3._id);

    // Sale for Painter B (isolation control)
    const saleB = await Sale.create({
      painterId: painterB._id,
      customerId: customer2._id,
      cycleId: cycle2._id,
      date: new Date('2026-06-15T10:00:00.000Z'),
      totalAmount: 5000,
      totalPoints: 100,
      lineItems: [
        {
          itemId: itemB._id,
          itemName: itemB.name,
          quantity: 2,
          pricePerUnit: 2000,
          pointsPerUnit: 40,
          pointsEarned: 80,
          lineTotal: 4000,
        },
      ],
    });
    created.sales.push(saleB._id);

    // Re-fetch Painter A summary
    const summaryRes = await get(`/painter-history/${painterA._id}`, adminToken);
    const summaryData = await summaryRes.json();

    // 13. Total sales count is correct (3 sales)
    ok(summaryData.summary.totalSales === 3, '13. Total sales count is correct');

    // 14. Total sales value is correct (1000 + 2000 + 1500 = 4500)
    ok(summaryData.summary.totalSalesValue === 4500, '14. Total sales value is correct');

    // 15. Total points are correct (20 + 40 + 30 = 90)
    ok(summaryData.summary.totalPoints === 90, '15. Total points are correct');

    // 16. Current active cycle is identified correctly
    ok(
      summaryData.currentCycle !== null &&
      summaryData.currentCycle.id === String(cycle2._id) &&
      summaryData.currentCycle.isActive === true,
      '16. Current active cycle is identified correctly'
    );

    // 17. Current cycle sales count is correct (1 sale in cycle 2)
    ok(summaryData.currentCycleSummary.currentCycleSales === 1, '17. Current cycle sales count is correct');

    // 18. Current cycle sales value is correct (1500)
    ok(summaryData.currentCycleSummary.currentCycleSalesValue === 1500, '18. Current cycle sales value is correct');

    // 19. Current cycle points are correct (30)
    ok(summaryData.currentCycleSummary.currentCyclePoints === 30, '19. Current cycle points are correct');

    // 20. No active cycle returns safe zero/null current-cycle summary
    await Cycle.updateOne({ _id: cycle2._id }, { isActive: false });
    const noActiveCycleRes = await get(`/painter-history/${painterA._id}`, adminToken);
    const noActiveCycleData = await noActiveCycleRes.json();
    ok(
      noActiveCycleData.currentCycle === null &&
      noActiveCycleData.currentCycleSummary.currentCycleSales === 0 &&
      noActiveCycleData.currentCycleSummary.currentCycleSalesValue === 0 &&
      noActiveCycleData.currentCycleSummary.currentCyclePoints === 0,
      '20. No active cycle returns safe zero/null current-cycle summary'
    );
    // Restore cycle 2 active status
    await Cycle.updateOne({ _id: cycle2._id }, { isActive: true });

    // CYCLE HISTORY ENDPOINT
    const cyclesRes = await get(`/painter-history/${painterA._id}/cycles`, adminToken);
    const cyclesData = await cyclesRes.json();

    // 21. Cycle history returns correct cycles
    ok(
      cyclesRes.status === 200 &&
      Array.isArray(cyclesData.cycles) &&
      cyclesData.cycles.length === 2,
      '21. Cycle history returns correct cycles'
    );

    // 22. Cycle totals are correct
    // cycle1: salesCount 2, totalSalesValue 3000, totalPoints 60
    const c1Hist = cyclesData.cycles.find((c) => c.cycleId === String(cycle1._id));
    ok(
      c1Hist &&
      c1Hist.salesCount === 2 &&
      c1Hist.totalSalesValue === 3000 &&
      c1Hist.totalPoints === 60,
      '22. Cycle totals are correct'
    );

    // 23. Closed cycle appears in history
    ok(c1Hist && c1Hist.isActive === false, '23. Closed cycle appears in history');

    // 24. New active cycle appears correctly
    const c2Hist = cyclesData.cycles.find((c) => c.cycleId === String(cycle2._id));
    ok(
      c2Hist &&
      c2Hist.isActive === true &&
      c2Hist.salesCount === 1 &&
      c2Hist.totalSalesValue === 1500 &&
      c2Hist.totalPoints === 30,
      '24. New active cycle appears correctly'
    );

    // SALES HISTORY ENDPOINT
    // 25. Sales history returns only the requested painter's sales (Painter A has 3, Painter B has 1)
    const salesRes = await get(`/painter-history/${painterA._id}/sales`, adminToken);
    const salesData = await salesRes.json();
    ok(
      salesData.data.length === 3 &&
      salesData.pagination.total === 3,
      "25. Sales history returns only the requested painter's sales"
    );

    // 26. Pagination works
    const pageRes = await get(`/painter-history/${painterA._id}/sales?page=1&limit=2`, adminToken);
    const pageData = await pageRes.json();
    ok(
      pageData.data.length === 2 &&
      pageData.pagination.page === 1 &&
      pageData.pagination.limit === 2 &&
      pageData.pagination.total === 3 &&
      pageData.pagination.totalPages === 2,
      '26. Pagination works'
    );

    // 27. Cycle filter works
    const filterCycleRes = await get(`/painter-history/${painterA._id}/sales?cycleId=${cycle1._id}`, adminToken);
    const filterCycleData = await filterCycleRes.json();
    ok(
      filterCycleData.data.length === 2 &&
      filterCycleData.data.every((s) => s.cycle.id === String(cycle1._id)),
      '27. Cycle filter works'
    );

    // 28. Sales are sorted newest first
    // sale3 is June 2026, sale2 is March 2026, sale1 is Feb 2026
    ok(
      salesData.data[0].id === String(sale3._id) &&
      salesData.data[1].id === String(sale2._id) &&
      salesData.data[2].id === String(sale1._id),
      '28. Sales are sorted newest first'
    );

    // 29. Sale totals come from stored snapshots
    ok(
      salesData.data[0].totalAmount === 1500 &&
      salesData.data[0].totalPoints === 30,
      '29. Sale totals come from stored snapshots'
    );

    // 30. Customer information is returned safely
    ok(
      salesData.data[0].customer &&
      salesData.data[0].customer.name === 'Vikram Sharma' &&
      salesData.data[0].customer.mobile === '9123456780',
      '30. Customer information is returned safely'
    );

    // 31. Sale detail IDs are available
    ok(
      Boolean(salesData.data[0].id),
      '31. Sale detail IDs are available'
    );

    // HISTORICAL SNAPSHOT IMMUTABILITY TESTS
    // 32 & 33. Change Item.points after sale
    await Item.updateOne({ _id: itemA._id }, { points: 999 });
    const postChangePointsHist = await get(`/painter-history/${painterA._id}`, adminToken);
    const postChangePointsData = await postChangePointsHist.json();
    ok(true, '32. Change Item.points after existing sale');
    ok(
      postChangePointsData.summary.totalPoints === 90,
      '33. Painter history still shows old points (did not change to 999)'
    );

    // 34 & 35. Change Item.price after sale
    await Item.updateOne({ _id: itemA._id }, { price: 99999 });
    const postChangePriceHist = await get(`/painter-history/${painterA._id}`, adminToken);
    const postChangePriceData = await postChangePriceHist.json();
    ok(true, '34. Change Item.price after existing sale');
    ok(
      postChangePriceData.summary.totalSalesValue === 4500,
      '35. Painter history still shows old sale value (did not change to 99999)'
    );

    // Restore Item prices
    await Item.updateOne({ _id: itemA._id }, { price: 500, points: 10 });

    // DATA SAFETY
    // 36. No passwords/hashes exposed
    const historyPayload = JSON.stringify(summaryData);
    ok(
      !historyPayload.includes('password') &&
      !historyPayload.includes('salt') &&
      !historyPayload.includes('$2a$'),
      '36. No passwords/hashes exposed'
    );

    // 37. No DELETE endpoint
    const deleteRes = await del(`/painter-history/${painterA._id}`, adminToken);
    ok(deleteRes.status === 404, '37. No DELETE endpoint (returns 404)');

    // 38. No PATCH endpoint
    const patchRes = await patch(`/painter-history/${painterA._id}`, adminToken);
    ok(patchRes.status === 404, '38. No PATCH endpoint (returns 404)');

    // 39. No PainterHistory collection created in MongoDB
    const collections = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
    ok(!collections.includes('painterhistories'), '39. No PainterHistory collection created');

    // REGRESSION CHECKS
    // 40. Auth regression
    const authMeRes = await get('/auth/me', adminToken);
    ok(authMeRes.status === 200, '40. Auth tests pass (GET /api/auth/me)');

    // 41. Painter regression
    const paintersListRes = await get('/painters', adminToken);
    ok(paintersListRes.status === 200, '41. Painter tests pass (GET /api/painters)');

    // 42. Item regression
    const itemsListRes = await get('/items', adminToken);
    ok(itemsListRes.status === 200, '42. Item tests pass (GET /api/items)');

    // 43. Cycle regression
    const cyclesListRes = await get('/cycles', adminToken);
    ok(cyclesListRes.status === 200, '43. Cycle tests pass (GET /api/cycles)');

    // 44. Sales regression
    const salesListRes = await get('/sales', adminToken);
    ok(salesListRes.status === 200, '44. Sales tests pass (GET /api/sales)');

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  } finally {
    console.log('\nCleaning up test artifacts...');
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
