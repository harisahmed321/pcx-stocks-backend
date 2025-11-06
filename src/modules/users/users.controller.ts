import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { body, validationResult } from 'express-validator';

export class UsersController {
  static updateValidation = [
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('isFiler').optional().isBoolean().withMessage('isFiler must be a boolean'),
  ];

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const user = await UsersService.getProfile(req.user.id);
      return ResponseHelper.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
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
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await UsersService.getAllUsers(page, limit);
      return ResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}

