import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Coins,
  Flame,
  Plus,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  BankAccount,
  BudgetHealth,
  BudgetStatusItem,
  Category,
  CategoryBreakdownItem,
  DailyCashflowItem,
  InvestmentAsset,
  MonthlySummary,
  OverspendingSummary,
  PortfolioSummary,
  Transaction,
  TransactionType,
} from '../types/ledger';
import { formatCompactKRW, formatKRW, formatPercent } from '../utils/ledgerMath';
import { CategoryDonutChart, DailySpendingChart, OverspendingDonutChart } from './Charts';
import { FinancialCalendar } from './FinancialCalendar';

interface DashboardViewProps {
  summary: MonthlySummary;
  overspending: OverspendingSummary;
  categoryBreakdown: CategoryBreakdownItem[];
  dailyCashflow: DailyCashflowItem[];
  budgetStatuses: BudgetStatusItem[];
  recentTransactions: Transaction[];
  allTransactions: Transaction[];
  bankAccounts: BankAccount[];
  categories: Category[];
  portfolio?: PortfolioSummary;
  investments?: InvestmentAsset[];
  yearMonth: string;
  yearMonthLabel: string;
  defaultDate: string;
  onChangeYearMonth: (nextYm: string) => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigateTab: (tab: 'transactions' | 'budgets' | 'investments' | 'settings') => void;
  onFilterByCategory: (categoryId: string) => void;
  onOpenAddModalForDate?: (dateStr: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  overspending,
  categoryBreakdown,
  dailyCashflow,
  budgetStatuses,
  recentTransactions,
  allTransactions,
  bankAccounts,
  categories,
  portfolio,
  investments,
  yearMonth,
  yearMonthLabel,
  defaultDate,
  onChangeYearMonth,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onNavigateTab,
  onFilterByCategory,
  onOpenAddModalForDate,
}) => {
  const [showOverspendingDetail, setShowOverspendingDetail] = useState(false);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(bankAccounts.map((a) => [a.id, a]));

  // Total Net Worth Calculations (Requirement 2: 통장 총액 + 투자 총액 + 총 나한테 얼마 있는지)
  const totalBankBalance = React.useMemo(
    () => bankAccounts.reduce((sum, acc) => sum + acc.balance, 0),
    [bankAccounts]
  );

  const totalInvestmentValuation = React.useMemo(() => {
    if (portfolio?.totalValuation !== undefined) return portfolio.totalValuation;
    return (investments ?? []).reduce((sum, inv) => sum + (inv.currentValuation || 0), 0);
  }, [portfolio, investments]);

  const totalInvestedPrincipal = React.useMemo(() => {
    if (portfolio?.totalInvested !== undefined) return portfolio.totalInvested;
    return (investments ?? []).reduce((sum, inv) => sum + (inv.investedAmount || 0), 0);
  }, [portfolio, investments]);

  const totalNetWorth = totalBankBalance + totalInvestmentValuation;
  const investmentProfit = totalInvestmentValuation - totalInvestedPrincipal;
  const investmentReturnRate =
    totalInvestedPrincipal > 0
      ? Math.round((investmentProfit / totalInvestedPrincipal) * 1000) / 10
      : 0;

  const stockValuation = React.useMemo(
    () =>
      (investments ?? [])
        .filter((i) => i.type === 'stock' || i.type === 'etf')
        .reduce((s, i) => s + (i.currentValuation || 0), 0),
    [investments]
  );
  const depositValuation = React.useMemo(
    () =>
      (investments ?? [])
        .filter((i) => i.type === 'deposit' || i.type === 'savings')
        .reduce((s, i) => s + (i.currentValuation || 0), 0),
    [investments]
  );
  const fundValuation = React.useMemo(
    () =>
      (investments ?? [])
        .filter((i) => i.type === 'fund' || i.type === 'bond')
        .reduce((s, i) => s + (i.currentValuation || 0), 0),
    [investments]
  );

  const bankShare = totalNetWorth > 0 ? Math.round((totalBankBalance / totalNetWorth) * 100) : 50;
  const investShare = 100 - bankShare;

  // Overspending Category Distribution for Donut Chart (Requirement 7)
  const overspendingCategories = React.useMemo(() => {
    const map = new Map<string, { amount: number; count: number }>();
    for (const item of overspending.items) {
      const cur = map.get(item.categoryId) || { amount: 0, count: 0 };
      cur.amount += item.amount;
      cur.count += 1;
      map.set(item.categoryId, cur);
    }
    const total = overspending.totalAmount || 1;
    return Array.from(map.entries())
      .map(([catId, data]) => {
        const cat = catMap.get(catId);
        return {
          categoryId: catId,
          label: cat?.label || catId,
          color: cat?.color || '#d95d44',
          amount: data.amount,
          count: data.count,
          sharePercent: Math.round((data.amount / total) * 1000) / 10,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [overspending.items, overspending.totalAmount, catMap]);

  const renderHealthIndicator = (health: BudgetHealth, label: string) => {
    if (health === BudgetHealth.EXCEEDED) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 whitespace-nowrap">
          <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );
    }
    if (health === BudgetHealth.WARNING) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 whitespace-nowrap">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{label}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Requirement: 대시보드 맨 위에 통장 총 얼마, 투자 총 얼마, 그래서 총 나한테 얼마 있는지 다 보여주기 */}
      <section
        aria-label="총 보유 순자산 및 통장·투자 자산 통합 요약"
        className="monet-hero rounded-2xl p-5 sm:p-7 text-white"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/20 text-teal-300">
                <Wallet className="h-3.5 w-3.5" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-300">
                My Total Net Worth · 나의 총 보유 자산 요약
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <h1 className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
                {formatKRW(totalNetWorth)}
              </h1>
              <span className="rounded-full bg-teal-400/15 border border-teal-400/30 px-3 py-0.5 text-xs font-bold text-teal-300">
                통장 현금 {bankShare}% · 투자 자산 {investShare}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-300">
              연결된 통장 {bankAccounts.length}개의 실제 현금 잔액과 주식·예금·적금·펀드 {investments?.length ?? 0}개 평가액이 합산된 총 순자산입니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-all backdrop-blur-xs"
            >
              <Building2 className="h-3.5 w-3.5 text-teal-300" />
              <span>통장 잔액 관리</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('investments')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-teal-400 transition-all shadow-xs"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>투자·예금 상세 분석</span>
            </button>
          </div>
        </div>

        {/* 3 Detail Metric Cards: 통장 총액 + 투자 총액 + 포트폴리오 비중 */}
        <div className="mt-5 grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-3">
          {/* Card 1: 통장에 총 얼마 있는지 */}
          <div className="py-2 sm:px-4 sm:first:pl-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-sky-400" />
                <span>입출금 통장 총 잔액</span>
              </span>
              <span className="rounded bg-sky-500/20 text-sky-300 px-1.5 py-0.5 text-[10px] font-bold">
                {bankAccounts.length}개 통장
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
              {formatKRW(totalBankBalance)}
            </p>
            <p className="mt-1 text-[11px] text-slate-300 truncate">
              {bankAccounts.slice(0, 2).map((a) => `${a.bankName} ${formatCompactKRW(a.balance)}`).join(' · ')}
              {bankAccounts.length > 2 ? ` 외 ${bankAccounts.length - 2}곳` : ''}
            </p>
          </div>

          {/* Card 2: 주식 + 예금 등 투자에 총 얼마 들어있는지 */}
          <div className="py-2 sm:px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
                <span>주식 · 예금 등 투자 총 평가액</span>
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold font-mono tabular-nums ${
                  investmentProfit >= 0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {investmentProfit >= 0 ? '+' : ''}{investmentReturnRate.toFixed(1)}% ({formatKRW(investmentProfit, true)})
              </span>
            </div>
            <p className="mt-2 font-mono text-2xl font-bold tracking-tight text-white tabular-nums">
              {formatKRW(totalInvestmentValuation)}
            </p>
            <p className="mt-1 text-[11px] text-slate-300">
              투자 원금 {formatCompactKRW(totalInvestedPrincipal)} 대비 손익 반영
            </p>
          </div>

          {/* Card 3: 투자 상품 구성 요약 */}
          <div className="py-2 sm:px-4 sm:border-t sm:border-white/10 lg:border-t-0 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>투자 자산 구성 세부</span>
            </span>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs font-mono tabular-nums">
              <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                <span className="text-[10px] text-slate-400 block">주식/ETF</span>
                <span className="font-bold text-white mt-0.5 block">{formatCompactKRW(stockValuation)}</span>
              </div>
              <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                <span className="text-[10px] text-slate-400 block">예금/적금</span>
                <span className="font-bold text-white mt-0.5 block">{formatCompactKRW(depositValuation)}</span>
              </div>
              <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                <span className="text-[10px] text-slate-400 block">펀드/채권</span>
                <span className="font-bold text-white mt-0.5 block">{formatCompactKRW(fundValuation)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column Single-Elevation Monthly Summary Strip */}
      <section
        aria-label="월간 핵심 재무 지표"
        className="grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
      >
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">이번 달 총 수입</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatKRW(summary.totalIncome)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            총 {summary.transactionCount}건의 입출금 거래
          </p>
        </div>

        <div className="p-5 sm:border-l sm:border-slate-200 lg:border-l-0">
          <p className="text-xs font-medium text-slate-500">이번 달 총 지출</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatKRW(summary.totalExpense)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            목표 예산 {formatCompactKRW(summary.totalBudget)} 중{' '}
            <span className="font-mono font-medium text-slate-700 tabular-nums">
              {summary.budgetUtilization.toFixed(1)}%
            </span>{' '}
            사용
          </p>
        </div>

        <div className="p-5 sm:border-t sm:border-slate-200 lg:border-t-0">
          <p className="text-xs font-medium text-slate-500">순수익 · 저축 여력</p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              summary.netCashflow >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatKRW(summary.netCashflow, true)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            수입 대비 저축률{' '}
            <span className="font-mono font-medium text-slate-700 tabular-nums">
              {summary.savingsRate.toFixed(1)}%
            </span>
          </p>
        </div>

        <div className="p-5 sm:border-t sm:border-l sm:border-slate-200 lg:border-t-0 lg:border-l-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-500">예산 잔여 한도</p>
            {renderHealthIndicator(
              summary.budgetHealth,
              summary.budgetHealth === BudgetHealth.EXCEEDED
                ? '예산 초과'
                : summary.budgetHealth === BudgetHealth.WARNING
                  ? '주의 구간'
                  : '안정 유지'
            )}
          </div>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              summary.budgetRemaining < 0 ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {formatKRW(summary.budgetRemaining)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {summary.budgetRemaining > 0 ? (
              <>
                하루 권장 지출{' '}
                <span className="font-mono font-medium text-teal-800 tabular-nums">
                  {formatKRW(summary.dailyRecommendedBudget)}
                </span>
              </>
            ) : (
              <span>목표 예산 대비 초과 상태입니다</span>
            )}
          </p>
        </div>
      </section>


      {/* Requirement 5: Overspending & Savings Potential Report Banner */}
      {overspending.count > 0 && (
        <section
          aria-label="한 달 과소비 절약 분석 리포트"
          className="rounded-xl border border-rose-200 bg-rose-50/70 p-5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-rose-950">
                    {yearMonthLabel} 과소비 진단 리포트 · 총 {overspending.count}건 ({formatKRW(overspending.totalAmount)})
                  </h2>
                  <span className="rounded bg-rose-200/80 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                    지출의 {overspending.shareOfExpense.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-900 leading-relaxed">
                  💡 <strong>만약 이번 달 과소비를 줄였다면?</strong> 총{' '}
                  <span className="font-mono font-bold text-rose-950 tabular-nums">
                    {formatKRW(overspending.potentialSavings)}
                  </span>
                  원을 아낄 수 있었으며, 저축률이 기존 {summary.savingsRate.toFixed(1)}%에서{' '}
                  <span className="font-mono font-bold text-emerald-800 tabular-nums">
                    {overspending.potentialSavingsRate.toFixed(1)}%
                  </span>
                  로 상승할 수 있었습니다!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOverspendingDetail(!showOverspendingDetail)}
              className="inline-flex items-center gap-1.5 self-start rounded-lg border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-900 transition-colors hover:bg-rose-100 whitespace-nowrap shadow-2xs"
            >
              <span>{showOverspendingDetail ? '내역 접기' : '과소비 항목 확인'}</span>
            </button>
          </div>

          {/* Requirement 7: 과소비 내역 보여줄 때는 어디 영역에서 많이 과소비가 발생했는지 도넛표에 나타내기 */}
          {overspendingCategories.length > 0 && (
            <div className="mt-4 pt-3 border-t border-rose-200/80">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs">
                <span className="font-bold text-rose-950 flex items-center gap-1.5">
                  <span>과소비 발생 영역별 분포 (도넛 차트)</span>
                </span>
                <span className="text-[11px] text-rose-800 font-medium">
                  최다 과소비 발생 영역: <strong className="font-bold underline text-rose-950">{overspendingCategories[0]?.label}</strong> ({overspendingCategories[0]?.sharePercent.toFixed(1)}%)
                </span>
              </div>
              <OverspendingDonutChart
                items={overspendingCategories}
                totalOverspending={overspending.totalAmount}
                onSelectCategory={onFilterByCategory}
              />
            </div>
          )}

          {/* Overspending items detailed table */}
          {showOverspendingDetail && (
            <div className="mt-4 pt-4 border-t border-rose-200/80">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-rose-200 text-[11px] font-bold text-rose-800">
                      <th className="py-2 pr-3 min-w-[90px] whitespace-nowrap">날짜</th>
                      <th className="py-2 px-3 min-w-[160px]">과소비 내역명</th>
                      <th className="py-2 px-3 min-w-[140px] whitespace-nowrap">카테고리 / 출금통장</th>
                      <th className="py-2 px-3 text-right min-w-[90px] whitespace-nowrap">금액</th>
                      <th className="py-2 pl-3 min-w-[100px]">메모</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100">
                    {overspending.items.map((tx) => (
                      <tr key={tx.id} className="hover:bg-rose-100/50">
                        <td className="py-2 pr-3 font-mono text-rose-900 tabular-nums whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="py-2 px-3 font-semibold text-rose-950 break-keep min-w-[160px]">
                          {tx.title}
                        </td>
                        <td className="py-2 px-3 text-rose-800">
                          {catMap.get(tx.categoryId)?.label ?? tx.categoryId} ·{' '}
                          {accMap.get(tx.accountId)?.accountName ?? tx.paymentMethod}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-900 tabular-nums whitespace-nowrap">
                          -{formatKRW(tx.amount)}
                        </td>
                        <td className="py-2 pl-3 text-rose-700 italic">
                          {tx.memo || '충동구매 / 불필요 지출'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Requirement: 대시보드 일별 수입(초록)·지출(빨강) 달력 및 화살표 이동 */}
      <FinancialCalendar
        yearMonth={yearMonth}
        transactions={allTransactions}
        today={defaultDate}
        onChangeYearMonth={onChangeYearMonth}
        onEditTransaction={onEditTransaction}
        onDeleteTransaction={onDeleteTransaction}
        onAddTransactionForDate={onOpenAddModalForDate}
      />

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                카테고리별 지출 구성
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                항목을 클릭하면 해당 카테고리의 거래 내역으로 바로 필터링됩니다
              </p>
            </div>
          </div>

          <CategoryDonutChart
            items={categoryBreakdown}
            totalExpense={summary.totalExpense}
            onSelectCategory={onFilterByCategory}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              일별 지출 추이 및 누적 속도
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              일자별 지출 막대와 월 목표 예산 대비 누적 지출 곡선을 비교합니다
            </p>
          </div>

          <DailySpendingChart
            dailyItems={dailyCashflow}
            totalBudget={summary.totalBudget}
          />
        </section>
      </div>
    </div>
  );
};
