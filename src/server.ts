import { createServer } from 'http';
import { createApp } from './app.js';
import { MarketGateway } from './sockets/marketGateway.js';
import { PriceIngestor } from './jobs/priceIngestor.js';
import { logger } from './utils/logger.js';
import { prisma } from './prisma/client.js';
import { redis } from './utils/redis.js';

export function startServer() {
  const app = createApp();
  const httpServer = createServer(app);

  // Setup Socket.IO
  const marketGateway = new MarketGateway(httpServer);
  logger.info('Socket.IO initialized');

  // Start price ingestor job
  const priceIngestor = new PriceIngestor(marketGateway);
  priceIngestor.start();

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');

    priceIngestor.stop();

    httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    await prisma.$disconnect();
    await redis.quit();

    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return { httpServer, marketGateway, priceIngestor };
}

