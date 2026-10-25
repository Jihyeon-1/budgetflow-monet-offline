import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Flame,
  Pencil,
  RotateCcw,
  SlidersHorizontal,
  X,
  XCircle,
} from 'lucide-react';
import {
  BudgetHealth,
  BudgetStatusItem,
  Category,
  CategoryBudgetMap,
  MonthlySummary,
  OverspendingSummary,
  Transaction,
  TransactionType,
} from '../types/ledger';
import { formatKRW } from '../utils/ledgerMath';

interface BudgetsViewProps {
  yearMonthLabel: string;
  summary: MonthlySummary;
  overspending: OverspendingSummary;
  budgetStatuses: BudgetStatusItem[];
  categories: Category[];
  onUpdateCategoryBudget: (categoryId: string, amount: number) => void;
  onApplyRecommendedBudgets: () => void;
  onResetDefaultBudgets: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  yearMonthLabel,
  summary,
  overspending,
  budgetStatuses,
  categories,
  onUpdateCategoryBudget,
  onApplyRecommendedBudgets,
  onResetDefaultBudgets,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftAmount, setDraftAmount] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const startEditing = (item: BudgetStatusItem) => {
    setEditingId(item.categoryId);
    setDraftAmount(item.budget.toLocaleString('ko-KR'));
    setInputError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftAmount('');
    setInputError(null);
  };

  const handleSaveBudget = (categoryId: string) => {
    const cleaned = draftAmount.replace(/,/g, '').trim();
    const numeric = Number(cleaned);
    if (cleaned === '' || Number.isNaN(numeric) || numeric < 0) {
      setInputError('0원 이상의 올바른 예산 금액을 입력해 주세요.');
      return;
    }
    if (numeric > 1000000000) {
      setInputError('예산 한도는 10억 원 이하로 설정해 주세요.');
      return;
    }
    onUpdateCategoryBudget(categoryId, Math.round(numeric));
    cancelEditing();
  };

  const adjustDraft = (delta: number) => {
    const current = Number(draftAmount.replace(/,/g, '')) || 0;
    const next = Math.max(0, current + delta);
    setDraftAmount(next.toLocaleString('ko-KR'));
    setInputError(null);
  };

  const renderStatusLabel = (item: BudgetStatusItem) => {
    if (item.health === BudgetHealth.EXCEEDED) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 whitespace-nowrap">
          <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{item.statusLabel}</span>
        </span>
      );
    }
    if (item.health === BudgetHealth.WARNING) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 whitespace-nowrap">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{item.statusLabel}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{item.statusLabel}</span>
      </span>
    );
  };

  const totalBarPct = Math.min(100, Math.max(0, summary.budgetUtilization));

  return (
    <div className="space-y-6">
      {/* Monthly Budget Master Strip */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {yearMonthLabel} 월간 예산 운용 현황
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              각 지출 카테고리별 목표 한도를 설정하고 실시간 소진율을 모니터링합니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onApplyRecommendedBudgets}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>전월 실적 기반 자동 배분</span>
            </button>
            <button
              type="button"
              onClick={onResetDefaultBudgets}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>기본 한도로 복원</span>
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 border-t border-slate-100 pt-5 md:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">월 목표 예산 합계</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatKRW(summary.totalBudget)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {budgetStatuses.length}개 지출 카테고리 합산
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">현재 누적 지출액 및 소진율</p>
            <p className="mt-1 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatKRW(summary.totalExpense)}{' '}
              <span className="text-sm font-medium text-slate-500">
                ({summary.budgetUtilization.toFixed(1)}%)
              </span>
            </p>
            {overspending.totalAmount > 0 && (
              <p className="mt-1 text-xs text-rose-700 flex items-center gap-1 font-medium">
                <Flame className="h-3.5 w-3.5" />
                <span>과소비 포함 {formatKRW(overspending.totalAmount)}</span>
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-500">잔여 가용 예산</p>
            <p
              className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                summary.budgetRemaining < 0
                  ? 'text-rose-700'
                  : 'text-emerald-700'
              }`}
            >
              {formatKRW(summary.budgetRemaining)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              남은 일자 일 권장:{' '}
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                {formatKRW(summary.dailyRecommendedBudget)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-3 w-full overflow-hidden rounded-[4px] bg-slate-100">
            <div
              className={`h-full rounded-[4px] ${
                summary.budgetHealth === BudgetHealth.EXCEEDED
                  ? 'bg-rose-600'
                  : summary.budgetHealth === BudgetHealth.WARNING
                    ? 'bg-amber-500'
                    : 'bg-teal-700'
              }`}
              style={{ width: `${totalBarPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Category Budget Cards */}
      <section
        aria-label="카테고리별 예산 한도 목록"
        className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white"
      >
        {budgetStatuses.map((item) => {
          const isEditing = editingId === item.categoryId;
          const barPct = Math.min(100, Math.max(0, item.utilizationPercent));
          const barColor =
            item.health === BudgetHealth.EXCEEDED
              ? 'bg-rose-600'
              : item.health === BudgetHealth.WARNING
                ? 'bg-amber-500'
                : 'bg-teal-700';

          return (
            <div key={item.categoryId} className="p-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: item.color }}
                  />
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.label}
                  </h3>
                  <span aria-hidden="true" className="text-xs text-slate-300">·</span>
                  {renderStatusLabel(item)}
                </div>

                {!isEditing && (
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-right font-mono text-xs tabular-nums">
                      <span className="font-bold text-slate-900">
                        {formatKRW(item.spent)}
                      </span>
                      <span className="text-slate-400"> / </span>
                      <span className="text-slate-600">
                        {formatKRW(item.budget)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      aria-label={`${item.label} 한도 수정`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>한도 수정</span>
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="mt-3 rounded-lg bg-slate-50 p-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label
                      htmlFor={`budget-input-${item.categoryId}`}
                      className="text-xs font-semibold text-slate-700 whitespace-nowrap"
                    >
                      목표 월 한도 (원)
                    </label>
                    <input
                      id={`budget-input-${item.categoryId}`}
                      type="text"
                      inputMode="numeric"
                      value={draftAmount}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/[^\d]/g, '');
                        setDraftAmount(
                          digits ? Number(digits).toLocaleString('ko-KR') : ''
                        );
                        setInputError(null);
                      }}
                      className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                    />

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustDraft(-50000)}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                      >
                        -5만
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustDraft(50000)}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                      >
                        +5만
                      </button>
                    </div>

                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>취소</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveBudget(item.categoryId)}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>저장</span>
                      </button>
                    </div>
                  </div>
                  {inputError && (
                    <p role="alert" className="mt-2 text-xs text-rose-600">
                      {inputError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-2.5">
                  <div className="h-2 w-full overflow-hidden rounded-[3px] bg-slate-100">
                    <div
                      className={`h-full rounded-[3px] ${barColor}`}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-slate-500 tabular-nums">
                    <span>소진율 {item.utilizationPercent.toFixed(1)}%</span>
                    <span
                      className={
                        item.remaining < 0
                          ? 'font-medium text-rose-700'
                          : 'text-slate-600'
                      }
                    >
                      {item.remaining < 0
                        ? `${formatKRW(Math.abs(item.remaining))} 초과 지출`
                        : `${formatKRW(item.remaining)} 여유`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};
