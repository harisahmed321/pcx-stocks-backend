import { prisma } from '../../prisma/client.js';
import { redis, isRedisAvailable } from '../../utils/redis.js';
import { AppError } from '../../utils/errorHandler.js';
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
        // Generate mock prices for each symbol
        const symbolsWithPrices = symbols.map((s) => ({
            ...s,
            lastPrice: this.getBasePriceForSymbol(s.symbol)
        }));
        return symbolsWithPrices;
    }
    static getBasePriceForSymbol(symbol) {
        // Check cache first
        if (this.BASE_PRICE_CACHE[symbol]) {
            return this.BASE_PRICE_CACHE[symbol];
        }
        // Generate base price based on symbol characteristics
        // Common stocks: 50-500 range
        // Large cap: Higher prices (PSO, OGDC, etc.)
        // Small cap: Lower prices
        const basePrices = {
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
    static generateBasePriceFromSymbol(symbol) {
        // Generate a consistent price based on symbol characters
        let hash = 0;
        for (let i = 0; i < symbol.length; i++) {
            hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
        }
        // Generate price between 10 and 500
        const price = 10 + (Math.abs(hash) % 490);
        return Math.round(price * 100) / 100;
    }
    static async getCurrentPrice(symbol) {
        // Check cache first (if Redis is available)
        if (isRedisAvailable()) {
            try {
                const cached = await redis.get(this.CACHE_PREFIX + symbol);
                if (cached) {
                    return parseFloat(cached);
                }
            }
            catch (err) {
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
    static generateMockPrice(symbol) {
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
//# sourceMappingURL=market.service.js.map