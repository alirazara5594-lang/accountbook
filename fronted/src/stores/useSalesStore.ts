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
