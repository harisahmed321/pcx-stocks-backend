import { Request, Response } from 'express';
import { ResponseHelper } from '../../utils/response.js';
import { TaxService } from './tax.service.js';

export class TaxController {
  /**
   * Calculate tax for a transaction
   */
  static async calculateTax(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { portfolioId, transactionType, symbol, quantity, price, date } = req.body;

      if (!portfolioId || !transactionType || !symbol || !quantity || !price || !date) {
        return ResponseHelper.badRequest(res, null, 'Missing required fields');
      }

      const taxResult = await TaxService.calculateTransactionTax(
        userId,
        portfolioId,
        transactionType,
        symbol,
        quantity,
        price,
        new Date(date)
      );

      return ResponseHelper.success(res, taxResult, 'Tax calculated successfully');
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return ResponseHelper.error(
        res,
        null,
        error.message || 'Failed to calculate tax',
        statusCode
      );
    }
  }

  /**
   * Get tax report for a portfolio
   */
  static async getTaxReport(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { portfolioId } = req.params;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), 0, 1); // Start of year
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(); // Today

      // Verify portfolio belongs to user
      const { prisma } = await import('../../prisma/client.js');
      const portfolio = await prisma.portfolio.findUnique({
        where: { id: portfolioId },
        select: { userId: true }
      });

      if (!portfolio || portfolio.userId !== userId) {
        return ResponseHelper.forbidden(res, 'Portfolio not found or access denied');
      }

      const report = await TaxService.generateTaxReport(userId, portfolioId, startDate, endDate);

      return ResponseHelper.success(res, report, 'Tax report generated successfully');
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return ResponseHelper.error(
        res,
        null,
        error.message || 'Failed to generate tax report',
        statusCode
      );
    }
  }

  /**
   * Get user tax summary (all portfolios)
   */
  static async getUserTaxSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), 0, 1); // Start of year
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(); // Today

      const summary = await TaxService.getUserTaxSummary(userId, startDate, endDate);

      return ResponseHelper.success(res, summary, 'Tax summary retrieved successfully');
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return ResponseHelper.error(
        res,
        null,
        error.message || 'Failed to get tax summary',
        statusCode
      );
    }
  }

  /**
   * Add tax deduction to a transaction
   */
  static async addTaxDeduction(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { transactionId } = req.params;
      const { category, amount, description } = req.body;

      if (!category || !amount) {
        return ResponseHelper.badRequest(res, null, 'Category and amount are required');
      }

      // Verify transaction belongs to user's portfolio
      const { prisma } = await import('../../prisma/client.js');
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          portfolio: {
            select: { userId: true }
          }
        }
      });

      if (!transaction || transaction.portfolio.userId !== userId) {
        return ResponseHelper.forbidden(res, 'Transaction not found or access denied');
      }

      const deduction = await TaxService.addTaxDeduction(
        transactionId,
        category,
        amount,
        description
      );

      return ResponseHelper.success(res, deduction, 'Tax deduction added successfully', 201);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return ResponseHelper.error(
        res,
        null,
        error.message || 'Failed to add tax deduction',
        statusCode
      );
    }
  }

  /**
   * Get tax deductions for a transaction
   */
  static async getTransactionTaxDeductions(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { transactionId } = req.params;

      // Verify transaction belongs to user
      const { prisma } = await import('../../prisma/client.js');
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          portfolio: {
            select: { userId: true }
          }
        }
      });

      if (!transaction || transaction.portfolio.userId !== userId) {
        return ResponseHelper.forbidden(res, 'Transaction not found or access denied');
      }

      const deductions = await prisma.taxDeduction.findMany({
        where: { transactionId }
      });

      return ResponseHelper.success(res, deductions, 'Tax deductions retrieved successfully');
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      return ResponseHelper.error(
        res,
        null,
        error.message || 'Failed to get tax deductions',
        statusCode
      );
    }
  }
}
