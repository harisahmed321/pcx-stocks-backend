import { MarketGateway } from '../sockets/marketGateway.js';
export declare class PriceIngestor {
    private marketGateway;
    private interval;
    private readonly UPDATE_INTERVAL;
    constructor(marketGateway: MarketGateway);
    start(): void;
    stop(): void;
    private ingestPrices;
    private ingestMockPrices;
}
//# sourceMappingURL=priceIngestor.d.ts.map