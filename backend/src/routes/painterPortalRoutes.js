import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Painter from '../models/Painter.js';
import {
  getMe,
  getDashboard,
  getSales,
  getRewards,
  getEligibility,
  getCycles,
  getRewardById,
} from '../controllers/painterPortalController.js';

const router = express.Router();

/**
 * Middleware: Verify that the authenticated user is an active painter.
 * Rejects deactivated painters immediately with 403 Forbidden.
 */
const verifyActivePainter = async (req, res, next) => {
  try {
    const painterId = req.user?.userId || req.user?.id;
    if (!painterId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const painter = await Painter.findById(painterId);
    if (!painter) {
      return res.status(401).json({
        success: false,
        message: 'Painter account not found.',
      });
    }

    if (painter.status === 'deactivated') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Access denied.',
      });
    }

    req.painter = painter;
    next();
  } catch (err) {
    next(err);
  }
};

// All painter portal endpoints strictly require protect, authorize('painter'), and verifyActivePainter
router.use(protect, authorize('painter'), verifyActivePainter);

// Read-only collection endpoints
router.get('/me', getMe);
router.get('/dashboard', getDashboard);
router.get('/sales', getSales);
router.get('/rewards', getRewards);
router.get('/eligibility', getEligibility);
router.get('/cycles', getCycles);
router.get('/rewards/:id', getRewardById);

// Strictly reject any mutation requests with 404
router.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found. Painter portal is strictly read-only.',
  });
});

export default router;
