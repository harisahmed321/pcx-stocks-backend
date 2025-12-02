import { Router } from 'express';
import { AlertsController } from './alerts.controller.js';
import { authenticate } from '../auth/auth.middleware.js';
const router = Router();
// All routes require authentication
router.use(authenticate);
/**
 * @route   GET /api/v1/alerts
 * @desc    Get all user alerts
 * @access  Private
 */
router.get('/', AlertsController.getAll);
/**
 * @route   POST /api/v1/alerts
 * @desc    Create new alert
 * @access  Private
 */
router.post('/', AlertsController.createValidation, AlertsController.create);
/**
 * @route   GET /api/v1/alerts/:id
 * @desc    Get alert by ID with history
 * @access  Private
 */
router.get('/:id', AlertsController.idValidation, AlertsController.getById);
/**
 * @route   PATCH /api/v1/alerts/:id
 * @desc    Update alert
 * @access  Private
 */
router.patch('/:id', AlertsController.updateValidation, AlertsController.update);
/**
 * @route   PATCH /api/v1/alerts/:id/toggle
 * @desc    Toggle alert active/inactive status
 * @access  Private
 */
router.patch('/:id/toggle', AlertsController.idValidation, AlertsController.toggleActive);
/**
 * @route   GET /api/v1/alerts/:id/history
 * @desc    Get alert trigger history
 * @access  Private
 */
router.get('/:id/history', AlertsController.idValidation, AlertsController.getHistory);
/**
 * @route   DELETE /api/v1/alerts/:id
 * @desc    Delete alert
 * @access  Private
 */
router.delete('/:id', AlertsController.idValidation, AlertsController.delete);
export default router;
//# sourceMappingURL=alerts.routes.js.map