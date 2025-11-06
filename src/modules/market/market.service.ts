import { prisma } from '../../prisma/client.js';
import { redis } from '../../utils/redis.js';
import { AppError } from '../../utils/errorHandler.js';

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
}

export interface MarketDataPoint {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class MarketService {
  private static readonly CACHE_TTL = 10; // seconds
  private static readonly CACHE_PREFIX = 'market:latest:';

  // Mock PSX symbols and their base prices
  private static readonly MOCK_SYMBOLS = {
    'PSO': 250.50,
    'OGDC': 150.75,
    'PPL': 180.25,
    'HUBC': 120.00,
    'LUCK': 800.00,
    'ENGRO': 300.50,
    'FFC': 110.75,
    'MEBL': 90.50,
    'MCB': 200.00,
    'HBL': 180.50,
    'UBL': 165.75,
    'BAFL': 55.25,
    'KEL': 4.50,
    'SNGP': 50.75,
    'KSE100': 45000.00,
  };

  static async getAvailableSymbols() {
    const symbols = Object.keys(this.MOCK_SYMBOLS).map((symbol) => ({
      symbol,
      name: symbol,
      lastPrice: this.MOCK_SYMBOLS[symbol as keyof typeof this.MOCK_SYMBOLS],
    }));

    return symbols;
  }

  static async getCurrentPrice(symbol: string): Promise<number> {
    // Check cache first
    const cached = await redis.get(this.CACHE_PREFIX + symbol);
    if (cached) {
      return parseFloat(cached);
    }

    // Get from mock data
    const basePrice = this.MOCK_SYMBOLS[symbol as keyof typeof this.MOCK_SYMBOLS];
    if (!basePrice) {
      throw new AppError(`Symbol ${symbol} not found`, 404);
    }

    // Add random variation (-2% to +2%)
    const variation = (Math.random() - 0.5) * 0.04;
    const price = basePrice * (1 + variation);

    // Cache it
    await redis.setex(this.CACHE_PREFIX + symbol, this.CACHE_TTL, price.toString());

    return price;
  }

  static async getMultiplePrices(symbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    for (const symbol of symbols) {
      try {
        prices[symbol] = await this.getCurrentPrice(symbol);
      } catch (error) {
        // Skip if symbol not found
        continue;
      }
    }

    return prices;
  }

  static async getHistoricalData(
    symbol: string,
    from: Date,
    to: Date,
    interval: string = 'daily'
  ): Promise<MarketDataPoint[]> {
    const data = await prisma.marketData.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        timestamp: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return data.map((d) => ({
      timestamp: d.timestamp,
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
      volume: Number(d.volume),
    }));
  }

  static async ingestMarketData(symbol: string, data: Omit<MarketDataPoint, 'symbol'>) {
    await prisma.marketData.create({
      data: {
        symbol: symbol.toUpperCase(),
        timestamp: data.timestamp,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
      },
    });

    // Update cache
    await redis.setex(this.CACHE_PREFIX + symbol, this.CACHE_TTL, data.close.toString());
  }

  static generateMockPrice(symbol: string): StockPrice {
    const basePrice = this.MOCK_SYMBOLS[symbol as keyof typeof this.MOCK_SYMBOLS] || 100;

    // Random variation (-3% to +3%)
    const variation = (Math.random() - 0.5) * 0.06;
    const price = basePrice * (1 + variation);
    const change = price - basePrice;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 1000000) + 10000,
      timestamp: new Date(),
    };
  }
}

