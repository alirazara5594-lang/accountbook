import { create } from 'zustand';
import {
  procurementApi,
  type PurchaseRequest,
  type PurchaseOrder,
  type GoodsReceipt,
  type VendorBill,
  type VendorPayment,
} from '../api/modules/procurement.api';

interface ProcurementState {
  requests: PurchaseRequest[];
  rfqs: any[];
  orders: PurchaseOrder[];
  receipts: GoodsReceipt[];
  bills: VendorBill[];
  payments: VendorPayment[];
  loading: boolean;
  error: string | null;

  fetchRequests: (companyId?: string) => Promise<PurchaseRequest[]>;
  fetchRfqs: (companyId?: string) => Promise<any[]>;
  fetchOrders: (companyId?: string) => Promise<PurchaseOrder[]>;
  fetchReceipts: (companyId?: string) => Promise<GoodsReceipt[]>;
  fetchBills: (companyId?: string) => Promise<VendorBill[]>;
  fetchPayments: (companyId?: string) => Promise<VendorPayment[]>;
  fetchAllProcurement: (companyId?: string) => Promise<void>;

  createPurchaseRequest: (data: any) => Promise<PurchaseRequest>;
  createPurchaseOrder: (data: any) => Promise<PurchaseOrder>;
  updatePOStatus: (id: string, status: string) => Promise<void>;
  createGoodsReceipt: (data: any) => Promise<GoodsReceipt>;
  createVendorBill: (data: any) => Promise<VendorBill>;
  createVendorPayment: (data: any) => Promise<VendorPayment>;
}

export const useProcurementStore = create<ProcurementState>((set, get) => ({
  requests: [],
  rfqs: [],
  orders: [],
  receipts: [],
  bills: [],
  payments: [],
  loading: false,
  error: null,

  fetchRequests: async (companyId?: string) => {
    try {
      const requests = await procurementApi.getPurchaseRequests(companyId);
      set({ requests });
      return requests;
    } catch {
      return [];
    }
  },

  fetchRfqs: async (companyId?: string) => {
    try {
      const rfqs = await procurementApi.getRfqs(companyId);
      set({ rfqs });
      return rfqs;
    } catch {
      return [];
    }
  },

  fetchOrders: async (companyId?: string) => {
    try {
      const orders = await procurementApi.getPurchaseOrders(companyId);
      set({ orders });
      return orders;
    } catch {
      return [];
    }
  },

  fetchReceipts: async (companyId?: string) => {
    try {
      const receipts = await procurementApi.getGoodsReceipts(companyId);
      set({ receipts });
      return receipts;
    } catch {
      return [];
    }
  },

  fetchBills: async (companyId?: string) => {
    try {
      const bills = await procurementApi.getVendorBills(companyId);
      set({ bills });
      return bills;
    } catch {
      return [];
    }
  },

  fetchPayments: async (companyId?: string) => {
    try {
      const payments = await procurementApi.getVendorPayments(companyId);
      set({ payments });
      return payments;
    } catch {
      return [];
    }
  },

  fetchAllProcurement: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const [requests, rfqs, orders, receipts, bills, payments] = await Promise.all([
        procurementApi.getPurchaseRequests(companyId).catch(() => []),
        procurementApi.getRfqs(companyId).catch(() => []),
        procurementApi.getPurchaseOrders(companyId).catch(() => []),
        procurementApi.getGoodsReceipts(companyId).catch(() => []),
        procurementApi.getVendorBills(companyId).catch(() => []),
        procurementApi.getVendorPayments(companyId).catch(() => []),
      ]);
      set({ requests, rfqs, orders, receipts, bills, payments, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load procurement data', loading: false });
    }
  },

  createPurchaseRequest: async (data: any) => {
    const res = await procurementApi.createPurchaseRequest(data);
    await get().fetchRequests();
    return res;
  },

  createPurchaseOrder: async (data: any) => {
    const res = await procurementApi.createPurchaseOrder(data);
    await get().fetchOrders();
    return res;
  },

  updatePOStatus: async (id: string, status: string) => {
    await procurementApi.updatePOStatus(id, status);
    await get().fetchOrders();
  },

  createGoodsReceipt: async (data: any) => {
    const res = await procurementApi.createGoodsReceipt(data);
    await get().fetchReceipts();
    return res;
  },

  createVendorBill: async (data: any) => {
    const res = await procurementApi.createVendorBill(data);
    await get().fetchBills();
    return res;
  },

  createVendorPayment: async (data: any) => {
    const res = await procurementApi.createVendorPayment(data);
    await get().fetchPayments();
    return res;
  },
}));
