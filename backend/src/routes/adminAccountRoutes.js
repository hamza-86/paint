import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  requestEmailChange,
  verifyEmailChange,
  requestPasswordChange,
  verifyPasswordChange,
} from '../controllers/adminAccountController.js';

const router = express.Router();

// All routes require: authenticated admin session
router.use(protect, authorize('admin'));

/**
 * POST /api/admin/account/request-email-change
 * Body: { newEmail, currentPassword }
 * Sends a 6-digit OTP to the new email address.
 */
router.post('/request-email-change', requestEmailChange);

/**
 * POST /api/admin/account/verify-email-change
 * Body: { otp }
 * Verifies the OTP and updates the admin's email.
 */
router.post('/verify-email-change', verifyEmailChange);

/**
 * POST /api/admin/account/request-password-change
 * Body: { currentPassword, newPassword, confirmNewPassword }
 * Sends a 6-digit OTP to the admin's current (verified) email.
 */
router.post('/request-password-change', requestPasswordChange);

/**
 * POST /api/admin/account/verify-password-change
 * Body: { otp }
 * Verifies the OTP and updates the admin's password.
 */
router.post('/verify-password-change', verifyPasswordChange);

export default router;
