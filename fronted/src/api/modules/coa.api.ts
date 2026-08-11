import { apiClient } from '../client';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId?: string;
  status: 'Active' | 'Inactive';
  openingBalance: number;
  reconciliationEnabled: boolean;
  ifrsTag?: string;
  gaapTag?: string;
  isSystem: boolean;
  updatedAt?: string;
}

export const coaApi = {
  getAccounts: async (): Promise<Account[]> => {
    return apiClient<Account[]>('/chart-of-accounts');
  },

  saveAccount: async (accountData: any, id?: string): Promise<Account> => {
    const endpoint = id ? `/chart-of-accounts/${id}` : '/chart-of-accounts';
    const method = id ? 'PUT' : 'POST';
    return apiClient<Account>(endpoint, {
      method,
      body: accountData,
    });
  },

  toggleAccountStatus: async (id: string, status: 'Active' | 'Inactive', reason = 'Updated from workspace'): Promise<void> => {
    return apiClient(`/chart-of-accounts/${id}/status`, {
      method: 'PATCH',
      body: { status, reason },
    });
  },

  getNextAccountCode: async (type: string, parentId?: string): Promise<{ code: string }> => {
    return apiClient<{ code: string }>('/chart-of-accounts/next-code', {
      params: { type, parentId: parentId || '' },
    });
  },

  clearAllAccounts: async (): Promise<void> => {
    return apiClient('/chart-of-accounts/clear-all', {
      method: 'DELETE',
    });
  },
};
