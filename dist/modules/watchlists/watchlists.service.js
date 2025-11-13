import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';
export class WatchlistsService {
    static async createWatchlist(userId, data) {
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
    static async getUserWatchlists(userId) {
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
        return watchlists;
    }
    static async getWatchlistById(userId, watchlistId) {
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
        return watchlist;
    }
    static async deleteWatchlist(userId, watchlistId) {
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
    static async addWatchlistItem(userId, watchlistId, data) {
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
    static async removeWatchlistItem(userId, itemId) {
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
//# sourceMappingURL=watchlists.service.js.map