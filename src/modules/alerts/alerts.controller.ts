import { Request, Response, NextFunction } from 'express';
import { AlertsService } from './alerts.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { body, param, validationResult } from 'express-validator';

export class AlertsController {
  static createValidation = [
    body('symbol').trim().notEmpty().withMessage('Symbol is required'),
    body('alertType')
      .isIn(['PRICE', 'PERCENT', 'CORPORATE_EVENT', 'CUSTOM'])
      .withMessage('Invalid alert type'),
    body('condition').trim().notEmpty().withMessage('Condition is required'),
    body('triggerType')
      .optional()
      .isIn(['ONE_TIME', 'RECURRING'])
      .withMessage('Invalid trigger type')
  ];

  static updateValidation = [
    param('id').isUUID().withMessage('Invalid alert ID'),
    body('condition').optional().trim().notEmpty().withMessage('Condition cannot be empty'),
    body('triggerType')
      .optional()
      .isIn(['ONE_TIME', 'RECURRING'])
      .withMessage('Invalid trigger type')
  ];

  static idValidation = [param('id').isUUID().withMessage('Invalid alert ID')];

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const alert = await AlertsService.createAlert(req.user.id, req.body);
      return ResponseHelper.created(res, alert, 'Alert created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const includeTriggered = req.query.includeTriggered === 'true';
      const alerts = await AlertsService.getUserAlerts(req.user.id, includeTriggered);
      return ResponseHelper.success(res, alerts);
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

      const alert = await AlertsService.getAlertById(req.user.id, req.params.id);
      return ResponseHelper.success(res, alert);
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

      const result = await AlertsService.deleteAlert(req.user.id, req.params.id);
      return ResponseHelper.success(res, result, 'Alert deleted successfully');
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

      const alert = await AlertsService.updateAlert(req.user.id, req.params.id, req.body);
      return ResponseHelper.success(res, alert, 'Alert updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const alert = await AlertsService.toggleAlertActive(req.user.id, req.params.id);
      return ResponseHelper.success(res, alert, 'Alert status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      if (!req.user) {
        return ResponseHelper.unauthorized(res);
      }

      const history = await AlertsService.getAlertHistory(req.user.id, req.params.id);
      return ResponseHelper.success(res, history);
    } catch (error) {
      next(error);
    }
  }
}
