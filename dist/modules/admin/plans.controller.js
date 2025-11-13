import { body, validationResult } from 'express-validator';
import { ResponseHelper } from '../../utils/response.js';
import { PlansService } from './plans.service.js';
export class PlansController {
    /**
     * Validation rules for creating a plan
     */
    static createPlanValidation = [
        body('name').trim().notEmpty().withMessage('Plan name is required'),
        body('slug')
            .trim()
            .notEmpty()
            .withMessage('Plan slug is required')
            .matches(/^[a-z0-9-]+$/)
            .withMessage('Slug must be lowercase alphanumeric with hyphens'),
        body('priceMonthly').isFloat({ min: 0 }).withMessage('Monthly price must be a positive number'),
        body('priceYearly').isFloat({ min: 0 }).withMessage('Yearly price must be a positive number'),
        body('maxPortfolios').isInt({ min: 1 }).withMessage('Max portfolios must be at least 1'),
        body('maxCashInvestment')
            .isFloat({ min: 0 })
            .withMessage('Max cash investment must be a positive number'),
        body('maxWatchlists').isInt({ min: 0 }).withMessage('Max watchlists must be non-negative'),
        body('maxAlerts').isInt({ min: 0 }).withMessage('Max alerts must be non-negative'),
        body('description').optional().isString(),
        body('isAlumniOnly').optional().isBoolean(),
        body('isRecommended').optional().isBoolean(),
        body('features').optional().isObject(),
        body('isActive').optional().isBoolean()
    ];
    /**
     * Validation rules for updating a plan
     */
    static updatePlanValidation = [
        body('name').optional().trim().notEmpty(),
        body('slug')
            .optional()
            .trim()
            .matches(/^[a-z0-9-]+$/)
            .withMessage('Slug must be lowercase alphanumeric with hyphens'),
        body('priceMonthly').optional().isFloat({ min: 0 }),
        body('priceYearly').optional().isFloat({ min: 0 }),
        body('maxPortfolios').optional().isInt({ min: 1 }),
        body('maxCashInvestment').optional().isFloat({ min: 0 }),
        body('maxWatchlists').optional().isInt({ min: 0 }),
        body('maxAlerts').optional().isInt({ min: 0 }),
        body('description').optional().isString(),
        body('isAlumniOnly').optional().isBoolean(),
        body('isRecommended').optional().isBoolean(),
        body('features').optional().isObject(),
        body('isActive').optional().isBoolean()
    ];
    /**
     * Get all plans
     */
    static async getAllPlans(req, res) {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const plans = await PlansService.getAllPlans(includeInactive);
            return ResponseHelper.success(res, plans, 'Plans retrieved successfully');
        }
        catch (error) {
            return ResponseHelper.error(res, null, error.message || 'Failed to retrieve plans', 500);
        }
    }
    /**
     * Get plan by ID
     */
    static async getPlanById(req, res) {
        try {
            const { id } = req.params;
            const plan = await PlansService.getPlanById(id);
            return ResponseHelper.success(res, plan, 'Plan retrieved successfully');
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            return ResponseHelper.error(res, null, error.message || 'Failed to retrieve plan', statusCode);
        }
    }
    /**
     * Create a new plan
     */
    static async createPlan(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const plan = await PlansService.createPlan(req.body);
            return ResponseHelper.success(res, plan, 'Plan created successfully', 201);
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            return ResponseHelper.error(res, null, error.message || 'Failed to create plan', statusCode);
        }
    }
    /**
     * Update a plan
     */
    static async updatePlan(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
            }
            const { id } = req.params;
            const plan = await PlansService.updatePlan(id, req.body);
            return ResponseHelper.success(res, plan, 'Plan updated successfully');
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            return ResponseHelper.error(res, null, error.message || 'Failed to update plan', statusCode);
        }
    }
    /**
     * Delete a plan
     */
    static async deletePlan(req, res) {
        try {
            const { id } = req.params;
            const result = await PlansService.deletePlan(id);
            return ResponseHelper.success(res, result, 'Plan deleted successfully');
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            return ResponseHelper.error(res, null, error.message || 'Failed to delete plan', statusCode);
        }
    }
    /**
     * Assign plan to user
     */
    static async assignPlanToUser(req, res) {
        try {
            const { userId } = req.params;
            const { planId } = req.body;
            if (!planId) {
                return ResponseHelper.badRequest(res, null, 'Plan ID is required');
            }
            const user = await PlansService.assignPlanToUser(userId, planId);
            return ResponseHelper.success(res, user, 'Plan assigned to user successfully');
        }
        catch (error) {
            const statusCode = error.statusCode || 500;
            return ResponseHelper.error(res, null, error.message || 'Failed to assign plan to user', statusCode);
        }
    }
}
//# sourceMappingURL=plans.controller.js.map