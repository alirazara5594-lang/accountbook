// src/api/modules/vendorPayments.api.ts
import { apiClient } from '../client';

export interface VendorPayment {
  id: string;
  paymentNumber: string;
  vendorId: string;
  vendorName?: string;
  date: string;
  amount: number;
  paymentMethod: string;
  bankAccountName?: string;
  withdrawFromAccountId?: string;
  withdrawFromAccountName?: string;
  billId?: string;
  billNumber?: string;
  reference?: string;
  memo?: string;
  status: string;
  journalEntryId?: string;
}

export interface WithdrawAccount {
  id: string;
  code: string;
  name: string;
}

export interface VendorBillLite {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName?: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  currencyCode: string;
}

export const vendorPaymentsApi = {
  getAll: async (companyId?: string): Promise<VendorPayment[]> => {
    return apiClient<VendorPayment[]>('/vendor-payments', { params: { companyId } });
  },

  getWithdrawAccounts: async (): Promise<WithdrawAccount[]> => {
    return apiClient<WithdrawAccount[]>('/vendor-payments/withdraw-accounts');
  },

  getBills: async (vendorId?: string): Promise<VendorBillLite[]> => {
    return apiClient<VendorBillLite[]>('/vendor-payments/bills', { params: { vendorId } });
  },

  create: async (data: any): Promise<VendorPayment> => {
    return apiClient<VendorPayment>('/vendor-payments', { method: 'POST', body: data });
  },
};