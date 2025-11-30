import { ResponseHelper } from '../../utils/response.js';
import { logger } from '../../utils/logger.js';
import { prisma } from '../../prisma/client.js';
// This will be injected from server.ts
let marketDataFetcherJobInstance = null;
export function setMarketDataFetcherJob(job) {
    marketDataFetcherJobInstance = job;
}
/**
 * Serialize market data for JSON response (convert BigInt and Decimal to strings/numbers)
 */
function serializeMarketData(item) {
    return {
        id: item.id,
        symbol: item.symbol,
        timestamp: item.timestamp,
        open: item.open ? Number(item.open) : null,
        high: item.high ? Number(item.high) : null,
        low: item.low ? Number(item.low) : null,
        close: item.close ? Number(item.close) : null,
        volume: item.volume ? item.volume.toString() : null,
        change: item.change ? Number(item.change) : null,
        changePercent: item.changePercent ? Number(item.changePercent) : null,
        ldcp: item.ldcp ? Number(item.ldcp) : null,
        var: item.var ? Number(item.var) : null,
        haircut: item.haircut ? Number(item.haircut) : null,
        peRatio: item.peRatio ? Number(item.peRatio) : null,
        oneYearChange: item.oneYearChange ? Number(item.oneYearChange) : null,
        ytdChange: item.ytdChange ? Number(item.ytdChange) : null,
        askPrice: item.askPrice ? Number(item.askPrice) : null,
        askVolume: item.askVolume ? item.askVolume?.toString() : null,
        bidPrice: item.bidPrice ? Number(item.bidPrice) : null,
        bidVolume: item.bidVolume ? item.bidVolume?.toString() : null,
        circuitBreakerLow: item.circuitBreakerLow ? Number(item.circuitBreakerLow) : null,
        circuitBreakerHigh: item.circuitBreakerHigh ? Number(item.circuitBreakerHigh) : null,
        dayRangeLow: item.dayRangeLow ? Number(item.dayRangeLow) : null,
        dayRangeHigh: item.dayRangeHigh ? Number(item.dayRangeHigh) : null,
        week52RangeLow: item.week52RangeLow ? Number(item.week52RangeLow) : null,
        week52RangeHigh: item.week52RangeHigh ? Number(item.week52RangeHigh) : null,
        fetchedAt: item.fetchedAt,
        createdAt: item.createdAt
    };
}
export class AdminController {
    /**
     * Get market data for a symbol
     */
    static async getSymbolMarketData(req, res) {
        try {
            const { symbol } = req.params;
            const { limit = '100' } = req.query;
            const data = await prisma.marketData.findMany({
                where: { symbol: symbol.toUpperCase() },
                orderBy: { timestamp: 'desc' },
                take: parseInt(limit)
            });
            // Serialize market data for JSON response
            const serializedData = data.map(serializeMarketData);
            return ResponseHelper.success(res, serializedData, 'Market data retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting symbol market data:', error);
            return ResponseHelper.error(res, null, 'Failed to get market data', 500);
        }
    }
    /**
     * Manually trigger fetch for a specific symbol
     */
    static async triggerSymbolFetch(req, res) {
        try {
            const { symbol } = req.params;
            if (!marketDataFetcherJobInstance) {
                return ResponseHelper.error(res, null, 'Market data fetcher job not initialized', 500);
            }
            const success = await marketDataFetcherJobInstance.fetchSymbolData(symbol);
            if (success) {
                return ResponseHelper.success(res, { symbol }, 'Market data fetched successfully');
            }
            else {
                return ResponseHelper.error(res, null, 'Failed to fetch market data', 500);
            }
        }
        catch (error) {
            logger.error('Error triggering symbol fetch:', error);
            return ResponseHelper.error(res, null, 'Failed to trigger fetch', 500);
        }
    }
    /**
     * Get market data fetcher job status
     */
    static async getFetcherStatus(req, res) {
        try {
            if (!marketDataFetcherJobInstance) {
                return ResponseHelper.error(res, null, 'Market data fetcher job not initialized', 500);
            }
            const status = marketDataFetcherJobInstance.getStatus();
            return ResponseHelper.success(res, status, 'Fetcher status retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting fetcher status:', error);
            return ResponseHelper.error(res, null, 'Failed to get status', 500);
        }
    }
    /**
     * Update fetch interval
     */
    static async updateFetchInterval(req, res) {
        try {
            const { interval } = req.body; // in seconds
            if (!interval || typeof interval !== 'number' || interval < 10) {
                return ResponseHelper.badRequest(res, null, 'Interval must be at least 10 seconds');
            }
            if (!marketDataFetcherJobInstance) {
                return ResponseHelper.error(res, null, 'Market data fetcher job not initialized', 500);
            }
            await marketDataFetcherJobInstance.setInterval(interval);
            return ResponseHelper.success(res, { interval }, `Fetch interval updated to ${interval} seconds`);
        }
        catch (error) {
            logger.error('Error updating fetch interval:', error);
            return ResponseHelper.error(res, null, 'Failed to update interval', 500);
        }
    }
    /**
     * Set time window for fetching (start and end time)
     */
    static async setTimeWindow(req, res) {
        try {
            const { startTime, endTime } = req.body; // in HH:mm format (24-hour)
            // Validate time format if provided
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (startTime && !timeRegex.test(startTime)) {
                return ResponseHelper.badRequest(res, null, 'Invalid start time format. Use HH:mm (24-hour format)');
            }
            if (endTime && !timeRegex.test(endTime)) {
                return ResponseHelper.badRequest(res, null, 'Invalid end time format. Use HH:mm (24-hour format)');
            }
            if (!marketDataFetcherJobInstance) {
                return ResponseHelper.error(res, null, 'Market data fetcher job not initialized', 500);
            }
            await marketDataFetcherJobInstance.setTimeWindow(startTime || null, endTime || null);
            return ResponseHelper.success(res, { startTime: startTime || null, endTime: endTime || null }, `Time window updated: ${startTime || 'no start'} - ${endTime || 'no end'}`);
        }
        catch (error) {
            logger.error('Error updating time window:', error);
            return ResponseHelper.error(res, null, 'Failed to update time window', 500);
        }
    }
    /**
     * Set scheduled time for fetching
     */
    static async setScheduledTime(req, res) {
        try {
            const { time } = req.body; // 24-hour format, e.g., "14:30" or null to disable
            if (time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
                return ResponseHelper.badRequest(res, null, 'Invalid time format. Use HH:MM (24-hour format)');
            }
            if (!marketDataFetcherJobInstance) {
                return ResponseHelper.error(res, null, 'Market data fetcher job not initialized', 500);
            }
            marketDataFetcherJobInstance.setScheduledTime(time || null);
            return ResponseHelper.success(res, { time }, 'Scheduled time updated successfully');
        }
        catch (error) {
            logger.error('Error setting scheduled time:', error);
            return ResponseHelper.error(res, null, 'Failed to set scheduled time', 500);
        }
    }
    /**
     * Get all market data with pagination
     */
    static async getAllMarketData(req, res) {
        try {
            const { page = '1', limit = '50', symbol } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;
            const where = {};
            if (symbol) {
                where.symbol = symbol.toUpperCase();
            }
            const [data, total] = await Promise.all([
                prisma.marketData.findMany({
                    where,
                    orderBy: { timestamp: 'desc' },
                    skip,
                    take: limitNum
                }),
                prisma.marketData.count({ where })
            ]);
            // Serialize market data for JSON response
            const serializedData = data.map(serializeMarketData);
            return ResponseHelper.success(res, {
                data: serializedData,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }, 'Market data retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting all market data:', error);
            return ResponseHelper.error(res, null, 'Failed to get market data', 500);
        }
    }
    /**
     * Get symbols list for admin
     */
    static async getSymbols(req, res) {
        try {
            const symbols = await prisma.symbol.findMany({
                where: { isDebt: false },
                orderBy: { symbol: 'asc' },
                select: {
                    id: true,
                    symbol: true,
                    name: true,
                    sectorName: true,
                    url: true
                }
            });
            return ResponseHelper.success(res, symbols, 'Symbols retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting symbols:', error);
            return ResponseHelper.error(res, null, 'Failed to get symbols', 500);
        }
    }
    /**
     * Get latest market data for all symbols (one record per symbol)
     */
    static async getLatestMarketData(req, res) {
        try {
            // Get all symbols
            const symbols = await prisma.symbol.findMany({
                where: { isDebt: false },
                select: { symbol: true },
                orderBy: { symbol: 'asc' }
            });
            // For each symbol, get the latest market data
            const latestDataPromises = symbols.map(async (s) => {
                const latestData = await prisma.marketData.findFirst({
                    where: { symbol: s.symbol },
                    orderBy: { timestamp: 'desc' }
                });
                return latestData;
            });
            const results = await Promise.all(latestDataPromises);
            // Filter out nulls and serialize
            const latestData = results
                .filter((data) => data !== null)
                .map(serializeMarketData);
            return ResponseHelper.success(res, latestData, 'Latest market data retrieved successfully');
        }
        catch (error) {
            logger.error('Error getting latest market data:', error);
            return ResponseHelper.error(res, null, 'Failed to get latest market data', 500);
        }
    }
}
//# sourceMappingURL=admin.controller.js.map