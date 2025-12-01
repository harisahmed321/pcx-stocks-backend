import { logger } from '../utils/logger.js';
import { prisma } from '../prisma/client.js';
import { MarketGateway } from '../sockets/marketGateway.js';

/**
 * Periodic alert checker job - runs independently to check all active alerts
 * This serves as a fallback mechanism to ensure alerts are triggered even if
 * market data updates are missed
 */
export class AlertCheckerJob {
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;
  private checkInterval: number = 60000; // Default 60 seconds
  private marketGateway?: MarketGateway;

  /**
   * Set the market gateway for broadcasting alerts
   */
  setMarketGateway(marketGateway: MarketGateway): void {
    this.marketGateway = marketGateway;
    logger.info('Market gateway set for alert checker job');
  }

  /**
   * Set custom check interval (in seconds)
   */
  setInterval(seconds: number): void {
    this.checkInterval = seconds * 1000;
    logger.info(`Alert check interval set to ${seconds} seconds`);

    // Restart with new interval if already running
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }

  /**
   * Start the background job
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Alert checker job is already running');
      return;
    }

    logger.info('Starting alert checker job');
    this.isRunning = true;

    const runCheck = async () => {
      try {
        await this.checkAllAlerts();
      } catch (error) {
        logger.error('Error in alert checker job', error);
      }
    };

    // Run immediately on startup
    runCheck();

    // Schedule periodic checks
    this.intervalId = setInterval(runCheck, this.checkInterval);
  }

  /**
   * Stop the background job
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.isRunning = false;
      logger.info('Alert checker job stopped');
    }
  }

  /**
   * Check all active alerts against current market data
   */
  private async checkAllAlerts(): Promise<void> {
    try {
      // Get all active, non-triggered alerts
      const alerts = await prisma.alert.findMany({
        where: {
          isActive: true,
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

      if (alerts.length === 0) {
        logger.debug('No active alerts to check');
        return;
      }

      logger.debug(`Checking ${alerts.length} active alerts`);

      // Group alerts by symbol for efficient market data lookup
      const alertsBySymbol = new Map<string, typeof alerts>();
      for (const alert of alerts) {
        const symbol = alert.symbol.toUpperCase();
        if (!alertsBySymbol.has(symbol)) {
          alertsBySymbol.set(symbol, []);
        }
        alertsBySymbol.get(symbol)!.push(alert);
      }

      // Get latest market data for all symbols with alerts
      const symbols = Array.from(alertsBySymbol.keys());
      const marketData = await prisma.marketData.findMany({
        where: {
          symbol: {
            in: symbols
          }
        },
        orderBy: {
          fetchedAt: 'desc'
        },
        distinct: ['symbol']
      });

      // Create a map for quick price lookup
      const priceMap = new Map<string, number>();
      for (const data of marketData) {
        const price = Number(data.askPrice || data.close || 0);
        if (price > 0) {
          priceMap.set(data.symbol, price);
        }
      }

      // Check each alert
      let triggeredCount = 0;
      for (const [symbol, symbolAlerts] of alertsBySymbol) {
        const currentPrice = priceMap.get(symbol);

        if (!currentPrice || currentPrice <= 0) {
          logger.debug(`No current price available for ${symbol}, skipping alert check`);
          continue;
        }

        for (const alert of symbolAlerts) {
          const shouldTrigger = this.evaluateCondition(alert.condition, currentPrice);

          if (shouldTrigger) {
            try {
              // Trigger the alert
              await prisma.alert.update({
                where: { id: alert.id },
                data: {
                  triggered: true,
                  triggeredAt: new Date(),
                  lastTriggeredAt: new Date(),
                  triggeredPrice: currentPrice,
                  triggerCount: { increment: 1 }
                }
              });

              triggeredCount++;
              logger.info(
                `🔔 Alert triggered for ${symbol} at price ${currentPrice} (Alert ID: ${alert.id})`
              );

              // Create notification
              await prisma.notification.create({
                data: {
                  userId: alert.user.id,
                  type: 'ALERT_TRIGGERED',
                  title: `Alert Triggered: ${symbol}`,
                  message: `Your alert for ${symbol} has been triggered. Condition: ${alert.condition}, Current price: ₨${currentPrice.toFixed(2)}`,
                  relatedId: alert.id,
                  relatedType: 'ALERT',
                  isRead: false
                }
              });

              // Broadcast to user via WebSocket if available
              if (this.marketGateway) {
                this.marketGateway
                  .getIO()
                  .of('/market')
                  .to(`user:${alert.user.id}`)
                  .emit('alert:trigger', {
                    alertId: alert.id,
                    userId: alert.user.id,
                    symbol,
                    condition: alert.condition,
                    currentPrice,
                    message: `Alert triggered for ${symbol}: Price ${currentPrice >= parseFloat(alert.condition.match(/\d+\.?\d*/)?.[0] || '0') ? 'reached' : 'dropped to'} ₨${currentPrice.toFixed(2)}`
                  });
              }

              // Reset if recurring
              if (alert.triggerType === 'RECURRING') {
                await prisma.alert.update({
                  where: { id: alert.id },
                  data: {
                    triggered: false
                  }
                });
                logger.info(`Reset recurring alert ${alert.id}`);
              }
            } catch (error) {
              logger.error(`Error triggering alert ${alert.id}:`, error);
            }
          }
        }
      }

      if (triggeredCount > 0) {
        logger.info(
          `✅ Alert check complete: ${triggeredCount} alert(s) triggered out of ${alerts.length} checked`
        );
      } else {
        logger.debug(`Alert check complete: No alerts triggered out of ${alerts.length} checked`);
      }
    } catch (error) {
      logger.error('Error checking all alerts:', error);
    }
  }

  /**
   * Evaluate if an alert condition is met
   */
  private evaluateCondition(condition: string, currentPrice: number): boolean {
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
      logger.error(`Error evaluating condition "${condition}":`, error);
      return false;
    }
  }
}
