import { apiClient } from '../client';

export interface TaxAuthority {
  id: string;
  name: string;
  country?: string;
  region?: string;
  jurisdiction?: string;
  state?: string;
}

export interface TaxCode {
  id: string;
  code: string;
  name: string;
  taxType?: string;
  status?: string;
  rate?: number;
  rates?: any[];
  taxAuthorityId?: string;
  isActive?: boolean;
}

export interface TaxRate {
  id: string;
  taxCodeId: string;
  name: string;
  ratePercent: number;
  effectiveDate: string;
  percentage?: number;
}

export const taxApi = {
  getTaxAuthorities: async (): Promise<TaxAuthority[]> => {
    return apiClient<TaxAuthority[]>('/taxes/authorities');
  },

  getTaxCodes: async (): Promise<TaxCode[]> => {
    return apiClient<TaxCode[]>('/taxes/codes');
  },

  getTaxRates: async (): Promise<TaxRate[]> => {
    return apiClient<TaxRate[]>('/taxes/rates');
  },

  createTaxCode: async (data: any): Promise<TaxCode> => {
    return apiClient<TaxCode>('/taxes/codes', { method: 'POST', body: data });
  },

  createTaxRate: async (data: any): Promise<TaxRate> => {
    return apiClient<TaxRate>('/taxes/rates', { method: 'POST', body: data });
  },
};
