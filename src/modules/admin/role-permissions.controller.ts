import { Request, Response, NextFunction } from 'express';
import { RolePermissionsService } from './role-permissions.service.js';
import { ResponseHelper } from '../../utils/response.js';
import { body, validationResult } from 'express-validator';

export class RolePermissionsController {
  static permissionValidation = [
    body('role').isIn(['USER', 'ADMIN']).withMessage('Role must be USER or ADMIN'),
    body('page').trim().notEmpty().withMessage('Page is required'),
    body('accessType').isIn(['viewOnly', 'all']).withMessage('Access type must be viewOnly or all')
  ];

  static async getAllPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await RolePermissionsService.getAllPermissions();
      return ResponseHelper.success(res, permissions);
    } catch (error) {
      next(error);
    }
  }

  static async getPermissionsByRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.params;
      const permissions = await RolePermissionsService.getPermissionsByRole(role);
      return ResponseHelper.success(res, permissions);
    } catch (error) {
      next(error);
    }
  }

  static async upsertPermission(req: Request, res: Response, next: NextFunction) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseHelper.badRequest(res, errors.array(), 'Validation failed');
      }

      const permission = await RolePermissionsService.upsertPermission(req.body);
      return ResponseHelper.success(res, permission, 'Permission updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpsertPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        return ResponseHelper.badRequest(res, null, 'Permissions must be an array');
      }

      // Validate each permission
      for (const perm of permissions) {
        const errors = validationResult(req);
        if (!perm.role || !perm.page || !perm.accessType) {
          return ResponseHelper.badRequest(
            res,
            null,
            'Each permission must have role, page, and accessType'
          );
        }
        if (!['USER', 'ADMIN'].includes(perm.role)) {
          return ResponseHelper.badRequest(res, null, 'Invalid role');
        }
        if (!['viewOnly', 'all'].includes(perm.accessType)) {
          return ResponseHelper.badRequest(res, null, 'Invalid accessType');
        }
      }

      const results = await RolePermissionsService.bulkUpsertPermissions(permissions);
      return ResponseHelper.success(res, results, 'Permissions updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deletePermission(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, page } = req.params;
      await RolePermissionsService.deletePermission(role, page);
      return ResponseHelper.success(res, null, 'Permission deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
