import { create } from 'zustand';
import { reportsApi } from '../api/modules/reports.api';

interface ReportsState {
  balanceSheet: any | null;
  incomeStatement: any | null;
  cashFlow: any | null;
  trialBalance: any | null;
  generalLedger: any | null;
  loading: boolean;
  error: string | null;

  fetchBalanceSheet: (params?: Record<string, any>) => Promise<any>;
  fetchIncomeStatement: (params?: Record<string, any>) => Promise<any>;
  fetchCashFlow: (params?: Record<string, any>) => Promise<any>;
  fetchTrialBalance: (params?: Record<string, any>) => Promise<any>;
  fetchGeneralLedger: (params?: Record<string, any>) => Promise<any>;
}

export const useReportsStore = create<ReportsState>((set) => ({
  balanceSheet: null,
  incomeStatement: null,
  cashFlow: null,
  trialBalance: null,
  generalLedger: null,
  loading: false,
  error: null,

  fetchBalanceSheet: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getBalanceSheet(params);
      set({ balanceSheet: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch Balance Sheet', loading: false });
      return null;
    }
  },

  fetchIncomeStatement: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getIncomeStatement(params);
      set({ incomeStatement: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch Income Statement', loading: false });
      return null;
    }
  },

  fetchCashFlow: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getCashFlow(params);
      set({ cashFlow: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch Cash Flow', loading: false });
      return null;
    }
  },

  fetchTrialBalance: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getTrialBalance(params);
      set({ trialBalance: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch Trial Balance', loading: false });
      return null;
    }
  },

  fetchGeneralLedger: async (params) => {
    set({ loading: true, error: null });
    try {
      const data = await reportsApi.getGeneralLedger(params);
      set({ generalLedger: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch General Ledger', loading: false });
      return null;
    }
  },
}));
