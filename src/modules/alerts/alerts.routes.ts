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
 * @desc    Get alert by ID
 * @access  Private
 */
router.get('/:id', AlertsController.idValidation, AlertsController.getById);

/**
 * @route   DELETE /api/v1/alerts/:id
 * @desc    Delete alert
 * @access  Private
 */
router.delete('/:id', AlertsController.idValidation, AlertsController.delete);

export default router;

