import {
  BankAccount,
  Category,
  CategoryBudgetMap,
  InvestmentAsset,
  Transaction,
  TransactionType,
} from '../types/ledger';

export function getSystemTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getSystemYearMonthString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export const DEFAULT_ANCHOR_MONTH = getSystemYearMonthString();
export const DEFAULT_TODAY = getSystemTodayString();

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc-shinhan',
    bankName: '신한은행',
    accountName: '주거래 급여·생활비 통장',
    accountNumber: '110-394-182940',
    balance: 3420000,
    color: '#6d98cf', // sky
    isDefault: true,
  },
  {
    id: 'acc-toss',
    bankName: '토스뱅크',
    accountName: '모으기 파킹통장 (비상금)',
    accountNumber: '1000-4829-1920',
    balance: 8500000,
    color: '#5a78c8', // blue
  },
  {
    id: 'acc-kb',
    bankName: 'KB국민은행',
    accountName: '주택청약 종합저축 & 정기예금',
    accountNumber: '4028-19-029481',
    balance: 12000000,
    color: '#d9a92a', // amber
  },
  {
    id: 'acc-mirae',
    bankName: '미래에셋증권',
    accountName: 'CMA-RP 네이버통장 (투자예수금)',
    accountNumber: '201-92-184920',
    balance: 5180000,
    color: '#345793', // teal
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  // 지출 카테고리
  { id: 'cat-food', label: '외식 · 카페', type: TransactionType.EXPENSE, color: '#345793' },
  { id: 'cat-groceries', label: '식료품 · 장보기', type: TransactionType.EXPENSE, color: '#6d98cf' },
  { id: 'cat-housing', label: '주거 · 통신 · 공과금', type: TransactionType.EXPENSE, color: '#575680', isFixedDefault: true },
  { id: 'cat-transport', label: '교통 · 차량', type: TransactionType.EXPENSE, color: '#5a78c8' },
  { id: 'cat-shopping', label: '쇼핑 · 생활용품', type: TransactionType.EXPENSE, color: '#d9a92a' },
  { id: 'cat-culture', label: '문화 · 여가 · 취미', type: TransactionType.EXPENSE, color: '#8b7cc8' },
  { id: 'cat-medical', label: '의료 · 건강', type: TransactionType.EXPENSE, color: '#5e924d' },
  { id: 'cat-education', label: '교육 · 자기계발', type: TransactionType.EXPENSE, color: '#9d9abf' },
  { id: 'cat-investment-loss', label: '투자 손실 · 매도 손해', type: TransactionType.EXPENSE, color: '#d95d44' },

  // 수입 카테고리
  { id: 'cat-salary', label: '급여 · 상여금', type: TransactionType.INCOME, color: '#4a7b3c' },
  { id: 'cat-side', label: '부수입 · 프리랜스', type: TransactionType.INCOME, color: '#7bac69' },
  { id: 'cat-dividend', label: '투자수익 · 배당금', type: TransactionType.INCOME, color: '#3f6aa8' },
  { id: 'cat-other-income', label: '용돈 · 기타입금', type: TransactionType.INCOME, color: '#6f6d96' },
];

export const INITIAL_BUDGETS: CategoryBudgetMap = {
  'cat-food': 450000,
  'cat-groceries': 380000,
  'cat-housing': 650000,
  'cat-transport': 180000,
  'cat-shopping': 250000,
  'cat-culture': 150000,
  'cat-medical': 120000,
  'cat-education': 120000,
};

export interface NaverStockPreset {
  code: string;
  name: string;
  market: 'KOSPI' | 'KOSDAQ' | 'ETF';
  currentUnitPrice: number; // 1주당 현재가 (원)
  yesterdayPrice: number;
  dailyChangeRate: number;
  category: string;
}

