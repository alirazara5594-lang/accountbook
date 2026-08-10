import { apiClient } from '../client';

export interface FixedAsset {
  id: string;
  assetCode: string;
  name: string;
  category: string;
  acquisitionDate: string;
  cost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  depreciationMethod: string;
  accumulatedDepreciation: number;
  bookValue: number;
  status: 'Active' | 'Disposed' | 'FullyDepreciated';
  companyId?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  code?: string;
  companyId?: string;
}

export interface StockLevel {
  id: string;
  productId: string;
  productName?: string;
  itemCode?: string;
  warehouseId: string;
  warehouseName?: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  unitCost: number;
}

export interface StockTransaction {
  id: string;
  transactionNumber: string;
  type: 'Inbound' | 'Outbound' | 'Transfer' | 'Adjustment';
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  date: string;
  reference: string;
}

export const assetsInventoryApi = {
  getFixedAssets: async (companyId?: string): Promise<FixedAsset[]> => {
    return apiClient<FixedAsset[]>('/fixedassets', { params: { companyId } });
  },

  runDepreciation: async (id: string, expenseAccId: string, accumAccId: string): Promise<any> => {
    return apiClient(`/fixed-assets/${id}/run-depreciation`, {
      method: 'POST',
      body: { depreciationExpenseAccountId: expenseAccId, accumulatedDepreciationAccountId: accumAccId },
    });
  },

  disposeAsset: async (id: string, data: any): Promise<any> => {
    return apiClient(`/fixedassets/${id}/dispose`, {
      method: 'POST',
      body: data,
    });
  },

  getWarehouses: async (companyId?: string): Promise<Warehouse[]> => {
    return apiClient<Warehouse[]>('/warehouses', { params: { companyId } });
  },

  createWarehouse: async (data: any): Promise<Warehouse> => {
    return apiClient<Warehouse>('/warehouses', { method: 'POST', body: data });
  },

  getStockLevels: async (companyId?: string): Promise<StockLevel[]> => {
    return apiClient<StockLevel[]>('/stock-levels', { params: { companyId } });
  },

  getStockTransactions: async (companyId?: string): Promise<StockTransaction[]> => {
    return apiClient<StockTransaction[]>('/stock-transactions', { params: { companyId } });
  },

  createStockTransaction: async (data: any): Promise<StockTransaction> => {
    return apiClient<StockTransaction>('/stock-transactions', { method: 'POST', body: data });
  },
};
