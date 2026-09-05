import express from 'express';
import {
  getCycles,
  getCycleById,
  createCycle,
  activateCycle,
  closeCycle,
} from '../controllers/cycleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All cycle management endpoints require authentication and admin authorization.
// Painter role users are rejected with 403 Forbidden.
router.use(protect, authorize('admin'));

// Collection endpoints
router.get('/', getCycles);
router.post('/', createCycle);

// Single cycle endpoints
router.get('/:id', getCycleById);
router.patch('/:id/activate', activateCycle);
router.patch('/:id/close', closeCycle);

// NOTE: Hard delete (DELETE /api/cycles/:id) is intentionally NOT implemented.
// Cycle records are permanent for historical data integrity — future Sales documents
// will reference cycleId and must always find the original cycle.

export default router;
