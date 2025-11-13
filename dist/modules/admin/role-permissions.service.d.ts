export interface RolePermissionDto {
    role: string;
    page: string;
    accessType: 'viewOnly' | 'all';
}
export declare class RolePermissionsService {
    static getAllPermissions(): Promise<any>;
    static getPermissionsByRole(role: string): Promise<any>;
    static upsertPermission(data: RolePermissionDto): Promise<any>;
    static bulkUpsertPermissions(permissions: RolePermissionDto[]): Promise<any[]>;
    static deletePermission(role: string, page: string): Promise<void>;
}
//# sourceMappingURL=role-permissions.service.d.ts.map