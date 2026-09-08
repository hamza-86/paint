/**
 * MongoDB connection utility — /src/config/db.js
 *
 * Connects to MongoDB using Mongoose.
 * Call connectDB() in server.js before starting the Express server.
 * Exits the process on connection failure so Render restarts the dyno cleanly.
 */

import mongoose from 'mongoose';
import { getTestMongoUri } from './testDb.js';

const connectDB = async () => {
  try {
    const mongoUri = process.env.NODE_ENV === 'test'
      ? getTestMongoUri()
      : process.env.MONGODB_URI;
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    process.exit(1); // Non-zero exit triggers Render auto-restart
  }
};

export default connectDB;
