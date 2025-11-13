import { Request, Response, NextFunction } from 'express';
export declare class RolePermissionsController {
    static permissionValidation: import("express-validator").ValidationChain[];
    static getAllPermissions(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static getPermissionsByRole(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static upsertPermission(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static bulkUpsertPermissions(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static deletePermission(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=role-permissions.controller.d.ts.map