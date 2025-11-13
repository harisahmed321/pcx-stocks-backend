import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';
export class TransactionsService {
    static async createTransaction(userId, portfolioId, data) {
        // Verify portfolio ownership
        const portfolio = await prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
        });
        if (!portfolio) {
            throw new AppError('Portfolio not found', 404);
        }
        return await prisma.$transaction(async (tx) => {
            // Create transaction
            const transaction = await tx.transaction.create({
                data: {
                    portfolioId,
                    type: data.type,
                    symbol: data.symbol.toUpperCase(),
                    quantity: data.quantity,
                    price: data.price,
                    fees: data.fees || 0,
                    date: data.date,
                    notes: data.notes,
                },
            });
            // Update or create holding based on transaction type
            if (data.type === 'BUY' || data.type === 'BONUS') {
                const existingHolding = await tx.holding.findFirst({
                    where: {
                        portfolioId,
                        symbol: data.symbol.toUpperCase(),
                    },
                });
                if (existingHolding) {
                    // Update average buy price and quantity
                    const newQuantity = Number(existingHolding.quantity) + data.quantity;
                    const newAvgPrice = (Number(existingHolding.avgBuyPrice) * Number(existingHolding.quantity) + data.price * data.quantity) /
                        newQuantity;
                    await tx.holding.update({
                        where: { id: existingHolding.id },
                        data: {
                            quantity: newQuantity,
                            avgBuyPrice: newAvgPrice,
                        },
                    });
                    await tx.transaction.update({
                        where: { id: transaction.id },
                        data: { holdingId: existingHolding.id },
                    });
                }
                else {
                    // Create new holding
                    const newHolding = await tx.holding.create({
                        data: {
                            portfolioId,
                            symbol: data.symbol.toUpperCase(),
                            quantity: data.quantity,
                            avgBuyPrice: data.price,
                        },
                    });
                    await tx.transaction.update({
                        where: { id: transaction.id },
                        data: { holdingId: newHolding.id },
                    });
                }
                // Deduct cash for BUY transactions
                if (data.type === 'BUY') {
                    const totalCost = data.quantity * data.price + (data.fees || 0);
                    await tx.portfolio.update({
                        where: { id: portfolioId },
                        data: {
                            cashBalance: {
                                decrement: totalCost,
                            },
                        },
                    });
                }
            }
            else if (data.type === 'SELL') {
                const holding = await tx.holding.findFirst({
                    where: {
                        portfolioId,
                        symbol: data.symbol.toUpperCase(),
                    },
                });
                if (!holding) {
                    throw new AppError('Cannot sell - holding not found', 400);
                }
                if (Number(holding.quantity) < data.quantity) {
                    throw new AppError('Cannot sell - insufficient quantity', 400);
                }
                const newQuantity = Number(holding.quantity) - data.quantity;
                if (newQuantity === 0) {
                    // Delete holding if quantity becomes zero
                    await tx.holding.delete({
                        where: { id: holding.id },
                    });
                }
                else {
                    // Update quantity
                    await tx.holding.update({
                        where: { id: holding.id },
                        data: {
                            quantity: newQuantity,
                        },
                    });
                }
                await tx.transaction.update({
                    where: { id: transaction.id },
                    data: { holdingId: holding.id },
                });
                // Add cash for SELL transactions
                const totalRevenue = data.quantity * data.price - (data.fees || 0);
                await tx.portfolio.update({
                    where: { id: portfolioId },
                    data: {
                        cashBalance: {
                            increment: totalRevenue,
                        },
                    },
                });
            }
            else if (data.type === 'DIVIDEND') {
                // Add cash for dividends
                const dividendAmount = data.quantity * data.price;
                await tx.portfolio.update({
                    where: { id: portfolioId },
                    data: {
                        cashBalance: {
                            increment: dividendAmount,
                        },
                    },
                });
            }
            return transaction;
        });
    }
    static async getPortfolioTransactions(userId, portfolioId, page = 1, limit = 20) {
        // Verify portfolio ownership
        const portfolio = await prisma.portfolio.findFirst({
            where: { id: portfolioId, userId },
        });
        if (!portfolio) {
            throw new AppError('Portfolio not found', 404);
        }
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where: { portfolioId },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
            }),
            prisma.transaction.count({
                where: { portfolioId },
            }),
        ]);
        return {
            transactions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
//# sourceMappingURL=transactions.service.js.map