/**
 * Safe Database Reset Script — backend/src/scripts/resetDatabase.js
 *
 * Clears ALL application business/transactional collections:
 *   - Painters
 *   - Customers
 *   - Items
 *   - Cycles
 *   - Sales
 *   - Reward Tiers
 *   - Companies
 *   - Company Reward Entries
 *   - Reward Inventory Items
 *   - Painter Reward Assignments
 *
 * PRESERVES:
 *   - Admin authentication records (NEVER touched)
 *   - Database schema & collection index definitions
 *
 * Usage:
 *   npm run reset:database
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import {
  Admin,
  Painter,
  Customer,
  Item,
  Cycle,
  Sale,
  RewardTier,
  Company,
  CompanyRewardEntry,
  RewardInventoryItem,
  PainterRewardAssignment,
} from '../models/index.js';

const resetDatabase = async () => {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  const environment = (process.env.NODE_ENV || 'development').toLowerCase();
  let databaseName = '';
  try {
    databaseName = new URL(MONGODB_URI).pathname.replace(/^\//, '').split('?')[0];
  } catch {
    databaseName = '';
  }

  if (environment === 'production' || !databaseName || !/(?:_dev|_test)$/i.test(databaseName)) {
    console.error('❌  Refusing to reset database. Reset is allowed only for a non-production database named with a _dev or _test suffix.');
    process.exit(1);
  }

  try {
    console.log(`⚠️   Reset target: ${databaseName} (${environment} environment)`);
    console.log('🔄  Connecting to MongoDB...');
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅  Connected to MongoDB: ${conn.connection.host} / Database: ${conn.connection.name}`);

    // Verify Admin account
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      console.warn('⚠️   WARNING: No Admin accounts found in the database. Run `npm run seed:admin` if needed.');
    } else {
      console.log(`🛡️   Admin account(s) detected: ${adminCount} (will NOT be touched)`);
    }

    console.log('\n🧹  Clearing business/test collections...');

    // 1. Painters
    const paintersCount = await Painter.countDocuments();
    await Painter.deleteMany({});

    // 2. Customers
    const customersCount = await Customer.countDocuments();
    await Customer.deleteMany({});

    // 3. Items
    const itemsCount = await Item.countDocuments();
    await Item.deleteMany({});

    // 4. Cycles
    const cyclesCount = await Cycle.countDocuments();
    await Cycle.deleteMany({});

    // 5. Sales
    const salesCount = await Sale.countDocuments();
    await Sale.deleteMany({});

    // 6. Reward Tiers
    const rewardTiersCount = await RewardTier.countDocuments();
    await RewardTier.deleteMany({});

    // 7. Companies
    const companiesCount = await Company.countDocuments();
    await Company.deleteMany({});

    // 8. Company Reward Entries
    const companyRewardEntriesCount = await CompanyRewardEntry.countDocuments();
    await CompanyRewardEntry.deleteMany({});

    // 9. Reward Inventory Items
    const rewardInventoryCount = await RewardInventoryItem.countDocuments();
    await RewardInventoryItem.deleteMany({});

    // 10. Painter Reward Assignments
    const painterRewardAssignmentsCount = await PainterRewardAssignment.countDocuments();
    await PainterRewardAssignment.deleteMany({});

    // Verify remaining counts are 0
    const [
      remPainters,
      remCustomers,
      remItems,
      remCycles,
      remSales,
      remTiers,
      remCompanies,
      remCompRewards,
      remInventory,
      remAssignments,
      remAdmins,
    ] = await Promise.all([
      Painter.countDocuments(),
      Customer.countDocuments(),
      Item.countDocuments(),
      Cycle.countDocuments(),
      Sale.countDocuments(),
      RewardTier.countDocuments(),
      Company.countDocuments(),
      CompanyRewardEntry.countDocuments(),
      RewardInventoryItem.countDocuments(),
      PainterRewardAssignment.countDocuments(),
      Admin.countDocuments(),
    ]);

    console.log('\n==================================================');
    console.log('       DATABASE CLEANUP SUMMARY REPORT            ');
    console.log('==================================================');
    console.log(`Painters cleared: ${paintersCount}`);
    console.log(`Customers cleared: ${customersCount}`);
    console.log(`Items cleared: ${itemsCount}`);
    console.log(`Cycles cleared: ${cyclesCount}`);
    console.log(`Sales cleared: ${salesCount}`);
    console.log(`Reward tiers cleared: ${rewardTiersCount}`);
    console.log(`Companies cleared: ${companiesCount}`);
    console.log(`Company reward entries cleared: ${companyRewardEntriesCount}`);
    console.log(`Reward inventory items cleared: ${rewardInventoryCount}`);
    console.log(`Painter reward assignments cleared: ${painterRewardAssignmentsCount}`);
    console.log('--------------------------------------------------');
    console.log(`Admin preserved: ${remAdmins > 0 ? 'YES' : 'NO'} (${remAdmins} admin record(s) intact)`);
    console.log('==================================================');

    const allZero =
      remPainters === 0 &&
      remCustomers === 0 &&
      remItems === 0 &&
      remCycles === 0 &&
      remSales === 0 &&
      remTiers === 0 &&
      remCompanies === 0 &&
      remCompRewards === 0 &&
      remInventory === 0 &&
      remAssignments === 0;

    if (allZero) {
      console.log('✅  All business collections are verified EMPTY (0 documents).');
    } else {
      console.error('❌  Verification failed! Some collections still have documents.');
      process.exit(1);
    }

    await mongoose.disconnect();
    console.log('🔌  Disconnected from MongoDB cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('❌  Database reset failed:', err.message);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  }
};

resetDatabase();
