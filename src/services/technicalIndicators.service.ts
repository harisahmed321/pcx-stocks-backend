import { RSI, MACD, EMA, BollingerBands, SMA } from 'technicalindicators';
import { prisma } from '../prisma/client';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: string | Date;
}

export interface IndicatorConfig {
  rsi?: {
    enabled: boolean;
    period: number;
    overbought: number;
    oversold: number;
    triggerType: 'overbought' | 'oversold' | 'both';
  };
  macd?: {
    enabled: boolean;
    fast: number;
    slow: number;
    signal: number;
    triggerType: 'bullish' | 'bearish' | 'any';
  };
  ema?: {
    enabled: boolean;
    short: number;
    long: number;
    crossoverType: 'bullish' | 'bearish' | 'any';
  };
  bollinger?: {
    enabled: boolean;
    period: number;
    deviation: number;
    triggerType: 'upper' | 'lower' | 'both';
  };
  volume?: {
    enabled: boolean;
    period: number;
    multiplier: number;
  };
}

export interface ComputedIndicators {
  rsi?: number;
  macd?: {
    MACD: number;
    signal: number;
    histogram: number;
  };
  emaShort?: number;
  emaLong?: number;
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
  };
  avgVolume?: number;
  currentVolume?: number;
}

export class TechnicalIndicatorsService {
  /**
   * Fetch historical candles from database with timeframe aggregation
   */
  async fetchHistoricalCandles(
    symbol: string,
    startDate: Date,
    endDate: Date,
    timeframe: 'daily' | 'hourly' = 'daily',
    limit?: number
  ): Promise<Candle[]> {
    try {
      const marketData = await prisma.marketData.findMany({
        where: {
          symbol,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        },
        ...(limit && { take: limit })
      });

      if (marketData.length === 0) {
        return [];
      }

      // Convert to Candle format
      const candles: Candle[] = marketData.map((data) => ({
        open: data.open
          ? parseFloat(data.open.toString())
          : parseFloat(data.close?.toString() || '0'),
        high: data.high
          ? parseFloat(data.high.toString())
          : parseFloat(data.close?.toString() || '0'),
        low: data.low ? parseFloat(data.low.toString()) : parseFloat(data.close?.toString() || '0'),
        close: parseFloat(data.close?.toString() || '0'),
        volume: data.volume ? Number(data.volume) : 0,
        timestamp: data.timestamp
      }));

      // If hourly timeframe requested, use raw data (assuming DB stores hourly)
      if (timeframe === 'hourly') {
        return candles;
      }

      // For daily, aggregate by day if needed
      return this.aggregateCandlesToDaily(candles);
    } catch (error) {
      console.error('Error fetching historical candles:', error);
      throw new Error('Failed to fetch historical candles');
    }
  }

