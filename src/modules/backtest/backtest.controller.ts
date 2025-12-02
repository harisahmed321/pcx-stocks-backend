import { Request, Response } from 'express';
import { backtestService, BacktestConfig } from './backtest.service.js';

export class BacktestController {
  static async runBacktest(req: Request, res: Response) {
    try {
      const config: BacktestConfig = req.body;

      // Validate required fields
      if (!config.symbol || !config.startDate || !config.endDate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: symbol, startDate, endDate'
        });
      }

      if (!config.alert || !config.alert.condition) {
        return res.status(400).json({
          success: false,
          message: 'Alert configuration with condition is required'
        });
      }

      // Set defaults
      const backtestConfig: BacktestConfig = {
        ...config,
        timeframe: config.timeframe || 'daily',
        initialCapital: config.initialCapital || 100000,
        positionSize: config.positionSize || 1,
        stopLossPct: config.stopLossPct || 0.1,
        takeProfitPct: config.takeProfitPct || 0.2,
        feesPct: config.feesPct || 0.005
      };

      const result = await backtestService.runBacktest(backtestConfig);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Backtest error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Backtest failed'
      });
    }
  }
}
