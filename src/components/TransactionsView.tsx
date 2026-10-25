import React from 'react';
import { Download, Flame, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { BankAccount, Category, Transaction, TransactionType } from '../types/ledger';
import { formatKRW, transactionsToCSV } from '../utils/ledgerMath';

interface TransactionsViewProps {
  yearMonthLabel: string;
  filteredTransactions: Transaction[];
  categories: Category[];
  bankAccounts: BankAccount[];
  typeFilter: 'all' | TransactionType;
  categoryFilter: 'all' | string;
  accountFilter: 'all' | string;
  overspendingOnly: boolean;
  searchQuery: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
  onChangeTypeFilter: (val: 'all' | TransactionType) => void;
  onChangeCategoryFilter: (val: 'all' | string) => void;
  onChangeAccountFilter: (val: 'all' | string) => void;
  onToggleOverspendingOnly: () => void;
  onChangeSearchQuery: (val: string) => void;
  onChangeSortBy: (
    val: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  ) => void;
  onResetFilters: () => void;
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  yearMonthLabel,
  filteredTransactions,
  categories,
  bankAccounts,
  typeFilter,
  categoryFilter,
  accountFilter,
  overspendingOnly,
  searchQuery,
  sortBy,
  onChangeTypeFilter,
  onChangeCategoryFilter,
  onChangeAccountFilter,
  onToggleOverspendingOnly,
  onChangeSearchQuery,
  onChangeSortBy,
  onResetFilters,
  onOpenAddModal,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(bankAccounts.map((a) => [a.id, a]));

  const hasActiveFilter =
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    accountFilter !== 'all' ||
    overspendingOnly ||
    searchQuery.trim().length > 0;

  const filteredIncome = filteredTransactions
    .filter((tx) => tx.type === TransactionType.INCOME)
    .reduce((s, tx) => s + tx.amount, 0);

  const filteredExpense = filteredTransactions
    .filter((tx) => tx.type === TransactionType.EXPENSE)
    .reduce((s, tx) => s + tx.amount, 0);

  const handleDownloadCSV = () => {
    const csv = transactionsToCSV(
      filteredTransactions,
      categories,
      bankAccounts
    );
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BudgetFlow_${yearMonthLabel.replace(/\s+/g, '')}_거래내역.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <section
        aria-label="거래 내역 검색 및 필터"
        className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Segmented Type Filter */}
          <div
            role="group"
            aria-label="수입 및 지출 유형 필터"
            className="inline-flex self-start rounded-lg bg-slate-100 p-1"
          >
            {[
              { value: 'all' as const, label: '전체 내역' },
              { value: TransactionType.EXPENSE, label: '지출만' },
              { value: TransactionType.INCOME, label: '수입만' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChangeTypeFilter(opt.value)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === opt.value
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Overspending Filter Toggle (Requirement 5) */}
          <button
            type="button"
            onClick={onToggleOverspendingOnly}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap self-start ${
              overspendingOnly
                ? 'border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-200'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Flame className={`h-3.5 w-3.5 ${overspendingOnly ? 'text-rose-600 fill-rose-600' : 'text-slate-400'}`} />
            <span>과소비 내역만 보기</span>
          </button>

          {/* Search + Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <label htmlFor="tx-search-input" className="sr-only">
                검색
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="tx-search-input"
                type="search"
                placeholder="내역명, 수익출처, 메모 검색"
                value={searchQuery}
                onChange={(e) => onChangeSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>

            {/* Category Select */}
            <select
              value={categoryFilter}
              onChange={(e) => onChangeCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-teal-700 focus:outline-none"
            >
              <option value="all">모든 카테고리</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({c.type === TransactionType.INCOME ? '수입' : '지출'})
                </option>
              ))}
            </select>

            {/* Bank Account Select (Requirement 2 & 3) */}
            <select
              value={accountFilter}
              onChange={(e) => onChangeAccountFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-teal-700 focus:outline-none"
            >
              <option value="all">모든 통장</option>
              {bankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bankName} - {a.accountName}
                </option>
              ))}
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) =>
                onChangeSortBy(
                  e.target.value as
                    | 'date_desc'
                    | 'date_asc'
                    | 'amount_desc'
                    | 'amount_asc'
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-teal-700 focus:outline-none"
            >
              <option value="date_desc">최신순</option>
              <option value="date_asc">오래된순</option>
              <option value="amount_desc">금액 높은순</option>
              <option value="amount_asc">금액 낮은순</option>
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>초기화</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV 내보내기</span>
            </button>
          </div>
        </div>

        {/* Filtered Subtotal Bar */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div>
            조회된 거래{' '}
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {filteredTransactions.length}건
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums">
            <span>
              수입 합계{' '}
              <strong className="font-semibold text-emerald-700">
                +{formatKRW(filteredIncome)}
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              지출 합계{' '}
              <strong className="font-semibold text-slate-900">
                -{formatKRW(filteredExpense)}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* High Density Table */}
      <section className="rounded-xl border border-slate-200 bg-white">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-800">
              조건에 일치하는 거래 내역이 없습니다.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              검색어나 카테고리, 통장 필터를 변경해 보세요.
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-600">
                  <th className="py-3 pr-3 pl-5 min-w-[100px] whitespace-nowrap">날짜</th>
                  <th className="py-3 px-3 min-w-[180px] sm:min-w-[220px]">내역명 및 수익출처</th>
                  <th className="py-3 px-3 min-w-[110px] whitespace-nowrap">카테고리</th>
                  <th className="py-3 px-3 min-w-[120px] whitespace-nowrap">연결 통장</th>
                  <th className="hidden py-3 px-3 md:table-cell min-w-[130px]">메모</th>
                  <th className="py-3 px-3 text-right min-w-[100px] whitespace-nowrap">금액</th>
                  <th className="py-3 pr-5 pl-3 text-right min-w-[70px] whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === TransactionType.INCOME;
                  const cat = catMap.get(tx.categoryId);
                  const acc = accMap.get(tx.accountId);

                  return (
                    <tr
                      key={tx.id}
                      className="transition-colors hover:bg-slate-50/80"
                    >
                      <td className="py-3 pr-3 pl-5 whitespace-nowrap align-top">
                        <div className="flex flex-col items-start gap-1">
                          <span className="font-mono text-slate-600 tabular-nums">
                            {tx.date}
                          </span>
                          {tx.isOverspending && (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 tracking-tight">
                              <Flame className="h-2.5 w-2.5 fill-rose-600 text-rose-600 shrink-0" />
                              <span>과소비</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 align-top min-w-[180px] sm:min-w-[220px]">
                        <div className="break-keep leading-snug">
                          <span className="text-slate-900">{tx.title}</span>
                          {isIncome && tx.incomeSource && (
                            <p className="text-[11px] text-emerald-800 font-normal mt-0.5 break-keep">
                              출처: {tx.incomeSource}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap align-top">
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: cat?.color ?? '#6f6d96' }}
                          />
                          <span>{cat?.label ?? tx.categoryId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap align-top">
                        <div className="pt-0.5">
                          <span className="font-medium text-slate-800">
                            {acc?.accountName ?? '—'}
                          </span>
                          <span className="text-slate-400 text-[11px]"> ({acc?.bankName ?? tx.paymentMethod})</span>
                        </div>
                      </td>
                      <td className="hidden max-w-[180px] truncate py-3 px-3 text-slate-500 md:table-cell align-top">
                        <div className="pt-0.5">{tx.memo ?? '—'}</div>
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold tabular-nums whitespace-nowrap align-top ${
                          isIncome ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        <div className="pt-0.5">
                          {isIncome ? `+${formatKRW(tx.amount)}` : `-${formatKRW(tx.amount)}`}
                        </div>
                      </td>
                      <td className="py-3 pr-5 pl-3 text-right whitespace-nowrap align-top">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            aria-label={`${tx.title} 수정`}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            aria-label={`${tx.title} 삭제`}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
