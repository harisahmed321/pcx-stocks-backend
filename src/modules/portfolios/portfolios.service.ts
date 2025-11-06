import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';

export interface CreatePortfolioDto {
  name: string;
  description?: string;
  cashBalance?: number;
}

export interface UpdatePortfolioDto {
  name?: string;
  description?: string;
  cashBalance?: number;
}

export class PortfoliosService {
  static async createPortfolio(userId: string, data: CreatePortfolioDto) {
    const portfolio = await prisma.portfolio.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        cashBalance: data.cashBalance || 0
      },
      include: {
        holdings: true
      }
    });

    return portfolio;
  }

  static async getUserPortfolios(userId: string) {
    const portfolios = await prisma.portfolio.findMany({
      where: { userId },
      include: {
        holdings: {
          select: {
            id: true,
            symbol: true,
            name: true,
            quantity: true,
            avgBuyPrice: true,
            currency: true
          }
        },
        _count: {
          select: {
            holdings: true,
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return portfolios;
  }

  static async getPortfolioById(userId: string, portfolioId: string) {
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: portfolioId,
        userId
      },
      include: {
        holdings: {
          select: {
            id: true,
            symbol: true,
            name: true,
            quantity: true,
            avgBuyPrice: true,
            currency: true,
            addedAt: true,
            updatedAt: true
          }
        },
        transactions: {
          select: {
            id: true,
            type: true,
            symbol: true,
            quantity: true,
            price: true,
            fees: true,
            date: true,
            notes: true
          },
          orderBy: { date: 'desc' },
          take: 20
        }
      }
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    // Calculate total invested and current value (mock prices for now)
    const totalInvested = portfolio.holdings.reduce((sum, holding) => {
      return sum + Number(holding.quantity) * Number(holding.avgBuyPrice);
    }, 0);

    return {
      ...portfolio,
      computed: {
        totalInvested,
        totalValue: totalInvested, // Will be updated with real prices via market service
        gainLoss: 0,
        gainLossPercent: 0
      }
    };
  }

  static async updatePortfolio(userId: string, portfolioId: string, data: UpdatePortfolioDto) {
    // Check ownership
    const existing = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId }
    });

    if (!existing) {
      throw new AppError('Portfolio not found', 404);
    }

    const portfolio = await prisma.portfolio.update({
      where: { id: portfolioId },
      data,
      include: {
        holdings: true
      }
    });

    return portfolio;
  }

  static async deletePortfolio(userId: string, portfolioId: string) {
    // Check ownership
    const existing = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId }
    });

    if (!existing) {
      throw new AppError('Portfolio not found', 404);
    }

    await prisma.portfolio.delete({
      where: { id: portfolioId }
    });

    return { message: 'Portfolio deleted successfully' };
  }
}
