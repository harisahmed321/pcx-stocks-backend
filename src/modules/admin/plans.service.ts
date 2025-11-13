import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';

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

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

export class PlansService {
  /**
   * Get all plans
   */
  static async getAllPlans(includeInactive = false) {
    const whereClause = includeInactive ? {} : ({ isActive: true } as any);
    const plans = await prisma.subscriptionPlan.findMany({
      where: whereClause,
      orderBy: { priceMonthly: 'asc' }
    });

    // Get user counts separately
    const plansWithCounts = await Promise.all(
      plans.map(async (plan) => {
        const userCount = await prisma.user.count({
          where: { planId: plan.id } as any
        });
        return {
          ...plan,
          userCount
        };
      })
    );

    return plansWithCounts;
  }

  /**
   * Get plan by ID
   */
  static async getPlanById(id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    const userCount = await prisma.user.count({
      where: { planId: plan.id } as any
    });

    return {
      ...plan,
      userCount
    };
  }

  /**
   * Get plan by slug
   */
  static async getPlanBySlug(slug: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { slug }
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    const userCount = await prisma.user.count({
      where: { planId: plan.id } as any
    });

    return {
      ...plan,
      userCount
    };
  }

  /**
   * Create a new plan
   */
  static async createPlan(data: CreatePlanDto) {
    // Check if slug already exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: data.slug }
    });

    if (existingPlan) {
      throw new AppError('Plan with this slug already exists', 400);
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        priceMonthly: data.priceMonthly,
        priceYearly: data.priceYearly,
        isAlumniOnly: data.isAlumniOnly || false,
        isRecommended: data.isRecommended || false,
        maxPortfolios: data.maxPortfolios,
        maxCashInvestment: data.maxCashInvestment,
        maxWatchlists: data.maxWatchlists,
        maxAlerts: data.maxAlerts,
        features: data.features || {},
        isActive: data.isActive !== undefined ? data.isActive : true
      } as any
    });

    return plan;
  }

  /**
   * Update a plan
   */
  static async updatePlan(id: string, data: UpdatePlanDto) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    // Check if slug is being changed and if it conflicts
    if (data.slug && data.slug !== plan.slug) {
      const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { slug: data.slug }
      });

      if (existingPlan) {
        throw new AppError('Plan with this slug already exists', 400);
      }
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...data
      }
    });

    return updatedPlan;
  }

  /**
   * Delete a plan (soft delete by setting isActive to false)
   */
  static async deletePlan(id: string) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id }
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    // Check if plan has users
    const userCount = await prisma.user.count({
      where: { planId: plan.id } as any
    });

    if (userCount > 0) {
      throw new AppError(
        `Cannot delete plan. ${userCount} user(s) are currently using this plan.`,
        400
      );
    }

    await prisma.subscriptionPlan.delete({
      where: { id }
    });

    return { message: 'Plan deleted successfully' };
  }

  /**
   * Assign plan to user
   */
  static async assignPlanToUser(userId: string, planId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new AppError('Plan not found', 404);
    }

    if ((plan as any).isActive === false) {
      throw new AppError('Cannot assign inactive plan to user', 400);
    }

    // Map plan name to Plan enum
    const planEnumMap: Record<string, 'LITE' | 'PRO' | 'ELITE' | 'PREMIUM'> = {
      LITE: 'LITE',
      PRO: 'PRO',
      ELITE: 'ELITE',
      PREMIUM: 'PREMIUM'
    };

    const planEnum = planEnumMap[plan.name.toUpperCase()] || 'LITE';

    // Update user's plan
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        planId: planId,
        plan: planEnum as any
      } as any
    });

    return updatedUser;
  }
}
