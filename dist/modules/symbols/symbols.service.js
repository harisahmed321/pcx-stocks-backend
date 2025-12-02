import { prisma } from '../../prisma/client.js';
export class SymbolsService {
    static async getSymbols(query, limit = 50) {
        const where = query
            ? {
                OR: [
                    { symbol: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } }
                ]
            }
            : {};
        const symbols = await prisma.symbol.findMany({
            where,
            take: limit,
            orderBy: [
                { isDebt: 'asc' }, // Non-debt first
                { isETF: 'desc' }, // ETFs second
                { symbol: 'asc' } // Then alphabetically
            ]
        });
        return symbols;
    }
    static async searchSymbols(query, limit = 20) {
        if (!query || query.length < 1) {
            return [];
        }
        const symbols = await prisma.symbol.findMany({
            where: {
                OR: [
                    { symbol: { startsWith: query.toUpperCase() } },
                    { name: { contains: query, mode: 'insensitive' } }
                ],
                isDebt: false // Exclude bonds for trading
            },
            take: limit,
            orderBy: [{ symbol: 'asc' }],
            select: {
                id: true,
                symbol: true,
                name: true,
                sectorName: true,
                isETF: true,
                url: true
            }
        });
        // Fetch latest market data for each symbol
        const symbolsWithMarketData = await Promise.all(symbols.map(async (symbol) => {
            const marketData = await prisma.marketData.findFirst({
                where: { symbol: symbol.symbol },
                orderBy: { timestamp: 'desc' },
                select: {
                    close: true,
                    ldcp: true,
                    open: true
                }
            });
            if (marketData) {
                const price = Number(marketData.close);
                const previousPrice = Number(marketData.ldcp || marketData.open);
                const change = price - previousPrice;
                const changePercent = previousPrice ? (change / previousPrice) * 100 : 0;
                return {
                    ...symbol,
                    price,
                    change,
                    changePercent
                };
            }
            return symbol;
        }));
        return symbolsWithMarketData;
    }
    static async getSymbolByCode(symbol) {
        return await prisma.symbol.findUnique({
            where: { symbol: symbol.toUpperCase() }
        });
    }
    static async getTradingSymbols() {
        return await prisma.symbol.findMany({
            where: {
                isDebt: false // Exclude bonds
            },
            orderBy: {
                symbol: 'asc'
            }
        });
    }
    static async getSymbolsBySector(sector) {
        return await prisma.symbol.findMany({
            where: {
                sectorName: sector,
                isDebt: false
            },
            orderBy: {
                symbol: 'asc'
            }
        });
    }
    static async getAllSectors() {
        const sectors = await prisma.symbol.groupBy({
            by: ['sectorName'],
            where: {
                isDebt: false,
                sectorName: { not: null }
            },
            _count: true
        });
        return sectors
            .filter((s) => s.sectorName !== null)
            .map((s) => ({
            name: s.sectorName,
            count: s._count
        }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }
}
//# sourceMappingURL=symbols.service.js.map