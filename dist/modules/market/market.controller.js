import { MarketService } from './market.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { param, query, validationResult } from 'express-validator';
export class MarketController {
    static symbolValidation = [param('symbol').trim().notEmpty().withMessage('Symbol is required')];
    static historyValidation = [
        param('symbol').trim().notEmpty().withMessage('Symbol is required'),
        query('from').optional().isISO8601().withMessage('Invalid from date'),
        query('to').optional().isISO8601().withMessage('Invalid to date'),
        query('interval')
            .optional()
            .isIn(['daily', 'weekly', 'monthly'])
            .withMessage('Invalid interval')
    ];
    static async getSymbols(req, res, next) {
        try {
            const page = req.query.page ? parseInt(req.query.page) : undefined;
            const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
            // If pagination parameters are provided, use paginated response
            if (page && limit) {
                const result = await MarketService.getSymbolsPaginated(page, limit);
                return ResponseHelper.success(res, result.data, undefined, 200, result.pagination);
            }
            // Otherwise, return all symbols (backward compatibility)
            const symbols = await MarketService.getAvailableSymbols();
            return ResponseHelper.success(res, symbols);
        }
        catch (error) {
            next(error);
        }
    }
    static async getCurrentPrice(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const price = await MarketService.getCurrentPrice(req.params.symbol.toUpperCase());
            return ResponseHelper.success(res, { symbol: req.params.symbol.toUpperCase(), price });
        }
        catch (error) {
            next(error);
        }
    }
    static async getHistory(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const from = req.query.from
                ? new Date(req.query.from)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const to = req.query.to ? new Date(req.query.to) : new Date();
            const interval = req.query.interval || 'daily';
            const history = await MarketService.getHistoricalData(req.params.symbol.toUpperCase(), from, to, interval);
            return ResponseHelper.success(res, {
                symbol: req.params.symbol.toUpperCase(),
                interval,
                data: history
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getSymbolDetails(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const details = await MarketService.getSymbolDetailsFromPSX(req.params.symbol.toUpperCase());
            return ResponseHelper.success(res, details);
        }
        catch (error) {
            next(error);
        }
    }
    static async getTimeseries(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const timeseries = await MarketService.getTimeseriesFromPSX(req.params.symbol.toUpperCase());
            return ResponseHelper.success(res, timeseries);
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=market.controller.js.map