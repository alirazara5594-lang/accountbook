import { apiClient } from '../client';
import type { JournalEntry } from './journals.api';

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
