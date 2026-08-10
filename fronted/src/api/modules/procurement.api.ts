import { apiClient } from '../client';

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requester?: string;
  requesterName?: string;
  department?: string;
  date: string;
  requiredDate?: string;
  status: any;
  itemsCount?: number;
  totalAmount?: number;
  lines?: any[];
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName?: string;
  date: string;
  deliveryDate?: string;
  status: any;
  totalAmount?: number;
  lines?: any[];
}

export interface GoodsReceipt {
  id: string;
  grnNumber?: string;
  poNumber?: string;
  vendorName?: string;
  receivedDate?: string;
  dateReceived?: string;
  status?: any;
  lines?: any[];
  isProcessed?: boolean;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  vendorBillNumber?: string;
  vendorInvoiceNumber?: string;
  vendorName?: string;
  date: string;
  dueDate: string;
  amount?: number;
  status: any;
  hasVarianceWarning?: boolean;
}

export interface VendorPayment {
  id: string;
  paymentNumber?: string;
  vendorName?: string;
  date: string;
  amount: number;
  paymentMethod?: string;
  paymentMode?: string;
  status: any;
}

export const procurementApi = {
  getPurchaseRequests: async (companyId?: string): Promise<PurchaseRequest[]> => {
    return apiClient<PurchaseRequest[]>('/purchaserequests', { params: { companyId } });
  },

  getRfqs: async (companyId?: string): Promise<any[]> => {
    return apiClient<any[]>('/rfqs', { params: { companyId } });
  },

  getPurchaseOrders: async (companyId?: string): Promise<PurchaseOrder[]> => {
    return apiClient<PurchaseOrder[]>('/purchaseorders', { params: { companyId } });
  },

  getGoodsReceipts: async (companyId?: string): Promise<GoodsReceipt[]> => {
    return apiClient<GoodsReceipt[]>('/goodsreceipts', { params: { companyId } });
  },

  getVendorBills: async (companyId?: string): Promise<VendorBill[]> => {
    return apiClient<VendorBill[]>('/vendorbills', { params: { companyId } });
  },

  getVendorPayments: async (companyId?: string): Promise<VendorPayment[]> => {
    return apiClient<VendorPayment[]>('/vendorpayments', { params: { companyId } });
  },

  createPurchaseRequest: async (data: any): Promise<PurchaseRequest> => {
    return apiClient<PurchaseRequest>('/purchaserequests', { method: 'POST', body: data });
  },

  createPurchaseOrder: async (data: any): Promise<PurchaseOrder> => {
    return apiClient<PurchaseOrder>('/purchaseorders', { method: 'POST', body: data });
  },

  updatePOStatus: async (id: string, status: string): Promise<void> => {
    return apiClient(`/purchaseorders/${id}/status`, { method: 'PATCH', body: { status } });
  },

  createGoodsReceipt: async (data: any): Promise<GoodsReceipt> => {
    return apiClient<GoodsReceipt>('/goodsreceipts', { method: 'POST', body: data });
  },

  createVendorBill: async (data: any): Promise<VendorBill> => {
    return apiClient<VendorBill>('/vendorbills', { method: 'POST', body: data });
  },

  createVendorPayment: async (data: any): Promise<VendorPayment> => {
    return apiClient<VendorPayment>('/vendorpayments', { method: 'POST', body: data });
  },
};
