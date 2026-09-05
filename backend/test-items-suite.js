import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import app from './src/app.js';
import Item from './src/models/Item.js';
import Painter from './src/models/Painter.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const PORT = 5003;
const API_URL = `http://localhost:${PORT}/api`;

async function runTestSuite() {
  console.log('==================================================');
  console.log('   ITEM CATALOG MANAGEMENT BACKEND VERIFICATION   ');
  console.log('==================================================\n');

  // Connect to DB
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/paintshop_dev';
  await mongoose.connect(uri);

  // Start test server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running on port ${PORT}\n`);

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  let createdItemId = null;

  try {
    // 1. Health check
    const healthRes = await fetch(`${API_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', '1. Backend starts successfully and health check returns 200');

    // Setup: Get Admin Token
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@paintshop.com',
        password: process.env.ADMIN_PASSWORD || 'changeme123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.token;
    assert(adminToken && adminLoginData.user?.role === 'admin', 'Setup: Admin token obtained');

    // Setup: Create/Get Painter Token for role tests
    const testPainterEmail = `item_painter_test_${Date.now()}@paintshop.com`;
    await Painter.create({
      firstName: 'PainterTester',
      mobile: '9876543210',
      email: testPainterEmail,
      password: 'painterpassword123',
      status: 'active',
    });

    const painterLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testPainterEmail,
        password: 'painterpassword123',
      }),
    });
    const painterLoginData = await painterLoginRes.json();
    const painterToken = painterLoginData.token;
    assert(painterToken && painterLoginData.user?.role === 'painter', 'Setup: Painter token obtained');

    // 2. GET /api/items requires authentication (401)
    const unauthRes = await fetch(`${API_URL}/items`);
    assert(unauthRes.status === 401, '2. GET /api/items requires authentication (returns 401 Unauthorized)');

    // 3. Painter receives 403 Forbidden
    const painterRes = await fetch(`${API_URL}/items`, {
      headers: { Authorization: `Bearer ${painterToken}` },
    });
    assert(painterRes.status === 403, '3. GET /api/items rejects painter role (returns 403 Forbidden)');

    const painterPostRes = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${painterToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Paint', price: 1000, points: 5 }),
    });
    assert(painterPostRes.status === 403, '3b. POST /api/items rejects painter role (returns 403 Forbidden)');

    // 4. Admin can list items with pagination metadata & counts
    const listRes = await fetch(`${API_URL}/items`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listData = await listRes.json();
    assert(
      listRes.status === 200 &&
        listData.success === true &&
        Array.isArray(listData.items) &&
        listData.pagination &&
        listData.counts,
      '4. Admin can list items with pagination metadata and global counts'
    );

    // 9. Admin can create item (201 Created and safe item object)
    const testItemName = `Asian Paints Apex Ultima ${Date.now()}`;
    const createRes = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: testItemName,
        price: 3450,
        points: 8,
        brand: 'Asian Paints',
        category: 'Exterior Paint',
        imageUrl: 'https://images.unsplash.com/photo-paint-bucket.jpg',
      }),
    });
    const createData = await createRes.json();
    assert(
      createRes.status === 201 &&
        createData.success === true &&
        createData.item?.name === testItemName &&
        createData.item?.price === 3450 &&
        createData.item?.points === 8 &&
        createData.item?.brand === 'Asian Paints' &&
        createData.item?.category === 'Exterior Paint' &&
        createData.item?.status === 'active' &&
        createData.item?.id,
      '9. Admin can create item (returns 201 Created and safe item object)'
    );
    createdItemId = createData.item?.id;

    // 10. Invalid price rejected (negative, non-numeric)
    const negPriceRes = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Invalid Price Paint',
        price: -500,
        points: 5,
      }),
    });
    assert(negPriceRes.status === 400, '10. Invalid negative price rejected with 400 Bad Request');

    const strPriceRes = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Invalid Price String',
        price: 'not-a-number',
        points: 5,
      }),
    });
    assert(strPriceRes.status === 400, '10b. Non-numeric price rejected with 400 Bad Request');

    // 11. Invalid points rejected (negative, non-numeric)
    const negPointsRes = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Invalid Points Paint',
        price: 1200,
        points: -3,
      }),
    });
    assert(negPointsRes.status === 400, '11. Invalid negative points rejected with 400 Bad Request');

    // 5. Pagination works
    const pageRes = await fetch(`${API_URL}/items?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pageData = await pageRes.json();
    assert(
      pageRes.status === 200 &&
        pageData.pagination.page === 1 &&
        pageData.pagination.limit === 2 &&
        pageData.items.length <= 2,
      '5. Pagination works with page and limit'
    );

    // 6. Search works (name, brand, category)
    const searchRes = await fetch(`${API_URL}/items?search=Apex%20Ultima`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const searchData = await searchRes.json();
    assert(
      searchRes.status === 200 &&
        searchData.items.some((i) => i.id === createdItemId),
      '6. Search works across item name'
    );

    const brandSearchRes = await fetch(`${API_URL}/items?search=Asian%20Paints`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const brandSearchData = await brandSearchRes.json();
    assert(
      brandSearchRes.status === 200 &&
        brandSearchData.items.some((i) => i.id === createdItemId),
      '6b. Search works across brand'
    );

    // 7. Status filter works
    const activeRes = await fetch(`${API_URL}/items?status=active`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const activeData = await activeRes.json();
    assert(
      activeRes.status === 200 &&
        activeData.items.every((i) => i.status === 'active'),
      '7. Status filter works for active items'
    );

    // 8. Category filter works
    const catRes = await fetch(`${API_URL}/items?category=Exterior%20Paint`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const catData = await catRes.json();
    assert(
      catRes.status === 200 &&
        catData.items.every((i) => i.category === 'Exterior Paint'),
      '8. Category filter works'
    );

    // 12. Admin can get item by id
    const getRes = await fetch(`${API_URL}/items/${createdItemId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getData = await getRes.json();
    assert(
      getRes.status === 200 &&
        getData.success === true &&
        getData.item?.id === createdItemId &&
        getData.item?.name === testItemName,
      '12. Admin can retrieve single item by ID'
    );

    // 13. Admin can edit item
    const updateRes = await fetch(`${API_URL}/items/${createdItemId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price: 3600,
        points: 10,
        brand: 'Asian Paints Premium',
      }),
    });
    const updateData = await updateRes.json();
    assert(
      updateRes.status === 200 &&
        updateData.success === true &&
        updateData.item?.price === 3600 &&
        updateData.item?.points === 10 &&
        updateData.item?.brand === 'Asian Paints Premium',
      '13. Admin can edit item (price, points, brand updated)'
    );

    // 14. Admin can deactivate item
    const deactRes = await fetch(`${API_URL}/items/${createdItemId}/deactivate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const deactData = await deactRes.json();
    assert(
      deactRes.status === 200 &&
        deactData.success === true &&
        deactData.item?.status === 'deactivated',
      '14. Admin can deactivate item (status becomes deactivated)'
    );

    // 15. Admin can activate item
    const actRes = await fetch(`${API_URL}/items/${createdItemId}/activate`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const actData = await actRes.json();
    assert(
      actRes.status === 200 &&
        actData.success === true &&
        actData.item?.status === 'active',
      '15. Admin can reactivate item (status becomes active)'
    );

    // 16. DELETE /api/items/:id does NOT exist (404)
    const deleteRes = await fetch(`${API_URL}/items/${createdItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteRes.status === 404, '16. DELETE /api/items/:id does NOT exist (returns 404 - no hard delete)');

    // 17. Image URL is stored only as URL/string
    const dbDoc = await Item.findById(createdItemId);
    assert(
      typeof dbDoc.imageUrl === 'string' &&
        !dbDoc.imageUrl.startsWith('data:') &&
        dbDoc.imageUrl.length < 500,
      '17. Image URL stored safely as URL string (no binary/base64 in MongoDB)'
    );

    // 18. No sensitive data exposed
    assert(
      !getData.item?.password &&
        !getData.item?.__v &&
        !getData.item?._id.includes?.('ObjectId'),
      '18. No sensitive data or raw Mongo internals exposed in responses'
    );
  } catch (err) {
    console.error('Test error:', err);
    failed++;
  } finally {
    // Cleanup temporary test item and painter
    if (createdItemId) {
      await Item.findByIdAndDelete(createdItemId);
    }
    await Painter.deleteMany({ email: /item_painter_test_/ });

    await mongoose.disconnect();
    server.close();

    console.log('\n--------------------------------------------------');
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log('--------------------------------------------------\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTestSuite();
