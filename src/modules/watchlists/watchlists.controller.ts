import { Request, Response, NextFunction } from 'express';
import { WatchlistsService } from './watchlists.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { body, param, validationResult } from 'express-validator';

export class WatchlistsController {
  static createValidation = [body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')];

  static addItemValidation = [
    param('id').isUUID().withMessage('Invalid watchlist ID'),
    body('symbol').trim().notEmpty().withMessage('Symbol is required'),
    body('notes').optional().trim(),
  ];

  static idValidation = [param('id').isUUID().withMessage('Invalid ID')];

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const watchlist = await WatchlistsService.createWatchlist(req.user.id, req.body);
      return ResponseHelper.created(res, watchlist, 'Watchlist created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const watchlists = await WatchlistsService.getUserWatchlists(req.user.id);
      return ResponseHelper.success(res, watchlists);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const watchlist = await WatchlistsService.getWatchlistById(req.user.id, req.params.id);
      return ResponseHelper.success(res, watchlist);
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

      const result = await WatchlistsService.deleteWatchlist(req.user.id, req.params.id);
      return ResponseHelper.success(res, result, 'Watchlist deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const item = await WatchlistsService.addWatchlistItem(req.user.id, req.params.id, req.body);
      return ResponseHelper.created(res, item, 'Item added to watchlist');
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const result = await WatchlistsService.removeWatchlistItem(req.user.id, req.params.itemId);
      return ResponseHelper.success(res, result, 'Item removed from watchlist');
    } catch (error) {
      next(error);
    }
  }
}

