import { create } from 'zustand';
import {
  salesApi,
  type Estimate,
  type Invoice,
  type CustomerReceipt,
} from '../api/modules/sales.api';

interface SalesState {
  estimates: Estimate[];
  invoices: Invoice[];
  receipts: CustomerReceipt[];
  loading: boolean;
  error: string | null;

  fetchEstimates: (companyId?: string) => Promise<Estimate[]>;
  fetchInvoices: (companyId?: string) => Promise<Invoice[]>;
  fetchReceipts: (companyId?: string) => Promise<CustomerReceipt[]>;
  fetchAllSales: (companyId?: string) => Promise<void>;
  fetchNextNumber: (type: 'invoice' | 'estimate') => Promise<string>;

  createEstimate: (data: any) => Promise<Estimate>;
  updateEstimateStatus: (id: string, status: string) => Promise<void>;
  convertToInvoice: (estimateId: string, options?: any) => Promise<Invoice>;
  createInvoice: (data: any) => Promise<Invoice>;
  createCustomerReceipt: (data: any) => Promise<CustomerReceipt>;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  estimates: [],
  invoices: [],
  receipts: [],
  loading: false,
  error: null,

  fetchEstimates: async (companyId?: string) => {
    try {
      const estimates = await salesApi.getEstimates(companyId);
      set({ estimates });
      return estimates;
    } catch {
      return [];
    }
  },

  fetchInvoices: async (companyId?: string) => {
    try {
      const invoices = await salesApi.getInvoices(companyId);
      set({ invoices });
      return invoices;
    } catch {
      return [];
    }
  },

  fetchReceipts: async (companyId?: string) => {
    try {
      const receipts = await salesApi.getCustomerReceipts(companyId);
      set({ receipts });
      return receipts;
    } catch {
      return [];
    }
  },

  fetchAllSales: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const [estimates, invoices, receipts] = await Promise.all([
        salesApi.getEstimates(companyId).catch(() => []),
        salesApi.getInvoices(companyId).catch(() => []),
        salesApi.getCustomerReceipts(companyId).catch(() => []),
      ]);
      set({ estimates, invoices, receipts, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load sales data', loading: false });
    }
  },

  createEstimate: async (data: any) => {
    const res = await salesApi.createEstimate(data);
    await get().fetchEstimates();
    return res;
  },

  fetchNextNumber: async (type: 'invoice' | 'estimate') => {
    try {
      // Check localStorage for last number
      const prefix = type === 'invoice' ? 'INV' : 'EST';
      const last = localStorage.getItem(`last_${type}_number`);
      if (last) {
        const lastNum = parseInt(last.replace(/[^\d]/g, '') || '0');
        const nextNum = lastNum + 1;
        localStorage.setItem(`last_${type}_number`, nextNum.toString());
        return prefix + '-' + nextNum.toString().padStart(5, '0');
      } else {
        const startNum = type === 'invoice' ? 1001 : 1001;
        localStorage.setItem(`last_${type}_number`, startNum.toString());
        return prefix + '-' + startNum.toString().padStart(5, '0');
      }
    } catch {
      return type === 'invoice' ? 'INV-1001' : 'EST-1001';
    }
  },

  updateEstimateStatus: async (id: string, status: string) => {
    await salesApi.updateEstimateStatus(id, status);
    await get().fetchEstimates();
  },

  convertToInvoice: async (estimateId: string, options?: any) => {
    const res = await salesApi.convertToInvoice(estimateId, options);
    await Promise.all([get().fetchEstimates(), get().fetchInvoices()]);
    return res;
  },

  createInvoice: async (data: any) => {
    const res = await salesApi.createInvoice(data);
    await get().fetchInvoices();
    return res;
  },

  createCustomerReceipt: async (data: any) => {
    const res = await salesApi.createCustomerReceipt(data);
    await get().fetchReceipts();
    return res;
  },
}));
