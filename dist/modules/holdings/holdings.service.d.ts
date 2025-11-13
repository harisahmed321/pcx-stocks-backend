export interface CreateHoldingDto {
    symbol: string;
    name?: string;
    quantity: number;
    avgBuyPrice: number;
    currency?: string;
}
export interface UpdateHoldingDto {
    quantity?: number;
    avgBuyPrice?: number;
    name?: string;
}
export declare class HoldingsService {
    static createHolding(userId: string, portfolioId: string, data: CreateHoldingDto): Promise<{
        symbol: string;
        name: string | null;
        id: string;
        updatedAt: Date;
        portfolioId: string;
        quantity: import("@prisma/client/runtime/library.js").Decimal;
        avgBuyPrice: import("@prisma/client/runtime/library.js").Decimal;
        currency: string;
        addedAt: Date;
    }>;
    static getPortfolioHoldings(userId: string, portfolioId: string): Promise<{
        symbol: string;
        name: string | null;
        id: string;
        updatedAt: Date;
        portfolioId: string;
        quantity: import("@prisma/client/runtime/library.js").Decimal;
        avgBuyPrice: import("@prisma/client/runtime/library.js").Decimal;
        currency: string;
        addedAt: Date;
    }[]>;
    static updateHolding(userId: string, holdingId: string, data: UpdateHoldingDto): Promise<{
        symbol: string;
        name: string | null;
        id: string;
        updatedAt: Date;
        portfolioId: string;
        quantity: import("@prisma/client/runtime/library.js").Decimal;
        avgBuyPrice: import("@prisma/client/runtime/library.js").Decimal;
        currency: string;
        addedAt: Date;
    }>;
    static deleteHolding(userId: string, holdingId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=holdings.service.d.ts.map