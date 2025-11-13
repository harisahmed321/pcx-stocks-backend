import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisPub, redisSub, isRedisAvailable } from '../utils/redis.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { AlertsService } from '../modules/alerts/alerts.service.js';
export class MarketGateway {
    io;
    constructor(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: config.socketIO.corsOrigin,
                methods: ['GET', 'POST']
            },
            path: '/socket.io'
        });
        this.setupRedisAdapter();
        this.setupNamespaces();
        this.subscribeToMarketUpdates();
    }
    setupRedisAdapter() {
        // Use Redis adapter for horizontal scaling only if Redis is available
        if (isRedisAvailable()) {
            try {
                this.io.adapter(createAdapter(redisPub, redisSub));
                logger.info('Socket.IO Redis adapter configured');
            }
            catch (err) {
                logger.warn('Failed to configure Redis adapter, running in standalone mode');
            }
        }
        else {
            logger.info('Socket.IO running in standalone mode (Redis not available)');
        }
    }
    setupNamespaces() {
        const marketNamespace = this.io.of('/market');
        marketNamespace.on('connection', (socket) => {
            logger.info(`Client connected to market namespace: ${socket.id}`);
            socket.on('subscribe', (data) => {
                if (data.symbols && Array.isArray(data.symbols)) {
                    data.symbols.forEach((symbol) => {
                        const room = `symbol:${symbol.toUpperCase()}`;
                        socket.join(room);
                        logger.info(`Socket ${socket.id} subscribed to ${room}`);
                    });
                    socket.emit('subscribed', { symbols: data.symbols });
                }
            });
            socket.on('unsubscribe', (data) => {
                if (data.symbols && Array.isArray(data.symbols)) {
                    data.symbols.forEach((symbol) => {
                        const room = `symbol:${symbol.toUpperCase()}`;
                        socket.leave(room);
                        logger.info(`Socket ${socket.id} unsubscribed from ${room}`);
                    });
                    socket.emit('unsubscribed', { symbols: data.symbols });
                }
            });
            socket.on('disconnect', () => {
                logger.info(`Client disconnected from market namespace: ${socket.id}`);
            });
        });
    }
    subscribeToMarketUpdates() {
        if (!isRedisAvailable()) {
            logger.info('Redis not available, skipping market updates subscription');
            return;
        }
        // Subscribe to Redis channel for market updates
        redisSub.subscribe('market:updates', (err) => {
            if (err) {
                logger.error('Failed to subscribe to market:updates channel', err);
            }
            else {
                logger.info('Subscribed to market:updates channel');
            }
        });
        redisSub.on('message', async (channel, message) => {
            if (channel === 'market:updates') {
                try {
                    const priceUpdate = JSON.parse(message);
                    const { symbol, price, change, changePercent, timestamp } = priceUpdate;
                    // Broadcast to all clients subscribed to this symbol
                    this.io.of('/market').to(`symbol:${symbol}`).emit('price:update', {
                        symbol,
                        price,
                        change,
                        changePercent,
                        timestamp
                    });
                    // Check alerts for this symbol
                    const triggeredAlerts = await AlertsService.checkAlerts(symbol, price);
                    // Notify users about triggered alerts
                    for (const alert of triggeredAlerts) {
                        this.io.of('/market').to(`user:${alert.userId}`).emit('alert:trigger', alert);
                    }
                }
                catch (error) {
                    logger.error('Error processing market update', error);
                }
            }
        });
    }
    broadcastPriceUpdate(symbol, price, change, changePercent) {
        const update = {
            symbol,
            price,
            change,
            changePercent,
            timestamp: new Date()
        };
        if (isRedisAvailable()) {
            // Publish to Redis for distribution across instances
            redisPub.publish('market:updates', JSON.stringify(update));
        }
        else {
            // Directly broadcast to connected clients (standalone mode)
            this.io.of('/market').to(`symbol:${symbol}`).emit('price:update', update);
        }
    }
    getIO() {
        return this.io;
    }
}
//# sourceMappingURL=marketGateway.js.map