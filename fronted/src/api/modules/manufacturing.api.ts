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
  status: any;
  startDate: string;
  completionDate?: string;
  directLaborCost: number;
  overheadCost: number;
  totalMaterialCost: number;
  totalCost: number;
  unitCost: number;
  companyId?: string;
  lines: WorkOrderLine[];
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

  completeWorkOrder: async (id: string, data: { actualProducedQty: number; directLabor: number; overhead: number }): Promise<void> => {
    return apiClient(`/manufacturing/work-orders/${id}/complete`, { method: 'POST', body: data });
  },
};
