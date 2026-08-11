// src/api/modules/customerPayments.api.ts
import { salesApi, type CustomerReceipt } from './sales.api';

export const customerPaymentsApi = {
  // Fetch all customer receipts (payments)
  getAll: async (companyId?: string): Promise<CustomerReceipt[]> => {
    return salesApi.getCustomerReceipts(companyId);
  },
  // Create a new payment (customer receipt)
  create: async (data: any): Promise<CustomerReceipt> => {
    return salesApi.createCustomerReceipt(data);
  },
  // Additional actions (void, refund) can be added later
};
