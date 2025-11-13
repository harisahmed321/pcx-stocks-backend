import { UsersService } from './users.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { body, validationResult } from 'express-validator';
export class UsersController {
    static updateValidation = [
        body('name')
            .optional()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('Name must be 2-100 characters'),
        body('isFiler').optional().isBoolean().withMessage('isFiler must be a boolean'),
        body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
        body('phone')
            .optional()
            .trim()
            .isLength({ min: 10, max: 15 })
            .withMessage('Phone must be 10-15 characters'),
        body('cnic')
            .optional()
            .trim()
            .isLength({ min: 13, max: 15 })
            .withMessage('CNIC must be 13-15 characters'),
        body('role').optional().isIn(['USER', 'ADMIN']).withMessage('Role must be USER or ADMIN'),
        body('plan')
            .optional()
            .isIn(['LITE', 'PRO', 'ELITE', 'PREMIUM'])
            .withMessage('Plan must be LITE, PRO, ELITE, or PREMIUM'),
        body('paymentExpiration')
            .optional()
            .isISO8601()
            .withMessage('Payment expiration must be a valid date'),
        body('nextPayment').optional().isISO8601().withMessage('Next payment must be a valid date')
    ];
    static async getMe(req, res, next) {
        try {
            if (!req.user) {
                return ResponseHelper.unauthorized(res);
            }
            const user = await UsersService.getProfile(req.user.id);
            return ResponseHelper.success(res, user);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateMe(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            if (!req.user) {
                return ResponseHelper.unauthorized(res);
            }
            const user = await UsersService.updateProfile(req.user.id, req.body);
            return ResponseHelper.success(res, user, 'Profile updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async getAllUsers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await UsersService.getAllUsers(page, limit);
            return ResponseHelper.success(res, result);
        }
        catch (error) {
            next(error);
        }
    }
    static async updateUser(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const { userId } = req.params;
            const user = await UsersService.updateUser(userId, req.body);
            return ResponseHelper.success(res, user, 'User updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async toggleUserActive(req, res, next) {
        try {
            const { userId } = req.params;
            const user = await UsersService.toggleUserActive(userId);
            return ResponseHelper.success(res, user, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=users.controller.js.map