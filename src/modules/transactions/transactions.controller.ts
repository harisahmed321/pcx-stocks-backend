import { Request, Response, NextFunction } from 'express';
import { TransactionsService } from './transactions.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { body, param, validationResult } from 'express-validator';

export class TransactionsController {
  static createValidation = [
    param('portfolioId').isUUID().withMessage('Invalid portfolio ID'),
    body('type')
      .isIn(['BUY', 'SELL', 'DIVIDEND', 'BONUS', 'SPLIT', 'ADJUSTMENT'])
      .withMessage('Invalid transaction type'),
    body('symbol').trim().notEmpty().withMessage('Symbol is required'),
    body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
    body('price').isFloat({ gte: 0 }).withMessage('Price must be non-negative'),
    body('fees').optional().isFloat({ gte: 0 }).withMessage('Fees must be non-negative'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('notes').optional().trim()
  ];

  static portfolioIdValidation = [
    param('portfolioId').isUUID().withMessage('Invalid portfolio ID')
  ];

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const transaction = await TransactionsService.createTransaction(
        req.user.id,
        req.params.portfolioId,
        {
          ...req.body,
          date: new Date(req.body.date)
        }
      );

      return ResponseHelper.created(res, transaction, 'Transaction created successfully');
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

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await TransactionsService.getPortfolioTransactions(
        req.user.id,
        req.params.portfolioId,
        page,
        limit
      );
      return ResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
