import { apiClient } from '../client';

export type AccountLevel = 'MainHead' | 'SubHead' | 'DetailAccount';
export type NormalBalanceType = 'Debit' | 'Credit';

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
  
  // GAAP structural fields
  subtype: string;
  level: AccountLevel;
  isPosting: boolean;
  normalBalance: NormalBalanceType;
  currency: string;
  taxCategory?: string;
  allowManualJournal: boolean;
  description?: string;
  
  updatedAt?: string;
}

export interface AccountMapping {
  mappingKey: string;
  accountId: string;
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

  getMappings: async (): Promise<AccountMapping[]> => {
    return apiClient<AccountMapping[]>('/chart-of-accounts/mappings');
  },

  saveMapping: async (mappingKey: string, accountId: string): Promise<void> => {
    return apiClient('/chart-of-accounts/mappings', {
      method: 'POST',
      body: { mappingKey, accountId },
    });
  },
};
