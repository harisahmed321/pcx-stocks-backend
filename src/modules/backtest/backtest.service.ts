import {
  technicalIndicatorsService,
  IndicatorConfig
} from '../../services/technicalIndicators.service.js';
import { alertEvaluationService } from '../../services/alertEvaluation.service.js';
import { SignalType } from '@prisma/client';
import axios from 'axios';
import { prisma } from '../../prisma/client.js';

export interface BacktestConfig {
  symbol: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  timeframe: 'daily' | 'hourly';
  initialCapital: number;
  positionSize: number; // Percentage of capital (0.5 = 50%, 1 = 100%)
  stopLossPct: number; // e.g., 0.10 = 10%
  takeProfitPct: number; // e.g., 0.20 = 20%
  feesPct: number; // e.g., 0.005 = 0.5% round-trip
  alert: {
    name?: string;
    condition: string;
    signalType: SignalType;
    logicMode: 'ALL' | 'ANY';
    indicatorConfig?: IndicatorConfig;
    // Dual signal support
    enableBuySignal?: boolean;
    enableSellSignal?: boolean;
    buyIndicatorConfig?: IndicatorConfig;
    sellIndicatorConfig?: IndicatorConfig;
    buyLogicMode?: 'ALL' | 'ANY';
    sellLogicMode?: 'ALL' | 'ANY';
  };
}

export interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  pnlPct: number;
  pnlAmount?: number;
  signalType: 'buy' | 'sell';
  shares: number;
}

export interface BacktestResult {
  profit: string; // Percentage
  profitAmount: number;
  winRate: string; // Percentage
  trades: number;
  buyTrades: number;
  sellTrades: number;
  winningTrades: number;
  losingTrades: number;
  maxDrawdown: string; // Percentage
  avgWin: string; // Percentage
  avgLoss: string; // Percentage
  profitFactor: string;
  sharpeRatio: string;
  avgHoldTime: string; // In days
  equityCurve: Array<{ date: string; value: number }>;
  triggerPoints: Array<{ date: string; type: string; price: number }>;
  tradeHistory: Trade[];
  optimizationSuggestions?: OptimizationSuggestion[];
}

export interface OptimizationSuggestion {
  parameter: string;
  currentValue: any;
  suggestedValue: any;
  reason: string;
  potentialImpact: string;
}

