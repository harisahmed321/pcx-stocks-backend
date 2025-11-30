import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';
export class TaxService {
    // CGT rates in Pakistan
    static CGT_RATE_FILER = 0.125; // 12.5% for filers
    static CGT_RATE_NON_FILER = 0.15; // 15% for non-filers
    static WITHHOLDING_TAX_RATE = 0.15; // 15% withholding tax on dividends
    /**
     * Calculate Capital Gains Tax for a SELL transaction
     * CGT = (Sell Price - Buy Price) * Quantity * CGT Rate
     */
    static async calculateCapitalGainsTax(userId, portfolioId, symbol, sellQuantity, sellPrice, sellDate) {
        // Get user to check if filer
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isFiler: true }
        });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        // Get holding to find average buy price
        const holding = await prisma.holding.findFirst({
            where: {
                portfolioId,
                symbol: symbol.toUpperCase()
            }
        });
        if (!holding) {
            throw new AppError('Holding not found', 404);
        }
        const avgBuyPrice = Number(holding.avgBuyPrice);
        const capitalGains = (sellPrice - avgBuyPrice) * sellQuantity;
        // Apply CGT rate based on filer status
        const cgtRate = user.isFiler ? TaxService.CGT_RATE_FILER : TaxService.CGT_RATE_NON_FILER;
        const capitalGainsTax = capitalGains > 0 ? capitalGains * cgtRate : 0;
        return {
            capitalGains,
            capitalGainsTax: Math.max(0, capitalGainsTax) // No negative tax
        };
    }
    /**
     * Calculate Withholding Tax on dividends
     * WHT = Dividend Amount * WHT Rate (15%)
     */
    static calculateWithholdingTax(dividendAmount) {
        return dividendAmount * TaxService.WITHHOLDING_TAX_RATE;
    }
    /**
     * Calculate total tax for a transaction
     */
    static async calculateTransactionTax(userId, portfolioId, transactionType, symbol, quantity, price, date) {
        let capitalGains = 0;
        let capitalGainsTax = 0;
        let withholdingTax = 0;
        if (transactionType === 'SELL') {
            const cgtResult = await TaxService.calculateCapitalGainsTax(userId, portfolioId, symbol, quantity, price, date);
            capitalGains = cgtResult.capitalGains;
            capitalGainsTax = cgtResult.capitalGainsTax;
        }
        else if (transactionType === 'DIVIDEND') {
            const dividendAmount = quantity * price;
            withholdingTax = TaxService.calculateWithholdingTax(dividendAmount);
        }
        const totalTax = capitalGainsTax + withholdingTax;
        const grossAmount = quantity * price;
        const netAmount = grossAmount - totalTax;
        return {
            capitalGains,
            capitalGainsTax,
            withholdingTax,
            totalTax,
            netAmount
        };
    }
    /**
     * Get tax deductions for a transaction
     */
    static async getTransactionTaxDeductions(transactionId) {
        const deductions = await prisma.taxDeduction.findMany({
            where: { transactionId }
        });
        return deductions.reduce((sum, d) => sum + Number(d.amount), 0);
    }
    /**
     * Add tax deduction to a transaction
     */
    static async addTaxDeduction(transactionId, category, amount, description) {
        return await prisma.taxDeduction.create({
            data: {
                transactionId,
                category,
                amount,
                description
            }
        });
    }
    /**
     * Generate tax report for a user/portfolio
     */
    static async generateTaxReport(userId, portfolioId, startDate, endDate) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isFiler: true }
        });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        // Get all transactions in the period
        const transactions = await prisma.transaction.findMany({
            where: {
                portfolioId,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                taxDeductions: true
            },
            orderBy: {
                date: 'asc'
            }
        });
        let totalCapitalGains = 0;
        let totalCapitalGainsTax = 0;
        let totalWithholdingTax = 0;
        let totalTaxDeductions = 0;
        const transactionData = await Promise.all(transactions.map(async (tx) => {
            let capitalGains = 0;
            let capitalGainsTax = 0;
            let withholdingTax = 0;
            if (tx.type === 'SELL' && tx.capitalGainsTax) {
                // Calculate capital gains from sell price and buy price
                const holding = await prisma.holding.findFirst({
                    where: {
                        portfolioId,
                        symbol: tx.symbol
                    }
                });
                if (holding) {
                    const sellAmount = Number(tx.quantity) * Number(tx.price);
                    const buyAmount = Number(tx.quantity) * Number(holding.avgBuyPrice);
                    capitalGains = sellAmount - buyAmount;
                }
                capitalGainsTax = Number(tx.capitalGainsTax);
                totalCapitalGains += capitalGains;
                totalCapitalGainsTax += capitalGainsTax;
            }
            if (tx.type === 'DIVIDEND' && tx.withholdingTax) {
                withholdingTax = Number(tx.withholdingTax);
                totalWithholdingTax += withholdingTax;
            }
            const taxDeductions = tx.taxDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
            totalTaxDeductions += taxDeductions;
            return {
                id: tx.id,
                date: tx.date,
                symbol: tx.symbol,
                type: tx.type,
                capitalGains: capitalGains !== 0 ? capitalGains : undefined,
                capitalGainsTax: capitalGainsTax !== 0 ? capitalGainsTax : undefined,
                withholdingTax: withholdingTax !== 0 ? withholdingTax : undefined,
                taxDeductions
            };
        }));
        const totalTax = totalCapitalGainsTax + totalWithholdingTax - totalTaxDeductions;
        return {
            period: {
                startDate,
                endDate
            },
            totalCapitalGains,
            totalCapitalGainsTax,
            totalWithholdingTax,
            totalTaxDeductions,
            totalTax: Math.max(0, totalTax), // No negative tax
            transactions: transactionData
        };
    }
    /**
     * Get tax summary for a user (all portfolios)
     */
    static async getUserTaxSummary(userId, startDate, endDate) {
        const portfolios = await prisma.portfolio.findMany({
            where: { userId },
            include: {
                transactions: {
                    where: {
                        date: {
                            gte: startDate,
                            lte: endDate
                        }
                    },
                    include: {
                        taxDeductions: true
                    }
                }
            }
        });
        let totalCapitalGainsTax = 0;
        let totalWithholdingTax = 0;
        let totalTaxDeductions = 0;
        const portfolioData = await Promise.all(portfolios.map(async (portfolio) => {
            let portfolioCGT = 0;
            let portfolioWHT = 0;
            let portfolioDeductions = 0;
            for (const tx of portfolio.transactions) {
                if (tx.capitalGainsTax) {
                    portfolioCGT += Number(tx.capitalGainsTax);
                }
                if (tx.withholdingTax) {
                    portfolioWHT += Number(tx.withholdingTax);
                }
                portfolioDeductions += tx.taxDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
            }
            totalCapitalGainsTax += portfolioCGT;
            totalWithholdingTax += portfolioWHT;
            totalTaxDeductions += portfolioDeductions;
            return {
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                capitalGainsTax: portfolioCGT,
                withholdingTax: portfolioWHT,
                taxDeductions: portfolioDeductions,
                totalTax: portfolioCGT + portfolioWHT - portfolioDeductions
            };
        }));
        return {
            totalCapitalGains: 0, // Would need to calculate from transactions
            totalCapitalGainsTax,
            totalWithholdingTax,
            totalTaxDeductions,
            totalTax: Math.max(0, totalCapitalGainsTax + totalWithholdingTax - totalTaxDeductions),
            portfolios: portfolioData
        };
    }
}
//# sourceMappingURL=tax.service.js.map