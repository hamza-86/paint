import express from 'express';
import {
  getPainterHistory,
  getPainterHistoryCycles,
  getPainterHistorySales,
} from '../controllers/painterHistoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * All Painter History routes are protected and restricted to Admin users.
 * Unauthenticated: 401
 * Painter role: 403
 * Admin: 200
 */
router.use(protect, authorize('admin'));

router.get('/:painterId', getPainterHistory);
router.get('/:painterId/cycles', getPainterHistoryCycles);
router.get('/:painterId/sales', getPainterHistorySales);

export default router;
