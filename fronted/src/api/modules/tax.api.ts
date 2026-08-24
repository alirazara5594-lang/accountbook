import { apiClient } from '../client';

export interface TaxAuthority {
  id: string;
  name: string;
  code?: string;
  country?: string;
  state?: string;
  registrationNumber?: string;
  liabilityAccountId?: string;
  inputTaxAccountId?: string;
  nonRecoverableAccountId?: string;
  withholdingAccountId?: string;
  settlementAccountId?: string;
  filingFrequency?: string;
  remittanceDueDay?: number;
  website?: string;
  companyId?: string;
}

export type TaxScope = 'Both' | 'Sales' | 'Purchases' | 0 | 1 | 2;
export type TaxType = 'Standard' | 'Reduced' | 'ZeroRated' | 'Exempt' | 'ReverseCharge' | 'Withholding' | 'Compound' | 'ServiceTax' | number;

export interface TaxCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  taxType?: TaxType;
  scope?: TaxScope;
  rate?: number;
  rates?: TaxRate[];
  taxAuthorityId: string;
  jurisdictionId?: string;
  deductibilityPercentage?: number;
  isCompound?: boolean;
  isActive?: boolean;
  companyId?: string;
}

export interface TaxRate {
  id: string;
  taxCodeId: string;
  name?: string;
  ratePercent?: number;
  percentage?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  effectiveDate?: string;
}

export type ExemptionType = 'Resale' | 'NonProfit' | 'Government' | 'Diplomatic' | 'Export' | 'Manufacturing' | 'RawMaterial' | 'Other' | number;
export type ExemptionStatus = 'Active' | 'Expired' | 'Revoked' | 'PendingVerification' | number;

export interface TaxExemption {
  id: string;
  certificateNumber: string;
  type: ExemptionType;
  counterpartyName: string;
  customerId?: string;
  vendorId?: string;
  taxId?: string;
  issuingAuthority?: string;
  jurisdictionId?: string;
  validFrom: string;
  validTo?: string;
  status: ExemptionStatus;
  attachmentUrl?: string;
  notes?: string;
  companyId?: string;
  createdAt?: string;
}

export interface TaxJurisdiction {
  id: string;
  name: string;
  flag: string;
  authority: string;
  currency: string;
  regime: string;
  standardRate: number;
  reducedRate: number;
  zeroRate: number;
  registrationThreshold: number;
  filingFrequency: string;
  filingForm: string;
  corporateTax: string;
  note: string;
}

export interface TaxBoxDetail {
  box: string;
  description: string;
  amount: number;
}

export interface TaxSummaryReport {
  jurisdictionId: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  totalPurchases: number;
  totalOutputTax: number;
  totalInputTax: number;
  netTaxPayable: number;
  totalZeroRatedSales: number;
  totalExemptSales: number;
  totalWithheld: number;
  boxes: TaxBoxDetail[];
}

export const taxApi = {
  getTaxAuthorities: async (companyId?: string): Promise<TaxAuthority[]> => {
    const url = companyId ? `/taxes/authorities?companyId=${companyId}` : '/taxes/authorities';
    return apiClient<TaxAuthority[]>(url);
  },

  createTaxAuthority: async (data: Partial<TaxAuthority>): Promise<TaxAuthority> => {
    return apiClient<TaxAuthority>('/taxes/authorities', { method: 'POST', body: data });
  },

  updateTaxAuthority: async (id: string, data: Partial<TaxAuthority>): Promise<TaxAuthority> => {
    return apiClient<TaxAuthority>(`/taxes/authorities/${id}`, { method: 'PUT', body: data });
  },

  deleteTaxAuthority: async (id: string): Promise<void> => {
    return apiClient<void>(`/taxes/authorities/${id}`, { method: 'DELETE' });
  },

  getTaxCodes: async (jurisdictionId?: string, companyId?: string): Promise<TaxCode[]> => {
    const params = new URLSearchParams();
    if (jurisdictionId) params.append('jurisdictionId', jurisdictionId);
    if (companyId) params.append('companyId', companyId);
    const qs = params.toString();
    return apiClient<TaxCode[]>(qs ? `/taxes/codes?${qs}` : '/taxes/codes');
  },

  createTaxCode: async (data: any): Promise<TaxCode> => {
    return apiClient<TaxCode>('/taxes/codes', { method: 'POST', body: data });
  },

  updateTaxCode: async (id: string, data: any): Promise<TaxCode> => {
    return apiClient<TaxCode>(`/taxes/codes/${id}`, { method: 'PUT', body: data });
  },

  deleteTaxCode: async (id: string): Promise<void> => {
    return apiClient<void>(`/taxes/codes/${id}`, { method: 'DELETE' });
  },

  getTaxRates: async (taxCodeId?: string): Promise<TaxRate[]> => {
    const url = taxCodeId ? `/taxes/rates?taxCodeId=${taxCodeId}` : '/taxes/rates';
    return apiClient<TaxRate[]>(url);
  },

  createTaxRate: async (data: any): Promise<TaxRate> => {
    return apiClient<TaxRate>('/taxes/rates', { method: 'POST', body: data });
  },

  getTaxExemptions: async (jurisdictionId?: string, companyId?: string): Promise<TaxExemption[]> => {
    const params = new URLSearchParams();
    if (jurisdictionId) params.append('jurisdictionId', jurisdictionId);
    if (companyId) params.append('companyId', companyId);
    const qs = params.toString();
    return apiClient<TaxExemption[]>(qs ? `/taxes/exemptions?${qs}` : '/taxes/exemptions');
  },

  createTaxExemption: async (data: Partial<TaxExemption>): Promise<TaxExemption> => {
    return apiClient<TaxExemption>('/taxes/exemptions', { method: 'POST', body: data });
  },

  updateTaxExemption: async (id: string, data: Partial<TaxExemption>): Promise<TaxExemption> => {
    return apiClient<TaxExemption>(`/taxes/exemptions/${id}`, { method: 'PUT', body: data });
  },

  deleteTaxExemption: async (id: string): Promise<void> => {
    return apiClient<void>(`/taxes/exemptions/${id}`, { method: 'DELETE' });
  },

  seedCountryPreset: async (country: string, companyId?: string): Promise<{ success: boolean; message: string }> => {
    return apiClient<{ success: boolean; message: string }>('/taxes/seed-country-preset', {
      method: 'POST',
      body: { country, companyId },
    });
  },

  getTaxSummaryReport: async (params?: { fromDate?: string; toDate?: string; jurisdictionId?: string; companyId?: string }): Promise<TaxSummaryReport> => {
    const p = new URLSearchParams();
    if (params?.fromDate) p.append('fromDate', params.fromDate);
    if (params?.toDate) p.append('toDate', params.toDate);
    if (params?.jurisdictionId) p.append('jurisdictionId', params.jurisdictionId);
    if (params?.companyId) p.append('companyId', params.companyId);
    const qs = p.toString();
    return apiClient<TaxSummaryReport>(qs ? `/taxes/summary-report?${qs}` : '/taxes/summary-report');
  },

  getJurisdictions: async (): Promise<TaxJurisdiction[]> => {
    return apiClient<TaxJurisdiction[]>('/taxes/jurisdictions');
  },
};
