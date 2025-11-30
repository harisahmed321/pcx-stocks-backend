import { prisma } from '../src/prisma/client.js';

async function main() {
  console.log('🔍 Checking database...\n');

  const symbolCount = await prisma.symbol.count();
  const marketDataCount = await prisma.marketData.count();
  const alertCount = await prisma.alert.count();

  console.log(`📊 Database Status:`);
  console.log(`   Symbols: ${symbolCount}`);
  console.log(`   Market Data: ${marketDataCount}`);
  console.log(`   Alerts: ${alertCount}\n`);

  if (symbolCount === 0) {
    console.log('❌ No symbols found in database!');
    console.log('   Run: npm run seed or npx tsx prisma/seed.ts\n');
    return;
  }

  // Check specific symbols
  const testSymbols = ['SYS', 'OGDC', 'LUCK', 'HBL'];
  console.log('🔎 Checking test symbols:');

  for (const sym of testSymbols) {
    const symbol = await prisma.symbol.findUnique({
      where: { symbol: sym },
      select: { symbol: true, name: true }
    });

    const marketData = await prisma.marketData.findFirst({
      where: { symbol: sym },
      orderBy: { timestamp: 'desc' }
    });

    if (symbol) {
      console.log(`   ✅ ${sym} (${symbol.name}) - Market Data: ${marketData ? '✅' : '❌'}`);
    } else {
      console.log(`   ❌ ${sym} - Not found in database`);
    }
  }

  console.log('\n💡 To fetch market data, run:');
  console.log('   npm run fetch-market-data');
  console.log('   or check if market data fetcher job is running\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
