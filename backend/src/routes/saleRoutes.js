import express from 'express';
import { createSale, getSales, getSaleById } from '../controllers/saleController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadBillFile } from '../middleware/upload.js';

const router = express.Router();

// Middleware to catch multer upload errors cleanly
const handleBillUpload = (req, res, next) => {
  uploadBillFile.single('billFile')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// All endpoints: authenticated + admin only
router.use(protect, authorize('admin'));

router.get('/', getSales);
router.post('/', handleBillUpload, createSale);
router.get('/:id', getSaleById);

// No DELETE, no PATCH — sales are historical records

export default router;
