import { Router } from 'express';
import { TaxController } from './tax.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

// All tax routes require authentication
router.use(authenticate);

// Calculate tax for a transaction
router.post('/calculate', TaxController.calculateTax);

// Get tax report for a portfolio
router.get('/portfolio/:portfolioId/report', TaxController.getTaxReport);

// Get user tax summary (all portfolios)
router.get('/summary', TaxController.getUserTaxSummary);

// Add tax deduction to a transaction
router.post('/transaction/:transactionId/deduction', TaxController.addTaxDeduction);

// Get tax deductions for a transaction
router.get('/transaction/:transactionId/deductions', TaxController.getTransactionTaxDeductions);

export default router;
