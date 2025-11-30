import { MarketGateway } from './sockets/marketGateway.js';
import { SymbolsSyncJob } from './jobs/symbolsSyncJob.js';
import { MarketDataFetcherJob } from './jobs/marketDataFetcherJob.js';
export declare function startServer(): Promise<{
    httpServer: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    marketGateway: MarketGateway;
    symbolsSyncJob: SymbolsSyncJob;
    marketDataFetcherJob: MarketDataFetcherJob;
}>;
//# sourceMappingURL=server.d.ts.map