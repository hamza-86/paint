/**
 * MongoDB connection utility — /src/config/db.js
 *
 * Connects to MongoDB using Mongoose.
 * Call connectDB() in server.js before starting the Express server.
 * Exits the process on connection failure so Render restarts the dyno cleanly.
 */

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅  MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  MongoDB connection error: ${error.message}`);
    process.exit(1); // Non-zero exit triggers Render auto-restart
  }
};

export default connectDB;
