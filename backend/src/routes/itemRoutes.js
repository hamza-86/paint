import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deactivateItem,
  activateItem,
} from '../controllers/itemController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All item catalog management endpoints require authentication and admin authorization.
// Painter role users are rejected with 403 Forbidden.
router.use(protect, authorize('admin'));

// Collection endpoints
router.get('/', getItems);
router.post('/', createItem);

// Single item endpoints
router.get('/:id', getItemById);
router.patch('/:id', updateItem);
router.patch('/:id/deactivate', deactivateItem);
router.patch('/:id/activate', activateItem);

// NOTE: Hard delete (DELETE /api/items/:id) is intentionally NOT implemented.
// Item records must never be permanently purged to ensure historical data integrity for past sales.

export default router;
