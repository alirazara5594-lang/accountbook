import { apiClient } from '../client';

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  customerName?: string;
  date: string;
  expiryDate: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Invoiced' | 'Expired';
  totalAmount: number;
  lines?: any[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

export interface CustomerReceipt {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName?: string;
  date: string;
  amount: number;
  paymentMethod: string;
  status: string;
}

export const salesApi = {
  getEstimates: async (companyId?: string): Promise<Estimate[]> => {
    return apiClient<Estimate[]>('/estimates', { params: { companyId } });
  },

  createEstimate: async (data: any): Promise<Estimate> => {
    return apiClient<Estimate>('/estimates', { method: 'POST', body: data });
  },

  updateEstimateStatus: async (id: string, status: string): Promise<void> => {
    return apiClient(`/estimates/${id}/status`, { method: 'PATCH', body: { status } });
  },

  convertToInvoice: async (estimateId: string, options?: any): Promise<Invoice> => {
    return apiClient<Invoice>(`/estimates/${estimateId}/convert-to-invoice`, {
      method: 'POST',
      body: options || {},
    });
  },

  getInvoices: async (companyId?: string): Promise<Invoice[]> => {
    return apiClient<Invoice[]>('/invoices', { params: { companyId } });
  },

  createInvoice: async (data: any): Promise<Invoice> => {
    return apiClient<Invoice>('/invoices', { method: 'POST', body: data });
  },

  getCustomerReceipts: async (companyId?: string): Promise<CustomerReceipt[]> => {
    return apiClient<CustomerReceipt[]>('/customerreceipts', { params: { companyId } });
  },

  createCustomerReceipt: async (data: any): Promise<CustomerReceipt> => {
    return apiClient<CustomerReceipt>('/customerreceipts', { method: 'POST', body: data });
  },
};
