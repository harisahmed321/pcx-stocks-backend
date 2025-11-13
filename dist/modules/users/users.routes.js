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
/**
 * @route   PATCH /api/v1/users/:userId
 * @desc    Update user (admin only)
 * @access  Private/Admin
 */
router.patch('/:userId', authenticate, requireRole('ADMIN'), UsersController.updateValidation, UsersController.updateUser);
/**
 * @route   POST /api/v1/users/:userId/toggle-active
 * @desc    Toggle user active status (admin only)
 * @access  Private/Admin
 */
router.post('/:userId/toggle-active', authenticate, requireRole('ADMIN'), UsersController.toggleUserActive);
export default router;
//# sourceMappingURL=users.routes.js.map