import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Company from './src/models/Company.js';
import Painter from './src/models/Painter.js';
import Sale from './src/models/Sale.js';
import RewardTier from './src/models/RewardTier.js';
import Cycle from './src/models/Cycle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API = 'http://localhost:5000/api';

async function verifyManualChecklist() {
  console.log('==================================================');
  console.log('   PART 9 — SECTION 31 MANUAL CHECKLIST VERIFY    ');
  console.log('==================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/paintshop_dev');

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`✅ [STEP PASSED] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [STEP FAILED] ${msg}`);
      failed++;
    }
  }

  // Helper fetch functions
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

  let adminToken = null;
  let painterToken = null;
  let asianPaintsId = null;
  let bergerPaintsId = null;
  let testPainterId = null;

  try {
    // Record baseline state
    const baselineSales = await Sale.countDocuments();
    const baselinePainters = await Painter.countDocuments();
    const baselineCycles = await Cycle.countDocuments();
    const baselineTiers = await RewardTier.countDocuments();

    // Clean up any test companies from prior manual runs
    await Company.deleteMany({ name: { $in: ['Asian Paints', 'Berger Paints', 'asian paints', 'ASIAN PAINTS', 'Asian Paints Updated'] } });

    // 1. Login as Admin
    const adminLoginRes = await post('/auth/login', {
      email: process.env.ADMIN_EMAIL || 'admin@paintshop.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123456',
    });
    const adminData = await adminLoginRes.json();
    adminToken = adminData.token;
    assert(adminLoginRes.status === 200 && adminToken, '1. Login as Admin');

    // 2. Open /admin/companies (GET /api/companies)
    const listRes = await get('/companies', adminToken);
    const listData = await listRes.json();
    assert(listRes.status === 200 && listData.success === true, '2. Open /admin/companies API');

    // 3. Verify stats render
    assert(
      listData.counts &&
        typeof listData.counts.total === 'number' &&
        typeof listData.counts.active === 'number' &&
        typeof listData.counts.deactivated === 'number',
      `3. Verify stats render (total: ${listData.counts.total}, active: ${listData.counts.active}, deactivated: ${listData.counts.deactivated})`
    );

    // 4. Verify All / Active / Deactivated filters
    const allRes = await get('/companies?status=all', adminToken);
    const actRes = await get('/companies?status=active', adminToken);
    const deactRes = await get('/companies?status=deactivated', adminToken);
    assert(
      allRes.status === 200 && actRes.status === 200 && deactRes.status === 200,
      '4. Verify All / Active / Deactivated filters respond correctly'
    );

    // 5. Create: Asian Paints
    const createAsian = await post(
      '/companies',
      { name: 'Asian Paints', details: 'Primary paint supplier' },
      adminToken
    );
    const asianData = await createAsian.json();
    asianPaintsId = asianData.data?.id;
    assert(createAsian.status === 201 && asianData.data?.name === 'Asian Paints', '5. Create: Asian Paints');

    // 6. Create: Berger Paints
    const createBerger = await post(
      '/companies',
      { name: 'Berger Paints', details: 'Secondary paint supplier' },
      adminToken
    );
    const bergerData = await createBerger.json();
    bergerPaintsId = bergerData.data?.id;
    assert(createBerger.status === 201 && bergerData.data?.name === 'Berger Paints', '6. Create: Berger Paints');

    // 7. Search: Asian
    const searchRes = await get('/companies?search=Asian', adminToken);
    const searchData = await searchRes.json();
    const hasAsian = searchData.data?.some((c) => c.name === 'Asian Paints');
    const hasBerger = searchData.data?.some((c) => c.name === 'Berger Paints');
    assert(searchRes.status === 200 && hasAsian && !hasBerger, '7. Search: Asian returns only Asian Paints');

    // 8. Edit Asian Paints
    const editRes = await patch(
      `/companies/${asianPaintsId}`,
      { details: 'Primary paint supplier & incentive partner' },
      adminToken
    );
    const editData = await editRes.json();
    assert(
      editRes.status === 200 &&
        editData.data?.details === 'Primary paint supplier & incentive partner',
      '8. Edit Asian Paints'
    );

    // 9. Deactivate Asian Paints
    const deactAsianRes = await patch(`/companies/${asianPaintsId}/deactivate`, {}, adminToken);
    const deactAsianData = await deactAsianRes.json();
    assert(deactAsianRes.status === 200 && deactAsianData.data?.status === 'deactivated', '9. Deactivate Asian Paints');

    // 10. Confirm it disappears from Active filter
    const activeCheckRes = await get('/companies?status=active', adminToken);
    const activeCheckData = await activeCheckRes.json();
    const asianInActive = activeCheckData.data?.some((c) => c.id === asianPaintsId);
    assert(!asianInActive, '10. Confirm Asian Paints disappears from Active filter');

    // 11. Open Deactivated filter
    const deactCheckRes = await get('/companies?status=deactivated', adminToken);
    const deactCheckData = await deactCheckRes.json();
    const asianInDeact = deactCheckData.data?.some((c) => c.id === asianPaintsId);
    assert(deactCheckRes.status === 200 && asianInDeact, '11 & 12. Open Deactivated filter and confirm Asian Paints remains there');

    // 13. Reactivate Asian Paints
    const reactAsianRes = await patch(`/companies/${asianPaintsId}/activate`, {}, adminToken);
    const reactAsianData = await reactAsianRes.json();
    assert(reactAsianRes.status === 200 && reactAsianData.data?.status === 'active', '13. Reactivate Asian Paints');

    // 14 & 15. Attempt to create another "asian paints" -> Confirm duplicate is rejected
    const dupLowerRes = await post('/companies', { name: 'asian paints' }, adminToken);
    const dupLowerData = await dupLowerRes.json();
    assert(
      dupLowerRes.status === 400 && dupLowerData.message?.includes('already exists'),
      '14 & 15. Attempt to create another "asian paints" and confirm duplicate is rejected'
    );

    // 16 & 17. Attempt case variation: "ASIAN PAINTS" -> Confirm duplicate is rejected
    const dupUpperRes = await post('/companies', { name: 'ASIAN PAINTS' }, adminToken);
    const dupUpperData = await dupUpperRes.json();
    assert(
      dupUpperRes.status === 400 && dupUpperData.message?.includes('already exists'),
      '16 & 17. Attempt case variation "ASIAN PAINTS" and confirm duplicate is rejected'
    );

    // 18. Verify DELETE endpoint returns 404
    const delRes = await del(`/companies/${asianPaintsId}`, adminToken);
    assert(delRes.status === 404, '18. Verify DELETE endpoint returns 404');

    // 19. Login as Painter
    let painter = await Painter.findOne({ email: 'painter.manual@paintshop.com' });
    if (!painter) {
      painter = await Painter.create({
        firstName: 'Manual Painter',
        mobile: '9900112233',
        email: 'painter.manual@paintshop.com',
        password: 'Painter@123456',
        status: 'active',
      });
    }
    testPainterId = painter._id;

    const painterLogin = await post('/auth/login', {
      email: 'painter.manual@paintshop.com',
      password: 'Painter@123456',
    });
    const painterData = await painterLogin.json();
    painterToken = painterData.token;
    assert(painterLogin.status === 200 && painterToken, '19. Login as Painter');

    // 20. Verify Company Management APIs return 403 for Painter
    const painterGet = await get('/companies', painterToken);
    const painterPost = await post('/companies', { name: 'Unauthorized' }, painterToken);
    const painterPatch = await patch(`/companies/${asianPaintsId}`, { name: 'Unauthorized' }, painterToken);
    const painterDeact = await patch(`/companies/${asianPaintsId}/deactivate`, {}, painterToken);
    const painterAct = await patch(`/companies/${asianPaintsId}/activate`, {}, painterToken);
    assert(
      painterGet.status === 403 &&
        painterPost.status === 403 &&
        painterPatch.status === 403 &&
        painterDeact.status === 403 &&
        painterAct.status === 403,
      '20. Verify Company Management APIs return 403 for Painter'
    );

    // 21. Verify existing Painter History still works
    const historyRes = await get(`/painter-history/${painter._id}`, adminToken);
    assert(historyRes.status === 200, '21. Verify existing Painter History still works');

    // 22. Verify Reward Tier page still works
    const tiersRes = await get('/reward-tiers', adminToken);
    assert(tiersRes.status === 200, '22. Verify Reward Tier API still works');

    // 23. Verify existing Sales pages still work
    const salesRes = await get('/sales', adminToken);
    assert(salesRes.status === 200, '23. Verify existing Sales API still works');

    // 24. Verify no historical data changed
    const currentSales = await Sale.countDocuments();
    const currentCycles = await Cycle.countDocuments();
    const currentTiers = await RewardTier.countDocuments();
    assert(
      currentSales === baselineSales &&
        currentCycles === baselineCycles &&
        currentTiers === baselineTiers,
      '24. Verify no historical data changed (Sales, Cycles, Tiers counts unchanged)'
    );

  } catch (err) {
    console.error('Error during manual checklist verification:', err);
    failed++;
  } finally {
    // Cleanup created test records
    try {
      if (asianPaintsId) await Company.findByIdAndDelete(asianPaintsId);
      if (bergerPaintsId) await Company.findByIdAndDelete(bergerPaintsId);
      if (testPainterId) await Painter.findByIdAndDelete(testPainterId);
    } catch (cleanErr) {
      console.error('Cleanup error:', cleanErr);
    }

    await mongoose.disconnect();

    console.log('\n--------------------------------------------------');
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log('--------------------------------------------------\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

verifyManualChecklist();
