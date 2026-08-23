import { create } from 'zustand';
import { salesOrdersApi, type SalesOrder, type SalesOrderRequest, type SalesOrderStatus } from '../api/modules/salesOrders.api';

interface SalesOrdersState {
  orders: SalesOrder[];
  loading: boolean;
  error: string | null;

  fetchOrders: (companyId?: string) => Promise<SalesOrder[]>;
  createOrder: (request: SalesOrderRequest) => Promise<SalesOrder>;
  updateOrderStatus: (id: string, status: SalesOrderStatus) => Promise<void>;
  convertToInvoice: (id: string) => Promise<{ invoiceId: string; invoiceNumber: string }>;
  fetchNextNumber: () => Promise<string>;
}

export const useSalesOrdersStore = create<SalesOrdersState>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  fetchOrders: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const orders = await salesOrdersApi.getOrders(companyId);
      set({ orders, loading: false });
      return orders;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load sales orders', loading: false });
      return [];
    }
  },

  createOrder: async (request: SalesOrderRequest) => {
    set({ loading: true, error: null });
    try {
      const order = await salesOrdersApi.createOrder(request);
      await get().fetchOrders(request.companyId);
      return order;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create sales order', loading: false });
      throw err;
    }
  },

  fetchNextNumber: async () => {
    try {
      const orders = get().orders || [];
      let maxNum = 0;
      for (const item of orders) {
        const str = item.orderNumber || item.reference || '';
        const match = str.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      const nextNum = maxNum > 0 ? maxNum + 1 : 1;
      return `SO-${nextNum.toString().padStart(5, '0')}`;
    } catch {
      return 'SO-00001';
    }
  },

  updateOrderStatus: async (id: string, status: SalesOrderStatus) => {
    set({ loading: true, error: null });
    try {
      await salesOrdersApi.updateOrderStatus(id, status);
      await get().fetchOrders();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update order status', loading: false });
      throw err;
    }
  },

  convertToInvoice: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await salesOrdersApi.convertToInvoice(id);
      await get().fetchOrders();
      set({ loading: false });
      return { invoiceId: res.invoiceId, invoiceNumber: res.invoiceNumber };
    } catch (err: any) {
      set({ error: err.message || 'Failed to convert sales order', loading: false });
      throw err;
    }
  },
}));
