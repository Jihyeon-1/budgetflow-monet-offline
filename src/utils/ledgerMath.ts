import {
  AssetType,
  BankAccount,
  BudgetHealth,
  BudgetStatusItem,
  CalendarDayItem,
  Category,
  CategoryBreakdownItem,
  CategoryBudgetMap,
  DailyCashflowItem,
  InvestmentAsset,
  MonthlySummary,
  OverspendingSummary,
  PortfolioSummary,
  Transaction,
  TransactionFilterOptions,
  TransactionType,
} from '../types/ledger';

export function formatKRW(amount: number, showSign = false): string {
  const rounded = Math.round(amount);
  const absFormatted = Math.abs(rounded).toLocaleString('ko-KR');
  if (rounded < 0) {
    return `-${absFormatted}원`;
  }
  if (showSign && rounded > 0) {
    return `+${absFormatted}원`;
  }
  return `${absFormatted}원`;
}

export function formatCompactKRW(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 100000000) {
    return `${sign}${(abs / 100000000).toFixed(1)}억 원`;
  }
  if (abs >= 10000) {
    const man = Math.round(abs / 10000);
    return `${sign}${man.toLocaleString('ko-KR')}만 원`;
  }
  return `${sign}${abs.toLocaleString('ko-KR')}원`;
}

export function formatPercent(val: number, showSign = false): string {
  const sign = showSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

export function formatYearMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  if (!year || !month) return yearMonth;
  return `${year}년 ${month}월`;
}

export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1 + deltaMonths, 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getDaysInYearMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function getBudgetHealth(utilizationPercent: number): BudgetHealth {
  if (utilizationPercent > 100) return BudgetHealth.EXCEEDED;
  if (utilizationPercent >= 80) return BudgetHealth.WARNING;
  return BudgetHealth.NOMINAL;
}

export function getBudgetHealthLabel(health: BudgetHealth): string {
  switch (health) {
    case BudgetHealth.EXCEEDED:
      return '초과 · 한도 초과';
    case BudgetHealth.WARNING:
      return '주의 · 80% 이상';
    case BudgetHealth.NOMINAL:
    default:
      return '안정 · 범위 내';
  }
}

export function calculateMonthlySummary(
  transactions: Transaction[],
  yearMonth: string,
  budgets: CategoryBudgetMap,
  referenceDate = '2026-10-24'
): MonthlySummary {
  const monthTxs = transactions.filter((tx) => tx.date.startsWith(yearMonth));

  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of monthTxs) {
    if (tx.type === TransactionType.INCOME) {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  }

  const netCashflow = totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.round((netCashflow / totalIncome) * 1000) / 10 : 0;

  const totalBudget = Object.values(budgets).reduce(
    (s, b) => s + Math.max(0, b),
    0
  );
  const budgetRemaining = totalBudget - totalExpense;
  const budgetUtilization =
    totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 1000) / 10 : 0;
  const budgetHealth = getBudgetHealth(budgetUtilization);

  const daysInMonth = getDaysInYearMonth(yearMonth);
  let remainingDays = daysInMonth;
  if (referenceDate.startsWith(yearMonth)) {
    const currentDay = Number(referenceDate.split('-')[2]) || 1;
    remainingDays = Math.max(1, daysInMonth - currentDay + 1);
  }

  const dailyRecommendedBudget =
    budgetRemaining > 0 ? Math.floor(budgetRemaining / remainingDays) : 0;

  return {
    yearMonth,
    totalIncome,
    totalExpense,
    netCashflow,
    savingsRate,
    totalBudget,
    budgetRemaining,
    budgetUtilization,
    budgetHealth,
    dailyRecommendedBudget,
    transactionCount: monthTxs.length,
  };
}

