import { prisma } from '../../prisma/client.js';

export interface RolePermissionDto {
  role: string;
  page: string;
  accessType: 'viewOnly' | 'all';
}

export class RolePermissionsService {
  static async getAllPermissions() {
    const permissions = await (prisma as any).rolePermission.findMany({
      orderBy: [{ role: 'asc' }, { page: 'asc' }]
    });

    return permissions;
  }

  static async getPermissionsByRole(role: string) {
    const permissions = await (prisma as any).rolePermission.findMany({
      where: { role: role as any },
      orderBy: { page: 'asc' }
    });

    return permissions;
  }

  static async upsertPermission(data: RolePermissionDto) {
    const permission = await (prisma as any).rolePermission.upsert({
      where: {
        role_page: {
          role: data.role as any,
          page: data.page
        }
      },
      update: {
        accessType: data.accessType
      },
      create: {
        role: data.role as any,
        page: data.page,
        accessType: data.accessType
      }
    });

    return permission;
  }

  static async bulkUpsertPermissions(permissions: RolePermissionDto[]) {
    const results = await Promise.all(permissions.map((perm) => this.upsertPermission(perm)));

    return results;
  }

  static async deletePermission(role: string, page: string) {
    await (prisma as any).rolePermission.delete({
      where: {
        role_page: {
          role: role as any,
          page: page
        }
      }
    });
  }
}
