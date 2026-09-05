import express from 'express';
import { getCustomers, getCustomerById } from '../controllers/customerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All endpoints: authenticated + admin only
router.use(protect, authorize('admin'));

router.get('/', getCustomers);
router.get('/:id', getCustomerById);

// No DELETE — customers are historical records

export default router;
