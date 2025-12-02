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
    static getSymbolsPaginated(page?: number, limit?: number): Promise<{
        data: {
            lastPrice: number;
            currentPrice: number;
            change: number;
            changePercent: number;
            symbol: string;
            name: string;
            sectorName: string | null;
            isETF: boolean;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasMore: boolean;
        };
    }>;
    static getAllSymbolsForUpdates(): Promise<string[]>;
    static getCurrentPrice(symbol: string): Promise<number>;
    static getMultiplePrices(symbols: string[]): Promise<Record<string, number>>;
    static getHistoricalData(symbol: string, from: Date, to: Date, interval?: string): Promise<MarketDataPoint[]>;
    static ingestMarketData(symbol: string, data: Omit<MarketDataPoint, 'symbol'>): Promise<void>;
    /**
     * Get symbol details from database and latest market data
     */
    /**
     * Get symbol timeseries data from PSX API
     */
    static getSymbolTimeseries(symbol: string, type?: 'int' | 'eod'): Promise<any>;
    static getSymbolDetailsFromPSX(symbol: string): Promise<{
        symbol: string;
        name: string;
        price: {
            last: number;
            change: number;
            changePercent: number;
        };
        stats: {
            open: number;
            high: number;
            low: number;
            volume: number;
            ldcp: number;
        };
        chartData: any;
        profile: {
            sector: string;
            about: string;
            contact: {
                address: string;
                phone: string;
                email: string;
                website: string;
            };
        };
        timestamp: Date;
    }>;
    /**
     * Fetch 5 years timeseries data from PSX API for backtesting
     * Response format: [[timestamp, price, volume], ...]
     */
    static getTimeseriesFromPSX(symbol: string): Promise<{
        symbol: string;
        dataPoints: any;
        startDate: any;
        endDate: any;
        data: any;
    }>;
}
//# sourceMappingURL=market.service.d.ts.map