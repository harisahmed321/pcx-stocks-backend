import Redis from 'ioredis';
import { config } from '../config/index.js';
import { logger } from './logger.js';

export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('error', (err) => {
  logger.error('Redis client error', err);
});

// Publisher for Socket.IO
export const redisPub = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

// Subscriber for Socket.IO
export const redisSub = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await redis.quit();
  await redisPub.quit();
  await redisSub.quit();
  logger.info('Redis clients disconnected');
});

