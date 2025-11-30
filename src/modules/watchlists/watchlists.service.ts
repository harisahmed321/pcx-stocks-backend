import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';

export interface CreateWatchlistDto {
  name: string;
}

export interface AddWatchlistItemDto {
  symbol: string;
  notes?: string;
}

export class WatchlistsService {
  static async createWatchlist(userId: string, data: CreateWatchlistDto) {
    const watchlist = await prisma.watchlist.create({
      data: {
        userId,
        name: data.name,
      },
      include: {
        items: true,
      },
    });

    return watchlist;
  }

  static async getUserWatchlists(userId: string) {
    const watchlists = await prisma.watchlist.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch market data for all items
    const enrichedWatchlists = await Promise.all(
      watchlists.map(async (watchlist) => {
        const itemsWithData = await Promise.all(
          watchlist.items.map(async (item) => {
            const marketData = await prisma.marketData.findFirst({
              where: { symbol: item.symbol },
              orderBy: { timestamp: 'desc' },
            });

            return {
              ...item,
              marketData: marketData ? {
                price: Number(marketData.close),
                change: Number(marketData.close) - Number(marketData.ldcp || marketData.open),
                changePercent: marketData.ldcp 
                  ? ((Number(marketData.close) - Number(marketData.ldcp)) / Number(marketData.ldcp)) * 100 
                  : 0,
                volume: Number(marketData.volume)
              } : null
            };
          })
        );
        return { ...watchlist, items: itemsWithData };
      })
    );

    return enrichedWatchlists;
  }

  static async getWatchlistById(userId: string, watchlistId: string) {
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: watchlistId,
        userId,
      },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!watchlist) {
      throw new AppError('Watchlist not found', 404);
    }

    // Fetch market data for items
    const itemsWithData = await Promise.all(
      watchlist.items.map(async (item) => {
        const marketData = await prisma.marketData.findFirst({
          where: { symbol: item.symbol },
          orderBy: { timestamp: 'desc' },
        });

        return {
          ...item,
          marketData: marketData ? {
            price: Number(marketData.close),
            change: Number(marketData.close) - Number(marketData.ldcp || marketData.open),
            changePercent: marketData.ldcp 
              ? ((Number(marketData.close) - Number(marketData.ldcp)) / Number(marketData.ldcp)) * 100 
              : 0,
            volume: Number(marketData.volume)
          } : null
        };
      })
    );

    return { ...watchlist, items: itemsWithData };
  }

  static async deleteWatchlist(userId: string, watchlistId: string) {
    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
    });

    if (!watchlist) {
      throw new AppError('Watchlist not found', 404);
    }

    await prisma.watchlist.delete({
      where: { id: watchlistId },
    });

    return { message: 'Watchlist deleted successfully' };
  }

  static async addWatchlistItem(userId: string, watchlistId: string, data: AddWatchlistItemDto) {
    // Verify watchlist ownership
    const watchlist = await prisma.watchlist.findFirst({
      where: { id: watchlistId, userId },
    });

    if (!watchlist) {
      throw new AppError('Watchlist not found', 404);
    }

    // Check if item already exists
    const existingItem = await prisma.watchlistItem.findFirst({
      where: {
        watchlistId,
        symbol: data.symbol.toUpperCase(),
      },
    });

    if (existingItem) {
      throw new AppError('Symbol already exists in this watchlist', 409);
    }

    const item = await prisma.watchlistItem.create({
      data: {
        watchlistId,
        symbol: data.symbol.toUpperCase(),
        notes: data.notes,
      },
    });

    return item;
  }

  static async removeWatchlistItem(userId: string, itemId: string) {
    const item = await prisma.watchlistItem.findUnique({
      where: { id: itemId },
      include: { watchlist: true },
    });

    if (!item || item.watchlist.userId !== userId) {
      throw new AppError('Watchlist item not found', 404);
    }

    await prisma.watchlistItem.delete({
      where: { id: itemId },
    });

    return { message: 'Watchlist item removed successfully' };
  }
}

