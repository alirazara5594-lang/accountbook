import { apiClient } from '../client';

export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  balance: number;
  connectionStatus: string;
  connectionType: 'Live Feed API' | 'Manual Import';
  accountType?: string;
  companyId?: string;
}

export interface CashAccount {
  id: string;
  name: string;
  currency: string;
  balance: number;
  custodian?: string;
  status: string;
  companyId?: string;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'Credit' | 'Debit';
  status: string;
  reconciled: boolean;
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

export const bankingApi = {
  getBankAccounts: async (companyId?: string): Promise<BankAccount[]> => {
    return apiClient<BankAccount[]>('/bankaccounts', { params: { companyId } });
  },

  createBankAccount: async (data: any): Promise<BankAccount> => {
    return apiClient<BankAccount>('/bankaccounts', { method: 'POST', body: data });
  },

  getCashAccounts: async (companyId?: string): Promise<CashAccount[]> => {
    return apiClient<CashAccount[]>('/cashaccounts', { params: { companyId } });
  },

  createCashAccount: async (data: any): Promise<CashAccount> => {
    return apiClient<CashAccount>('/cashaccounts', { method: 'POST', body: data });
  },

  getBankTransactions: async (bankAccountId?: string, companyId?: string): Promise<BankTransaction[]> => {
    return apiClient<BankTransaction[]>('/banktransactions', { params: { bankAccountId, companyId } });
  },

  getFundTransfers: async (companyId?: string): Promise<FundTransfer[]> => {
    return apiClient<FundTransfer[]>('/fundtransfers', { params: { companyId } });
  },

  createFundTransfer: async (data: any): Promise<FundTransfer> => {
    return apiClient<FundTransfer>('/fundtransfers', { method: 'POST', body: data });
  },

  getReconciliations: async (bankAccountId?: string): Promise<any[]> => {
    return apiClient<any[]>('/bankreconciliations', { params: { bankAccountId } });
  },
};
