import { Router } from 'express';
import { HoldingsController } from './holdings.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
const router = Router();
// All routes require authentication
router.use(authenticate);
/**
 * @route   POST /api/v1/portfolios/:portfolioId/holdings
 * @desc    Create new holding in portfolio
 * @access  Private
 */
router.post('/portfolios/:portfolioId/holdings', HoldingsController.createValidation, HoldingsController.create);
/**
 * @route   GET /api/v1/portfolios/:portfolioId/holdings
 * @desc    Get all holdings in portfolio
 * @access  Private
 */
router.get('/portfolios/:portfolioId/holdings', HoldingsController.portfolioIdValidation, HoldingsController.getByPortfolio);
/**
 * @route   PATCH /api/v1/holdings/:id
 * @desc    Update holding
 * @access  Private
 */
router.patch('/holdings/:id', HoldingsController.updateValidation, HoldingsController.update);
/**
 * @route   DELETE /api/v1/holdings/:id
 * @desc    Delete holding
 * @access  Private
 */
router.delete('/holdings/:id', HoldingsController.idValidation, HoldingsController.delete);
export default router;
//# sourceMappingURL=holdings.routes.js.map