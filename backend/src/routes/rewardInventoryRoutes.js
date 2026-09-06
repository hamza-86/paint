import express from 'express';
import {
  getRewardInventory,
  getRewardInventoryById,
  createRewardInventory,
  updateRewardInventory,
  deactivateRewardInventory,
  activateRewardInventory,
} from '../controllers/rewardInventoryController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * All Reward Inventory endpoints are restricted to Admin users.
 * Unauthenticated: 401
 * Painter: 403
 * Admin: allowed
 */
router.use(protect, authorize('admin'));

// Collection endpoints
router.get('/', getRewardInventory);
router.post('/', createRewardInventory);

// Item endpoints (Zero-deletion policy: no DELETE endpoint is exposed)
router.get('/:id', getRewardInventoryById);
router.patch('/:id', updateRewardInventory);
router.patch('/:id/deactivate', deactivateRewardInventory);
router.patch('/:id/activate', activateRewardInventory);

export default router;
