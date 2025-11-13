import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from './auth.middleware.js';
const router = Router();
/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', AuthController.registerValidation, AuthController.register);
/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', AuthController.loginValidation, AuthController.login);
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', AuthController.refreshValidation, AuthController.refresh);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Public
 */
router.post('/logout', AuthController.logout);
/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, AuthController.me);
export default router;
//# sourceMappingURL=auth.routes.js.map