import express from 'express';
import {
  getSummary,
  getTopPainters,
  getSalesTrend,
  getRecentSales,
  getRecentRewards,
  getInventorySummary,
  getCompanyRewardsSummary,
  getActivity,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * All Dashboard & Reporting endpoints are strictly restricted to Admin users.
 * Unauthenticated requests: 401
 * Painter requests: 403
 * Admin requests: 200
 */
router.use(protect, authorize('admin'));

router.get('/summary', getSummary);
router.get('/top-painters', getTopPainters);
router.get('/sales-trend', getSalesTrend);
router.get('/recent-sales', getRecentSales);
router.get('/recent-rewards', getRecentRewards);
router.get('/inventory-summary', getInventorySummary);
router.get('/company-rewards-summary', getCompanyRewardsSummary);
router.get('/activity', getActivity);

export default router;
