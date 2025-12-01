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
          manualDeductions: true
        },
        isActive: true
      } as any
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
          manualDeductions: true
        },
        isActive: true
      } as any
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
          manualDeductions: true
        },
        isActive: true
      } as any
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
          bullsAndBearsShow: true
        },
        isActive: true
      } as any
    })
  ]);

  console.log('✅ Created subscription plans');

  // Create Users
  const passwordHash = await bcrypt.hash('password123', 12);

  // Create test users for each plan
  const users = await Promise.all([
    // Lite Plan User
    prisma.user.create({
      data: {
        name: 'Lite User',
        email: 'lite@example.com',
        passwordHash,
        role: UserRole.USER,
        plan: Plan.LITE,
        planId: plans[0].id,
        isFiler: false,
        isActive: true
      } as any
    }),
    // Pro Plan User
    prisma.user.create({
      data: {
        name: 'Pro User',
        email: 'pro@example.com',
        passwordHash,
        role: UserRole.USER,
        plan: Plan.PRO,
        planId: plans[1].id,
        isFiler: true,
        isActive: true
      } as any
    }),
    // Elite Plan User (Alumni)
    prisma.user.create({
      data: {
        name: 'Elite User',
        email: 'elite@example.com',
        passwordHash,
        role: UserRole.USER,
        plan: Plan.ELITE,
        planId: plans[2].id,
        isFiler: true,
        isActive: true
      } as any
    }),
    // Premium Plan User
    prisma.user.create({
      data: {
        name: 'Premium User',
        email: 'premium@example.com',
        passwordHash,
        role: UserRole.USER,
        plan: Plan.PREMIUM,
        planId: plans[3].id,
        isFiler: true,
        isActive: true
      } as any
    }),
    // Admin User (Premium Plan)
    prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash,
        role: UserRole.ADMIN,
        plan: Plan.PREMIUM,
        planId: plans[3].id,
        isFiler: true,
        isActive: true
      } as any
    }),
    // Additional test users for better testing
    prisma.user.create({
      data: {
        name: 'Test Lite User 2',
        email: 'lite2@example.com',
        passwordHash,
        role: UserRole.USER,
        plan: Plan.LITE,
        planId: plans[0].id,
        isFiler: false,
        isActive: true
      } as any
    }),
    prisma.user.create({
      data: {
        name: 'Test Pro User 2',
        email: 'pro2@example.com',
        passwordHash,
        role: UserRole.USER,
        plan: Plan.PRO,
        planId: plans[1].id,
        isFiler: true,
        isActive: true
      } as any
    })
  ]);

  console.log('✅ Created users (password: password123)');
  console.log(`   - Lite Users: ${users.filter((u) => u.plan === Plan.LITE).length}`);
  console.log(`   - Pro Users: ${users.filter((u) => u.plan === Plan.PRO).length}`);
  console.log(`   - Elite Users: ${users.filter((u) => u.plan === Plan.ELITE).length}`);
  console.log(`   - Premium Users: ${users.filter((u) => u.plan === Plan.PREMIUM).length}`);
  console.log(`   - Admin Users: ${users.filter((u) => u.role === UserRole.ADMIN).length}`);

  // Create Portfolios and Holdings for different plan users

  // Lite User (index 0) - 1 portfolio (plan limit)
  const litePortfolio = await prisma.portfolio.create({
    data: {
      userId: users[0].id,
      name: 'My Portfolio',
      description: 'Lite plan portfolio',
      cashBalance: 50000
    }
  });

  // Pro User (index 1) - 3 portfolios (plan limit)
  const proPortfolio1 = await prisma.portfolio.create({
    data: {
      userId: users[1].id,
      name: 'Main Portfolio',
      description: 'Primary investment portfolio',
      cashBalance: 500000
    }
  });

  const proPortfolio2 = await prisma.portfolio.create({
    data: {
      userId: users[1].id,
      name: 'Tech Stocks',
      description: 'Technology sector investments',
      cashBalance: 200000
    }
  });

  const proPortfolio3 = await prisma.portfolio.create({
    data: {
      userId: users[1].id,
      name: 'Energy Sector',
      description: 'Energy and oil stocks',
      cashBalance: 300000
    }
  });

  // Elite User (index 2) - 5 portfolios (plan limit)
  const elitePortfolio1 = await prisma.portfolio.create({
    data: {
      userId: users[2].id,
      name: 'Main Portfolio',
      description: 'Elite user main portfolio',
      cashBalance: 1000000
    }
  });

  const elitePortfolio2 = await prisma.portfolio.create({
    data: {
      userId: users[2].id,
      name: 'Growth Stocks',
      description: 'High growth potential stocks',
      cashBalance: 500000
    }
  });

  // Premium User (index 3) - 5 portfolios (plan limit)
  const premiumPortfolio1 = await prisma.portfolio.create({
    data: {
      userId: users[3].id,
      name: 'Main Portfolio',
      description: 'Premium user main portfolio',
      cashBalance: 2000000
    }
  });

  const premiumPortfolio2 = await prisma.portfolio.create({
    data: {
      userId: users[3].id,
      name: 'Dividend Portfolio',
      description: 'High dividend yield stocks',
      cashBalance: 1000000
    }
  });

  // Add more portfolios for Elite and Premium users (within their plan limits)
  const elitePortfolio3 = await prisma.portfolio.create({
    data: {
      userId: users[2].id,
      name: 'Banking Sector',
      description: 'Banking stocks portfolio',
      cashBalance: 750000
    }
  });

  const elitePortfolio4 = await prisma.portfolio.create({
    data: {
      userId: users[2].id,
      name: 'Cement Sector',
      description: 'Cement industry investments',
      cashBalance: 600000
    }
  });

  const elitePortfolio5 = await prisma.portfolio.create({
    data: {
      userId: users[2].id,
      name: 'Diversified Portfolio',
      description: 'Mixed sector holdings',
      cashBalance: 400000
    }
  });

  const premiumPortfolio3 = await prisma.portfolio.create({
    data: {
      userId: users[3].id,
      name: 'Blue Chip Stocks',
      description: 'Large cap stable companies',
      cashBalance: 1500000
    }
  });

  const premiumPortfolio4 = await prisma.portfolio.create({
    data: {
      userId: users[3].id,
      name: 'Oil & Gas',
      description: 'Energy sector focused',
      cashBalance: 800000
    }
  });

  const premiumPortfolio5 = await prisma.portfolio.create({
    data: {
      userId: users[3].id,
      name: 'Tech & Growth',
      description: 'Technology and growth stocks',
      cashBalance: 500000
    }
  });

  // Admin User (index 4) - 5 portfolios (Premium plan limit)
  const adminPortfolio1 = await prisma.portfolio.create({
    data: {
      userId: users[4].id,
      name: 'Admin Test Portfolio',
      description: 'Primary admin testing portfolio',
      cashBalance: 1000000
    }
  });

  const adminPortfolio2 = await prisma.portfolio.create({
    data: {
      userId: users[4].id,
      name: 'Banking Sector',
      description: 'Banking stocks portfolio',
      cashBalance: 500000
    }
  });

  const adminPortfolio3 = await prisma.portfolio.create({
    data: {
      userId: users[4].id,
      name: 'Energy & Utilities',
      description: 'Oil, gas, and power sector',
      cashBalance: 750000
    }
  });

  // Create Holdings for different users
  // First, fetch latest market data for realistic avg buy prices
  const getLatestPrice = async (symbol: string): Promise<number> => {
    const latestData = await prisma.marketData.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' }
    });
    // If no market data, use a fallback price
    return latestData ? Number(latestData.close) : 100;
  };

  const holdings = await Promise.all([
    // Lite User Holdings
    prisma.holding.create({
      data: {
        portfolioId: litePortfolio.id,
        symbol: 'HBL',
        name: 'Habib Bank Limited',
        quantity: 50,
        avgBuyPrice: (await getLatestPrice('HBL')) * 0.95 // 5% below current price
      }
    }),
    // Pro User Holdings
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio1.id,
        symbol: 'PSO',
        name: 'Pakistan State Oil',
        quantity: 100,
        avgBuyPrice: (await getLatestPrice('PSO')) * 0.92 // 8% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio1.id,
        symbol: 'OGDC',
        name: 'Oil & Gas Development Company',
        quantity: 200,
        avgBuyPrice: (await getLatestPrice('OGDC')) * 0.97 // 3% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio1.id,
        symbol: 'LUCK',
        name: 'Lucky Cement',
        quantity: 50,
        avgBuyPrice: (await getLatestPrice('LUCK')) * 0.9 // 10% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio2.id,
        symbol: 'SYS',
        name: 'Systems Limited',
        quantity: 150,
        avgBuyPrice: (await getLatestPrice('SYS')) * 0.88 // 12% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio3.id,
        symbol: 'PPL',
        name: 'Pakistan Petroleum Limited',
        quantity: 100,
        avgBuyPrice: (await getLatestPrice('PPL')) * 0.93 // 7% below current price
      }
    }),
    // Elite User Holdings
    prisma.holding.create({
      data: {
        portfolioId: elitePortfolio1.id,
        symbol: 'UBL',
        name: 'United Bank Limited',
        quantity: 200,
        avgBuyPrice: (await getLatestPrice('UBL')) * 0.94 // 6% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: elitePortfolio2.id,
        symbol: 'MCB',
        name: 'Muslim Commercial Bank',
        quantity: 150,
        avgBuyPrice: (await getLatestPrice('MCB')) * 0.91 // 9% below current price
      }
    }),
    // Premium User Holdings
    prisma.holding.create({
      data: {
        portfolioId: premiumPortfolio1.id,
        symbol: 'FFC',
        name: 'Fauji Fertilizer Company',
        quantity: 500,
        avgBuyPrice: (await getLatestPrice('FFC')) * 0.85 // 15% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: premiumPortfolio2.id,
        symbol: 'HUBC',
        name: 'Hub Power Company',
        quantity: 300,
        avgBuyPrice: (await getLatestPrice('HUBC')) * 0.96 // 4% below current price
      }
    }),
    // Additional Elite User Holdings (for more portfolios)
    prisma.holding.create({
      data: {
        portfolioId: elitePortfolio3.id,
        symbol: 'HBL',
        name: 'Habib Bank Limited',
        quantity: 250,
        avgBuyPrice: (await getLatestPrice('HBL')) * 0.89 // 11% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: elitePortfolio3.id,
        symbol: 'BAFL',
        name: 'Bank Alfalah',
        quantity: 400,
        avgBuyPrice: (await getLatestPrice('BAFL')) * 0.92 // 8% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: elitePortfolio4.id,
        symbol: 'LUCK',
        name: 'Lucky Cement',
        quantity: 80,
        avgBuyPrice: (await getLatestPrice('LUCK')) * 0.87 // 13% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: elitePortfolio5.id,
        symbol: 'ENGRO',
        name: 'Engro Corporation',
        quantity: 180,
        avgBuyPrice: (await getLatestPrice('ENGRO')) * 0.91 // 9% below current price
      }
    }),
    // Additional Premium User Holdings (for more portfolios)
    prisma.holding.create({
      data: {
        portfolioId: premiumPortfolio3.id,
        symbol: 'PSO',
        name: 'Pakistan State Oil',
        quantity: 200,
        avgBuyPrice: (await getLatestPrice('PSO')) * 0.88 // 12% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: premiumPortfolio3.id,
        symbol: 'OGDC',
        name: 'Oil & Gas Development',
        quantity: 300,
        avgBuyPrice: (await getLatestPrice('OGDC')) * 0.93 // 7% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: premiumPortfolio4.id,
        symbol: 'PPL',
        name: 'Pakistan Petroleum',
        quantity: 250,
        avgBuyPrice: (await getLatestPrice('PPL')) * 0.9 // 10% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: premiumPortfolio5.id,
        symbol: 'SYS',
        name: 'Systems Limited',
        quantity: 120,
        avgBuyPrice: (await getLatestPrice('SYS')) * 0.85 // 15% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: premiumPortfolio5.id,
        symbol: 'TRG',
        name: 'TRG Pakistan',
        quantity: 200,
        avgBuyPrice: (await getLatestPrice('TRG')) * 0.92 // 8% below current price
      }
    }),
    // Admin User Holdings
    prisma.holding.create({
      data: {
        portfolioId: adminPortfolio1.id,
        symbol: 'HBL',
        name: 'Habib Bank Limited',
        quantity: 150,
        avgBuyPrice: (await getLatestPrice('HBL')) * 0.93 // 7% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: adminPortfolio1.id,
        symbol: 'LUCK',
        name: 'Lucky Cement',
        quantity: 100,
        avgBuyPrice: (await getLatestPrice('LUCK')) * 0.88 // 12% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: adminPortfolio1.id,
        symbol: 'SYS',
        name: 'Systems Limited',
        quantity: 80,
        avgBuyPrice: (await getLatestPrice('SYS')) * 0.9 // 10% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: adminPortfolio2.id,
        symbol: 'UBL',
        name: 'United Bank Limited',
        quantity: 200,
        avgBuyPrice: (await getLatestPrice('UBL')) * 0.92 // 8% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: adminPortfolio2.id,
        symbol: 'MCB',
        name: 'Muslim Commercial Bank',
        quantity: 150,
        avgBuyPrice: (await getLatestPrice('MCB')) * 0.95 // 5% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: adminPortfolio3.id,
        symbol: 'PSO',
        name: 'Pakistan State Oil',
        quantity: 120,
        avgBuyPrice: (await getLatestPrice('PSO')) * 0.9 // 10% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: adminPortfolio3.id,
        symbol: 'OGDC',
        name: 'Oil & Gas Development Company',
        quantity: 250,
        avgBuyPrice: (await getLatestPrice('OGDC')) * 0.94 // 6% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: adminPortfolio3.id,
        symbol: 'PPL',
        name: 'Pakistan Petroleum Limited',
        quantity: 180,
        avgBuyPrice: (await getLatestPrice('PPL')) * 0.91 // 9% below current price
      }
    }),
    // Additional Lite User holding
    prisma.holding.create({
      data: {
        portfolioId: litePortfolio.id,
        symbol: 'MCB',
        name: 'MCB Bank',
        quantity: 30,
        avgBuyPrice: (await getLatestPrice('MCB')) * 0.94 // 6% below current price
      }
    }),
    // Additional Pro User holdings
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio2.id,
        symbol: 'TRG',
        name: 'TRG Pakistan',
        quantity: 100,
        avgBuyPrice: (await getLatestPrice('TRG')) * 0.9 // 10% below current price
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio3.id,
        symbol: 'HUBC',
        name: 'Hub Power Company',
        quantity: 200,
        avgBuyPrice: (await getLatestPrice('HUBC')) * 0.95 // 5% below current price
      }
    })
  ]);

  console.log('✅ Created portfolios and holdings');

  // Create Transactions
  await Promise.all([
    prisma.transaction.create({
      data: {
        portfolioId: proPortfolio1.id,
        holdingId: holdings[1].id,
        type: TransactionType.BUY,
        symbol: 'PSO',
        quantity: 100,
        price: holdings[1].avgBuyPrice,
        fees: 500,
        date: new Date('2024-01-15'),
        notes: 'Initial investment'
      }
    }),
    prisma.transaction.create({
      data: {
        portfolioId: proPortfolio1.id,
        holdingId: holdings[2].id,
        type: TransactionType.BUY,
        symbol: 'OGDC',
        quantity: 200,
        price: holdings[2].avgBuyPrice,
        fees: 600,
        date: new Date('2024-02-01'),
        notes: 'Added to portfolio'
      }
    }),
    prisma.transaction.create({
      data: {
        portfolioId: proPortfolio1.id,
        holdingId: holdings[3].id,
        type: TransactionType.BUY,
        symbol: 'LUCK',
        quantity: 50,
        price: holdings[3].avgBuyPrice,
        fees: 800,
        date: new Date('2024-03-10'),
        notes: 'Cement sector investment'
      }
    })
  ]);

  console.log('✅ Created transactions');

  // Create Watchlists for different users
  const watchlist1 = await prisma.watchlist.create({
    data: {
      userId: users[1].id, // Pro User
      name: 'Banking Stocks'
    }
  });

  const watchlist2 = await prisma.watchlist.create({
    data: {
      userId: users[1].id, // Pro User
      name: 'Energy Sector'
    }
  });

  const watchlist3 = await prisma.watchlist.create({
    data: {
      userId: users[1].id, // Pro User
      name: 'Tech Stocks'
    }
  });

  const watchlist4 = await prisma.watchlist.create({
    data: {
      userId: users[0].id, // Lite User
      name: 'My Watchlist'
    }
  });

  const watchlist5 = await prisma.watchlist.create({
    data: {
      userId: users[2].id, // Elite User
      name: 'Alumni Picks'
    }
  });

  const watchlist6 = await prisma.watchlist.create({
    data: {
      userId: users[3].id, // Premium User
      name: 'High Dividend Stocks'
    }
  });

  const watchlist7 = await prisma.watchlist.create({
    data: {
      userId: users[3].id, // Premium User
      name: 'Growth Opportunities'
    }
  });

  const watchlist8 = await prisma.watchlist.create({
    data: {
      userId: users[2].id, // Elite User
      name: 'Cement & Construction'
    }
  });

  // Admin User Watchlists
  const watchlist9 = await prisma.watchlist.create({
    data: {
      userId: users[4].id, // Admin User
      name: 'Admin Watchlist - Blue Chips'
    }
  });

  const watchlist10 = await prisma.watchlist.create({
    data: {
      userId: users[4].id, // Admin User
      name: 'Admin Watchlist - Tech Sector'
    }
  });

  const watchlist11 = await prisma.watchlist.create({
    data: {
      userId: users[4].id, // Admin User
      name: 'Admin Watchlist - Energy'
    }
  });

  // Create Watchlist Items
  await Promise.all([
    // Pro User Watchlists
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist1.id,
        symbol: 'HBL',
        notes: 'Strong fundamentals'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist1.id,
        symbol: 'MCB',
        notes: 'Good dividend history'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist2.id,
        symbol: 'PPL',
        notes: 'Watching for entry point'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist2.id,
        symbol: 'HUBC',
        notes: 'Power sector play'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist3.id,
        symbol: 'SYS',
        notes: 'Systems Limited - IT sector'
      }
    }),
    // Lite User Watchlist
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist4.id,
        symbol: 'PSO',
        notes: 'Watching for entry'
      }
    }),
    // Elite User Watchlist
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist5.id,
        symbol: 'UBL',
        notes: 'Alumni recommendation'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist5.id,
        symbol: 'OGDC',
        notes: 'Energy sector pick'
      }
    }),
    // Premium User Watchlists
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist6.id,
        symbol: 'FFC',
        notes: 'Strong dividend payer'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist6.id,
        symbol: 'HUBC',
        notes: 'Utility sector dividend'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist7.id,
        symbol: 'SYS',
        notes: 'IT growth potential'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist7.id,
        symbol: 'TRG',
        notes: 'BPO sector leader'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist8.id,
        symbol: 'LUCK',
        notes: 'Leading cement company'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist8.id,
        symbol: 'DGKC',
        notes: 'Cement sector'
      }
    }),
    // Admin User Watchlist Items
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist9.id,
        symbol: 'HBL',
        notes: 'Blue chip - banking sector leader'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist9.id,
        symbol: 'ENGRO',
        notes: 'Blue chip - diversified conglomerate'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist9.id,
        symbol: 'LUCK',
        notes: 'Blue chip - cement sector'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist10.id,
        symbol: 'SYS',
        notes: 'Systems Limited - IT services'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist10.id,
        symbol: 'TRG',
        notes: 'TRG Pakistan - BPO sector'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist11.id,
        symbol: 'PSO',
        notes: 'Pakistan State Oil'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist11.id,
        symbol: 'OGDC',
        notes: 'Oil & Gas Development'
      }
    }),
    prisma.watchlistItem.create({
      data: {
        watchlistId: watchlist11.id,
        symbol: 'PPL',
        notes: 'Pakistan Petroleum Limited'
      }
    })
  ]);

  console.log('✅ Created watchlists');

  // Create Alerts for different users
  // Get target prices based on current market data
  const getTargetPrice = async (symbol: string, multiplier: number): Promise<number> => {
    const latestData = await prisma.marketData.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' }
    });
    return latestData ? Number(latestData.close) * multiplier : 100 * multiplier;
  };

  await Promise.all([
    // Pro User Alerts (within plan limit of 10)
    prisma.alert.create({
      data: {
        userId: users[1].id,
        symbol: 'PSO',
        alertType: AlertType.PRICE,
        condition: `> ${Math.round(await getTargetPrice('PSO', 1.05))}`
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[1].id,
        symbol: 'OGDC',
        alertType: AlertType.PRICE,
        condition: `< ${Math.round(await getTargetPrice('OGDC', 0.95))}`
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[1].id,
        symbol: 'HBL',
        alertType: AlertType.PRICE,
        condition: `> ${Math.round(await getTargetPrice('HBL', 1.1))}`
      }
    }),
    // Lite User Alerts (within plan limit of 3)
    prisma.alert.create({
      data: {
        userId: users[0].id,
        symbol: 'HBL',
        alertType: AlertType.PRICE,
        condition: `> ${Math.round(await getTargetPrice('HBL', 1.08))}`
      }
    }),
    // Elite User Alerts (within plan limit of 10)
    prisma.alert.create({
      data: {
        userId: users[2].id,
        symbol: 'UBL',
        alertType: AlertType.PRICE,
        condition: `> ${Math.round(await getTargetPrice('UBL', 1.12))}`
      }
    }),
    // Premium User Alerts (within plan limit of 15)
    prisma.alert.create({
      data: {
        userId: users[3].id,
        symbol: 'FFC',
        alertType: AlertType.PRICE,
        condition: `> ${Math.round(await getTargetPrice('FFC', 1.15))}`
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[3].id,
        symbol: 'HUBC',
        alertType: AlertType.PRICE,
        condition: `< ${Math.round(await getTargetPrice('HUBC', 0.9))}`
      }
    }),
    // More Pro User Alerts
    prisma.alert.create({
      data: {
        userId: users[1].id,
        symbol: 'SYS',
        alertType: AlertType.PRICE,
        condition: `> ${Math.round(await getTargetPrice('SYS', 1.08))}`
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[1].id,
        symbol: 'LUCK',
        alertType: AlertType.PRICE,
        condition: `< ${Math.round(await getTargetPrice('LUCK', 0.92))}`
      }
    }),
    // More Elite User Alerts
    prisma.alert.create({
      data: {
        userId: users[2].id,
        symbol: 'ENGRO',
        alertType: AlertType.PRICE,
        condition: `> ${Math.round(await getTargetPrice('ENGRO', 1.15))}`
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[2].id,
        symbol: 'BAFL',
        alertType: AlertType.PRICE,
        condition: `< ${Math.round(await getTargetPrice('BAFL', 0.88))}`
      }
    }),
    // More Premium User Alerts
    prisma.alert.create({
      data: {
        userId: users[3].id,
        symbol: 'PSO',
        alertType: AlertType.PRICE,
        condition: `> ${Math.round(await getTargetPrice('PSO', 1.12))}`
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[3].id,
        symbol: 'TRG',
        alertType: AlertType.PRICE,
        condition: `> ${Math.round(await getTargetPrice('TRG', 1.2))}`
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[3].id,
        symbol: 'PPL',
        alertType: AlertType.PRICE,
        condition: `< ${Math.round(await getTargetPrice('PPL', 0.85))}`
      }
    })
  ]);

  console.log('✅ Created alerts');

  // ============================================
  // VERIFICATION: Calculate Overview Screen Metrics
  // ============================================
  console.log('\n🔍 Verifying Overview Screen Calculations...\n');

  // Helper function to get current price
  const getCurrentPrice = async (symbol: string): Promise<number> => {
    const latestData = await prisma.marketData.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' }
    });
    return latestData ? Number(latestData.close) : 0;
  };

  // Helper function to get previous close (LDCP)
  const getPreviousClose = async (symbol: string): Promise<number> => {
    const latestData = await prisma.marketData.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' }
    });
    return latestData && latestData.ldcp
      ? Number(latestData.ldcp)
      : latestData
        ? Number(latestData.close)
        : 0;
  };

  // Verify calculations for Pro User (has multiple portfolios)
  const proUser = users[1];
  const proUserPortfolios = await prisma.portfolio.findMany({
    where: { userId: proUser.id },
    include: { holdings: true }
  });

  let totalInvestmentAmount = 0;
  let totalTodaysReturn = 0;
  let totalAvailableCash = 0;
  let totalReturn = 0;

  console.log(`📊 Pro User (${proUser.email}) Overview:`);
  console.log('─'.repeat(70));

  for (const portfolio of proUserPortfolios) {
    console.log(`\n  Portfolio: "${portfolio.name}"`);

    let portfolioValue = 0;
    let portfolioTodaysReturn = 0;
    let portfolioTotalReturn = 0;

    for (const holding of portfolio.holdings) {
      const currentPrice = await getCurrentPrice(holding.symbol);
      const previousClose = await getPreviousClose(holding.symbol);
      const quantity = Number(holding.quantity);
      const avgBuyPrice = Number(holding.avgBuyPrice);

      const currentValue = currentPrice * quantity;
      const todaysChange = (currentPrice - previousClose) * quantity;
      const totalPnL = (currentPrice - avgBuyPrice) * quantity;

      portfolioValue += currentValue;
      portfolioTodaysReturn += todaysChange;
      portfolioTotalReturn += totalPnL;

      console.log(`    ${holding.symbol}: ${quantity} shares @ ${currentPrice.toFixed(2)} PKR`);
      console.log(`      Current Value: ${currentValue.toFixed(2)} PKR`);
      console.log(
        `      Today's Change: ${todaysChange >= 0 ? '+' : ''}${todaysChange.toFixed(2)} PKR`
      );
      console.log(
        `      Total P&L: ${totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)} PKR (${((totalPnL / (avgBuyPrice * quantity)) * 100).toFixed(2)}%)`
      );
    }

    totalInvestmentAmount += portfolioValue;
    totalTodaysReturn += portfolioTodaysReturn;
    totalAvailableCash += Number(portfolio.cashBalance);
    totalReturn += portfolioTotalReturn;

    console.log(`  Portfolio Total Value: ${portfolioValue.toFixed(2)} PKR`);
    console.log(`  Portfolio Cash: ${Number(portfolio.cashBalance).toFixed(2)} PKR`);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📈 OVERVIEW SCREEN CALCULATIONS (Pro User):');
  console.log('═'.repeat(70));
  console.log(`  a. Investment Amount:  ${totalInvestmentAmount.toFixed(2)} PKR`);
  console.log(`     (Sum of all holdings' current market value)`);
  console.log(
    `  b. Today's Return:     ${totalTodaysReturn >= 0 ? '+' : ''}${totalTodaysReturn.toFixed(2)} PKR`
  );
  console.log(`     (Based on current price vs. previous close)`);
  console.log(`  c. Available Cash:     ${totalAvailableCash.toFixed(2)} PKR`);
  console.log(`     (Sum of cash balance across all portfolios)`);
  console.log(
    `  d. Total Return:       ${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)} PKR`
  );
  console.log(`     (P&L: Current value - Purchase cost)`);
  const totalReturnPercent =
    totalInvestmentAmount > 0 ? (totalReturn / (totalInvestmentAmount - totalReturn)) * 100 : 0;
  console.log(`     (${totalReturnPercent >= 0 ? '+' : ''}${totalReturnPercent.toFixed(2)}%)`);
  console.log('═'.repeat(70));

  // Verify Premium User as well
  const premiumUser = users[3];
  const premiumUserPortfolios = await prisma.portfolio.findMany({
    where: { userId: premiumUser.id },
    include: { holdings: true }
  });

  let premiumInvestment = 0;
  let premiumTodaysReturn = 0;
  let premiumCash = 0;
  let premiumTotalReturn = 0;

  for (const portfolio of premiumUserPortfolios) {
    for (const holding of portfolio.holdings) {
      const currentPrice = await getCurrentPrice(holding.symbol);
      const previousClose = await getPreviousClose(holding.symbol);
      const quantity = Number(holding.quantity);
      const avgBuyPrice = Number(holding.avgBuyPrice);

      premiumInvestment += currentPrice * quantity;
      premiumTodaysReturn += (currentPrice - previousClose) * quantity;
      premiumTotalReturn += (currentPrice - avgBuyPrice) * quantity;
    }
    premiumCash += Number(portfolio.cashBalance);
  }

  console.log(`\n📈 OVERVIEW SCREEN CALCULATIONS (Premium User - ${premiumUser.email}):`);
  console.log('═'.repeat(70));
  console.log(`  a. Investment Amount:  ${premiumInvestment.toFixed(2)} PKR`);
  console.log(
    `  b. Today's Return:     ${premiumTodaysReturn >= 0 ? '+' : ''}${premiumTodaysReturn.toFixed(2)} PKR`
  );
  console.log(`  c. Available Cash:     ${premiumCash.toFixed(2)} PKR`);
  console.log(
    `  d. Total Return:       ${premiumTotalReturn >= 0 ? '+' : ''}${premiumTotalReturn.toFixed(2)} PKR`
  );
  const premiumReturnPercent =
    premiumInvestment > 0
      ? (premiumTotalReturn / (premiumInvestment - premiumTotalReturn)) * 100
      : 0;
  console.log(`     (${premiumReturnPercent >= 0 ? '+' : ''}${premiumReturnPercent.toFixed(2)}%)`);
  console.log('═'.repeat(70));

  console.log('\n✅ Overview calculations verified!');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📧 Test user credentials (all passwords: password123):');
  console.log('\nLite Plan:');
  console.log('  - Lite User: lite@example.com');
  console.log('  - Test Lite User 2: lite2@example.com');
  console.log('\nPro Plan:');
  console.log('  - Pro User: pro@example.com');
  console.log('  - Test Pro User 2: pro2@example.com');
  console.log('\nElite Plan (Alumni):');
  console.log('  - Elite User: elite@example.com');
  console.log('\nPremium Plan:');
  console.log('  - Premium User: premium@example.com');
  console.log('\nAdmin (Premium Plan):');
  console.log('  - Admin User: admin@example.com');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
