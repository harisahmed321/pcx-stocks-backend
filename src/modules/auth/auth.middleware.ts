import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { ResponseHelper } from '../../utils/response.js';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseHelper.unauthorized(res, 'No token provided');
    }

    const token = authHeader.substring(7);

    const userData = await AuthService.verifyAccessToken(token);

    req.user = {
      id: userData.userId,
      email: userData.email,
      role: userData.role,
      plan: userData.plan,
    };

    next();
  } catch (error: any) {
    return ResponseHelper.unauthorized(res, error.message || 'Invalid token');
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ResponseHelper.unauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return ResponseHelper.forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

export const requirePlan = (...plans: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return ResponseHelper.unauthorized(res, 'Authentication required');
    }

    if (!plans.includes(req.user.plan)) {
      return ResponseHelper.forbidden(res, 'This feature requires a higher subscription plan');
    }

    next();
  };
};

