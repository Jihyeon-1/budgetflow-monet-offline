export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income',
}

export enum BudgetHealth {
  NOMINAL = 'nominal',
  WARNING = 'warning',
  EXCEEDED = 'exceeded',
}

export type AssetType = 'stock' | 'fund' | 'etf' | 'bond' | 'deposit' | 'savings';

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string; // e.g. "110-***-123456"
  balance: number;
  color: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  label: string;
  type: TransactionType;
  color: string;
  isFixedDefault?: boolean;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  categoryId: string;
  title: string;
  amount: number; // positive integer KRW
  accountId: string; // BankAccount id (출금계좌 or 입금계좌)
  paymentMethod: string; // "계좌이체", "신한카드", "체크카드", "현금" etc.
  isFixed?: boolean;
  isOverspending?: boolean; // 과소비 / 충동구매 플래그
  incomeSource?: string; // 수입 출처 (예: "주식회사 알파 급여", "외주 자문료", "배당금")
  memo?: string;
}

export interface InvestmentPurchaseRecord {
  date: string; // YYYY-MM-DD
  amount: number; // 구매 금액 (원)
  priceAtDate: number; // 그 날의 기준가 / 1주당 가격
  units: number; // 취득 좌수 또는 주수
  note?: string;
}

export interface InvestmentAsset {
  id: string;
  name: string;
  symbol?: string; // 종목코드
  type: AssetType; // 'stock' | 'fund' | 'etf' | 'bond' | 'deposit' | 'savings'
  investedAmount: number; // 매수 원금 (원래 넣은 금액)
  currentPrice: number; // 현재 1주/좌당 단가 또는 평가금액
  currentValuation: number; // 현재 평가금액
  returnRate: number; // 수익률 (%)
  dailyChangeRate: number; // 오늘 12시 변동률 (%)
  lastUpdated: string; // '2026-10-24 12:00:00'
  memo?: string;

  // 주식 / ETF 네이버 증권 연동 필드
  sharesCount?: number; // 내가 구매한 보유 주식 수 (몇 주)
  purchaseUnitPrice?: number; // 1주당 매수 단가 (원)
  currentUnitPrice?: number; // 1주당 현재가 (원)
  naverCode?: string; // 네이버 금융 6자리 종목코드 (예: "005930")
  naverMarket?: 'KOSPI' | 'KOSDAQ' | 'ETF' | 'GLOBAL';

  // 펀드 지정일 정기 구매 필드
  scheduledDay?: number; // 매월 지정 구매일 (예: 10일, 25일)
  scheduledAmount?: number; // 매월 지정일에 구매할 금액 (원)
  fundNav?: number; // 펀드 기준가격 (1,000좌당 기준가 또는 1좌당 가격)
  accumulatedUnits?: number; // 지금까지 취득한 총 누적 좌수
  purchaseHistory?: InvestmentPurchaseRecord[]; // 지정일 회차별 구매 이력

  // 예금 / 적금 분석 필드
  interestRate?: number; // 연 이자율 (%)
  termMonths?: number; // 가입 기간 (개월)
  monthlyDeposit?: number; // 적금인 경우 매월 납입액 (원)
  bankName?: string; // 가입 금융기관 (예: 신한은행, 토스뱅크 등)
  startDate?: string; // 가입일
  maturityDate?: string; // 만기일
  isTaxFree?: boolean; // 비과세 여부 (일반과세 15.4% 공제 여부)
  accruedInterest?: number; // 현재까지 발생한 경과 이자
  maturityAmount?: number; // 만기 예상 수령액 (원금 + 세후 이자)
  sourceAccountId?: string; // 예금 가입 시 출금된 통장 ID
  payoutAccountId?: string; // 만기 시 원리금을 수령할 통장 ID
}

export type CategoryBudgetMap = Record<string, number>;

export interface MonthlySummary {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  savingsRate: number;
  totalBudget: number;
  budgetRemaining: number;
  budgetUtilization: number;
  budgetHealth: BudgetHealth;
  dailyRecommendedBudget: number;
  transactionCount: number;
}

export interface OverspendingSummary {
  count: number;
  totalAmount: number;
  shareOfExpense: number; // % of total monthly expense
  potentialSavings: number; // 절약 가능했던 금액
  potentialSavingsRate: number; // 과소비 제외 시 저축률
  items: Transaction[];
}

export interface PortfolioSummary {
  totalInvested: number; // 총 매수 원금
  totalValuation: number; // 총 현재 평가금액
  totalProfit: number; // 총 평가손익 (KRW)
  totalReturnRate: number; // 총 수익률 (%)
  assetAllocation: {
    type: AssetType;
    label: string;
    amount: number;
    sharePercent: number;
    color: string;
  }[];
  lastUpdated: string;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  label: string;
  color: string;
  amount: number;
  sharePercent: number;
  count: number;
}

export interface BudgetStatusItem {
  categoryId: string;
  label: string;
  color: string;
  budget: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
  health: BudgetHealth;
  statusLabel: string;
}

export interface DailyCashflowItem {
  day: number;
  date: string;
  expense: number;
  income: number;
  cumulativeExpense: number;
}

export interface TransactionFilterOptions {
  yearMonth?: string;
  type?: 'all' | TransactionType;
  categoryId?: 'all' | string;
  accountId?: 'all' | string;
  overspendingOnly?: boolean;
  searchQuery?: string;
  sortBy?: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface CalendarDayItem {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  income: number;
  expense: number;
  net: number;
  hasOverspending: boolean;
  transactions: Transaction[];
}

export type ActiveTab =
  | 'dashboard'
  | 'transactions'
  | 'budgets'
  | 'investments'
  | 'settings';
