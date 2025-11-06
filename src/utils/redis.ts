import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

// Check if Redis is available by attempting to connect
let redisAvailable = false;
let connectionAttempted = false;

const redisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: 1,
  connectTimeout: 1000,
  retryStrategy: () => {
    // Don't retry, fail fast
    return null;
  },
  lazyConnect: true,
  enableOfflineQueue: false
};

export const redis = new Redis(redisOptions);
export const redisPub = new Redis(redisOptions);
export const redisSub = new Redis(redisOptions);

redis.on('connect', () => {
  redisAvailable = true;
  logger.info('Redis client connected');
});

redis.on('error', (err) => {
  // Silently ignore connection errors
  redisAvailable = false;
});

// Try to connect, but don't fail if Redis is unavailable
export async function initializeRedis(): Promise<boolean> {
  if (connectionAttempted) {
    return redisAvailable;
  }

  connectionAttempted = true;

  try {
    await Promise.race([
      Promise.all([redis.connect(), redisPub.connect(), redisSub.connect()]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 2000))
    ]);
    redisAvailable = true;
    logger.info('Redis connected successfully');
    return true;
  } catch (err) {
    redisAvailable = false;
    logger.warn('Redis is not available. Application will run with limited functionality.');
    return false;
  }
}

export const isRedisAvailable = () => redisAvailable;

// Graceful shutdown
process.on('beforeExit', async () => {
  if (redisAvailable) {
    try {
      await redis.quit();
      await redisPub.quit();
      await redisSub.quit();
      logger.info('Redis clients disconnected');
    } catch (err) {
      // Ignore errors during shutdown
    }
  }
});
