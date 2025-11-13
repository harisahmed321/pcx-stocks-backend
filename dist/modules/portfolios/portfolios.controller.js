import { PortfoliosService } from './portfolios.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { body, param, validationResult } from 'express-validator';
export class PortfoliosController {
    static createValidation = [
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
        body('cashBalance').optional().isNumeric().withMessage('Cash balance must be a number'),
    ];
    static updateValidation = [
        param('id').isUUID().withMessage('Invalid portfolio ID'),
        body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be max 500 characters'),
        body('cashBalance').optional().isNumeric().withMessage('Cash balance must be a number'),
    ];
    static idValidation = [param('id').isUUID().withMessage('Invalid portfolio ID')];
    static async create(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            if (!req.user) {
                return ResponseHelper.unauthorized(res);
            }
            const portfolio = await PortfoliosService.createPortfolio(req.user.id, req.body);
            return ResponseHelper.created(res, portfolio, 'Portfolio created successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async getAll(req, res, next) {
        try {
            if (!req.user) {
                return ResponseHelper.unauthorized(res);
            }
            const portfolios = await PortfoliosService.getUserPortfolios(req.user.id);
            return ResponseHelper.success(res, portfolios);
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            if (!req.user) {
                return ResponseHelper.unauthorized(res);
            }
            const portfolio = await PortfoliosService.getPortfolioById(req.user.id, req.params.id);
            return ResponseHelper.success(res, portfolio);
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            if (!req.user) {
                return ResponseHelper.unauthorized(res);
            }
            const portfolio = await PortfoliosService.updatePortfolio(req.user.id, req.params.id, req.body);
            return ResponseHelper.success(res, portfolio, 'Portfolio updated successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async delete(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            if (!req.user) {
                return ResponseHelper.unauthorized(res);
            }
            const result = await PortfoliosService.deletePortfolio(req.user.id, req.params.id);
            return ResponseHelper.success(res, result, 'Portfolio deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=portfolios.controller.js.map