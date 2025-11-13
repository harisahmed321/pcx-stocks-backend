import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';

export interface UpdateUserDto {
  name?: string;
  isFiler?: boolean;
  isActive?: boolean;
  phone?: string;
  cnic?: string;
  role?: 'USER' | 'ADMIN';
  plan?: 'LITE' | 'PRO' | 'ELITE' | 'PREMIUM';
  paymentExpiration?: Date;
  nextPayment?: Date;
}

export class UsersService {
  static async getProfile(userId: string) {
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

  static async updateProfile(userId: string, data: UpdateUserDto) {
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

  static async getAllUsers(page: number = 1, limit: number = 10) {
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

  static async updateUser(userId: string, data: UpdateUserDto) {
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

  static async toggleUserActive(userId: string) {
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
