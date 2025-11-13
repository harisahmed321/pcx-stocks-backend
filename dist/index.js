import { config } from './config/index.js';
import { startServer } from './server.js';
import { logger } from './utils/logger.js';
async function main() {
    try {
        logger.info(`Starting PSX Stocks Backend in ${config.env} mode`);
        const { httpServer } = await startServer();
        httpServer.listen(config.port, () => {
            logger.info(`🚀 Server running on port ${config.port}`);
            logger.info(`📊 API: http://localhost:${config.port}/api/${config.apiVersion}`);
            logger.info(`🔌 Socket.IO: http://localhost:${config.port}/socket.io`);
            logger.info(`💓 Health: http://localhost:${config.port}/health`);
        });
    }
    catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map