export function calculateOverspendingSummary(
  transactions: Transaction[],
  yearMonth: string
): OverspendingSummary {
  const monthExpenseTxs = transactions.filter(
    (tx) => tx.date.startsWith(yearMonth) && tx.type === TransactionType.EXPENSE
  );

  const overspendingItems = monthExpenseTxs.filter((tx) => tx.isOverspending);
  const totalExpense = monthExpenseTxs.reduce((s, tx) => s + tx.amount, 0);
  const totalAmount = overspendingItems.reduce((s, tx) => s + tx.amount, 0);

  const monthIncomeTxs = transactions.filter(
    (tx) => tx.date.startsWith(yearMonth) && tx.type === TransactionType.INCOME
  );
  const totalIncome = monthIncomeTxs.reduce((s, tx) => s + tx.amount, 0);

  const shareOfExpense =
    totalExpense > 0 ? Math.round((totalAmount / totalExpense) * 1000) / 10 : 0;

  // Potential savings: if overspending was eliminated
  const potentialSavings = totalAmount;
  const potentialExpense = totalExpense - potentialSavings;
  const potentialNet = totalIncome - potentialExpense;
  const potentialSavingsRate =
    totalIncome > 0 ? Math.round((potentialNet / totalIncome) * 1000) / 10 : 0;

  return {
    count: overspendingItems.length,
    totalAmount,
    shareOfExpense,
    potentialSavings,
    potentialSavingsRate,
    items: overspendingItems.sort((a, b) => b.amount - a.amount),
  };
}

export interface DepositCalculationResult {
  principal: number;
  grossInterest: number;
  taxAmount: number; // 15.4% withholding tax
  netInterest: number;
  maturityAmount: number;
  netRate: number;
}

export function calculateDepositMaturity(
  principal: number,
  annualRate: number,
  termMonths: number,
  isTaxFree = false
): DepositCalculationResult {
  const safePrincipal = Math.max(0, principal);
  const safeRate = Math.max(0, annualRate);
  const safeMonths = Math.max(1, termMonths);

  // 단리 이자: 원금 * 연이율 * (개월 / 12)
  const grossInterest = Math.round(safePrincipal * (safeRate / 100) * (safeMonths / 12));
  const taxAmount = isTaxFree ? 0 : Math.round(grossInterest * 0.154);
  const netInterest = grossInterest - taxAmount;
  const maturityAmount = safePrincipal + netInterest;
  const netRate = safePrincipal > 0 ? Math.round((netInterest / safePrincipal) * 1000) / 10 : 0;

  return {
    principal: safePrincipal,
    grossInterest,
    taxAmount,
    netInterest,
    maturityAmount,
    netRate,
  };
}

export interface SavingsCalculationResult {
  monthlyDeposit: number;
  termMonths: number;
  totalPrincipal: number;
  grossInterest: number;
  taxAmount: number;
  netInterest: number;
  maturityAmount: number;
  netRate: number;
}

export function calculateSavingsMaturity(
  monthlyDeposit: number,
  annualRate: number,
  termMonths: number,
  isTaxFree = false
): SavingsCalculationResult {
  const safeMonthly = Math.max(0, monthlyDeposit);
  const safeRate = Math.max(0, annualRate);
  const safeMonths = Math.max(1, termMonths);

  const totalPrincipal = safeMonthly * safeMonths;
  // 적금 단리 이자: 월납입액 * (연이율 / 12) * (n * (n + 1) / 2)
  const grossInterest = Math.round(
    safeMonthly * (safeRate / 100 / 12) * ((safeMonths * (safeMonths + 1)) / 2)
  );
  const taxAmount = isTaxFree ? 0 : Math.round(grossInterest * 0.154);
  const netInterest = grossInterest - taxAmount;
  const maturityAmount = totalPrincipal + netInterest;
  const netRate = totalPrincipal > 0 ? Math.round((netInterest / totalPrincipal) * 1000) / 10 : 0;

  return {
    monthlyDeposit: safeMonthly,
    termMonths: safeMonths,
    totalPrincipal,
    grossInterest,
    taxAmount,
    netInterest,
    maturityAmount,
    netRate,
  };
}

