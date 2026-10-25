import React, { useRef, useState } from 'react';
import {
  Building2,
  Check,
  CreditCard,
  Download,
  Upload,
  ShieldCheck,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { BankAccount, Category, TransactionType } from '../types/ledger';
import { BackupData, createBackup, parseBackup } from '../lib/backup';
import { formatKRW } from '../utils/ledgerMath';

interface SettingsViewProps {
  bankAccounts: BankAccount[];
  categories: Category[];
  backupData: BackupData;
  onRestoreData: (data: BackupData) => void;
  onAddAccount: (acc: Omit<BankAccount, 'id'>) => void;
  onEditAccount: (acc: BankAccount) => void;
  onDeleteAccount: (id: string) => void;
  onAddCategory: (cat: Omit<Category, 'id'>) => void;
  onEditCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const PRESET_COLORS = [
  '#345793', // teal
  '#6d98cf', // sky
  '#5a78c8', // blue
  '#8b7cc8', // indigo
  '#a78bd0', // violet
  '#d9a92a', // amber
  '#c44830', // rose
  '#5e924d', // emerald
  '#575680', // slate
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  bankAccounts,
  categories,
  backupData,
  onRestoreData,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState('');

  const handleBackup = async () => {
    try {
      const backup = createBackup(backupData);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const filename = `BudgetFlow-backup-${new Date().toLocaleDateString('sv-SE')}.json`;
      const file = new File([blob], filename, { type: 'application/json' });
      // iPhone 홈 화면 웹앱에서는 공유 시트의 '파일에 저장'이 가장 안정적입니다.
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: 'BudgetFlow 가계부 백업' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
      setBackupStatus('백업 파일을 저장했는지 확인해 주세요.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setBackupStatus('백업에 실패했습니다. Safari에서 열어 다시 시도해 주세요.');
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('파일이 너무 큽니다.');
      const backup = parseBackup(await file.text());
      if (!window.confirm(`이 기기에 저장된 데이터를 선택한 백업으로 교체할까요?\n\n백업 날짜: ${new Date(backup.exportedAt).toLocaleString('ko-KR')}\n거래 ${backup.data.transactions.length}건, 통장 ${backup.data.bankAccounts.length}개, 투자 ${backup.data.investments.length}개\n\n현재 데이터가 덮어쓰여집니다. 먼저 현재 데이터도 백업하는 것을 권장합니다.`)) return;
      // 저장소 갱신 완료 후 React 상태 반영; 앱 새로고침도 이전 데이터를 복원할 수 있습니다.
      onRestoreData(backup.data);
      setBackupStatus('복원 완료. 화면의 데이터가 바뀌었는지 확인해 주세요.');
    } catch (error) {
      setBackupStatus(error instanceof Error ? `복원 실패: ${error.message}` : '복원 실패: 파일을 확인해 주세요.');
    } finally {
      e.target.value = '';
    }
  };

  // Account modal states
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [balanceStr, setBalanceStr] = useState('');
  const [accountColor, setAccountColor] = useState('#345793');
  const [accountError, setAccountError] = useState<string | null>(null);

  // Category modal states
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catLabel, setCatLabel] = useState('');
  const [catType, setCatType] = useState<TransactionType>(
    TransactionType.EXPENSE
  );
  const [catColor, setCatColor] = useState('#345793');
  const [isFixedDefault, setIsFixedDefault] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  // Open Account Modal
  const openNewAccountModal = () => {
    setEditingAccount(null);
    setBankName('신한은행');
    setAccountName('');
    setAccountNumber('');
    setBalanceStr('');
    setAccountColor('#6d98cf');
    setAccountError(null);
    setAccountModalOpen(true);
  };

  const openEditAccountModal = (acc: BankAccount) => {
    setEditingAccount(acc);
    setBankName(acc.bankName);
    setAccountName(acc.accountName);
    setAccountNumber(acc.accountNumber);
    setBalanceStr(acc.balance.toLocaleString('ko-KR'));
    setAccountColor(acc.color);
    setAccountError(null);
    setAccountModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) {
      setAccountError('통장(계좌) 이름을 입력해 주세요.');
      return;
    }
    const cleanBal = Number(balanceStr.replace(/,/g, '')) || 0;

    if (editingAccount) {
      onEditAccount({
        ...editingAccount,
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim() || '—',
        balance: cleanBal,
        color: accountColor,
      });
    } else {
      onAddAccount({
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim() || '—',
        balance: cleanBal,
        color: accountColor,
      });
    }
    setAccountModalOpen(false);
  };

  // Open Category Modal
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatLabel('');
    setCatType(TransactionType.EXPENSE);
    setCatColor('#345793');
    setIsFixedDefault(false);
    setCatError(null);
    setCatModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatLabel(cat.label);
    setCatType(cat.type);
    setCatColor(cat.color);
    setIsFixedDefault(Boolean(cat.isFixedDefault));
    setCatError(null);
    setCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catLabel.trim()) {
      setCatError('카테고리 이름을 입력해 주세요.');
      return;
    }

    if (editingCategory) {
      onEditCategory({
        ...editingCategory,
        label: catLabel.trim(),
        type: catType,
        color: catColor,
        isFixedDefault,
      });
    } else {
      onAddCategory({
        label: catLabel.trim(),
        type: catType,
        color: catColor,
        isFixedDefault,
        isCustom: true,
      });
    }
    setCatModalOpen(false);
  };

  const expenseCategories = categories.filter(
    (c) => c.type === TransactionType.EXPENSE
  );
  const incomeCategories = categories.filter(
    (c) => c.type === TransactionType.INCOME
  );

  const totalBankBalance = bankAccounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-8">
      {/* 개인 가계부 데이터 백업 / 복원 */}
      <section className="rounded-xl border border-teal-200 bg-white p-5 sm:p-6" aria-label="가계부 백업 및 복원">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal-700" />
          <h2 className="text-base font-bold text-slate-900">내 가계부 백업 · 복원</h2>
        </div>
        <p className="mt-2 text-xs leading-6 text-slate-700">
          로그인이나 서버 없이 이 아이폰에만 저장됩니다. 기기 변경·앱 삭제·저장공간 정리에 대비해
          주기적으로 JSON 파일을 iCloud Drive 또는 파일 앱에 저장하세요.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" onClick={handleBackup}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
            <Download className="h-4 w-4" /> 백업 파일 저장
          </button>
          <button type="button" onClick={() => backupInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-50">
            <Upload className="h-4 w-4" /> 백업 파일 복원
          </button>
        </div>
        <input ref={backupInputRef} type="file" accept=".json,application/json"
          onChange={handleRestore} className="hidden" aria-label="가계부 JSON 백업 파일 선택" />
        {backupStatus && <p role="status" className="mt-3 text-xs font-semibold text-teal-800">{backupStatus}</p>}
        <p className="mt-3 text-[11px] leading-5 text-slate-600">
          백업에는 거래·통장·카테고리·투자·예산 정보가 모두 포함됩니다. 파일은 암호화되어 있지 않으므로 타인에게 공유하지 마세요.
          자동 기기간 동기화는 제공되지 않습니다.
        </p>
      </section>
      {/* 1. Bank Accounts Section (Requirement 2: 무슨 통장을 사용하고 있는지) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-700" />
              <h2 className="text-base font-semibold text-slate-900">
                사용 중인 통장 (계좌) 관리
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              현재 등록된 통장 목록과 잔액을 관리하며, 수입/지출 시 출금·입금 통장으로 자동 연동됩니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-600 tabular-nums">
              총 잔액: <strong className="text-slate-900">{formatKRW(totalBankBalance)}</strong>
            </span>
            <button
              type="button"
              onClick={openNewAccountModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>모달로 새 통장 추가</span>
            </button>
          </div>
        </div>

        {/* Inline Quick Add Bank Account Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const bName = (form.elements.namedItem('inlineBankName') as HTMLInputElement)?.value.trim() || '신한은행';
            const aName = (form.elements.namedItem('inlineAccountName') as HTMLInputElement)?.value.trim();
            const aNum = (form.elements.namedItem('inlineAccountNumber') as HTMLInputElement)?.value.trim() || '—';
            const bRaw = (form.elements.namedItem('inlineBalance') as HTMLInputElement)?.value.replace(/,/g, '');
            const bBal = Number(bRaw) || 0;

            if (!aName) {
              alert('통장(계좌) 별칭을 입력해 주세요.');
              return;
            }

            onAddAccount({
              bankName: bName,
              accountName: aName,
              accountNumber: aNum,
              balance: bBal,
              color: PRESET_COLORS[bankAccounts.length % PRESET_COLORS.length],
            });

            form.reset();
          }}
          className="mt-4 rounded-lg border border-teal-200 bg-teal-50/50 p-3.5"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900">
              ⚡ 새 통장 즉시 작성 및 저장
            </span>
            <span className="text-[11px] text-teal-700">
              입력 후 '통장 저장하기' 버튼을 누르면 즉시 목록에 반영됩니다
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <input
                name="inlineBankName"
                type="text"
                defaultValue="신한은행"
                placeholder="금융기관 (예: KB국민은행)"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                name="inlineAccountName"
                type="text"
                placeholder="통장 별칭 (예: 주거래 생활비통장)"
                required
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                name="inlineAccountNumber"
                type="text"
                placeholder="계좌번호 (선택)"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <input
                name="inlineBalance"
                type="number"
                placeholder="현재 잔액(원)"
                defaultValue="0"
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-teal-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-900 whitespace-nowrap shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>통장 저장하기</span>
              </button>
            </div>
          </div>
        </form>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {bankAccounts.map((account) => (
            <div
              key={account.id}
              className="relative flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300 hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className="h-2.5 w-2.5 rounded-[2px]"
                    style={{ backgroundColor: account.color }}
                  />
                  <span className="text-[11px] font-semibold text-slate-500">
                    {account.bankName}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-slate-900">
                  {account.accountName}
                </h3>
                <p className="mt-0.5 font-mono text-[11px] text-slate-400 tabular-nums">
                  {account.accountNumber}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">현재 잔액</span>
                <p className="font-mono text-lg font-bold text-slate-900 tabular-nums">
                  {formatKRW(account.balance)}
                </p>

                <div className="mt-2 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditAccountModal(account)}
                    aria-label={`${account.accountName} 수정`}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {bankAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteAccount(account.id)}
                      aria-label={`${account.accountName} 삭제`}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Categories Customization (Requirement 2: 카테고리 수정 칸) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-teal-700" />
              <h2 className="text-base font-semibold text-slate-900">
                카테고리 수정 및 추가
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              지출 및 수입 분류 체계를 사용자 소비 습관에 맞춰 자유롭게 수정하고 추가합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={openNewCategoryModal}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>모달로 추가</span>
          </button>
        </div>

        {/* Inline Quick Add Category Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const cType = (form.elements.namedItem('inlineCatType') as HTMLSelectElement)?.value as TransactionType;
            const cLabel = (form.elements.namedItem('inlineCatLabel') as HTMLInputElement)?.value.trim();

            if (!cLabel) {
              alert('카테고리 이름을 입력해 주세요.');
              return;
            }

            onAddCategory({
              label: cLabel,
              type: cType || TransactionType.EXPENSE,
              color: PRESET_COLORS[categories.length % PRESET_COLORS.length],
              isFixedDefault: false,
              isCustom: true,
            });

            form.reset();
          }}
          className="mt-4 rounded-lg border border-teal-200 bg-teal-50/50 p-3.5"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900">
              ⚡ 새 카테고리 즉시 작성 및 저장
            </span>
            <span className="text-[11px] text-teal-700">
              입력 후 '카테고리 저장하기' 버튼을 누르면 즉시 목록에 추가됩니다
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
            <div className="sm:col-span-3">
              <select
                name="inlineCatType"
                defaultValue={TransactionType.EXPENSE}
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              >
                <option value={TransactionType.EXPENSE}>지출 카테고리</option>
                <option value={TransactionType.INCOME}>수입 카테고리</option>
              </select>
            </div>
            <div className="sm:col-span-6">
              <input
                name="inlineCatLabel"
                type="text"
                placeholder="카테고리 이름 (예: 커피/음료, OTT 구독, 부수입, 배달음식)"
                required
                className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1 rounded-md bg-teal-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-900 whitespace-nowrap shadow-xs"
              >
                <Check className="h-3.5 w-3.5" />
                <span>카테고리 저장하기</span>
              </button>
            </div>
          </div>
        </form>

        {/* Expense Categories */}
        <div className="mt-5">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            지출 카테고리 ({expenseCategories.length}개)
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {expenseCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-semibold text-slate-900">
                    {cat.label}
                  </span>
                  {cat.isFixedDefault && (
                    <span className="text-[10px] text-slate-400">· 고정</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditCategoryModal(cat)}
                    aria-label={`${cat.label} 카테고리 수정`}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {expenseCategories.length > 2 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(cat.id)}
                      aria-label={`${cat.label} 카테고리 삭제`}
                      className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Income Categories */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            수입 카테고리 ({incomeCategories.length}개)
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {incomeCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-semibold text-slate-900">
                    {cat.label}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditCategoryModal(cat)}
                    aria-label={`${cat.label} 수정`}
                    className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {incomeCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(cat.id)}
                      aria-label={`${cat.label} 삭제`}
                      className="rounded p-1 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account Modal */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {editingAccount ? '통장(계좌) 정보 수정' : '새 통장 등록'}
              </h3>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  금융기관 (은행/증권사)
                </label>
                <input
                  type="text"
                  placeholder="예: 신한은행, 토스뱅크, 미래에셋증권"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  통장 별칭 / 사용 목적
                </label>
                <input
                  type="text"
                  placeholder="예: 주거래 급여통장, 비상금 파킹통장"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  계좌번호 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 110-***-123456"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  현재 잔액 (원)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="예: 3,500,000"
                  value={balanceStr}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d]/g, '');
                    setBalanceStr(digits ? Number(digits).toLocaleString('ko-KR') : '');
                  }}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-teal-700 focus:outline-none"
                />
              </div>

              {accountError && (
                <p role="alert" className="text-xs font-medium text-rose-600">
                  {accountError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-900"
                >
                  <Check className="h-4 w-4" />
                  <span>통장 저장하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-semibold text-slate-900">
                {editingCategory ? '카테고리 정보 수정' : '새 카테고리 추가'}
              </h3>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  카테고리 구분
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setCatType(TransactionType.EXPENSE)}
                    className={`rounded py-1.5 text-xs font-semibold ${
                      catType === TransactionType.EXPENSE
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    지출 카테고리
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatType(TransactionType.INCOME)}
                    className={`rounded py-1.5 text-xs font-semibold ${
                      catType === TransactionType.INCOME
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    수입 카테고리
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  카테고리 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 배달음식, 반려동물, 부수입"
                  value={catLabel}
                  onChange={(e) => setCatLabel(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  대표 색상 선택
                </label>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCatColor(col)}
                      className={`h-7 w-7 rounded-md transition-all ${
                        catColor === col
                          ? 'ring-2 ring-slate-900 ring-offset-2'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              {catType === TransactionType.EXPENSE && (
                <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isFixedDefault}
                    onChange={(e) => setIsFixedDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700"
                  />
                  <span>기본적으로 고정비 성격의 지출입니다</span>
                </label>
              )}

              {catError && (
                <p role="alert" className="text-xs font-medium text-rose-600">
                  {catError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-800 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-teal-900"
                >
                  <Check className="h-4 w-4" />
                  <span>카테고리 저장하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
