import { Router } from 'express';
import { PortfoliosController } from './portfolios.controller.js';
import { HoldingsController } from '../holdings/holdings.controller.js';
import { TransactionsController } from '../transactions/transactions.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/portfolios
 * @desc    Get all user portfolios
 * @access  Private
 */
router.get('/', PortfoliosController.getAll);

/**
 * @route   POST /api/v1/portfolios
 * @desc    Create new portfolio
 * @access  Private
 */
router.post('/', PortfoliosController.createValidation, PortfoliosController.create);

/**
 * @route   GET /api/v1/portfolios/:id
 * @desc    Get portfolio by ID
 * @access  Private
 */
router.get('/:id', PortfoliosController.idValidation, PortfoliosController.getById);

/**
 * @route   PATCH /api/v1/portfolios/:id
 * @desc    Update portfolio
 * @access  Private
 */
router.patch('/:id', PortfoliosController.updateValidation, PortfoliosController.update);

/**
 * @route   DELETE /api/v1/portfolios/:id
 * @desc    Delete portfolio
 * @access  Private
 */
router.delete('/:id', PortfoliosController.idValidation, PortfoliosController.delete);

// Sub-resources routes
router.get('/:portfolioId/holdings', HoldingsController.portfolioIdValidation, HoldingsController.getByPortfolio);
router.post('/:portfolioId/holdings', HoldingsController.createValidation, HoldingsController.create);

router.get('/:portfolioId/transactions', TransactionsController.portfolioIdValidation, TransactionsController.getByPortfolio);
router.post('/:portfolioId/transactions', TransactionsController.createValidation, TransactionsController.create);

export default router;
