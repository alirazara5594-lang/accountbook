import { create } from 'zustand';
import { manufacturingApi } from '../api';
import type { BillOfMaterials, WorkOrder } from '../api';

interface ManufacturingState {
  boms: BillOfMaterials[];
  workOrders: WorkOrder[];
  loading: boolean;
  error: string | null;

  fetchBoms: (companyId?: string) => Promise<BillOfMaterials[]>;
  createBom: (data: any) => Promise<BillOfMaterials>;
  fetchWorkOrders: (companyId?: string) => Promise<WorkOrder[]>;
  createWorkOrder: (data: any) => Promise<WorkOrder>;
  startWorkOrder: (id: string, companyId?: string) => Promise<void>;
  completeWorkOrder: (id: string, data: { actualProducedQty: number; directLabor: number; overhead: number }, companyId?: string) => Promise<void>;
  fetchAllManufacturing: (companyId?: string) => Promise<void>;
}

export const useManufacturingStore = create<ManufacturingState>((set, get) => ({
  boms: [],
  workOrders: [],
  loading: false,
  error: null,

  fetchBoms: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const boms = await manufacturingApi.getBoms(companyId);
      set({ boms, loading: false });
      return boms;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch BOMs', loading: false });
      return [];
    }
  },

  createBom: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const created = await manufacturingApi.createBom(data);
      await get().fetchBoms(data.companyId);
      set({ loading: false });
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create BOM', loading: false });
      throw err;
    }
  },

  fetchWorkOrders: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const workOrders = await manufacturingApi.getWorkOrders(companyId);
      set({ workOrders, loading: false });
      return workOrders;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch Work Orders', loading: false });
      return [];
    }
  },

  createWorkOrder: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const created = await manufacturingApi.createWorkOrder(data);
      await get().fetchWorkOrders(data.companyId);
      set({ loading: false });
      return created;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create Work Order', loading: false });
      throw err;
    }
  },

  startWorkOrder: async (id: string, companyId?: string) => {
    set({ loading: true, error: null });
    try {
      await manufacturingApi.startWorkOrder(id);
      await get().fetchWorkOrders(companyId);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to start Work Order', loading: false });
      throw err;
    }
  },

  completeWorkOrder: async (id: string, data: { actualProducedQty: number; directLabor: number; overhead: number }, companyId?: string) => {
    set({ loading: true, error: null });
    try {
      await manufacturingApi.completeWorkOrder(id, data);
      await get().fetchWorkOrders(companyId);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to complete Work Order', loading: false });
      throw err;
    }
  },

  fetchAllManufacturing: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchBoms(companyId),
        get().fetchWorkOrders(companyId),
      ]);
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch manufacturing data', loading: false });
    }
  },
}));
