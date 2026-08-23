import { apiClient } from '../client';

export interface BomLine {
  id?: string;
  bomId?: string;
  rawMaterialProductId: string;
  rawMaterialProductName: string;
  unitOfMeasure?: string;
  quantityRequired: number;
  wastePercentage?: number;
}

export interface BillOfMaterials {
  id: string;
  bomNumber: string;
  finishedProductId: string;
  finishedProductName: string;
  quantityProduced: number;
  estimatedLaborHours?: number;
  estimatedMachineHours?: number;
  notes?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
  lines: BomLine[];
}

export interface WorkOrderLine {
  id?: string;
  workOrderId?: string;
  rawMaterialProductId: string;
  rawMaterialProductName: string;
  quantityRequired: number;
  quantityIssued: number;
  unitCost: number;
  totalCost: number;
}

export interface QcInspectionRecord {
  id?: string;
  workOrderId: string;
  inspectionDate?: string;
  inspectorName: string;
  quantityInspected: number;
  quantityPassed: number;
  quantityRejected: number;
  scrapCost?: number;
  defectReason?: string;
  status: 'Pending' | 'Passed' | 'Failed' | 'ConditionalPass' | number | string;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  workOrderNumber: string;
  bomId: string;
  finishedProductId: string;
  finishedProductName: string;
  rawMaterialWarehouseId: string;
  finishedGoodsWarehouseId: string;
  quantityToProduce: number;
  quantityProduced: number;
  status: 'Draft' | 'Released' | 'InProgress' | 'Completed' | 'Cancelled' | number | string;
  startDate: string;
  completionDate?: string;

  // Machine & Work Center Linkage
  workCenterName?: string;
  machineAssetId?: string;
  machineAssetTag?: string;
  machineAssetName?: string;
  machineRunHours?: number;
  machineHourlyRate?: number;

  // Direct Labor
  assignedTechnicianName?: string;
  laborHours?: number;
  laborHourlyRate?: number;

  // Cost Accounting Elements
  totalMaterialCost: number;
  directLaborCost: number;
  overheadCost: number;
  totalCost: number;
  unitCost: number;

  // Quality Control
  qcStatus?: 'Pending' | 'Passed' | 'Failed' | 'ConditionalPass' | number | string;
  acceptedQuantity?: number;
  scrapQuantity?: number;
  scrapReason?: string;
  inspectorName?: string;
  inspectionNotes?: string;
  inspectedAt?: string;

  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
  lines: WorkOrderLine[];
  qcHistory?: QcInspectionRecord[];
}

export const manufacturingApi = {
  getBoms: async (companyId?: string): Promise<BillOfMaterials[]> => {
    return apiClient<BillOfMaterials[]>('/manufacturing/bom', { params: { companyId } });
  },

  createBom: async (data: any): Promise<BillOfMaterials> => {
    return apiClient<BillOfMaterials>('/manufacturing/bom', { method: 'POST', body: data });
  },

  getWorkOrders: async (companyId?: string): Promise<WorkOrder[]> => {
    return apiClient<WorkOrder[]>('/manufacturing/work-orders', { params: { companyId } });
  },

  createWorkOrder: async (data: any): Promise<WorkOrder> => {
    return apiClient<WorkOrder>('/manufacturing/work-orders', { method: 'POST', body: data });
  },

  startWorkOrder: async (id: string): Promise<void> => {
    return apiClient(`/manufacturing/work-orders/${id}/start`, { method: 'POST' });
  },

  logMachineHours: async (id: string, additionalHours: number, hourlyRate?: number): Promise<void> => {
    return apiClient(`/manufacturing/work-orders/${id}/machine-hours`, {
      method: 'POST',
      body: { additionalHours, hourlyRate },
    });
  },

  performQcInspection: async (id: string, data: QcInspectionRecord): Promise<{ message: string; record: QcInspectionRecord }> => {
    return apiClient(`/manufacturing/work-orders/${id}/qc`, {
      method: 'POST',
      body: data,
    });
  },

  completeWorkOrder: async (id: string, data: { actualProducedQty: number; directLabor: number; overhead: number }): Promise<void> => {
    return apiClient(`/manufacturing/work-orders/${id}/complete`, { method: 'POST', body: data });
  },
};