export function calculatePortfolioSummary(
  investments: InvestmentAsset[]
): PortfolioSummary {
  const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
  const totalValuation = investments.reduce((s, i) => s + i.currentValuation, 0);
  const totalProfit = totalValuation - totalInvested;
  const totalReturnRate =
    totalInvested > 0
      ? Math.round((totalProfit / totalInvested) * 1000) / 10
      : 0;

  const typeConfig: Record<AssetType, { label: string; color: string }> = {
    stock: { label: '주식 (국내/해외)', color: '#2563eb' },
    fund: { label: '적립식 펀드', color: '#0f766e' },
    etf: { label: 'ETF', color: '#4f46e5' },
    bond: { label: '채권/안전자산', color: '#d97706' },
    deposit: { label: '정기 예금', color: '#059669' },
    savings: { label: '적립식 적금', color: '#0891b2' },
  };

  const assetAllocation = (['stock', 'fund', 'etf', 'bond', 'deposit', 'savings'] as AssetType[])
    .map((type) => {
      const items = investments.filter((i) => i.type === type);
      const amount = items.reduce((s, i) => s + i.currentValuation, 0);
      const sharePercent =
        totalValuation > 0
          ? Math.round((amount / totalValuation) * 1000) / 10
          : 0;
      return {
        type,
        label: typeConfig[type].label,
        color: typeConfig[type].color,
        amount,
        sharePercent,
      };
    })
    .filter((a) => a.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const lastUpdated = investments[0]?.lastUpdated ?? '2026-10-24 12:00:00';

  return {
    totalInvested,
    totalValuation,
    totalProfit,
    totalReturnRate,
    assetAllocation,
    lastUpdated,
  };
}

export function simulateDailyPriceUpdate(
  investments: InvestmentAsset[],
  customDateStr = '2026-10-24 12:00:00'
): InvestmentAsset[] {
  return investments.map((inv) => {
    // 예금 및 적금은 매일 이자 누적 반영
    if (inv.type === 'deposit' || inv.type === 'savings') {
      const rate = inv.interestRate ?? 3.5;
      const principal = inv.investedAmount;
      // 1일 경과 이자 (연이자 / 365)
      const dailyGrossInterest = Math.round((principal * (rate / 100)) / 365);
      const prevAccrued = inv.accruedInterest ?? Math.round(principal * 0.015);
      const newAccrued = prevAccrued + dailyGrossInterest;
      const netInterest = inv.isTaxFree ? newAccrued : Math.round(newAccrued * (1 - 0.154));
      const newCurrentValuation = principal + netInterest;
      const profit = newCurrentValuation - principal;
      const newReturnRate = principal > 0 ? Math.round((profit / principal) * 1000) / 10 : 0;

      return {
        ...inv,
        accruedInterest: newAccrued,
        currentValuation: newCurrentValuation,
        returnRate: newReturnRate,
        dailyChangeRate: 0.01,
        lastUpdated: customDateStr,
      };
    }

    // Deterministic realistic daily price fluctuation (-2.5% ~ +2.8%)
    const charCodeSum = (inv.id + (inv.symbol || inv.name))
      .split('')
      .reduce((s, c) => s + c.charCodeAt(0), 0);
    const variationDeltaPercent =
      (((charCodeSum * 19 + Date.now()) % 54) - 25) / 10; // -2.5% ~ +2.8%

    const newDailyChangeRate = Math.round(variationDeltaPercent * 10) / 10;
    const priceFactor = 1 + newDailyChangeRate / 100;

    // Requirement: 주식/ETF는 네이버 주식 기준 1주당 가격 * 내가 몇 주 구매했는지 계산해서 현재가 스스로 계산
    if (inv.type === 'stock' || inv.type === 'etf' || inv.sharesCount) {
      const baseUnitPrice = inv.currentUnitPrice ?? inv.currentPrice ?? 50000;
      const newUnitPrice = Math.max(10, Math.round(baseUnitPrice * priceFactor));
      const shares = inv.sharesCount && inv.sharesCount > 0 ? inv.sharesCount : 1;
      
      // 스스로 계산: 한주당 가격 * 내가 몇 주 구매했는지
      const newCurrentValuation = Math.round(newUnitPrice * shares);
      const invested = inv.investedAmount > 0 ? inv.investedAmount : (inv.purchaseUnitPrice ? inv.purchaseUnitPrice * shares : newCurrentValuation);
      const profit = newCurrentValuation - invested;
      const newReturnRate = invested > 0 ? Math.round((profit / invested) * 1000) / 10 : 0;

      return {
        ...inv,
        currentUnitPrice: newUnitPrice,
        currentPrice: newUnitPrice,
        currentValuation: newCurrentValuation,
        returnRate: newReturnRate,
        dailyChangeRate: newDailyChangeRate,
        lastUpdated: customDateStr,
      };
    }

    // Requirement: 펀드는 지정일 구매 및 펀드 기준가 반영 계산
    if (inv.type === 'fund') {
      const baseNav = inv.fundNav ?? inv.currentPrice ?? 1000;
      const newNav = Math.max(10, Math.round(baseNav * priceFactor));
      
      // 펀드 기준가는 통상 1,000좌당 가격
      let newCurrentValuation: number;
      if (inv.accumulatedUnits && inv.accumulatedUnits > 0) {
        newCurrentValuation = Math.round((inv.accumulatedUnits / 1000) * newNav);
      } else {
        newCurrentValuation = Math.max(1000, Math.round(inv.currentValuation * priceFactor));
      }

      const invested = inv.investedAmount > 0 ? inv.investedAmount : newCurrentValuation;
      const profit = newCurrentValuation - invested;
      const newReturnRate = invested > 0 ? Math.round((profit / invested) * 1000) / 10 : 0;

      return {
        ...inv,
        fundNav: newNav,
        currentPrice: newNav,
        currentValuation: newCurrentValuation,
        returnRate: newReturnRate,
        dailyChangeRate: newDailyChangeRate,
        lastUpdated: customDateStr,
      };
    }

    // 채권 및 기타 자산
    const newCurrentPrice = Math.max(1, Math.round(inv.currentPrice * priceFactor));
    const newCurrentValuation = Math.max(
      1000,
      Math.round(inv.currentValuation * priceFactor)
    );
    const profit = newCurrentValuation - inv.investedAmount;
    const newReturnRate = inv.investedAmount > 0 ? Math.round((profit / inv.investedAmount) * 1000) / 10 : 0;

    return {
      ...inv,
      currentPrice: newCurrentPrice,
      currentValuation: newCurrentValuation,
      returnRate: newReturnRate,
      dailyChangeRate: newDailyChangeRate,
      lastUpdated: customDateStr,
    };
  });
}

/**
 * 대시보드 달력 그리드 생성 함수 (일요일 ~ 토요일 주 단위 매트릭스)
 * 매일 얼마를 썼는지(빨간색), 얼마가 들어왔는지(초록색), 과소비 여부를 계산합니다.
 */
export function generateCalendarDays(
  yearMonth: string,
  transactions: Transaction[],
  today = '2026-10-24'
): CalendarDayItem[] {
  const [year, month] = yearMonth.split('-').map(Number);
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0: 일, 1: 월, ... 6: 토
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // 이전 달 정보
  const prevMonthDate = new Date(year, month - 2, 1);
  const prevMonthTotalDays = new Date(year, month - 1, 0).getDate();
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');

  // 다음 달 정보
  const nextMonthDate = new Date(year, month, 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');

  // 거래 매핑
  const txMap = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const list = txMap.get(tx.date) ?? [];
    list.push(tx);
    txMap.set(tx.date, list);
  }

  const calendarDays: CalendarDayItem[] = [];

  // 1. 이전 달 채우기 (앞쪽 빈 칸)
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const dateStr = `${prevYear}-${prevMonth}-${String(dayNum).padStart(2, '0')}`;
    const dayTxs = txMap.get(dateStr) ?? [];
    const income = dayTxs.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const expense = dayTxs.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    const hasOverspending = dayTxs.some((t) => t.isOverspending);

    calendarDays.push({
      dateString: dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === today,
      income,
      expense,
      net: income - expense,
      hasOverspending,
      transactions: dayTxs,
    });
  }

  // 2. 현재 달 날짜들
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTxs = txMap.get(dateStr) ?? [];
    const income = dayTxs.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const expense = dayTxs.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    const hasOverspending = dayTxs.some((t) => t.isOverspending);

    calendarDays.push({
      dateString: dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === today,
      income,
      expense,
      net: income - expense,
      hasOverspending,
      transactions: dayTxs,
    });
  }

  // 3. 다음 달 채우기 (뒷쪽 7배수 맞추기)
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const dateStr = `${nextYear}-${nextMonth}-${String(d).padStart(2, '0')}`;
    const dayTxs = txMap.get(dateStr) ?? [];
    const income = dayTxs.filter((t) => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
    const expense = dayTxs.filter((t) => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
    const hasOverspending = dayTxs.some((t) => t.isOverspending);

    calendarDays.push({
      dateString: dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === today,
      income,
      expense,
      net: income - expense,
      hasOverspending,
      transactions: dayTxs,
    });
  }

  return calendarDays;
}

