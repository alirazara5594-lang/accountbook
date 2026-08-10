import { create } from 'zustand';
import {
  taxApi,
  type TaxAuthority,
  type TaxCode,
  type TaxRate,
} from '../api/modules/tax.api';

interface TaxState {
  authorities: TaxAuthority[];
  taxCodes: TaxCode[];
  taxRates: TaxRate[];
  loading: boolean;
  error: string | null;

  fetchAuthorities: () => Promise<TaxAuthority[]>;
  fetchTaxCodes: () => Promise<TaxCode[]>;
  fetchTaxRates: () => Promise<TaxRate[]>;
  fetchAllTaxData: () => Promise<void>;

  createTaxCode: (data: any) => Promise<TaxCode>;
  createTaxRate: (data: any) => Promise<TaxRate>;
}

export const useTaxStore = create<TaxState>((set, get) => ({
  authorities: [],
  taxCodes: [],
  taxRates: [],
  loading: false,
  error: null,

  fetchAuthorities: async () => {
    try {
      const authorities = await taxApi.getTaxAuthorities();
      set({ authorities });
      return authorities;
    } catch {
      return [];
    }
  },

  fetchTaxCodes: async () => {
    try {
      const taxCodes = await taxApi.getTaxCodes();
      set({ taxCodes });
      return taxCodes;
    } catch {
      return [];
    }
  },

  fetchTaxRates: async () => {
    try {
      const taxRates = await taxApi.getTaxRates();
      set({ taxRates });
      return taxRates;
    } catch {
      return [];
    }
  },

  fetchAllTaxData: async () => {
    set({ loading: true, error: null });
    try {
      const [authorities, taxCodes, taxRates] = await Promise.all([
        taxApi.getTaxAuthorities().catch(() => []),
        taxApi.getTaxCodes().catch(() => []),
        taxApi.getTaxRates().catch(() => []),
      ]);
      set({ authorities, taxCodes, taxRates, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load tax data', loading: false });
    }
  },

  createTaxCode: async (data: any) => {
    const res = await taxApi.createTaxCode(data);
    await get().fetchTaxCodes();
    return res;
  },

  createTaxRate: async (data: any) => {
    const res = await taxApi.createTaxRate(data);
    await get().fetchTaxRates();
    return res;
  },
}));
