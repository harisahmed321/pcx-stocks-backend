import { Router } from 'express';
import { TransactionsController } from './transactions.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/portfolios/:portfolioId/transactions
 * @desc    Create new transaction
 * @access  Private
 */
router.post(
  '/portfolios/:portfolioId/transactions',
  TransactionsController.createValidation,
  TransactionsController.create
);

/**
 * @route   GET /api/v1/portfolios/:portfolioId/transactions
 * @desc    Get portfolio transactions
 * @access  Private
 */
router.get(
  '/portfolios/:portfolioId/transactions',
  TransactionsController.portfolioIdValidation,
  TransactionsController.getByPortfolio
);

export default router;

