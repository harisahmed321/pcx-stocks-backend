import { prisma } from '../../prisma/client.js';
import { redis, isRedisAvailable } from '../../utils/redis.js';
import { AppError } from '../../utils/errorHandler.js';
import axios from 'axios';
export class MarketService {
    static CACHE_TTL = 10; // seconds
    static CACHE_PREFIX = 'market:latest:';
    static BASE_PRICE_CACHE = {};
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
        // Fetch latest market data for each symbol
        const symbolsWithPrices = await Promise.all(symbols.map(async (s) => {
            const latestData = await prisma.marketData.findFirst({
                where: { symbol: s.symbol },
                orderBy: { timestamp: 'desc' }
            });
            return {
                ...s,
                lastPrice: latestData ? Number(latestData.close) : 0
            };
        }));
        return symbolsWithPrices;
    }
    static async getSymbolsPaginated(page = 1, limit = 50) {
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
        // Fetch latest market data for each symbol
        const symbolsWithPrices = await Promise.all(symbols.map(async (s) => {
            const latestData = await prisma.marketData.findFirst({
                where: { symbol: s.symbol },
                orderBy: { timestamp: 'desc' }
            });
            const lastPrice = latestData ? Number(latestData.close) : 0;
            const ldcp = latestData ? Number(latestData.ldcp || latestData.close) : 0;
            const change = lastPrice - ldcp;
            const changePercent = ldcp > 0 ? (change / ldcp) * 100 : 0;
            return {
                ...s,
                lastPrice,
                currentPrice: lastPrice,
                change: parseFloat(change.toFixed(2)),
                changePercent: parseFloat(changePercent.toFixed(2))
            };
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
        return symbols.map((s) => s.symbol);
    }
    // DEPRECATED: Mock data generators - no longer used
    // Kept for reference only - all prices now fetched from database
    /*
    private static getBasePriceForSymbol(symbol: string): number {
      // Check cache first
      if (this.BASE_PRICE_CACHE[symbol]) {
        return this.BASE_PRICE_CACHE[symbol];
      }
  
      // Generate base price based on symbol characteristics
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
  
      const basePrice = basePrices[symbol] || this.generateBasePriceFromSymbol(symbol);
      this.BASE_PRICE_CACHE[symbol] = basePrice;
  
      return basePrice;
    }
  
    private static generateBasePriceFromSymbol(symbol: string): number {
      let hash = 0;
      for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
      }
      const price = 10 + (Math.abs(hash) % 490);
      return Math.round(price * 100) / 100;
    }
    */
    static async getCurrentPrice(symbol) {
        const symbolUpper = symbol.toUpperCase();
        // Check cache first (if Redis is available)
        if (isRedisAvailable()) {
            try {
                const cached = await redis.get(this.CACHE_PREFIX + symbolUpper);
                if (cached) {
                    return parseFloat(cached);
                }
            }
            catch (err) {
                // Redis error, continue without cache
            }
        }
        // Get latest market data from database
        const latestData = await prisma.marketData.findFirst({
            where: { symbol: symbolUpper },
            orderBy: { timestamp: 'desc' }
        });
        if (!latestData) {
            // Verify symbol exists
            const symbolExists = await prisma.symbol.findUnique({
                where: { symbol: symbolUpper }
            });
            if (!symbolExists) {
                throw new AppError(`Symbol ${symbol} not found`, 404);
            }
            throw new AppError(`No market data available for ${symbol}`, 404);
        }
        const price = Number(latestData.close);
        // Cache it (if Redis is available)
        if (isRedisAvailable()) {
            try {
                await redis.setex(this.CACHE_PREFIX + symbolUpper, this.CACHE_TTL, price.toString());
            }
            catch (err) {
                // Redis error, continue without caching
            }
        }
        return price;
    }
    static async getMultiplePrices(symbols) {
        const prices = {};
        for (const symbol of symbols) {
            try {
                prices[symbol] = await this.getCurrentPrice(symbol);
            }
            catch (error) {
                // Skip if symbol not found
                continue;
            }
        }
        return prices;
    }
    static async getHistoricalData(symbol, from, to, interval = 'daily') {
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
    static async ingestMarketData(symbol, data) {
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
            }
            catch (err) {
                // Redis error, continue without caching
            }
        }
    }
    // DEPRECATED: Mock price generator - no longer used
    /*
    static generateMockPrice(symbol: string): StockPrice {
      const basePrice = this.getBasePriceForSymbol(symbol);
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
    */
    /**
     * Get symbol details from database and latest market data
     */
    /**
     * Get symbol timeseries data from PSX API
     */
    static async getSymbolTimeseries(symbol, type = 'int') {
        try {
            const url = `https://dps.psx.com.pk/timeseries/${type}/${symbol.toUpperCase()}`;
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });
            // PSX API returns data in format: { data: [[timestamp, price, volume, ...], ...] }
            // We need to transform it to a more usable format
            if (response.data && response.data.data) {
                return response.data.data.map((item) => ({
                    time: item[0],
                    value: item[1],
                    volume: item[2]
                }));
            }
            return [];
        }
        catch (error) {
            console.error(`Failed to fetch timeseries for ${symbol}:`, error.message);
            return []; // Return empty array on failure to avoid breaking the UI
        }
    }
    static async getSymbolDetailsFromPSX(symbol) {
        try {
            const symbolUpper = symbol.toUpperCase();
            // Get symbol information from database
            const symbolData = await prisma.symbol.findUnique({
                where: { symbol: symbolUpper }
            });
            if (!symbolData) {
                throw new AppError(`Symbol ${symbol} not found`, 404);
            }
            // Get latest market data for this symbol
            const latestMarketData = await prisma.marketData.findFirst({
                where: { symbol: symbolUpper },
                orderBy: { timestamp: 'desc' }
            });
            // Fetch timeseries data for chart (intraday)
            const chartData = await this.getSymbolTimeseries(symbolUpper, 'int');
            // Calculate price and change
            const lastPrice = latestMarketData ? Number(latestMarketData.close) : 0;
            const open = latestMarketData ? Number(latestMarketData.open) : lastPrice;
            const high = latestMarketData ? Number(latestMarketData.high) : lastPrice;
            const low = latestMarketData ? Number(latestMarketData.low) : lastPrice;
            const volume = latestMarketData ? Number(latestMarketData.volume) : 0;
            const ldcp = latestMarketData
                ? Number(latestMarketData.ldcp || latestMarketData.close)
                : lastPrice;
            const change = lastPrice - ldcp;
            const changePercent = ldcp > 0 ? (change / ldcp) * 100 : 0;
            return {
                symbol: symbolUpper,
                name: symbolData.name || symbolUpper,
                price: {
                    last: parseFloat(lastPrice.toFixed(2)),
                    change: parseFloat(change.toFixed(2)),
                    changePercent: parseFloat(changePercent.toFixed(2))
                },
                stats: {
                    open: parseFloat(open.toFixed(2)),
                    high: parseFloat(high.toFixed(2)),
                    low: parseFloat(low.toFixed(2)),
                    volume: volume,
                    ldcp: parseFloat(ldcp.toFixed(2))
                },
                chartData, // Include chart data in response
                profile: {
                    sector: symbolData.sectorName || '',
                    about: `${symbolData.name} is listed on the Pakistan Stock Exchange under the ${symbolData.sectorName || 'N/A'} sector.`,
                    contact: {
                        address: '',
                        phone: '',
                        email: '',
                        website: ''
                    }
                },
                timestamp: latestMarketData?.timestamp || new Date()
            };
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Failed to fetch symbol details: ${error.message}`, 500);
        }
    }
    /**
     * Fetch 5 years timeseries data from PSX API for backtesting
     * Response format: [[timestamp, price, volume], ...]
     */
    static async getTimeseriesFromPSX(symbol) {
        try {
            const url = `https://dps.psx.com.pk/timeseries/int/${symbol}`;
            const response = await axios.get(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (response.data.status === 1 && response.data.data) {
                // Parse the data: [[timestamp, price, volume], ...]
                const rawData = response.data.data;
                // Transform to more usable format with Date objects
                const timeseries = rawData.map((item) => ({
                    timestamp: new Date(item[0] * 1000), // Convert Unix timestamp to Date
                    price: item[1],
                    volume: item[2]
                }));
                // Sort by timestamp ascending (oldest first)
                timeseries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                return {
                    symbol,
                    dataPoints: timeseries.length,
                    startDate: timeseries[0]?.timestamp,
                    endDate: timeseries[timeseries.length - 1]?.timestamp,
                    data: timeseries
                };
            }
            throw new AppError('No timeseries data available from PSX', 404);
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Failed to fetch timeseries data: ${error.message}`, 500);
        }
    }
}
//# sourceMappingURL=market.service.js.map