export class BacktestService {
  /**
   * Fetch and cache 5 years of historical data from Yahoo Finance
   * Uses database caching to avoid redundant API calls
   */
  private async fetchAndCacheHistoricalData(symbol: string, startDate: Date, endDate: Date) {
    try {
      console.log(
        `Fetching historical data for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`
      );

      // Step 1: Query existing data from database
      const existingData = await prisma.marketData.findMany({
        where: {
          symbol: symbol,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      console.log(`Found ${existingData.length} existing candles in database for ${symbol}`);

      // Step 2: Check if we have sufficient data in cache
      const hasCompleteData = this.hasCompleteHistoricalData(existingData, startDate, endDate);

      // Step 3: Fetch from Yahoo Finance if data is missing or incomplete
      if (!hasCompleteData) {
        console.log(`Fetching data from Yahoo Finance for ${symbol}...`);

        // Convert dates to Unix timestamps
        const period1 = Math.floor(startDate.getTime() / 1000);
        const period2 = Math.floor(endDate.getTime() / 1000);

        // Yahoo Finance API URL (add .KA suffix for Karachi Stock Exchange)
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.KA?period1=${period1}&period2=${period2}&interval=1d`;

        const response = await axios.get(url, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        if (response.data?.chart?.result?.[0]) {
          const result = response.data.chart.result[0];
          const candles = this.parseYahooFinanceData(result);
          console.log(`✓ Fetched ${candles.length} candles from Yahoo Finance`);

          if (candles.length > 0) {
            // Step 4: Store in database
            await this.bulkInsertCandles(symbol, candles);
            console.log(`Successfully cached ${candles.length} candles for ${symbol}`);
          }
        } else {
          console.log(`✗ No data returned from Yahoo Finance for ${symbol}`);
        }
      }

      // Step 5: Return all data from database (existing + newly fetched)
      const allData = await prisma.marketData.findMany({
        where: {
          symbol: symbol,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      console.log(`Returning ${allData.length} total candles for ${symbol}`);

      // Convert Prisma Decimal to number for backtesting
      return allData.map((candle) => ({
        timestamp: candle.timestamp,
        open: candle.open ? parseFloat(candle.open.toString()) : 0,
        high: candle.high ? parseFloat(candle.high.toString()) : 0,
        low: candle.low ? parseFloat(candle.low.toString()) : 0,
        close: candle.close ? parseFloat(candle.close.toString()) : 0,
        volume: candle.volume ? Number(candle.volume) : 0
      }));
    } catch (error: any) {
      console.error('Historical data fetch error:', error.message);
      if (error.response) {
        console.error('Yahoo Finance API error:', error.response.status, error.response.data);
      }
      return null;
    }
  }

  /**
   * Check if we have complete historical data in cache
   */
  private hasCompleteHistoricalData(existingData: any[], startDate: Date, endDate: Date): boolean {
    if (existingData.length === 0) {
      return false;
    }

    // Check if data covers the requested date range
    const firstCandle = new Date(existingData[0].timestamp);
    const lastCandle = new Date(existingData[existingData.length - 1].timestamp);

    // Allow 7 days margin for data coverage
    const hasStartCoverage = firstCandle <= new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const hasEndCoverage = lastCandle >= new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check for significant gaps in data (more than 30 days)
    let hasLargeGaps = false;
    for (let i = 1; i < existingData.length; i++) {
      const gap =
        new Date(existingData[i].timestamp).getTime() -
        new Date(existingData[i - 1].timestamp).getTime();
      const gapDays = gap / (1000 * 60 * 60 * 24);
      if (gapDays > 30) {
        hasLargeGaps = true;
        break;
      }
    }

    return hasStartCoverage && hasEndCoverage && !hasLargeGaps;
  }

  /**
   * Parse Yahoo Finance API response and convert to OHLCV candles
   */
  private parseYahooFinanceData(result: any): any[] {
    const candles: any[] = [];

    try {
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0] || {};

      const opens = quotes.open || [];
      const highs = quotes.high || [];
      const lows = quotes.low || [];
      const closes = quotes.close || [];
      const volumes = quotes.volume || [];

      for (let i = 0; i < timestamps.length; i++) {
        // Skip if any required data is missing
        if (
          !timestamps[i] ||
          opens[i] == null ||
          highs[i] == null ||
          lows[i] == null ||
          closes[i] == null
        ) {
          continue;
        }

        const timestamp = new Date(timestamps[i] * 1000); // Convert Unix timestamp to Date

        candles.push({
          timestamp,
          open: parseFloat(opens[i]) || 0,
          high: parseFloat(highs[i]) || 0,
          low: parseFloat(lows[i]) || 0,
          close: parseFloat(closes[i]) || 0,
          volume: parseInt(volumes[i]) || 0
        });
      }
    } catch (error) {
      console.error('Error parsing Yahoo Finance data:', error);
    }

    return candles;
  }

  /**
   * Bulk insert candles into database with conflict handling
   */
  private async bulkInsertCandles(symbol: string, candles: any[]): Promise<void> {
    try {
      for (const candle of candles) {
        await prisma.marketData.upsert({
          where: {
            symbol_timestamp: {
              symbol: symbol,
              timestamp: candle.timestamp
            }
          },
          update: {
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume
          },
          create: {
            symbol: symbol,
            timestamp: candle.timestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume
          }
        });
      }
    } catch (error: any) {
      console.error('Bulk insert error:', error.message);
      throw error;
    }
  }

  /**
   * Generate sample candle data for demonstration when real data is unavailable
   */
  private generateSampleData(symbol: string, startDate: Date, endDate: Date) {
    console.log(
      `Generating sample data from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const candles = [];
    const currentDate = new Date(startDate);
    let basePrice = 100 + Math.random() * 100; // Random starting price between 100-200

    // Ensure we have at least 250 trading days (approximately 1 year)
    const minDays = 365;
    const actualDays = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (actualDays < minDays) {
      console.log(`Date range too short (${actualDays} days), extending to ${minDays} days`);
      endDate = new Date(startDate.getTime() + minDays * 24 * 60 * 60 * 1000);
    }

    while (currentDate <= endDate) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // Random walk with slight upward bias
        const change = (Math.random() - 0.48) * 5; // -2.4% to +2.6% daily
        basePrice = Math.max(10, basePrice + change);

        const open = basePrice;
        const close = basePrice + (Math.random() - 0.5) * 3;
        const high = Math.max(open, close) + Math.random() * 2;
        const low = Math.min(open, close) - Math.random() * 2;
        const volume = Math.floor(10000 + Math.random() * 50000);

        candles.push({
          timestamp: new Date(currentDate),
          open,
          high,
          low,
          close,
          volume
        });

        basePrice = close;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log(`Generated ${candles.length} sample candles`);
    return candles;
  }

  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    try {
      console.log(
        `Starting backtest for ${config.symbol} from ${config.startDate} to ${config.endDate}`
      );

      const startDate = new Date(config.startDate);
      const endDate = new Date(config.endDate);

      // Fetch and cache historical data from PSX (month-by-month with database caching)
      let candles = await this.fetchAndCacheHistoricalData(config.symbol, startDate, endDate);
      console.log(`Historical data returned ${candles?.length || 0} candles`);

      // If fetching fails, generate sample data for demo purposes
      if (!candles || candles.length === 0) {
        console.log('Generating sample data for demonstration...');
        candles = this.generateSampleData(config.symbol, startDate, endDate);
        console.log(`Generated ${candles?.length || 0} sample candles`);
      }

      if (!candles || candles.length < 50) {
        console.error(`Insufficient data: only ${candles?.length || 0} candles available`);
        throw new Error(
          `Insufficient historical data for backtesting ${config.symbol}. Found ${candles?.length || 0} candles, need at least 50 for meaningful results. Please ensure the symbol has historical data available.`
        );
      }

      console.log(
        `Running backtest with ${candles.length} candles from ${candles[0].timestamp.toISOString()} to ${candles[candles.length - 1].timestamp.toISOString()}`
      );

      // Initialize backtest state
      let capital = config.initialCapital;
      let position: {
        open: boolean;
        entryPrice: number;
        entryDate: string;
        shares: number;
        signalType: 'long' | 'short' | null;
      } = {
        open: false,
        entryPrice: 0,
        entryDate: '',
        shares: 0,
        signalType: null
      };

      const trades: Trade[] = [];
      const equityCurve: Array<{ date: string; value: number }> = [
        {
          date: new Date(candles[0].timestamp).toISOString().split('T')[0],
          value: capital
        }
      ];
      const triggerPoints: Array<{ date: string; type: string; price: number }> = [];

      console.log('Starting backtest loop...');
      console.log('Alert config:', JSON.stringify(config.alert, null, 2));
      console.log('Enable BUY Signal:', config.alert.enableBuySignal);
      console.log('Enable SELL Signal:', config.alert.enableSellSignal);
      console.log(
        'BUY Indicator Config:',
        JSON.stringify(config.alert.buyIndicatorConfig, null, 2)
      );
      console.log(
        'SELL Indicator Config:',
        JSON.stringify(config.alert.sellIndicatorConfig, null, 2)
      );

      let triggeredCount = 0;
      let positionOpenedCount = 0;

      // Backtest loop
      for (let i = 1; i < candles.length; i++) {
        const currentCandle = candles[i];
        const currentDate = new Date(currentCandle.timestamp).toISOString().split('T')[0];

        // Check for forced exit (stop-loss/take-profit)
        if (position.open) {
          const currentPrice = currentCandle.close;
          const pnlPct =
            ((currentPrice - position.entryPrice) / position.entryPrice) *
            (position.signalType === 'long' ? 1 : -1);

          if (pnlPct <= -config.stopLossPct || pnlPct >= config.takeProfitPct) {
            // Force exit
            const exitPrice = currentPrice;
            const exitValue = position.shares * exitPrice;
            const fees = exitValue * (config.feesPct / 2);
            capital += exitValue - fees;

            const tradePnlPct = pnlPct;
            const tradePnlAmount =
              position.shares * exitPrice - position.shares * position.entryPrice;

            // Update last trade
            if (trades.length > 0) {
              const lastTrade = trades[trades.length - 1];
              lastTrade.exitDate = currentDate;
              lastTrade.exitPrice = exitPrice;
              lastTrade.pnlPct = tradePnlPct * 100;
              lastTrade.pnlAmount = tradePnlAmount - fees;
            }

            position = { open: false, entryPrice: 0, entryDate: '', shares: 0, signalType: null };
          }
        }

        // Prepare indicators for alert evaluation
        const prevCandles = candles.slice(0, i);
        const currentCandles = candles.slice(0, i + 1);

        // Determine which indicator config to use
        const isDualSignalMode = config.alert.enableBuySignal && config.alert.enableSellSignal;
        const isBuyOnly = config.alert.enableBuySignal && !config.alert.enableSellSignal;
        const isSellOnly = config.alert.enableSellSignal && !config.alert.enableBuySignal;

        let indicatorConfig = config.alert.indicatorConfig || {};

        // For dual signal mode, merge both configs to compute all needed indicators
        if (isDualSignalMode) {
          indicatorConfig = {
            ...config.alert.buyIndicatorConfig,
            ...config.alert.sellIndicatorConfig
          };
        } else if (isBuyOnly) {
          indicatorConfig = config.alert.buyIndicatorConfig || config.alert.indicatorConfig || {};
        } else if (isSellOnly) {
          indicatorConfig = config.alert.sellIndicatorConfig || config.alert.indicatorConfig || {};
        }

        const prevIndicators = await technicalIndicatorsService.computeIndicators(
          prevCandles,
          indicatorConfig
        );

        const currentIndicators = await technicalIndicatorsService.computeIndicators(
          currentCandles,
          indicatorConfig
        );

        // Check for dual signal mode (both BUY and SELL)
        let buySignalTriggered = false;
        let sellSignalTriggered = false;

        if (isDualSignalMode) {
          // Check BUY signal
          if (config.alert.buyIndicatorConfig) {
            const buyAlert: any = {
              condition: config.alert.condition,
              signalType: SignalType.BUY,
              logicMode: config.alert.buyLogicMode || 'ANY',
              indicatorConfig: config.alert.buyIndicatorConfig
            };
            const buyResult = await alertEvaluationService.checkAlert(
              buyAlert,
              currentCandle.close,
              currentIndicators,
              prevIndicators
            );
            buySignalTriggered = buyResult.triggered;
          }

          // Check SELL signal
          if (config.alert.sellIndicatorConfig) {
            const sellAlert: any = {
              condition: config.alert.condition,
              signalType: SignalType.SELL,
              logicMode: config.alert.sellLogicMode || 'ANY',
              indicatorConfig: config.alert.sellIndicatorConfig
            };
            const sellResult = await alertEvaluationService.checkAlert(
              sellAlert,
              currentCandle.close,
              currentIndicators,
              prevIndicators
            );
            sellSignalTriggered = sellResult.triggered;
          }
        } else {
          // Single signal mode (backward compatibility)
          const mockAlert: any = {
            condition: config.alert.condition,
            signalType: config.alert.signalType,
            logicMode: config.alert.logicMode,
            indicatorConfig: config.alert.indicatorConfig
          };

          const alertResult = await alertEvaluationService.checkAlert(
            mockAlert,
            currentCandle.close,
            currentIndicators,
            prevIndicators
          );

          if (alertResult.triggered && alertResult.signalType) {
            if (alertResult.signalType === SignalType.BUY) {
              buySignalTriggered = true;
            } else if (alertResult.signalType === SignalType.SELL) {
              sellSignalTriggered = true;
            }
          }
        }

        // Log first few evaluations to help debug
        if (i <= 100 && i % 20 === 0) {
          console.log(`Candle ${i} (${currentDate}):`, {
            price: currentCandle.close.toFixed(2),
            rsi: currentIndicators.rsi?.toFixed(2),
            volume: currentCandle.volume,
            avgVolume: (currentIndicators.avgVolume || 0).toFixed(0),
            bollinger: currentIndicators.bollinger
              ? {
                  upper: currentIndicators.bollinger.upper?.toFixed(2),
                  middle: currentIndicators.bollinger.middle?.toFixed(2),
                  lower: currentIndicators.bollinger.lower?.toFixed(2)
                }
              : 'N/A',
            buySignal: buySignalTriggered,
            sellSignal: sellSignalTriggered
          });
        }

        // Enter new position if triggered and no position open
        if ((buySignalTriggered || sellSignalTriggered) && !position.open) {
          triggeredCount++;

          const entryPrice = currentCandle.close;
          const investment = capital * config.positionSize;
          const shares = investment / entryPrice;
          const fees = investment * (config.feesPct / 2);

          capital -= fees;

          const signalType = buySignalTriggered ? 'long' : 'short';

          position = {
            open: true,
            entryPrice,
            entryDate: currentDate,
            shares,
            signalType
          };

          positionOpenedCount++;

          if (positionOpenedCount <= 5) {
            console.log(`Trade ${positionOpenedCount} opened:`, {
              date: currentDate,
              type: signalType,
              price: entryPrice,
              shares: shares.toFixed(2),
              signal: buySignalTriggered ? 'BUY' : 'SELL'
            });
          }

          trades.push({
            entryDate: currentDate,
            entryPrice,
            pnlPct: 0,
            signalType: buySignalTriggered ? 'buy' : 'sell',
            shares
          });

          triggerPoints.push({
            date: currentDate,
            type: buySignalTriggered ? 'buy' : 'sell',
            price: entryPrice
          });
        }

        // Update equity curve
        let currentValue = capital;
        if (position.open) {
          const currentPrice = currentCandle.close;
          const positionValue = position.shares * currentPrice;
          currentValue = capital + positionValue - position.shares * position.entryPrice;
        }

        equityCurve.push({
          date: currentDate,
          value: currentValue
        });
      }

      console.log(
        `Backtest loop completed. Triggers: ${triggeredCount}, Positions opened: ${positionOpenedCount}, Trades: ${trades.length}`
      );

      if (triggeredCount === 0) {
        console.log('\n⚠️  WARNING: No trades were triggered!');
        console.log('Possible reasons:');
        if (config.alert.logicMode === 'ALL') {
          console.log('1. Logic mode is "ALL" - all indicators must trigger simultaneously');
          console.log('   Consider changing to "ANY" mode for more flexibility');
        }
        console.log('2. Indicator conditions may be too strict or contradictory');
        console.log('   Example: RSI oversold + BB upper breakout cannot happen together');
        console.log('3. Check the logged candle data above to see indicator values');
        console.log('4. Verify indicator settings are appropriate for the symbol\n');
      }

      // Close any open position at end of backtest
      if (position.open) {
        const lastCandle = candles[candles.length - 1];
        const exitPrice = lastCandle.close;
        const exitValue = position.shares * exitPrice;
        const fees = exitValue * (config.feesPct / 2);
        capital += exitValue - fees;

        const pnlPct =
          ((exitPrice - position.entryPrice) / position.entryPrice) *
          (position.signalType === 'long' ? 1 : -1);
        const pnlAmount = position.shares * exitPrice - position.shares * position.entryPrice;

        if (trades.length > 0) {
          const lastTrade = trades[trades.length - 1];
          lastTrade.exitDate = new Date(lastCandle.timestamp).toISOString().split('T')[0];
          lastTrade.exitPrice = exitPrice;
          lastTrade.pnlPct = pnlPct * 100;
          lastTrade.pnlAmount = pnlAmount - fees;
        }

        equityCurve[equityCurve.length - 1].value = capital;
      }

      // Calculate stats
      const stats = this.calculateBacktestStats(trades, equityCurve, config.initialCapital);

      // Generate optimization suggestions
      const optimizationSuggestions = this.generateOptimizationSuggestions(config, stats);

      return {
        ...stats,
        tradeHistory: trades,
        equityCurve,
        triggerPoints,
        optimizationSuggestions
      };
    } catch (error) {
      console.error('Backtest error:', error);
      throw new Error(
        `Backtest failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private calculateBacktestStats(
    trades: Trade[],
    equityCurve: Array<{ date: string; value: number }>,
    initialCapital: number
  ) {
    const finalValue = equityCurve[equityCurve.length - 1]?.value || initialCapital;
    const totalProfit = ((finalValue - initialCapital) / initialCapital) * 100;
    const profitAmount = finalValue - initialCapital;

    const completedTrades = trades.filter((t) => t.exitDate !== undefined);
    const wins = completedTrades.filter((t) => t.pnlPct > 0);
    const losses = completedTrades.filter((t) => t.pnlPct <= 0);

    const buyTrades = trades.filter((t) => t.signalType === 'buy').length;
    const sellTrades = trades.filter((t) => t.signalType === 'sell').length;

    const winRate = completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.pnlPct, 0) / wins.length : 0;
    const avgLoss =
      losses.length > 0 ? losses.reduce((sum, t) => sum + t.pnlPct, 0) / losses.length : 0;

    const totalWinPnl = wins.reduce((sum, t) => sum + Math.abs(t.pnlPct), 0);
    const totalLossPnl = losses.reduce((sum, t) => sum + Math.abs(t.pnlPct), 0);
    const profitFactor = totalLossPnl > 0 ? totalWinPnl / totalLossPnl : wins.length > 0 ? 999 : 0;

    // Max Drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    for (const point of equityCurve) {
      if (point.value > peak) peak = point.value;
      const dd = ((peak - point.value) / peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Sharpe Ratio (simplified)
    const returns = equityCurve
      .slice(1)
      .map((p, i) => (p.value - equityCurve[i].value) / equityCurve[i].value);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Average Hold Time
    const holdTimes = completedTrades
      .filter((t) => t.entryDate && t.exitDate)
      .map((t) => {
        const entry = new Date(t.entryDate);
        const exit = new Date(t.exitDate!);
        return (exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24);
      });
    const avgHoldTime =
      holdTimes.length > 0 ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length : 0;

    return {
      profit: totalProfit.toFixed(1),
      profitAmount: Math.round(profitAmount),
      winRate: winRate.toFixed(0),
      trades: completedTrades.length,
      buyTrades,
      sellTrades,
      winningTrades: wins.length,
      losingTrades: losses.length,
      maxDrawdown: (-maxDrawdown).toFixed(1),
      avgWin: avgWin.toFixed(1),
      avgLoss: avgLoss.toFixed(1),
      profitFactor: profitFactor.toFixed(1),
      sharpeRatio: sharpe.toFixed(2),
      avgHoldTime: `${Math.round(avgHoldTime)} days`
    };
  }

  /**
   * Generate optimization suggestions based on backtest results
   */
  private generateOptimizationSuggestions(
    config: BacktestConfig,
    stats: any
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const winRate = parseFloat(stats.winRate);
    const profitFactor = parseFloat(stats.profitFactor);
    const sharpeRatio = parseFloat(stats.sharpeRatio);
    const avgLoss = Math.abs(parseFloat(stats.avgLoss));

    // Check if using technical indicators
    const indicatorConfig = config.alert.indicatorConfig;

    // 1. Win Rate Analysis
    if (winRate < 40) {
      suggestions.push({
        parameter: 'Logic Mode',
        currentValue: config.alert.logicMode,
        suggestedValue: config.alert.logicMode === 'ALL' ? 'ANY' : 'ALL',
        reason: `Win rate is low at ${winRate}%. ${config.alert.logicMode === 'ALL' ? 'Using ANY logic may generate more signals with better timing' : 'Using ALL logic may filter out false signals'}`,
        potentialImpact: 'Could improve win rate by 10-20%'
      });
    }

    // 2. RSI Optimization
    if (indicatorConfig?.rsi?.enabled) {
      const currentPeriod = indicatorConfig.rsi.period || 14;
      if (winRate < 50 && currentPeriod === 14) {
        suggestions.push({
          parameter: 'RSI Period',
          currentValue: currentPeriod,
          suggestedValue: currentPeriod === 14 ? 21 : 9,
          reason:
            'Standard RSI(14) may be too sensitive or too slow. Longer period (21) reduces noise, shorter (9) catches trends faster',
          potentialImpact: 'Could improve signal quality by 15%'
        });
      }

      if (
        indicatorConfig.rsi.triggerType === 'oversold' ||
        indicatorConfig.rsi.triggerType === 'overbought'
      ) {
        const currentOversold = indicatorConfig.rsi.oversold || 30;
        const currentOverbought = indicatorConfig.rsi.overbought || 70;

        if (winRate < 45) {
          suggestions.push({
            parameter: 'RSI Levels',
            currentValue: `Oversold: ${currentOversold}, Overbought: ${currentOverbought}`,
            suggestedValue: 'Oversold: 25, Overbought: 75',
            reason: 'More extreme levels filter out weak signals and catch stronger reversals',
            potentialImpact: 'Could reduce false signals by 30%'
          });
        }
      }
    }

    // 3. MACD Optimization
    if (indicatorConfig?.macd?.enabled) {
      const fast = indicatorConfig.macd.fast || 12;
      const slow = indicatorConfig.macd.slow || 26;

      if (profitFactor < 1.5) {
        suggestions.push({
          parameter: 'MACD Parameters',
          currentValue: `Fast: ${fast}, Slow: ${slow}`,
          suggestedValue: 'Fast: 8, Slow: 21 (more responsive) or Fast: 19, Slow: 39 (less noise)',
          reason:
            'Current parameters may be missing trend changes. Faster settings catch trends earlier, slower settings reduce whipsaws',
          potentialImpact: 'Could improve profit factor by 20-40%'
        });
      }
    }

    // 4. EMA Optimization
    if (indicatorConfig?.ema?.enabled) {
      const fast = indicatorConfig.ema.short || 50;
      const slow = indicatorConfig.ema.long || 200;

      if (stats.trades < 10) {
        suggestions.push({
          parameter: 'EMA Periods',
          currentValue: `Fast: ${fast}, Slow: ${slow}`,
          suggestedValue: 'Fast: 20, Slow: 50 (more signals) or Fast: 10, Slow: 30 (short-term)',
          reason:
            'Current periods are generating too few signals. Shorter periods increase trading frequency',
          potentialImpact: 'Could generate 2-3x more trading opportunities'
        });
      }
    }

    // 5. Bollinger Bands Optimization
    if (indicatorConfig?.bollinger?.enabled) {
      const stdDev = indicatorConfig.bollinger.deviation || 2;

      if (winRate < 45) {
        suggestions.push({
          parameter: 'Bollinger Bands Std Dev',
          currentValue: stdDev,
          suggestedValue: stdDev === 2 ? 2.5 : 1.5,
          reason: `Current setting may be generating ${stdDev < 2 ? 'too many false breakouts' : 'missing valid breakouts'}`,
          potentialImpact: 'Could improve win rate by 10-15%'
        });
      }
    }

    // 6. Volume Filter
    if (indicatorConfig?.volume?.enabled) {
      const multiplier = indicatorConfig.volume.multiplier || 1.5;

      if (profitFactor < 1.2) {
        suggestions.push({
          parameter: 'Volume Multiplier',
          currentValue: `${multiplier}x`,
          suggestedValue: `${multiplier + 0.5}x`,
          reason:
            'Higher volume threshold filters weak signals and confirms strong price movements',
          potentialImpact: 'Could improve profit factor by 25%'
        });
      }
    }

    // 7. Risk Management
    if (avgLoss > 5) {
      suggestions.push({
        parameter: 'Stop Loss',
        currentValue: `${config.stopLossPct * 100}%`,
        suggestedValue: '5%',
        reason: `Average loss is ${avgLoss.toFixed(1)}%, which is high. Tighter stop loss limits downside`,
        potentialImpact: 'Could reduce average loss by 30-40%'
      });
    }

    // 8. General Strategy Advice
    if (profitFactor < 1.0) {
      suggestions.push({
        parameter: 'Strategy Review',
        currentValue: 'Current configuration',
        suggestedValue: 'Consider combining multiple indicators',
        reason:
          'Strategy is unprofitable. Using 2-3 confirming indicators (e.g., RSI + MACD + Volume) improves accuracy',
        potentialImpact: 'Could turn strategy profitable'
      });
    }

    if (sharpeRatio < 0.5) {
      suggestions.push({
        parameter: 'Risk-Adjusted Returns',
        currentValue: `Sharpe: ${sharpeRatio}`,
        suggestedValue: 'Add trend filter (EMA crossover)',
        reason:
          'Risk-adjusted returns are poor. Trading with trend (above/below EMA) improves consistency',
        potentialImpact: 'Could double Sharpe ratio'
      });
    }

    return suggestions;
  }
}

export const backtestService = new BacktestService();
