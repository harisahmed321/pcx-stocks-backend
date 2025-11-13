import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';
export class UsersService {
    static async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                plan: true,
                isFiler: true,
                isActive: true,
                phone: true,
                cnic: true,
                paymentExpiration: true,
                nextPayment: true,
                createdAt: true,
                updatedAt: true
            }
        });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return user;
    }
    static async updateProfile(userId, data) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                plan: true,
                isFiler: true,
                isActive: true,
                phone: true,
                cnic: true,
                paymentExpiration: true,
                nextPayment: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return user;
    }
    static async getAllUsers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    plan: true,
                    isFiler: true,
                    isActive: true,
                    phone: true,
                    cnic: true,
                    paymentExpiration: true,
                    nextPayment: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.user.count()
        ]);
        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    static async updateUser(userId, data) {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                plan: true,
                isFiler: true,
                isActive: true,
                phone: true,
                cnic: true,
                paymentExpiration: true,
                nextPayment: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return user;
    }
    static async toggleUserActive(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isActive: true }
        });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        return this.updateUser(userId, { isActive: !user.isActive });
    }
}
//# sourceMappingURL=users.service.js.map