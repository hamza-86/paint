import express from 'express';
import {
  getPainters,
  getPainterById,
  createPainter,
  updatePainterPhoto,
  deactivatePainter,
  activatePainter,
} from '../controllers/painterController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All painter management endpoints require authentication and admin authorization.
// Painter role users are rejected with 403 Forbidden.
router.use(protect, authorize('admin'));

// Collection endpoints
router.get('/', getPainters);
router.post('/', upload.single('photo'), createPainter);

// Single painter endpoints
router.get('/:id', getPainterById);
router.patch('/:id/photo', upload.single('photo'), updatePainterPhoto);
router.patch('/:id/deactivate', deactivatePainter);
router.patch('/:id/activate', activatePainter);

// NOTE: Hard delete (DELETE /api/painters/:id) is intentionally NOT implemented.
// Painter records must never be purged to ensure historical integrity for sales & rewards.

export default router;
