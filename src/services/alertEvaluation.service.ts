import {
  technicalIndicatorsService,
  IndicatorConfig,
  ComputedIndicators
} from './technicalIndicators.service';
import { Alert, SignalType, LogicMode } from '@prisma/client';

export interface AlertCheckResult {
  triggered: boolean;
  signalType: SignalType | null;
  message?: string;
  currentPrice?: number;
  indicators?: ComputedIndicators;
}

export class AlertEvaluationService {
  /**
   * Check if alert conditions are met
   */
  async checkAlert(
    alert: Alert & { indicatorConfig?: any },
    currentPrice: number,
    currentIndicators: ComputedIndicators,
    prevIndicators: ComputedIndicators | null
  ): Promise<AlertCheckResult> {
    const conditionsMet: boolean[] = [];
    let signalType: SignalType | null = alert.signalType || SignalType.NEUTRAL;
    const messages: string[] = [];

    try {
      // 1. Price Condition Check
      const priceCondition = this.checkPriceCondition(alert, currentPrice);
      if (priceCondition.met) {
        conditionsMet.push(true);
        if (priceCondition.message) messages.push(priceCondition.message);
        if (priceCondition.signal) signalType = priceCondition.signal;
      } else if (priceCondition.checked) {
        conditionsMet.push(false);
      }

      // 2. Indicator-based Conditions Check
      const indicatorConfig = alert.indicatorConfig as IndicatorConfig | null;

      if (indicatorConfig) {
        // RSI Check
        if (indicatorConfig.rsi?.enabled) {
          const rsiResult = this.checkRSICondition(indicatorConfig.rsi, currentIndicators);
          conditionsMet.push(rsiResult.met);
          if (rsiResult.message) messages.push(rsiResult.message);
          if (rsiResult.signal) signalType = rsiResult.signal;
        }

        // MACD Crossover Check
        if (indicatorConfig.macd?.enabled && prevIndicators) {
          const macdResult = this.checkMACDCrossover(
            indicatorConfig.macd,
            currentIndicators,
            prevIndicators
          );
          conditionsMet.push(macdResult.met);
          if (macdResult.message) messages.push(macdResult.message);
          if (macdResult.signal) signalType = macdResult.signal;
        }

        // EMA Crossover Check
        if (indicatorConfig.ema?.enabled && prevIndicators) {
          const emaResult = this.checkEMACrossover(
            indicatorConfig.ema,
            currentIndicators,
            prevIndicators
          );
          conditionsMet.push(emaResult.met);
          if (emaResult.message) messages.push(emaResult.message);
          if (emaResult.signal) signalType = emaResult.signal;
        }

        // Bollinger Bands Check
        if (indicatorConfig.bollinger?.enabled) {
          const bbResult = this.checkBollingerBands(
            indicatorConfig.bollinger,
            currentPrice,
            currentIndicators
          );
          conditionsMet.push(bbResult.met);
          if (bbResult.message) messages.push(bbResult.message);
          if (bbResult.signal) signalType = bbResult.signal;
        }

        // Volume Confirmation Check
        if (indicatorConfig.volume?.enabled) {
          const volumeResult = this.checkVolumeConfirmation(
            indicatorConfig.volume,
            currentIndicators
          );
          conditionsMet.push(volumeResult.met);
          if (volumeResult.message) messages.push(volumeResult.message);
        }
      }

      // 3. Evaluate Logic Mode (ALL vs ANY)
      if (conditionsMet.length === 0) {
        return { triggered: false, signalType: null };
      }

      const logicMode = alert.logicMode || LogicMode.ANY;
      const triggered =
        logicMode === LogicMode.ALL
          ? conditionsMet.every((c) => c === true)
          : conditionsMet.some((c) => c === true);

      return {
        triggered,
        signalType: triggered ? signalType : null,
        message: messages.join('; '),
        currentPrice,
        indicators: currentIndicators
      };
    } catch (error) {
      console.error('Error checking alert:', error);
      return { triggered: false, signalType: null };
    }
  }

  /**
   * Check simple price condition (>, <, =)
   */
  private checkPriceCondition(
    alert: Alert,
    currentPrice: number
  ): { met: boolean; checked: boolean; message?: string; signal?: SignalType } {
    const condition = alert.condition;

    // Parse condition like "> 100" or "< 50"
    const match = condition.match(/([><]=?|==?)\s*(\d+\.?\d*)/);
    if (!match) {
      return { met: false, checked: false };
    }

    const operator = match[1];
    const targetValue = parseFloat(match[2]);

    let met = false;
    let signal: SignalType | undefined;

    switch (operator) {
      case '>':
      case '>=':
        met = operator === '>' ? currentPrice > targetValue : currentPrice >= targetValue;
        signal = met && alert.signalType === SignalType.BUY ? SignalType.BUY : undefined;
        break;
      case '<':
      case '<=':
        met = operator === '<' ? currentPrice < targetValue : currentPrice <= targetValue;
        signal = met && alert.signalType === SignalType.SELL ? SignalType.SELL : undefined;
        break;
      case '==':
      case '=':
        met = Math.abs(currentPrice - targetValue) < 0.01;
        break;
    }

    return {
      met,
      checked: true,
      message: met ? `Price ${condition}` : undefined,
      signal
    };
  }

