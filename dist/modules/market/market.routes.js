import { Router } from 'express';
import { MarketController } from './market.controller.js';
const router = Router();
/**
 * @route   GET /api/v1/market/symbols
 * @desc    Get all available symbols
 * @access  Public
 */
router.get('/symbols', MarketController.getSymbols);
/**
 * @route   GET /api/v1/market/:symbol/price
 * @desc    Get current price for symbol
 * @access  Public
 */
router.get('/:symbol/price', MarketController.symbolValidation, MarketController.getCurrentPrice);
/**
 * @route   GET /api/v1/market/:symbol/history
 * @desc    Get historical data for symbol
 * @access  Public
 */
router.get('/:symbol/history', MarketController.historyValidation, MarketController.getHistory);
/**
 * @route   GET /api/v1/market/:symbol/details
 * @desc    Get detailed information for symbol from PSX
 * @access  Public
 */
router.get('/:symbol/details', MarketController.symbolValidation, MarketController.getSymbolDetails);
export default router;
//# sourceMappingURL=market.routes.js.map