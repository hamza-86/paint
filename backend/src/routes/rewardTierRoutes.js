import express from 'express';
import {
  getRewardTiers,
  getRewardTierById,
  createRewardTier,
  updateRewardTier,
  deactivateRewardTier,
  activateRewardTier,
  getPainterCurrentRewardTier,
} from '../controllers/rewardTierController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * All Reward Tier routes are restricted to Admin users.
 * Unauthenticated: 401
 * Painter: 403
 * Admin: allowed
 */
router.use(protect, authorize('admin'));

// Collection endpoints
router.get('/', getRewardTiers);
router.post('/', createRewardTier);

// Painter current eligibility (must be registered before /:id)
router.get('/painter/:painterId', getPainterCurrentRewardTier);

// Item endpoints
router.get('/:id', getRewardTierById);
router.patch('/:id', updateRewardTier);
router.patch('/:id/deactivate', deactivateRewardTier);
router.patch('/:id/activate', activateRewardTier);

export default router;
