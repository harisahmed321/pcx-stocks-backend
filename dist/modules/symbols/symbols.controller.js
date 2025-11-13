import { SymbolsService } from './symbols.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
export class SymbolsController {
    static async getSymbols(req, res) {
        try {
            const { q, limit } = req.query;
            const symbols = await SymbolsService.getSymbols(q, limit ? parseInt(limit) : 50);
            return ResponseHelper.success(res, symbols, 'Symbols retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting symbols:', error);
            return ResponseHelper.error(res, null, 'Failed to get symbols', 500);
        }
    }
    static async searchSymbols(req, res) {
        try {
            const { q, limit } = req.query;
            if (!q || typeof q !== 'string') {
                return ResponseHelper.badRequest(res, null, 'Search query is required');
            }
            const symbols = await SymbolsService.searchSymbols(q, limit ? parseInt(limit) : 20);
            return ResponseHelper.success(res, symbols, 'Search results retrieved successfully');
        }
        catch (error) {
            logger.error('Error searching symbols:', error);
            return ResponseHelper.error(res, null, 'Failed to search symbols', 500);
        }
    }
    static async getSymbolByCode(req, res) {
        try {
            const { symbol } = req.params;
            const symbolData = await SymbolsService.getSymbolByCode(symbol);
            if (!symbolData) {
                return ResponseHelper.notFound(res, 'Symbol not found');
            }
            return ResponseHelper.success(res, symbolData, 'Symbol retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting symbol:', error);
            return ResponseHelper.error(res, null, 'Failed to get symbol', 500);
        }
    }
    static async getTradingSymbols(req, res) {
        try {
            const symbols = await SymbolsService.getTradingSymbols();
            return ResponseHelper.success(res, symbols, 'Trading symbols retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting trading symbols:', error);
            return ResponseHelper.error(res, null, 'Failed to get trading symbols', 500);
        }
    }
    static async getSymbolsBySector(req, res) {
        try {
            const { sector } = req.params;
            const symbols = await SymbolsService.getSymbolsBySector(sector);
            return ResponseHelper.success(res, symbols, 'Symbols retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting symbols by sector:', error);
            return ResponseHelper.error(res, null, 'Failed to get symbols by sector', 500);
        }
    }
    static async getAllSectors(req, res) {
        try {
            const sectors = await SymbolsService.getAllSectors();
            return ResponseHelper.success(res, sectors, 'Sectors retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting sectors:', error);
            return ResponseHelper.error(res, null, 'Failed to get sectors', 500);
        }
    }
}
//# sourceMappingURL=symbols.controller.js.map