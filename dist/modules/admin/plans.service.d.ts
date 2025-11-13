export interface CreatePlanDto {
    name: string;
    slug: string;
    description?: string;
    priceMonthly: number;
    priceYearly: number;
    isAlumniOnly?: boolean;
    isRecommended?: boolean;
    maxPortfolios: number;
    maxCashInvestment: number;
    maxWatchlists: number;
    maxAlerts: number;
    features?: any;
    isActive?: boolean;
}
export interface UpdatePlanDto extends Partial<CreatePlanDto> {
}
export declare class PlansService {
    /**
     * Get all plans
     */
    static getAllPlans(includeInactive?: boolean): Promise<{
        userCount: number;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        priceMonthly: import("@prisma/client/runtime/library.js").Decimal;
        priceYearly: import("@prisma/client/runtime/library.js").Decimal;
        isAlumniOnly: boolean;
        isRecommended: boolean;
        maxPortfolios: number;
        maxCashInvestment: import("@prisma/client/runtime/library.js").Decimal;
        maxWatchlists: number;
        maxAlerts: number;
        features: import("@prisma/client/runtime/library.js").JsonValue;
    }[]>;
    /**
     * Get plan by ID
     */
    static getPlanById(id: string): Promise<{
        userCount: number;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        priceMonthly: import("@prisma/client/runtime/library.js").Decimal;
        priceYearly: import("@prisma/client/runtime/library.js").Decimal;
        isAlumniOnly: boolean;
        isRecommended: boolean;
        maxPortfolios: number;
        maxCashInvestment: import("@prisma/client/runtime/library.js").Decimal;
        maxWatchlists: number;
        maxAlerts: number;
        features: import("@prisma/client/runtime/library.js").JsonValue;
    }>;
    /**
     * Get plan by slug
     */
    static getPlanBySlug(slug: string): Promise<{
        userCount: number;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        priceMonthly: import("@prisma/client/runtime/library.js").Decimal;
        priceYearly: import("@prisma/client/runtime/library.js").Decimal;
        isAlumniOnly: boolean;
        isRecommended: boolean;
        maxPortfolios: number;
        maxCashInvestment: import("@prisma/client/runtime/library.js").Decimal;
        maxWatchlists: number;
        maxAlerts: number;
        features: import("@prisma/client/runtime/library.js").JsonValue;
    }>;
    /**
     * Create a new plan
     */
    static createPlan(data: CreatePlanDto): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        priceMonthly: import("@prisma/client/runtime/library.js").Decimal;
        priceYearly: import("@prisma/client/runtime/library.js").Decimal;
        isAlumniOnly: boolean;
        isRecommended: boolean;
        maxPortfolios: number;
        maxCashInvestment: import("@prisma/client/runtime/library.js").Decimal;
        maxWatchlists: number;
        maxAlerts: number;
        features: import("@prisma/client/runtime/library.js").JsonValue;
    }>;
    /**
     * Update a plan
     */
    static updatePlan(id: string, data: UpdatePlanDto): Promise<{
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        slug: string;
        priceMonthly: import("@prisma/client/runtime/library.js").Decimal;
        priceYearly: import("@prisma/client/runtime/library.js").Decimal;
        isAlumniOnly: boolean;
        isRecommended: boolean;
        maxPortfolios: number;
        maxCashInvestment: import("@prisma/client/runtime/library.js").Decimal;
        maxWatchlists: number;
        maxAlerts: number;
        features: import("@prisma/client/runtime/library.js").JsonValue;
    }>;
    /**
     * Delete a plan (soft delete by setting isActive to false)
     */
    static deletePlan(id: string): Promise<{
        message: string;
    }>;
    /**
     * Assign plan to user
     */
    static assignPlanToUser(userId: string, planId: string): Promise<{
        name: string;
        id: string;
        email: string;
        passwordHash: string;
        role: import(".prisma/client").$Enums.UserRole;
        plan: import(".prisma/client").$Enums.Plan;
        planId: string | null;
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
//# sourceMappingURL=plans.service.d.ts.map