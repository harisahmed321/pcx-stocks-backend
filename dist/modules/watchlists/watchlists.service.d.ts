export interface CreateWatchlistDto {
    name: string;
}
export interface AddWatchlistItemDto {
    symbol: string;
    notes?: string;
}
export declare class WatchlistsService {
    static createWatchlist(userId: string, data: CreateWatchlistDto): Promise<{
        items: {
            symbol: string;
            id: string;
            createdAt: Date;
            notes: string | null;
            watchlistId: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
    }>;
    static getUserWatchlists(userId: string): Promise<{
        items: {
            marketData: {
                price: number;
                change: number;
                changePercent: number;
                volume: number;
            } | null;
            symbol: string;
            id: string;
            createdAt: Date;
            notes: string | null;
            watchlistId: string;
        }[];
        _count: {
            items: number;
        };
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
    }[]>;
    static getWatchlistById(userId: string, watchlistId: string): Promise<{
        items: {
            marketData: {
                price: number;
                change: number;
                changePercent: number;
                volume: number;
            } | null;
            symbol: string;
            id: string;
            createdAt: Date;
            notes: string | null;
            watchlistId: string;
        }[];
        name: string;
        id: string;
        createdAt: Date;
        userId: string;
    }>;
    static deleteWatchlist(userId: string, watchlistId: string): Promise<{
        message: string;
    }>;
    static addWatchlistItem(userId: string, watchlistId: string, data: AddWatchlistItemDto): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        notes: string | null;
        watchlistId: string;
    }>;
    static removeWatchlistItem(userId: string, itemId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=watchlists.service.d.ts.map