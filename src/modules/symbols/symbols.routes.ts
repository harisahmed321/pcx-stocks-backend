import { Router } from 'express';
import { SymbolsController } from './symbols.controller.js';

const router = Router();

/**
 * @route   GET /api/v1/symbols
 * @desc    Get all symbols with optional search
 * @query   q - Search query, limit - Result limit
 * @access  Public
 */
router.get('/', SymbolsController.getSymbols);

/**
 * @route   GET /api/v1/symbols/search
 * @desc    Search symbols by symbol code or name
 * @query   q - Search query (required), limit - Result limit
 * @access  Public
 */
router.get('/search', SymbolsController.searchSymbols);

/**
 * @route   GET /api/v1/symbols/trading
 * @desc    Get all trading symbols (excluding bonds)
 * @access  Public
 */
router.get('/trading', SymbolsController.getTradingSymbols);

/**
 * @route   GET /api/v1/symbols/sectors
 * @desc    Get all sectors
 * @access  Public
 */
router.get('/sectors', SymbolsController.getAllSectors);

/**
 * @route   GET /api/v1/symbols/sector/:sector
 * @desc    Get symbols by sector
 * @access  Public
 */
router.get('/sector/:sector', SymbolsController.getSymbolsBySector);

/**
 * @route   GET /api/v1/symbols/:symbol
 * @desc    Get symbol by code
 * @access  Public
 */
router.get('/:symbol', SymbolsController.getSymbolByCode);

export default router;
