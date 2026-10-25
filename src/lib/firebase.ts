import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
export { firebaseConfig };
import {
  BankAccount,
  Category,
  CategoryBudgetMap,
  InvestmentAsset,
  Transaction,
} from '../types/ledger';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline. Local data persistence will remain active.');
    }
  }
}

// Fire and forget connection test
testConnection();

export interface AuthDomainErrorInfo {
  code: string;
  domain: string;
  message: string;
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      const domainError = new Error(
        `Firebase 인증 도메인('${currentHost}')이 승인되지 않았습니다.`
      );
      (domainError as any).code = 'auth/unauthorized-domain';
      (domainError as any).domain = currentHost;
      throw domainError;
    }
    throw error;
  }
}

export async function signInAsGuest() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    throw error;
  }
}

export async function logOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

/**
 * Saves or updates a transaction in Firestore for the active user
 */
export async function syncTransactionToFirestore(userId: string, tx: Transaction) {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    await setDoc(doc(db, 'users', userId, 'transactions', tx.id), {
      ...tx,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a transaction in Firestore
 */
export async function deleteTransactionFromFirestore(userId: string, txId: string) {
  const path = `users/${userId}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'transactions', txId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Syncs bank accounts array to Firestore
 */
export async function syncBankAccountsToFirestore(userId: string, accounts: BankAccount[]) {
  const path = `users/${userId}/bankAccounts`;
  try {
    const batch = writeBatch(db);
    accounts.forEach((acc) => {
      const ref = doc(db, 'users', userId, 'bankAccounts', acc.id);
      batch.set(ref, { ...acc, userId, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Syncs categories array to Firestore
 */
export async function syncCategoriesToFirestore(userId: string, categories: Category[]) {
  const path = `users/${userId}/categories`;
  try {
    const batch = writeBatch(db);
    categories.forEach((cat) => {
      const ref = doc(db, 'users', userId, 'categories', cat.id);
      batch.set(ref, { ...cat, userId, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Syncs investments array to Firestore
 */
export async function syncInvestmentsToFirestore(userId: string, investments: InvestmentAsset[]) {
  const path = `users/${userId}/investments`;
  try {
    const batch = writeBatch(db);
    investments.forEach((asset) => {
      const ref = doc(db, 'users', userId, 'investments', asset.id);
      batch.set(ref, { ...asset, userId, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes an investment from Firestore
 */
export async function deleteInvestmentFromFirestore(userId: string, assetId: string) {
  const path = `users/${userId}/investments/${assetId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'investments', assetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Syncs budget settings to Firestore
 */
export async function syncBudgetsToFirestore(userId: string, budgets: CategoryBudgetMap) {
  const path = `users/${userId}/settings/budgets`;
  try {
    await setDoc(doc(db, 'users', userId, 'settings', 'budgets'), {
      userId,
      budgets,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
