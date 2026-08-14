import { apiClient } from '../client';

// ── Types ────────────────────────────────────────────────────────────────────
export type TaxObligationStatus = 'Due' | 'Filed' | 'Paid' | 'Overdue';
export type EInvoiceStatus = 'Draft' | 'Submitted' | 'Validated' | 'Rejected';

export interface TaxObligation {
  id: string;
  obligationNumber: string;
  jurisdictionId: string;
  obligationType: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  status: TaxObligationStatus;
  filedDate?: string;
  amountDue: number;
  amountPaid: number;
  notes?: string;
  companyId?: string;
  createdAt: string;
}

export interface TaxReturn {
  id: string;
  returnNumber: string;
  jurisdictionId: string;
  returnType: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  filedDate?: string;
  status: string;
  outputTax: number;
  inputTax: number;
  netTax: number;
  amountPaid: number;
  reference?: string;
  companyId?: string;
  createdAt: string;
}

export interface WithholdingCertificate {
  id: string;
  certificateNumber: string;
  certificateType: string;
  counterpartyName: string;
  taxId: string;
  ratePercent: number;
  grossAmount: number;
  withheldAmount: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  companyId?: string;
  createdAt: string;
}

export interface EInvoice {
  id: string;
  invoiceNumber: string;
  invoiceType: string;
  counterpartyName: string;
  counterpartyTaxId?: string;
  issueDate: string;
  reference?: string;
  grossAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: EInvoiceStatus;
  uuid?: string;
  companyId?: string;
  createdAt: string;
}

export interface ComplianceDashboard {
  obligations: number;
  due: number;
  overdue: number;
  filed: number;
  totalDue: number;
  totalWithheld: number;
  validatedInvoices: number;
  pendingInvoices: number;
  rejectedInvoices: number;
  invoices: number;
  returns: number;
  upcoming: { id: string; obligationNumber: string; jurisdictionId: string; obligationType: string; dueDate: string; amountDue: number }[];
}

export const complianceApi = {
  getDashboard: async (): Promise<ComplianceDashboard> => {
    return apiClient<ComplianceDashboard>('/compliance/dashboard');
  },

  getObligations: async (params?: { jurisdictionId?: string; status?: TaxObligationStatus; companyId?: string }): Promise<TaxObligation[]> => {
    return apiClient<TaxObligation[]>('/compliance/obligations', { params });
  },
  createObligation: async (data: any): Promise<TaxObligation> => {
    return apiClient<TaxObligation>('/compliance/obligations', { method: 'POST', body: data });
  },
  setObligationStatus: async (id: string, status: TaxObligationStatus): Promise<TaxObligation> => {
    return apiClient<TaxObligation>(`/compliance/obligations/${id}/status`, { method: 'POST', body: { status } });
  },

  getReturns: async (params?: { jurisdictionId?: string; status?: string; companyId?: string }): Promise<TaxReturn[]> => {
    return apiClient<TaxReturn[]>('/compliance/returns', { params });
  },
  createReturn: async (data: any): Promise<TaxReturn> => {
    return apiClient<TaxReturn>('/compliance/returns', { method: 'POST', body: data });
  },
  fileReturn: async (id: string): Promise<TaxReturn> => {
    return apiClient<TaxReturn>(`/compliance/returns/${id}/file`, { method: 'POST' });
  },

  getWithholding: async (params?: { type?: string; status?: string; companyId?: string }): Promise<WithholdingCertificate[]> => {
    return apiClient<WithholdingCertificate[]>('/compliance/withholding', { params });
  },
  createWithholding: async (data: any): Promise<WithholdingCertificate> => {
    return apiClient<WithholdingCertificate>('/compliance/withholding', { method: 'POST', body: data });
  },

  getEInvoices: async (params?: { type?: string; status?: EInvoiceStatus; companyId?: string }): Promise<EInvoice[]> => {
    return apiClient<EInvoice[]>('/compliance/e-invoices', { params });
  },
  createEInvoice: async (data: any): Promise<EInvoice> => {
    return apiClient<EInvoice>('/compliance/e-invoices', { method: 'POST', body: data });
  },
  setEInvoiceStatus: async (id: string, status: EInvoiceStatus): Promise<EInvoice> => {
    return apiClient<EInvoice>(`/compliance/e-invoices/${id}/status`, { method: 'POST', body: { status } });
  },
};
