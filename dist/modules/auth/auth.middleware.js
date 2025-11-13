import { AuthService } from './auth.service.js';
import { ResponseHelper } from '../../utils/response.js';
export const authenticate = async (req, res, next) => {
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
    }
    catch (error) {
        return ResponseHelper.unauthorized(res, error.message || 'Invalid token');
    }
};
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return ResponseHelper.unauthorized(res, 'Authentication required');
        }
        if (!roles.includes(req.user.role)) {
            return ResponseHelper.forbidden(res, 'Insufficient permissions');
        }
        next();
    };
};
export const requirePlan = (...plans) => {
    return (req, res, next) => {
        if (!req.user) {
            return ResponseHelper.unauthorized(res, 'Authentication required');
        }
        if (!plans.includes(req.user.plan)) {
            return ResponseHelper.forbidden(res, 'This feature requires a higher subscription plan');
        }
        next();
    };
};
//# sourceMappingURL=auth.middleware.js.map