import React, { useEffect, useState } from 'react';
import { Check, Flame, X } from 'lucide-react';
import { BankAccount, Category, Transaction, TransactionType } from '../types/ledger';

interface TransactionModalProps {
  isOpen: boolean;
  defaultDate: string;
  editingTransaction: Transaction | null;
  categories: Category[];
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id'>, existingId?: string) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  defaultDate,
  editingTransaction,
  categories,
  bankAccounts,
  onClose,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [date, setDate] = useState<string>(defaultDate);
  const [title, setTitle] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('신한카드');
  const [isOverspending, setIsOverspending] = useState<boolean>(false);
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const [incomeSource, setIncomeSource] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setTitle(editingTransaction.title);
      setAmountStr(editingTransaction.amount.toLocaleString('ko-KR'));
      setCategoryId(editingTransaction.categoryId);
      setAccountId(editingTransaction.accountId);
      setPaymentMethod(editingTransaction.paymentMethod);
      setIsOverspending(Boolean(editingTransaction.isOverspending));
      setIsFixed(Boolean(editingTransaction.isFixed));
      setIncomeSource(editingTransaction.incomeSource ?? '');
      setMemo(editingTransaction.memo ?? '');
    } else {
      setType(TransactionType.EXPENSE);
      setDate(defaultDate);
      setTitle('');
      setAmountStr('');
      setCategoryId(
        categories.find((c) => c.type === TransactionType.EXPENSE)?.id ?? ''
      );
      setAccountId(bankAccounts[0]?.id ?? '');
      setPaymentMethod('신한카드');
      setIsOverspending(false);
      setIsFixed(false);
      setIncomeSource('');
      setMemo('');
    }
    setErrorMsg(null);
  }, [isOpen, editingTransaction, defaultDate, categories, bankAccounts]);

  if (!isOpen) return null;

  const currentCategories = categories.filter((c) => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = Number(amountStr.replace(/,/g, ''));

    if (!cleanAmount || cleanAmount <= 0) {
      setErrorMsg('1원 이상의 올바른 금액을 입력해 주세요.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('내역명을 입력해 주세요.');
      return;
    }

    onSave(
      {
        date,
        type,
        categoryId: categoryId || currentCategories[0]?.id || '',
        title: title.trim(),
        amount: cleanAmount,
        accountId: accountId || bankAccounts[0]?.id || '',
        paymentMethod,
        isFixed,
        isOverspending: type === TransactionType.EXPENSE ? isOverspending : false,
        incomeSource: type === TransactionType.INCOME ? incomeSource.trim() || undefined : undefined,
        memo: memo.trim() || undefined,
      },
      editingTransaction?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-bold text-slate-900">
            {editingTransaction ? '거래 내역 수정' : '새 거래 내역 기록'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="창 닫기"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="tx-modal-form" onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              거래 유형
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setType(TransactionType.EXPENSE);
                  setCategoryId(
                    categories.find((c) => c.type === TransactionType.EXPENSE)?.id ?? ''
                  );
                }}
                className={`rounded py-2 text-xs font-semibold transition-all ${
                  type === TransactionType.EXPENSE
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                지출 내역
              </button>
              <button
                type="button"
                onClick={() => {
                  setType(TransactionType.INCOME);
                  setCategoryId(
                    categories.find((c) => c.type === TransactionType.INCOME)?.id ?? ''
                  );
                }}
                className={`rounded py-2 text-xs font-semibold transition-all ${
                  type === TransactionType.INCOME
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                수입 (입금) 내역
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                금액 (원)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="예: 48,000"
                value={amountStr}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^\d]/g, '');
                  setAmountStr(digits ? Number(digits).toLocaleString('ko-KR') : '');
                  setErrorMsg(null);
                }}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                거래 일자
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              내역명
            </label>
            <input
              type="text"
              placeholder="예: 주말 장보기, 10월 급여"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrorMsg(null);
              }}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
            />
          </div>

          {/* Income Source (Requirement 3) */}
          {type === TransactionType.INCOME && (
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                수익 출처 (어디서 들어왔나요?)
              </label>
              <input
                type="text"
                placeholder="예: 주식회사 온결 정기급여, 배당금 입금, 용돈"
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                카테고리
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                {currentCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                {type === TransactionType.INCOME ? '입금 통장' : '출금 통장'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
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

          {/* Overspending Toggle (Requirement 5) */}
          {type === TransactionType.EXPENSE && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsOverspending(!isOverspending)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                  isOverspending
                    ? 'border-rose-400 bg-rose-100 text-rose-800'
                    : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                <Flame className={`h-4 w-4 ${isOverspending ? 'text-rose-600 fill-rose-600' : 'text-slate-400'}`} />
                <span>{isOverspending ? '과소비로 체크됨' : '과소비 / 충동구매로 체크'}</span>
              </button>

              <label className="flex items-center gap-1.5 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={isFixed}
                  onChange={(e) => setIsFixed(e.target.checked)}
                  className="rounded text-teal-700"
                />
                <span>고정지출</span>
              </label>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              메모 (선택)
            </label>
            <input
              type="text"
              placeholder="비고나 영수증 메모"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs font-semibold text-rose-600">
              {errorMsg}
            </p>
          )}
        </form>

        {/* Sticky Action Footer with prominent "저장하기" Button */}
        <div className="shrink-0 flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            취소
          </button>
          <button
            form="tx-modal-form"
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
          >
            <Check className="h-4 w-4" />
            <span>{editingTransaction ? '수정 내용 저장하기' : '내역 저장하기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
