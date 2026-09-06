import express from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deactivateCompany,
  activateCompany,
} from '../controllers/companyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

/**
 * All Company Management endpoints are restricted to Admin users.
 * Unauthenticated: 401
 * Painter: 403
 * Admin: allowed
 */
router.use(protect, authorize('admin'));

// Collection endpoints
router.get('/', getCompanies);
router.post('/', createCompany);

// Item endpoints (note: NO DELETE endpoint is exposed)
router.get('/:id', getCompanyById);
router.patch('/:id', updateCompany);
router.patch('/:id/deactivate', deactivateCompany);
router.patch('/:id/activate', activateCompany);

export default router;
