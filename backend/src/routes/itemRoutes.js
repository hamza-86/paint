import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deactivateItem,
  activateItem,
  getItemBrands,
  getItemCategories,
  getItemSalesHistory,
} from '../controllers/itemController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All item catalog management endpoints require authentication and admin authorization.
// Painter role users are rejected with 403 Forbidden.
router.use(protect, authorize('admin'));

// Metadata endpoints (must be registered before /:id)
router.get('/meta/brands', getItemBrands);
router.get('/meta/categories', getItemCategories);

// Collection endpoints
router.get('/', getItems);
router.post('/', upload.single('image'), createItem);

// Single item endpoints
router.get('/:id', getItemById);
router.get('/:id/sales', getItemSalesHistory);
router.patch('/:id', upload.single('image'), updateItem);
router.patch('/:id/deactivate', deactivateItem);
router.patch('/:id/activate', activateItem);

// NOTE: Hard delete (DELETE /api/items/:id) is intentionally NOT implemented.
// Item records must never be permanently purged to ensure historical data integrity for past sales.

export default router;
