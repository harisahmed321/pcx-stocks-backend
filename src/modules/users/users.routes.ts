import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { authenticate, requireRole } from '../auth/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, UsersController.getMe);

/**
 * @route   PATCH /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/me', authenticate, UsersController.updateValidation, UsersController.updateMe);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get('/', authenticate, requireRole('ADMIN'), UsersController.getAllUsers);

export default router;

