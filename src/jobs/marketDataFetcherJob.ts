import { logger } from '../utils/logger.js';
import { prisma } from '../prisma/client.js';
import { MarketDataParserService } from '../services/marketDataParser.service.js';

export class MarketDataFetcherJob {
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;
  private fetchInterval: number = 30000; // Default 30 seconds
  private scheduledTime: string | null = null; // For admin scheduling

  /**
   * Set custom fetch interval (in seconds)
   */
  setInterval(seconds: number): void {
    this.fetchInterval = seconds * 1000;
    logger.info(`Market data fetch interval set to ${seconds} seconds`);

    // Restart with new interval if already running
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  /**
   * Set scheduled time (24-hour format, e.g., "14:30")
   */
  setScheduledTime(time: string | null): void {
    this.scheduledTime = time;
    logger.info(`Market data scheduled time set to: ${time || 'disabled'}`);
  }

  /**
   * Fetch market data for a single symbol
   */
  async fetchSymbolData(symbol: string): Promise<boolean> {
    try {
      // Get symbol URL from database
      const symbolData = await prisma.symbol.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: { url: true }
      });

      if (!symbolData || !symbolData.url) {
        logger.warn(`No URL found for symbol ${symbol}`);
        return false;
      }

      // Fetch and parse HTML
      const parsedData = await MarketDataParserService.fetchAndParse(symbol, symbolData.url);

      if (!parsedData) {
        return false;
      }

      // Check if we need to calculate change from previous close
      const previousData = await prisma.marketData.findFirst({
        where: { symbol: symbol.toUpperCase() },
        orderBy: { timestamp: 'desc' }
      });

      // If we have previous close and current LDCP, calculate change
      if (previousData?.close && parsedData.ldcp !== null) {
        parsedData.change = parsedData.ldcp - Number(previousData.close);
        parsedData.changePercent = (parsedData.change / Number(previousData.close)) * 100;
        parsedData.close = parsedData.ldcp; // Use LDCP as current close
      }

      // Save to database
      await prisma.marketData.create({
        data: {
          symbol: parsedData.symbol.toUpperCase(),
          timestamp: parsedData.timestamp,
          open: parsedData.open,
          high: parsedData.high,
          low: parsedData.low,
          close: parsedData.close,
          volume: parsedData.volume ? BigInt(parsedData.volume) : null,
          change: parsedData.change,
          changePercent: parsedData.changePercent,
          ldcp: parsedData.ldcp,
          var: parsedData.var,
          haircut: parsedData.haircut,
          peRatio: parsedData.peRatio,
          oneYearChange: parsedData.oneYearChange,
          ytdChange: parsedData.ytdChange,
          askPrice: parsedData.askPrice,
          askVolume: parsedData.askVolume ? BigInt(parsedData.askVolume) : null,
          bidPrice: parsedData.bidPrice,
          bidVolume: parsedData.bidVolume ? BigInt(parsedData.bidVolume) : null,
          circuitBreakerLow: parsedData.circuitBreakerLow,
          circuitBreakerHigh: parsedData.circuitBreakerHigh,
          dayRangeLow: parsedData.dayRangeLow,
          dayRangeHigh: parsedData.dayRangeHigh,
          week52RangeLow: parsedData.week52RangeLow,
          week52RangeHigh: parsedData.week52RangeHigh,
          fetchedAt: new Date()
        }
      });

      logger.info(`✅ Market data saved for ${symbol}`);
      return true;
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';

      // Don't log 404s as errors - they're expected for some symbols
      if (!errorMessage.includes('404') && !errorMessage.includes('Not Found')) {
        logger.error(`Error fetching market data for ${symbol}: ${errorMessage}`);
      }
      return false;
    }
  }

  /**
   * Fetch market data for all trading symbols
   */
  async fetchAllSymbols(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Market data fetch already running, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      logger.info('Starting market data fetch for all symbols...');

      // Get all trading symbols (excluding bonds)
      const symbols = await prisma.symbol.findMany({
        where: { isDebt: false },
        select: { symbol: true },
        orderBy: { symbol: 'asc' }
      });

      logger.info(`Fetching market data for ${symbols.length} symbols...`);

      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;

      // Process symbols in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map(async (s) => {
            return await this.fetchSymbolData(s.symbol);
          })
        );

        // Count results
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            if (result.value === true) {
              successCount++;
            } else {
              skippedCount++; // Symbol not available (404, etc.)
            }
          } else {
            failCount++;
            logger.error(`Failed to process symbol: ${result.reason}`);
          }
        });

        // Small delay between batches to be respectful
        if (i + batchSize < symbols.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      logger.info(
        `Market data fetch completed: ${successCount} succeeded, ${skippedCount} skipped (not available), ${failCount} failed`
      );
    } catch (error: any) {
      logger.error('Error in market data fetch job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Start the background job
   */
  start(): void {
    logger.info(`Starting market data fetcher job (interval: ${this.fetchInterval / 1000}s)`);

    const runFetch = () => {
      this.fetchAllSymbols();
    };

    // Run immediately on startup
    runFetch();

    // Schedule periodic fetches
    this.intervalId = setInterval(runFetch, this.fetchInterval);
  }

  /**
   * Stop the background job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info('Market data fetcher job stopped');
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      running: !!this.intervalId,
      isFetching: this.isRunning,
      interval: this.fetchInterval / 1000, // Convert to seconds
      scheduledTime: this.scheduledTime
    };
  }
}
