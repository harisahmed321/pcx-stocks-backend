import { AlertType } from '@prisma/client';
export interface CreateAlertDto {
    symbol: string;
    alertType: AlertType;
    condition: string;
}
export declare class AlertsService {
    static createAlert(userId: string, data: CreateAlertDto): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        userId: string;
        alertType: import(".prisma/client").$Enums.AlertType;
        condition: string;
        triggered: boolean;
        triggeredAt: Date | null;
    }>;
    static getUserAlerts(userId: string, includeTriggered?: boolean): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        userId: string;
        alertType: import(".prisma/client").$Enums.AlertType;
        condition: string;
        triggered: boolean;
        triggeredAt: Date | null;
    }[]>;
    static getAlertById(userId: string, alertId: string): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        userId: string;
        alertType: import(".prisma/client").$Enums.AlertType;
        condition: string;
        triggered: boolean;
        triggeredAt: Date | null;
    }>;
    static deleteAlert(userId: string, alertId: string): Promise<{
        message: string;
    }>;
    static triggerAlert(alertId: string): Promise<{
        symbol: string;
        id: string;
        createdAt: Date;
        userId: string;
        alertType: import(".prisma/client").$Enums.AlertType;
        condition: string;
        triggered: boolean;
        triggeredAt: Date | null;
    }>;
    static checkAlerts(symbol: string, currentPrice: number): Promise<{
        alertId: string;
        userId: string;
        symbol: string;
        condition: string;
        currentPrice: number;
    }[]>;
    private static evaluateCondition;
}
//# sourceMappingURL=alerts.service.d.ts.map