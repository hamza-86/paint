/**
 * Admin Seed Script — backend/src/scripts/createAdmin.js
 *
 * Creates the initial single Admin account for the Paint Shop platform.
 *
 * Usage:
 *   npm run seed:admin
 *
 * Environment variables required (in .env):
 *   MONGODB_URI    — your MongoDB connection string
 *   ADMIN_EMAIL    — email for the admin account
 *   ADMIN_PASSWORD — initial password (min 6 characters)
 *
 * Safety:
 *   - Will NOT create a duplicate if an Admin already exists.
 *   - Password is hashed automatically by the Admin model pre-save hook.
 *   - Never commit real credentials to source control.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

const getProductionDatabaseName = (mongoUri) => {
  let databaseName;

  try {
    databaseName = new URL(mongoUri).pathname.replace(/^\//, '').split('?')[0];
  } catch {
    throw new Error('MONGODB_URI is not a valid MongoDB connection string.');
  }

  if (!databaseName) {
    throw new Error('MONGODB_URI must include an explicit production database name.');
  }

  if (/(^|[-_])(dev|development|test|testing|local|staging|stage)([-_]|$)/i.test(databaseName)) {
    throw new Error('MONGODB_URI targets a non-production database.');
  }

  return databaseName;
};

const seed = async () => {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGODB_URI) {
    console.error('❌  MONGODB_URI is not set.');
    process.exit(1);
  }
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌  NODE_ENV must be set to production.');
    process.exit(1);
  }

  let databaseName;
  try {
    databaseName = getProductionDatabaseName(MONGODB_URI);
  } catch (err) {
    console.error(`❌  ${err.message}`);
    process.exit(1);
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      '❌  ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before running the seed.'
    );
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 6) {
    console.error('❌  ADMIN_PASSWORD must be at least 6 characters.');
    process.exit(1);
  }

  try {
    console.log(`🎯  Target database: ${databaseName}`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅  MongoDB connected');

    // Check for existing admin — do not create duplicates
    const existing = await Admin.findOne({});
    if (existing) {
      console.log(
        `ℹ️   An Admin account already exists (${existing.email}). Skipping creation.`
      );
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create the Admin — password hashed by pre-save hook in Admin model
    const admin = await Admin.create({
      email: ADMIN_EMAIL.toLowerCase().trim(),
      password: ADMIN_PASSWORD,
    });

    console.log(`\n✅  Admin account created successfully!`);
    console.log(`    Email : ${admin.email}`);
    console.log(`    ID    : ${admin._id}`);
    console.log(
      `\n⚠️   Change the default password on first login in production.\n`
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
