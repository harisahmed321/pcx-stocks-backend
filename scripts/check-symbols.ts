import { prisma } from '../src/prisma/client.js';

async function checkSymbols() {
  try {
    // Check total symbols
    const totalCount = await prisma.symbol.count();
    console.log('Total symbols in database:', totalCount);

    // Check for SYS symbol
    const sysSymbols = await prisma.symbol.findMany({
      where: {
        OR: [
          { symbol: { contains: 'SYS', mode: 'insensitive' } },
          { name: { contains: 'SYS', mode: 'insensitive' } }
        ]
      }
    });
    console.log('\nSymbols matching SYS:', sysSymbols.length);
    sysSymbols.forEach(s => console.log(`  - ${s.symbol}: ${s.name}, isDebt: ${s.isDebt}`));

    // Test the exact search query used in searchSymbols
    const searchResults = await prisma.symbol.findMany({
      where: {
        OR: [
          { symbol: { startsWith: 'SYS' } },
          { name: { contains: 'SYS', mode: 'insensitive' } }
        ],
        isDebt: false
      },
      take: 10
    });
    console.log('\nSearch results for SYS (exact query from API):', searchResults.length);
    searchResults.forEach(s => console.log(`  - ${s.symbol}: ${s.name}, isDebt: ${s.isDebt}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSymbols();
