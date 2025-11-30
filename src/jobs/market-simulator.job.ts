import { MarketService } from '../modules/market/market.service.js';
import { MarketGateway } from '../sockets/marketGateway.js';
import { logger } from '../utils/logger.js';

export class MarketSimulatorJob {
  private intervalId: NodeJS.Timeout | null = null;
  private marketGateway: MarketGateway;
  private updateInterval: number;
  private symbolsCache: string[] = [];
  private priceHistory: Map<string, number[]> = new Map();
  private readonly HISTORY_SIZE = 10; // Keep last 10 prices for trend calculation

  constructor(marketGateway: MarketGateway, updateIntervalMs: number = 3000) {
    this.marketGateway = marketGateway;
    this.updateInterval = updateIntervalMs;
  }

  async start() {
    if (this.intervalId) {
      logger.warn('Market simulator is already running');
      return;
    }

    // Load all symbols
    try {
      this.symbolsCache = await MarketService.getAllSymbolsForUpdates();
      logger.info(`Market simulator loaded ${this.symbolsCache.length} symbols`);
    } catch (error) {
      logger.error('Failed to load symbols for market simulator', error);
      return;
    }

    // Start the update loop
    this.intervalId = setInterval(() => {
      this.generateAndBroadcastUpdates();
    }, this.updateInterval);

    logger.info(`Market simulator started with ${this.updateInterval}ms interval`);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Market simulator stopped');
    }
  }

  private async generateAndBroadcastUpdates() {
    // DEPRECATED: This job is disabled and uses mock data
    // Use MarketDataFetcherJob instead for real PSX data
    logger.warn('MarketSimulatorJob is disabled - use MarketDataFetcherJob instead');
    /*
    try {
      // Generate updates for a random subset of symbols (to simulate real market behavior)
      // In a real scenario, you'd update all symbols, but for performance we'll update 20-50 at a time
      const numToUpdate = Math.min(
        Math.floor(Math.random() * 30) + 20, // Random between 20-50
        this.symbolsCache.length
      );

      const symbolsToUpdate = this.getRandomSymbols(numToUpdate);

      for (const symbol of symbolsToUpdate) {
        const priceData = MarketService.generateMockPrice(symbol);
        
        // Apply trend-based variation for more realistic price movements
        const trendAdjustedPrice = this.applyTrendAdjustment(symbol, priceData.price);
        const change = trendAdjustedPrice - (this.getLastPrice(symbol) || priceData.price);
        const changePercent = (change / (this.getLastPrice(symbol) || priceData.price)) * 100;

        // Update price history
        this.updatePriceHistory(symbol, trendAdjustedPrice);

        // Broadcast the update
        this.marketGateway.broadcastPriceUpdate(
          symbol,
          parseFloat(trendAdjustedPrice.toFixed(2)),
          parseFloat(change.toFixed(2)),
          parseFloat(changePercent.toFixed(2))
        );
      }
    } catch (error) {
      logger.error('Error generating market updates', error);
    }
    */
  }

  private getRandomSymbols(count: number): string[] {
    const shuffled = [...this.symbolsCache].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private applyTrendAdjustment(symbol: string, basePrice: number): number {
    const history = this.priceHistory.get(symbol) || [];

    if (history.length === 0) {
      return basePrice;
    }

    const lastPrice = history[history.length - 1];

    // Calculate trend from recent history
    let trend = 0;
    if (history.length >= 3) {
      const recentPrices = history.slice(-3);
      trend = (recentPrices[2] - recentPrices[0]) / recentPrices[0];
    }

    // Apply small random variation with trend bias (-0.5% to +0.5% base, plus trend)
    const randomVariation = (Math.random() - 0.5) * 0.01; // -0.5% to +0.5%
    const trendBias = trend * 0.3; // 30% of the trend continues
    const totalVariation = randomVariation + trendBias;

    // Limit maximum change to 2% per update
    const limitedVariation = Math.max(-0.02, Math.min(0.02, totalVariation));

    return lastPrice * (1 + limitedVariation);
  }

  private updatePriceHistory(symbol: string, price: number) {
    const history = this.priceHistory.get(symbol) || [];
    history.push(price);

    // Keep only recent history
    if (history.length > this.HISTORY_SIZE) {
      history.shift();
    }

    this.priceHistory.set(symbol, history);
  }

  private getLastPrice(symbol: string): number | null {
    const history = this.priceHistory.get(symbol);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  // Method to reload symbols (useful if new symbols are added)
  async reloadSymbols() {
    try {
      this.symbolsCache = await MarketService.getAllSymbolsForUpdates();
      logger.info(`Market simulator reloaded ${this.symbolsCache.length} symbols`);
    } catch (error) {
      logger.error('Failed to reload symbols for market simulator', error);
    }
  }
}
