import { createServer } from 'http';
import { createApp } from './app.js';
import { MarketGateway } from './sockets/marketGateway.js';
import { PriceIngestor } from './jobs/priceIngestor.js';
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
  const priceIngestor = new PriceIngestor(marketGateway);
  priceIngestor.start();

  // Start symbols sync job (fetches PSX symbols daily at 7:30 AM)
  const symbolsSyncJob = new SymbolsSyncJob();
  symbolsSyncJob.start();
  logger.info('Symbols sync job started');

  // Start market data fetcher job (fetches market data every 30 seconds)
  const marketDataFetcherJob = new MarketDataFetcherJob();
  marketDataFetcherJob.start();
  logger.info('Market data fetcher job started');

  // Inject job instance into admin controller
  setMarketDataFetcherJob(marketDataFetcherJob);

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');

    priceIngestor.stop();
    symbolsSyncJob.stop();
    marketDataFetcherJob.stop();

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

  return { httpServer, marketGateway, priceIngestor, symbolsSyncJob, marketDataFetcherJob };
}
