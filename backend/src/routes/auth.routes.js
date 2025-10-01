import { Router } from 'express';
import { register, login, refresh, logout, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', authRateLimiter, register);

// POST /api/auth/login
router.post('/login', authRateLimiter, login);

// POST /api/auth/refresh
// Do not throttle refresh to avoid breaking seamless session persistence
router.post('/refresh', refresh);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', authRateLimiter, forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', authRateLimiter, resetPassword);

export default router;
