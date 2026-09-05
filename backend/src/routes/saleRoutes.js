import express from 'express';
import { createSale, getSales, getSaleById } from '../controllers/saleController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All endpoints: authenticated + admin only
router.use(protect, authorize('admin'));

router.get('/', getSales);
router.post('/', createSale);
router.get('/:id', getSaleById);

// No DELETE, no PATCH — sales are historical records

export default router;