  /**
   * Check RSI overbought/oversold conditions
   */
  private checkRSICondition(
    config: NonNullable<IndicatorConfig['rsi']>,
    indicators: ComputedIndicators
  ): { met: boolean; message?: string; signal?: SignalType } {
    if (!indicators.rsi) {
      return { met: false };
    }

    const rsi = indicators.rsi;
    let met = false;
    let signal: SignalType | undefined;
    let message: string | undefined;

    switch (config.triggerType) {
      case 'oversold':
        met = rsi <= config.oversold;
        if (met) {
          signal = SignalType.BUY;
          message = `RSI oversold (${rsi.toFixed(2)} <= ${config.oversold})`;
        }
        break;
      case 'overbought':
        met = rsi >= config.overbought;
        if (met) {
          signal = SignalType.SELL;
          message = `RSI overbought (${rsi.toFixed(2)} >= ${config.overbought})`;
        }
        break;
      case 'both':
        met = rsi <= config.oversold || rsi >= config.overbought;
        if (rsi <= config.oversold) {
          signal = SignalType.BUY;
          message = `RSI oversold (${rsi.toFixed(2)})`;
        } else if (rsi >= config.overbought) {
          signal = SignalType.SELL;
          message = `RSI overbought (${rsi.toFixed(2)})`;
        }
        break;
    }

    return { met, message, signal };
  }

  /**
   * Check MACD bullish/bearish crossover
   */
  private checkMACDCrossover(
    config: NonNullable<IndicatorConfig['macd']>,
    currentIndicators: ComputedIndicators,
    prevIndicators: ComputedIndicators
  ): { met: boolean; message?: string; signal?: SignalType } {
    if (!currentIndicators.macd || !prevIndicators.macd) {
      return { met: false };
    }

    const currMacd = currentIndicators.macd;
    const prevMacd = prevIndicators.macd;

    const bullishCross = prevMacd.MACD <= prevMacd.signal && currMacd.MACD > currMacd.signal;
    const bearishCross = prevMacd.MACD >= prevMacd.signal && currMacd.MACD < currMacd.signal;

    let met = false;
    let signal: SignalType | undefined;
    let message: string | undefined;

    switch (config.triggerType) {
      case 'bullish':
        met = bullishCross;
        if (met) {
          signal = SignalType.BUY;
          message = 'MACD bullish crossover';
        }
        break;
      case 'bearish':
        met = bearishCross;
        if (met) {
          signal = SignalType.SELL;
          message = 'MACD bearish crossover';
        }
        break;
      case 'any':
        met = bullishCross || bearishCross;
        if (bullishCross) {
          signal = SignalType.BUY;
          message = 'MACD bullish crossover';
        } else if (bearishCross) {
          signal = SignalType.SELL;
          message = 'MACD bearish crossover';
        }
        break;
    }

    return { met, message, signal };
  }

  /**
   * Check EMA golden/death cross
   */
  private checkEMACrossover(
    config: NonNullable<IndicatorConfig['ema']>,
    currentIndicators: ComputedIndicators,
    prevIndicators: ComputedIndicators
  ): { met: boolean; message?: string; signal?: SignalType } {
    if (
      !currentIndicators.emaShort ||
      !currentIndicators.emaLong ||
      !prevIndicators.emaShort ||
      !prevIndicators.emaLong
    ) {
      return { met: false };
    }

    const currShort = currentIndicators.emaShort;
    const currLong = currentIndicators.emaLong;
    const prevShort = prevIndicators.emaShort;
    const prevLong = prevIndicators.emaLong;

    const bullishCross = prevShort <= prevLong && currShort > currLong;
    const bearishCross = prevShort >= prevLong && currShort < currLong;

    let met = false;
    let signal: SignalType | undefined;
    let message: string | undefined;

    switch (config.crossoverType) {
      case 'bullish':
        met = bullishCross;
        if (met) {
          signal = SignalType.BUY;
          message = `EMA Golden Cross (${config.short}/${config.long})`;
        }
        break;
      case 'bearish':
        met = bearishCross;
        if (met) {
          signal = SignalType.SELL;
          message = `EMA Death Cross (${config.short}/${config.long})`;
        }
        break;
      case 'any':
        met = bullishCross || bearishCross;
        if (bullishCross) {
          signal = SignalType.BUY;
          message = `EMA Golden Cross (${config.short}/${config.long})`;
        } else if (bearishCross) {
          signal = SignalType.SELL;
          message = `EMA Death Cross (${config.short}/${config.long})`;
        }
        break;
    }

    return { met, message, signal };
  }

