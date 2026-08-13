import { apiClient } from '../client';

export interface BankAccount {
  id: string;
  code: string;
  name: string;
  currency: string;
  status: string;
  openingBalance: number;
  balance: number;
  reconciliationEnabled: boolean;
  bankName?: string;
  updatedAt?: string;
  companyId?: string;
}

export interface CashAccount {
  id: string;
  code: string;
  name: string;
  currency: string;
  status: string;
  openingBalance: number;
  balance: number;
  reconciliationEnabled: boolean;
  custodian?: string;
  companyId?: string;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  bank: string;
  date: string;
  ref: string;
  description: string;
  payee: string;
  mode: string;
  type: string;
  amount: number;
  curr: string;
  status: string;
  reconciled: boolean;
  journalEntryId: string;
}

export interface FundTransfer {
  id: string;
  transferNumber: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  reference: string;
  status: string;
}

export interface BankConnection {
  id: string;
  code: string;
  name: string;
  provider: string;
  accountNumber: string;
  status: string;
  feedType: string;
  currency: string;
  updatedAt: string;
}

export interface BankImport {
  id: string;
  bankAccountId?: string;
  bankAccountName?: string;
  fileName: string;
  format: string;
  transactionCount: number;
  totalAmount: number;
  status: string;
  importedAt: string;
}

export const bankingApi = {
  getBankAccounts: async (companyId?: string): Promise<BankAccount[]> => {
    return apiClient<BankAccount[]>('/bank-accounts', { params: { companyId } });
  },

  createBankAccount: async (data: any): Promise<BankAccount> => {
    return apiClient<BankAccount>('/bank-accounts', { method: 'POST', body: data });
  },

  getCashAccounts: async (companyId?: string): Promise<CashAccount[]> => {
    return apiClient<CashAccount[]>('/cash-accounts', { params: { companyId } });
  },

  createCashAccount: async (data: any): Promise<CashAccount> => {
    return apiClient<CashAccount>('/cash-accounts', { method: 'POST', body: data });
  },

  getBankTransactions: async (bankAccountId?: string, companyId?: string): Promise<BankTransaction[]> => {
    return apiClient<BankTransaction[]>('/bank-transactions', { params: { bankAccountId, companyId } });
  },

  getFundTransfers: async (companyId?: string): Promise<FundTransfer[]> => {
    return apiClient<FundTransfer[]>('/fund-transfers', { params: { companyId } });
  },

  createFundTransfer: async (data: any): Promise<FundTransfer> => {
    return apiClient<FundTransfer>('/fund-transfers', { method: 'POST', body: data });
  },

  getBankConnections: async (companyId?: string): Promise<BankConnection[]> => {
    return apiClient<BankConnection[]>('/bank-connections', { params: { companyId } });
  },

  syncBankConnection: async (accountId: string): Promise<any> => {
    return apiClient(`/bank-connections/${accountId}/sync`, { method: 'POST' });
  },

  getBankImports: async (companyId?: string): Promise<BankImport[]> => {
    return apiClient<BankImport[]>('/bank-imports', { params: { companyId } });
  },

  createBankImport: async (data: any): Promise<BankImport> => {
    return apiClient<BankImport>('/bank-imports', { method: 'POST', body: data });
  },

  getReconciliations: async (bankAccountId?: string): Promise<any[]> => {
    return apiClient<any[]>('/bank-reconciliations', { params: { bankAccountId } });
  },
};