export function calculateBudgetStatuses(
  transactions: Transaction[],
  yearMonth: string,
  budgets: CategoryBudgetMap,
  categories: Category[]
): BudgetStatusItem[] {
  const expenseCategories = categories.filter(
    (c) => c.type === TransactionType.EXPENSE
  );
  const expenseTxs = transactions.filter(
    (tx) => tx.date.startsWith(yearMonth) && tx.type === TransactionType.EXPENSE
  );

  return expenseCategories.map((cat) => {
    const budget = Math.max(0, budgets[cat.id] ?? 0);
    const spent = expenseTxs
      .filter((tx) => tx.categoryId === cat.id)
      .reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = budget - spent;
    const utilizationPercent =
      budget > 0
        ? Math.round((spent / budget) * 1000) / 10
        : spent > 0
          ? 100.1
          : 0;
    const health = getBudgetHealth(utilizationPercent);
    const statusLabel = getBudgetHealthLabel(health);

    return {
      categoryId: cat.id,
      label: cat.label,
      color: cat.color,
      budget,
      spent,
      remaining,
      utilizationPercent,
      health,
      statusLabel,
    };
  }).sort((a, b) => b.utilizationPercent - a.utilizationPercent);
}

export function calculateCategoryBreakdown(
  transactions: Transaction[],
  yearMonth: string,
  categories: Category[]
): CategoryBreakdownItem[] {
  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const expenseTxs = transactions.filter(
    (tx) => tx.date.startsWith(yearMonth) && tx.type === TransactionType.EXPENSE
  );

  const totalExpense = expenseTxs.reduce((sum, tx) => sum + tx.amount, 0);

  const grouped = new Map<string, { amount: number; count: number }>();
  for (const tx of expenseTxs) {
    const curr = grouped.get(tx.categoryId) ?? { amount: 0, count: 0 };
    curr.amount += tx.amount;
    curr.count += 1;
    grouped.set(tx.categoryId, curr);
  }

  const items: CategoryBreakdownItem[] = [];
  grouped.forEach((data, catId) => {
    const cat = catMap.get(catId);
    if (!cat) return;
    const sharePercent =
      totalExpense > 0 ? Math.round((data.amount / totalExpense) * 1000) / 10 : 0;
    items.push({
      categoryId: catId,
      label: cat.label,
      color: cat.color,
      amount: data.amount,
      sharePercent,
      count: data.count,
    });
  });

  return items.sort((a, b) => b.amount - a.amount);
}

