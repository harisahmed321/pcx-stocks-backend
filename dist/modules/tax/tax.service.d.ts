export interface TaxCalculationResult {
    capitalGains: number;
    capitalGainsTax: number;
    withholdingTax: number;
    totalTax: number;
    netAmount: number;
}
export interface TaxReportData {
    period: {
        startDate: Date;
        endDate: Date;
    };
    totalCapitalGains: number;
    totalCapitalGainsTax: number;
    totalWithholdingTax: number;
    totalTaxDeductions: number;
    totalTax: number;
    transactions: Array<{
        id: string;
        date: Date;
        symbol: string;
        type: string;
        capitalGains?: number;
        capitalGainsTax?: number;
        withholdingTax?: number;
        taxDeductions: number;
    }>;
}
export declare class TaxService {
    private static readonly CGT_RATE_FILER;
    private static readonly CGT_RATE_NON_FILER;
    private static readonly WITHHOLDING_TAX_RATE;
    /**
     * Calculate Capital Gains Tax for a SELL transaction
     * CGT = (Sell Price - Buy Price) * Quantity * CGT Rate
     */
    static calculateCapitalGainsTax(userId: string, portfolioId: string, symbol: string, sellQuantity: number, sellPrice: number, sellDate: Date): Promise<{
        capitalGains: number;
        capitalGainsTax: number;
    }>;
    /**
     * Calculate Withholding Tax on dividends
     * WHT = Dividend Amount * WHT Rate (15%)
     */
    static calculateWithholdingTax(dividendAmount: number): number;
    /**
     * Calculate total tax for a transaction
     */
    static calculateTransactionTax(userId: string, portfolioId: string, transactionType: string, symbol: string, quantity: number, price: number, date: Date): Promise<TaxCalculationResult>;
    /**
     * Get tax deductions for a transaction
     */
    static getTransactionTaxDeductions(transactionId: string): Promise<number>;
    /**
     * Add tax deduction to a transaction
     */
    static addTaxDeduction(transactionId: string, category: string, amount: number, description?: string): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        transactionId: string;
        category: string;
        amount: import("@prisma/client/runtime/library.js").Decimal;
    }>;
    /**
     * Generate tax report for a user/portfolio
     */
    static generateTaxReport(userId: string, portfolioId: string, startDate: Date, endDate: Date): Promise<TaxReportData>;
    /**
     * Get tax summary for a user (all portfolios)
     */
    static getUserTaxSummary(userId: string, startDate: Date, endDate: Date): Promise<{
        totalCapitalGains: number;
        totalCapitalGainsTax: number;
        totalWithholdingTax: number;
        totalTaxDeductions: number;
        totalTax: number;
        portfolios: Array<{
            portfolioId: string;
            portfolioName: string;
            capitalGainsTax: number;
            withholdingTax: number;
            taxDeductions: number;
            totalTax: number;
        }>;
    }>;
}
//# sourceMappingURL=tax.service.d.ts.map