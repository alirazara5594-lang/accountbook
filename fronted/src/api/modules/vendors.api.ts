import { apiClient } from '../client';

export interface Vendor {
  id: string;
  vendorNumber?: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  taxNumber?: string;
  taxId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  currencyCode?: string;
  currency?: string;
  paymentTerms?: string;
  paymentTermsDays?: number;
  defaultExpenseAccountId?: string;
  payablesAccountId?: string;
  status: any;
  billingAddress?: any;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const vendorsApi = {
  getVendors: async (companyId?: string): Promise<Vendor[]> => {
    return apiClient<Vendor[]>('/vendors', {
      params: { companyId },
    });
  },

  getNextVendorNumber: async (): Promise<{ vendorNumber: string }> => {
    return apiClient<{ vendorNumber: string }>('/vendors/next-number');
  },

  saveVendor: async (vendorData: any, id?: string): Promise<Vendor> => {
    const endpoint = id ? `/vendors/${id}` : '/vendors';
    const method = id ? 'PUT' : 'POST';
    return apiClient<Vendor>(endpoint, {
      method,
      body: vendorData,
    });
  },

  toggleVendorStatus: async (id: string, status: any, reason = 'Status updated'): Promise<void> => {
    return apiClient(`/vendors/${id}/status`, {
      method: 'PATCH',
      body: { status, reason },
    });
  },

  deleteVendor: async (id: string): Promise<void> => {
    return apiClient(`/vendors/${id}`, {
      method: 'DELETE',
    });
  },
};
