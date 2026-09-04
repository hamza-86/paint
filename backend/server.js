/**
 * Server Entry Point — server.js
 *
 * 1. Loads environment variables from .env
 * 2. Connects to MongoDB
 * 3. Starts the Express HTTP server
 *
 * This is the file Render executes with `node server.js` (start script).
 * For local development, nodemon watches this file via `npm run dev`.
 */

import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to MongoDB first; process.exit(1) on failure (see config/db.js)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀  Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📡  Health check → http://localhost:${PORT}/api/health`);
  });
};

startServer();
