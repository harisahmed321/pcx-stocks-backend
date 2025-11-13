import { PrismaClient, Plan, UserRole, TransactionType, AlertType } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    // Clean existing data
    await prisma.refreshToken.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.holding.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.watchlistItem.deleteMany();
    await prisma.watchlist.deleteMany();
    await prisma.marketData.deleteMany();
    await prisma.subscriptionPlan.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleaned existing data');
    // Create Subscription Plans (matching pricing plan image)
    const plans = await Promise.all([
        prisma.subscriptionPlan.create({
            data: {
                name: 'Lite',
                slug: 'lite',
                description: 'Dip your toes into the market with essential portfolio tracking.',
                priceMonthly: 800,
                priceYearly: 9600,
                isAlumniOnly: false,
                isRecommended: false,
                maxPortfolios: 1,
                maxCashInvestment: 1000000, // 1M PKR
                maxWatchlists: 1,
                maxAlerts: 3,
                features: {
                    automatedPayouts: true,
                    holdingNotifications: true,
                    holdingAnalytics: true,
                    holdingAnalyticsHistory: '1 year',
                    manualPayouts: true,
                    taxDeductions: true,
                    manualDeductions: true,
                },
                isActive: true,
            },
        }),
        prisma.subscriptionPlan.create({
            data: {
                name: 'Pro',
                slug: 'pro',
                description: 'Elevate your investing with advanced tools and deeper market insights.',
                priceMonthly: 3200,
                priceYearly: 38400,
                isAlumniOnly: false,
                isRecommended: false,
                maxPortfolios: 3,
                maxCashInvestment: 10000000, // 10M PKR
                maxWatchlists: 3,
                maxAlerts: 10,
                features: {
                    automatedPayouts: true,
                    holdingNotifications: true,
                    holdingAnalytics: true,
                    holdingAnalyticsHistory: '1 year',
                    manualPayouts: true,
                    taxDeductions: true,
                    manualDeductions: true,
                },
                isActive: true,
            },
        }),
        prisma.subscriptionPlan.create({
            data: {
                name: 'Elite',
                slug: 'elite',
                description: 'Access comprehensive analytics and exclusive features for seasoned traders.',
                priceMonthly: 2400,
                priceYearly: 28800,
                isAlumniOnly: true,
                isRecommended: false,
                maxPortfolios: 5,
                maxCashInvestment: 50000000, // 50M PKR
                maxWatchlists: 10,
                maxAlerts: 10,
                features: {
                    automatedPayouts: true,
                    holdingNotifications: true,
                    holdingAnalytics: true,
                    holdingAnalyticsHistory: '5 years',
                    manualPayouts: true,
                    taxDeductions: true,
                    manualDeductions: true,
                },
                isActive: true,
            },
        }),
        prisma.subscriptionPlan.create({
            data: {
                name: 'Premium',
                slug: 'premium',
                description: 'Access comprehensive analytics and exclusive features for seasoned traders.',
                priceMonthly: 4800,
                priceYearly: 57600,
                isAlumniOnly: false,
                isRecommended: true,
                maxPortfolios: 5,
                maxCashInvestment: 20000000, // 20M PKR
                maxWatchlists: 5,
                maxAlerts: 15,
                features: {
                    automatedPayouts: true,
                    holdingNotifications: true,
                    holdingAnalytics: true,
                    holdingAnalyticsHistory: '3 years',
                    manualPayouts: true,
                    taxDeductions: true,
                    manualDeductions: true,
                    bullsAndBearsShow: true,
                },
                isActive: true,
            },
        }),
    ]);
    console.log('✅ Created subscription plans');
    // Create Users
    const passwordHash = await bcrypt.hash('password123', 12);
    const users = await Promise.all([
        prisma.user.create({
            data: {
                name: 'Lite User',
                email: 'lite@example.com',
                passwordHash,
                role: UserRole.USER,
                plan: Plan.LITE,
                planId: plans[0].id,
                isFiler: false,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Pro User',
                email: 'pro@example.com',
                passwordHash,
                role: UserRole.USER,
                plan: Plan.PRO,
                planId: plans[1].id,
                isFiler: true,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Elite User',
                email: 'elite@example.com',
                passwordHash,
                role: UserRole.USER,
                plan: Plan.ELITE,
                planId: plans[2].id,
                isFiler: true,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Premium User',
                email: 'premium@example.com',
                passwordHash,
                role: UserRole.USER,
                plan: Plan.PREMIUM,
                planId: plans[3].id,
                isFiler: true,
            },
        }),
        prisma.user.create({
            data: {
                name: 'Admin User',
                email: 'admin@example.com',
                passwordHash,
                role: UserRole.ADMIN,
                plan: Plan.PREMIUM,
                planId: plans[3].id,
                isFiler: true,
            },
        }),
    ]);
    console.log('✅ Created users (password: password123)');
    // Create Portfolios and Holdings for Pro User
    const proPortfolio1 = await prisma.portfolio.create({
        data: {
            userId: users[1].id,
            name: 'Main Portfolio',
            description: 'Primary investment portfolio',
            cashBalance: 500000,
        },
    });
    const proPortfolio2 = await prisma.portfolio.create({
        data: {
            userId: users[1].id,
            name: 'Tech Stocks',
            description: 'Technology sector investments',
            cashBalance: 200000,
        },
    });
    // Create Holdings
    const holdings = await Promise.all([
        prisma.holding.create({
            data: {
                portfolioId: proPortfolio1.id,
                symbol: 'PSO',
                name: 'Pakistan State Oil',
                quantity: 100,
                avgBuyPrice: 245.50,
            },
        }),
        prisma.holding.create({
            data: {
                portfolioId: proPortfolio1.id,
                symbol: 'OGDC',
                name: 'Oil & Gas Development Company',
                quantity: 200,
                avgBuyPrice: 148.75,
            },
        }),
        prisma.holding.create({
            data: {
                portfolioId: proPortfolio1.id,
                symbol: 'LUCK',
                name: 'Lucky Cement',
                quantity: 50,
                avgBuyPrice: 795.00,
            },
        }),
        prisma.holding.create({
            data: {
                portfolioId: proPortfolio2.id,
                symbol: 'ENGRO',
                name: 'Engro Corporation',
                quantity: 150,
                avgBuyPrice: 295.50,
            },
        }),
    ]);
    console.log('✅ Created portfolios and holdings');
    // Create Transactions
    await Promise.all([
        prisma.transaction.create({
            data: {
                portfolioId: proPortfolio1.id,
                holdingId: holdings[0].id,
                type: TransactionType.BUY,
                symbol: 'PSO',
                quantity: 100,
                price: 245.50,
                fees: 500,
                date: new Date('2024-01-15'),
                notes: 'Initial investment',
            },
        }),
        prisma.transaction.create({
            data: {
                portfolioId: proPortfolio1.id,
                holdingId: holdings[1].id,
                type: TransactionType.BUY,
                symbol: 'OGDC',
                quantity: 200,
                price: 148.75,
                fees: 600,
                date: new Date('2024-02-01'),
                notes: 'Added to portfolio',
            },
        }),
        prisma.transaction.create({
            data: {
                portfolioId: proPortfolio1.id,
                holdingId: holdings[2].id,
                type: TransactionType.BUY,
                symbol: 'LUCK',
                quantity: 50,
                price: 795.00,
                fees: 800,
                date: new Date('2024-03-10'),
                notes: 'Cement sector investment',
            },
        }),
    ]);
    console.log('✅ Created transactions');
    // Create Watchlists
    const watchlist1 = await prisma.watchlist.create({
        data: {
            userId: users[1].id,
            name: 'Banking Stocks',
        },
    });
    const watchlist2 = await prisma.watchlist.create({
        data: {
            userId: users[1].id,
            name: 'Energy Sector',
        },
    });
    // Create Watchlist Items
    await Promise.all([
        prisma.watchlistItem.create({
            data: {
                watchlistId: watchlist1.id,
                symbol: 'HBL',
                notes: 'Strong fundamentals',
            },
        }),
        prisma.watchlistItem.create({
            data: {
                watchlistId: watchlist1.id,
                symbol: 'MCB',
                notes: 'Good dividend history',
            },
        }),
        prisma.watchlistItem.create({
            data: {
                watchlistId: watchlist2.id,
                symbol: 'PPL',
                notes: 'Watching for entry point',
            },
        }),
        prisma.watchlistItem.create({
            data: {
                watchlistId: watchlist2.id,
                symbol: 'HUBC',
                notes: 'Power sector play',
            },
        }),
    ]);
    console.log('✅ Created watchlists');
    // Create Alerts
    await Promise.all([
        prisma.alert.create({
            data: {
                userId: users[1].id,
                symbol: 'PSO',
                alertType: AlertType.PRICE,
                condition: '> 260',
            },
        }),
        prisma.alert.create({
            data: {
                userId: users[1].id,
                symbol: 'OGDC',
                alertType: AlertType.PRICE,
                condition: '< 140',
            },
        }),
        prisma.alert.create({
            data: {
                userId: users[1].id,
                symbol: 'HBL',
                alertType: AlertType.PRICE,
                condition: '> 190',
            },
        }),
    ]);
    console.log('✅ Created alerts');
    // Create Historical Market Data (last 30 days for PSO)
    const today = new Date();
    const marketDataPromises = [];
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const basePrice = 250;
        const variation = Math.sin(i / 5) * 10 + (Math.random() - 0.5) * 5;
        const open = basePrice + variation;
        const close = open + (Math.random() - 0.5) * 8;
        const high = Math.max(open, close) + Math.random() * 3;
        const low = Math.min(open, close) - Math.random() * 3;
        marketDataPromises.push(prisma.marketData.create({
            data: {
                symbol: 'PSO',
                timestamp: date,
                open,
                high,
                low,
                close,
                volume: Math.floor(Math.random() * 1000000) + 500000,
            },
        }));
    }
    await Promise.all(marketDataPromises);
    console.log('✅ Created historical market data');
    console.log('🎉 Seeding completed successfully!');
    console.log('\n📧 Test user credentials:');
    console.log('Free User: free@example.com / password123');
    console.log('Pro User: pro@example.com / password123');
    console.log('Premium User: premium@example.com / password123');
    console.log('Admin User: admin@example.com / password123');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map