export const NAVER_STOCKS_CATALOG: NaverStockPreset[] = [
  { code: '005930', name: '삼성전자', market: 'KOSPI', currentUnitPrice: 213500, yesterdayPrice: 210000, dailyChangeRate: 1.67, category: '반도체' },
  { code: '000660', name: 'SK하이닉스', market: 'KOSPI', currentUnitPrice: 188000, yesterdayPrice: 184500, dailyChangeRate: 1.9, category: '반도체' },
  { code: '035420', name: 'NAVER', market: 'KOSPI', currentUnitPrice: 176500, yesterdayPrice: 175000, dailyChangeRate: 0.9, category: '인터넷' },
  { code: '005380', name: '현대차', market: 'KOSPI', currentUnitPrice: 245000, yesterdayPrice: 247000, dailyChangeRate: -0.8, category: '자동차' },
  { code: '035720', name: '카카오', market: 'KOSPI', currentUnitPrice: 41200, yesterdayPrice: 40800, dailyChangeRate: 1.0, category: '인터넷' },
  { code: '068270', name: '셀트리온', market: 'KOSPI', currentUnitPrice: 192000, yesterdayPrice: 190000, dailyChangeRate: 1.1, category: '바이오' },
  { code: '005490', name: 'POSCO홀딩스', market: 'KOSPI', currentUnitPrice: 362000, yesterdayPrice: 365000, dailyChangeRate: -0.8, category: '철강' },
  { code: '247540', name: '에코프로비엠', market: 'KOSDAQ', currentUnitPrice: 162500, yesterdayPrice: 158000, dailyChangeRate: 2.8, category: '2차전지' },
  { code: '360750', name: 'TIGER 미국S&P500', market: 'ETF', currentUnitPrice: 19500, yesterdayPrice: 19350, dailyChangeRate: 0.8, category: '해외ETF' },
  { code: '133690', name: 'TIGER 미국나스닥100', market: 'ETF', currentUnitPrice: 114000, yesterdayPrice: 112500, dailyChangeRate: 1.3, category: '해외ETF' },
  { code: '458730', name: 'ACE 미국배당다우존스', market: 'ETF', currentUnitPrice: 12800, yesterdayPrice: 12750, dailyChangeRate: 0.4, category: '배당ETF' },
  { code: '069500', name: 'KODEX 200', market: 'ETF', currentUnitPrice: 34200, yesterdayPrice: 34000, dailyChangeRate: 0.6, category: '국내ETF' },
];

export interface FundPreset {
  id: string;
  name: string;
  company: string;
  defaultNav: number; // 1,000좌당 기준가 (원)
  category: string;
}

export const FUND_PRESETS: FundPreset[] = [
  { id: 'fund-ai', name: '한국투자 글로벌AI빅테크 펀드', company: '한국투자신탁운용', defaultNav: 1080, category: '글로벌테크' },
  { id: 'fund-tdf', name: '미래에셋 평생소득 TDF2045 펀드', company: '미래에셋자산운용', defaultNav: 1260, category: '타깃데이트' },
  { id: 'fund-dividend', name: '신한 베스트 미국배당성장 펀드', company: '신한자산운용', defaultNav: 1150, category: '해외배당' },
  { id: 'fund-krindex', name: 'KB 코리아인덱스 증권투자신탁', company: 'KB자산운용', defaultNav: 1040, category: '국내주식형' },
  { id: 'fund-samsung-tdf', name: '삼성 한국형 TDF2050 펀드', company: '삼성자산운용', defaultNav: 1320, category: '타깃데이트' },
  { id: 'fund-kiwoom-semi', name: '키움 글로벌반도체 증권투자신탁', company: '키움투자자산운용', defaultNav: 1410, category: '반도체테크' },
  { id: 'fund-hanwha-esg', name: '한화 그린글로벌 ESG 펀드', company: '한화자산운용', defaultNav: 1120, category: 'ESG친환경' },
];

/**
 * 펀드 이름을 입력하면 실시간 기준가를 자동 매칭하거나 계산하여 반환
 */
