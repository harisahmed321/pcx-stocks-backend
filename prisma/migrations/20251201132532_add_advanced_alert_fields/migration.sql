-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('BUY', 'SELL', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "LogicMode" AS ENUM ('ALL', 'ANY');

-- AlterEnum
ALTER TYPE "AlertType" ADD VALUE 'TECHNICAL';

-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "indicatorConfig" JSONB,
ADD COLUMN     "logicMode" "LogicMode" DEFAULT 'ANY',
ADD COLUMN     "name" TEXT,
ADD COLUMN     "signalType" "SignalType" DEFAULT 'NEUTRAL',
ADD COLUMN     "timeframe" TEXT DEFAULT 'daily';

-- CreateIndex
CREATE INDEX "Alert_signalType_idx" ON "Alert"("signalType");
