import { SymbolsSyncJob } from '../src/jobs/symbolsSyncJob.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  logger.info('=== Manual Symbols Sync Trigger ===');

  const syncJob = new SymbolsSyncJob();

  try {
    await syncJob.syncSymbols();
    logger.info('✅ Symbols sync completed successfully!');
    process.exit(0);
  } catch (error: any) {
    logger.error('❌ Symbols sync failed:', error);
    process.exit(1);
  }
}

main();
