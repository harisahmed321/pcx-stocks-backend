import { logger } from '../utils/logger.js';
import { prisma } from '../prisma/client.js';
export class SymbolsSyncJob {
    isRunning = false;
    intervalId;
    async syncSymbols() {
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
            const symbols = (await response.json());
            logger.info(`Fetched ${symbols.length} symbols from PSX`);
            // Check if there are symbols to sync
            if (symbols.length === 0) {
                logger.warn('No symbols fetched from PSX API, skipping sync');
                return;
            }
            // First, delete all existing symbols (empty the table)
            logger.info('Clearing existing symbols from database...');
            const deleteResult = await prisma.symbol.deleteMany({});
            logger.info(`Deleted ${deleteResult.count} existing symbols`);
            // Prepare symbols data with URLs
            const symbolsToInsert = symbols.map((symbolData) => ({
                symbol: symbolData.symbol,
                name: symbolData.name,
                sectorName: symbolData.sectorName || null,
                isETF: symbolData.isETF,
                isDebt: symbolData.isDebt,
                url: `https://dps.psx.com.pk/company/${symbolData.symbol}`
            }));
            // Insert all symbols in batch using createMany for better performance
            logger.info(`Inserting ${symbolsToInsert.length} new symbols...`);
            try {
                // Use createMany for efficient batch insert (since table is empty, no duplicates)
                const batchSize = 1000; // Prisma recommends batches of 1000 or less
                let insertedCount = 0;
                for (let i = 0; i < symbolsToInsert.length; i += batchSize) {
                    const batch = symbolsToInsert.slice(i, i + batchSize);
                    const result = await prisma.symbol.createMany({
                        data: batch,
                        skipDuplicates: true // Safety check, though table should be empty
                    });
                    insertedCount += result.count;
                    logger.debug(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${result.count} symbols`);
                }
                logger.info(`Symbols sync completed: ${insertedCount} symbols inserted`);
            }
            catch (error) {
                logger.error('Error inserting symbols:', error.message);
                throw error; // Re-throw to be caught by outer try-catch
            }
        }
        catch (error) {
            logger.error('Error syncing PSX symbols:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    start() {
        logger.info('Starting symbols sync job scheduler');
        // Run immediately on startup
        this.syncSymbols();
        // Schedule to run daily at 7:30 AM
        this.scheduleDaily();
    }
    scheduleDaily() {
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
    stop() {
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            logger.info('Symbols sync job stopped');
        }
    }
}
//# sourceMappingURL=symbolsSyncJob.js.map