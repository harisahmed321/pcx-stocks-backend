import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';

export interface CreateHoldingDto {
  symbol: string;
  name?: string;
  quantity: number;
  avgBuyPrice: number;
  currency?: string;
}

export interface UpdateHoldingDto {
  quantity?: number;
  avgBuyPrice?: number;
  name?: string;
}

export class HoldingsService {
  static async createHolding(userId: string, portfolioId: string, data: CreateHoldingDto) {
    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    // Check if holding already exists for this symbol
    const existingHolding = await prisma.holding.findFirst({
      where: {
        portfolioId,
        symbol: data.symbol,
      },
    });

    if (existingHolding) {
      throw new AppError('Holding for this symbol already exists in this portfolio', 409);
    }

    const holding = await prisma.holding.create({
      data: {
        portfolioId,
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        quantity: data.quantity,
        avgBuyPrice: data.avgBuyPrice,
        currency: data.currency || 'PKR',
      },
    });

    return holding;
  }

  static async getPortfolioHoldings(userId: string, portfolioId: string) {
    // Verify portfolio ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new AppError('Portfolio not found', 404);
    }

    const holdings = await prisma.holding.findMany({
      where: { portfolioId },
      orderBy: { addedAt: 'desc' },
    });

    return holdings;
  }

  static async updateHolding(userId: string, holdingId: string, data: UpdateHoldingDto) {
    // Verify holding ownership through portfolio
    const holding = await prisma.holding.findUnique({
      where: { id: holdingId },
      include: { portfolio: true },
    });

    if (!holding || holding.portfolio.userId !== userId) {
      throw new AppError('Holding not found', 404);
    }

    const updated = await prisma.holding.update({
      where: { id: holdingId },
      data,
    });

    return updated;
  }

  static async deleteHolding(userId: string, holdingId: string) {
    // Verify holding ownership through portfolio
    const holding = await prisma.holding.findUnique({
      where: { id: holdingId },
      include: { portfolio: true },
    });

    if (!holding || holding.portfolio.userId !== userId) {
      throw new AppError('Holding not found', 404);
    }

    await prisma.holding.delete({
      where: { id: holdingId },
    });

    return { message: 'Holding deleted successfully' };
  }
}

