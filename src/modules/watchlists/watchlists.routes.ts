import { Router } from 'express';
import { WatchlistsController } from './watchlists.controller.js';
import { authenticate } from '../auth/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/watchlists
 * @desc    Get all user watchlists
 * @access  Private
 */
router.get('/', WatchlistsController.getAll);

/**
 * @route   POST /api/v1/watchlists
 * @desc    Create new watchlist
 * @access  Private
 */
router.post('/', WatchlistsController.createValidation, WatchlistsController.create);

/**
 * @route   GET /api/v1/watchlists/:id
 * @desc    Get watchlist by ID
 * @access  Private
 */
router.get('/:id', WatchlistsController.idValidation, WatchlistsController.getById);

/**
 * @route   DELETE /api/v1/watchlists/:id
 * @desc    Delete watchlist
 * @access  Private
 */
router.delete('/:id', WatchlistsController.idValidation, WatchlistsController.delete);

/**
 * @route   POST /api/v1/watchlists/:id/items
 * @desc    Add item to watchlist
 * @access  Private
 */
router.post('/:id/items', WatchlistsController.addItemValidation, WatchlistsController.addItem);

/**
 * @route   DELETE /api/v1/watchlists/:id/items/:itemId
 * @desc    Remove item from watchlist
 * @access  Private
 */
router.delete('/:id/items/:itemId', WatchlistsController.removeItem);

export default router;

