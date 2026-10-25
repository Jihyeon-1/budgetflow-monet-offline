import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Coins,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { BankAccount, InvestmentAsset } from '../types/ledger';
import { formatKRW, formatPercent } from '../utils/ledgerMath';

interface SellAssetModalProps {
  isOpen: boolean;
  asset: InvestmentAsset | null;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onConfirmSell: (
    asset: InvestmentAsset,
    sellProceeds: number,
    realizedProfit: number,
    targetAccountId: string,
    soldShares?: number
  ) => void;
}

export const SellAssetModal: React.FC<SellAssetModalProps> = ({
  isOpen,
  asset,
  bankAccounts,
  onClose,
  onConfirmSell,
}) => {
  const [saleRatio, setSaleRatio] = useState<number>(100); // 10% to 100%
  const [selectedShares, setSelectedShares] = useState<number>(0);
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (asset) {
      setSaleRatio(100);
      if (asset.sharesCount && asset.sharesCount > 0) {
        setSelectedShares(asset.sharesCount);
      } else {
        setSelectedShares(0);
      }
      // Prefer designated payout account if set on asset (e.g., for deposit maturity), else CMA, else default
      const designatedAcc = asset.payoutAccountId
        ? bankAccounts.find((a) => a.id === asset.payoutAccountId)
        : null;
      const cmaAcc = bankAccounts.find(
        (a) => a.accountName.includes('투자') || a.accountName.includes('CMA') || a.bankName.includes('증권')
      );
      const defaultAcc = bankAccounts.find((a) => a.isDefault) ?? bankAccounts[0];
      setTargetAccountId(
        designatedAcc
          ? designatedAcc.id
          : cmaAcc
          ? cmaAcc.id
          : defaultAcc
          ? defaultAcc.id
          : ''
      );
      setError(null);
    }
  }, [asset, bankAccounts, isOpen]);

  if (!isOpen || !asset) return null;

  const isStockLike = (asset.type === 'stock' || asset.type === 'etf') && Boolean(asset.sharesCount && asset.sharesCount > 0);
  const totalShares = asset.sharesCount || 0;

  // Handle share count changes
  const handleSharesChange = (val: number) => {
    const clamped = Math.max(1, Math.min(totalShares, val));
    setSelectedShares(clamped);
    if (totalShares > 0) {
      setSaleRatio(Math.round((clamped / totalShares) * 100));
    }
  };

  // Handle ratio slider changes
  const handleRatioChange = (ratio: number) => {
    setSaleRatio(ratio);
    if (isStockLike && totalShares > 0) {
      const calculatedShares = Math.max(1, Math.round((totalShares * ratio) / 100));
      setSelectedShares(calculatedShares);
    }
  };

  // Financial calculations
  const effectiveRatio = isStockLike && totalShares > 0 ? selectedShares / totalShares : saleRatio / 100;
  const soldInvested = Math.round(asset.investedAmount * effectiveRatio);
  const sellProceeds = Math.round(asset.currentValuation * effectiveRatio);
  const realizedProfit = sellProceeds - soldInvested;
  const realizedReturnRate = soldInvested > 0 ? Math.round((realizedProfit / soldInvested) * 1000) / 10 : 0;
  const isProfit = realizedProfit > 0;
  const isLoss = realizedProfit < 0;

  const targetAccount = bankAccounts.find((a) => a.id === targetAccountId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccountId) {
      setError('매도 대금을 입금받을 통장을 선택해 주세요.');
      return;
    }
    if (sellProceeds <= 0) {
      setError('판매 금액이 0원 이하입니다.');
      return;
    }

    onConfirmSell(
      asset,
      sellProceeds,
      realizedProfit,
      targetAccountId,
      isStockLike ? selectedShares : undefined
    );
    onClose();
  };

  const getActionName = () => {
    switch (asset.type) {
      case 'stock':
      case 'etf':
        return '주식 매도하기';
      case 'fund':
        return '펀드 환매하기';
      case 'deposit':
        return '예금 해지하기';
      case 'savings':
        return '적금 해지하기';
      case 'bond':
      default:
        return '채권 매도하기';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800">
                {getActionName()}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{asset.name}</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              원금 대비 실현 손익을 계산하여 가계부 수입 또는 지출에 자동 반영합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Holding Snapshot */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
            <div>
              <span className="text-[11px] font-medium text-slate-500">총 매수 원금</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {formatKRW(asset.investedAmount)}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500">현재 총 평가금액</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {formatKRW(asset.currentValuation)}
              </div>
            </div>
            {asset.sharesCount && (
              <div className="col-span-2 border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs text-slate-600">
                <span>보유 수량: <strong className="font-mono text-slate-900">{asset.sharesCount.toLocaleString()}주</strong></span>
                <span>1주당 현재가: <strong className="font-mono text-slate-900">{formatKRW(asset.currentUnitPrice || asset.currentPrice)}</strong></span>
              </div>
            )}
            {asset.fundNav && (
              <div className="col-span-2 border-t border-slate-200/80 pt-2 flex items-center justify-between text-xs text-slate-600">
                <span>보유 좌수: <strong className="font-mono text-slate-900">{asset.accumulatedUnits?.toLocaleString() || '-'}좌</strong></span>
                <span>기준가 (1,000좌): <strong className="font-mono text-slate-900">{formatKRW(asset.fundNav)}</strong></span>
              </div>
            )}
          </div>

          {/* Sell Quantity / Proportion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                판매 수량 / 비율 선택
              </label>
              <div className="flex gap-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleRatioChange(pct)}
                    className={`rounded border px-2 py-0.5 text-xs font-medium transition-colors ${
                      saleRatio === pct
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pct === 100 ? '전액 (100%)' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {isStockLike ? (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={totalShares}
                  value={selectedShares}
                  onChange={(e) => handleSharesChange(Number(e.target.value))}
                  className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-bold text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <span className="text-xs text-slate-600">
                  주 판매 (총 {totalShares.toLocaleString()}주 중 {saleRatio}%)
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={saleRatio}
                  onChange={(e) => handleRatioChange(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="w-12 text-right text-xs font-bold font-mono text-slate-800">
                  {saleRatio}%
                </span>
              </div>
            )}
          </div>

          {/* Realized Profit & Loss Result Card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>판매할 원금</span>
              <span className="font-mono font-medium text-slate-800">{formatKRW(soldInvested)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>판매 총 대금 (환급/매도액)</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{formatKRW(sellProceeds)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">최종 실현 손익</span>
                <span className={`text-[11px] font-semibold px-1.5 py-0.2 rounded font-mono ${
                  isProfit ? 'bg-emerald-100 text-emerald-800' : isLoss ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {formatPercent(realizedReturnRate, true)}
                </span>
              </div>
              <div className={`text-base font-extrabold font-mono flex items-center gap-1 ${
                isProfit ? 'text-emerald-700' : isLoss ? 'text-rose-700' : 'text-slate-800'
              }`}>
                {isProfit ? <ArrowUpRight className="h-5 w-5" /> : isLoss ? <ArrowDownRight className="h-5 w-5" /> : null}
                {formatKRW(realizedProfit, true)}
              </div>
            </div>
          </div>

          {/* Automatic Cashflow Guidance Banner (Requirement) */}
          {isProfit && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/90 p-3.5 text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">
                  수익 실현 (+{formatKRW(realizedProfit)}) 자동 수입 등록
                </p>
                <p className="mt-0.5 text-emerald-800 text-[11px] leading-relaxed">
                  이익금 <strong>{formatKRW(realizedProfit)}</strong>이 가계부의 <strong>[투자수익 · 배당금] 수입 내역</strong>에 자동으로 등록되며 대시보드 달력(초록색)에 실시간 반영됩니다.
                </p>
              </div>
            </div>
          )}

          {isLoss && (
            <div className="rounded-lg border border-rose-300 bg-rose-50/90 p-3.5 text-xs text-rose-950 flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">
                  손실 실현 (-{formatKRW(Math.abs(realizedProfit))}) 자동 지출 등록
                </p>
                <p className="mt-0.5 text-rose-800 text-[11px] leading-relaxed">
                  손실액 <strong>{formatKRW(Math.abs(realizedProfit))}</strong>이 가계부의 <strong>[투자 손실 · 매도 손해] 지출 내역</strong>에 자동으로 등록되며 대시보드 달력(빨간색)에 실시간 반영됩니다.
                </p>
              </div>
            </div>
          )}

          {!isProfit && !isLoss && (
            <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 text-xs text-slate-700 flex items-center gap-2">
              <Coins className="h-4 w-4 text-slate-500" />
              <span>원금 그대로 환급: 손익 없이 매도 총 대금 {formatKRW(sellProceeds)}원이 통장에 입금됩니다.</span>
            </div>
          )}

          {/* Target Bank Account Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-slate-500" />
              매도 대금 입금 통장 선택 <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetAccountId}
              onChange={(e) => setTargetAccountId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            >
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} - {acc.accountName} (현재 잔액: {formatKRW(acc.balance)})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              판매 완료 시 매도 대금 <strong className="font-mono text-slate-800">{formatKRW(sellProceeds)}</strong>이 해당 통장 잔액에 즉시 합산 입금됩니다.
            </p>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className={`rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors flex items-center gap-1.5 ${
                isProfit
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : isLoss
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <span>{getActionName()} 완료 & 가계부 자동 반영</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
