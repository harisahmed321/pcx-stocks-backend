export interface CreatePortfolioDto {
    name: string;
    description?: string;
    cashBalance?: number;
}
export interface UpdatePortfolioDto {
    name?: string;
    description?: string;
    cashBalance?: number;
}
export declare class PortfoliosService {
    static createPortfolio(userId: string, data: CreatePortfolioDto): Promise<{
        holdings: {
            symbol: string;
            name: string | null;
            id: string;
            updatedAt: Date;
            portfolioId: string;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            avgBuyPrice: import("@prisma/client/runtime/library.js").Decimal;
            currency: string;
            addedAt: Date;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        cashBalance: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    static getUserPortfolios(userId: string): Promise<({
        _count: {
            holdings: number;
            transactions: number;
        };
        holdings: {
            symbol: string;
            name: string | null;
            id: string;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            avgBuyPrice: import("@prisma/client/runtime/library.js").Decimal;
            currency: string;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        cashBalance: import("@prisma/client/runtime/library.js").Decimal;
    })[]>;
    static getPortfolioById(userId: string, portfolioId: string): Promise<{
        computed: {
            totalInvested: number;
            totalValue: number;
            gainLoss: number;
            gainLossPercent: number;
        };
        holdings: {
            symbol: string;
            name: string | null;
            id: string;
            updatedAt: Date;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            avgBuyPrice: import("@prisma/client/runtime/library.js").Decimal;
            currency: string;
            addedAt: Date;
        }[];
        transactions: {
            symbol: string;
            id: string;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            type: import(".prisma/client").$Enums.TransactionType;
            price: import("@prisma/client/runtime/library.js").Decimal;
            fees: import("@prisma/client/runtime/library.js").Decimal;
            date: Date;
            notes: string | null;
        }[];
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        cashBalance: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    static updatePortfolio(userId: string, portfolioId: string, data: UpdatePortfolioDto): Promise<{
        holdings: {
            symbol: string;
            name: string | null;
            id: string;
            updatedAt: Date;
            portfolioId: string;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            avgBuyPrice: import("@prisma/client/runtime/library.js").Decimal;
            currency: string;
            addedAt: Date;
        }[];
    } & {
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        description: string | null;
        cashBalance: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    static deletePortfolio(userId: string, portfolioId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=portfolios.service.d.ts.map