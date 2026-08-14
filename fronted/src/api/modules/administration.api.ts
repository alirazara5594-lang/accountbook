import { apiClient } from '../client';

// ── Types ────────────────────────────────────────────────────────────────────
export type UserStatus = 'Active' | 'Inactive' | 'Locked';

export interface AdminUser {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  role: string;
  status: UserStatus;
  lastLogin?: string;
  companyId?: string;
  createdAt: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  companyId?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  active: boolean;
  companyId?: string;
  createdAt: string;
}

export interface ApprovalWorkflow {
  id: string;
  name: string;
  module: string;
  approverRole: string;
  steps: number;
  active: boolean;
  companyId?: string;
  createdAt: string;
}

export interface NumberSeries {
  id: string;
  name: string;
  prefix: string;
  nextNumber: number;
  format: string;
  active: boolean;
  companyId?: string;
  createdAt: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rate: number;
  base: boolean;
  active: boolean;
  companyId?: string;
  createdAt: string;
}

export interface AdministrationDashboard {
  users: number;
  activeUsers: number;
  lockedUsers: number;
  roles: number;
  permissions: number;
  branches: number;
  activeBranches: number;
  workflows: number;
  activeWorkflows: number;
  numberSeries: number;
  currencies: number;
  baseCurrency: string;
}

export const administrationApi = {
  getDashboard: async (): Promise<AdministrationDashboard> => {
    return apiClient<AdministrationDashboard>('/administration/dashboard');
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  getUsers: async (params?: { status?: UserStatus; role?: string; companyId?: string }): Promise<AdminUser[]> => {
    return apiClient<AdminUser[]>('/administration/users', { params });
  },
  createUser: async (data: any): Promise<AdminUser> => {
    return apiClient<AdminUser>('/administration/users', { method: 'POST', body: data });
  },
  updateUser: async (id: string, data: any): Promise<AdminUser> => {
    return apiClient<AdminUser>(`/administration/users/${id}`, { method: 'PUT', body: data });
  },
  setUserStatus: async (id: string, status: UserStatus): Promise<AdminUser> => {
    return apiClient<AdminUser>(`/administration/users/${id}/status`, { method: 'POST', body: { status } });
  },
  deleteUser: async (id: string): Promise<void> => {
    return apiClient<void>(`/administration/users/${id}`, { method: 'DELETE' });
  },

  // ── Roles ──────────────────────────────────────────────────────────────────
  getRoles: async (params?: { companyId?: string }): Promise<UserRole[]> => {
    return apiClient<UserRole[]>('/administration/roles', { params });
  },
  createRole: async (data: any): Promise<UserRole> => {
    return apiClient<UserRole>('/administration/roles', { method: 'POST', body: data });
  },
  updateRole: async (id: string, data: any): Promise<UserRole> => {
    return apiClient<UserRole>(`/administration/roles/${id}`, { method: 'PUT', body: data });
  },
  deleteRole: async (id: string): Promise<void> => {
    return apiClient<void>(`/administration/roles/${id}`, { method: 'DELETE' });
  },

  // ── Branches ───────────────────────────────────────────────────────────────
  getBranches: async (params?: { active?: boolean; companyId?: string }): Promise<Branch[]> => {
    return apiClient<Branch[]>('/administration/branches', { params });
  },
  createBranch: async (data: any): Promise<Branch> => {
    return apiClient<Branch>('/administration/branches', { method: 'POST', body: data });
  },
  setBranchStatus: async (id: string, active: boolean): Promise<Branch> => {
    return apiClient<Branch>(`/administration/branches/${id}/status`, { method: 'POST', body: { status: String(active) } });
  },
  deleteBranch: async (id: string): Promise<void> => {
    return apiClient<void>(`/administration/branches/${id}`, { method: 'DELETE' });
  },

  // ── Approval Workflows ─────────────────────────────────────────────────────
  getWorkflows: async (params?: { active?: boolean; companyId?: string }): Promise<ApprovalWorkflow[]> => {
    return apiClient<ApprovalWorkflow[]>('/administration/workflows', { params });
  },
  createWorkflow: async (data: any): Promise<ApprovalWorkflow> => {
    return apiClient<ApprovalWorkflow>('/administration/workflows', { method: 'POST', body: data });
  },
  setWorkflowStatus: async (id: string, active: boolean): Promise<ApprovalWorkflow> => {
    return apiClient<ApprovalWorkflow>(`/administration/workflows/${id}/status`, { method: 'POST', body: { status: String(active) } });
  },
  deleteWorkflow: async (id: string): Promise<void> => {
    return apiClient<void>(`/administration/workflows/${id}`, { method: 'DELETE' });
  },

  // ── Number Series ──────────────────────────────────────────────────────────
  getNumberSeries: async (params?: { active?: boolean; companyId?: string }): Promise<NumberSeries[]> => {
    return apiClient<NumberSeries[]>('/administration/number-series', { params });
  },
  createNumberSeries: async (data: any): Promise<NumberSeries> => {
    return apiClient<NumberSeries>('/administration/number-series', { method: 'POST', body: data });
  },
  setNumberSeriesStatus: async (id: string, active: boolean): Promise<NumberSeries> => {
    return apiClient<NumberSeries>(`/administration/number-series/${id}/status`, { method: 'POST', body: { status: String(active) } });
  },
  deleteNumberSeries: async (id: string): Promise<void> => {
    return apiClient<void>(`/administration/number-series/${id}`, { method: 'DELETE' });
  },

  // ── Currencies ─────────────────────────────────────────────────────────────
  getCurrencies: async (params?: { active?: boolean; companyId?: string }): Promise<Currency[]> => {
    return apiClient<Currency[]>('/administration/currencies', { params });
  },
  createCurrency: async (data: any): Promise<Currency> => {
    return apiClient<Currency>('/administration/currencies', { method: 'POST', body: data });
  },
  setCurrencyStatus: async (id: string, active: boolean): Promise<Currency> => {
    return apiClient<Currency>(`/administration/currencies/${id}/status`, { method: 'POST', body: { status: String(active) } });
  },
  deleteCurrency: async (id: string): Promise<void> => {
    return apiClient<void>(`/administration/currencies/${id}`, { method: 'DELETE' });
  },
};