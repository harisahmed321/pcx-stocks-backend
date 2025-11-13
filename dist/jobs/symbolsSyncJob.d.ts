export declare class SymbolsSyncJob {
    private isRunning;
    private intervalId?;
    syncSymbols(): Promise<void>;
    start(): void;
    private scheduleDaily;
    stop(): void;
}
//# sourceMappingURL=symbolsSyncJob.d.ts.map