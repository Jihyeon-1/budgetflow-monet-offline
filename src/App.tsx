import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  HardDriveDownload,
  Building2,
  ChevronLeft,
  ChevronRight,
  Flame,
  LayoutDashboard,
  ListOrdered,
  Menu,
  Plus,
  Settings,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { BudgetsView } from './components/BudgetsView';
import { DashboardView } from './components/DashboardView';
import { InvestmentView } from './components/InvestmentView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsView } from './components/TransactionsView';
import {
  DEFAULT_ANCHOR_MONTH,
  DEFAULT_TODAY,
  INITIAL_BUDGETS,
  INITIAL_CATEGORIES,
} from './data/seedData';
import {
  ActiveTab,
  BankAccount,
  Category,
  CategoryBudgetMap,
  InvestmentAsset,
  Transaction,
  TransactionType,
} from './types/ledger';
import {
  calculateBudgetStatuses,
  calculateCategoryBreakdown,
  calculateDailyCashflow,
  calculateMonthlySummary,
  calculateOverspendingSummary,
  calculatePortfolioSummary,
  filterTransactions,
  formatKRW,
  formatYearMonthLabel,
  shiftYearMonth,
  simulateDailyPriceUpdate,
} from './utils/ledgerMath';

const STORAGE_KEYS = {
  TRANSACTIONS: 'budgetflow_txs_v3',
  ACCOUNTS: 'budgetflow_accounts_v3',
  CATEGORIES: 'budgetflow_categories_v3',
  INVESTMENTS: 'budgetflow_investments_v3',
  BUDGETS: 'budgetflow_budgets_v3',
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key);
    if (val) return JSON.parse(val);
  } catch {
    // fallback
  }
  return fallback;
}

