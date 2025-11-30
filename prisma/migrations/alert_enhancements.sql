-- Migration to add new alert fields
-- Run this before: npx prisma migrate dev --name add_alert_enhancements

-- The migration will be generated automatically by Prisma
-- This file is for reference only

-- New fields added to Alert table:
-- isActive BOOLEAN DEFAULT true
-- triggerType TriggerType DEFAULT 'ONE_TIME'
-- triggerCount INT DEFAULT 0
-- lastTriggeredAt DATETIME
-- triggeredPrice DECIMAL(24,8)
-- updatedAt DATETIME

-- New AlertHistory table created with:
-- id STRING PRIMARY KEY
-- alertId STRING (FK to Alert.id)
-- triggeredAt DATETIME
-- price DECIMAL(24,8)
-- condition STRING
-- createdAt DATETIME

-- New TriggerType enum: ONE_TIME, RECURRING