export function calculateDailyCashflow(
  transactions: Transaction[],
  yearMonth: string
): DailyCashflowItem[] {
  const days = getDaysInYearMonth(yearMonth);
  const monthTxs = transactions.filter((tx) => tx.date.startsWith(yearMonth));

  const dailyMap = new Map<number, { expense: number; income: number }>();
  for (let d = 1; d <= days; d++) {
    dailyMap.set(d, { expense: 0, income: 0 });
  }

  for (const tx of monthTxs) {
    const day = Number(tx.date.split('-')[2]);
    const entry = dailyMap.get(day);
    if (!entry) continue;
    if (tx.type === TransactionType.EXPENSE) {
      entry.expense += tx.amount;
    } else {
      entry.income += tx.amount;
    }
  }

  let cumulativeExpense = 0;
  const result: DailyCashflowItem[] = [];
  for (let d = 1; d <= days; d++) {
    const entry = dailyMap.get(d)!;
    cumulativeExpense += entry.expense;
    const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
    result.push({
      day: d,
      date: dateStr,
      expense: entry.expense,
      income: entry.income,
      cumulativeExpense,
    });
  }

  return result;
}

export function filterTransactions(
  transactions: Transaction[],
  options: TransactionFilterOptions,
  categories: Category[] = [],
  accounts: BankAccount[] = []
): Transaction[] {
  const {
    yearMonth = 'all',
    type = 'all',
    categoryId = 'all',
    accountId = 'all',
    overspendingOnly = false,
    searchQuery = '',
    sortBy = 'date_desc',
  } = options;

  const catMap = new Map(categories.map((c) => [c.id, c.label]));
  const accMap = new Map(accounts.map((a) => [a.id, a.accountName]));
  const q = searchQuery.trim().toLowerCase();

  const filtered = transactions.filter((tx) => {
    if (yearMonth !== 'all' && !tx.date.startsWith(yearMonth)) return false;
    if (type !== 'all' && tx.type !== type) return false;
    if (categoryId !== 'all' && tx.categoryId !== categoryId) return false;
    if (accountId !== 'all' && tx.accountId !== accountId) return false;
    if (overspendingOnly && !tx.isOverspending) return false;

    if (q) {
      const catLabel = (catMap.get(tx.categoryId) ?? '').toLowerCase();
      const accLabel = (accMap.get(tx.accountId) ?? '').toLowerCase();
      const source = (tx.incomeSource ?? '').toLowerCase();
      const memo = (tx.memo ?? '').toLowerCase();
      const match =
        tx.title.toLowerCase().includes(q) ||
        catLabel.includes(q) ||
        accLabel.includes(q) ||
        source.includes(q) ||
        memo.includes(q);
      if (!match) return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      case 'amount_desc':
        return b.amount - a.amount || b.date.localeCompare(a.date);
      case 'amount_asc':
        return a.amount - b.amount || b.date.localeCompare(a.date);
      case 'date_desc':
      default:
        return b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
    }
  });
}

export function transactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  accounts: BankAccount[]
): string {
  const catMap = new Map(categories.map((c) => [c.id, c.label]));
  const accMap = new Map(accounts.map((a) => [a.id, `${a.bankName} ${a.accountName}`]));

  const header = [
    '날짜',
    '유형',
    '내역명',
    '금액(원)',
    '카테고리',
    '연결통장',
    '수익출처',
    '과소비여부',
    '결제수단',
    '메모',
  ];

  const escapeCell = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const rows = transactions.map((tx) => [
    tx.date,
    tx.type === TransactionType.INCOME ? '수입' : '지출',
    tx.title,
    String(tx.amount),
    catMap.get(tx.categoryId) ?? tx.categoryId,
    accMap.get(tx.accountId) ?? tx.accountId,
    tx.incomeSource ?? '',
    tx.isOverspending ? '과소비' : '일반',
    tx.paymentMethod,
    tx.memo ?? '',
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell)).join(','))
    .join('\n');
}
