import { AuthService } from './auth.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { body, validationResult } from 'express-validator';
export class AuthController {
    static registerValidation = [
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    ];
    static loginValidation = [
        body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
        body('password').notEmpty().withMessage('Password is required'),
    ];
    static refreshValidation = [
        body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    ];
    static async register(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const result = await AuthService.register(req.body);
            return ResponseHelper.created(res, result, 'User registered successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const result = await AuthService.login(req.body);
            return ResponseHelper.success(res, result, 'Login successful');
        }
        catch (error) {
            next(error);
        }
    }
    static async refresh(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const { refreshToken } = req.body;
            const result = await AuthService.refresh(refreshToken);
            return ResponseHelper.success(res, result, 'Tokens refreshed successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return ResponseHelper.badRequest(res, null, 'Refresh token is required');
            }
            await AuthService.logout(refreshToken);
            return ResponseHelper.success(res, null, 'Logout successful');
        }
        catch (error) {
            next(error);
        }
    }
    static async me(req, res, next) {
        try {
            if (!req.user) {
                return ResponseHelper.unauthorized(res, 'Not authenticated');
            }
            return ResponseHelper.success(res, req.user, 'User profile retrieved');
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=auth.controller.js.map