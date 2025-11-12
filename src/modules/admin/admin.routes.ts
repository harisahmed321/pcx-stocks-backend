import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { RolePermissionsController } from './role-permissions.controller.js';
import { authenticate, requireRole } from '../auth/auth.middleware.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireRole('ADMIN'));

/**
 * @route   GET /api/v1/admin/market-data
 * @desc    Get all market data with pagination
 * @query   page, limit, symbol
 * @access  Private (Admin)
 */
router.get('/market-data', AdminController.getAllMarketData);

/**
 * @route   GET /api/v1/admin/symbols
 * @desc    Get all symbols for admin
 * @access  Private (Admin)
 */
router.get('/symbols', AdminController.getSymbols);

/**
 * @route   GET /api/v1/admin/symbols/:symbol/market-data
 * @desc    Get market data for a specific symbol
 * @access  Private (Admin)
 */
router.get('/symbols/:symbol/market-data', AdminController.getSymbolMarketData);

/**
 * @route   POST /api/v1/admin/symbols/:symbol/fetch
 * @desc    Manually trigger fetch for a symbol
 * @access  Private (Admin)
 */
router.post('/symbols/:symbol/fetch', AdminController.triggerSymbolFetch);

/**
 * @route   GET /api/v1/admin/fetcher/status
 * @desc    Get market data fetcher job status
 * @access  Private (Admin)
 */
router.get('/fetcher/status', AdminController.getFetcherStatus);

/**
 * @route   PUT /api/v1/admin/fetcher/interval
 * @desc    Update fetch interval (in seconds)
 * @body    { interval: number }
 * @access  Private (Admin)
 */
router.put('/fetcher/interval', AdminController.updateFetchInterval);

/**
 * @route   PUT /api/v1/admin/fetcher/schedule
 * @desc    Set scheduled time for fetching (24-hour format)
 * @body    { time: string | null } e.g., "14:30"
 * @access  Private (Admin)
 */
router.put('/fetcher/schedule', AdminController.setScheduledTime);

/**
 * @route   GET /api/v1/admin/role-permissions
 * @desc    Get all role permissions
 * @access  Private (Admin)
 */
router.get('/role-permissions', RolePermissionsController.getAllPermissions);

/**
 * @route   GET /api/v1/admin/role-permissions/:role
 * @desc    Get permissions for a specific role
 * @access  Private (Admin)
 */
router.get('/role-permissions/:role', RolePermissionsController.getPermissionsByRole);

/**
 * @route   POST /api/v1/admin/role-permissions
 * @desc    Create or update a role permission
 * @access  Private (Admin)
 */
router.post(
  '/role-permissions',
  RolePermissionsController.permissionValidation,
  RolePermissionsController.upsertPermission
);

/**
 * @route   PUT /api/v1/admin/role-permissions/bulk
 * @desc    Bulk update role permissions
 * @access  Private (Admin)
 */
router.put('/role-permissions/bulk', RolePermissionsController.bulkUpsertPermissions);

/**
 * @route   DELETE /api/v1/admin/role-permissions/:role/:page
 * @desc    Delete a role permission
 * @access  Private (Admin)
 */
router.delete('/role-permissions/:role/:page', RolePermissionsController.deletePermission);

export default router;
