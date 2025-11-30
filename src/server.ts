import { createServer } from 'http';
import { createApp } from './app.js';
import { MarketGateway } from './sockets/marketGateway.js';
import { SymbolsSyncJob } from './jobs/symbolsSyncJob.js';
import { MarketDataFetcherJob } from './jobs/marketDataFetcherJob.js';
import { logger } from './utils/logger.js';
import { prisma } from './prisma/client.js';
import { redis, initializeRedis, isRedisAvailable } from './utils/redis.js';
import { setMarketDataFetcherJob } from './modules/admin/admin.controller.js';

export async function startServer() {
  const app = createApp();
  const httpServer = createServer(app);

  // Try to connect to Redis (non-blocking)
  await initializeRedis();

  // Setup Socket.IO
  const marketGateway = new MarketGateway(httpServer);
  logger.info('Socket.IO initialized');

  // Start price ingestor job
  // DISABLED: This job generates mock prices that override real database prices
  // const priceIngestor = new PriceIngestor(marketGateway);
  // priceIngestor.start();

  // Start symbols sync job (fetches PSX symbols daily at 7:30 AM)
  const symbolsSyncJob = new SymbolsSyncJob();
  symbolsSyncJob.start();
  logger.info('Symbols sync job started');

  // Start market data fetcher job (fetches market data every 30 seconds)
  const marketDataFetcherJob = new MarketDataFetcherJob();
  await marketDataFetcherJob.start();
  logger.info('Market data fetcher job started');

  // Start market simulator job (generates real-time price updates)
  // DISABLED: This job generates mock prices that override real database prices
  // const marketSimulatorJob = new MarketSimulatorJob(marketGateway, 3000); // Update every 3 seconds
  // await marketSimulatorJob.start();
  // logger.info('Market simulator job started');

  // Inject job instance into admin controller
  setMarketDataFetcherJob(marketDataFetcherJob);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');

    // priceIngestor.stop(); // Disabled
    symbolsSyncJob.stop();
    marketDataFetcherJob.stop();
    // marketSimulatorJob.stop(); // Disabled

    httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    await prisma.$disconnect();

    if (isRedisAvailable()) {
      try {
        await redis.quit();
      } catch (err) {
        // Ignore errors during shutdown
      }
    }

    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return { httpServer, marketGateway, symbolsSyncJob, marketDataFetcherJob };
}
