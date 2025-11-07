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

      const symbols: PSXSymbol[] = await response.json();
      logger.info(`Fetched ${symbols.length} symbols from PSX`);

      // Upsert symbols into database
      let createdCount = 0;
      let updatedCount = 0;

      for (const symbolData of symbols) {
        try {
          const existing = await prisma.symbol.findUnique({
            where: { symbol: symbolData.symbol }
          });

          if (existing) {
            await prisma.symbol.update({
              where: { symbol: symbolData.symbol },
              data: {
                name: symbolData.name,
                sectorName: symbolData.sectorName || null,
                isETF: symbolData.isETF,
                isDebt: symbolData.isDebt
              }
            });
            updatedCount++;
          } else {
            await prisma.symbol.create({
              data: {
                symbol: symbolData.symbol,
                name: symbolData.name,
                sectorName: symbolData.sectorName || null,
                isETF: symbolData.isETF,
                isDebt: symbolData.isDebt
              }
            });
            createdCount++;
          }
        } catch (error: any) {
          logger.error(`Error upserting symbol ${symbolData.symbol}:`, error.message);
        }
      }

      logger.info(`Symbols sync completed: ${createdCount} created, ${updatedCount} updated`);
    } catch (error: any) {
      logger.error('Error syncing PSX symbols:', error);
    } finally {
      this.isRunning = false;
    }
  }

  start(): void {
    logger.info('Starting symbols sync job scheduler');

    // Run immediately on startup
    this.syncSymbols();

    // Schedule to run daily at 7:30 AM
    this.scheduleDaily();
  }

  private scheduleDaily(): void {
    const schedule = () => {
      const now = new Date();
      const targetTime = new Date();

      // Set target time to 7:30 AM
      targetTime.setHours(7, 30, 0, 0);

      // If we've passed 7:30 AM today, schedule for tomorrow
      if (now > targetTime) {
        targetTime.setDate(targetTime.getDate() + 1);
      }

      const timeUntilRun = targetTime.getTime() - now.getTime();

      logger.info(`Next symbols sync scheduled for: ${targetTime.toISOString()}`);

      this.intervalId = setTimeout(() => {
        this.syncSymbols();
        schedule(); // Reschedule for next day
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
