import { apiClient } from '../client';

export interface BudgetRecord {
  id: string;
  budgetName: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  amount: number;
  fiscalYear: number;
  periodType: string;
  status: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetInput {
  budgetName: string;
  accountId: string;
  amount: number;
  fiscalYear: number;
  periodType: 'Monthly' | 'Quarterly' | 'Yearly';
  status: 'Draft' | 'Active' | 'Locked';
  companyId?: string;
}

export interface PeriodCloseRecord {
  id: string;
  periodName: string;
  periodEndDate?: string;
  status: 'Open' | 'Closed' | 'Reopened';
  note?: string;
  companyId?: string;
  createdAt: string;
  closedAt?: string;
  closedBy?: string;
}

export interface AuditTrailItem {
  at: string;
  action: string;
  detail: string;
  entity: string;
  entityName: string;
  entityId?: string;
  companyId?: string;
}

export const accountingApi = {
  getBudgets: async (params?: Record<string, any>): Promise<BudgetRecord[]> =>
    apiClient('/budgets', { params }),

  createBudget: async (body: BudgetInput): Promise<BudgetRecord> =>
    apiClient('/budgets', { method: 'POST', body }),

  updateBudget: async (id: string, body: BudgetInput): Promise<any> =>
    apiClient(`/budgets/${id}`, { method: 'PUT', body }),

  deleteBudget: async (id: string): Promise<any> =>
    apiClient(`/budgets/${id}`, { method: 'DELETE' }),

  getPeriodCloses: async (params?: Record<string, any>): Promise<PeriodCloseRecord[]> =>
    apiClient('/period-closing', { params }),

  createPeriodClose: async (body: {
    periodName: string;
    periodEndDate?: string;
    note?: string;
    companyId?: string;
  }): Promise<PeriodCloseRecord> =>
    apiClient('/period-closing', { method: 'POST', body }),

  closePeriod: async (id: string, closedBy?: string, note?: string): Promise<any> =>
    apiClient(`/period-closing/${id}/close`, { method: 'POST', body: { closedBy, note } }),

  reopenPeriod: async (id: string): Promise<any> =>
    apiClient(`/period-closing/${id}/reopen`, { method: 'POST' }),

  getAuditTrail: async (params?: Record<string, any>): Promise<AuditTrailItem[]> =>
    apiClient('/audit-trail', { params }),
};