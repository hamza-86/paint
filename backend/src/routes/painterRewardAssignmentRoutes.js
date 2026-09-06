import express from 'express';
import {
  getAssignments,
  getAssignmentById,
  getPainterEligibility,
  createAssignment,
} from '../controllers/painterRewardAssignmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * All Painter Reward Assignment endpoints are restricted to Admin users.
 * Unauthenticated: 401
 * Painter role:    403
 * Admin role:      allowed
 *
 * Zero-deletion policy: no DELETE endpoint is exposed.
 */
router.use(protect, authorize('admin'));

// Eligibility lookup — must be before /:id to avoid route collision
router.get('/eligibility/:painterId', getPainterEligibility);

// Collection
router.get('/', getAssignments);
router.post('/', createAssignment);

// Single record
router.get('/:id', getAssignmentById);

export default router;
