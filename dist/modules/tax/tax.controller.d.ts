import { Request, Response } from 'express';
export declare class TaxController {
    /**
     * Calculate tax for a transaction
     */
    static calculateTax(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get tax report for a portfolio
     */
    static getTaxReport(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get user tax summary (all portfolios)
     */
    static getUserTaxSummary(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Add tax deduction to a transaction
     */
    static addTaxDeduction(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * Get tax deductions for a transaction
     */
    static getTransactionTaxDeductions(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=tax.controller.d.ts.map