  /**
   * Aggregate candles to daily timeframe
   */
  private aggregateCandlesToDaily(candles: Candle[]): Candle[] {
    const dailyCandles: Map<string, Candle> = new Map();

    candles.forEach((candle) => {
      const dateKey = new Date(candle.timestamp).toISOString().split('T')[0];

      if (!dailyCandles.has(dateKey)) {
        dailyCandles.set(dateKey, {
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          timestamp: dateKey
        });
      } else {
        const existing = dailyCandles.get(dateKey)!;
        existing.high = Math.max(existing.high, candle.high);
        existing.low = Math.min(existing.low, candle.low);
        existing.close = candle.close; // Last close of the day
        existing.volume += candle.volume;
      }
    });

    return Array.from(dailyCandles.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Calculate RSI indicator
   */
  calculateRSI(candles: Candle[], period: number = 14): number[] {
    const closes = candles.map((c) => c.close);

    if (closes.length < period) {
      return [];
    }

    const rsiValues = RSI.calculate({
      values: closes,
      period
    });

    return rsiValues;
  }

  /**
   * Calculate MACD indicator
   */
  calculateMACD(
    candles: Candle[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ): Array<{ MACD: number; signal: number; histogram: number }> {
    const closes = candles.map((c) => c.close);

    if (closes.length < slowPeriod + signalPeriod) {
      return [];
    }

    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false
    });

    // Filter out undefined values and ensure proper typing
    return macdValues.filter(
      (v): v is { MACD: number; signal: number; histogram: number } =>
        v.MACD !== undefined && v.signal !== undefined && v.histogram !== undefined
    );
  }

  /**
   * Calculate EMA indicator
   */
  calculateEMA(candles: Candle[], period: number): number[] {
    const closes = candles.map((c) => c.close);

    if (closes.length < period) {
      return [];
    }

    const emaValues = EMA.calculate({
      values: closes,
      period
    });

    return emaValues;
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(
    candles: Candle[],
    period: number = 20,
    stdDev: number = 2
  ): Array<{ upper: number; middle: number; lower: number; pb?: number }> {
    const closes = candles.map((c) => c.close);

    if (closes.length < period) {
      return [];
    }

    const bbValues = BollingerBands.calculate({
      values: closes,
      period,
      stdDev
    });

    return bbValues;
  }

  /**
   * Calculate Volume Moving Average
   */
  calculateVolumeAvg(candles: Candle[], period: number = 20): number[] {
    const volumes = candles.map((c) => c.volume);

    if (volumes.length < period) {
      return [];
    }

    const volumeAvgValues = SMA.calculate({
      values: volumes,
      period
    });

    return volumeAvgValues;
  }

  /**
   * Compute all configured indicators for given candles
   */
  async computeIndicators(candles: Candle[], config: IndicatorConfig): Promise<ComputedIndicators> {
    if (candles.length === 0) {
      return {};
    }

    const indicators: ComputedIndicators = {};

    try {
      // Calculate RSI
      if (config.rsi?.enabled) {
        const rsiValues = this.calculateRSI(candles, config.rsi.period);
        if (rsiValues.length > 0) {
          indicators.rsi = rsiValues[rsiValues.length - 1];
        }
      }

      // Calculate MACD
      if (config.macd?.enabled) {
        const macdValues = this.calculateMACD(
          candles,
          config.macd.fast,
          config.macd.slow,
          config.macd.signal
        );
        if (macdValues.length > 0) {
          indicators.macd = macdValues[macdValues.length - 1];
        }
      }

      // Calculate EMA (both short and long)
      if (config.ema?.enabled) {
        const emaShortValues = this.calculateEMA(candles, config.ema.short);
        const emaLongValues = this.calculateEMA(candles, config.ema.long);

        if (emaShortValues.length > 0) {
          indicators.emaShort = emaShortValues[emaShortValues.length - 1];
        }
        if (emaLongValues.length > 0) {
          indicators.emaLong = emaLongValues[emaLongValues.length - 1];
        }
      }

      // Calculate Bollinger Bands
      if (config.bollinger?.enabled) {
        const bbValues = this.calculateBollingerBands(
          candles,
          config.bollinger.period,
          config.bollinger.deviation
        );
        if (bbValues.length > 0) {
          indicators.bollinger = bbValues[bbValues.length - 1];
        }
      }

      // Calculate Volume Average
      if (config.volume?.enabled) {
        const volumeAvgValues = this.calculateVolumeAvg(candles, config.volume.period);
        if (volumeAvgValues.length > 0) {
          indicators.avgVolume = volumeAvgValues[volumeAvgValues.length - 1];
        }
        indicators.currentVolume = candles[candles.length - 1].volume;
      }

      return indicators;
    } catch (error) {
      console.error('Error computing indicators:', error);
      return indicators;
    }
  }

  /**
   * Get cached indicators or compute fresh
   */
  async getIndicatorsWithCache(
    symbol: string,
    candles: Candle[],
    config: IndicatorConfig,
    cacheTTL: number = 60
  ): Promise<ComputedIndicators> {
    const cacheKey = `indicators:${symbol}:${JSON.stringify(config)}`;

    try {
      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Compute fresh indicators
      const indicators = await this.computeIndicators(candles, config);

      // Cache the result
      await redis.setex(cacheKey, cacheTTL, JSON.stringify(indicators));

      return indicators;
    } catch (error) {
      console.error('Error with indicator cache:', error);
      // Fallback to direct computation
      return this.computeIndicators(candles, config);
    }
  }

  /**
   * Invalidate indicator cache for a symbol
   */
  async invalidateCache(symbol: string): Promise<void> {
    try {
      const pattern = `indicators:${symbol}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }
}

export const technicalIndicatorsService = new TechnicalIndicatorsService();
