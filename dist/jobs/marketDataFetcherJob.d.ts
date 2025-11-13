export declare class MarketDataFetcherJob {
    private intervalId?;
    private isRunning;
    private fetchInterval;
    private scheduledTime;
    private concurrencyLimit;
    private startTime;
    private endTime;
    /**
     * Set custom fetch interval (in seconds)
     */
    setInterval(seconds: number): void;
    /**
     * Set scheduled time (24-hour format, e.g., "14:30")
     */
    setScheduledTime(time: string | null): void;
    /**
     * Set start and end time for market data fetching (24-hour format, e.g., "09:00", "17:00")
     */
    setTimeWindow(startTime: string | null, endTime: string | null): void;
    /**
     * Check if current time is within the allowed time window
     */
    private isWithinTimeWindow;
    /**
     * Fetch market data for a single symbol
     */
    fetchSymbolData(symbol: string): Promise<boolean>;
    /**
     * Fetch market data for all trading symbols
     */
    fetchAllSymbols(): Promise<void>;
    /**
     * Start the background job
     */
    start(): void;
    /**
     * Stop the background job
     */
    stop(): void;
    /**
     * Set concurrency limit for parallel fetching
     */
    setConcurrencyLimit(limit: number): void;
    /**
     * Get current status
     */
    getStatus(): {
        running: boolean;
        isFetching: boolean;
        interval: number;
        scheduledTime: string | null;
        startTime: string | null;
        endTime: string | null;
        concurrencyLimit: number;
    };
}
//# sourceMappingURL=marketDataFetcherJob.d.ts.map