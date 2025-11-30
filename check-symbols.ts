import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSymbols() {
  const symbols = [
    'PSO',
    'OGDC',
    'LUCK',
    'HBL',
    'PPL',
    'SYS',
    'UBL',
    'MCB',
    'FFC',
    'HUBC',
    'ENGRO',
    'BAFL',
    'TRG',
    'DGKC'
  ];

  console.log('Checking which symbols have market data:\n');

  for (const symbol of symbols) {
    const data = await prisma.marketData.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' }
    });

    if (data) {
      console.log(
        `✅ ${symbol}: ${Number(data.close).toFixed(2)} PKR (LDCP: ${data.ldcp ? Number(data.ldcp).toFixed(2) : 'N/A'})`
      );
    } else {
      console.log(`❌ ${symbol}: NO DATA`);
    }
  }

  await prisma.$disconnect();
}

checkSymbols();
