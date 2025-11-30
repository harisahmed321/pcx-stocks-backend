import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Database Cleanup Script
 *
 * This script removes all test data while preserving:
 * - User accounts
 * - Symbols (PSX symbols)
 * - MarketData (real PSX market data)
 * - Subscriptions and Plans
 *
 * What gets deleted:
 * - All portfolios (cascades to holdings and transactions)
 * - All watchlists (cascades to watchlist items)
 * - All alerts
 * - All corporate actions
 */
async function cleanupTestData() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Delete all alerts
    const deletedAlerts = await prisma.alert.deleteMany({});
    console.log(`✅ Deleted ${deletedAlerts.count} alerts`);

    // Delete all watchlist items (will be deleted via cascade, but doing explicitly for clarity)
    const deletedWatchlistItems = await prisma.watchlistItem.deleteMany({});
    console.log(`✅ Deleted ${deletedWatchlistItems.count} watchlist items`);

    // Delete all watchlists
    const deletedWatchlists = await prisma.watchlist.deleteMany({});
    console.log(`✅ Deleted ${deletedWatchlists.count} watchlists`);

    // Delete all transactions (will cascade from portfolios, but being explicit)
    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`✅ Deleted ${deletedTransactions.count} transactions`);

    // Delete all holdings (will cascade from portfolios, but being explicit)
    const deletedHoldings = await prisma.holding.deleteMany({});
    console.log(`✅ Deleted ${deletedHoldings.count} holdings`);

    // Delete all portfolios
    const deletedPortfolios = await prisma.portfolio.deleteMany({});
    console.log(`✅ Deleted ${deletedPortfolios.count} portfolios`);

    // Delete all corporate actions
    const deletedCorporateActions = await prisma.corporateAction.deleteMany({});
    console.log(`✅ Deleted ${deletedCorporateActions.count} corporate actions`);

    console.log('\n✨ Database cleanup completed successfully!');
    console.log('\n📊 Preserved data:');

    // Count preserved data
    const userCount = await prisma.user.count();
    const symbolCount = await prisma.symbol.count();
    const marketDataCount = await prisma.marketData.count();
    const subscriptionPlanCount = await prisma.subscriptionPlan.count();

    console.log(`   - ${userCount} users`);
    console.log(`   - ${symbolCount} symbols`);
    console.log(`   - ${marketDataCount} market data records`);
    console.log(`   - ${subscriptionPlanCount} subscription plans`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestData()
  .then(() => {
    console.log('\n✅ Cleanup script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup script failed:', error);
    process.exit(1);
  });
