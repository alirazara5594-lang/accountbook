import { create } from 'zustand';
import { vouchersApi, type Voucher } from '../api/modules/vouchers.api';

interface VouchersState {
  vouchers: Voucher[];
  loading: boolean;
  error: string | null;

  fetchVouchers: (companyId?: string) => Promise<Voucher[]>;
  createVoucher: (data: any) => Promise<Voucher>;
}

export const useVouchersStore = create<VouchersState>((set, get) => ({
  vouchers: [],
  loading: false,
  error: null,

  fetchVouchers: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const vouchers = await vouchersApi.getVouchers(companyId);
      set({ vouchers, loading: false });
      return vouchers;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load vouchers', loading: false });
      return [];
    }
  },

  createVoucher: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const created = await vouchersApi.createVoucher(data);
      await get().fetchVouchers();
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create voucher', loading: false });
      throw err;
    }
  },
}));
