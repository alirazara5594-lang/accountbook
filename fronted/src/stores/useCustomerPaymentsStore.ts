// src/stores/useCustomerPaymentsStore.ts
import { create } from 'zustand';
import { customerPaymentsApi, type CustomerReceipt } from '../api/modules/customerPayments.api';

interface CustomerPaymentsState {
  payments: CustomerReceipt[];
  loading: boolean;
  error: string | null;
  fetchAll: (companyId?: string) => Promise<CustomerReceipt[]>;
  create: (data: any) => Promise<CustomerReceipt>;
}

export const useCustomerPaymentsStore = create<CustomerPaymentsState>((set, get) => ({
  payments: [],
  loading: false,
  error: null,
  fetchAll: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const data = await customerPaymentsApi.getAll(companyId);
      set({ payments: data, loading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load payments', loading: false });
      return [];
    }
  },
  create: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const receipt = await customerPaymentsApi.create(data);
      await get().fetchAll();
      set({ loading: false });
      return receipt;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create payment', loading: false });
      throw err;
    }
  },
}));
