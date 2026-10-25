import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Flame,
  Plus,
} from 'lucide-react';
import { BankAccount, Category, Transaction, TransactionType } from '../types/ledger';

interface QuickEntryCardProps {
  categories: Category[];
  bankAccounts: BankAccount[];
  defaultDate: string;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

export const QuickEntryCard: React.FC<QuickEntryCardProps> = ({
  categories,
  bankAccounts,
  defaultDate,
  onAddTransaction,
}) => {
  const [activeType, setActiveType] = useState<TransactionType>(
    TransactionType.EXPENSE
  );

  // Common fields
  const [date, setDate] = useState<string>(defaultDate);
  const [amountStr, setAmountStr] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expense specific
  const expenseCategories = categories.filter(
    (c) => c.type === TransactionType.EXPENSE
  );
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>(
    expenseCategories[0]?.id ?? ''
  );
  const [expenseAccountId, setExpenseAccountId] = useState<string>(
    bankAccounts[0]?.id ?? ''
  );
  const [expensePaymentMethod, setExpensePaymentMethod] =
    useState<string>('신한카드');
  const [isOverspending, setIsOverspending] = useState<boolean>(false);
  const [isFixed, setIsFixed] = useState<boolean>(false);

  // Income specific
  const incomeCategories = categories.filter(
    (c) => c.type === TransactionType.INCOME
  );
  const [incomeTitle, setIncomeTitle] = useState<string>('');
  const [incomeSource, setIncomeSource] = useState<string>('');
  const [incomeCategoryId, setIncomeCategoryId] = useState<string>(
    incomeCategories[0]?.id ?? ''
  );
  const [incomeAccountId, setIncomeAccountId] = useState<string>(
    bankAccounts[0]?.id ?? ''
  );

  const handleAmountChange = (val: string) => {
    const digits = val.replace(/[^\d]/g, '');
    if (!digits) {
      setAmountStr('');
      return;
    }
    const num = Number(digits);
    setAmountStr(num.toLocaleString('ko-KR'));
    setErrorMsg(null);
  };

  const addQuickAmount = (delta: number) => {
    const curr = Number(amountStr.replace(/,/g, '')) || 0;
    setAmountStr((curr + delta).toLocaleString('ko-KR'));
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(amountStr.replace(/,/g, '').trim());

    if (!cleanAmount || cleanAmount <= 0) {
      setErrorMsg('1원 이상의 올바른 금액을 입력해 주세요.');
      return;
    }

    if (activeType === TransactionType.EXPENSE) {
      if (!expenseTitle.trim()) {
        setErrorMsg('지출 내역명을 입력해 주세요 (예: 점심 식사, 마트 장보기).');
        return;
      }
      onAddTransaction({
        date,
        type: TransactionType.EXPENSE,
        categoryId: expenseCategoryId || expenseCategories[0]?.id || '',
        title: expenseTitle.trim(),
        amount: cleanAmount,
        accountId: expenseAccountId || bankAccounts[0]?.id || '',
        paymentMethod: expensePaymentMethod,
        isFixed,
        isOverspending,
        memo: memo.trim() || undefined,
      });

      // Reset
      setExpenseTitle('');
      setAmountStr('');
      setMemo('');
      setIsOverspending(false);
      setErrorMsg(null);
    } else {
      if (!incomeSource.trim() && !incomeTitle.trim()) {
        setErrorMsg('수익 출처 또는 수입 내역명을 입력해 주세요.');
        return;
      }
      const titleToUse =
        incomeTitle.trim() || `${incomeSource.trim()} 입금`;

      onAddTransaction({
        date,
        type: TransactionType.INCOME,
        categoryId: incomeCategoryId || incomeCategories[0]?.id || '',
        title: titleToUse,
        amount: cleanAmount,
        accountId: incomeAccountId || bankAccounts[0]?.id || '',
        paymentMethod: '계좌이체',
        incomeSource: incomeSource.trim() || undefined,
        memo: memo.trim() || undefined,
      });

      // Reset
      setIncomeTitle('');
      setIncomeSource('');
      setAmountStr('');
      setMemo('');
      setErrorMsg(null);
    }
  };

  return (
    <section
      aria-label="빠른 수입 및 지출 내역 입력창"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      {/* Type Toggle Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveType(TransactionType.EXPENSE);
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeType === TransactionType.EXPENSE
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-rose-600" />
            <span>지출 내역 입력</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveType(TransactionType.INCOME);
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
              activeType === TransactionType.INCOME
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
            <span>수입(입금) 내역 입력</span>
          </button>
        </div>

        <p className="text-xs text-slate-500">
          {activeType === TransactionType.EXPENSE
            ? '출금 통장과 과소비 여부를 체크하여 지출을 기록합니다'
            : '수익 출처와 입금된 통장을 선택하여 수입을 기록합니다'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        {/* Row 1: Amount & Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
          <div className="sm:col-span-7">
            <label
              htmlFor="quick-amount"
              className="block text-xs font-semibold text-slate-700"
            >
              {activeType === TransactionType.EXPENSE ? '지출 금액 (원)' : '입금 금액 (원)'}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                id="quick-amount"
                type="text"
                inputMode="numeric"
                placeholder="예: 45,000"
                value={amountStr}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm font-medium text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
              />
            </div>
            {/* Quick chips */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {[10000, 50000, 100000, 500000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => addQuickAmount(val)}
                  className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-600 hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
                >
                  +{val >= 10000 ? `${val / 10000}만` : `${val}원`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 hover:bg-slate-50 whitespace-nowrap"
              >
                초기화
              </button>
            </div>
          </div>

          <div className="sm:col-span-5">
            <label
              htmlFor="quick-date"
              className="block text-xs font-semibold text-slate-700"
            >
              거래 일자
            </label>
            <input
              id="quick-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        {/* Row 2: Type-specific Fields */}
        {activeType === TransactionType.EXPENSE ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-6">
                <label
                  htmlFor="quick-expense-title"
                  className="block text-xs font-semibold text-slate-700"
                >
                  지출 내역명
                </label>
                <input
                  id="quick-expense-title"
                  type="text"
                  placeholder="예: 마트 장보기, 성수 브런치, 주유비"
                  value={expenseTitle}
                  onChange={(e) => {
                    setExpenseTitle(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="quick-expense-category"
                  className="block text-xs font-semibold text-slate-700"
                >
                  카테고리
                </label>
                <select
                  id="quick-expense-category"
                  value={expenseCategoryId}
                  onChange={(e) => setExpenseCategoryId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="quick-expense-account"
                  className="block text-xs font-semibold text-slate-700"
                >
                  출금 통장 (계좌)
                </label>
                <select
                  id="quick-expense-account"
                  value={expenseAccountId}
                  onChange={(e) => setExpenseAccountId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} - {a.accountName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Overspending Toggle Button & Fixed Expense Checkbox */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsOverspending(!isOverspending)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                    isOverspending
                      ? 'border-rose-400 bg-rose-50 text-rose-800 shadow-xs ring-2 ring-rose-200'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                  aria-pressed={isOverspending}
                >
                  <Flame
                    className={`h-4 w-4 ${
                      isOverspending ? 'text-rose-600 fill-rose-600' : 'text-slate-400'
                    }`}
                  />
                  <span>
                    {isOverspending
                      ? '과소비 / 충동구매로 체크됨'
                      : '과소비로 체크 (충동구매/불필요)'}
                  </span>
                </button>

                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  {isOverspending
                    ? '한달 요약 리포트의 과소비 절약 분석에 포함됩니다.'
                    : '계획되지 않은 소비인 경우 눌러주세요.'}
                </span>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isFixed}
                  onChange={(e) => setIsFixed(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                />
                <span>매월 고정 지출</span>
              </label>
            </div>
          </div>
        ) : (
          /* Income Specific Fields */
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label
                  htmlFor="quick-income-source"
                  className="block text-xs font-semibold text-slate-700"
                >
                  수익 출처 (어디서 들어왔나요?)
                </label>
                <input
                  id="quick-income-source"
                  type="text"
                  placeholder="예: 주식회사 온결 급여, 네이버 애드포스트, 배당금"
                  value={incomeSource}
                  onChange={(e) => {
                    setIncomeSource(e.target.value);
                    if (!incomeTitle) setIncomeTitle(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
                {/* Preset Chips */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {['본업 급여', '외주/자문료', '주식 배당금', '용돈/환급'].map(
                    (chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setIncomeSource(chip);
                          if (!incomeTitle) setIncomeTitle(`${chip} 입금`);
                        }}
                        className="rounded border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-100"
                      >
                        {chip}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="quick-income-account"
                  className="block text-xs font-semibold text-slate-700"
                >
                  입금 통장 (어디 통장으로 들어왔나요?)
                </label>
                <select
                  id="quick-income-account"
                  value={incomeAccountId}
                  onChange={(e) => setIncomeAccountId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                >
                  {bankAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} - {a.accountName} (잔액: {a.balance.toLocaleString('ko-KR')}원)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  선택한 통장의 잔액이 자동으로 증가합니다.
                </p>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="quick-income-category"
                  className="block text-xs font-semibold text-slate-700"
                >
                  수입 카테고리
                </label>
                <select
                  id="quick-income-category"
                  value={incomeCategoryId}
                  onChange={(e) => setIncomeCategoryId(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                >
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="quick-income-memo"
                className="block text-xs font-semibold text-slate-700"
              >
                메모 / 비고 (선택)
              </label>
              <input
                id="quick-income-memo"
                type="text"
                placeholder="세부 내역이나 특이사항 메모"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
          <button
            type="submit"
            className={`inline-flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-xs font-bold text-white transition-all shadow-xs ${
              activeType === TransactionType.EXPENSE
                ? 'bg-slate-900 hover:bg-slate-800'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            <Check className="h-4 w-4" />
            <span>
              {activeType === TransactionType.EXPENSE
                ? '지출 내역 저장하기'
                : '수입 내역 저장하기'}
            </span>
          </button>
        </div>
      </form>
    </section>
  );
};
