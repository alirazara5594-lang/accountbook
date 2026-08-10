import { create } from 'zustand';
import {
  bankingApi,
  type BankAccount,
  type CashAccount,
  type BankTransaction,
  type FundTransfer,
} from '../api/modules/banking.api';

interface BankingState {
  bankAccounts: BankAccount[];
  cashAccounts: CashAccount[];
  transactions: BankTransaction[];
  transfers: FundTransfer[];
  reconciliations: any[];
  loading: boolean;
  error: string | null;

  fetchBankAccounts: (companyId?: string) => Promise<BankAccount[]>;
  fetchCashAccounts: (companyId?: string) => Promise<CashAccount[]>;
  fetchTransactions: (bankAccountId?: string, companyId?: string) => Promise<BankTransaction[]>;
  fetchTransfers: (companyId?: string) => Promise<FundTransfer[]>;
  fetchReconciliations: (bankAccountId?: string) => Promise<any[]>;
  fetchAllBanking: (companyId?: string) => Promise<void>;

  createBankAccount: (data: any) => Promise<BankAccount>;
  createCashAccount: (data: any) => Promise<CashAccount>;
  createFundTransfer: (data: any) => Promise<FundTransfer>;
}

export const useBankingStore = create<BankingState>((set, get) => ({
  bankAccounts: [],
  cashAccounts: [],
  transactions: [],
  transfers: [],
  reconciliations: [],
  loading: false,
  error: null,

  fetchBankAccounts: async (companyId?: string) => {
    try {
      const bankAccounts = await bankingApi.getBankAccounts(companyId);
      set({ bankAccounts });
      return bankAccounts;
    } catch {
      return [];
    }
  },

  fetchCashAccounts: async (companyId?: string) => {
    try {
      const cashAccounts = await bankingApi.getCashAccounts(companyId);
      set({ cashAccounts });
      return cashAccounts;
    } catch {
      return [];
    }
  },

  fetchTransactions: async (bankAccountId?: string, companyId?: string) => {
    try {
      const transactions = await bankingApi.getBankTransactions(bankAccountId, companyId);
      set({ transactions });
      return transactions;
    } catch {
      return [];
    }
  },

  fetchTransfers: async (companyId?: string) => {
    try {
      const transfers = await bankingApi.getFundTransfers(companyId);
      set({ transfers });
      return transfers;
    } catch {
      return [];
    }
  },

  fetchReconciliations: async (bankAccountId?: string) => {
    try {
      const reconciliations = await bankingApi.getReconciliations(bankAccountId);
      set({ reconciliations });
      return reconciliations;
    } catch {
      return [];
    }
  },

  fetchAllBanking: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const [bankAccounts, cashAccounts, transactions, transfers] = await Promise.all([
        bankingApi.getBankAccounts(companyId).catch(() => []),
        bankingApi.getCashAccounts(companyId).catch(() => []),
        bankingApi.getBankTransactions(undefined, companyId).catch(() => []),
        bankingApi.getFundTransfers(companyId).catch(() => []),
      ]);
      set({ bankAccounts, cashAccounts, transactions, transfers, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load banking data', loading: false });
    }
  },

  createBankAccount: async (data: any) => {
    const res = await bankingApi.createBankAccount(data);
    await get().fetchBankAccounts();
    return res;
  },

  createCashAccount: async (data: any) => {
    const res = await bankingApi.createCashAccount(data);
    await get().fetchCashAccounts();
    return res;
  },

  createFundTransfer: async (data: any) => {
    const res = await bankingApi.createFundTransfer(data);
    await Promise.all([get().fetchTransfers(), get().fetchBankAccounts(), get().fetchCashAccounts()]);
    return res;
  },
}));
