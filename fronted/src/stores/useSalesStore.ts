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
  updateInvoice: (id: string, data: any) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: number | string) => Promise<void>;
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
      const prefix = type === 'invoice' ? 'INV' : 'EST';
      const items: any[] = type === 'invoice' ? (get().invoices || []) : (get().estimates || []);
      
      let maxNum = 0;
      for (const item of items) {
        const str = (type === 'invoice' ? (item.invoiceNumber || item.reference) : (item.estimateNumber || item.reference)) || '';
        const match = str.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      const nextNum = maxNum > 0 ? maxNum + 1 : 1;
      return `${prefix}-${nextNum.toString().padStart(5, '0')}`;
    } catch {
      return type === 'invoice' ? 'INV-00001' : 'EST-00001';
    }
  },

  updateEstimateStatus: async (id: string, status: string) => {
    const numStatus = Number(status);
    set((state) => ({
      estimates: state.estimates.map((e) =>
        e.id === id ? { ...e, status: isNaN(numStatus) ? e.status : numStatus } : e
      ),
    }));
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

  updateInvoice: async (id: string, data: any) => {
    const res = await salesApi.updateInvoice(id, data);
    await get().fetchInvoices();
    return res;
  },

  updateInvoiceStatus: async (id: string, status: number | string) => {
    await salesApi.updateInvoiceStatus(id, status);
    await get().fetchInvoices();
  },

  createCustomerReceipt: async (data: any) => {
    const res = await salesApi.createCustomerReceipt(data);
    await get().fetchReceipts();
    return res;
  },
}));
