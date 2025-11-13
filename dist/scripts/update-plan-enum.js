import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Updating Plan enum...');
    // First, add new enum values
    await prisma.$executeRaw `ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'LITE'`;
    await prisma.$executeRaw `ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'ELITE'`;
    console.log('✅ Added new enum values');
    // Update users with FREE to LITE
    await prisma.$executeRaw `UPDATE "User" SET plan = 'LITE' WHERE plan::text = 'FREE'`;
    console.log('✅ Updated users');
    // Now remove FREE from enum (this requires recreating the enum)
    // We'll do this manually or let Prisma handle it
    console.log('✅ Migration complete. Run prisma db push to finalize enum changes.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=update-plan-enum.js.map