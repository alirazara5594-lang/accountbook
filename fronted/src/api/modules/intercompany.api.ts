import { apiClient } from '../client';

export interface IntercompanyAllocation {
  id: string;
  name: string;
  sourceCompanyId: string;
  category: string;
  frequency: string;
  rate: number;
  quantity: number;
  status: string;
  endDate?: string | null;
  recipients: { companyId: string; sharePercent: number }[];
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: { accountId: string; amount: number; type: string; description?: string }[];
  status: string;
}

export const intercompanyApi = {
  getAllocations: async (): Promise<IntercompanyAllocation[]> => {
    return apiClient<IntercompanyAllocation[]>('/intercompany-allocations');
  },

  createAllocation: async (data: any): Promise<IntercompanyAllocation> => {
    return apiClient<IntercompanyAllocation>('/intercompany-allocations', {
      method: 'POST',
      body: data,
    });
  },

  setStatus: async (id: string, status: string): Promise<IntercompanyAllocation> => {
    return apiClient<IntercompanyAllocation>(`/intercompany-allocations/${id}/status`, {
      method: 'PUT',
      body: { Status: status },
    });
  },

  processAllocation: async (id: string): Promise<JournalEntry> => {
    return apiClient<JournalEntry>(`/intercompany-allocations/${id}/process`, {
      method: 'POST',
    });
  },
};
