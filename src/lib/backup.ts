import type { BankAccount, Category, CategoryBudgetMap, InvestmentAsset, Transaction } from '../types/ledger';

export interface BackupData {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  categories: Category[];
  investments: InvestmentAsset[];
  budgets: CategoryBudgetMap;
}

export interface BudgetFlowBackup {
  format: 'budgetflow-offline-backup';
  version: 1;
  exportedAt: string;
  data: BackupData;
}

export function createBackup(data: BackupData): BudgetFlowBackup {
  return {
    format: 'budgetflow-offline-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: JSON.parse(JSON.stringify(data)) as BackupData,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseBackup(raw: string): BudgetFlowBackup {
  let json: unknown;
  try { json = JSON.parse(raw); } catch { throw new Error('JSON 형식이 아닙니다.'); }
  if (!isRecord(json) || json.format !== 'budgetflow-offline-backup' || json.version !== 1) {
    throw new Error('지원하는 BudgetFlow 백업 파일이 아닙니다.');
  }
  if (!isRecord(json.data) || typeof json.exportedAt !== 'string' || !Number.isFinite(Date.parse(json.exportedAt))) {
    throw new Error('백업 파일의 날짜 또는 데이터 형식이 올바르지 않습니다.');
  }
  const data = json.data;
  for (const key of ['transactions', 'bankAccounts', 'categories', 'investments']) {
    if (!Array.isArray(data[key])) throw new Error(`${key} 목록이 없습니다.`);
  }
  if (!isRecord(data.budgets)) throw new Error('예산 정보가 올바르지 않습니다.');
  const validItems = (key: string, fields: string[]) => (data[key] as unknown[]).every((item) =>
    isRecord(item) && fields.every((field) => typeof item[field] === 'string'));
  if (!validItems('transactions', ['id','date','type','categoryId','title','accountId']) ||
      !validItems('bankAccounts', ['id','bankName','accountName']) ||
      !validItems('categories', ['id','label','type']) ||
      !validItems('investments', ['id','name','type'])) {
    throw new Error('목록에 필요한 필드가 누락되었습니다.');
  }
  const numbers = (key: string, fields: string[]) => (data[key] as Record<string, unknown>[]).every((item) =>
    fields.every((field) => typeof item[field] === 'number' && Number.isFinite(item[field])));
  if (!numbers('transactions', ['amount']) || !numbers('bankAccounts', ['balance']) ||
      !numbers('investments', ['investedAmount','currentValuation'])) {
    throw new Error('금액 필드가 올바르지 않습니다.');
  }
  return json as unknown as BudgetFlowBackup;
}
