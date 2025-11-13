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
export declare class UsersService {
    static getProfile(userId: string): Promise<{
        name: string;
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        plan: import(".prisma/client").$Enums.Plan;
        isFiler: boolean;
        isActive: boolean;
        phone: string | null;
        cnic: string | null;
        paymentExpiration: Date | null;
        nextPayment: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static updateProfile(userId: string, data: UpdateUserDto): Promise<{
        name: string;
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        plan: import(".prisma/client").$Enums.Plan;
        isFiler: boolean;
        isActive: boolean;
        phone: string | null;
        cnic: string | null;
        paymentExpiration: Date | null;
        nextPayment: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static getAllUsers(page?: number, limit?: number): Promise<{
        users: {
            name: string;
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            plan: import(".prisma/client").$Enums.Plan;
            isFiler: boolean;
            isActive: boolean;
            phone: string | null;
            cnic: string | null;
            paymentExpiration: Date | null;
            nextPayment: Date | null;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static updateUser(userId: string, data: UpdateUserDto): Promise<{
        name: string;
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        plan: import(".prisma/client").$Enums.Plan;
        isFiler: boolean;
        isActive: boolean;
        phone: string | null;
        cnic: string | null;
        paymentExpiration: Date | null;
        nextPayment: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    static toggleUserActive(userId: string): Promise<{
        name: string;
        id: string;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        plan: import(".prisma/client").$Enums.Plan;
        isFiler: boolean;
        isActive: boolean;
        phone: string | null;
        cnic: string | null;
        paymentExpiration: Date | null;
        nextPayment: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
//# sourceMappingURL=users.service.d.ts.map