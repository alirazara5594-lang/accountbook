import { apiClient } from '../client';

export type VoucherType = 'BPV' | 'BRV' | 'CPV' | 'CRV' | 'JV';

export interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: VoucherType;
  date: string;
  accountId?: string;
  accountName: string;
  partyType: 'Vendor' | 'Customer' | 'General Ledger';
  partyName: string;
  paymentMode: string;
  chequeNumber?: string;
  amount: number;
  currency: string;
  narration: string;
  status: 'Posted' | 'Draft';
  journalEntryId?: string;
  companyId?: string;
  createdAt?: string;
}

export interface VoucherRequest {
  type: VoucherType;
  date: string;
  accountName?: string;
  partyType?: string;
  partyName?: string;
  paymentMode?: string;
  chequeNumber?: string;
  amount: number;
  currency?: string;
  narration?: string;
  companyId?: string;
}

export const vouchersApi = {
  getVouchers: async (companyId?: string): Promise<Voucher[]> => {
    return apiClient<Voucher[]>('/vouchers', { params: { companyId } });
  },

  createVoucher: async (data: VoucherRequest): Promise<Voucher> => {
    return apiClient<Voucher>('/vouchers', { method: 'POST', body: data });
  },
};