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

  // Create Holdings for different users
  const holdings = await Promise.all([
    // Lite User Holdings
    prisma.holding.create({
      data: {
        portfolioId: litePortfolio.id,
        symbol: 'HBL',
        name: 'Habib Bank Limited',
        quantity: 50,
        avgBuyPrice: 85.5
      }
    }),
    // Pro User Holdings
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio1.id,
        symbol: 'PSO',
        name: 'Pakistan State Oil',
        quantity: 100,
        avgBuyPrice: 245.5
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio1.id,
        symbol: 'OGDC',
        name: 'Oil & Gas Development Company',
        quantity: 200,
        avgBuyPrice: 148.75
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio1.id,
        symbol: 'LUCK',
        name: 'Lucky Cement',
        quantity: 50,
        avgBuyPrice: 795.0
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio2.id,
        symbol: 'ENGRO',
        name: 'Engro Corporation',
        quantity: 150,
        avgBuyPrice: 295.5
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: proPortfolio3.id,
        symbol: 'PPL',
        name: 'Pakistan Petroleum Limited',
        quantity: 100,
        avgBuyPrice: 120.0
      }
    }),
    // Elite User Holdings
    prisma.holding.create({
      data: {
        portfolioId: elitePortfolio1.id,
        symbol: 'UBL',
        name: 'United Bank Limited',
        quantity: 200,
        avgBuyPrice: 180.0
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: elitePortfolio2.id,
        symbol: 'MCB',
        name: 'Muslim Commercial Bank',
        quantity: 150,
        avgBuyPrice: 195.0
      }
    }),
    // Premium User Holdings
    prisma.holding.create({
      data: {
        portfolioId: premiumPortfolio1.id,
        symbol: 'FCCL',
        name: 'Fauji Cement Company',
        quantity: 500,
        avgBuyPrice: 45.0
      }
    }),
    prisma.holding.create({
      data: {
        portfolioId: premiumPortfolio2.id,
        symbol: 'ATRL',
        name: 'Attock Refinery Limited',
        quantity: 300,
        avgBuyPrice: 350.0
      }
    })
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
        price: 245.5,
        fees: 500,
        date: new Date('2024-01-15'),
        notes: 'Initial investment'
      }
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
        notes: 'Added to portfolio'
      }
    }),
    prisma.transaction.create({
      data: {
        portfolioId: proPortfolio1.id,
        holdingId: holdings[2].id,
        type: TransactionType.BUY,
        symbol: 'LUCK',
        quantity: 50,
        price: 795.0,
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
    })
  ]);

  console.log('✅ Created watchlists');

  // Create Alerts for different users
  await Promise.all([
    // Pro User Alerts (within plan limit of 10)
    prisma.alert.create({
      data: {
        userId: users[1].id,
        symbol: 'PSO',
        alertType: AlertType.PRICE,
        condition: '> 260'
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[1].id,
        symbol: 'OGDC',
        alertType: AlertType.PRICE,
        condition: '< 140'
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[1].id,
        symbol: 'HBL',
        alertType: AlertType.PRICE,
        condition: '> 190'
      }
    }),
    // Lite User Alerts (within plan limit of 3)
    prisma.alert.create({
      data: {
        userId: users[0].id,
        symbol: 'HBL',
        alertType: AlertType.PRICE,
        condition: '> 90'
      }
    }),
    // Elite User Alerts (within plan limit of 10)
    prisma.alert.create({
      data: {
        userId: users[2].id,
        symbol: 'UBL',
        alertType: AlertType.PRICE,
        condition: '> 200'
      }
    }),
    // Premium User Alerts (within plan limit of 15)
    prisma.alert.create({
      data: {
        userId: users[3].id,
        symbol: 'FCCL',
        alertType: AlertType.PRICE,
        condition: '> 50'
      }
    }),
    prisma.alert.create({
      data: {
        userId: users[3].id,
        symbol: 'ATRL',
        alertType: AlertType.PRICE,
        condition: '< 340'
      }
    })
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

    marketDataPromises.push(
      prisma.marketData.create({
        data: {
          symbol: 'PSO',
          timestamp: date,
          open,
          high,
          low,
          close,
          volume: Math.floor(Math.random() * 1000000) + 500000
        }
      })
    );
  }

  await Promise.all(marketDataPromises);

  console.log('✅ Created historical market data');

  console.log('🎉 Seeding completed successfully!');
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
