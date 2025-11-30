import { prisma } from '../../prisma/client.js';
import { AppError } from '../../utils/errorHandler.js';
import { AlertType } from '@prisma/client';

export interface CreateAlertDto {
  symbol: string;
  alertType: AlertType;
  condition: string;
  triggerType?: 'ONE_TIME' | 'RECURRING';
}

export interface UpdateAlertDto {
  condition?: string;
  triggerType?: 'ONE_TIME' | 'RECURRING';
}

export class AlertsService {
  static async createAlert(userId: string, data: CreateAlertDto) {
    const alert = await prisma.alert.create({
      data: {
        userId,
        symbol: data.symbol.toUpperCase(),
        alertType: data.alertType,
        condition: data.condition,
        triggerType: data.triggerType || 'ONE_TIME',
        isActive: true
      }
    });

    return alert;
  }

  static async getUserAlerts(userId: string, includeTriggered: boolean = false) {
    const where: any = { userId };

    if (!includeTriggered) {
      where.triggered = false;
    }

    const alerts = await prisma.alert.findMany({
      where,
      orderBy: [{ triggered: 'asc' }, { createdAt: 'desc' }]
    });

    return alerts;
  }

  static async getAlertById(userId: string, alertId: string) {
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

  static async deleteAlert(userId: string, alertId: string) {
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

  static async updateAlert(userId: string, alertId: string, data: UpdateAlertDto) {
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
        updatedAt: new Date()
      }
    });

    return updated;
  }

  static async toggleAlertActive(userId: string, alertId: string) {
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

  static async getAlertHistory(userId: string, alertId: string) {
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

  static async triggerAlert(alertId: string) {
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        triggered: true,
        triggeredAt: new Date()
      }
    });

    return alert;
  }

  static async checkAlerts(symbol: string, currentPrice: number) {
    // Get all non-triggered price alerts for this symbol
    const alerts = await prisma.alert.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        triggered: false,
        alertType: 'PRICE'
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
      const shouldTrigger = this.evaluateCondition(alert.condition, currentPrice);

      if (shouldTrigger) {
        await this.triggerAlert(alert.id);
        triggeredAlerts.push({
          alertId: alert.id,
          userId: alert.user.id,
          symbol: alert.symbol,
          condition: alert.condition,
          currentPrice
        });
      }
    }

    return triggeredAlerts;
  }

  private static evaluateCondition(condition: string, currentPrice: number): boolean {
    try {
      // Parse condition like "> 100" or "< 50" or ">= 75"
      const match = condition.match(/([><]=?)\s*(\d+\.?\d*)/);
      if (!match) return false;

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
    } catch (error) {
      return false;
    }
  }
}
