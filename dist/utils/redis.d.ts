import Redis from 'ioredis';
export declare const redis: Redis;
export declare const redisPub: Redis;
export declare const redisSub: Redis;
export declare function initializeRedis(): Promise<boolean>;
export declare const isRedisAvailable: () => boolean;
//# sourceMappingURL=redis.d.ts.map