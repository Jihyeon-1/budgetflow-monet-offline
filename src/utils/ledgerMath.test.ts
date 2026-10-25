import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_CATEGORIES,
  INITIAL_INVESTMENTS,
  INITIAL_TRANSACTIONS,
} from '../data/seedData';
import {
  calculateBudgetStatuses,
  calculateDepositMaturity,
  calculateMonthlySummary,
  calculateOverspendingSummary,
  calculatePortfolioSummary,
  calculateSavingsMaturity,
  filterTransactions,
  formatCompactKRW,
  formatKRW,
  generateCalendarDays,
  simulateDailyPriceUpdate,
  transactionsToCSV,
} from './ledgerMath';

test('formatKRW and formatCompactKRW format Korean won properly', () => {
  assert.equal(formatKRW(3850000), '3,850,000원');
  assert.equal(formatKRW(3850000, true), '+3,850,000원');
  assert.equal(formatKRW(-58000), '-58,000원');
  assert.equal(formatCompactKRW(6480000), '648만 원');
  assert.equal(formatCompactKRW(120000000), '1.2억 원');
});

test('calculateOverspendingSummary audits excessive spending and potential savings', () => {
  const overspending = calculateOverspendingSummary(
    INITIAL_TRANSACTIONS,
    '2026-10'
  );

  // In seedData: 4 overspending transactions (58000 + 149000 + 32000 + 89000 = 328,000)
  assert.equal(overspending.count, 4);
  assert.equal(overspending.totalAmount, 328000);
  assert.equal(overspending.potentialSavings, 328000);
  assert.equal(overspending.shareOfExpense > 0, true);
  assert.equal(overspending.items.length, 4);
});

test('calculatePortfolioSummary calculates total invested, valuation, profit, and allocation with deposit and savings', () => {
  const portfolio = calculatePortfolioSummary(INITIAL_INVESTMENTS);

  // Total invested includes stock, fund, etf, bond, deposit, and savings
  assert.ok(portfolio.totalInvested > 35000000);
  assert.ok(portfolio.totalValuation > 45000000);
  assert.ok(portfolio.totalProfit > 0);

  // Stock, Fund, ETF, Bond, Deposit, Savings allocations
  const fundAllocation = portfolio.assetAllocation.find((a) => a.type === 'fund');
  const stockAllocation = portfolio.assetAllocation.find((a) => a.type === 'stock');
  const depositAllocation = portfolio.assetAllocation.find((a) => a.type === 'deposit');
  const savingsAllocation = portfolio.assetAllocation.find((a) => a.type === 'savings');

  assert.ok(fundAllocation);
  assert.ok(stockAllocation);
  assert.ok(depositAllocation);
  assert.ok(savingsAllocation);
});

test('simulateDailyPriceUpdate recalculates stock valuation via (sharesCount * unitPrice) and fund via (units/1000 * nav)', () => {
  const updated = simulateDailyPriceUpdate(
    INITIAL_INVESTMENTS,
    '2026-10-24 12:00:00'
  );

  assert.equal(updated.length, INITIAL_INVESTMENTS.length);
  for (const asset of updated) {
    assert.equal(asset.lastUpdated, '2026-10-24 12:00:00');
    assert.equal(typeof asset.currentValuation, 'number');
    assert.equal(typeof asset.returnRate, 'number');

    // If stock with sharesCount, valuation must equal currentUnitPrice * sharesCount
    if (asset.sharesCount && asset.currentUnitPrice) {
      assert.equal(asset.currentValuation, Math.round(asset.currentUnitPrice * asset.sharesCount));
    }

    // If fund with accumulatedUnits, valuation must equal (accumulatedUnits / 1000) * fundNav
    if (asset.accumulatedUnits && asset.fundNav) {
      assert.equal(asset.currentValuation, Math.round((asset.accumulatedUnits / 1000) * asset.fundNav));
    }
  }
});

test('generateCalendarDays generates full week matrix with daily income and expense', () => {
  const days = generateCalendarDays('2026-10', INITIAL_TRANSACTIONS, '2026-10-24');

  // Must be a multiple of 7 (full weeks)
  assert.equal(days.length % 7, 0);

  // October 2026 has 31 days
  const currentMonthDays = days.filter((d) => d.isCurrentMonth);
  assert.equal(currentMonthDays.length, 31);

  // Oct 1st had salary income (+3,850,000원)
  const oct1 = days.find((d) => d.dateString === '2026-10-01');
  assert.ok(oct1);
  assert.equal(oct1.income, 3850000);

  // Oct 24th is today in our dataset
  const todayDay = days.find((d) => d.isToday);
  assert.ok(todayDay);
  assert.equal(todayDay.dateString, '2026-10-24');
  assert.ok(todayDay.expense > 0);
});

test('filterTransactions filters by overspendingOnly and search query', () => {
  const overspendingOnly = filterTransactions(
    INITIAL_TRANSACTIONS,
    {
      yearMonth: '2026-10',
      overspendingOnly: true,
    },
    INITIAL_CATEGORIES,
    INITIAL_BANK_ACCOUNTS
  );
  assert.equal(overspendingOnly.length, 4);

  const byIncomeSource = filterTransactions(
    INITIAL_TRANSACTIONS,
    {
      yearMonth: '2026-10',
      searchQuery: '기술기고료',
    },
    INITIAL_CATEGORIES,
    INITIAL_BANK_ACCOUNTS
  );
  assert.equal(byIncomeSource.length, 1);
  assert.equal(byIncomeSource[0].incomeSource, '테크 미디어 기술원고 및 기술기고료');
});

test('transactionsToCSV exports headers, accounts, and overspending column', () => {
  const csv = transactionsToCSV(
    INITIAL_TRANSACTIONS,
    INITIAL_CATEGORIES,
    INITIAL_BANK_ACCOUNTS
  );

  assert.ok(csv.includes('과소비여부'));
  assert.ok(csv.includes('수익출처'));
  assert.ok(csv.includes('연결통장'));
  assert.ok(csv.includes('신한은행 주거래'));
});

test('calculateDepositMaturity accurately calculates gross interest, 15.4% withholding tax, and maturity amount', () => {
  // Principal: 10,000,000 KRW, 3.6% annual interest, 12 months
  const dep = calculateDepositMaturity(10000000, 3.6, 12, false);
  assert.equal(dep.principal, 10000000);
  assert.equal(dep.grossInterest, 360000);
  assert.equal(dep.taxAmount, 55440); // 360,000 * 0.154 = 55,440
  assert.equal(dep.netInterest, 304560);
  assert.equal(dep.maturityAmount, 10304560);
});

test('calculateSavingsMaturity calculates installment savings interest and maturity amount', () => {
  // Monthly: 300,000 KRW, 4.2% annual, 6 months
  const sav = calculateSavingsMaturity(300000, 4.2, 6, false);
  assert.equal(sav.totalPrincipal, 1800000);
  assert.ok(sav.grossInterest > 20000);
  assert.ok(sav.taxAmount > 3000);
  assert.ok(sav.maturityAmount > 1815000);
});

