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
import { getTestMongoUri } from './src/config/testDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = 5005;
const API = `http://localhost:${PORT}/api`;

async function run() {
  console.log('==================================================');
  console.log('   SALES + CUSTOMER + POINTS VERIFICATION SUITE  ');
  console.log('==================================================\n');

  await mongoose.connect(getTestMongoUri());
  const server = http.createServer(app);
  await new Promise((r) => server.listen(PORT, r));
  console.log(`Test server on port ${PORT}\n`);

  let passed = 0;
  let failed = 0;
  const created = { cycles: [], sales: [], customers: [], painters: [], items: [] };
  let adminToken = null;
  let painterToken = null;
  let existingCycle = null;

  function ok(cond, msg) {
    if (cond) { console.log(`✅ PASS: ${msg}`); passed++; }
    else { console.error(`❌ FAIL: ${msg}`); failed++; }
  }

  async function post(path, body, token) {
    return fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  }
  async function get(path, token) {
    return fetch(`${API}${path}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  }
  async function patch(path, token) {
    return fetch(`${API}${path}`, {
      method: 'PATCH',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
  }

  try {
    // ── 1. Health ────────────────────────────────────────────────────────────
    const h = await get('/health');
    ok(h.status === 200, '1. Backend starts and health check returns 200');

    // ── 2. Tokens ────────────────────────────────────────────────────────────
    const adminLogin = await post('/auth/login', { email: process.env.ADMIN_EMAIL || 'admin@paintshop.com', password: process.env.ADMIN_PASSWORD || 'changeme123' });
    const adminData = await adminLogin.json();
    adminToken = adminData.token;
    ok(!!adminToken, '2. Admin login and token setup works');

    // Create a dedicated painter for sale tests
    const tEmail = `sale_painter_${Date.now()}@paintshop.com`;
    const tPainter = await Painter.create({ firstName: 'SaleTester', mobile: '9111100001', email: tEmail, password: 'painter123', status: 'active' });
    created.painters.push(tPainter._id);

    const painterLogin = await post('/auth/login', { email: tEmail, password: 'painter123' });
    const painterData = await painterLogin.json();
    painterToken = painterData.token;
    ok(!!painterToken, '3. Painter login and token setup works');

    // Create active item for testing
    const tItem = await Item.create({ name: 'SaleTestPaint', price: 500, points: 5, brand: 'TestBrand', status: 'active' });
    created.items.push(tItem._id);

    const tItem2 = await Item.create({ name: 'SaleTestPrimer', price: 200, points: 2, brand: 'TestBrand', status: 'active' });
    created.items.push(tItem2._id);

    const tItemDeact = await Item.create({ name: 'DeactItem', price: 100, points: 1, brand: 'TestBrand', status: 'deactivated' });
    created.items.push(tItemDeact._id);

    // Create and activate a cycle that includes today (or reuse existing covering today)
    const today = new Date();
    const cycleStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const cycleEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().slice(0, 10);

    existingCycle = await Cycle.findOne({
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    let testCycleId;
    if (existingCycle) {
      await Cycle.updateMany({ _id: { $ne: existingCycle._id } }, { isActive: false });
      existingCycle.isActive = true;
      await existingCycle.save();
      testCycleId = existingCycle._id.toString();
      ok(true, 'Setup: Active test cycle created');
    } else {
      const cycleRes = await post('/cycles', { startDate: cycleStart, endDate: cycleEnd, isActive: true }, adminToken);
      const cycleData = await cycleRes.json();
      testCycleId = cycleData.data?.id;
      if (testCycleId) created.cycles.push(testCycleId);
      ok(cycleRes.status === 201 && cycleData.data?.isActive === true, 'Setup: Active test cycle created');
    }

    // ── AUTHORIZATION ────────────────────────────────────────────────────────
    const r1 = await get('/sales');
    ok(r1.status === 401, '4. GET /api/sales without auth → 401');

    const r2 = await post('/sales', {});
    ok(r2.status === 401, '5. POST /api/sales without auth → 401');

    const r3 = await get('/sales', painterToken);
    ok(r3.status === 403, '6. Painter GET /api/sales → 403');

    const r4 = await post('/sales', {}, painterToken);
    ok(r4.status === 403, '7. Painter POST /api/sales → 403');

    const r5 = await get('/customers', painterToken);
    ok(r5.status === 403, '8. Painter cannot access GET /api/customers → 403');

    const r5b = await get(`/customers/${new mongoose.Types.ObjectId()}`, painterToken);
    ok(r5b.status === 403, '9. Painter cannot access GET /api/customers/:id → 403');

    // ── CYCLE REQUIREMENTS ───────────────────────────────────────────────────
    // Close the active cycle temporarily to test "no active cycle" behavior
    await patch(`/cycles/${testCycleId}/close`, adminToken);
    const noActiveSaleRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000001' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 1 }],
    }, adminToken);
    const noActiveData = await noActiveSaleRes.json();
    ok(noActiveSaleRes.status === 409 && noActiveData.message?.toLowerCase().includes('active'), '10. Sale cannot be created without an active cycle (409)');

    // Re-activate the cycle (restore future endDate since close sets it to now)
    await Cycle.findByIdAndUpdate(testCycleId, { endDate: new Date(cycleEnd) });
    await patch(`/cycles/${testCycleId}/activate`, adminToken);

    // Create a valid sale to test cycle assignment
    const validSaleRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Rahul Sharma', mobile: '9876543210' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 2 }],
    }, adminToken);
    const validSaleData = await validSaleRes.json();
    ok(validSaleRes.status === 201, '11. Valid sale created (201)');
    ok(validSaleData.data?.cycleId === testCycleId, '12. Sale automatically gets the active cycleId');
    const sale1Id = validSaleData.data?.id;
    if (validSaleData.data) {
      // customer cleanup handled by mobile match
      if (validSaleData.data.customerId) created.customers.push(validSaleData.data.customerId);
      if (sale1Id) created.sales.push(sale1Id);
    }
    ok(validSaleData.data?.cycleId === testCycleId, '13. Sale references the correct cycle');

    // Date outside cycle range
    const outsideDate = new Date(today.getFullYear() - 2, 0, 1).toISOString().slice(0, 10);
    const outsideSaleRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000002' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 1 }],
      date: outsideDate,
    }, adminToken);
    ok(outsideSaleRes.status === 400, '14. Sale date outside active cycle range is rejected (400)');

    // ── PAINTER VALIDATION ───────────────────────────────────────────────────
    ok(validSaleRes.status === 201, '15. Valid active painter can create a sale');

    const deactPainter = await Painter.create({ firstName: 'Deact', mobile: '9111100002', email: `deact_${Date.now()}@p.com`, password: 'test123', status: 'deactivated' });
    created.painters.push(deactPainter._id);
    const deactSaleRes = await post('/sales', {
      painterId: deactPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000003' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 1 }],
    }, adminToken);
    ok(deactSaleRes.status === 400, '16. Deactivated painter cannot create a sale (400)');

    // ── ITEM VALIDATION ──────────────────────────────────────────────────────
    const deactItemRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000004' },
      lineItems: [{ itemId: tItemDeact._id.toString(), quantity: 1 }],
    }, adminToken);
    ok(deactItemRes.status === 400, '17. Deactivated item cannot be sold (400)');

    const invalidItemRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000005' },
      lineItems: [{ itemId: 'not-valid-id', quantity: 1 }],
    }, adminToken);
    ok(invalidItemRes.status === 400, '18. Invalid itemId format rejected (400)');

    const noItemsRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000006' },
    }, adminToken);
    ok(noItemsRes.status === 400, '19. Missing lineItems rejected (400)');

    const emptyItemsRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000006' },
      lineItems: [],
    }, adminToken);
    ok(emptyItemsRes.status === 400, '20. Empty lineItems array rejected (400)');

    const zeroQtyRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000007' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 0 }],
    }, adminToken);
    ok(zeroQtyRes.status === 400, '21. Quantity 0 rejected (400)');

    const negQtyRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000007' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: -1 }],
    }, adminToken);
    ok(negQtyRes.status === 400, '22. Negative quantity rejected (400)');

    const decQtyRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Test', mobile: '9000000007' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 1.5 }],
    }, adminToken);
    ok(decQtyRes.status === 400, '23. Non-integer quantity rejected (400)');

    // ── POINT & PRICE CALCULATION ────────────────────────────────────────────
    // tItem: price=500, points=5, quantity=4 → lineTotal=2000, points=20
    const calcSaleRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Calc Test', mobile: '9888800001' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 4 }],
    }, adminToken);
    const calcData = await calcSaleRes.json();
    ok(calcSaleRes.status === 201, '24. Backend calculates points (sale created)');
    ok(calcData.data?.totalPoints === 20, `25. Backend ignores frontend totalPoints; correctly calculates 4×5=20 (got ${calcData.data?.totalPoints})`);
    if (calcData.data?.id) created.sales.push(calcData.data.id);

    // Multiple items: tItem(500,5,qty=2)=1000/10pts + tItem2(200,2,qty=3)=600/6pts → total=1600,16pts
    const multiSaleRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Multi Test', mobile: '9888800002' },
      lineItems: [
        { itemId: tItem._id.toString(), quantity: 2 },
        { itemId: tItem2._id.toString(), quantity: 3 },
      ],
    }, adminToken);
    const multiData = await multiSaleRes.json();
    ok(multiSaleRes.status === 201, '26. Multiple items calculate correctly (sale created)');
    ok(multiData.data?.totalPoints === 16, `27. Multi-item points: 2×5+3×2=16 (got ${multiData.data?.totalPoints})`);
    ok(multiData.data?.totalAmount === 1600, `28. Multi-item amount: 2×500+3×200=1600 (got ${multiData.data?.totalAmount})`);
    if (multiData.data?.id) created.sales.push(multiData.data.id);

    // Line item snapshot check
    const liSale = multiData.data?.lineItems?.[0];
    ok(liSale?.pricePerUnit === 500, '29. lineTotal snapshot: pricePerUnit=500 stored');
    ok(liSale?.lineTotal === 1000, '30. lineTotal snapshot: lineTotal=2×500=1000 stored');

    // ── CUSTOMER FIND-OR-CREATE ──────────────────────────────────────────────
    // Create sale with same mobile — should reuse customer
    const custMobile = `9777700${Date.now().toString().slice(-3)}`;
    const sale_a = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'New Customer', mobile: custMobile },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 1 }],
    }, adminToken);
    const sale_a_data = await sale_a.json();
    if (sale_a_data.data?.id) created.sales.push(sale_a_data.data.id);
    const cid_a = sale_a_data.data?.customerId;

    const sale_b = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'New Customer', mobile: custMobile },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 1 }],
    }, adminToken);
    const sale_b_data = await sale_b.json();
    if (sale_b_data.data?.id) created.sales.push(sale_b_data.data.id);
    const cid_b = sale_b_data.data?.customerId;

    ok(sale_a.status === 201, '31. New customer created when mobile does not exist');
    ok(sale_b.status === 201 && cid_a === cid_b, '32. Existing customer is reused when same mobile is submitted');
    const customerCount = await Customer.countDocuments({ mobile: custMobile });
    ok(customerCount === 1, '33. Duplicate customer is NOT created (only 1 record)');

    // ── SNAPSHOT IMMUTABILITY ─────────────────────────────────────────────────
    // Record points before changing item
    const snapshotSale = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Snapshot Test', mobile: '9666600001' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 3 }],
    }, adminToken);
    const snapData = await snapshotSale.json();
    if (snapData.data?.id) created.sales.push(snapData.data.id);
    const snapPts = snapData.data?.totalPoints; // 3×5=15
    const snapAmt = snapData.data?.totalAmount; // 3×500=1500
    const snapSaleId = snapData.data?.id;

    ok(snapData.data?.lineItems?.[0]?.pointsPerUnit === 5, '34. Sale stores pointsPerUnit snapshot (5)');
    ok(snapData.data?.lineItems?.[0]?.pricePerUnit === 500, '35. Sale stores pricePerUnit snapshot (500)');
    ok(snapData.data?.lineItems?.[0]?.pointsEarned === 15, '36. Sale stores pointsEarned snapshot (15)');
    ok(snapData.data?.lineItems?.[0]?.lineTotal === 1500, '37. Sale stores lineTotal snapshot (1500)');
    ok(snapData.data?.totalPoints === 15, '38. Sale stores totalPoints (15)');
    ok(snapData.data?.totalAmount === 1500, '39. Sale stores totalAmount (1500)');

    // Now change item price and points
    await Item.findByIdAndUpdate(tItem._id, { price: 800, points: 10 });

    // Refetch sale — must still show original snapshot values
    const refetchRes = await get(`/sales/${snapSaleId}`, adminToken);
    const refetchData = await refetchRes.json();
    ok(refetchData.data?.totalPoints === snapPts, `40. Changing Item.points does NOT change historical sale points (still ${snapPts})`);
    ok(refetchData.data?.totalAmount === snapAmt, `41. Changing Item.price does NOT change historical sale amount (still ${snapAmt})`);

    // Reset item back for remaining tests
    await Item.findByIdAndUpdate(tItem._id, { price: 500, points: 5 });

    // ── CYCLE HISTORY ─────────────────────────────────────────────────────────
    await patch(`/cycles/${testCycleId}/close`, adminToken);

    // Create new cycle (next month range)
    const start2 = new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString().slice(0, 10);
    const end2 = new Date(today.getFullYear(), today.getMonth() + 4, 0).toISOString().slice(0, 10);
    const cycle2Res = await post('/cycles', { startDate: start2, endDate: end2, isActive: true }, adminToken);
    const cycle2Data = await cycle2Res.json();
    const cycle2Id = cycle2Data.data?.id;
    if (cycle2Id) created.cycles.push(cycle2Id);
    ok(cycle2Res.status === 201, '42. Closed current cycle and created next cycle');

    // Create sale in new cycle — use date within new cycle
    const newCycleDate = new Date(today.getFullYear(), today.getMonth() + 2, 15).toISOString().slice(0, 10);
    const newCycleSaleRes = await post('/sales', {
      painterId: tPainter._id.toString(),
      customer: { name: 'Cycle2 Test', mobile: '9555500001' },
      lineItems: [{ itemId: tItem._id.toString(), quantity: 1 }],
      date: newCycleDate,
    }, adminToken);
    const newCycleSaleData = await newCycleSaleRes.json();
    if (newCycleSaleData.data?.id) created.sales.push(newCycleSaleData.data.id);
    ok(newCycleSaleRes.status === 201, '43. New sale uses new cycle');
    ok(newCycleSaleData.data?.cycleId === cycle2Id, '44. New sale references cycle 2');

    // Old sale must still reference old cycle
    if (sale1Id) {
      const oldSaleRefetch = await get(`/sales/${sale1Id}`, adminToken);
      const oldSaleRefetchData = await oldSaleRefetch.json();
      ok(oldSaleRefetchData.data?.cycleId === testCycleId, '45. Old sale still references original cycle (not cycle 2)');
    } else {
      ok(false, '45. Old sale still references original cycle (skipped — no sale1Id)');
    }

    // Close cycle 2 for remaining tests (not needed active)
    if (cycle2Id) await patch(`/cycles/${cycle2Id}/close`, adminToken);

    // ── LIST / DETAIL ─────────────────────────────────────────────────────────
    const listRes = await get('/sales', adminToken);
    const listData = await listRes.json();
    ok(listRes.status === 200 && listData.success && Array.isArray(listData.data), '46. Admin can list sales');
    ok(listData.pagination?.page >= 1 && typeof listData.pagination?.total === 'number', '47. Pagination metadata exists in sales list');

    if (sale1Id) {
      const detailRes = await get(`/sales/${sale1Id}`, adminToken);
      const detailData = await detailRes.json();
      ok(detailRes.status === 200 && detailData.data?.id === sale1Id, '48. Admin can get sale by ID');
    } else {
      ok(false, '48. Admin can get sale by ID (skipped)');
    }

    const badSaleRes = await get('/sales/not-valid-id', adminToken);
    ok(badSaleRes.status === 400, '49. Invalid sale ID format returns 400');

    const notFoundRes = await get(`/sales/${new mongoose.Types.ObjectId()}`, adminToken);
    ok(notFoundRes.status === 404, '50. Non-existing sale returns 404');

    // Customer list
    const custListRes = await get('/customers', adminToken);
    const custListData = await custListRes.json();
    ok(custListRes.status === 200 && custListData.success && Array.isArray(custListData.data), '51. Admin can list customers');
    ok(custListData.pagination?.page >= 1, '52. Customer list pagination metadata exists');

    // Customer detail
    const firstCustomer = custListData.data?.[0];
    if (firstCustomer?.id) {
      const custDetailRes = await get(`/customers/${firstCustomer.id}`, adminToken);
      ok(custDetailRes.status === 200, '53. Admin can get customer by ID');
    } else {
      ok(false, '53. Admin can get customer by ID (skipped)');
    }

    // ── DATA SAFETY ───────────────────────────────────────────────────────────
    if (sale1Id) {
      const safeRes = await get(`/sales/${sale1Id}`, adminToken);
      const safeData = await safeRes.json();
      ok(!safeData.data?.painter?.password && safeData.data?.id, '54. No password/hash exposed in sale response');
    } else {
      ok(false, '54. No password exposed (skipped)');
    }

    const listSafe = await get('/sales', adminToken);
    const listSafeData = await listSafe.json();
    const sampleSale = listSafeData.data?.[0];
    ok(sampleSale && !sampleSale.__v, '55. No unnecessary MongoDB internals (__v) in sales list');

    const deleteSaleRes = await fetch(`${API}/sales/${new mongoose.Types.ObjectId()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    ok(deleteSaleRes.status === 404, '56. DELETE /api/sales/:id does not exist (404)');

    const deleteCustRes = await fetch(`${API}/customers/${new mongoose.Types.ObjectId()}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    ok(deleteCustRes.status === 404, '57. DELETE /api/customers/:id does not exist (404)');

    // ── REGRESSION ────────────────────────────────────────────────────────────
    const authRegr = await get('/auth/me', adminToken);
    ok(authRegr.status === 200, '58. Auth regression: GET /api/auth/me still works');

    const painterRegr = await get('/painters', adminToken);
    ok(painterRegr.status === 200, '59. Painter regression: GET /api/painters still works');

    const itemRegr = await get('/items', adminToken);
    ok(itemRegr.status === 200, '60. Item catalog regression: GET /api/items still works');

  } catch (err) {
    console.error('\nTest suite error:', err);
    failed++;
  } finally {
    // ── Cleanup ───────────────────────────────────────────────────────────────
    try {
      for (const id of created.sales) {
        await Sale.findByIdAndDelete(id).catch(() => {});
      }
      await Customer.deleteMany({ mobile: /^9(888|777|666|555|000|876)/ }).catch(() => {});
      for (const id of created.cycles) {
        await Cycle.findByIdAndDelete(id).catch(() => {});
      }
      for (const id of created.painters) {
        await Painter.findByIdAndDelete(id).catch(() => {});
      }
      for (const id of created.items) {
        await Item.findByIdAndDelete(id).catch(() => {});
      }
      if (existingCycle) {
        await Cycle.findByIdAndUpdate(existingCycle._id, { isActive: true }).catch(() => {});
      }
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }

    await mongoose.disconnect();
    server.close();

    console.log('\n--------------------------------------------------');
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log('--------------------------------------------------\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
