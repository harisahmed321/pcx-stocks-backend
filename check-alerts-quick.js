const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alerts = await prisma.alert.findMany({
    take: 5,
    include: {
      user: {
        select: { email: true }
      }
    }
  });
  
  console.log('Total alerts:', alerts.length);
  alerts.forEach(alert => {
    console.log(`- ${alert.symbol} ${alert.condition} (${alert.triggerType}) - User: ${alert.user.email}, Active: ${alert.isActive}`);
  });
  
  await prisma.$disconnect();
}

main().catch(console.error);