  /**
   * Check Bollinger Bands breakout/breakdown
   */
  private checkBollingerBands(
    config: NonNullable<IndicatorConfig['bollinger']>,
    currentPrice: number,
    indicators: ComputedIndicators
  ): { met: boolean; message?: string; signal?: SignalType } {
    if (!indicators.bollinger) {
      return { met: false };
    }

    const { upper, middle, lower } = indicators.bollinger;
    const aboveUpper = currentPrice > upper;
    const belowLower = currentPrice < lower;

    let met = false;
    let signal: SignalType | undefined;
    let message: string | undefined;

    switch (config.triggerType) {
      case 'upper':
        met = aboveUpper;
        if (met) {
          signal = SignalType.BUY;
          message = `Price above Bollinger upper band (${currentPrice.toFixed(2)} > ${upper.toFixed(2)})`;
        }
        break;
      case 'lower':
        met = belowLower;
        if (met) {
          signal = SignalType.SELL;
          message = `Price below Bollinger lower band (${currentPrice.toFixed(2)} < ${lower.toFixed(2)})`;
        }
        break;
      case 'both':
        met = aboveUpper || belowLower;
        if (aboveUpper) {
          signal = SignalType.BUY;
          message = `Price above Bollinger upper band`;
        } else if (belowLower) {
          signal = SignalType.SELL;
          message = `Price below Bollinger lower band`;
        }
        break;
    }

    return { met, message, signal };
  }

  /**
   * Check volume confirmation
   */
  private checkVolumeConfirmation(
    config: NonNullable<IndicatorConfig['volume']>,
    indicators: ComputedIndicators
  ): { met: boolean; message?: string } {
    if (!indicators.avgVolume || !indicators.currentVolume) {
      return { met: false };
    }

    const volumeThreshold = indicators.avgVolume * config.multiplier;
    const met = indicators.currentVolume > volumeThreshold;

    return {
      met,
      message: met
        ? `Volume spike (${indicators.currentVolume.toFixed(0)} > ${volumeThreshold.toFixed(0)})`
        : undefined
    };
  }

  /**
   * Fetch and compute indicators for alert evaluation
   */
  async prepareIndicatorsForAlert(
    alert: Alert & { indicatorConfig?: any },
    currentPrice: number
  ): Promise<{
    currentIndicators: ComputedIndicators;
    prevIndicators: ComputedIndicators | null;
  }> {
    const indicatorConfig = alert.indicatorConfig as IndicatorConfig | null;

    if (!indicatorConfig) {
      return { currentIndicators: {}, prevIndicators: null };
    }

    try {
      // Determine required history period
      const maxPeriod = this.getMaxRequiredPeriod(indicatorConfig);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - maxPeriod - 10); // Add buffer

      // Fetch historical candles
      const candles = await technicalIndicatorsService.fetchHistoricalCandles(
        alert.symbol,
        startDate,
        endDate,
        (alert.timeframe as 'daily' | 'hourly') || 'daily'
      );

      if (candles.length < 2) {
        return { currentIndicators: {}, prevIndicators: null };
      }

      // Compute indicators for current state
      const currentIndicators = await technicalIndicatorsService.computeIndicators(
        candles,
        indicatorConfig
      );

      // Compute indicators for previous state (for crossover detection)
      const prevCandles = candles.slice(0, -1);
      const prevIndicators =
        prevCandles.length > 0
          ? await technicalIndicatorsService.computeIndicators(prevCandles, indicatorConfig)
          : null;

      return { currentIndicators, prevIndicators };
    } catch (error) {
      console.error('Error preparing indicators:', error);
      return { currentIndicators: {}, prevIndicators: null };
    }
  }

  /**
   * Get maximum period required for indicator calculations
   */
  private getMaxRequiredPeriod(config: IndicatorConfig): number {
    let maxPeriod = 50; // Default minimum

    if (config.rsi?.enabled) {
      maxPeriod = Math.max(maxPeriod, config.rsi.period + 10);
    }
    if (config.macd?.enabled) {
      maxPeriod = Math.max(maxPeriod, config.macd.slow + config.macd.signal + 10);
    }
    if (config.ema?.enabled) {
      maxPeriod = Math.max(maxPeriod, config.ema.long + 10);
    }
    if (config.bollinger?.enabled) {
      maxPeriod = Math.max(maxPeriod, config.bollinger.period + 10);
    }
    if (config.volume?.enabled) {
      maxPeriod = Math.max(maxPeriod, config.volume.period + 10);
    }

    return maxPeriod;
  }
}

export const alertEvaluationService = new AlertEvaluationService();
