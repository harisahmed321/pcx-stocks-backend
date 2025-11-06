import { Request, Response, NextFunction } from 'express';
import { HoldingsService } from './holdings.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { body, param, validationResult } from 'express-validator';

export class HoldingsController {
  static createValidation = [
    param('portfolioId').isUUID().withMessage('Invalid portfolio ID'),
    body('symbol').trim().notEmpty().withMessage('Symbol is required'),
    body('name').optional().trim(),
    body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('avgBuyPrice').isFloat({ gt: 0 }).withMessage('Average buy price must be greater than 0'),
    body('currency').optional().isString(),
  ];

  static updateValidation = [
    param('id').isUUID().withMessage('Invalid holding ID'),
    body('quantity').optional().isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('avgBuyPrice').optional().isFloat({ gt: 0 }).withMessage('Average buy price must be greater than 0'),
    body('name').optional().trim(),
  ];

  static idValidation = [param('id').isUUID().withMessage('Invalid holding ID')];

  static portfolioIdValidation = [param('portfolioId').isUUID().withMessage('Invalid portfolio ID')];

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const holding = await HoldingsService.createHolding(req.user.id, req.params.portfolioId, req.body);
      return ResponseHelper.created(res, holding, 'Holding created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getByPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const holdings = await HoldingsService.getPortfolioHoldings(req.user.id, req.params.portfolioId);
      return ResponseHelper.success(res, holdings);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const holding = await HoldingsService.updateHolding(req.user.id, req.params.id, req.body);
      return ResponseHelper.success(res, holding, 'Holding updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const result = await HoldingsService.deleteHolding(req.user.id, req.params.id);
      return ResponseHelper.success(res, result, 'Holding deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

