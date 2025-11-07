import { Request, Response } from 'express';
import { SymbolsService } from './symbols.service.js';
import { logger } from '../../utils/logger.js';

export class SymbolsController {
  static async getSymbols(req: Request, res: Response) {
    try {
      const { q, limit } = req.query;

      const symbols = await SymbolsService.getSymbols(
        q as string,
        limit ? parseInt(limit as string) : 50
      );

      return ApiResponse.success(res, symbols, 'Symbols retrieved successfully');
    } catch (error) {
      logger.error('Error getting symbols:', error);
      return ApiResponse.error(res, 'Failed to get symbols', 500);
    }
  }

  static async searchSymbols(req: Request, res: Response) {
    try {
      const { q, limit } = req.query;

      if (!q || typeof q !== 'string') {
        return ApiResponse.error(res, 'Search query is required', 400);
      }

      const symbols = await SymbolsService.searchSymbols(q, limit ? parseInt(limit as string) : 20);

      return ApiResponse.success(res, symbols, 'Search results retrieved successfully');
    } catch (error) {
      logger.error('Error searching symbols:', error);
      return ApiResponse.error(res, 'Failed to search symbols', 500);
    }
  }

  static async getSymbolByCode(req: Request, res: Response) {
    try {
      const { symbol } = req.params;

      const symbolData = await SymbolsService.getSymbolByCode(symbol);

      if (!symbolData) {
        return ApiResponse.error(res, 'Symbol not found', 404);
      }

      return ApiResponse.success(res, symbolData, 'Symbol retrieved successfully');
    } catch (error) {
      logger.error('Error getting symbol:', error);
      return ApiResponse.error(res, 'Failed to get symbol', 500);
    }
  }

  static async getTradingSymbols(req: Request, res: Response) {
    try {
      const symbols = await SymbolsService.getTradingSymbols();
      return ApiResponse.success(res, symbols, 'Trading symbols retrieved successfully');
    } catch (error) {
      logger.error('Error getting trading symbols:', error);
      return ApiResponse.error(res, 'Failed to get trading symbols', 500);
    }
  }

  static async getSymbolsBySector(req: Request, res: Response) {
    try {
      const { sector } = req.params;
      const symbols = await SymbolsService.getSymbolsBySector(sector);
      return ApiResponse.success(res, symbols, 'Symbols retrieved successfully');
    } catch (error) {
      logger.error('Error getting symbols by sector:', error);
      return ApiResponse.error(res, 'Failed to get symbols by sector', 500);
    }
  }

  static async getAllSectors(req: Request, res: Response) {
    try {
      const sectors = await SymbolsService.getAllSectors();
      return ApiResponse.success(res, sectors, 'Sectors retrieved successfully');
    } catch (error) {
      logger.error('Error getting sectors:', error);
      return ApiResponse.error(res, 'Failed to get sectors', 500);
    }
  }
}
