import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';
import { AlertType, SignalType, LogicMode } from '@prisma/client';
import { alertEvaluationService } from '../../services/alertEvaluation.service.js';
export class AlertsService {
    static async createAlert(userId, data) {
        const alert = await prisma.alert.create({
            data: {
                userId,
                symbol: data.symbol.toUpperCase(),
                alertType: data.alertType,
                condition: data.condition,
                triggerType: data.triggerType || 'ONE_TIME',
                isActive: true,
                name: data.name,
                signalType: data.signalType || SignalType.NEUTRAL,
                logicMode: data.logicMode || LogicMode.ANY,
                indicatorConfig: (data.indicatorConfig || undefined),
                timeframe: data.timeframe || 'daily',
                // Dual signal support
                enableBuySignal: data.enableBuySignal,
                enableSellSignal: data.enableSellSignal,
                buyIndicatorConfig: (data.buyIndicatorConfig || undefined),
                sellIndicatorConfig: (data.sellIndicatorConfig || undefined),
                buyLogicMode: data.buyLogicMode,
                sellLogicMode: data.sellLogicMode
            }
        });
        return alert;
    }
    static async getUserAlerts(userId, includeTriggered = false) {
        const where = { userId };
        if (!includeTriggered) {
            where.triggered = false;
        }
        const alerts = await prisma.alert.findMany({
            where,
            orderBy: [{ triggered: 'asc' }, { createdAt: 'desc' }]
        });
        return alerts;
    }
    static async getAlertById(userId, alertId) {
        const alert = await prisma.alert.findFirst({
            where: {
                id: alertId,
                userId
            },
            include: {
                history: {
                    orderBy: {
                        triggeredAt: 'desc'
                    },
                    take: 10 // Last 10 triggers
                }
            }
        });
        if (!alert) {
            throw new AppError('Alert not found', 404);
        }
        return alert;
    }
    static async deleteAlert(userId, alertId) {
        const alert = await prisma.alert.findFirst({
            where: { id: alertId, userId }
        });
        if (!alert) {
            throw new AppError('Alert not found', 404);
        }
        await prisma.alert.delete({
            where: { id: alertId }
        });
        return { message: 'Alert deleted successfully' };
    }
    static async updateAlert(userId, alertId, data) {
        const alert = await prisma.alert.findFirst({
            where: { id: alertId, userId }
        });
        if (!alert) {
            throw new AppError('Alert not found', 404);
        }
        const updated = await prisma.alert.update({
            where: { id: alertId },
            data: {
                ...(data.condition && { condition: data.condition }),
                ...(data.triggerType && { triggerType: data.triggerType }),
                ...(data.name && { name: data.name }),
                ...(data.signalType && { signalType: data.signalType }),
                ...(data.logicMode && { logicMode: data.logicMode }),
                ...(data.indicatorConfig !== undefined && { indicatorConfig: data.indicatorConfig }),
                ...(data.timeframe && { timeframe: data.timeframe }),
                // Dual signal support
                ...(data.enableBuySignal !== undefined && { enableBuySignal: data.enableBuySignal }),
                ...(data.enableSellSignal !== undefined && { enableSellSignal: data.enableSellSignal }),
                ...(data.buyIndicatorConfig !== undefined && {
                    buyIndicatorConfig: data.buyIndicatorConfig
                }),
                ...(data.sellIndicatorConfig !== undefined && {
                    sellIndicatorConfig: data.sellIndicatorConfig
                }),
                ...(data.buyLogicMode && { buyLogicMode: data.buyLogicMode }),
                ...(data.sellLogicMode && { sellLogicMode: data.sellLogicMode }),
                updatedAt: new Date()
            }
        });
        return updated;
    }
    static async toggleAlertActive(userId, alertId) {
        const alert = await prisma.alert.findFirst({
            where: { id: alertId, userId }
        });
        if (!alert) {
            throw new AppError('Alert not found', 404);
        }
        const updated = await prisma.alert.update({
            where: { id: alertId },
            data: {
                isActive: !alert.isActive,
                updatedAt: new Date()
            }
        });
        return updated;
    }
    static async getAlertHistory(userId, alertId) {
        const alert = await prisma.alert.findFirst({
            where: { id: alertId, userId }
        });
        if (!alert) {
            throw new AppError('Alert not found', 404);
        }
        const history = await prisma.alertHistory.findMany({
            where: { alertId },
            orderBy: { triggeredAt: 'desc' }
        });
        return history;
    }
    static async triggerAlert(alertId, currentPrice) {
        const alert = await prisma.alert.findUnique({
            where: { id: alertId }
        });
        if (!alert) {
            throw new AppError('Alert not found', 404);
        }
        // Update alert with trigger information
        const updated = await prisma.alert.update({
            where: { id: alertId },
            data: {
                triggered: true,
                triggeredAt: new Date(),
                lastTriggeredAt: new Date(),
                triggeredPrice: currentPrice || alert.triggeredPrice,
                triggerCount: { increment: 1 }
            }
        });
        // If recurring, reset the triggered status after a short delay
        if (alert.triggerType === 'RECURRING') {
            // Reset immediately for recurring alerts so they can trigger again
            await prisma.alert.update({
                where: { id: alertId },
                data: {
                    triggered: false
                }
            });
        }
        return updated;
    }
    static async checkAlerts(symbol, currentPrice) {
        // Get all active, non-triggered alerts for this symbol
        const alerts = await prisma.alert.findMany({
            where: {
                symbol: symbol.toUpperCase(),
                triggered: false,
                isActive: true
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true
                    }
                }
            }
        });
        const triggeredAlerts = [];
        for (const alert of alerts) {
            let shouldTrigger = false;
            let signalType = null;
            let message = '';
            // Check if alert has indicator configuration (advanced alert)
            if (alert.indicatorConfig && alert.alertType === AlertType.TECHNICAL) {
                // Prepare indicators for evaluation
                const { currentIndicators, prevIndicators } = await alertEvaluationService.prepareIndicatorsForAlert(alert, currentPrice);
                // Evaluate advanced alert
                const result = await alertEvaluationService.checkAlert(alert, currentPrice, currentIndicators, prevIndicators);
                shouldTrigger = result.triggered;
                signalType = result.signalType;
                message = result.message || '';
            }
            else {
                // Legacy simple price alert
                shouldTrigger = this.evaluateCondition(alert.condition, currentPrice);
                signalType = alert.signalType;
            }
            if (shouldTrigger) {
                await this.triggerAlert(alert.id, currentPrice);
                // Create alert history entry
                await prisma.alertHistory.create({
                    data: {
                        alertId: alert.id,
                        price: currentPrice,
                        condition: message || alert.condition,
                        triggeredAt: new Date()
                    }
                });
                triggeredAlerts.push({
                    alertId: alert.id,
                    userId: alert.user.id,
                    symbol: alert.symbol,
                    condition: alert.condition,
                    currentPrice,
                    triggerType: alert.triggerType,
                    signalType,
                    message,
                    name: alert.name
                });
            }
        }
        return triggeredAlerts;
    }
    static evaluateCondition(condition, currentPrice) {
        try {
            // Parse condition like "> 100" or "< 50" or ">= 75"
            const match = condition.match(/([><]=?)\s*(\d+\.?\d*)/);
            if (!match)
                return false;
            const operator = match[1];
            const targetPrice = parseFloat(match[2]);
            switch (operator) {
                case '>':
                    return currentPrice > targetPrice;
                case '>=':
                    return currentPrice >= targetPrice;
                case '<':
                    return currentPrice < targetPrice;
                case '<=':
                    return currentPrice <= targetPrice;
                default:
                    return false;
            }
        }
        catch (error) {
            return false;
        }
    }
}
//# sourceMappingURL=alerts.service.js.map