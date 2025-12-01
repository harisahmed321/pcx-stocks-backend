import { logger } from '../utils/logger.js';
import { prisma } from '../prisma/client.js';

interface PSXSymbol {
  symbol: string;
  name: string;
  sectorName: string;
  isETF: boolean;
  isDebt: boolean;
}

export class SymbolsSyncJob {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private scheduleConfig: {
    time: string | null;
    days: string[];
  } = {
    time: '09:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  };

  async syncSymbols(): Promise<void> {
    if (this.isRunning) {
      logger.info('Symbols sync already running, skipping...');
      return;
    }

    try {
      this.isRunning = true;
      logger.info('Starting PSX symbols sync...');

      // Fetch symbols from PSX API
      const response = await fetch('https://dps.psx.com.pk/symbols');

      if (!response.ok) {
        throw new Error(`PSX API returned ${response.status}: ${response.statusText}`);
      }

      const symbols = (await response.json()) as PSXSymbol[];
      logger.info(`Fetched ${symbols.length} symbols from PSX`);

      // Check if there are symbols to sync
      if (symbols.length === 0) {
        logger.warn('No symbols fetched from PSX API, skipping sync');
        return;
      }

      // Get existing symbols from database
      const existingSymbols = await prisma.symbol.findMany({
        select: { symbol: true }
      });
      const existingSymbolSet = new Set(existingSymbols.map((s) => s.symbol));
      logger.info(`Found ${existingSymbols.length} existing symbols in database`);

      // Filter only missing symbols
      const missingSymbols = symbols.filter(
        (symbolData) => !existingSymbolSet.has(symbolData.symbol)
      );

      if (missingSymbols.length === 0) {
        logger.info('All symbols are already in database. No new symbols to add.');
        return;
      }

      logger.info(`Found ${missingSymbols.length} missing symbols to add`);

      // Prepare missing symbols data with URLs
      const symbolsToInsert = missingSymbols.map((symbolData) => ({
        symbol: symbolData.symbol,
        name: symbolData.name,
        sectorName: symbolData.sectorName || null,
        isETF: symbolData.isETF,
        isDebt: symbolData.isDebt,
        url: `https://dps.psx.com.pk/company/${symbolData.symbol}`
      }));

      // Insert missing symbols in batch
      try {
        const batchSize = 1000;
        let insertedCount = 0;

        for (let i = 0; i < symbolsToInsert.length; i += batchSize) {
          const batch = symbolsToInsert.slice(i, i + batchSize);
          const result = await prisma.symbol.createMany({
            data: batch,
            skipDuplicates: true
          });
          insertedCount += result.count;
          logger.debug(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.count} symbols`);
        }

        logger.info(
          `Symbols sync completed: ${insertedCount} new symbols added. Last updated: ${new Date().toISOString()}`
        );
      } catch (error: any) {
        logger.error('Error inserting symbols:', error.message);
        throw error;
      }
    } catch (error: any) {
      logger.error('Error syncing PSX symbols:', error);
    } finally {
      this.isRunning = false;
    }
  }

  start(): void {
    logger.info('Starting symbols sync job (one-time execution)');

    // Run once on startup
    this.syncSymbols();
  }

  /**
   * Set schedule configuration for symbol sync
   */
  setScheduleConfig(config: { time: string | null; days: string[] }): void {
    this.scheduleConfig = {
      time: config.time || '09:00',
      days:
        config.days.length > 0
          ? config.days
          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    };

    logger.info(`Symbol sync schedule updated:`, this.scheduleConfig);

    // Restart scheduler with new config
    this.stop();
    this.scheduleDaily();
  }

  /**
   * Get current schedule configuration
   */
  getScheduleConfig(): { time: string | null; days: string[] } {
    return { ...this.scheduleConfig };
  }

  /**
   * Check if current day is a scheduled day
   */
  private isScheduledDay(): boolean {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];

    // Check if today is a scheduled day
    return this.scheduleConfig.days.includes(currentDay);
  }

  private scheduleDaily(): void {
    const schedule = () => {
      const now = new Date();

      // Check if we're on a scheduled day
      if (!this.isScheduledDay()) {
        logger.info('Current day is not a scheduled day');
        // Schedule next check in 1 hour
        this.intervalId = setTimeout(
          () => {
            schedule();
          },
          60 * 60 * 1000
        ); // Check every hour
        return;
      }

      const targetTime = new Date();

      // Use configured time (default 9:00 AM)
      const [hour, minute] = (this.scheduleConfig.time || '09:00').split(':').map(Number);
      targetTime.setHours(hour, minute, 0, 0);

      // If we've passed the scheduled time today, schedule for next valid day
      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);

        // Find next valid day
        const dayNames = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday'
        ];
        let daysChecked = 0;
        while (daysChecked < 7) {
          const dayName = dayNames[targetTime.getDay()];
          if (this.scheduleConfig.days.includes(dayName)) {
            break;
          }
          targetTime.setDate(targetTime.getDate() + 1);
          daysChecked++;
        }
      }

      const timeUntilRun = targetTime.getTime() - now.getTime();

      logger.info(`Next symbols sync scheduled for: ${targetTime.toISOString()}`);

      this.intervalId = setTimeout(() => {
        this.syncSymbols();
        schedule(); // Reschedule for next run
      }, timeUntilRun);
    };

    schedule();
  }

  stop(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      logger.info('Symbols sync job stopped');
    }
  }
}
