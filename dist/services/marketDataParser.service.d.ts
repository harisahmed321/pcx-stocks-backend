export interface ParsedMarketData {
    symbol: string;
    timestamp: Date;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: number | null;
    change: number | null;
    changePercent: number | null;
    ldcp: number | null;
    var: number | null;
    haircut: number | null;
    peRatio: number | null;
    oneYearChange: number | null;
    ytdChange: number | null;
    askPrice: number | null;
    askVolume: number | null;
    bidPrice: number | null;
    bidVolume: number | null;
    circuitBreakerLow: number | null;
    circuitBreakerHigh: number | null;
    dayRangeLow: number | null;
    dayRangeHigh: number | null;
    week52RangeLow: number | null;
    week52RangeHigh: number | null;
}
export declare class MarketDataParserService {
    /**
     * Parse HTML content and extract market data from REG tab panel
     */
    static parseHTML(html: string, symbol: string): ParsedMarketData | null;
    /**
     * Fetch HTML from URL and parse market data
     */
    static fetchAndParse(symbol: string, url: string): Promise<ParsedMarketData | null>;
}
//# sourceMappingURL=marketDataParser.service.d.ts.map