import { logger } from '../utils/logger.js';
import { prisma } from '../prisma/client.js';
import { MarketDataParserService } from '../services/marketDataParser.service.js';
import { AlertsService } from '../modules/alerts/alerts.service.js';
import { MarketGateway } from '../sockets/marketGateway.js';
import pLimit from 'p-limit';

export class MarketDataFetcherJob {
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;
  private fetchInterval: number = 60000; // Default 60 seconds
  private scheduledTime: string | null = null; // For admin scheduling
  private marketGateway?: MarketGateway;
  private concurrencyLimit: number = 20; // Parallel fetch limit
  private startTime: string | null = null; // Start time in HH:mm format (24-hour)
  private endTime: string | null = null; // End time in HH:mm format (24-hour)

  /**
   * Set the market gateway for broadcasting price updates and triggering alerts
   */
  setMarketGateway(marketGateway: MarketGateway): void {
    this.marketGateway = marketGateway;
    logger.info('Market gateway set for alert triggering');
  }

  /**
   * Set custom fetch interval (in seconds)
   */
  async setInterval(seconds: number): Promise<void> {
    this.fetchInterval = seconds * 1000;
    logger.info(`Market data fetch interval set to ${seconds} seconds`);

    // Save to database
    await this.saveConfiguration();

    // Restart with new interval if already running
    if (this.intervalId) {
      this.stop();
      await this.start();
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
   * Set start and end time for market data fetching (24-hour format, e.g., "09:00", "17:00")
   */
  async setTimeWindow(startTime: string | null, endTime: string | null): Promise<void> {
    this.startTime = startTime;
    this.endTime = endTime;
    logger.info(
      `Market data fetch time window set to: ${startTime || 'no start'} - ${endTime || 'no end'}`
    );
    // Save to database
    await this.saveConfiguration();
  }

  /**
   * Check if current time is within the allowed time window
   */
  private isWithinTimeWindow(): boolean {
    if (!this.startTime && !this.endTime) {
      return true; // No time restrictions
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    if (this.startTime) {
      const [startHour, startMinute] = this.startTime.split(':').map(Number);
      const startTimeMinutes = startHour * 60 + startMinute;

      if (this.endTime) {
        // Both start and end time specified
        const [endHour, endMinute] = this.endTime.split(':').map(Number);
        const endTimeMinutes = endHour * 60 + endMinute;

        if (startTimeMinutes <= endTimeMinutes) {
          // Normal case: start < end (e.g., 09:00 - 17:00)
          return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
        } else {
          // Overnight case: start > end (e.g., 22:00 - 06:00)
          return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes <= endTimeMinutes;
        }
      } else {
        // Only start time specified
        return currentTimeMinutes >= startTimeMinutes;
      }
    } else if (this.endTime) {
      // Only end time specified
      const [endHour, endMinute] = this.endTime.split(':').map(Number);
      const endTimeMinutes = endHour * 60 + endMinute;
      return currentTimeMinutes <= endTimeMinutes;
    }

    return true;
  }

  /**
   * Fetch market data for a single symbol
   */
  async fetchSymbolData(symbol: string): Promise<boolean> {
    try {
      // Get symbol URL from database, or construct it if missing
      const symbolData = await prisma.symbol.findUnique({
        where: { symbol: symbol.toUpperCase() },
        select: { url: true }
      });

      // Use correct URL format: https://dps.psx.com.pk/company/{symbol}
      const symbolUrl = symbolData?.url || `https://dps.psx.com.pk/company/${symbol.toUpperCase()}`;

      // Ensure URL uses correct format (fix old URLs if needed)
      const correctUrl = symbolUrl.includes('/company/')
        ? symbolUrl
        : `https://dps.psx.com.pk/company/${symbol.toUpperCase()}`;

      // Fetch and parse HTML
      const parsedData = await MarketDataParserService.fetchAndParse(symbol, correctUrl);

      if (!parsedData) {
        return false;
      }

      // Check if we need to calculate change from previous close
      // Use parsed change and changePercent from HTML if available, otherwise calculate
      const previousData = await prisma.marketData.findFirst({
        where: { symbol: symbol.toUpperCase() },
        orderBy: { timestamp: 'desc' }
      });

      // If change/changePercent were parsed from HTML, use those values
      // Otherwise, calculate from previous day's close
      if (parsedData.change === null || parsedData.changePercent === null) {
        // If we have previous close and current LDCP, calculate change
        if (previousData?.close && parsedData.ldcp !== null) {
          parsedData.change = parsedData.ldcp - Number(previousData.close);
          parsedData.changePercent = (parsedData.change / Number(previousData.close)) * 100;
          parsedData.close = parsedData.ldcp; // Use LDCP as current close
        } else if (parsedData.ldcp !== null) {
          // For first record (no previous data), use LDCP as close and set change to 0
          parsedData.close = parsedData.ldcp;
          if (parsedData.change === null) {
            parsedData.change = 0;
          }
          if (parsedData.changePercent === null) {
            parsedData.changePercent = 0;
          }
        }
      } else {
        // If change/changePercent were parsed from HTML, use LDCP as close if available
        if (parsedData.ldcp !== null && parsedData.close === null) {
          parsedData.close = parsedData.ldcp;
        }
      }

      // Data Integrity Validation: Only require askPrice to be non-null
      // change and changePercent can be null for first record, but we set them above
      if (parsedData.askPrice === null) {
        logger.debug(
          `Skipping ${symbol}: Missing required field askPrice (askPrice: ${parsedData.askPrice})`
        );
        return false;
      }

      // Efficient Data Update Logic: Check if record exists for same day
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Check if there's an existing record for today
      const existingRecord = await prisma.marketData.findFirst({
        where: {
          symbol: parsedData.symbol.toUpperCase(),
          timestamp: {
            gte: todayStart,
            lte: todayEnd
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      const dataToSave = {
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
      };

      if (existingRecord) {
        // Update existing record if data has changed
        // Compare key fields that should trigger an update
        const existingChange = existingRecord.change ? Number(existingRecord.change) : null;
        const existingChangePercent = existingRecord.changePercent
          ? Number(existingRecord.changePercent)
          : null;
        const existingAskPrice = existingRecord.askPrice ? Number(existingRecord.askPrice) : null;
        const existingClose = existingRecord.close ? Number(existingRecord.close) : null;
        const existingVolume = existingRecord.volume ? Number(existingRecord.volume) : null;

        const hasChanged =
          existingChange !== parsedData.change ||
          existingChangePercent !== parsedData.changePercent ||
          existingAskPrice !== parsedData.askPrice ||
          existingClose !== parsedData.close ||
          existingVolume !== parsedData.volume;

        if (hasChanged) {
          await prisma.marketData.update({
            where: { id: existingRecord.id },
            data: dataToSave
          });
          logger.info(`✅ Market data updated for ${symbol} (existing record)`);

          // Check alerts and broadcast price update after data change
          await this.checkAlertsAndBroadcast(
            symbol,
            parsedData.askPrice || parsedData.close || 0,
            parsedData.change || 0,
            parsedData.changePercent || 0
          );
        } else {
          logger.debug(`No changes detected for ${symbol}, skipping update`);
        }
      } else {
        // Insert new record
        await prisma.marketData.create({
          data: dataToSave
        });
        logger.info(`✅ Market data saved for ${symbol} (new record)`);

        // Check alerts and broadcast price update for new data
        await this.checkAlertsAndBroadcast(
          symbol,
          parsedData.askPrice || parsedData.close || 0,
          parsedData.change || 0,
          parsedData.changePercent || 0
        );
      }

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

    // Note: Time window check is now done at the interval callback level
    // This method assumes it's only called when within the time window

    try {
      this.isRunning = true;
      logger.info('Starting market data fetch for all symbols...');

      // Get all trading symbols (excluding bonds)
      const symbols = await prisma.symbol.findMany({
        where: { isDebt: false },
        select: { symbol: true },
        orderBy: { symbol: 'asc' }
      });

      logger.info(
        `Fetching market data for ${symbols.length} symbols with concurrency limit of ${this.concurrencyLimit}...`
      );

      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;

      // Parallel Data Fetching with concurrency limit
      const limit = pLimit(this.concurrencyLimit);

      const results = await Promise.allSettled(
        symbols.map((s) =>
          limit(async () => {
            return await this.fetchSymbolData(s.symbol);
          })
        )
      );

      // Count results
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value === true) {
            successCount++;
          } else {
            skippedCount++; // Symbol not available (404, missing required fields, etc.)
          }
        } else {
          failCount++;
          logger.error(`Failed to process symbol: ${result.reason}`);
        }
      });

      logger.info(
        `Market data fetch completed: ${successCount} succeeded, ${skippedCount} skipped (not available/invalid), ${failCount} failed`
      );
    } catch (error: any) {
      logger.error('Error in market data fetch job:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Load configuration from database
   */
  async loadConfiguration(): Promise<void> {
    try {
      const configs = await (prisma as any).systemConfig.findMany({
        where: {
          key: {
            in: [
              'marketDataFetcher.startTime',
              'marketDataFetcher.endTime',
              'marketDataFetcher.interval'
            ]
          }
        }
      });

      const configMap = new Map(configs.map((c: any) => [c.key, c.value]));

      // Load time window (set directly without saving to avoid recursion)
      const startTime = configMap.get('marketDataFetcher.startTime');
      const endTime = configMap.get('marketDataFetcher.endTime');
      if (startTime !== undefined || endTime !== undefined) {
        this.startTime = startTime && typeof startTime === 'string' ? startTime : null;
        this.endTime = endTime && typeof endTime === 'string' ? endTime : null;
        logger.info(
          `Loaded time window from database: ${this.startTime || 'no start'} - ${this.endTime || 'no end'}`
        );
      }

      // Load interval (set directly without saving to avoid recursion)
      const interval = configMap.get('marketDataFetcher.interval');
      if (interval && typeof interval === 'string') {
        const intervalSeconds = parseInt(interval, 10);
        if (!isNaN(intervalSeconds) && intervalSeconds > 0) {
          this.fetchInterval = intervalSeconds * 1000;
          logger.info(`Loaded fetch interval from database: ${intervalSeconds}s`);
        }
      }
    } catch (error: any) {
      logger.error('Error loading market data fetcher configuration:', error);
      // Continue with defaults if loading fails
    }
  }

  /**
   * Save configuration to database
   */
  async saveConfiguration(): Promise<void> {
    try {
      // Save time window
      await (prisma as any).systemConfig.upsert({
        where: { key: 'marketDataFetcher.startTime' },
        update: { value: this.startTime || null },
        create: {
          key: 'marketDataFetcher.startTime',
          value: this.startTime || null,
          description: 'Start time for market data fetching (HH:mm format)'
        }
      });

      await (prisma as any).systemConfig.upsert({
        where: { key: 'marketDataFetcher.endTime' },
        update: { value: this.endTime || null },
        create: {
          key: 'marketDataFetcher.endTime',
          value: this.endTime || null,
          description: 'End time for market data fetching (HH:mm format)'
        }
      });

      // Save interval
      await (prisma as any).systemConfig.upsert({
        where: { key: 'marketDataFetcher.interval' },
        update: { value: (this.fetchInterval / 1000).toString() },
        create: {
          key: 'marketDataFetcher.interval',
          value: (this.fetchInterval / 1000).toString(),
          description: 'Fetch interval in seconds'
        }
      });

      logger.debug('Market data fetcher configuration saved to database');
    } catch (error: any) {
      logger.error('Error saving market data fetcher configuration:', error);
    }
  }

  /**
   * Start the background job
   */
  async start(): Promise<void> {
    // Load configuration from database first
    await this.loadConfiguration();

    logger.info(`Starting market data fetcher job (interval: ${this.fetchInterval / 1000}s)`);

    const runFetch = () => {
      // Check time window before running
      if (this.isWithinTimeWindow()) {
        this.fetchAllSymbols();
      } else {
        logger.debug(
          `Skipping market data fetch - outside time window (${this.startTime || 'no start'} - ${this.endTime || 'no end'})`
        );
      }
    };

    // Run immediately on startup only if within time window
    if (this.isWithinTimeWindow()) {
      runFetch();
    } else {
      logger.info(
        `Skipping initial fetch - outside time window (${this.startTime || 'no start'} - ${this.endTime || 'no end'})`
      );
    }

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
   * Set concurrency limit for parallel fetching
   */
  setConcurrencyLimit(limit: number): void {
    this.concurrencyLimit = Math.max(1, Math.min(100, limit)); // Clamp between 1 and 100
    logger.info(`Market data fetch concurrency limit set to ${this.concurrencyLimit}`);
  }

  /**
   * Check alerts and broadcast price update when market data changes
   */
  private async checkAlertsAndBroadcast(
    symbol: string,
    price: number,
    change: number,
    changePercent: number
  ): Promise<void> {
    try {
      // Check if any alerts should be triggered
      const triggeredAlerts = await AlertsService.checkAlerts(symbol, price);

      // Log triggered alerts
      if (triggeredAlerts.length > 0) {
        logger.info(
          `🔔 ${triggeredAlerts.length} alert(s) triggered for ${symbol} at price ${price}`
        );

        // Broadcast to users via WebSocket if marketGateway is available
        if (this.marketGateway) {
          for (const alert of triggeredAlerts) {
            this.marketGateway
              .getIO()
              .of('/market')
              .to(`user:${alert.userId}`)
              .emit('alert:trigger', {
                ...alert,
                message: `Alert triggered for ${symbol}: Price ${price >= alert.currentPrice ? 'reached' : 'dropped to'} ${price}`
              });
          }
        }

        // Create notifications for triggered alerts
        for (const alert of triggeredAlerts) {
          await prisma.notification.create({
            data: {
              userId: alert.userId,
              type: 'ALERT_TRIGGERED',
              title: `Alert Triggered: ${symbol}`,
              message: `Your alert for ${symbol} has been triggered. Current price: ₨${price.toFixed(2)}`,
              relatedId: alert.alertId,
              relatedType: 'ALERT',
              isRead: false
            }
          });
        }
      }

      // Broadcast price update via WebSocket/Redis if marketGateway is available
      if (this.marketGateway && price > 0) {
        this.marketGateway.broadcastPriceUpdate(symbol, price, change, changePercent);
      }
    } catch (error) {
      logger.error(`Error checking alerts for ${symbol}:`, error);
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
      scheduledTime: this.scheduledTime,
      startTime: this.startTime,
      endTime: this.endTime,
      concurrencyLimit: this.concurrencyLimit
    };
  }
}
