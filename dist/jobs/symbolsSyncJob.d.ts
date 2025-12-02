export declare class SymbolsSyncJob {
    private isRunning;
    private intervalId?;
    private scheduleConfig;
    syncSymbols(): Promise<void>;
    start(): void;
    /**
     * Set schedule configuration for symbol sync
     */
    setScheduleConfig(config: {
        time: string | null;
        days: string[];
    }): void;
    /**
     * Get current schedule configuration
     */
    getScheduleConfig(): {
        time: string | null;
        days: string[];
    };
    /**
     * Check if current day is a scheduled day
     */
    private isScheduledDay;
    private scheduleDaily;
    stop(): void;
}
//# sourceMappingURL=symbolsSyncJob.d.ts.map