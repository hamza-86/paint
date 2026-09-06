import express from 'express';
import {
  getCompanyRewards,
  getCompanyRewardById,
  createCompanyReward,
  updateCompanyReward,
} from '../controllers/companyRewardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin auth
router.use(protect, authorize('admin'));

// GET  /api/company-rewards         – paginated list with filters
// POST /api/company-rewards         – create a new entry
router.route('/').get(getCompanyRewards).post(createCompanyReward);

// GET   /api/company-rewards/:id    – get one
// PATCH /api/company-rewards/:id    – update one
router.route('/:id').get(getCompanyRewardById).patch(updateCompanyReward);

export default router;
