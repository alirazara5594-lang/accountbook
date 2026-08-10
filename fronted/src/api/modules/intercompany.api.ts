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
};
