import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestAlerts() {
  console.log('🔔 Creating test alerts...');

  // Get test users
  const proUser = await prisma.user.findUnique({ where: { email: 'pro@example.com' } });
  const eliteUser = await prisma.user.findUnique({ where: { email: 'elite@example.com' } });
  const premiumUser = await prisma.user.findUnique({ where: { email: 'premium@example.com' } });

  if (!proUser || !eliteUser || !premiumUser) {
    console.error('❌ Test users not found. Please run the main seed first.');
    return;
  }

  // Symbols with market data
  const symbols = ['OGDC', 'LUCK', 'HBL', 'PPL', 'SYS', 'UBL', 'MCB', 'FFC', 'TRG'];

  const alerts = [
    // Pro User Alerts
    {
      userId: proUser.id,
      symbol: 'OGDC',
      alertType: 'PRICE',
      condition: '> 270',
      triggerType: 'ONE_TIME',
      isActive: true
    },
    {
      userId: proUser.id,
      symbol: 'LUCK',
      alertType: 'PRICE',
      condition: '< 440',
      triggerType: 'RECURRING',
      isActive: true
    },
    {
      userId: proUser.id,
      symbol: 'HBL',
      alertType: 'PRICE',
      condition: '> 310',
      triggerType: 'ONE_TIME',
      isActive: false // Inactive
    },
    {
      userId: proUser.id,
      symbol: 'PPL',
      alertType: 'PRICE',
      condition: '< 200',
      triggerType: 'RECURRING',
      isActive: true,
      triggerCount: 2,
      lastTriggeredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      triggeredPrice: 198.5
    },

    // Elite User Alerts
    {
      userId: eliteUser.id,
      symbol: 'SYS',
      alertType: 'PRICE',
      condition: '> 155',
      triggerType: 'ONE_TIME',
      isActive: true
    },
    {
      userId: eliteUser.id,
      symbol: 'UBL',
      alertType: 'PRICE',
      condition: '< 375',
      triggerType: 'RECURRING',
      isActive: true
    },
    {
      userId: eliteUser.id,
      symbol: 'MCB',
      alertType: 'PRICE',
      condition: '= 360',
      triggerType: 'ONE_TIME',
      isActive: false,
      triggerCount: 1,
      lastTriggeredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      triggeredPrice: 360.0
    },

    // Premium User Alerts
    {
      userId: premiumUser.id,
      symbol: 'FFC',
      alertType: 'PRICE',
      condition: '> 600',
      triggerType: 'ONE_TIME',
      isActive: true
    },
    {
      userId: premiumUser.id,
      symbol: 'TRG',
      alertType: 'PRICE',
      condition: '< 68',
      triggerType: 'RECURRING',
      isActive: true,
      triggerCount: 3,
      lastTriggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      triggeredPrice: 67.8
    },
    {
      userId: premiumUser.id,
      symbol: 'OGDC',
      alertType: 'PRICE',
      condition: '> 265',
      triggerType: 'RECURRING',
      isActive: true
    },
    {
      userId: premiumUser.id,
      symbol: 'LUCK',
      alertType: 'PRICE',
      condition: '< 450',
      triggerType: 'ONE_TIME',
      isActive: false
    }
  ];

  for (const alertData of alerts) {
    const alert = await prisma.alert.create({
      data: alertData
    });
    console.log(
      `✅ Created alert: ${alert.symbol} ${alert.condition} for user ${alert.userId.substring(0, 8)}...`
    );

    // Create history entries for triggered alerts
    if (alertData.triggerCount && alertData.triggerCount > 0) {
      const historyEntries = [];
      for (let i = 0; i < alertData.triggerCount; i++) {
        const daysAgo = (alertData.triggerCount - i) * 2; // Spread triggers over time
        historyEntries.push({
          alertId: alert.id,
          triggeredAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          price: Number(alertData.triggeredPrice) + (Math.random() - 0.5) * 5,
          condition: alert.condition
        });
      }

      await prisma.alertHistory.createMany({
        data: historyEntries
      });
      console.log(`  📊 Created ${alertData.triggerCount} history entries`);
    }
  }

  console.log('\n✨ Test alerts created successfully!');
  console.log('\nTest Users:');
  console.log('  Pro User (pro@example.com): 4 alerts');
  console.log('  Elite User (elite@example.com): 3 alerts');
  console.log('  Premium User (premium@example.com): 4 alerts');
}

createTestAlerts()
  .catch((e) => {
    console.error('❌ Error creating test alerts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
