import { Request, Response } from 'express';
import { MarketDataFetcherJob } from '../../jobs/marketDataFetcherJob.js';
export declare function setMarketDataFetcherJob(job: MarketDataFetcherJob): void;
export declare class AdminController {
    /**
     * Get market data for a symbol
     */
    static getSymbolMarketData(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Manually trigger fetch for a specific symbol
     */
    static triggerSymbolFetch(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get market data fetcher job status
     */
    static getFetcherStatus(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Update fetch interval
     */
    static updateFetchInterval(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Set time window for fetching (start and end time)
     */
    static setTimeWindow(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Set scheduled time for fetching
     */
    static setScheduledTime(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get all market data with pagination
     */
    static getAllMarketData(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get symbols list for admin
     */
    static getSymbols(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=admin.controller.d.ts.map