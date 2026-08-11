import { apiClient } from '../client';

export type CreditNoteStatus = 'Draft' | 'Posted' | 'Void';

export interface CreditNoteLine {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxCodeId?: string;
  taxAmount: number;
  lineTotal: number;
  lineTotalAfterDiscount: number;
  lineTotalWithTax: number;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  customerId: string;
  originalInvoiceId?: string;
  creditNoteDate: string;
  reference?: string;
  notes?: string;
  status: CreditNoteStatus;
  lines: CreditNoteLine[];
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteLineRequest {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxCodeId?: string;
  taxAmount: number;
}

export interface CreditNoteRequest {
  creditNoteNumber?: string;
  customerId: string;
  originalInvoiceId?: string;
  creditNoteDate: string;
  reference?: string;
  notes?: string;
  lines: CreditNoteLineRequest[];
  companyId?: string;
}

export const creditNotesApi = {
  getAll: async (companyId?: string): Promise<CreditNote[]> => {
    return apiClient<CreditNote[]>('/credit-notes', { params: { companyId: companyId || '' } });
  },
  getOne: async (id: string): Promise<CreditNote> => {
    return apiClient<CreditNote>(`/credit-notes/${id}`);
  },
  create: async (req: CreditNoteRequest): Promise<CreditNote> => {
    return apiClient<CreditNote>('/credit-notes', { method: 'POST', body: req });
  },
  post: async (id: string, arAccountId?: string, revenueAccountId?: string, taxLiabilityAccountId?: string): Promise<void> => {
    return apiClient<void>(`/credit-notes/${id}/post`, {
      method: 'POST',
      params: { arAccountId, revenueAccountId, taxLiabilityAccountId },
    });
  },
  void: async (id: string): Promise<void> => {
    return apiClient<void>(`/credit-notes/${id}/void`, { method: 'POST' });
  },
};
