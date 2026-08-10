import { apiClient } from '../client';

export type LineDestination = 'Inventory' | 'ManufacturingMaterial' | 'FixedAsset' | 'DirectExpense';
export type ProcurementStatus = 'Draft' | 'Submitted' | 'Approved' | 'Sent' | 'PartiallyReceived' | 'FullyReceived' | 'Billed' | 'Closed' | 'Rejected' | 'Cancelled';

export interface PurchaseRequestLine {
  id?: string;
  requestId?: string;
  description: string;
  productId?: string;
  category?: string;
  quantity: number;
  estimatedUnitPrice: number;
  destination: LineDestination;
  targetWarehouseId?: string;
  expenseAccountId?: string;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  requestorName: string;
  department: string;
  date: string;
  requiredByDate: string;
  priority: string;
  status: ProcurementStatus;
  purpose?: string;
  totalEstimatedAmount: number;
  companyId?: string;
  lines: PurchaseRequestLine[];
}

export interface RequestForQuotation {
  id: string;
  rfqNumber: string;
  purchaseRequestId?: string;
  issueDate: string;
  dueDate: string;
  title: string;
  status: ProcurementStatus;
  companyId?: string;
  invitedVendorIds: string[];
  lines: PurchaseRequestLine[];
}

export interface VendorQuoteLine {
  id?: string;
  vendorQuoteId?: string;
  description: string;
  productId?: string;
  quantity: number;
  quotedUnitPrice: number;
  destination: LineDestination;
}

export interface VendorQuote {
  id: string;
  quoteNumber: string;
  rfqId: string;
  vendorId: string;
  vendorName: string;
  quoteDate: string;
  validUntil: string;
  deliveryLeadTimeDays: number;
  totalAmount: number;
  isSelected?: boolean;
  selectionNotes?: string;
  companyId?: string;
  lines: VendorQuoteLine[];
}

export interface GoodsReceiptLine {
  id?: string;
  grnId?: string;
  description: string;
  productId?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  rejectedQuantity: number;
  unitCost: number;
  destination: LineDestination;
  targetWarehouseId: string;
  expenseAccountId?: string;
  rejectionReason?: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  vendorId: string;
  vendorName: string;
  receivedDate: string;
  deliveryChallanNumber: string;
  receivedBy: string;
  targetWarehouseId: string;
  companyId?: string;
  lines: GoodsReceiptLine[];
}

export interface ThreeWayMatchResult {
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  grnId: string;
  grnNumber: string;
  vendorBillNumber: string;
  orderedAmount: number;
  receivedAmount: number;
  billedAmount: number;
  quantityVariance: number;
  priceVariance: number;
  isMatched: boolean;
  status: string;
  details: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  date: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  status: string;
  companyId?: string;
}

export const procurementApi = {
  getRequests: async (companyId?: string): Promise<PurchaseRequest[]> => {
    return apiClient<PurchaseRequest[]>('/procurement/requests', { params: { companyId } });
  },

  createRequest: async (data: any): Promise<PurchaseRequest> => {
    return apiClient<PurchaseRequest>('/procurement/requests', { method: 'POST', body: data });
  },

  getRfqs: async (companyId?: string): Promise<RequestForQuotation[]> => {
    return apiClient<RequestForQuotation[]>('/procurement/rfqs', { params: { companyId } });
  },

  createRfq: async (data: any): Promise<RequestForQuotation> => {
    return apiClient<RequestForQuotation>('/procurement/rfqs', { method: 'POST', body: data });
  },

  getVendorQuotes: async (rfqId?: string, companyId?: string): Promise<VendorQuote[]> => {
    return apiClient<VendorQuote[]>('/procurement/vendor-quotes', { params: { rfqId, companyId } });
  },

  submitVendorQuote: async (data: any): Promise<VendorQuote> => {
    return apiClient<VendorQuote>('/procurement/vendor-quotes', { method: 'POST', body: data });
  },

  selectVendorQuote: async (id: string): Promise<void> => {
    return apiClient(`/procurement/vendor-quotes/${id}/select`, { method: 'POST' });
  },

  getOrders: async (companyId?: string): Promise<any[]> => {
    return apiClient<any[]>('/procurement/orders', { params: { companyId } });
  },

  createOrder: async (data: any): Promise<any> => {
    return apiClient<any>('/procurement/orders', { method: 'POST', body: data });
  },

  getGrns: async (companyId?: string): Promise<GoodsReceiptNote[]> => {
    return apiClient<GoodsReceiptNote[]>('/procurement/grn', { params: { companyId } });
  },

  receiveGrn: async (data: any): Promise<void> => {
    return apiClient('/procurement/grn', { method: 'POST', body: data });
  },

  getBills: async (companyId?: string): Promise<any[]> => {
    return apiClient<any[]>('/procurement/bills', { params: { companyId } });
  },

  createBill: async (data: any): Promise<any> => {
    return apiClient<any>('/procurement/bills', { method: 'POST', body: data });
  },

  validateThreeWayMatch: async (poId: string): Promise<ThreeWayMatchResult> => {
    return apiClient<ThreeWayMatchResult>(`/procurement/three-way-match/${poId}`);
  },

  getTransfers: async (companyId?: string): Promise<StockTransfer[]> => {
    return apiClient<StockTransfer[]>('/procurement/transfers', { params: { companyId } });
  },

  createTransfer: async (data: any): Promise<void> => {
    return apiClient('/procurement/transfers', { method: 'POST', body: data });
  },
};
