import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  ExternalLink,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import {
  DEFAULT_TODAY,
  DEPOSIT_SAVINGS_PRESETS,
  DepositSavingsPreset,
  FUND_PRESETS,
  NAVER_STOCKS_CATALOG,
  NaverStockPreset,
  lookupFundNavByName,
} from '../data/seedData';
import {
  AssetType,
  BankAccount,
  InvestmentAsset,
  InvestmentPurchaseRecord,
  PortfolioSummary,
} from '../types/ledger';
import {
  calculateDepositMaturity,
  calculateSavingsMaturity,
  formatCompactKRW,
  formatKRW,
  formatPercent,
} from '../utils/ledgerMath';
import { PortfolioAllocationChart } from './Charts';
import { SellAssetModal } from './SellAssetModal';

interface InvestmentViewProps {
  portfolio: PortfolioSummary;
  investments: InvestmentAsset[];
  bankAccounts: BankAccount[];
  onUpdatePrices: () => void;
  onAddAsset: (asset: Omit<InvestmentAsset, 'id' | 'lastUpdated'>) => void;
  onEditAsset: (asset: InvestmentAsset) => void;
  onDeleteAsset: (id: string) => void;
  onSellAsset: (
    asset: InvestmentAsset,
    sellProceeds: number,
    realizedProfit: number,
    targetAccountId: string,
    soldShares?: number
  ) => void;
}