export function lookupFundNavByName(name: string): { nav: number; company: string; matched: boolean } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { nav: 1000, company: '공모펀드', matched: false };
  }

  // 1. 직접 매칭 확인
  const exact = FUND_PRESETS.find((f) => f.name.toLowerCase() === trimmed.toLowerCase());
  if (exact) {
    return { nav: exact.defaultNav, company: exact.company, matched: true };
  }

  // 2. 부분 일치 확인
  const partial = FUND_PRESETS.find(
    (f) => f.name.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(f.name.toLowerCase())
  );
  if (partial) {
    return { nav: partial.defaultNav, company: partial.company, matched: true };
  }

  // 3. 키워드 기반 기준가 자동 추정
  let baseNav = 1100;
  if (trimmed.includes('AI') || trimmed.includes('반도체') || trimmed.includes('빅테크')) {
    baseNav = 1350;
  } else if (trimmed.includes('TDF')) {
    baseNav = 1250;
  } else if (trimmed.includes('배당') || trimmed.includes('인컴')) {
    baseNav = 1180;
  } else if (trimmed.includes('인덱스') || trimmed.includes('코스피')) {
    baseNav = 1050;
  } else {
    // 해시 기반 결정론적 기준가 (1000 ~ 1300원 사이)
    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = (hash * 31 + trimmed.charCodeAt(i)) % 300;
    }
    baseNav = 1000 + hash;
  }

  const company = trimmed.includes('미래에셋')
    ? '미래에셋자산운용'
    : trimmed.includes('삼성')
    ? '삼성자산운용'
    : trimmed.includes('KB')
    ? 'KB자산운용'
    : trimmed.includes('신한')
    ? '신한자산운용'
    : trimmed.includes('한국투자')
    ? '한국투자신탁운용'
    : '국내 공모 자산운용사';

  return { nav: baseNav, company, matched: true };
}

export interface DepositSavingsPreset {
  id: string;
  name: string;
  type: 'deposit' | 'savings';
  bankName: string;
  interestRate: number; // 연 %
  termMonths: number;
  monthlyDeposit?: number; // 적금일 경우 권장 월 불입액
  isTaxFree?: boolean;
}

export const DEPOSIT_SAVINGS_PRESETS: DepositSavingsPreset[] = [
  { id: 'pre-dep-1', name: '신한 쏠편한 정기예금', type: 'deposit', bankName: '신한은행', interestRate: 3.6, termMonths: 12 },
  { id: 'pre-dep-2', name: '토스뱅크 먼저 이자 받는 예금', type: 'deposit', bankName: '토스뱅크', interestRate: 3.55, termMonths: 6 },
  { id: 'pre-dep-3', name: 'KB Star 정기예금', type: 'deposit', bankName: 'KB국민은행', interestRate: 3.5, termMonths: 12 },
  { id: 'pre-sav-1', name: '토스뱅크 굴비 적금', type: 'savings', bankName: '토스뱅크', interestRate: 4.2, termMonths: 6, monthlyDeposit: 300000 },
  { id: 'pre-sav-2', name: '신한 청년 처음적금', type: 'savings', bankName: '신한은행', interestRate: 4.8, termMonths: 12, monthlyDeposit: 300000 },
  { id: 'pre-sav-3', name: 'KB 꿀적금', type: 'savings', bankName: 'KB국민은행', interestRate: 4.0, termMonths: 12, monthlyDeposit: 200000 },
];

