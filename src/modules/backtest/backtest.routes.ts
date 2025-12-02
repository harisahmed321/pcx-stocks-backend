import { Router } from 'express';
import { BacktestController } from './backtest.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/backtest:
 *   post:
 *     summary: Run backtest for alert strategy
 *     tags: [Backtest]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - startDate
 *               - endDate
 *               - alert
 *             properties:
 *               symbol:
 *                 type: string
 *                 example: "SYS"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-12-01"
 *               timeframe:
 *                 type: string
 *                 enum: [daily, hourly]
 *                 default: daily
 *               initialCapital:
 *                 type: number
 *                 default: 100000
 *               positionSize:
 *                 type: number
 *                 description: Percentage of capital (0.5 = 50%)
 *                 default: 1
 *               stopLossPct:
 *                 type: number
 *                 description: Stop loss percentage (0.1 = 10%)
 *                 default: 0.1
 *               takeProfitPct:
 *                 type: number
 *                 description: Take profit percentage (0.2 = 20%)
 *                 default: 0.2
 *               feesPct:
 *                 type: number
 *                 description: Round-trip fees percentage (0.005 = 0.5%)
 *                 default: 0.005
 *               alert:
 *                 type: object
 *                 required:
 *                   - condition
 *                   - signalType
 *                   - logicMode
 *                 properties:
 *                   name:
 *                     type: string
 *                   condition:
 *                     type: string
 *                     example: "> 150"
 *                   signalType:
 *                     type: string
 *                     enum: [BUY, SELL, NEUTRAL]
 *                   logicMode:
 *                     type: string
 *                     enum: [ALL, ANY]
 *                   indicatorConfig:
 *                     type: object
 *     responses:
 *       200:
 *         description: Backtest results
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, BacktestController.runBacktest);

export default router;