export const InvestmentView: React.FC<InvestmentViewProps> = ({
  portfolio,
  investments,
  bankAccounts,
  onUpdatePrices,
  onAddAsset,
  onEditAsset,
  onDeleteAsset,
  onSellAsset,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  // Selling modal state
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [sellingAsset, setSellingAsset] = useState<InvestmentAsset | null>(null);

  // Form Mode: 'stock' | 'fund' | 'deposit' | 'savings' | 'other'
  const [formMode, setFormMode] = useState<'stock' | 'fund' | 'deposit' | 'savings' | 'other'>('stock');

  // 1. Stock Form States
  const [stockName, setStockName] = useState('삼성전자');
  const [stockCode, setStockCode] = useState('005930');
  const [stockShares, setStockShares] = useState('50'); // 내가 몇 주 구매했는지
  const [stockBuyPrice, setStockBuyPrice] = useState('68,000'); // 1주당 매수단가
  const [stockCurrentPrice, setStockCurrentPrice] = useState('213,500'); // 현재가 (213,500원)
  const [stockMemo, setStockMemo] = useState('네이버 증권 시세 실시간 연동');

  // 2. Fund Form States
  const [fundName, setFundName] = useState('한국투자 글로벌AI빅테크 펀드');
  const [fundCompany, setFundCompany] = useState('한국투자신탁운용');
  const [fundScheduledDay, setFundScheduledDay] = useState(10); // 매월 지정일 (예: 10일)
  const [fundScheduledAmount, setFundScheduledAmount] = useState('500,000'); // 지정일에 구매할 금액
  const [fundPurchaseRounds, setFundPurchaseRounds] = useState('4'); // 지금까지 몇 회 구매했는지
  const [fundCurrentNav, setFundCurrentNav] = useState('1,080'); // 1,000좌당 현재 기준가
  const [fundMemo, setFundMemo] = useState('매월 지정일 적립식 매수 (기준가 자동 반영)');

  // 3. Deposit Form States (정기예금)
  const [depositName, setDepositName] = useState('신한 쏠편한 정기예금');
  const [depositBank, setDepositBank] = useState('신한은행');
  const [depositPrincipal, setDepositPrincipal] = useState('10,000,000');
  const [depositRate, setDepositRate] = useState('3.6'); // %
  const [depositMonths, setDepositMonths] = useState(12);
  const [depositTaxFree, setDepositTaxFree] = useState(false);
  const [depositMemo, setDepositMemo] = useState('12개월 만기 안전 자산 예금');
  const [depositSourceAccount, setDepositSourceAccount] = useState<string>(
    () => bankAccounts[0]?.id || ''
  );
  const [depositPayoutAccount, setDepositPayoutAccount] = useState<string>(
    () => bankAccounts[0]?.id || ''
  );

  // 4. Savings Form States (적립식 적금)
  const [savingsName, setSavingsName] = useState('토스뱅크 굴비 적금');
  const [savingsBank, setSavingsBank] = useState('토스뱅크');
  const [savingsMonthly, setSavingsMonthly] = useState('300,000');
  const [savingsMonths, setSavingsMonths] = useState(6);
  const [savingsRate, setSavingsRate] = useState('4.2'); // %
  const [savingsTaxFree, setSavingsTaxFree] = useState(false);
  const [savingsMemo, setSavingsMemo] = useState('월 30만원 고금리 단기 적금');
  const [savingsSourceAccount, setSavingsSourceAccount] = useState<string>(
    () => bankAccounts[0]?.id || ''
  );
  const [savingsPayoutAccount, setSavingsPayoutAccount] = useState<string>(
    () => bankAccounts[0]?.id || ''
  );

  // 5. Other Form States (채권 등)
  const [otherName, setOtherName] = useState('');
  const [otherType, setOtherType] = useState<AssetType>('bond');
  const [otherInvested, setOtherInvested] = useState('');
  const [otherValuation, setOtherValuation] = useState('');
  const [otherMemo, setOtherMemo] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal States
  const [modalName, setModalName] = useState('');
  const [modalType, setModalType] = useState<AssetType>('stock');
  const [modalInvested, setModalInvested] = useState('');
  const [modalValuation, setModalValuation] = useState('');
  const [modalShares, setModalShares] = useState('');
  const [modalUnitPrice, setModalUnitPrice] = useState('');
  const [modalScheduledDay, setModalScheduledDay] = useState<number>(10);
  const [modalScheduledAmount, setModalScheduledAmount] = useState('');
  const [modalNav, setModalNav] = useState('');
  const [modalRate, setModalRate] = useState('');
  const [modalMemo, setModalMemo] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Calculated values for Stock Live Preview
  const cleanShares = Math.max(1, Number(stockShares.replace(/,/g, '')) || 0);
  const cleanBuyPrice = Number(stockBuyPrice.replace(/,/g, '')) || 0;
  const cleanCurrentPrice = Number(stockCurrentPrice.replace(/,/g, '')) || cleanBuyPrice;
  const stockInvestedTotal = cleanShares * cleanBuyPrice;
  // 한주당 가격 * 내가 몇 주 구매했는지 계산해서 현재가 스스로 계산
  const stockCalculatedValuation = cleanShares * cleanCurrentPrice;
  const stockProfit = stockCalculatedValuation - stockInvestedTotal;
  const stockReturnRate = stockInvestedTotal > 0 ? Math.round((stockProfit / stockInvestedTotal) * 1000) / 10 : 0;

  // Calculated values for Fund Live Preview
  const cleanScheduledAmount = Number(fundScheduledAmount.replace(/,/g, '')) || 0;
  const cleanRounds = Math.max(1, Number(fundPurchaseRounds.replace(/,/g, '')) || 1);
  const cleanNav = Math.max(10, Number(fundCurrentNav.replace(/,/g, '')) || 1000);
  const fundInvestedTotal = cleanScheduledAmount * cleanRounds;
  const estimatedUnits = Math.round((fundInvestedTotal / ((cleanNav + 1000) / 2)) * 1000);
  const fundCalculatedValuation = Math.round((estimatedUnits / 1000) * cleanNav);
  const fundProfit = fundCalculatedValuation - fundInvestedTotal;
  const fundReturnRate = fundInvestedTotal > 0 ? Math.round((fundProfit / fundInvestedTotal) * 1000) / 10 : 0;

  // Calculated values for Deposit Live Preview
  const cleanDepositPrincipal = Number(depositPrincipal.replace(/,/g, '')) || 0;
  const cleanDepositRate = Number(depositRate) || 0;
  const depositCalc = calculateDepositMaturity(cleanDepositPrincipal, cleanDepositRate, depositMonths, depositTaxFree);

  // Calculated values for Savings Live Preview
  const cleanSavingsMonthly = Number(savingsMonthly.replace(/,/g, '')) || 0;
  const cleanSavingsRate = Number(savingsRate) || 0;
  const savingsCalc = calculateSavingsMaturity(cleanSavingsMonthly, cleanSavingsRate, savingsMonths, savingsTaxFree);

  // Automatically update fund NAV when typing fund name
  const handleFundNameChange = (name: string) => {
    setFundName(name);
    const lookup = lookupFundNavByName(name);
    setFundCurrentNav(lookup.nav.toLocaleString('ko-KR'));
    if (lookup.company) {
      setFundCompany(lookup.company);
    }
  };

  const handleSelectStockPreset = (preset: NaverStockPreset) => {
    setStockName(preset.name);
    setStockCode(preset.code);
    setStockCurrentPrice(preset.currentUnitPrice.toLocaleString('ko-KR'));
    if (!stockBuyPrice || stockBuyPrice === '0') {
      setStockBuyPrice(preset.yesterdayPrice.toLocaleString('ko-KR'));
    }
  };

  const handleSelectFundPreset = (preset: (typeof FUND_PRESETS)[0]) => {
    setFundName(preset.name);
    setFundCompany(preset.company);
    setFundCurrentNav(preset.defaultNav.toLocaleString('ko-KR'));
  };

  const handleSelectDepositSavingsPreset = (preset: DepositSavingsPreset) => {
    if (preset.type === 'deposit') {
      setFormMode('deposit');
      setDepositName(preset.name);
      setDepositBank(preset.bankName);
      setDepositRate(preset.interestRate.toString());
      setDepositMonths(preset.termMonths);
    } else {
      setFormMode('savings');
      setSavingsName(preset.name);
      setSavingsBank(preset.bankName);
      setSavingsRate(preset.interestRate.toString());
      setSavingsMonths(preset.termMonths);
      if (preset.monthlyDeposit) {
        setSavingsMonthly(preset.monthlyDeposit.toLocaleString('ko-KR'));
      }
    }
  };

  const handleTriggerUpdate = () => {
    setIsUpdating(true);
    setTimeout(() => {
      onUpdatePrices();
      setIsUpdating(false);
    }, 450);
  };

  // Quick action: Apply Samsung Electronics 213,500 KRW to all Samsung assets
  const handleApplySamsungPrice = () => {
    const targetPrice = 213500;
    setStockName('삼성전자');
    setStockCode('005930');
    setStockCurrentPrice(targetPrice.toLocaleString('ko-KR'));

    const samsung = investments.find((i) => i.name.includes('삼성전자') || i.symbol === '005930');
    if (samsung) {
      const shares = samsung.sharesCount || 90;
      const newValuation = targetPrice * shares;
      const profit = newValuation - samsung.investedAmount;
      const returnRate = samsung.investedAmount > 0 ? Math.round((profit / samsung.investedAmount) * 1000) / 10 : 0;

      onEditAsset({
        ...samsung,
        currentUnitPrice: targetPrice,
        currentPrice: targetPrice,
        currentValuation: newValuation,
        returnRate,
        dailyChangeRate: 1.67,
        lastUpdated: '2026-10-24 12:00:00',
      });
    }
  };

  // Open selling modal for asset
  const handleOpenSellModal = (asset: InvestmentAsset) => {
    setSellingAsset(asset);
    setIsSellModalOpen(true);
  };

  // Submit Handler
  const handleSaveInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Stock / ETF
    if (formMode === 'stock') {
      if (!stockName.trim()) {
        setFormError('종목명을 입력해 주세요 (예: 삼성전자).');
        return;
      }
      if (cleanShares <= 0) {
        setFormError('내가 몇 주 구매했는지(보유 주식 수)를 1주 이상 입력해 주세요.');
        return;
      }
      if (cleanBuyPrice <= 0) {
        setFormError('1주당 매수단가를 1원 이상 입력해 주세요.');
        return;
      }
      if (cleanCurrentPrice <= 0) {
        setFormError('네이버 기준 1주당 현재가를 1원 이상 입력해 주세요.');
        return;
      }

      const isEtf =
        stockName.includes('ETF') ||
        stockName.includes('TIGER') ||
        stockName.includes('KODEX') ||
        stockName.includes('ACE');
      const finalType: AssetType = isEtf ? 'etf' : 'stock';

      onAddAsset({
        name: stockCode ? `${stockName.trim()} (${stockCode.trim()})` : stockName.trim(),
        symbol: stockCode.trim() || undefined,
        naverCode: stockCode.trim() || undefined,
        naverMarket: isEtf ? 'ETF' : 'KOSPI',
        type: finalType,
        sharesCount: cleanShares,
        purchaseUnitPrice: cleanBuyPrice,
        currentUnitPrice: cleanCurrentPrice,
        investedAmount: stockInvestedTotal,
        currentPrice: cleanCurrentPrice,
        currentValuation: stockCalculatedValuation,
        returnRate: stockReturnRate,
        dailyChangeRate: 1.67,
        memo: stockMemo.trim() || undefined,
      });

      setStockShares('10');
      setStockBuyPrice('213,500');
      setStockCurrentPrice('213,500');
      return;
    }

    // 2. Fund
    if (formMode === 'fund') {
      if (!fundName.trim()) {
        setFormError('펀드명을 입력해 주세요.');
        return;
      }
      if (cleanScheduledAmount <= 0) {
        setFormError('지정일에 구매할 금액을 1원 이상 입력해 주세요.');
        return;
      }
      if (cleanNav <= 0) {
        setFormError('현재 펀드 기준가를 1원 이상 입력해 주세요.');
        return;
      }

      const mockHistory: InvestmentPurchaseRecord[] = [];
      const now = new Date();
      for (let i = cleanRounds; i >= 1; i--) {
        const roundMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, fundScheduledDay);
        const y = roundMonth.getFullYear();
        const m = String(roundMonth.getMonth() + 1).padStart(2, '0');
        const d = String(fundScheduledDay).padStart(2, '0');
        const priceAtDate = Math.round(1000 + ((cleanNav - 1000) * (cleanRounds - i + 1)) / cleanRounds);
        const units = Math.round((cleanScheduledAmount / priceAtDate) * 1000);
        mockHistory.push({
          date: `${y}-${m}-${d}`,
          amount: cleanScheduledAmount,
          priceAtDate,
          units,
          note: `${cleanRounds - i + 1}회차 지정일 매수`,
        });
      }

      onAddAsset({
        name: fundName.trim(),
        type: 'fund',
        scheduledDay: fundScheduledDay,
        scheduledAmount: cleanScheduledAmount,
        fundNav: cleanNav,
        accumulatedUnits: estimatedUnits,
        investedAmount: fundInvestedTotal,
        currentPrice: cleanNav,
        currentValuation: fundCalculatedValuation,
        returnRate: fundReturnRate,
        dailyChangeRate: 0.3,
        memo: fundMemo.trim() || `${fundCompany} 운용 펀드 (기준가 실시간 자동 반영)`,
        purchaseHistory: mockHistory,
      });

      return;
    }

    // 3. Deposit (정기예금)
    if (formMode === 'deposit') {
      if (!depositName.trim()) {
        setFormError('정기예금 상품명을 입력해 주세요.');
        return;
      }
      if (cleanDepositPrincipal <= 0) {
        setFormError('예치 원금을 1원 이상 입력해 주세요.');
        return;
      }
      if (cleanDepositRate <= 0) {
        setFormError('연 이자율(%)을 입력해 주세요.');
        return;
      }

      const startDate = '2026-10-01';
      const maturityDate = `2027-${String(10 + Math.floor(depositMonths % 12)).padStart(2, '0')}-01`;

      onAddAsset({
        name: `${depositName.trim()} (${depositMonths}개월)`,
        type: 'deposit',
        bankName: depositBank,
        investedAmount: cleanDepositPrincipal,
        currentPrice: cleanDepositPrincipal,
        currentValuation: cleanDepositPrincipal + Math.round(depositCalc.netInterest * 0.1), // 초기 경과이자 반영
        interestRate: cleanDepositRate,
        termMonths: depositMonths,
        startDate,
        maturityDate,
        isTaxFree: depositTaxFree,
        accruedInterest: Math.round(depositCalc.netInterest * 0.1),
        maturityAmount: depositCalc.maturityAmount,
        returnRate: Math.round(((depositCalc.netInterest * 0.1) / cleanDepositPrincipal) * 1000) / 10,
        dailyChangeRate: 0.01,
        sourceAccountId: depositSourceAccount,
        payoutAccountId: depositPayoutAccount,
        memo: depositMemo.trim() || `${depositBank} 정기예금 (연 ${cleanDepositRate}%, ${depositMonths}개월)`,
      });

      return;
    }

    // 4. Savings (적립식 적금)
    if (formMode === 'savings') {
      if (!savingsName.trim()) {
        setFormError('적금 상품명을 입력해 주세요.');
        return;
      }
      if (cleanSavingsMonthly <= 0) {
        setFormError('월 납입 금액을 1원 이상 입력해 주세요.');
        return;
      }
      if (cleanSavingsRate <= 0) {
        setFormError('연 이자율(%)을 입력해 주세요.');
        return;
      }

      const totalPrincipal = savingsCalc.totalPrincipal;
      const initialInvested = cleanSavingsMonthly * 2; // 현재 2회 불입 상태 시뮬레이션

      onAddAsset({
        name: `${savingsName.trim()} (${savingsMonths}개월)`,
        type: 'savings',
        bankName: savingsBank,
        monthlyDeposit: cleanSavingsMonthly,
        investedAmount: initialInvested,
        currentPrice: initialInvested,
        currentValuation: initialInvested + Math.round(savingsCalc.netInterest * 0.15),
        interestRate: cleanSavingsRate,
        termMonths: savingsMonths,
        startDate: '2026-09-01',
        maturityDate: '2027-03-01',
        isTaxFree: savingsTaxFree,
        accruedInterest: Math.round(savingsCalc.netInterest * 0.15),
        maturityAmount: savingsCalc.maturityAmount,
        returnRate: Math.round(((savingsCalc.netInterest * 0.15) / initialInvested) * 1000) / 10,
        dailyChangeRate: 0.01,
        sourceAccountId: savingsSourceAccount,
        payoutAccountId: savingsPayoutAccount,
        memo: savingsMemo.trim() || `${savingsBank} 적금 (월 ${formatCompactKRW(cleanSavingsMonthly)}, 연 ${cleanSavingsRate}%)`,
      });

      return;
    }

    // 5. Other
    if (!otherName.trim()) {
      setFormError('자산/종목명을 입력해 주세요.');
      return;
    }
    const cleanOtherInvested = Number(otherInvested.replace(/,/g, '')) || 0;
    const cleanOtherValuation = Number(otherValuation.replace(/,/g, '')) || cleanOtherInvested;
    if (cleanOtherInvested <= 0) {
      setFormError('매수 원금을 1원 이상 입력해 주세요.');
      return;
    }

    const profit = cleanOtherValuation - cleanOtherInvested;
    const returnRate = Math.round((profit / cleanOtherInvested) * 1000) / 10;

    onAddAsset({
      name: otherName.trim(),
      type: otherType,
      investedAmount: cleanOtherInvested,
      currentPrice: cleanOtherValuation,
      currentValuation: cleanOtherValuation,
      returnRate,
      dailyChangeRate: 0,
      memo: otherMemo.trim() || undefined,
    });

    setOtherName('');
    setOtherInvested('');
    setOtherValuation('');
    setOtherMemo('');
  };

  const openEditModal = (asset: InvestmentAsset) => {
    setEditingAsset(asset);
    setModalName(asset.name);
    setModalType(asset.type);
    setModalInvested(asset.investedAmount.toLocaleString('ko-KR'));
    setModalValuation(asset.currentValuation.toLocaleString('ko-KR'));
    setModalShares(asset.sharesCount?.toString() || '');
    setModalUnitPrice(asset.currentUnitPrice?.toLocaleString('ko-KR') || '');
    setModalScheduledDay(asset.scheduledDay || 10);
    setModalScheduledAmount(asset.scheduledAmount?.toLocaleString('ko-KR') || '');
    setModalNav(asset.fundNav?.toLocaleString('ko-KR') || '');
    setModalRate(asset.interestRate?.toString() || '');
    setModalMemo(asset.memo || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleUpdateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    const cleanInvested = Number(modalInvested.replace(/,/g, ''));
    const cleanVal = Number(modalValuation.replace(/,/g, ''));

    if (!modalName.trim()) {
      setModalError('자산 이름을 입력해 주세요.');
      return;
    }
    if (isNaN(cleanInvested) || cleanInvested <= 0) {
      setModalError('매수 원금을 1원 이상 입력해 주세요.');
      return;
    }

    const cleanSharesCount = modalShares ? Number(modalShares.replace(/,/g, '')) : undefined;
    const cleanUnit = modalUnitPrice ? Number(modalUnitPrice.replace(/,/g, '')) : undefined;
    const finalValuation =
      cleanSharesCount && cleanUnit
        ? cleanSharesCount * cleanUnit
        : isNaN(cleanVal) || cleanVal <= 0
        ? cleanInvested
        : cleanVal;

    const profit = finalValuation - cleanInvested;
    const returnRate = cleanInvested > 0 ? Math.round((profit / cleanInvested) * 1000) / 10 : 0;

    onEditAsset({
      ...editingAsset,
      name: modalName.trim(),
      type: modalType,
      investedAmount: cleanInvested,
      currentValuation: finalValuation,
      currentPrice: cleanUnit ?? editingAsset.currentPrice,
      currentUnitPrice: cleanUnit,
      sharesCount: cleanSharesCount,
      scheduledDay: modalScheduledDay,
      scheduledAmount: modalScheduledAmount ? Number(modalScheduledAmount.replace(/,/g, '')) : undefined,
      fundNav: modalNav ? Number(modalNav.replace(/,/g, '')) : undefined,
      interestRate: modalRate ? Number(modalRate) : undefined,
      returnRate,
      memo: modalMemo.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  const getAssetTypeBadge = (type: AssetType) => {
    switch (type) {
      case 'stock':
        return (
          <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-bold text-blue-700">
            국내/해외 주식
          </span>
        );
      case 'fund':
        return (
          <span className="rounded bg-teal-50 border border-teal-200 px-2 py-0.5 text-xs font-bold text-teal-800">
            적립식 펀드
          </span>
        );
      case 'etf':
        return (
          <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-bold text-indigo-700">
            지수 ETF
          </span>
        );
      case 'deposit':
        return (
          <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-bold text-emerald-800">
            정기 예금
          </span>
        );
      case 'savings':
        return (
          <span className="rounded bg-cyan-50 border border-cyan-200 px-2 py-0.5 text-xs font-bold text-cyan-800">
            적립식 적금
          </span>
        );
      case 'bond':
      default:
        return (
          <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
            국공채 · 채권
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Top KPI Cards */}
      <section
        aria-label="투자 포트폴리오 핵심 지표"
        className="grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-xs sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x"
      >
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">총 투자 원금 (원래 넣은 돈)</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatKRW(portfolio.totalInvested)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            총 {investments.length}개 보유 종목 및 금융 상품
          </p>
        </div>

        <div className="p-5 sm:border-l sm:border-slate-200 lg:border-l-0">
          <p className="text-xs font-medium text-slate-500">현재 총 평가금액</p>
          <p className="mt-2 font-mono text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
            {formatKRW(portfolio.totalValuation)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            실시간 시세 및 이자 누적 반영
          </p>
        </div>

        <div className="p-5 sm:border-t sm:border-slate-200 lg:border-t-0">
          <p className="text-xs font-medium text-slate-500">총 평가 손익</p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              portfolio.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatKRW(portfolio.totalProfit, true)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            원금 대비 평가 수익액
          </p>
        </div>

        <div className="p-5 sm:border-t sm:border-l sm:border-slate-200 lg:border-t-0 lg:border-l-0">
          <p className="text-xs font-medium text-slate-500">전체 누적 수익률</p>
          <p
            className={`mt-2 font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              portfolio.totalReturnRate >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatPercent(portfolio.totalReturnRate, true)}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {portfolio.totalReturnRate >= 0 ? '안정적 수익 구간' : '원금 회복 관리 필요'}
          </p>
        </div>
      </section>

      {/* Requirement: 실시간 버튼 없애고 현재 1주당 가격 직접 입력 시스템 안내 */}
      <section className="flex flex-col gap-3 rounded-xl border border-teal-200 bg-teal-50/40 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800 border border-teal-200">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  현재 1주당 가격 직접 입력 및 자동 손익 평가
                </h2>
                <span className="rounded bg-teal-200/80 px-2 py-0.5 text-[11px] font-bold text-teal-900">
                  보유 주수 × 현재 1주당 가격 = 현재 판매가
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                현재 1주당 가격(원)을 직접 입력하면 <strong className="text-slate-900">현재 판매가(총 평가액)</strong>가 자동으로 계산되어 원금 대비 <strong className="text-emerald-700 font-bold">손익 및 수익률(%)</strong>이 즉시 산출됩니다. 아래 보유 목록에서도 1주당 가격을 자유롭게 변경할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Investment & Savings Entry Form */}
      <section
        aria-label="투자 및 예금·적금 내역 작성하기"
        className="rounded-xl border border-teal-200 bg-teal-50/50 p-5 sm:p-6 shadow-xs"
      >
        <div className="border-b border-teal-100 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-800" />
              <h2 className="text-base font-bold text-slate-900">
                투자 종목 및 적금·예금 작성하기
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              네이버 주식 시세 연동, 펀드 기준가 실시간 자동 반영, 정기예금/적금 이자 분석을 선택하여 등록합니다.
            </p>
          </div>

          {/* Form Mode Selector Tabs */}
          <div className="flex flex-wrap gap-1 rounded-lg border border-teal-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setFormMode('stock')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                formMode === 'stock'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 주식 / ETF
            </button>
            <button
              type="button"
              onClick={() => setFormMode('fund')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                formMode === 'fund'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📊 펀드 (기준가 자동반영)
            </button>
            <button
              type="button"
              onClick={() => setFormMode('deposit')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                formMode === 'deposit'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💰 정기예금
            </button>
            <button
              type="button"
              onClick={() => setFormMode('savings')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                formMode === 'savings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏦 적립식 적금
            </button>
            <button
              type="button"
              onClick={() => setFormMode('other')}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                formMode === 'other'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📄 채권/기타
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveInvestment} className="space-y-4">
          {/* 1. STOCK / ETF FORM */}
          {formMode === 'stock' && (
            <div className="space-y-4">
              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 mr-1">네이버 시세 빠른 선택:</span>
                {NAVER_STOCKS_CATALOG.slice(0, 6).map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleSelectStockPreset(preset)}
                    className={`rounded border px-2 py-1 transition-colors ${
                      stockCode === preset.code
                        ? 'border-teal-700 bg-teal-100 font-bold text-teal-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.name} ({formatKRW(preset.currentUnitPrice)})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700">
                    종목명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={stockName}
                    onChange={(e) => {
                      setStockName(e.target.value);
                      if (e.target.value.includes('삼성전자')) {
                        setStockCode('005930');
                        setStockCurrentPrice('213,500');
                      }
                    }}
                    placeholder="예: 삼성전자"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    종목코드 (네이버 6자리)
                  </label>
                  <input
                    type="text"
                    value={stockCode}
                    onChange={(e) => setStockCode(e.target.value)}
                    placeholder="005930"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">
                    내가 몇 주 샀는지 (보유 주수) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={stockShares}
                    onChange={(e) => {
                      const d = e.target.value.replace(/[^\d]/g, '');
                      setStockShares(d ? Number(d).toLocaleString('ko-KR') : '');
                    }}
                    placeholder="예: 90"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">
                    1주당 매수단가 (원금 단가) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={stockBuyPrice}
                    onChange={(e) => {
                      const d = e.target.value.replace(/[^\d]/g, '');
                      setStockBuyPrice(d ? Number(d).toLocaleString('ko-KR') : '');
                    }}
                    placeholder="예: 68,000"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700">
                    네이버 1주당 현재가 (원) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={stockCurrentPrice}
                      onChange={(e) => {
                        const d = e.target.value.replace(/[^\d]/g, '');
                        setStockCurrentPrice(d ? Number(d).toLocaleString('ko-KR') : '');
                      }}
                      className="w-full rounded-lg border border-teal-300 bg-teal-50/30 px-3 py-2 font-mono text-sm font-bold text-teal-900 tabular-nums focus:border-teal-700 focus:outline-none"
                    />
                    {stockName.includes('삼성전자') && stockCurrentPrice !== '213,500' && (
                      <button
                        type="button"
                        onClick={() => setStockCurrentPrice('213,500')}
                        className="absolute right-2 top-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 hover:bg-blue-200"
                      >
                        213,500원 입력
                      </button>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold text-slate-700">메모 / 전략</label>
                  <input
                    type="text"
                    value={stockMemo}
                    onChange={(e) => setStockMemo(e.target.value)}
                    placeholder="예: 반도체 호황기 장기 보유 포지션"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time calculated formula banner */}
              <div className="rounded-lg border border-teal-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800">
                    스스로 실시간 자동 계산:{' '}
                  </span>
                  <span className="font-mono text-teal-900 font-semibold tabular-nums">
                    {cleanShares.toLocaleString()}주 × {formatKRW(cleanCurrentPrice)} = {formatKRW(stockCalculatedValuation)}
                  </span>
                  <span className="text-slate-500 ml-2">
                    (매수 원금: {formatKRW(stockInvestedTotal)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">예상 평가손익:</span>
                  <span className={`font-mono font-bold ${stockProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatKRW(stockProfit, true)} ({formatPercent(stockReturnRate, true)})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. FUND FORM (Automatic NAV Reflection) */}
          {formMode === 'fund' && (
            <div className="space-y-4">
              {/* Popular Fund Chips */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 mr-1">인기 펀드 빠른 선택:</span>
                {FUND_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectFundPreset(preset)}
                    className={`rounded border px-2 py-1 transition-colors ${
                      fundName === preset.name
                        ? 'border-sky-700 bg-sky-100 font-bold text-sky-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.name} (기준가 {formatKRW(preset.defaultNav)})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-slate-700">
                    펀드명 <span className="text-rose-500">* (이름 입력 시 기준가 자동 반영)</span>
                  </label>
                  <input
                    type="text"
                    value={fundName}
                    onChange={(e) => handleFundNameChange(e.target.value)}
                    placeholder="예: 한국투자 글로벌AI빅테크 펀드"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                  <p className="mt-1 text-[11px] text-teal-800 flex items-center gap-1 font-medium">
                    <Sparkles className="h-3 w-3 text-teal-600" />
                    <span>실시간 기준가(NAV) 자동 반영 시스템 작동 중</span>
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    매월 지정 구매일
                  </label>
                  <select
                    value={fundScheduledDay}
                    onChange={(e) => setFundScheduledDay(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                      <option key={day} value={day}>
                        매월 {day}일
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">
                    지정일에 구매할 금액 (원) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fundScheduledAmount}
                    onChange={(e) => {
                      const d = e.target.value.replace(/[^\d]/g, '');
                      setFundScheduledAmount(d ? Number(d).toLocaleString('ko-KR') : '');
                    }}
                    placeholder="예: 500,000"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    구매 회차 (횟수)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={fundPurchaseRounds}
                    onChange={(e) => setFundPurchaseRounds(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700">
                    현재 펀드 기준가 (1,000좌당 원)
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fundCurrentNav}
                      onChange={(e) => {
                        const d = e.target.value.replace(/[^\d]/g, '');
                        setFundCurrentNav(d ? Number(d).toLocaleString('ko-KR') : '');
                      }}
                      className="w-full rounded-lg border border-sky-300 bg-sky-50/40 px-3 py-2 font-mono text-sm font-bold text-sky-950 tabular-nums focus:border-teal-700 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-sky-700 font-semibold">
                      자동 연동됨
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold text-slate-700">메모</label>
                  <input
                    type="text"
                    value={fundMemo}
                    onChange={(e) => setFundMemo(e.target.value)}
                    placeholder="예: 매월 10일 적립식 매수 (기준가 자동 반영)"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Fund calculation preview banner */}
              <div className="rounded-lg border border-sky-200 bg-white p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800">
                    지정일 펀드 자동 계산 결과:{' '}
                  </span>
                  <span className="font-mono text-sky-900 font-semibold tabular-nums">
                    누적 {cleanRounds}회 불입 (원금 {formatKRW(fundInvestedTotal)}) → 추정 누적 {estimatedUnits.toLocaleString()}좌
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">현재 평가금액:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatKRW(fundCalculatedValuation)}
                  </span>
                  <span className={`font-mono font-bold ${fundProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    ({formatPercent(fundReturnRate, true)})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3. DEPOSIT FORM (정기예금) */}
          {formMode === 'deposit' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 mr-1">인기 정기예금 선택:</span>
                {DEPOSIT_SAVINGS_PRESETS.filter((p) => p.type === 'deposit').map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectDepositSavingsPreset(preset)}
                    className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-emerald-900 hover:bg-emerald-100 transition-colors font-medium"
                  >
                    {preset.name} (연 {preset.interestRate}%, {preset.termMonths}개월)
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-slate-700">
                    정기예금 상품명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={depositName}
                    onChange={(e) => setDepositName(e.target.value)}
                    placeholder="예: 신한 쏠편한 정기예금"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">가입 은행</label>
                  <input
                    type="text"
                    value={depositBank}
                    onChange={(e) => setDepositBank(e.target.value)}
                    placeholder="신한은행"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700">
                    예치 원금 (원) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={depositPrincipal}
                    onChange={(e) => {
                      const d = e.target.value.replace(/[^\d]/g, '');
                      setDepositPrincipal(d ? Number(d).toLocaleString('ko-KR') : '');
                    }}
                    placeholder="예: 10,000,000"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">
                    연 이자율 (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={depositRate}
                    onChange={(e) => setDepositRate(e.target.value)}
                    placeholder="3.6"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold text-emerald-800 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">가입 기간 (개월)</label>
                  <select
                    value={depositMonths}
                    onChange={(e) => setDepositMonths(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    <option value={3}>3개월</option>
                    <option value={6}>6개월</option>
                    <option value={12}>12개월 (1년)</option>
                    <option value={24}>24개월 (2년)</option>
                    <option value={36}>36개월 (3년)</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={depositTaxFree}
                      onChange={(e) => setDepositTaxFree(e.target.checked)}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                    />
                    <span>비과세 적용 (15.4% 감면)</span>
                  </label>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">메모</label>
                  <input
                    type="text"
                    value={depositMemo}
                    onChange={(e) => setDepositMemo(e.target.value)}
                    placeholder="안전자산 목돈 예치"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Requirement 5: 어디 통장에서 빠져나가서 입금됐는지, 만기되면 어디 통장으로 받는지 선택 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-emerald-300">
                <div>
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-emerald-700" />
                    <span>출금 통장 (어디 통장에서 빠져나갔는지) <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={depositSourceAccount}
                    onChange={(e) => setDepositSourceAccount(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountName} (잔액: {formatKRW(acc.balance)})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    * 예금 등록 시 선택한 통장에서 예치 원금({formatCompactKRW(cleanDepositPrincipal)})이 즉시 출금 차감됩니다.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-teal-700" />
                    <span>만기 수령 통장 (만기 시 입금받을 통장) <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={depositPayoutAccount}
                    onChange={(e) => setDepositPayoutAccount(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    * 만기 해지/판매 시 원금+이자({formatCompactKRW(depositCalc.maturityAmount)})가 이 통장으로 입금됩니다.
                  </p>
                </div>
              </div>

              {/* Deposit maturity preview card */}
              <div className="rounded-lg border border-emerald-200 bg-white p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[11px] text-slate-500">세전 총 이자</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{formatKRW(depositCalc.grossInterest)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">이자소득세 (15.4%)</span>
                  <p className="font-mono font-bold text-rose-700 mt-0.5">-{formatKRW(depositCalc.taxAmount)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">세후 실수령 이자</span>
                  <p className="font-mono font-bold text-emerald-700 mt-0.5">+{formatKRW(depositCalc.netInterest)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">만기 예상 총 수령액</span>
                  <p className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">{formatKRW(depositCalc.maturityAmount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* 4. SAVINGS FORM (적립식 적금) */}
          {formMode === 'savings' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-slate-500 mr-1">인기 적금 상품 선택:</span>
                {DEPOSIT_SAVINGS_PRESETS.filter((p) => p.type === 'savings').map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectDepositSavingsPreset(preset)}
                    className="rounded border border-cyan-300 bg-cyan-50 px-2 py-1 text-cyan-900 hover:bg-cyan-100 transition-colors font-medium"
                  >
                    {preset.name} (연 {preset.interestRate}%, {preset.termMonths}개월)
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold text-slate-700">
                    적금 상품명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={savingsName}
                    onChange={(e) => setSavingsName(e.target.value)}
                    placeholder="예: 토스뱅크 굴비 적금"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">가입 은행</label>
                  <input
                    type="text"
                    value={savingsBank}
                    onChange={(e) => setSavingsBank(e.target.value)}
                    placeholder="토스뱅크"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-bold text-slate-700">
                    월 납입액 (원) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={savingsMonthly}
                    onChange={(e) => {
                      const d = e.target.value.replace(/[^\d]/g, '');
                      setSavingsMonthly(d ? Number(d).toLocaleString('ko-KR') : '');
                    }}
                    placeholder="예: 300,000"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">
                    연 이자율 (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={savingsRate}
                    onChange={(e) => setSavingsRate(e.target.value)}
                    placeholder="4.2"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-bold text-cyan-800 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">가입 기간 (개월)</label>
                  <select
                    value={savingsMonths}
                    onChange={(e) => setSavingsMonths(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    <option value={6}>6개월</option>
                    <option value={12}>12개월 (1년)</option>
                    <option value={24}>24개월 (2년)</option>
                    <option value={36}>36개월 (3년)</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={savingsTaxFree}
                      onChange={(e) => setSavingsTaxFree(e.target.checked)}
                      className="rounded border-slate-300 text-teal-700 focus:ring-teal-700"
                    />
                    <span>비과세 적용 (청년도약 등)</span>
                  </label>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">메모</label>
                  <input
                    type="text"
                    value={savingsMemo}
                    onChange={(e) => setSavingsMemo(e.target.value)}
                    placeholder="월 적립식 목돈 마련"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Requirement 5: 적금 어디 통장에서 자동이체 빠져나가는지, 만기되면 어디 통장으로 받는지 선택 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-lg border border-cyan-300">
                <div>
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-cyan-700" />
                    <span>출금 통장 (어디 통장에서 자동이체되는지) <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={savingsSourceAccount}
                    onChange={(e) => setSavingsSourceAccount(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountName} (잔액: {formatKRW(acc.balance)})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    * 매월 적금 불입 시 이 통장에서 자동이체로 출금됩니다.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-cyan-700" />
                    <span>만기 수령 통장 (만기 시 적금 원리금 입금 통장) <span className="text-rose-500">*</span></span>
                  </label>
                  <select
                    value={savingsPayoutAccount}
                    onChange={(e) => setSavingsPayoutAccount(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.accountName}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    * 만기 시 원금+세후이자({formatCompactKRW(savingsCalc.maturityAmount)})가 이 통장으로 입금됩니다.
                  </p>
                </div>
              </div>

              {/* Savings maturity preview card */}
              <div className="rounded-lg border border-cyan-200 bg-white p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[11px] text-slate-500">총 불입 원금</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{formatKRW(savingsCalc.totalPrincipal)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">세전 적금 이자</span>
                  <p className="font-mono font-bold text-cyan-800 mt-0.5">+{formatKRW(savingsCalc.grossInterest)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">세후 실수령 이자 (15.4% 공제)</span>
                  <p className="font-mono font-bold text-emerald-700 mt-0.5">+{formatKRW(savingsCalc.netInterest)}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-bold">만기 예상 수령액</span>
                  <p className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">{formatKRW(savingsCalc.maturityAmount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* 5. OTHER / BOND FORM */}
          {formMode === 'other' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700">
                  자산명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 미국30년국채 ETF"
                  value={otherName}
                  onChange={(e) => setOtherName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700">
                  매수 원금 (원) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 3,000,000"
                  value={otherInvested}
                  onChange={(e) => {
                    const d = e.target.value.replace(/[^\d]/g, '');
                    setOtherInvested(d ? Number(d).toLocaleString('ko-KR') : '');
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-700">
                  현재 평가 금액 (원)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 3,057,450"
                  value={otherValuation}
                  onChange={(e) => {
                    const d = e.target.value.replace(/[^\d]/g, '');
                    setOtherValuation(d ? Number(d).toLocaleString('ko-KR') : '');
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                />
              </div>
            </div>
          )}

          {formError && (
            <p role="alert" className="text-xs font-bold text-rose-600">
              {formError}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-900 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>
                {formMode === 'stock'
                  ? '네이버 주식 내역 저장하기'
                  : formMode === 'fund'
                  ? '지정일 펀드 내역 저장하기'
                  : formMode === 'deposit'
                  ? '정기예금 내역 저장하기'
                  : formMode === 'savings'
                  ? '적립식 적금 내역 저장하기'
                  : '투자 내역 저장하기'}
              </span>
            </button>
          </div>
        </form>
      </section>

      {/* Asset Allocation Donut Section */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            투자 포트폴리오 자산 배분 비중
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            주식, 펀드, ETF, 채권, 정기예금, 적립식 적금의 비중(%)과 평가액을 한눈에 분석합니다
          </p>
        </div>

        <PortfolioAllocationChart
          allocations={portfolio.assetAllocation}
          totalValuation={portfolio.totalValuation}
        />
      </section>

      {/* Holdings List with Dedicated Sell / Liquidation Buttons */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              보유 종목별 상세 현황 및 매도(판매) 관리
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              종목별로 [판매하기]를 누르면 실현 손익을 계산하여 <strong>이익은 수입 내역</strong>에, <strong>손실은 지출 내역</strong>에 자동 등록됩니다.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            총 {investments.length}개 보유 자산
          </span>
        </div>

        <div className="space-y-3.5">
          {investments.map((asset) => {
            const isProfit = asset.returnRate >= 0;
            const profitAmount = asset.currentValuation - asset.investedAmount;
            const isStock = asset.type === 'stock' || asset.type === 'etf';
            const isFund = asset.type === 'fund';
            const isDeposit = asset.type === 'deposit';
            const isSavings = asset.type === 'savings';
            const hasHistory = asset.purchaseHistory && asset.purchaseHistory.length > 0;
            const isHistoryExpanded = expandedHistoryId === asset.id;

            return (
              <div
                key={asset.id}
                className="group rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-800 font-bold text-sm">
                      {asset.type === 'stock'
                        ? '주'
                        : asset.type === 'fund'
                        ? '펀'
                        : asset.type === 'etf'
                        ? 'E'
                        : asset.type === 'deposit'
                        ? '예'
                        : asset.type === 'savings'
                        ? '적'
                        : '채'}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {asset.name}
                        </span>
                        {getAssetTypeBadge(asset.type)}
                        {asset.naverCode && (
                          <a
                            href={`https://finance.naver.com/item/main.naver?code=${asset.naverCode}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-100"
                            title="네이버 증권 시세 페이지 열기"
                          >
                            <span>네이버 증권</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                        {isFund && asset.scheduledDay && (
                          <span className="rounded bg-sky-50 border border-sky-200 px-1.5 py-0.5 text-[10px] font-bold text-sky-800">
                            매월 {asset.scheduledDay}일 지정 구매
                          </span>
                        )}
                        {(isDeposit || isSavings) && asset.interestRate && (
                          <span className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            연 {asset.interestRate}%
                          </span>
                        )}
                      </div>
                      {asset.memo && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {asset.memo}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions: SELL BUTTON + EDIT + DELETE */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Dedicated SELL / LIQUIDATE Button (Requirement) */}
                    <button
                      type="button"
                      onClick={() => handleOpenSellModal(asset)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
                        isProfit
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                          : 'border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 hover:border-rose-400'
                      }`}
                      title="종목을 판매하고 손익을 가계부 수입 또는 지출에 자동 반영합니다"
                    >
                      <Coins className="h-3.5 w-3.5" />
                      <span>{isDeposit || isSavings ? '해지하기 (판매)' : '판매하기 (매도)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(asset)}
                      aria-label={`${asset.name} 수정`}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAsset(asset.id)}
                      aria-label={`${asset.name} 삭제`}
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Specific Breakdown Formula Bar */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono tabular-nums">
                  {isStock && (
                    <>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">보유 주식 수</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {asset.sharesCount ? `${asset.sharesCount.toLocaleString()}주` : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">1주당 매수단가</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {asset.purchaseUnitPrice ? formatKRW(asset.purchaseUnitPrice) : formatKRW(asset.investedAmount / (asset.sharesCount || 1))}
                        </p>
                      </div>
                      <div className="rounded-lg bg-teal-50/80 border border-teal-300 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-teal-900">현재 1주당 가격</span>
                          <span className="text-[9px] text-teal-700 font-semibold bg-teal-100 px-1 rounded">직접 수정</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            defaultValue={(asset.currentUnitPrice ?? asset.currentPrice).toLocaleString('ko-KR')}
                            key={`${asset.id}-${asset.currentUnitPrice ?? asset.currentPrice}`}
                            onBlur={(e) => {
                              const cleanVal = Number(e.target.value.replace(/[^\d]/g, '')) || 0;
                              if (cleanVal <= 0) return;
                              const shares = asset.sharesCount || 1;
                              const newValuation = cleanVal * shares;
                              const newProfit = newValuation - asset.investedAmount;
                              const newReturn = asset.investedAmount > 0 ? Math.round((newProfit / asset.investedAmount) * 1000) / 10 : 0;
                              onEditAsset({
                                ...asset,
                                currentUnitPrice: cleanVal,
                                currentPrice: cleanVal,
                                currentValuation: newValuation,
                                returnRate: newReturn,
                                lastUpdated: `${DEFAULT_TODAY} 12:00:00`,
                              });
                            }}
                            className="w-full rounded border border-teal-300 bg-white px-1.5 py-0.5 text-xs font-mono font-bold text-teal-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-teal-700"
                          />
                          <span className="text-[11px] font-semibold text-slate-500 shrink-0">원</span>
                        </div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">현재 판매가 (총 평가액)</span>
                        <p className="font-bold text-slate-900 mt-0.5 font-mono">
                          {formatKRW(asset.currentValuation)}
                        </p>
                        <p className={`text-[10px] font-bold mt-0.5 ${profitAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          손익 {formatKRW(profitAmount, true)} ({formatPercent(asset.returnRate, true)})
                        </p>
                      </div>
                    </>
                  )}

                  {isFund && (
                    <>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">지정일 구매 설정</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          매월 {asset.scheduledDay ?? 10}일 ({formatCompactKRW(asset.scheduledAmount ?? 500000)})
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">현재 기준가(NAV)</span>
                        <p className="font-bold text-sky-900 mt-0.5">
                          {formatKRW(asset.fundNav ?? asset.currentPrice)} / 1천좌
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">지정일 누적 좌수</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {asset.accumulatedUnits ? `${asset.accumulatedUnits.toLocaleString()}좌` : '—'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">지정일 매수 이력</span>
                        {hasHistory ? (
                          <button
                            type="button"
                            onClick={() => setExpandedHistoryId(isHistoryExpanded ? null : asset.id)}
                            className="inline-flex items-center gap-1 font-bold text-sky-800 hover:underline mt-0.5"
                          >
                            <span>{asset.purchaseHistory!.length}회차 내역</span>
                            {isHistoryExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        ) : (
                          <p className="text-slate-400 mt-0.5">적립 중</p>
                        )}
                      </div>
                    </>
                  )}

                  {isDeposit && (
                    <>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">가입 은행 / 기간</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {asset.bankName ?? '신한은행'} ({asset.termMonths ?? 12}개월)
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">적용 금리</span>
                        <p className="font-bold text-emerald-800 mt-0.5">
                          연 {asset.interestRate ?? 3.6}% (단리)
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">현재까지 경과 이자</span>
                        <p className="font-bold text-emerald-700 mt-0.5">
                          +{formatKRW(asset.accruedInterest ?? (asset.currentValuation - asset.investedAmount))}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">만기 예상 수령액</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {formatKRW(asset.maturityAmount ?? asset.currentValuation)}
                        </p>
                      </div>
                    </>
                  )}

                  {isSavings && (
                    <>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">월 납입액 / 기간</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          월 {formatCompactKRW(asset.monthlyDeposit ?? 300000)} ({asset.termMonths ?? 6}개월)
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">약정 금리</span>
                        <p className="font-bold text-cyan-800 mt-0.5">
                          연 {asset.interestRate ?? 4.2}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">현재 누적 평가액</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {formatKRW(asset.currentValuation)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">만기 예상 수령액</span>
                        <p className="font-bold text-slate-900 mt-0.5">
                          {formatKRW(asset.maturityAmount ?? asset.currentValuation)}
                        </p>
                      </div>
                    </>
                  )}

                  {!isStock && !isFund && !isDeposit && !isSavings && (
                    <>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">자산 분류</span>
                        <p className="font-bold text-slate-900 mt-0.5">채권/기타</p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">매수 원금</span>
                        <p className="font-bold text-slate-900 mt-0.5">{formatKRW(asset.investedAmount)}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">현재 평가금액</span>
                        <p className="font-bold text-slate-900 mt-0.5">{formatKRW(asset.currentValuation)}</p>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-2">
                        <span className="text-[11px] text-slate-500">평가 수익률</span>
                        <p className={`font-bold mt-0.5 ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatPercent(asset.returnRate, true)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Deposit / Savings Account Linkage Display */}
                {(isDeposit || isSavings) && (asset.sourceAccountId || asset.payoutAccountId) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    {asset.sourceAccountId && (
                      <span className="inline-flex items-center gap-1.5">
                        <Wallet className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-500">출금 통장:</span>
                        <strong className="text-slate-800">
                          {bankAccounts.find((a) => a.id === asset.sourceAccountId)?.accountName ??
                            asset.sourceAccountId}
                        </strong>
                      </span>
                    )}
                    {asset.payoutAccountId && (
                      <span className="inline-flex items-center gap-1.5 border-l border-slate-200 pl-3">
                        <Building2 className="h-3 w-3 text-emerald-600" />
                        <span className="text-slate-500">만기 수령 통장:</span>
                        <strong className="text-emerald-800">
                          {bankAccounts.find((a) => a.id === asset.payoutAccountId)?.accountName ??
                            asset.payoutAccountId}
                        </strong>
                      </span>
                    )}
                  </div>
                )}

                {/* Expandable Fund History */}
                {isFund && hasHistory && isHistoryExpanded && (
                  <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/70 p-3">
                    <p className="text-xs font-bold text-sky-950 mb-2">
                      📅 지정일별 펀드 구매 및 당시 기준가 반영 내역:
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono tabular-nums">
                        <thead>
                          <tr className="border-b border-sky-200 text-[11px] text-sky-800">
                            <th className="py-1">구매일(지정일)</th>
                            <th className="py-1">매수 금액</th>
                            <th className="py-1">그 날의 기준가</th>
                            <th className="py-1">취득 좌수</th>
                            <th className="py-1">비고</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sky-100 text-slate-800">
                          {asset.purchaseHistory!.map((rec, idx) => (
                            <tr key={idx} className="hover:bg-sky-100/50">
                              <td className="py-1.5 font-bold text-slate-900">{rec.date}</td>
                              <td className="py-1.5">{formatKRW(rec.amount)}</td>
                              <td className="py-1.5 text-sky-900 font-bold">{formatKRW(rec.priceAtDate)}</td>
                              <td className="py-1.5 font-bold text-teal-800">{rec.units.toLocaleString()}좌</td>
                              <td className="py-1.5 text-slate-500 text-[11px]">{rec.note ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Plain-Korean Insight Sentence */}
                <div className="mt-3 rounded-lg bg-white border border-slate-200 px-4 py-3">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between text-xs">
                    <p className="text-slate-700">
                      원래 <strong className="font-mono font-semibold text-slate-900 tabular-nums">{formatKRW(asset.investedAmount)}</strong> 넣었는데,{' '}
                      지금 <strong className={`font-mono font-semibold tabular-nums ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatPercent(asset.returnRate, true)}
                      </strong>여서{' '}
                      <strong className="font-mono font-semibold text-slate-900 tabular-nums">{formatKRW(asset.currentValuation)}</strong>가 됐습니다.
                    </p>

                    <div className="flex items-center gap-3 font-mono text-xs tabular-nums text-slate-600">
                      <span className="flex items-center gap-1">
                        <span>평가손익:</span>
                        <strong className={`font-semibold ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatKRW(profitAmount, true)}
                        </strong>
                      </span>
                      {asset.dailyChangeRate !== undefined && (
                        <span className="flex items-center gap-0.5 text-slate-500">
                          <span>(오늘 12시:</span>
                          <span className={asset.dailyChangeRate >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                            {formatPercent(asset.dailyChangeRate, true)}
                          </span>
                          <span>)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sell Asset Modal Component */}
      <SellAssetModal
        isOpen={isSellModalOpen}
        asset={sellingAsset}
        bankAccounts={bankAccounts}
        onClose={() => {
          setIsSellModalOpen(false);
          setSellingAsset(null);
        }}
        onConfirmSell={onSellAsset}
      />

      {/* Edit Asset Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                투자 자산 / 금융 상품 수정
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAsset} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  자산명
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    매수 원금 (원)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={modalInvested}
                    onChange={(e) => {
                      const d = e.target.value.replace(/[^\d]/g, '');
                      setModalInvested(d ? Number(d).toLocaleString('ko-KR') : '');
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    현재 평가 금액 (원)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={modalValuation}
                    onChange={(e) => {
                      const d = e.target.value.replace(/[^\d]/g, '');
                      setModalValuation(d ? Number(d).toLocaleString('ko-KR') : '');
                    }}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  메모
                </label>
                <input
                  type="text"
                  value={modalMemo}
                  onChange={(e) => setModalMemo(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>

              {modalError && (
                <p role="alert" className="text-xs font-medium text-rose-600">
                  {modalError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-900"
                >
                  <Check className="h-4 w-4" />
                  <span>수정 내용 저장하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
