import { prisma } from '../../prisma/client.js';
import { redis, isRedisAvailable } from '../../utils/redis.js';
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
  private static readonly BASE_PRICE_CACHE: Record<string, number> = {};

  static async getAvailableSymbols() {
    // Get trading symbols from database (excluding bonds/debt instruments)
    const symbols = await prisma.symbol.findMany({
      where: {
        isDebt: false
      },
      orderBy: {
        symbol: 'asc'
      },
      select: {
        symbol: true,
        name: true,
        sectorName: true,
        isETF: true
      }
    });

    // Generate mock prices for each symbol
    const symbolsWithPrices = symbols.map((s) => ({
      ...s,
      lastPrice: this.getBasePriceForSymbol(s.symbol)
    }));

    return symbolsWithPrices;
  }

  static async getSymbolsPaginated(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.symbol.count({
      where: {
        isDebt: false
      }
    });

    // Get paginated symbols
    const symbols = await prisma.symbol.findMany({
      where: {
        isDebt: false
      },
      orderBy: {
        symbol: 'asc'
      },
      select: {
        symbol: true,
        name: true,
        sectorName: true,
        isETF: true
      },
      skip,
      take: limit
    });

    // Generate mock prices for each symbol
    const symbolsWithPrices = symbols.map((s) => ({
      ...s,
      lastPrice: this.getBasePriceForSymbol(s.symbol),
      currentPrice: this.getBasePriceForSymbol(s.symbol)
    }));

    return {
      data: symbolsWithPrices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + symbols.length < total
      }
    };
  }

  static async getAllSymbolsForUpdates() {
    // Get all trading symbols for price updates
    const symbols = await prisma.symbol.findMany({
      where: {
        isDebt: false
      },
      select: {
        symbol: true
      }
    });

    return symbols.map(s => s.symbol);
  }

  private static getBasePriceForSymbol(symbol: string): number {
    // Check cache first
    if (this.BASE_PRICE_CACHE[symbol]) {
      return this.BASE_PRICE_CACHE[symbol];
    }

    // Generate base price based on symbol characteristics
    // Common stocks: 50-500 range
    // Large cap: Higher prices (PSO, OGDC, etc.)
    // Small cap: Lower prices
    const basePrices: Record<string, number> = {
      PSO: 250.5,
      OGDC: 150.75,
      PPL: 180.25,
      HUBC: 120.0,
      LUCK: 800.0,
      ENGRO: 300.5,
      FFC: 110.75,
      MEBL: 90.5,
      MCB: 200.0,
      HBL: 180.5,
      UBL: 165.75,
      BAFL: 55.25,
      KEL: 4.5,
      SNGP: 50.75,
      KSE100: 45000.0
    };

    // Use predefined price if available, otherwise generate based on symbol hash
    const basePrice = basePrices[symbol] || this.generateBasePriceFromSymbol(symbol);
    this.BASE_PRICE_CACHE[symbol] = basePrice;

    return basePrice;
  }

  private static generateBasePriceFromSymbol(symbol: string): number {
    // Generate a consistent price based on symbol characters
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate price between 10 and 500
    const price = 10 + (Math.abs(hash) % 490);
    return Math.round(price * 100) / 100;
  }

  static async getCurrentPrice(symbol: string): Promise<number> {
    // Check cache first (if Redis is available)
    if (isRedisAvailable()) {
      try {
        const cached = await redis.get(this.CACHE_PREFIX + symbol);
        if (cached) {
          return parseFloat(cached);
        }
      } catch (err) {
        // Redis error, continue without cache
      }
    }

    // Verify symbol exists in database
    const symbolData = await prisma.symbol.findUnique({
      where: { symbol: symbol.toUpperCase() }
    });

    if (!symbolData) {
      throw new AppError(`Symbol ${symbol} not found`, 404);
    }

    // Get base price and add random variation (-2% to +2%)
    const basePrice = this.getBasePriceForSymbol(symbol);
    const variation = (Math.random() - 0.5) * 0.04;
    const price = basePrice * (1 + variation);

    // Cache it (if Redis is available)
    if (isRedisAvailable()) {
      try {
        await redis.setex(this.CACHE_PREFIX + symbol, this.CACHE_TTL, price.toString());
      } catch (err) {
        // Redis error, continue without caching
      }
    }

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
          lte: to
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    return data.map((d) => ({
      timestamp: d.timestamp,
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
      volume: Number(d.volume)
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
        volume: data.volume
      }
    });

    // Update cache (if Redis is available)
    if (isRedisAvailable()) {
      try {
        await redis.setex(this.CACHE_PREFIX + symbol, this.CACHE_TTL, data.close.toString());
      } catch (err) {
        // Redis error, continue without caching
      }
    }
  }

  static generateMockPrice(symbol: string): StockPrice {
    const basePrice = this.getBasePriceForSymbol(symbol);

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
      timestamp: new Date()
    };
  }
}
