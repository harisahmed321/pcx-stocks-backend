import { MarketGateway } from '../sockets/marketGateway.js';
export declare class MarketSimulatorJob {
    private intervalId;
    private marketGateway;
    private updateInterval;
    private symbolsCache;
    private priceHistory;
    private readonly HISTORY_SIZE;
    constructor(marketGateway: MarketGateway, updateIntervalMs?: number);
    start(): Promise<void>;
    stop(): void;
    private generateAndBroadcastUpdates;
    private getRandomSymbols;
    private applyTrendAdjustment;
    private updatePriceHistory;
    private getLastPrice;
    reloadSymbols(): Promise<void>;
}
//# sourceMappingURL=market-simulator.job.d.ts.map