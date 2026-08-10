import { create } from 'zustand';
import { intercompanyApi, type IntercompanyAllocation } from '../api/modules/intercompany.api';

interface IntercompanyState {
  allocations: IntercompanyAllocation[];
  loading: boolean;
  error: string | null;

  fetchAllocations: () => Promise<IntercompanyAllocation[]>;
  createAllocation: (data: any) => Promise<IntercompanyAllocation>;
}

export const useIntercompanyStore = create<IntercompanyState>((set, get) => ({
  allocations: [],
  loading: false,
  error: null,

  fetchAllocations: async () => {
    set({ loading: true, error: null });
    try {
      const allocations = await intercompanyApi.getAllocations();
      set({ allocations, loading: false });
      return allocations;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load intercompany allocations', loading: false });
      return [];
    }
  },

  createAllocation: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const created = await intercompanyApi.createAllocation(data);
      await get().fetchAllocations();
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create allocation', loading: false });
      throw err;
    }
  },
}));
