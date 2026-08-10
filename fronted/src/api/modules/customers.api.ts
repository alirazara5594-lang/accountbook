import { apiClient } from '../client';

export interface Customer {
  id: string;
  customerNumber?: string;
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
  creditLimit?: number;
  receivablesAccountId?: string;
  status: any;
  billingAddress?: any;
  shippingAddress?: any;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const customersApi = {
  getCustomers: async (companyId?: string): Promise<Customer[]> => {
    return apiClient<Customer[]>('/customers', {
      params: { companyId },
    });
  },

  getNextCustomerNumber: async (): Promise<{ customerNumber: string }> => {
    return apiClient<{ customerNumber: string }>('/customers/next-number');
  },

  saveCustomer: async (customerData: any, id?: string): Promise<Customer> => {
    const endpoint = id ? `/customers/${id}` : '/customers';
    const method = id ? 'PUT' : 'POST';
    return apiClient<Customer>(endpoint, {
      method,
      body: customerData,
    });
  },

  toggleCustomerStatus: async (id: string, status: any, reason = 'Status updated'): Promise<void> => {
    return apiClient(`/customers/${id}/status`, {
      method: 'PATCH',
      body: { status, reason },
    });
  },

  deleteCustomer: async (id: string): Promise<void> => {
    return apiClient(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};
