import { MarketService } from '../modules/market/market.service.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
export class PriceIngestor {
    marketGateway;
    interval = null;
    UPDATE_INTERVAL = 5000; // 5 seconds
    constructor(marketGateway) {
        this.marketGateway = marketGateway;
    }
    start() {
        logger.info('Starting price ingestor job');
        this.interval = setInterval(async () => {
            try {
                await this.ingestPrices();
            }
            catch (error) {
                logger.error('Error in price ingestor', error);
            }
        }, this.UPDATE_INTERVAL);
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
            logger.info('Price ingestor job stopped');
        }
    }
    async ingestPrices() {
        if (config.marketData.provider === 'mock') {
            await this.ingestMockPrices();
        }
        else {
            // Implement real provider logic here
            logger.warn('Real market data provider not implemented yet');
        }
    }
    async ingestMockPrices() {
        const symbols = await MarketService.getAvailableSymbols();
        for (const symbolData of symbols) {
            const priceData = MarketService.generateMockPrice(symbolData.symbol);
            // Broadcast the update via Socket.IO
            this.marketGateway.broadcastPriceUpdate(priceData.symbol, priceData.price, priceData.change, priceData.changePercent);
            // Optionally, store to database (for historical data)
            // await MarketService.ingestMarketData(priceData.symbol, {
            //   timestamp: priceData.timestamp,
            //   open: priceData.price,
            //   high: priceData.price,
            //   low: priceData.price,
            //   close: priceData.price,
            //   volume: priceData.volume,
            // });
        }
        logger.debug(`Ingested prices for ${symbols.length} symbols`);
    }
}
//# sourceMappingURL=priceIngestor.js.map