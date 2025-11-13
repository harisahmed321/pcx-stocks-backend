import { prisma } from '../../prisma/client.js';
export class RolePermissionsService {
    static async getAllPermissions() {
        const permissions = await prisma.rolePermission.findMany({
            orderBy: [{ role: 'asc' }, { page: 'asc' }]
        });
        return permissions;
    }
    static async getPermissionsByRole(role) {
        const permissions = await prisma.rolePermission.findMany({
            where: { role: role },
            orderBy: { page: 'asc' }
        });
        return permissions;
    }
    static async upsertPermission(data) {
        const permission = await prisma.rolePermission.upsert({
            where: {
                role_page: {
                    role: data.role,
                    page: data.page
                }
            },
            update: {
                accessType: data.accessType
            },
            create: {
                role: data.role,
                page: data.page,
                accessType: data.accessType
            }
        });
        return permission;
    }
    static async bulkUpsertPermissions(permissions) {
        const results = await Promise.all(permissions.map((perm) => this.upsertPermission(perm)));
        return results;
    }
    static async deletePermission(role, page) {
        await prisma.rolePermission.delete({
            where: {
                role_page: {
                    role: role,
                    page: page
                }
            }
        });
    }
}
//# sourceMappingURL=role-permissions.service.js.map