# Backtest Capital Calculation Test Case

## Scenario: Simple 2-Trade Example

### Initial Setup

- **Initial Capital**: 100,000 PKR
- **Position Size**: 100% (1.0)
- **Fees**: 0.5% (0.005) per side, 1% round-trip

---

## Trade 1: BUY Signal (Long Position)

### Entry (Price: 100 PKR)

1. **Investment** = 100,000 × 1.0 = 100,000 PKR
2. **Shares** = 100,000 / 100 = 1,000 shares
3. **Entry Fees** = 100,000 × 0.005 = 500 PKR
4. **Capital Deducted** = 100,000 + 500 = 100,500 PKR
5. **Remaining Capital** = 100,000 - 100,500 = **-500 PKR** ❌

### Exit (Price: 110 PKR) - +10% gain

1. **Exit Value** = 1,000 × 110 = 110,000 PKR
2. **Exit Fees** = 110,000 × 0.005 = 550 PKR
3. **Capital Added** = 110,000 - 550 = 109,450 PKR
4. **Final Capital** = -500 + 109,450 = **108,950 PKR** ✓

**Net Profit**: 108,950 - 100,000 = **8,950 PKR (+8.95%)**

---

## Trade 2: SELL Signal closes Trade 1, then opens SHORT

### Close Long & Open Short (Price: 110 PKR)

Same as Trade 1 exit above.

### Short Entry (Price: 110 PKR)

1. **Investment** = 108,950 × 1.0 = 108,950 PKR
2. **Shares** = 108,950 / 110 = 990.45 shares
3. **Entry Fees** = 108,950 × 0.005 = 544.75 PKR
4. **Capital Deducted** = 108,950 + 544.75 = 109,494.75 PKR
5. **Remaining Capital** = 108,950 - 109,494.75 = **-544.75 PKR**

### Short Exit (Price: 100 PKR) - +9.09% gain on short

1. **Exit Value** = 990.45 × 100 = 99,045 PKR
2. **Exit Fees** = 99,045 × 0.005 = 495.23 PKR
3. **Capital Added** = 99,045 - 495.23 = 98,549.77 PKR
4. **Final Capital** = -544.75 + 98,549.77 = **98,005 PKR** ❌

**Net Loss**: 98,005 - 100,000 = **-1,995 PKR (-2%)**

---

## ❌ PROBLEM IDENTIFIED

When `positionSize = 1.0` (100%), the capital goes negative after opening a position because:

- We deduct the **full investment** (100% of capital)
- Plus **entry fees** on top of that

**Solution**: The position size should represent the fraction of capital to invest, and fees should be deducted FROM the investment, not added on top.

---

## Correct Calculation

### Entry (Price: 100 PKR, Position Size: 100%)

1. **Available for Investment** = 100,000 PKR
2. **Entry Fees** = 100,000 × 0.005 / 2 = 250 PKR (half the round-trip)
3. **Net Investment** = 100,000 - 250 = 99,750 PKR
4. **Shares** = 99,750 / 100 = 997.5 shares
5. **Remaining Capital** = 100,000 - 100,000 = **0 PKR** ✓

OR (keeping capital for fees):

1. **Investment** = 100,000 × 0.995 = 99,500 PKR (reserve 0.5% for fees)
2. **Shares** = 99,500 / 100 = 995 shares
3. **Entry Fees** = 99,500 × 0.005 = 497.5 PKR
4. **Total Deducted** = 99,500 + 497.5 = 99,997.5 PKR
5. **Remaining Capital** = 100,000 - 99,997.5 = **2.5 PKR** ✓

---

## Recommended Fix

```typescript
// When opening position
const investment = capital * config.positionSize;
const entryFees = investment * (config.feesPct / 2);
const shares = investment / entryPrice;

// Option 1: Deduct investment + fees (capital can go negative if positionSize = 1.0)
capital -= investment + entryFees; // ❌ Current implementation

// Option 2: Calculate shares after fees (prevents negative capital)
const netInvestment = investment - entryFees;
const shares = netInvestment / entryPrice;
capital -= investment; // ✓ Recommended
```
