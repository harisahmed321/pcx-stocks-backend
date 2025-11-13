import { TransactionType } from '@prisma/client';
export interface CreateTransactionDto {
    type: TransactionType;
    symbol: string;
    quantity: number;
    price: number;
    fees?: number;
    date: Date;
    notes?: string;
}
export declare class TransactionsService {
    static createTransaction(userId: string, portfolioId: string, data: CreateTransactionDto): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        portfolioId: string;
        quantity: import("@prisma/client/runtime/library.js").Decimal;
        holdingId: string | null;
        type: import(".prisma/client").$Enums.TransactionType;
        price: import("@prisma/client/runtime/library.js").Decimal;
        fees: import("@prisma/client/runtime/library.js").Decimal;
        date: Date;
        notes: string | null;
    }>;
    static getPortfolioTransactions(userId: string, portfolioId: string, page?: number, limit?: number): Promise<{
        transactions: {
            symbol: string;
            id: string;
            createdAt: Date;
            portfolioId: string;
            quantity: import("@prisma/client/runtime/library.js").Decimal;
            holdingId: string | null;
            type: import(".prisma/client").$Enums.TransactionType;
            price: import("@prisma/client/runtime/library.js").Decimal;
            fees: import("@prisma/client/runtime/library.js").Decimal;
            date: Date;
            notes: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
//# sourceMappingURL=transactions.service.d.ts.map