export const INITIAL_INVESTMENTS: InvestmentAsset[] = [
  {
    id: 'inv-1',
    name: '삼성전자 (005930)',
    symbol: '005930',
    naverCode: '005930',
    naverMarket: 'KOSPI',
    type: 'stock',
    sharesCount: 90, // 내가 90주 구매
    purchaseUnitPrice: 68000, // 1주당 매수단가
    currentUnitPrice: 213500, // 현재 네이버 증권 1주당 단가 (213,500원)
    investedAmount: 6120000, // 원래 넣은 원금 (68,000 * 90 = 6,120,000원)
    currentPrice: 213500,
    currentValuation: 19215000, // 213,500 * 90 = 19,215,000원
    returnRate: 214.0, // ((19215000 - 6120000) / 6120000) * 100 = +214.0%
    dailyChangeRate: 1.67,
    lastUpdated: '2026-10-24 12:00:00',
    memo: '국내 대표 반도체 대형주 (네이버 증권 시세 213,500원 실시간 연동)',
  },
  {
    id: 'inv-2',
    name: 'TIGER 미국S&P500 ETF (360750)',
    symbol: '360750',
    naverCode: '360750',
    naverMarket: 'ETF',
    type: 'etf',
    sharesCount: 587, // 내가 587주 구매
    purchaseUnitPrice: 17036, // 1주당 매수단가
    currentUnitPrice: 19500, // 1주당 현재가
    investedAmount: 10000000, // 매수 원금 1,000만원
    currentPrice: 19500,
    currentValuation: 11446500, // 19,500 * 587 = 11,446,500원
    returnRate: 14.5,
    dailyChangeRate: 0.8,
    lastUpdated: '2026-10-24 12:00:00',
    memo: '미국 우량 500개 기업 지수 추종 ETF',
  },
  {
    id: 'inv-3',
    name: '한국투자 글로벌AI빅테크 펀드',
    symbol: 'KR523910',
    type: 'fund',
    scheduledDay: 10, // 매월 10일 지정일 구매
    scheduledAmount: 1000000, // 매월 10일 100만원씩 구매
    fundNav: 1080, // 현재 1,000좌당 기준가 1,080원
    accumulatedUnits: 3840000, // 누적 매수 좌수
    investedAmount: 4000000, // 매월 100만원씩 4회 구매 원금 = 400만원
    currentPrice: 1080,
    currentValuation: 4147200, // (3,840,000 / 1,000) * 1,080 = 4,147,200원
    returnRate: 3.7,
    dailyChangeRate: -0.5,
    lastUpdated: '2026-10-24 12:00:00',
    memo: '매월 10일 지정일에 100만원씩 정기 적립 구매 (기준가 자동 반영)',
    purchaseHistory: [
      { date: '2026-07-10', amount: 1000000, priceAtDate: 1000, units: 1000000, note: '1회차 매수 (기준가 1,000원)' },
      { date: '2026-08-10', amount: 1000000, priceAtDate: 1030, units: 970874, note: '2회차 매수 (기준가 1,030원)' },
      { date: '2026-09-10', amount: 1000000, priceAtDate: 1055, units: 947867, note: '3회차 매수 (기준가 1,055원)' },
      { date: '2026-10-10', amount: 1000000, priceAtDate: 1085, units: 921659, note: '4회차 매수 (기준가 1,085원)' },
    ],
  },
  {
    id: 'inv-4',
    name: '미래에셋 평생소득 TDF2045 펀드',
    symbol: 'KR581920',
    type: 'fund',
    scheduledDay: 25, // 매월 25일 지정일 구매
    scheduledAmount: 1000000, // 매월 25일 100만원씩 구매
    fundNav: 1260,
    accumulatedUnits: 4166667,
    investedAmount: 5000000,
    currentPrice: 1260,
    currentValuation: 5250000, // (4,166,667 / 1,000) * 1,260 = 5,250,000원
    returnRate: 5.0,
    dailyChangeRate: 0.2,
    lastUpdated: '2026-10-24 12:00:00',
    memo: '매월 25일 급여일 지정일 펀드 자동 구매 (기준가 자동 반영)',
    purchaseHistory: [
      { date: '2026-06-25', amount: 1000000, priceAtDate: 1180, units: 847458, note: '1회차 매수' },
      { date: '2026-07-25', amount: 1000000, priceAtDate: 1200, units: 833333, note: '2회차 매수' },
      { date: '2026-08-25', amount: 1000000, priceAtDate: 1220, units: 819672, note: '3회차 매수' },
      { date: '2026-09-25', amount: 1000000, priceAtDate: 1240, units: 806452, note: '4회차 매수' },
      { date: '2026-10-25', amount: 1000000, priceAtDate: 1260, units: 793651, note: '5회차 매수' },
    ],
  },
  {
    id: 'inv-deposit-1',
    name: '신한 쏠편한 정기예금 (12개월)',
    symbol: 'SHINHAN-DEP-12M',
    type: 'deposit',
    bankName: '신한은행',
    investedAmount: 10000000, // 예치 원금 1,000만원
    currentPrice: 10000000,
    currentValuation: 10214000, // 현재까지 경과 이자 반영 평가액
    interestRate: 3.6, // 연 3.6%
    termMonths: 12,
    startDate: '2026-03-15',
    maturityDate: '2027-03-15',
    accruedInterest: 214000,
    maturityAmount: 10304560, // 원금 1,000만 + 세후이자 304,560원 (이자 360,000 - 15.4% 세금 55,440원)
    returnRate: 2.14,
    dailyChangeRate: 0.01,
    lastUpdated: '2026-10-24 12:00:00',
    memo: '신한은행 안전 자산 12개월 정기예금 (연 3.6%, 만기 D-142일)',
    sourceAccountId: 'acc-shinhan',
    payoutAccountId: 'acc-shinhan',
  },
  {
    id: 'inv-savings-1',
    name: '토스뱅크 굴비 적금 (6개월)',
    symbol: 'TOSS-SAV-6M',
    type: 'savings',
    bankName: '토스뱅크',
    investedAmount: 1800000, // 월 30만원씩 6회 불입 완료 원금 180만원
    currentPrice: 1800000,
    currentValuation: 1823500, // 세후 경과 이자 반영 평가액
    interestRate: 4.2, // 연 4.2%
    monthlyDeposit: 300000,
    termMonths: 6,
    startDate: '2026-05-01',
    maturityDate: '2026-11-01',
    accruedInterest: 23500,
    maturityAmount: 1827453, // 총 불입 180만 + 세후이자 27,453원
    returnRate: 1.31,
    dailyChangeRate: 0.01,
    lastUpdated: '2026-10-24 12:00:00',
    memo: '토스뱅크 고금리 굴비 적금 (월 30만원 납입, 만기 임박 D-8일)',
    sourceAccountId: 'acc-toss',
    payoutAccountId: 'acc-toss',
  },
  {
    id: 'inv-5',
    name: 'ACE 미국30년국채액티브 (H)',
    symbol: '453850',
    naverCode: '453850',
    naverMarket: 'ETF',
    type: 'bond',
    sharesCount: 327,
    purchaseUnitPrice: 9174,
    currentUnitPrice: 9350,
    investedAmount: 3000000,
    currentPrice: 9350,
    currentValuation: 3057450,
    returnRate: 1.9,
    dailyChangeRate: -0.1,
    lastUpdated: '2026-10-24 12:00:00',
    memo: '금리 인하 대비 안전자산 헤지',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // === 2026-10 수입 내역 (출처 + 입금 통장) ===
  {
    id: 'tx-202610-in-1',
    date: '2026-10-01',
    type: TransactionType.INCOME,
    categoryId: 'cat-salary',
    title: '10월 정기 급여 입금',
    amount: 3850000,
    accountId: 'acc-shinhan',
    paymentMethod: '계좌이체',
    incomeSource: '주식회사 온결 (본업 급여)',
    memo: '세후 실수령액 정기 입금',
  },
  {
    id: 'tx-202610-in-2',
    date: '2026-10-14',
    type: TransactionType.INCOME,
    categoryId: 'cat-dividend',
    title: '삼성전자 3분기 배당금 입금',
    amount: 185000,
    accountId: 'acc-mirae',
    paymentMethod: '계좌이체',
    incomeSource: '삼성전자 주주배당금',
    memo: 'CMA 계좌로 배당금 자동 입금',
  },
  {
    id: 'tx-202610-in-3',
    date: '2026-10-20',
    type: TransactionType.INCOME,
    categoryId: 'cat-side',
    title: '기술 기고 및 외주 자문료 입금',
    amount: 450000,
    accountId: 'acc-toss',
    paymentMethod: '계좌이체',
    incomeSource: '테크 미디어 기술원고 및 기술기고료',
    memo: '원천징수 3.3% 공제 후 파킹통장 입금',
  },

  // === 2026-10 지출 내역 (일반 + 과소비 플래그) ===
  {
    id: 'tx-202610-ex-1',
    date: '2026-10-24',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-food',
    title: '주말 브런치 & 스페셜티 커피',
    amount: 34500,
    accountId: 'acc-shinhan',
    paymentMethod: '신한카드',
    isFixed: false,
    isOverspending: false,
    memo: '주말 점심 식사',
  },
  {
    id: 'tx-202610-ex-2',
    date: '2026-10-23',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-groceries',
    title: '컬리 신선식품 장보기 (채소/육류)',
    amount: 76800,
    accountId: 'acc-shinhan',
    paymentMethod: '체크카드',
    isFixed: false,
    isOverspending: false,
    memo: '주간 집밥 식재료',
  },
  {
    id: 'tx-202610-ex-3',
    date: '2026-10-22',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-food',
    title: '심야 배달 야식 & 프리미엄 와인',
    amount: 58000,
    accountId: 'acc-shinhan',
    paymentMethod: '신한카드',
    isFixed: false,
    isOverspending: true, // 과소비 체크!
    memo: '스트레스로 인한 충동 배달주문 (아낄 수 있었던 지출)',
  },
  {
    id: 'tx-202610-ex-4',
    date: '2026-10-21',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-transport',
    title: '주유소 셀프 주유 (휘발유)',
    amount: 68000,
    accountId: 'acc-shinhan',
    paymentMethod: '신한카드',
    isFixed: false,
    isOverspending: false,
  },
  {
    id: 'tx-202610-ex-5',
    date: '2026-10-18',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-shopping',
    title: 'SNS 광고 의류 충동구매 (니트웨어)',
    amount: 149000,
    accountId: 'acc-shinhan',
    paymentMethod: '신한카드',
    isFixed: false,
    isOverspending: true, // 과소비 체크!
    memo: '계획에 없던 SNS 쇼핑 충동구매',
  },
  {
    id: 'tx-202610-ex-6',
    date: '2026-10-16',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-groceries',
    title: '이마트 대용량 식재료 정기 장보기',
    amount: 132000,
    accountId: 'acc-shinhan',
    paymentMethod: '체크카드',
    isFixed: false,
    isOverspending: false,
  },
  {
    id: 'tx-202610-ex-7',
    date: '2026-10-15',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-medical',
    title: '치과 정기 스케일링 및 불소 검진',
    amount: 42300,
    accountId: 'acc-shinhan',
    paymentMethod: '체크카드',
    isFixed: false,
    isOverspending: false,
  },
  {
    id: 'tx-202610-ex-8',
    date: '2026-10-14',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-shopping',
    title: '생필품 리필 세제 및 주방용품',
    amount: 72000,
    accountId: 'acc-shinhan',
    paymentMethod: '신한카드',
    isFixed: false,
    isOverspending: false,
  },
  {
    id: 'tx-202610-ex-9',
    date: '2026-10-11',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-transport',
    title: '모임 후 심야 택시 할증 귀가',
    amount: 32000,
    accountId: 'acc-toss',
    paymentMethod: '계좌이체',
    isFixed: false,
    isOverspending: true, // 과소비 체크!
    memo: '막차 놓치고 충동 택시 탑승',
  },
  {
    id: 'tx-202610-ex-10',
    date: '2026-10-10',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-housing',
    title: '아파트 관리비 · 가스 · 수도세 자동이체',
    amount: 248000,
    accountId: 'acc-shinhan',
    paymentMethod: '계좌이체',
    isFixed: true,
    isOverspending: false,
  },
  {
    id: 'tx-202610-ex-11',
    date: '2026-10-09',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-education',
    title: '재무설계 실무 e-book 및 세미나',
    amount: 79000,
    accountId: 'acc-shinhan',
    paymentMethod: '신한카드',
    isFixed: false,
    isOverspending: false,
  },
  {
    id: 'tx-202610-ex-12',
    date: '2026-10-07',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-culture',
    title: '한정판 캐릭터 피규어 충동구매',
    amount: 89000,
    accountId: 'acc-shinhan',
    paymentMethod: '신한카드',
    isFixed: false,
    isOverspending: true, // 과소비 체크!
    memo: '취미용품 예산 초과 구매',
  },
  {
    id: 'tx-202610-ex-13',
    date: '2026-10-05',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-housing',
    title: '전세자금대출 이자 및 초고속 인터넷',
    amount: 345000,
    accountId: 'acc-shinhan',
    paymentMethod: '계좌이체',
    isFixed: true,
    isOverspending: false,
  },
  {
    id: 'tx-202610-ex-14',
    date: '2026-10-04',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-transport',
    title: '기후동행 대중교통 정기권 충전',
    amount: 65000,
    accountId: 'acc-shinhan',
    paymentMethod: '체크카드',
    isFixed: true,
    isOverspending: false,
  },
  {
    id: 'tx-202610-ex-15',
    date: '2026-10-03',
    type: TransactionType.EXPENSE,
    categoryId: 'cat-culture',
    title: 'OTT 스트리밍 & 음원 서비스 정기구독',
    amount: 24900,
    accountId: 'acc-shinhan',
    paymentMethod: '신한카드',
    isFixed: true,
    isOverspending: false,
  },
];
