-- Add dual BUY/SELL signal support to Alert table
ALTER TABLE "Alert" 
  ADD COLUMN IF NOT EXISTS "enableBuySignal" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "enableSellSignal" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "buyIndicatorConfig" JSONB,
  ADD COLUMN IF NOT EXISTS "sellIndicatorConfig" JSONB,
  ADD COLUMN IF NOT EXISTS "buyLogicMode" TEXT DEFAULT 'ANY',
  ADD COLUMN IF NOT EXISTS "sellLogicMode" TEXT DEFAULT 'ANY';

-- Update existing alerts to maintain backward compatibility
UPDATE "Alert" 
SET "enableBuySignal" = CASE 
    WHEN "signalType" = 'BUY' THEN true
    ELSE false
  END,
  "enableSellSignal" = CASE 
    WHEN "signalType" = 'SELL' THEN true
    ELSE false
  END,
  "buyIndicatorConfig" = CASE 
    WHEN "signalType" = 'BUY' THEN "indicatorConfig"
    ELSE NULL
  END,
  "sellIndicatorConfig" = CASE 
    WHEN "signalType" = 'SELL' THEN "indicatorConfig"
    ELSE NULL
  END,
  "buyLogicMode" = CASE 
    WHEN "signalType" = 'BUY' THEN COALESCE("logicMode", 'ANY')
    ELSE 'ANY'
  END,
  "sellLogicMode" = CASE 
    WHEN "signalType" = 'SELL' THEN COALESCE("logicMode", 'ANY')
    ELSE 'ANY'
  END
WHERE "indicatorConfig" IS NOT NULL;

COMMENT ON COLUMN "Alert"."enableBuySignal" IS 'Enable BUY signal detection';
COMMENT ON COLUMN "Alert"."enableSellSignal" IS 'Enable SELL signal detection';
COMMENT ON COLUMN "Alert"."buyIndicatorConfig" IS 'Separate indicator configuration for BUY signals';
COMMENT ON COLUMN "Alert"."sellIndicatorConfig" IS 'Separate indicator configuration for SELL signals';
COMMENT ON COLUMN "Alert"."buyLogicMode" IS 'Logic mode (ALL/ANY) for BUY signal indicators';
COMMENT ON COLUMN "Alert"."sellLogicMode" IS 'Logic mode (ALL/ANY) for SELL signal indicators';
