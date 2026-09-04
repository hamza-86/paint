/**
 * Express Application Setup — /src/app.js
 *
 * Configures and exports the Express app instance.
 * Middleware, CORS, routing, and error handling are all wired here.
 * server.js imports this and binds it to a port.
 */

import express from 'express';
import cors from 'cors';

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allow requests only from the configured frontend origin.
// FRONTEND_URL is set in .env — defaults to localhost:3000 for local dev.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(
        new Error(`CORS policy: origin '${origin}' is not allowed.`),
        false
      );
    },
    credentials: true, // Allow cookies / Authorization headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));          // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));   // Parse URL-encoded bodies

// ── Health Check ─────────────────────────────────────────────────────────────
// Used by Render's health checks and uptime monitors.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Paint Shop Painter Management API',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes (Planned) ─────────────────────────────────────────────────────
// TODO: Mount routers here, e.g.:
//   import authRoutes from './routes/authRoutes.js';
//   app.use('/api/auth', authRoutes);
//   app.use('/api/painters', painterRoutes);
//   app.use('/api/customers', customerRoutes);
//   app.use('/api/items', itemRoutes);
//   app.use('/api/sales', saleRoutes);
//   app.use('/api/cycles', cycleRoutes);
//   app.use('/api/rewards', rewardRoutes);
//   app.use('/api/companies', companyRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
// Must have 4 parameters for Express to treat it as an error handler.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${err.message}`);
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
