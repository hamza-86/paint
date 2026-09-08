import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './src/app.js';
import Company from './src/models/Company.js';
import CompanyRewardEntry from './src/models/CompanyRewardEntry.js';
import Painter from './src/models/Painter.js';
import Cycle from './src/models/Cycle.js';
import Sale from './src/models/Sale.js';
import RewardTier from './src/models/RewardTier.js';
import { getTestMongoUri } from './src/config/testDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = 5008;
const API = `http://localhost:${PORT}/api`;

async function run() {
  console.log('==================================================');
  console.log('   PART 9 — COMPANY MANAGEMENT VERIFICATION       ');
  console.log('==================================================\n');

  await mongoose.connect(getTestMongoUri());
  const server = http.createServer(app);
  await new Promise((r) => server.listen(PORT, r));
  console.log(`Test server running on port ${PORT}\n`);

  let passed = 0;
  let failed = 0;
  const created = {
    companies: [],
    painters: [],
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
    // Record baseline counts for data safety verification
    const baselineSalesCount = await Sale.countDocuments();
    const baselinePaintersCount = await Painter.countDocuments();
    const baselineTiersCount = await RewardTier.countDocuments();
    const baselineCyclesCount = await Cycle.countDocuments();
    const baselineRewardEntriesCount = await CompanyRewardEntry.countDocuments();

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

    // Create Painter for testing role authorization
    const painterA = await Painter.create({
      firstName: 'CompanyTester Painter',
      mobile: '9888877799',
      email: `companytest.${Date.now()}@painter.com`,
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
    const unauthRes = await get('/companies');
    ok(unauthRes.status === 401, '4. Unauthenticated GET returns 401');

    // 5. Painter GET returns 403
    const painterGetRes = await get('/companies', painterToken);
    ok(painterGetRes.status === 403, '5. Painter GET returns 403');

    // 6. Painter POST returns 403
    const painterPostRes = await post('/companies', { name: 'Unauthorized Paints' }, painterToken);
    ok(painterPostRes.status === 403, '6. Painter POST returns 403');

    // 7. Painter PATCH returns 403
    const dummyId = new mongoose.Types.ObjectId();
    const painterPatchRes = await patch(`/companies/${dummyId}`, { name: 'New Name' }, painterToken);
    ok(painterPatchRes.status === 403, '7. Painter PATCH returns 403');

    // ── B. Company CRUD ───────────────────────────────────────────────────────
    // Clean any prior test companies with prefix "TestComp_"
    await Company.deleteMany({ name: { $regex: /^TestComp_/ } });

    // 8. Admin GET companies
    const adminGetRes = await get('/companies', adminToken);
    const adminGetData = await adminGetRes.json();
    ok(adminGetRes.status === 200 && adminGetData.success === true && Array.isArray(adminGetData.data), '8. Admin GET companies succeeds');

    // 10. Create valid company
    const createRes = await post(
      '/companies',
      {
        name: 'TestComp_Asian Paints',
        details: 'Primary paint manufacturer and distributor',
      },
      adminToken
    );
    const createData = await createRes.json();
    ok(createRes.status === 201 && createData.success === true, '10. Create valid company returns 201');

    const createdCompany = createData.data;
    if (createdCompany?.id || createdCompany?._id) {
      created.companies.push(createdCompany.id || createdCompany._id);
    }

    // 11. Verify returned company fields
    const hasRequiredFields =
      createdCompany &&
      createdCompany.id &&
      createdCompany.name === 'TestComp_Asian Paints' &&
      createdCompany.details === 'Primary paint manufacturer and distributor' &&
      createdCompany.status === 'active' &&
      createdCompany.createdAt &&
      createdCompany.updatedAt;
    ok(hasRequiredFields, '11. Verify returned company fields (id, name, details, status, timestamps)');

    // 9. Admin GET single company
    const singleRes = await get(`/companies/${createdCompany.id}`, adminToken);
    const singleData = await singleRes.json();
    ok(singleRes.status === 200 && singleData.data?.name === 'TestComp_Asian Paints', '9. Admin GET single company works');

    // 12. Update company
    const updateRes = await patch(
      `/companies/${createdCompany.id}`,
      {
        name: 'TestComp_Asian Paints India',
        details: 'Updated distributor information',
      },
      adminToken
    );
    const updateData = await updateRes.json();
    ok(updateRes.status === 200 && updateData.success === true, '12. Update company returns 200');

    // 13. Verify update
    ok(
      updateData.data?.name === 'TestComp_Asian Paints India' &&
        updateData.data?.details === 'Updated distributor information',
      '13. Verify update modified fields successfully'
    );

    // Create a second company for search, pagination, and sorting tests
    const createSecondRes = await post(
      '/companies',
      {
        name: 'TestComp_Berger Paints',
        details: 'Secondary paint manufacturer',
      },
      adminToken
    );
    const secondData = await createSecondRes.json();
    if (secondData.data?.id) {
      created.companies.push(secondData.data.id);
    }

    // 14. Search by name
    const searchRes = await get('/companies?search=berger', adminToken);
    const searchData = await searchRes.json();
    const foundBerger = searchData.data?.some((c) => c.name === 'TestComp_Berger Paints');
    const notFoundAsian = !searchData.data?.some((c) => c.name === 'TestComp_Asian Paints India');
    ok(searchRes.status === 200 && foundBerger && notFoundAsian, '14. Search by name returns filtered matches');

    // 15. Pagination metadata
    const pageRes = await get('/companies?page=1&limit=1', adminToken);
    const pageData = await pageRes.json();
    ok(
      pageRes.status === 200 &&
        pageData.pagination?.page === 1 &&
        pageData.pagination?.limit === 1 &&
        pageData.pagination?.total >= 2 &&
        pageData.pagination?.totalPages >= 2 &&
        pageData.data.length === 1,
      '15. Pagination metadata contains page, limit, total, totalPages'
    );

    // 16. Sorting by name
    const sortRes = await get('/companies?search=TestComp_&limit=10', adminToken);
    const sortData = await sortRes.json();
    const names = (sortData.data || []).map((c) => c.name);
    const isSorted = names.every((val, i, arr) => !i || arr[i - 1].localeCompare(val) <= 0);
    ok(sortRes.status === 200 && isSorted && names.length >= 2, '16. Sorting by name is ascending');

    // ── C. Validation ─────────────────────────────────────────────────────────
    // 17. Reject missing name
    const missingNameRes = await post('/companies', { details: 'No name' }, adminToken);
    ok(missingNameRes.status === 400, '17. Reject missing name');

    // 18. Reject blank name
    const blankNameRes = await post('/companies', { name: '   ' }, adminToken);
    ok(blankNameRes.status === 400, '18. Reject blank name');

    // 19. Reject invalid input (excessive length > 120 chars)
    const longName = 'A'.repeat(125);
    const longNameRes = await post('/companies', { name: longName }, adminToken);
    ok(longNameRes.status === 400, '19. Reject invalid input (name > 120 chars)');

    // 20. Reject duplicate active company
    const dupRes = await post('/companies', { name: 'TestComp_Berger Paints' }, adminToken);
    const dupData = await dupRes.json();
    ok(dupRes.status === 400 && dupData.message?.includes('already exists'), '20. Reject duplicate active company');

    // 21. Duplicate detection is case-insensitive
    const caseDupRes = await post('/companies', { name: 'testcomp_berger paints' }, adminToken);
    ok(caseDupRes.status === 400, '21. Duplicate detection is case-insensitive');

    // 22. Update duplicate name rejected
    const updateDupRes = await patch(
      `/companies/${createdCompany.id}`,
      { name: 'TestComp_Berger Paints' },
      adminToken
    );
    ok(updateDupRes.status === 400, '22. Update duplicate name rejected');

    // ── D. Lifecycle ──────────────────────────────────────────────────────────
    // 23. Deactivate company
    const deactRes = await patch(`/companies/${createdCompany.id}/deactivate`, {}, adminToken);
    const deactData = await deactRes.json();
    ok(deactRes.status === 200 && deactData.data?.status === 'deactivated', '23. Deactivate company sets status to deactivated');

    // 24. Deactivated company remains stored in database
    const dbCheck = await Company.findById(createdCompany.id);
    ok(dbCheck !== null && dbCheck.status === 'deactivated', '24. Deactivated company remains stored in database');

    // 25. Deactivated company appears with status filter
    const filterDeactRes = await get('/companies?status=deactivated&search=TestComp_Asian', adminToken);
    const filterDeactData = await filterDeactRes.json();
    const foundInDeact = filterDeactData.data?.some((c) => c.id === createdCompany.id);
    const activeOnlyRes = await get('/companies?status=active&search=TestComp_Asian', adminToken);
    const activeOnlyData = await activeOnlyRes.json();
    const notFoundInActive = !activeOnlyData.data?.some((c) => c.id === createdCompany.id);
    ok(foundInDeact && notFoundInActive, '25. Deactivated company appears with status=deactivated and is hidden in status=active');

    // 26. Activate company
    const actRes = await patch(`/companies/${createdCompany.id}/activate`, {}, adminToken);
    const actData = await actRes.json();
    ok(actRes.status === 200 && actData.data?.status === 'active', '26. Activate company sets status back to active');

    // 27. Activate duplicate-name conflict rejected
    // Step: deactivate createdCompany, create another active company with the same name, then try to reactivate createdCompany
    await patch(`/companies/${createdCompany.id}/deactivate`, {}, adminToken);
    const collisionCompany = await Company.create({
      name: 'TestComp_Asian Paints India',
      status: 'active',
    });
    created.companies.push(collisionCompany._id);

    const conflictActRes = await patch(`/companies/${createdCompany.id}/activate`, {}, adminToken);
    ok(conflictActRes.status === 400, '27. Activate duplicate-name conflict rejected');

    // Clean up collision company
    await Company.findByIdAndDelete(collisionCompany._id);
    // Now activation should succeed
    const reactRes = await patch(`/companies/${createdCompany.id}/activate`, {}, adminToken);
    const reactData = await reactRes.json();
    ok(reactRes.status === 200 && reactData.data?.status === 'active', '27b. Activation succeeds once collision is resolved');

    // 28. DELETE returns 404
    const delRes = await del(`/companies/${createdCompany.id}`, adminToken);
    ok(delRes.status === 404, '28. DELETE /api/companies/:id returns 404 Not Found');

    // ── E. Data Safety ────────────────────────────────────────────────────────
    // 29. Company ID remains stable
    const reloaded = await Company.findById(createdCompany.id);
    ok(String(reloaded._id) === String(createdCompany.id), '29. Company ID remains stable across operations');

    // 30. Existing company fields preserved after status change
    ok(
      reloaded.name === 'TestComp_Asian Paints India' &&
        reloaded.details === 'Updated distributor information',
      '30. Existing company fields preserved after status change'
    );

    // 31. No Sale records modified
    const currentSalesCount = await Sale.countDocuments();
    ok(currentSalesCount === baselineSalesCount, '31. No Sale records modified');

    // 32. No Painter records modified
    // (PainterA was created within the test, no other modifications)
    const currentPaintersCount = await Painter.countDocuments();
    ok(currentPaintersCount === baselinePaintersCount + 1, '32. No existing Painter records modified');

    // 33. No RewardTier records modified
    const currentTiersCount = await RewardTier.countDocuments();
    ok(currentTiersCount === baselineTiersCount, '33. No RewardTier records modified');

    // 34. No Cycle records modified
    const currentCyclesCount = await Cycle.countDocuments();
    ok(currentCyclesCount === baselineCyclesCount, '34. No Cycle records modified');

    // 35. No CompanyRewardEntry is created by this module
    const currentRewardEntriesCount = await CompanyRewardEntry.countDocuments();
    ok(currentRewardEntriesCount === baselineRewardEntriesCount, '35. No CompanyRewardEntry is created by this module');

    // ── F. Response Safety ────────────────────────────────────────────────────
    // 36. No password fields leaked
    const jsonStr = JSON.stringify(singleData);
    ok(!jsonStr.includes('password') && !jsonStr.includes('hash'), '36. No password fields in response');

    // 37. No credential fields
    ok(!jsonStr.includes('token') && !jsonStr.includes('secret'), '37. No credential fields in response');

    // 38. Correct company returned
    ok(singleData.data?.id === createdCompany.id, '38. Correct company returned for getCompanyById');

    // 39. Correct status returned
    ok(singleData.data?.status === 'active', '39. Correct status returned');

    // 40. Correct counts & pagination returned
    const listCheck = await get('/companies', adminToken);
    const listCheckData = await listCheck.json();
    ok(
      listCheckData.pagination &&
        listCheckData.counts &&
        typeof listCheckData.counts.total === 'number' &&
        typeof listCheckData.counts.active === 'number' &&
        typeof listCheckData.counts.deactivated === 'number',
      '40. Correct counts and pagination returned'
    );

    // 41. Malformed ObjectId handling returns 400
    const malformedGet = await get('/companies/123-invalid-id', adminToken);
    const malformedPatch = await patch('/companies/123-invalid-id', { name: 'X' }, adminToken);
    const malformedDeact = await patch('/companies/123-invalid-id/deactivate', {}, adminToken);
    const malformedAct = await patch('/companies/123-invalid-id/activate', {}, adminToken);
    ok(
      malformedGet.status === 400 &&
        malformedPatch.status === 400 &&
        malformedDeact.status === 400 &&
        malformedAct.status === 400,
      '41. Malformed ObjectId handling returns 400 on all company endpoints'
    );

    // 42. Non-existent ObjectId returns 404
    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundGet = await get(`/companies/${nonExistentId}`, adminToken);
    const notFoundPatch = await patch(`/companies/${nonExistentId}`, { name: 'Valid' }, adminToken);
    const notFoundDeact = await patch(`/companies/${nonExistentId}/deactivate`, {}, adminToken);
    const notFoundAct = await patch(`/companies/${nonExistentId}/activate`, {}, adminToken);
    ok(
      notFoundGet.status === 404 &&
        notFoundPatch.status === 404 &&
        notFoundDeact.status === 404 &&
        notFoundAct.status === 404,
      '42. Non-existent ObjectId returns 404 on all company endpoints'
    );

    // 43. Status cannot be modified via standard PATCH
    const tamperRes = await patch(
      `/companies/${createdCompany.id}`,
      { status: 'deactivated' },
      adminToken
    );
    const tamperData = await tamperRes.json();
    ok(tamperData.data?.status === 'active', '43. Status cannot be modified through normal PATCH /api/companies/:id');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // Teardown test data
    try {
      if (created.companies.length > 0) {
        await Company.deleteMany({ _id: { $in: created.companies } });
      }
      await Company.deleteMany({ name: { $regex: /^TestComp_/ } });
      if (created.painters.length > 0) {
        await Painter.deleteMany({ _id: { $in: created.painters } });
      }
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }

    server.close();
    await mongoose.disconnect();

    console.log('\n--------------------------------------------------');
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log('--------------------------------------------------\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

run();
