import { apiClient } from '../client';

export type SalesOrderStatus = 'Draft' | 'Confirmed' | 'Invoiced' | 'Cancelled';

export interface SalesOrderLine {
  id: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxCodeId?: string;
  taxAmount: number;
  lineTotal: number;
  lineTotalAfterDiscount: number;
  lineTotalWithTax: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  reference?: string;
  notes?: string;
  terms?: string;
  status: SalesOrderStatus;
  lines: SalesOrderLine[];
  subTotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  convertedToInvoiceId?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderLineRequest {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxCodeId?: string;
  taxAmount: number;
}

export interface SalesOrderRequest {
  orderNumber?: string;
  customerId: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  reference?: string;
  notes?: string;
  terms?: string;
  lines: SalesOrderLineRequest[];
  companyId?: string;
}

export const salesOrdersApi = {
  getOrders: async (companyId?: string): Promise<SalesOrder[]> => {
    return apiClient<SalesOrder[]>('/sales-orders', {
      params: { companyId: companyId || '' },
    });
  },

  getOrderById: async (id: string): Promise<SalesOrder> => {
    return apiClient<SalesOrder>(`/sales-orders/${id}`);
  },

  createOrder: async (request: SalesOrderRequest): Promise<SalesOrder> => {
    return apiClient<SalesOrder>('/sales-orders', {
      method: 'POST',
      body: request,
    });
  },

  updateOrderStatus: async (id: string, status: SalesOrderStatus): Promise<void> => {
    return apiClient(`/sales-orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  convertToInvoice: async (id: string): Promise<{ message: string; invoiceId: string; invoiceNumber: string }> => {
    return apiClient<{ message: string; invoiceId: string; invoiceNumber: string }>(`/sales-orders/${id}/convert-to-invoice`, {
      method: 'POST',
    });
  },
};
