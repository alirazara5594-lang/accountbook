import { create } from 'zustand';
import {
  taxApi,
  type TaxAuthority,
  type TaxCode,
  type TaxRate,
  type TaxExemption,
  type TaxSummaryReport,
} from '../api/modules/tax.api';

interface TaxState {
  authorities: TaxAuthority[];
  taxCodes: TaxCode[];
  taxRates: TaxRate[];
  exemptions: TaxExemption[];
  summaryReport: TaxSummaryReport | null;
  loading: boolean;
  error: string | null;

  fetchAuthorities: (companyId?: string) => Promise<TaxAuthority[]>;
  fetchTaxCodes: (jurisdictionId?: string, companyId?: string) => Promise<TaxCode[]>;
  fetchTaxRates: (taxCodeId?: string) => Promise<TaxRate[]>;
  fetchExemptions: (jurisdictionId?: string, companyId?: string) => Promise<TaxExemption[]>;
  fetchSummaryReport: (params?: { fromDate?: string; toDate?: string; jurisdictionId?: string; companyId?: string }) => Promise<TaxSummaryReport | null>;
  fetchAllTaxData: (jurisdictionId?: string, companyId?: string) => Promise<void>;

  createTaxAuthority: (data: Partial<TaxAuthority>) => Promise<TaxAuthority>;
  updateTaxAuthority: (id: string, data: Partial<TaxAuthority>) => Promise<TaxAuthority>;
  deleteTaxAuthority: (id: string) => Promise<void>;

  createTaxCode: (data: any) => Promise<TaxCode>;
  updateTaxCode: (id: string, data: any) => Promise<TaxCode>;
  deleteTaxCode: (id: string) => Promise<void>;

  createTaxRate: (data: any) => Promise<TaxRate>;

  createTaxExemption: (data: Partial<TaxExemption>) => Promise<TaxExemption>;
  updateTaxExemption: (id: string, data: Partial<TaxExemption>) => Promise<TaxExemption>;
  deleteTaxExemption: (id: string) => Promise<void>;

  seedCountryPreset: (country: string, companyId?: string) => Promise<void>;
}

export const useTaxStore = create<TaxState>((set, get) => ({
  authorities: [],
  taxCodes: [],
  taxRates: [],
  exemptions: [],
  summaryReport: null,
  loading: false,
  error: null,

  fetchAuthorities: async (companyId?: string) => {
    try {
      const authorities = await taxApi.getTaxAuthorities(companyId);
      set({ authorities });
      return authorities;
    } catch {
      return [];
    }
  },

  fetchTaxCodes: async (jurisdictionId?: string, companyId?: string) => {
    try {
      const taxCodes = await taxApi.getTaxCodes(jurisdictionId, companyId);
      set({ taxCodes });
      return taxCodes;
    } catch {
      return [];
    }
  },

  fetchTaxRates: async (taxCodeId?: string) => {
    try {
      const taxRates = await taxApi.getTaxRates(taxCodeId);
      set({ taxRates });
      return taxRates;
    } catch {
      return [];
    }
  },

  fetchExemptions: async (jurisdictionId?: string, companyId?: string) => {
    try {
      const exemptions = await taxApi.getTaxExemptions(jurisdictionId, companyId);
      set({ exemptions });
      return exemptions;
    } catch {
      return [];
    }
  },

  fetchSummaryReport: async (params) => {
    try {
      const summaryReport = await taxApi.getTaxSummaryReport(params);
      set({ summaryReport });
      return summaryReport;
    } catch {
      return null;
    }
  },

  fetchAllTaxData: async (jurisdictionId?: string, companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const [authorities, taxCodes, taxRates, exemptions, summaryReport] = await Promise.all([
        taxApi.getTaxAuthorities(companyId).catch(() => []),
        taxApi.getTaxCodes(jurisdictionId, companyId).catch(() => []),
        taxApi.getTaxRates().catch(() => []),
        taxApi.getTaxExemptions(jurisdictionId, companyId).catch(() => []),
        taxApi.getTaxSummaryReport({ jurisdictionId, companyId }).catch(() => null),
      ]);
      set({ authorities, taxCodes, taxRates, exemptions, summaryReport, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load tax data', loading: false });
    }
  },

  createTaxAuthority: async (data: Partial<TaxAuthority>) => {
    const res = await taxApi.createTaxAuthority(data);
    await get().fetchAuthorities();
    return res;
  },

  updateTaxAuthority: async (id: string, data: Partial<TaxAuthority>) => {
    const res = await taxApi.updateTaxAuthority(id, data);
    await get().fetchAuthorities();
    return res;
  },

  deleteTaxAuthority: async (id: string) => {
    await taxApi.deleteTaxAuthority(id);
    await get().fetchAuthorities();
  },

  createTaxCode: async (data: any) => {
    const res = await taxApi.createTaxCode(data);
    await get().fetchTaxCodes();
    return res;
  },

  updateTaxCode: async (id: string, data: any) => {
    const res = await taxApi.updateTaxCode(id, data);
    await get().fetchTaxCodes();
    return res;
  },

  deleteTaxCode: async (id: string) => {
    await taxApi.deleteTaxCode(id);
    await get().fetchTaxCodes();
  },

  createTaxRate: async (data: any) => {
    const res = await taxApi.createTaxRate(data);
    await get().fetchTaxRates();
    return res;
  },

  createTaxExemption: async (data: Partial<TaxExemption>) => {
    const res = await taxApi.createTaxExemption(data);
    await get().fetchExemptions();
    return res;
  },

  updateTaxExemption: async (id: string, data: Partial<TaxExemption>) => {
    const res = await taxApi.updateTaxExemption(id, data);
    await get().fetchExemptions();
    return res;
  },

  deleteTaxExemption: async (id: string) => {
    await taxApi.deleteTaxExemption(id);
    await get().fetchExemptions();
  },

  seedCountryPreset: async (country: string, companyId?: string) => {
    set({ loading: true, error: null });
    try {
      await taxApi.seedCountryPreset(country, companyId);
      await get().fetchAllTaxData(undefined, companyId);
    } catch (err: any) {
      set({ error: err.message || 'Failed to provision country preset', loading: false });
    }
  },
}));
