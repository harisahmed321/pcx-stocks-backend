export interface StockPrice {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: Date;
}
export interface MarketDataPoint {
    timestamp: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
export declare class MarketService {
    private static readonly CACHE_TTL;
    private static readonly CACHE_PREFIX;
    private static readonly BASE_PRICE_CACHE;
    static getAvailableSymbols(): Promise<{
        lastPrice: number;
        symbol: string;
        name: string;
        sectorName: string | null;
        isETF: boolean;
    }[]>;
    private static getBasePriceForSymbol;
    private static generateBasePriceFromSymbol;
    static getCurrentPrice(symbol: string): Promise<number>;
    static getMultiplePrices(symbols: string[]): Promise<Record<string, number>>;
    static getHistoricalData(symbol: string, from: Date, to: Date, interval?: string): Promise<MarketDataPoint[]>;
    static ingestMarketData(symbol: string, data: Omit<MarketDataPoint, 'symbol'>): Promise<void>;
    static generateMockPrice(symbol: string): StockPrice;
}
//# sourceMappingURL=market.service.d.ts.map