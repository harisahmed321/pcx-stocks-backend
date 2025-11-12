import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';

export interface ParsedMarketData {
  symbol: string;
  timestamp: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  change: number | null;
  changePercent: number | null;
  ldcp: number | null;
  var: number | null;
  haircut: number | null;
  peRatio: number | null;
  oneYearChange: number | null;
  ytdChange: number | null;
  askPrice: number | null;
  askVolume: number | null;
  bidPrice: number | null;
  bidVolume: number | null;
  circuitBreakerLow: number | null;
  circuitBreakerHigh: number | null;
  dayRangeLow: number | null;
  dayRangeHigh: number | null;
  week52RangeLow: number | null;
  week52RangeHigh: number | null;
}

export class MarketDataParserService {
  /**
   * Parse HTML content and extract market data from REG tab panel
   */
  static parseHTML(html: string, symbol: string): ParsedMarketData | null {
    try {
      const $ = cheerio.load(html);

      // Find the REG tab panel
      const regPanel = $('.tabs__panel[data-name="REG"]');

      if (regPanel.length === 0) {
        logger.warn(`REG panel not found for symbol ${symbol}`);
        return null;
      }

      const data: ParsedMarketData = {
        symbol,
        timestamp: new Date(),
        open: null,
        high: null,
        low: null,
        close: null,
        volume: null,
        change: null,
        changePercent: null,
        ldcp: null,
        var: null,
        haircut: null,
        peRatio: null,
        oneYearChange: null,
        ytdChange: null,
        askPrice: null,
        askVolume: null,
        bidPrice: null,
        bidVolume: null,
        circuitBreakerLow: null,
        circuitBreakerHigh: null,
        dayRangeLow: null,
        dayRangeHigh: null,
        week52RangeLow: null,
        week52RangeHigh: null
      };

      // Helper function to parse numeric value
      const parseNumber = (text: string | null | undefined): number | null => {
        if (!text) return null;
        // Remove commas, percentage signs, and extract number
        const cleaned = text.toString().replace(/,/g, '').replace(/%/g, '').trim();
        // Remove any non-numeric characters except decimal point and minus sign
        const numeric = cleaned.replace(/[^\d.-]/g, '');
        if (!numeric || numeric === '-' || numeric === '.') return null;
        const num = parseFloat(numeric);
        return isNaN(num) ? null : num;
      };

      // Helper function to extract value from stats_item
      const getStatValue = (label: string): number | null => {
        const item = regPanel.find(`.stats_item`).filter((_, el) => {
          const labelText = $(el).find('.stats_label').text().trim();
          // Try exact match first, then case-insensitive match
          return labelText === label || labelText.toLowerCase() === label.toLowerCase();
        });
        if (item.length === 0) {
          logger.debug(`Stat label "${label}" not found for symbol ${symbol}`);
          return null;
        }
        const valueText = item.find('.stats_value').text().trim();
        const parsed = parseNumber(valueText);
        if (parsed === null && valueText) {
          logger.debug(
            `Failed to parse value "${valueText}" for label "${label}" for symbol ${symbol}`
          );
        }
        return parsed;
      };

      // Extract basic stats (try multiple label variations)
      data.open = getStatValue('Open') || getStatValue('OPEN');
      data.high = getStatValue('High') || getStatValue('HIGH');
      data.low = getStatValue('Low') || getStatValue('LOW');

      // Volume (remove commas)
      const volumeText = regPanel
        .find('.stats_item')
        .filter((_, el) => {
          return $(el).find('.stats_label').text().trim() === 'Volume';
        })
        .find('.stats_value')
        .text()
        .trim();
      data.volume = parseNumber(volumeText);

      // Extract LDCP, VAR, HAIRCUT, P/E Ratio (try multiple label variations)
      data.ldcp = getStatValue('LDCP') || getStatValue('ldcp');
      data.var = getStatValue('VAR') || getStatValue('var');
      data.haircut = getStatValue('HAIRCUT') || getStatValue('Haircut') || getStatValue('haircut');
      data.peRatio =
        getStatValue('P/E Ratio (TTM) **') ||
        getStatValue('P/E Ratio (TTM)') ||
        getStatValue('P/E Ratio') ||
        getStatValue('PE Ratio');

      // Extract 1-Year Change and YTD Change (handle percentage signs)
      const oneYearChangeText = regPanel
        .find('.stats_item')
        .filter((_, el) => {
          return $(el).find('.stats_label').text().trim() === '1-Year Change * ^';
        })
        .find('.stats_value')
        .text()
        .trim();
      data.oneYearChange = parseNumber(oneYearChangeText);

      const ytdChangeText = regPanel
        .find('.stats_item')
        .filter((_, el) => {
          return $(el).find('.stats_label').text().trim() === 'YTD Change * ^';
        })
        .find('.stats_value')
        .text()
        .trim();
      data.ytdChange = parseNumber(ytdChangeText);

      // Extract Ask/Bid prices and volumes (try multiple label variations)
      data.askPrice = getStatValue('Ask Price') || getStatValue('Ask') || getStatValue('ASK PRICE');
      data.askVolume = parseNumber(
        regPanel
          .find('.stats_item')
          .filter((_, el) => {
            const label = $(el).find('.stats_label').text().trim();
            return (
              label === 'Ask Volume' || label === 'Ask' || label.toLowerCase() === 'ask volume'
            );
          })
          .find('.stats_value')
          .text()
          .trim()
      );
      data.bidPrice = getStatValue('Bid Price') || getStatValue('Bid') || getStatValue('BID PRICE');
      data.bidVolume = parseNumber(
        regPanel
          .find('.stats_item')
          .filter((_, el) => {
            const label = $(el).find('.stats_label').text().trim();
            return (
              label === 'Bid Volume' || label === 'Bid' || label.toLowerCase() === 'bid volume'
            );
          })
          .find('.stats_value')
          .text()
          .trim()
      );

      // Extract Circuit Breaker range
      const circuitBreakerText = regPanel
        .find('.stats_item')
        .filter((_, el) => {
          return $(el).find('.stats_label').text().trim() === 'CIRCUIT BREAKER';
        })
        .find('.stats_value')
        .text()
        .trim();

      if (circuitBreakerText) {
        const rangeMatch = circuitBreakerText.match(/([\d.]+)\s*—\s*([\d.]+)/);
        if (rangeMatch) {
          data.circuitBreakerLow = parseFloat(rangeMatch[1]);
          data.circuitBreakerHigh = parseFloat(rangeMatch[2]);
        }
      }

      // Extract Day Range
      const dayRangeText = regPanel
        .find('.stats_item')
        .filter((_, el) => {
          return $(el).find('.stats_label').text().trim() === 'DAY RANGE';
        })
        .find('.stats_value')
        .text()
        .trim();

      if (dayRangeText) {
        const rangeMatch = dayRangeText.match(/([\d.]+)\s*—\s*([\d.]+)/);
        if (rangeMatch) {
          data.dayRangeLow = parseFloat(rangeMatch[1]);
          data.dayRangeHigh = parseFloat(rangeMatch[2]);
        }
      }

      // Extract 52-Week Range
      const week52RangeText = regPanel
        .find('.stats_item')
        .filter((_, el) => {
          return $(el).find('.stats_label').text().trim() === '52-WEEK RANGE ^';
        })
        .find('.stats_value')
        .text()
        .trim();

      if (week52RangeText) {
        const rangeMatch = week52RangeText.match(/([\d.]+)\s*—\s*([\d.]+)/);
        if (rangeMatch) {
          data.week52RangeLow = parseFloat(rangeMatch[1]);
          data.week52RangeHigh = parseFloat(rangeMatch[2]);
        }
      }

      // Set close price to LDCP if available and close is not set
      // Change and changePercent will be calculated in the fetcher job using previous day's close
      if (data.ldcp !== null && data.close === null) {
        data.close = data.ldcp;
      }

      // Try to extract change and changePercent from HTML if available
      // Look for change indicators in the stats
      const changeText = regPanel
        .find('.stats_item')
        .filter((_, el) => {
          const label = $(el).find('.stats_label').text().trim();
          return label === 'Change' || label === 'Change %' || label.includes('Change');
        })
        .first()
        .find('.stats_value')
        .text()
        .trim();

      // If change is not found, try to find it in price displays or other sections
      // The change calculation will be done in the fetcher job using previous close

      return data;
    } catch (error: any) {
      logger.error(`Error parsing HTML for symbol ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch HTML from URL and parse market data
   */
  static async fetchAndParse(symbol: string, url: string): Promise<ParsedMarketData | null> {
    try {
      logger.info(`Fetching market data for ${symbol} from ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        // 404 means the symbol page doesn't exist - this is normal for some symbols
        if (response.status === 404) {
          logger.debug(`Symbol ${symbol} page not found (404) - skipping`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Check if HTML contains error page indicators
      if (html.includes('404') || html.includes('Not Found') || html.length < 1000) {
        logger.debug(`Symbol ${symbol} returned invalid page - skipping`);
        return null;
      }

      const parsedData = this.parseHTML(html, symbol);

      if (parsedData) {
        logger.info(`Successfully parsed market data for ${symbol}`);
      } else {
        logger.debug(`Failed to parse market data for ${symbol} - REG panel not found`);
      }
      return parsedData;
    } catch (error: any) {
      // Extract error message properly
      const errorMessage = error?.message || error?.toString() || 'Unknown error';

      // Don't log 404 errors as errors - they're expected for some symbols
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        logger.debug(`Symbol ${symbol} not available: ${errorMessage}`);
      } else {
        logger.error(`Error fetching/parsing market data for ${symbol}: ${errorMessage}`);
      }
      return null;
    }
  }
}
