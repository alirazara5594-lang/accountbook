import { apiClient } from '../client';

export const reportsApi = {
  getBalanceSheet: async (params?: Record<string, any>): Promise<any> => {
    return apiClient('/reports/balance-sheet', { params });
  },

  getIncomeStatement: async (params?: Record<string, any>): Promise<any> => {
    return apiClient('/reports/income-statement', { params });
  },

  getCashFlow: async (params?: Record<string, any>): Promise<any> => {
    return apiClient('/reports/cash-flow', { params });
  },

  getTrialBalance: async (params?: Record<string, any>): Promise<any> => {
    return apiClient('/reports/trial-balance', { params });
  },

  getGeneralLedger: async (params?: Record<string, any>): Promise<any> => {
    return apiClient('/reports/general-ledger', { params });
  },

  getArLedger: async (params?: Record<string, any>): Promise<any> => {
    return apiClient('/reports/ar-ledger', { params });
  },

  getApLedger: async (params?: Record<string, any>): Promise<any> => {
    return apiClient('/reports/ap-ledger', { params });
  },

  getPurchaseReports: async (params?: Record<string, any>): Promise<any> => {
    return apiClient('/reports/purchase-reports', { params });
  },
};
