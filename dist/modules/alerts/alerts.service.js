import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';
export class AlertsService {
    static async createAlert(userId, data) {
        const alert = await prisma.alert.create({
            data: {
                userId,
                symbol: data.symbol.toUpperCase(),
                alertType: data.alertType,
                condition: data.condition,
            },
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
            orderBy: [{ triggered: 'asc' }, { createdAt: 'desc' }],
        });
        return alerts;
    }
    static async getAlertById(userId, alertId) {
        const alert = await prisma.alert.findFirst({
            where: {
                id: alertId,
                userId,
            },
        });
        if (!alert) {
            throw new AppError('Alert not found', 404);
        }
        return alert;
    }
    static async deleteAlert(userId, alertId) {
        const alert = await prisma.alert.findFirst({
            where: { id: alertId, userId },
        });
        if (!alert) {
            throw new AppError('Alert not found', 404);
        }
        await prisma.alert.delete({
            where: { id: alertId },
        });
        return { message: 'Alert deleted successfully' };
    }
    static async triggerAlert(alertId) {
        const alert = await prisma.alert.update({
            where: { id: alertId },
            data: {
                triggered: true,
                triggeredAt: new Date(),
            },
        });
        return alert;
    }
    static async checkAlerts(symbol, currentPrice) {
        // Get all non-triggered price alerts for this symbol
        const alerts = await prisma.alert.findMany({
            where: {
                symbol: symbol.toUpperCase(),
                triggered: false,
                alertType: 'PRICE',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
        });
        const triggeredAlerts = [];
        for (const alert of alerts) {
            const shouldTrigger = this.evaluateCondition(alert.condition, currentPrice);
            if (shouldTrigger) {
                await this.triggerAlert(alert.id);
                triggeredAlerts.push({
                    alertId: alert.id,
                    userId: alert.user.id,
                    symbol: alert.symbol,
                    condition: alert.condition,
                    currentPrice,
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