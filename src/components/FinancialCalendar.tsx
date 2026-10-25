import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Info,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { getSystemTodayString, getSystemYearMonthString } from '../data/seedData';
import { CalendarDayItem, Transaction, TransactionType } from '../types/ledger';
import {
  formatCompactKRW,
  formatKRW,
  formatYearMonthLabel,
  generateCalendarDays,
  shiftYearMonth,
} from '../utils/ledgerMath';

interface FinancialCalendarProps {
  yearMonth: string;
  transactions: Transaction[];
  today?: string;
  onChangeYearMonth: (nextYm: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddTransactionForDate?: (dateStr: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const FinancialCalendar: React.FC<FinancialCalendarProps> = ({
  yearMonth,
  transactions,
  today = getSystemTodayString(),
  onChangeYearMonth,
  onEditTransaction,
  onDeleteTransaction,
  onAddTransactionForDate,
}) => {
  const actualToday = today || getSystemTodayString();
  const [selectedDate, setSelectedDate] = useState<string | null>(actualToday);

  const days: CalendarDayItem[] = React.useMemo(() => {
    return generateCalendarDays(yearMonth, transactions, actualToday);
  }, [yearMonth, transactions, actualToday]);

  // Month total summary
  const monthTxs = transactions.filter((t) => t.date.startsWith(yearMonth));
  const monthIncome = monthTxs
    .filter((t) => t.type === TransactionType.INCOME)
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxs
    .filter((t) => t.type === TransactionType.EXPENSE)
    .reduce((s, t) => s + t.amount, 0);

  const selectedDayItem = days.find((d) => d.dateString === selectedDate);

  const handleJumpToToday = () => {
    const currentYm = getSystemYearMonthString();
    const currentToday = getSystemTodayString();
    onChangeYearMonth(currentYm);
    setSelectedDate(currentToday);
  };

  return (
    <section
      aria-label="가계부 일별 달력"
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs"
    >
      {/* Calendar Header with Navigation Arrows */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-teal-800" />
            <h2 className="text-base font-bold text-slate-900">
              일별 수입·지출 가계부 달력
            </h2>
            <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              오늘: {actualToday}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            매일 얼마를 썼는지(<strong className="text-rose-600 font-bold">빨간색 글씨</strong>)와 얼마가 들어왔는지(<strong className="text-emerald-700 font-bold">초록색 글씨</strong>)를 한눈에 파악합니다.
          </p>
        </div>

        {/* Month Navigation & Quick Totals */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Today Jump Button */}
          <button
            type="button"
            onClick={handleJumpToToday}
            className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shadow-2xs"
            title="현재 실제 오늘 날짜로 즉시 이동합니다"
          >
            <span>오늘</span>
          </button>

          {/* Month Switcher Arrows */}
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => onChangeYearMonth(shiftYearMonth(yearMonth, -1))}
              aria-label="이전 달 이동"
              className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 shadow-2xs transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 font-mono text-xs font-bold text-slate-900 tabular-nums">
              {formatYearMonthLabel(yearMonth)}
            </span>
            <button
              type="button"
              onClick={() => onChangeYearMonth(shiftYearMonth(yearMonth, 1))}
              aria-label="다음 달 이동"
              className="flex h-7 w-7 items-center justify-center rounded text-slate-600 hover:bg-white hover:text-slate-900 shadow-2xs transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Month Indicators */}
          <div className="flex items-center gap-1.5 text-[11px] font-mono tabular-nums">
            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 font-bold text-emerald-800">
              수입 +{formatCompactKRW(monthIncome)}
            </span>
            <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-1 font-bold text-rose-700">
              지출 -{formatCompactKRW(monthExpense)}
            </span>
          </div>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="mt-4 grid grid-cols-7 gap-px rounded-t-lg bg-slate-100 text-center text-xs font-bold text-slate-600">
        {WEEKDAYS.map((wd, idx) => (
          <div
            key={wd}
            className={`py-2 ${
              idx === 0 ? 'text-rose-600' : idx === 6 ? 'text-sky-600' : 'text-slate-700'
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-b-lg overflow-hidden border border-slate-200">
        {days.map((day) => {
          const isSelected = selectedDate === day.dateString;
          const hasIncome = day.income > 0;
          const hasExpense = day.expense > 0;

          return (
            <div
              key={day.dateString}
              onClick={() => setSelectedDate(day.dateString)}
              className={`min-h-[82px] sm:min-h-[96px] p-1.5 sm:p-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                day.isCurrentMonth
                  ? isSelected
                    ? 'bg-teal-50/80 ring-2 ring-teal-700 ring-inset z-10'
                    : day.isToday
                    ? 'bg-blue-50/80 ring-1 ring-blue-400 ring-inset hover:bg-blue-100/60'
                    : 'bg-white hover:bg-slate-50'
                  : 'bg-slate-50/60 opacity-50 hover:opacity-80'
              }`}
            >
              {/* Day Header: Number + Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                      day.isToday
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : isSelected
                          ? 'bg-teal-700 text-white font-bold'
                          : 'text-slate-700'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                  {day.isToday && (
                    <span className="rounded bg-blue-600 px-1 py-0.2 text-[9px] font-extrabold text-white">
                      오늘
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5">
                  {day.hasOverspending && (
                    <span
                      title="과소비 발생"
                      className="inline-flex items-center text-rose-600"
                    >
                      <Flame className="h-3 w-3 fill-rose-600" />
                    </span>
                  )}
                  {day.transactions.length > 0 && (
                    <span className="hidden sm:inline font-mono text-[10px] text-slate-400">
                      {day.transactions.length}건
                    </span>
                  )}
                </div>
              </div>

              {/* Day Amounts (Red for Expense, Green for Income) */}
              <div className="mt-1 space-y-0.5 text-right font-mono text-[11px] sm:text-xs leading-tight tabular-nums">
                {/* 초록색 글씨: 수입 */}
                {hasIncome ? (
                  <p
                    title={`수입: ${formatKRW(day.income)}`}
                    className="font-bold text-emerald-700 truncate"
                  >
                    +{formatCompactKRW(day.income)}
                  </p>
                ) : null}

                {/* 빨간색 글씨: 지출 */}
                {hasExpense ? (
                  <p
                    title={`지출: ${formatKRW(day.expense)}`}
                    className="font-bold text-rose-600 truncate"
                  >
                    -{formatCompactKRW(day.expense)}
                  </p>
                ) : null}

                {!hasIncome && !hasExpense && (
                  <span className="text-[10px] text-slate-300 select-none sm:inline hidden">
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Details Panel */}
      {selectedDayItem && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-900">
                📅 {selectedDayItem.dateString} 내역
              </span>
              <span className="text-xs text-slate-500">
                (총 {selectedDayItem.transactions.length}건)
              </span>
              {selectedDayItem.isToday && (
                <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-800">
                  오늘
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums">
              {selectedDayItem.income > 0 && (
                <span className="font-bold text-emerald-700">
                  수입 +{formatKRW(selectedDayItem.income)}
                </span>
              )}
              {selectedDayItem.expense > 0 && (
                <span className="font-bold text-rose-600">
                  지출 -{formatKRW(selectedDayItem.expense)}
                </span>
              )}
              {onAddTransactionForDate && (
                <button
                  type="button"
                  onClick={() => onAddTransactionForDate(selectedDayItem.dateString)}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>이 날짜에 기록</span>
                </button>
              )}
            </div>
          </div>

          {selectedDayItem.transactions.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">
              이 날짜에는 기록된 거래 내역이 없습니다.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-slate-200/70">
              {selectedDayItem.transactions.map((tx) => {
                const isIncome = tx.type === TransactionType.INCOME;
                return (
                  <div
                    key={tx.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isIncome ? 'bg-emerald-600' : 'bg-rose-500'
                        }`}
                      />
                      <span className="text-xs font-bold text-slate-900">
                        {tx.title}
                      </span>
                      {tx.isOverspending && (
                        <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 flex items-center gap-0.5">
                          <Flame className="h-2.5 w-2.5 fill-rose-600" />
                          과소비
                        </span>
                      )}
                      {tx.incomeSource && (
                        <span className="text-[11px] text-emerald-800">
                          (출처: {tx.incomeSource})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs tabular-nums">
                      <span
                        className={`font-bold ${
                          isIncome ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isIncome
                          ? `+${formatKRW(tx.amount)}`
                          : `-${formatKRW(tx.amount)}`}
                      </span>

                      <div className="flex items-center gap-1">
                        {onEditTransaction && (
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            aria-label={`${tx.title} 수정`}
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDeleteTransaction && (
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            aria-label={`${tx.title} 삭제`}
                            className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
