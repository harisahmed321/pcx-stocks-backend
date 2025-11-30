import { prisma } from '../src/prisma/client.js';

async function checkDatabase() {
  try {
    const symbolCount = await prisma.symbol.count();
    console.log('📊 Total Symbols:', symbolCount);

    const symbols = await prisma.symbol.findMany({
      take: 10,
      select: { symbol: true, name: true }
    });
    console.log('Sample symbols:', symbols);

    const alertCount = await prisma.alert.count();
    console.log('\n🔔 Total Alerts:', alertCount);

    const alerts = await prisma.alert.findMany({
      take: 5,
      include: { user: { select: { email: true } } }
    });
    console.log('Sample alerts:', JSON.stringify(alerts, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
