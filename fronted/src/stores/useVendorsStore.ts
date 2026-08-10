import { create } from 'zustand';
import { vendorsApi, type Vendor } from '../api/modules/vendors.api';

interface VendorsState {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;

  fetchVendors: (companyId?: string) => Promise<Vendor[]>;
  fetchNextNumber: () => Promise<string>;
  saveVendor: (data: any, id?: string) => Promise<Vendor>;
  toggleVendorStatus: (vendor: Vendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
}

export const useVendorsStore = create<VendorsState>((set, get) => ({
  vendors: [],
  loading: false,
  error: null,

  fetchVendors: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const vendors = await vendorsApi.getVendors(companyId);
      set({ vendors, loading: false });
      return vendors;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load vendors', loading: false });
      return [];
    }
  },

  fetchNextNumber: async () => {
    try {
      const res = await vendorsApi.getNextVendorNumber();
      return res.vendorNumber;
    } catch {
      return '';
    }
  },

  saveVendor: async (data: any, id?: string) => {
    set({ loading: true, error: null });
    try {
      const saved = await vendorsApi.saveVendor(data, id);
      await get().fetchVendors();
      return saved;
    } catch (err: any) {
      set({ error: err.message || 'Failed to save vendor', loading: false });
      throw err;
    }
  },

  toggleVendorStatus: async (vendor: Vendor) => {
    set({ loading: true, error: null });
    try {
      const nextStatus = vendor.status === 'Active' ? 'Inactive' : 'Active';
      await vendorsApi.toggleVendorStatus(vendor.id, nextStatus);
      await get().fetchVendors();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update vendor status', loading: false });
      throw err;
    }
  },

  deleteVendor: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await vendorsApi.deleteVendor(id);
      await get().fetchVendors();
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete vendor', loading: false });
      throw err;
    }
  },
}));
