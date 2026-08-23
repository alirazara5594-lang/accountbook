import { apiClient } from '../client';

export interface AssetMaintenanceRecord {
  id?: string;
  assetId?: string;
  date: string;
  maintenanceType: 'Preventive' | 'BreakdownRepair' | 'Calibration' | 'Inspection' | 'Overhaul' | number | string;
  description: string;
  cost: number;
  technicianName?: string;
  downTimeHours?: number;
  partsReplaced?: string;
  nextServiceDueDate?: string;
  createdAt?: string;
}

export interface AssetTransferRecord {
  id?: string;
  assetId?: string;
  transferDate: string;
  fromLocation?: string;
  toLocation: string;
  fromWorkCenter?: string;
  toWorkCenter?: string;
  authorizedBy?: string;
  remarks?: string;
  createdAt?: string;
}

export interface FixedAsset {
  id: string;
  assetTag: string;
  assetCode?: string;
  name: string;
  category?: string;
  description?: string;
  serialNumber?: string;
  modelNumber?: string;
  manufacturer?: string;

  // Financial & Valuation
  purchaseDate: string;
  purchasePrice: number;
  cost?: number;
  salvageValue: number;
  usefulLifeYears: number;
  depreciationMethod: 'StraightLine' | 'DecliningBalance' | 'UnitsOfProduction' | 'SumOfYearsDigits' | number | string;
  accumulatedDepreciation: number;
  netBookValue?: number;
  bookValue?: number;
  status: 'Active' | 'Disposed' | 'Depreciated' | 'UnderMaintenance' | 'Inactive' | string | number;
  costAllocation?: 'AdministrativeExpense' | 'ManufacturingOverhead' | number | string;

  // Procurement Integration
  vendorId?: string;
  vendorName?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  vendorBillId?: string;
  vendorBillNumber?: string;
  grnNumber?: string;
  warrantyExpiryDate?: string;

  // Factory Location & Custody
  location?: string;
  department?: string;
  workCenterId?: string;
  workCenterName?: string;
  assignedCustodianId?: string;
  assignedCustodianName?: string;

  // Factory Machine Health & Metrics
  machineHealth?: 'Operating' | 'InProduction' | 'UnderMaintenance' | 'Breakdown' | 'Idle' | 'Retired' | number | string;
  currentMeterHours?: number;
  totalCapacityUnits?: number;
  unitsProduced?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDueDate?: string;

  // GL Accounts
  assetAccountId?: string;
  accumulatedDepreciationAccountId?: string;
  depreciationExpenseAccountId?: string;
  gainLossDisposalAccountId?: string;
  companyId?: string;

  maintenanceHistory?: AssetMaintenanceRecord[];
  transferHistory?: AssetTransferRecord[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DepreciationRunResult {
  assetId: string;
  assetTag: string;
  assetName: string;
  amountPosted: number;
  status: string;
  cost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  expenseAccountCode?: string;
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

  getFixedAsset: async (id: string): Promise<FixedAsset> => {
    return apiClient<FixedAsset>(`/fixedassets/${id}`);
  },

  createFixedAsset: async (data: any): Promise<FixedAsset> => {
    return apiClient<FixedAsset>('/fixedassets', {
      method: 'POST',
      body: data,
    });
  },

  updateFixedAsset: async (id: string, data: any): Promise<FixedAsset> => {
    return apiClient<FixedAsset>(`/fixedassets/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  logMaintenance: async (id: string, data: AssetMaintenanceRecord): Promise<any> => {
    return apiClient(`/fixedassets/${id}/maintenance`, {
      method: 'POST',
      body: data,
    });
  },

  transferAsset: async (id: string, data: AssetTransferRecord): Promise<any> => {
    return apiClient(`/fixedassets/${id}/transfer`, {
      method: 'POST',
      body: data,
    });
  },

  updateMachineStatus: async (id: string, status: string | number, currentMeterHours: number): Promise<any> => {
    return apiClient(`/fixedassets/${id}/machine-status`, {
      method: 'POST',
      body: { status, currentMeterHours },
    });
  },

  runDepreciation: async (id: string, expenseAccId: string, accumAccId: string): Promise<any> => {
    return apiClient(`/fixedassets/${id}/run-depreciation`, {
      method: 'POST',
      body: { depreciationExpenseAccountId: expenseAccId, accumulatedDepreciationAccountId: accumAccId },
    });
  },

  runBatchDepreciation: async (asOfDate?: string): Promise<{ message: string; results: DepreciationRunResult[] }> => {
    return apiClient('/fixedassets/run-batch-depreciation', {
      method: 'POST',
      params: { asOfDate },
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
