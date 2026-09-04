import express from 'express';
import { login, getMe, logout } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Public — authenticates Admin or Painter and returns a JWT.
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 * Protected — returns the currently authenticated user's profile.
 */
router.get('/me', protect, getMe);

/**
 * POST /api/auth/logout
 * Clears the auth cookie and invalidates the session.
 */
router.post('/logout', logout);

export default router;
