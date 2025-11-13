import { MarketService } from './market.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { param, query, validationResult } from 'express-validator';
export class MarketController {
    static symbolValidation = [param('symbol').trim().notEmpty().withMessage('Symbol is required')];
    static historyValidation = [
        param('symbol').trim().notEmpty().withMessage('Symbol is required'),
        query('from').optional().isISO8601().withMessage('Invalid from date'),
        query('to').optional().isISO8601().withMessage('Invalid to date'),
        query('interval').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid interval'),
    ];
    static async getSymbols(req, res, next) {
        try {
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
            const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const to = req.query.to ? new Date(req.query.to) : new Date();
            const interval = req.query.interval || 'daily';
            const history = await MarketService.getHistoricalData(req.params.symbol.toUpperCase(), from, to, interval);
            return ResponseHelper.success(res, { symbol: req.params.symbol.toUpperCase(), interval, data: history });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=market.controller.js.map