const NAV_ITEMS: {
  id: ActiveTab;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'transactions', label: '거래 내역', icon: ListOrdered },
  { id: 'budgets', label: '예산 관리', icon: Wallet },
  { id: 'investments', label: '투자 분석', icon: TrendingUp },
  { id: 'settings', label: '통장 · 카테고리 설정', icon: Settings },
];

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadStorage(STORAGE_KEYS.TRANSACTIONS, [] as Transaction[])
  );
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() =>
    loadStorage(STORAGE_KEYS.ACCOUNTS, [] as BankAccount[])
  );
  const [categories, setCategories] = useState<Category[]>(() =>
    loadStorage(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
  );
  const [investments, setInvestments] = useState<InvestmentAsset[]>(() =>
    loadStorage(STORAGE_KEYS.INVESTMENTS, [] as InvestmentAsset[])
  );
  const [budgets, setBudgets] = useState<CategoryBudgetMap>(() =>
    loadStorage(STORAGE_KEYS.BUDGETS, {} as CategoryBudgetMap)
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [yearMonth, setYearMonth] = useState<string>(DEFAULT_ANCHOR_MONTH);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Filters for Transactions view
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [overspendingOnly, setOverspendingOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<
    'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  >('date_desc');

  // 기기 저장 전용: 로그인이나 클라우드 서버에 연결하지 않습니다.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('기기 저장 실패:', error);
      setStatusNotice('저장 공간이 부족합니다. 설정에서 백업해 주세요.');
    }
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    if (!statusNotice) return;
    const t = setTimeout(() => setStatusNotice(null), 3000);
    return () => clearTimeout(t);
  }, [statusNotice]);

  // Derived summaries
  const yearMonthLabel = useMemo(
    () => formatYearMonthLabel(yearMonth),
    [yearMonth]
  );

  const monthlySummary = useMemo(
    () =>
      calculateMonthlySummary(transactions, yearMonth, budgets, DEFAULT_TODAY),
    [transactions, yearMonth, budgets]
  );

  const overspendingSummary = useMemo(
    () => calculateOverspendingSummary(transactions, yearMonth),
    [transactions, yearMonth]
  );

  const portfolioSummary = useMemo(
    () => calculatePortfolioSummary(investments),
    [investments]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, yearMonth, categories),
    [transactions, yearMonth, categories]
  );

  const budgetStatuses = useMemo(
    () =>
      calculateBudgetStatuses(transactions, yearMonth, budgets, categories),
    [transactions, yearMonth, budgets, categories]
  );

  const dailyCashflow = useMemo(
    () => calculateDailyCashflow(transactions, yearMonth),
    [transactions, yearMonth]
  );

  const recentMonthTransactions = useMemo(
    () =>
      filterTransactions(
        transactions,
        { yearMonth, sortBy: 'date_desc' },
        categories,
        bankAccounts
      ),
    [transactions, yearMonth, categories, bankAccounts]
  );

  const filteredTransactions = useMemo(
    () =>
      filterTransactions(
        transactions,
        {
          yearMonth,
          type: typeFilter,
          categoryId: categoryFilter,
          accountId: accountFilter,
          overspendingOnly,
          searchQuery,
          sortBy,
        },
        categories,
        bankAccounts
      ),
    [
      transactions,
      yearMonth,
      typeFilter,
      categoryFilter,
      accountFilter,
      overspendingOnly,
      searchQuery,
      sortBy,
      categories,
      bankAccounts,
    ]
  );

  // Transaction Actions
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id'>,
    existingId?: string
  ) => {
    if (existingId) {
      const updatedTx: Transaction = { ...txData, id: existingId };
      setTransactions((prev) =>
        prev.map((t) => (t.id === existingId ? updatedTx : t))
      );
      setStatusNotice(`'${txData.title}' 내역이 수정되었습니다.`);
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      setTransactions((prev) => [newTx, ...prev]);

      // Automatically sync bank account balance!
      setBankAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === txData.accountId) {
            const delta =
              txData.type === TransactionType.INCOME
                ? txData.amount
                : -txData.amount;
            return { ...acc, balance: acc.balance + delta };
          }
          return acc;
        })
      );

      const txYM = txData.date.slice(0, 7);
      if (txYM !== yearMonth) setYearMonth(txYM);

      setStatusNotice(
        `'${txData.title}' (${formatKRW(txData.amount)}) 등록 완료!`
      );
    }
  };

  const handleDeleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Revert bank account balance
    setBankAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === target.accountId) {
          const delta =
            target.type === TransactionType.INCOME
              ? -target.amount
              : target.amount;
          return { ...acc, balance: acc.balance + delta };
        }
        return acc;
      })
    );

    setStatusNotice(`'${target.title}' 거래가 삭제되었습니다.`);
  };

  // Investment 12:00 price update simulator
  const handleUpdatePrices = () => {
    const now = new Date();
    const updated = simulateDailyPriceUpdate(
      investments,
      `${now.toISOString().slice(0, 10)} 12:00:00`
    );
    setInvestments(updated);
    setStatusNotice('매일 12시 기준 주식(삼성전자 포함), 펀드 기준가 및 예·적금 이자가 자동 갱신되었습니다.');
  };

  const handleSellAsset = (
    asset: InvestmentAsset,
    sellProceeds: number,
    realizedProfit: number,
    targetAccountId: string,
    soldShares?: number
  ) => {
    const today = DEFAULT_TODAY;
    const isProfit = realizedProfit > 0;
    const isLoss = realizedProfit < 0;

    // Requirement:
    // 이익이 나면 자동으로 수익에 반영되게 하고 손해가 나면 지출 내역에 반영되게 해줘
    if (isProfit) {
      const profitTx: Transaction = {
        id: `tx-sell-profit-${Date.now()}`,
        date: today,
        type: TransactionType.INCOME,
        categoryId: 'cat-dividend',
        title: `[${asset.name}] 매도 실현수익`,
        amount: Math.round(realizedProfit),
        accountId: targetAccountId,
        paymentMethod: '자산 매도 결제',
        incomeSource: `${asset.name} 매도 실현이익`,
        memo: `매도 총 대금: ${formatKRW(sellProceeds)}, 매수 원금: ${formatKRW(sellProceeds - realizedProfit)}`,
      };
      setTransactions((prev) => [profitTx, ...prev]);
    } else if (isLoss) {
      const lossTx: Transaction = {
        id: `tx-sell-loss-${Date.now()}`,
        date: today,
        type: TransactionType.EXPENSE,
        categoryId: 'cat-investment-loss',
        title: `[${asset.name}] 매도 실현손실`,
        amount: Math.round(Math.abs(realizedProfit)),
        accountId: targetAccountId,
        paymentMethod: '자산 매도 결제',
        memo: `매도 총 대금: ${formatKRW(sellProceeds)}, 매수 원금: ${formatKRW(sellProceeds - realizedProfit)}`,
        isOverspending: false,
      };
      setTransactions((prev) => [lossTx, ...prev]);
    }

    // 통장 잔액에 매도 총 대금 합산 입금
    setBankAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === targetAccountId) {
          return { ...acc, balance: acc.balance + sellProceeds };
        }
        return acc;
      })
    );

    // 자산 포트폴리오 업데이트 (전량 매도 vs 부분 매도)
    const isFullSale = !soldShares || !asset.sharesCount || soldShares >= asset.sharesCount;
    if (isFullSale) {
      setInvestments((prev) => prev.filter((i) => i.id !== asset.id));
    } else {
      const totalShares = asset.sharesCount ?? 1;
      const remainingShares = Math.max(0, totalShares - soldShares);
      const ratio = remainingShares / totalShares;
      const newInvested = Math.round(asset.investedAmount * ratio);
      const unitPrice = asset.currentUnitPrice ?? asset.currentPrice;
      const newValuation = Math.round(unitPrice * remainingShares);
      const newProfit = newValuation - newInvested;
      const newReturn = newInvested > 0 ? Math.round((newProfit / newInvested) * 1000) / 10 : 0;

      setInvestments((prev) =>
        prev.map((i) =>
          i.id === asset.id
            ? {
                ...i,
                sharesCount: remainingShares,
                investedAmount: newInvested,
                currentValuation: newValuation,
                returnRate: newReturn,
              }
            : i
        )
      );
    }

    const targetBankName = bankAccounts.find((a) => a.id === targetAccountId)?.bankName ?? '통장';
    if (isProfit) {
      setStatusNotice(
        `'${asset.name}' 매도 완료! 이익 ${formatKRW(realizedProfit)}이 수입에 자동 등록되었으며, ${targetBankName}에 매도대금 ${formatKRW(sellProceeds)}이 입금되었습니다.`
      );
    } else if (isLoss) {
      setStatusNotice(
        `'${asset.name}' 매도 완료! 손실 ${formatKRW(Math.abs(realizedProfit))}이 지출에 자동 등록되었으며, ${targetBankName}에 환급대금 ${formatKRW(sellProceeds)}이 입금되었습니다.`
      );
    } else {
      setStatusNotice(
        `'${asset.name}' 원금 회수 완료! ${targetBankName}에 ${formatKRW(sellProceeds)}이 입금되었습니다.`
      );
    }
  };

  const handleAddAsset = (asset: Omit<InvestmentAsset, 'id' | 'lastUpdated'>) => {
    const newAsset: InvestmentAsset = {
      ...asset,
      id: `inv-${Date.now()}`,
      lastUpdated: `${DEFAULT_TODAY} 12:00:00`,
    };

    // Requirement 5: 예금 가입 시 선택한 통장에서 원금 출금 차감 및 거래 내역 자동 기록
    if (asset.sourceAccountId && asset.investedAmount > 0) {
      const sourceAcc = bankAccounts.find((a) => a.id === asset.sourceAccountId);
      setBankAccounts((prev) =>
        prev.map((acc) =>
          acc.id === asset.sourceAccountId
            ? { ...acc, balance: Math.max(0, acc.balance - asset.investedAmount) }
            : acc
        )
      );

      const withdrawalTx: Transaction = {
        id: `tx-dep-${Date.now()}`,
        date: DEFAULT_TODAY,
        type: TransactionType.EXPENSE,
        categoryId: 'cat-savings', // 저축/투자 카테고리
        title: `[예·적금 가입] ${asset.name}`,
        amount: asset.investedAmount,
        accountId: asset.sourceAccountId,
        paymentMethod: '계좌이체',
        isFixed: false,
        isOverspending: false,
        memo: `출금통장(${sourceAcc?.accountName ?? '통장'})에서 원금 출금 예치`,
      };
      setTransactions((prev) => [withdrawalTx, ...prev]);
    }

    setInvestments((prev) => {
      const next = [...prev, newAsset];
      return next;
    });

    setStatusNotice(`'${asset.name}' 자산이 성공적으로 추가되었습니다.`);
  };

  const handleEditAsset = (asset: InvestmentAsset) => {
    setInvestments((prev) => {
      const next = prev.map((a) => (a.id === asset.id ? asset : a));
      return next;
    });
    setStatusNotice(`'${asset.name}' 정보가 수정되었습니다.`);
  };

  const handleDeleteAsset = (id: string) => {
    const target = investments.find((i) => i.id === id);
    setInvestments((prev) => {
      const next = prev.filter((i) => i.id !== id);
      return next;
    });
    if (target) setStatusNotice(`'${target.name}' 자산이 삭제되었습니다.`);
  };

  // Bank Accounts Management
  const handleAddAccount = (acc: Omit<BankAccount, 'id'>) => {
    const newAcc: BankAccount = { ...acc, id: `acc-${Date.now()}` };
    setBankAccounts((prev) => {
      const next = [...prev, newAcc];
      return next;
    });
    setStatusNotice(`'${acc.accountName}' 통장이 새로 등록되었습니다.`);
  };

  const handleEditAccount = (acc: BankAccount) => {
    setBankAccounts((prev) => {
      const next = prev.map((a) => (a.id === acc.id ? acc : a));
      return next;
    });
    setStatusNotice(`'${acc.accountName}' 정보가 수정되었습니다.`);
  };

  const handleDeleteAccount = (id: string) => {
    const target = bankAccounts.find((a) => a.id === id);
    setBankAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      return next;
    });
    if (target) setStatusNotice(`'${target.accountName}' 통장이 삭제되었습니다.`);
  };

  // Categories Management
  const handleAddCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = { ...cat, id: `cat-${Date.now()}` };
    setCategories((prev) => {
      const next = [...prev, newCat];
      return next;
    });
    setStatusNotice(`'${cat.label}' 카테고리가 새로 추가되었습니다.`);
  };

  const handleEditCategory = (cat: Category) => {
    setCategories((prev) => {
      const next = prev.map((c) => (c.id === cat.id ? cat : c));
      return next;
    });
    setStatusNotice(`'${cat.label}' 카테고리가 수정되었습니다.`);
  };

  const handleDeleteCategory = (id: string) => {
    const target = categories.find((c) => c.id === id);
    setCategories((prev) => {
      const next = prev.filter((c) => c.id !== id);
      return next;
    });
    if (target) setStatusNotice(`'${target.label}' 카테고리가 삭제되었습니다.`);
  };

  // Budget management
  const handleUpdateCategoryBudget = (catId: string, amount: number) => {
    setBudgets((prev) => {
      const next = { ...prev, [catId]: amount };
      return next;
    });
    setStatusNotice('예산 한도가 수정되었습니다.');
  };

  const handleApplyRecommendedBudgets = () => {
    const prevMonth = shiftYearMonth(yearMonth, -1);
    const prevTxs = transactions.filter(
      (tx) => tx.date.startsWith(prevMonth) && tx.type === TransactionType.EXPENSE
    );
    const nextBudgets: CategoryBudgetMap = { ...budgets };
    categories
      .filter((c) => c.type === TransactionType.EXPENSE)
      .forEach((cat) => {
        const spent = prevTxs
          .filter((tx) => tx.categoryId === cat.id)
          .reduce((s, tx) => s + tx.amount, 0);
        if (spent > 0) {
          nextBudgets[cat.id] = Math.max(
            50000,
            Math.round((spent * 1.05) / 10000) * 10000
          );
        }
      });
    setBudgets(nextBudgets);
    setStatusNotice('전월 지출 실적 기준으로 예산이 자동 배분되었습니다.');
  };

  const handleResetDefaultBudgets = () => {
    setBudgets(INITIAL_BUDGETS);
    setStatusNotice('카테고리 예산이 기본값으로 초기화되었습니다.');
  };

  const handleDrilldownCategory = (catId: string) => {
    setTypeFilter(TransactionType.EXPENSE);
    setCategoryFilter(catId);
    setActiveTab('transactions');
  };

  const currentTabLabel =
    NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? '대시보드';

  return (
    <div className="flex min-h-screen text-slate-900">
      {/* Desktop Sticky Sidebar Navigation */}
      <aside
        aria-label="주요 메뉴"
        className="hidden w-[252px] shrink-0 flex-col border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen"
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
            }}
            className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
              BF
            </div>
            <span>BudgetFlow</span>
          </a>
        </div>

        <nav className="flex-1 space-y-1 p-4" aria-label="화면 전환">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Overspending Alert badge in sidebar */}
        {overspendingSummary.count > 0 && (
          <div className="mx-4 mb-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
              <Flame className="h-3.5 w-3.5 text-rose-600 fill-rose-600" />
              <span>이번 달 과소비 {overspendingSummary.count}건</span>
            </div>
            <p className="mt-1 font-mono text-xs font-bold text-rose-950 tabular-nums">
              {formatKRW(overspendingSummary.totalAmount)}
            </p>
            <p className="mt-0.5 text-[10px] text-rose-700">
              아꼈다면 저축률 {overspendingSummary.potentialSavingsRate.toFixed(1)}% 가능
            </p>
          </div>
        )}

        {/* Sidebar Monthly Quick Budget Meter */}
        <div className="monet-poppy-strip mx-4" aria-hidden="true" />
        <div className="border-t border-slate-200 p-5">
          <p className="text-xs font-semibold text-slate-500">
            {yearMonthLabel} 잔여 예산
          </p>
          <p
            className={`mt-1 font-mono text-lg font-bold tabular-nums ${
              monthlySummary.budgetRemaining < 0
                ? 'text-rose-700'
                : 'text-slate-900'
            }`}
          >
            {formatKRW(monthlySummary.budgetRemaining)}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-[2px] bg-slate-100">
            <div
              className={`h-full rounded-[2px] ${
                monthlySummary.budgetRemaining < 0
                  ? 'bg-rose-600'
                  : 'bg-teal-700'
              }`}
              style={{
                width: `${Math.min(100, Math.max(0, monthlySummary.budgetUtilization))}%`,
              }}
            />
          </div>
          <p className="mt-1.5 font-mono text-[11px] text-slate-500 tabular-nums">
            소진율 {monthlySummary.budgetUtilization.toFixed(1)}%
          </p>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
              <span className="font-bold text-slate-900">BudgetFlow</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar with Prominent Settings Button & Navigation */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:h-16 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="메뉴 열기"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 text-sm whitespace-nowrap">
              <span className="font-bold text-slate-900 lg:font-semibold lg:text-slate-500">
                BudgetFlow
              </span>
              <span aria-hidden="true" className="text-slate-300">/</span>
              <span className="font-bold text-slate-900">{currentTabLabel}</span>
            </div>

            {/* Quick Header Nav Links for Tablet/Desktop (설정 버튼 제외) */}
            <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-slate-200 pl-4" aria-label="상단 빠른 이동">
              {NAV_ITEMS.filter((item) => item.id !== 'settings').map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* 완전 오프라인 모드 표시 */}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50/80 px-3 py-1.5 text-xs font-bold text-teal-900 whitespace-nowrap"
              title="이 기기에만 저장됩니다. 설정에서 백업 파일을 보관하세요."
            >
              <HardDriveDownload className="h-3.5 w-3.5" />
              <span>기기 저장 · 백업</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTx(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 sm:px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 whitespace-nowrap shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>새 거래 기록</span>
            </button>
          </div>
        </header>

        {/* Workspace Toolbar: Month Switcher */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 sm:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {yearMonthLabel} {currentTabLabel}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                수입 출처와 입금 통장을 기록하고, 과소비 절약 분석과 12시 투자 시세를 확인합니다.
              </p>
            </div>

            {/* Month Switcher Control */}
            <div className="inline-flex items-center self-start rounded-lg border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setYearMonth((ym) => shiftYearMonth(ym, -1))}
                aria-label="이전 달"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 font-mono text-xs font-bold text-slate-900 tabular-nums whitespace-nowrap">
                {yearMonthLabel}
              </span>
              <button
                type="button"
                onClick={() => setYearMonth((ym) => shiftYearMonth(ym, 1))}
                aria-label="다음 달"
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              {yearMonth !== DEFAULT_ANCHOR_MONTH && (
                <button
                  type="button"
                  onClick={() => setYearMonth(DEFAULT_ANCHOR_MONTH)}
                  className="ml-1 rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 whitespace-nowrap"
                >
                  이번 달
                </button>
              )}
            </div>
          </div>

          {/* Toast Notice */}
          {statusNotice && (
            <div
              role="status"
              className="mb-5 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs font-semibold text-teal-900"
            >
              <span>{statusNotice}</span>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                className="ml-3 text-teal-700 hover:text-teal-950"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              summary={monthlySummary}
              overspending={overspendingSummary}
              categoryBreakdown={categoryBreakdown}
              dailyCashflow={dailyCashflow}
              budgetStatuses={budgetStatuses}
              recentTransactions={recentMonthTransactions}
              allTransactions={transactions}
              bankAccounts={bankAccounts}
              categories={categories}
              portfolio={portfolioSummary}
              investments={investments}
              yearMonth={yearMonth}
              yearMonthLabel={yearMonthLabel}
              defaultDate={yearMonth === DEFAULT_ANCHOR_MONTH ? DEFAULT_TODAY : `${yearMonth}-01`}
              onChangeYearMonth={(ym) => setYearMonth(ym)}
              onAddTransaction={handleSaveTransaction}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setIsModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onFilterByCategory={handleDrilldownCategory}
              onOpenAddModalForDate={() => {
                setEditingTx(null);
                setIsModalOpen(true);
              }}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              yearMonthLabel={yearMonthLabel}
              filteredTransactions={filteredTransactions}
              categories={categories}
              bankAccounts={bankAccounts}
              typeFilter={typeFilter}
              categoryFilter={categoryFilter}
              accountFilter={accountFilter}
              overspendingOnly={overspendingOnly}
              searchQuery={searchQuery}
              sortBy={sortBy}
              onChangeTypeFilter={setTypeFilter}
              onChangeCategoryFilter={setCategoryFilter}
              onChangeAccountFilter={setAccountFilter}
              onToggleOverspendingOnly={() => setOverspendingOnly(!overspendingOnly)}
              onChangeSearchQuery={setSearchQuery}
              onChangeSortBy={setSortBy}
              onResetFilters={() => {
                setTypeFilter('all');
                setCategoryFilter('all');
                setAccountFilter('all');
                setOverspendingOnly(false);
                setSearchQuery('');
                setSortBy('date_desc');
              }}
              onOpenAddModal={() => {
                setEditingTx(null);
                setIsModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setIsModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              yearMonthLabel={yearMonthLabel}
              summary={monthlySummary}
              overspending={overspendingSummary}
              budgetStatuses={budgetStatuses}
              categories={categories}
              onUpdateCategoryBudget={handleUpdateCategoryBudget}
              onApplyRecommendedBudgets={handleApplyRecommendedBudgets}
              onResetDefaultBudgets={handleResetDefaultBudgets}
            />
          )}

          {activeTab === 'investments' && (
            <InvestmentView
              portfolio={portfolioSummary}
              investments={investments}
              bankAccounts={bankAccounts}
              onUpdatePrices={handleUpdatePrices}
              onAddAsset={handleAddAsset}
              onEditAsset={handleEditAsset}
              onDeleteAsset={handleDeleteAsset}
              onSellAsset={handleSellAsset}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              bankAccounts={bankAccounts}
              categories={categories}
              onAddAccount={handleAddAccount}
              onEditAccount={handleEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              backupData={{transactions, bankAccounts, categories, investments, budgets}}
              onRestoreData={(data) => {
                setTransactions(data.transactions);
                setBankAccounts(data.bankAccounts);
                setCategories(data.categories);
                setInvestments(data.investments);
                setBudgets(data.budgets);
                setStatusNotice('백업 복원 완료! 모든 데이터가 기기에 저장됩니다.');
              }}
            />
          )}
        </main>

        <footer className="border-t border-slate-200 bg-white px-4 py-4 text-xs text-slate-500 sm:px-8 mb-16 lg:mb-0">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2">
            <span>BudgetFlow · 스마트 가계부, 통장 관리 & 투자 포트폴리오</span>
            <span>데이터는 이 기기에만 저장됩니다 · 정기적으로 백업해 주세요</span>
          </div>
        </footer>

        {/* Mobile Bottom Navigation Bar (Always visible on mobile) */}
        <nav
          aria-label="모바일 하단 내비게이션"
          className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md lg:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 px-2 py-1 text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'text-teal-800'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    isActive ? 'bg-teal-50 text-teal-800' : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.id === 'settings' ? '설정' : item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        defaultDate={yearMonth === DEFAULT_ANCHOR_MONTH ? DEFAULT_TODAY : `${yearMonth}-01`}
        editingTransaction={editingTx}
        categories={categories}
        bankAccounts={bankAccounts}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
      />

    </div>
  );
}
