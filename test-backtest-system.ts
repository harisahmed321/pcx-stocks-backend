/**
 * Test Script for Smart Stock Alert + Backtesting System
 *
 * This script demonstrates the complete workflow:
 * 1. Create a technical indicator-based alert
 * 2. Run a backtest to evaluate the strategy
 * 3. Display results
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Login credentials (from TEST_USERS.md)
const testUser = {
  email: 'dev@test.com',
  password: 'DevTest123!'
};

let authToken = '';

/**
 * Step 1: Login to get auth token
 */
async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    authToken = response.data.data.token;
    console.log('✅ Login successful\n');
    return true;
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Step 2: Create a technical alert
 */
async function createTechnicalAlert() {
  console.log('📊 Creating technical alert...');

  const alertConfig = {
    symbol: 'SYS',
    name: 'RSI Oversold + Volume Spike Strategy',
    alertType: 'TECHNICAL',
    condition: '> 0', // Dummy condition (logic in indicators)
    signalType: 'BUY',
    logicMode: 'ALL', // All conditions must be met
    timeframe: 'daily',
    indicatorConfig: {
      rsi: {
        enabled: true,
        period: 14,
        trigger: 'oversold' // RSI <= 30
      },
      volume: {
        enabled: true,
        period: 20,
        multiplier: 1.5 // Volume > 1.5x average
      }
    },
    triggerType: 'RECURRING',
    isActive: true
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/alerts`, alertConfig, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Alert created:', response.data.data.id);
    console.log('   Name:', response.data.data.name);
    console.log('   Signal Type:', response.data.data.signalType);
    console.log('   Logic Mode:', response.data.data.logicMode);
    console.log();
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Alert creation failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Step 3: Run backtest for the strategy
 */
async function runBacktest() {
  console.log('🔄 Running backtest...');

  const backtestConfig = {
    symbol: 'SYS',
    startDate: '2025-06-01',
    endDate: '2025-12-01',
    timeframe: 'daily',
    initialCapital: 100000,
    positionSize: 1, // Use 100% of capital per trade
    stopLossPct: 0.1, // 10% stop loss
    takeProfitPct: 0.2, // 20% take profit
    feesPct: 0.005, // 0.5% round-trip fees
    alert: {
      name: 'RSI Oversold + Volume Spike',
      condition: '> 0',
      signalType: 'BUY',
      logicMode: 'ALL',
      indicatorConfig: {
        rsi: {
          enabled: true,
          period: 14,
          trigger: 'oversold'
        },
        volume: {
          enabled: true,
          period: 20,
          multiplier: 1.5
        }
      }
    }
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/backtest`, backtestConfig, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const result = response.data.data;

    console.log('✅ Backtest completed!\n');
    console.log('📈 PERFORMANCE SUMMARY:');
    console.log('━'.repeat(60));
    console.log(`Initial Capital:     PKR ${result.initialCapital.toLocaleString()}`);
    console.log(`Final Capital:       PKR ${result.finalCapital.toLocaleString()}`);
    console.log(
      `Profit/Loss:         PKR ${result.stats.profitAmount.toLocaleString()} (${result.stats.profitPct.toFixed(2)}%)`
    );
    console.log(`Total Trades:        ${result.stats.totalTrades}`);
    console.log(`Win Rate:            ${result.stats.winRate.toFixed(2)}%`);
    console.log(`Profit Factor:       ${result.stats.profitFactor.toFixed(2)}`);
    console.log(`Max Drawdown:        ${result.stats.maxDrawdown.toFixed(2)}%`);
    console.log(`Sharpe Ratio:        ${result.stats.sharpeRatio.toFixed(2)}`);
    console.log(`Avg Hold Time:       ${result.stats.avgHoldTime.toFixed(1)} days`);
    console.log('━'.repeat(60));

    console.log('\n📊 TRADE BREAKDOWN:');
    console.log(`Buy Trades:          ${result.stats.buyTrades}`);
    console.log(`Sell Trades:         ${result.stats.sellTrades}`);
    console.log(`Avg Win:             ${result.stats.avgWin.toFixed(2)}%`);
    console.log(`Avg Loss:            ${result.stats.avgLoss.toFixed(2)}%`);

    if (result.trades.length > 0) {
      console.log('\n📝 RECENT TRADES (Last 5):');
      console.log('━'.repeat(60));
      result.trades.slice(-5).forEach((trade: any, index: number) => {
        console.log(`\nTrade ${result.trades.length - 4 + index}:`);
        console.log(`  Signal:      ${trade.signalType}`);
        console.log(`  Entry Date:  ${trade.entryDate}`);
        console.log(`  Entry Price: PKR ${trade.entryPrice.toFixed(2)}`);
        console.log(`  Exit Date:   ${trade.exitDate || 'N/A'}`);
        console.log(`  Exit Price:  PKR ${(trade.exitPrice || 0).toFixed(2)}`);
        console.log(`  P&L:         ${trade.pnlPct.toFixed(2)}%`);
        console.log(`  Shares:      ${trade.shares}`);
      });
    }

    console.log('\n✨ Backtest data can be visualized in the frontend UI\n');
    return result;
  } catch (error: any) {
    console.error('❌ Backtest failed:', error.response?.data || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
    return null;
  }
}

/**
 * Main execution flow
 */
async function main() {
  console.log('\n🚀 Smart Stock Alert + Backtesting System Test\n');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Test aborted: Login failed\n');
    return;
  }

  // Step 2: Create alert
  const alert = await createTechnicalAlert();
  if (!alert) {
    console.log('⚠️  Alert creation failed, continuing with backtest...\n');
  }

  // Step 3: Run backtest
  const backtestResult = await runBacktest();
  if (!backtestResult) {
    console.log('❌ Backtest failed\n');
    return;
  }

  console.log('✅ All tests completed successfully!\n');
}

// Run the test
main().catch(console.error);
