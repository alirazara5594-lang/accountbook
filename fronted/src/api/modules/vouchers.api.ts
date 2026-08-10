import { apiClient } from '../client';

export interface Voucher {
  id: string;
  voucherNumber: string;
  voucherType: 'Payment' | 'Receipt' | 'Journal' | 'Contra';
  date: string;
  amount: number;
  payeeName?: string;
  description: string;
  status: string;
  lines?: any[];
}

export const vouchersApi = {
  getVouchers: async (companyId?: string): Promise<Voucher[]> => {
    return apiClient<Voucher[]>('/vouchers', { params: { companyId } });
  },

  createVoucher: async (data: any): Promise<Voucher> => {
    return apiClient<Voucher>('/vouchers', { method: 'POST', body: data });
  },
};
