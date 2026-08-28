import { create } from 'zustand';
import { manufacturingApi } from '@/api/modules/manufacturing.api';
import type {
  Bom,
  Routing,
  WorkOrder,
  WorkOrderLine,
  WorkOrderOperation,
  WorkOrderCompletion,
  MaterialIssue,
  LaborEntry,
  MachineTimeEntry,
  QcInspection,
  WorkCenter,
  JobCosting,
  ProductionSchedule,
  SubcontractOrder,
  ManufacturingFilters,
  ManufacturingKpis,
  Product,
} from '@/types/manufacturing';

interface ManufacturingState {
  // Data
  boms: Bom[];
  routings: Routing[];
  workOrders: WorkOrder[];
  workOrderLines: WorkOrderLine[];
  workOrderOperations: WorkOrderOperation[];
  completions: WorkOrderCompletion[];
  materialIssues: MaterialIssue[];
  laborEntries: LaborEntry[];
  machineTimeEntries: MachineTimeEntry[];
  qcInspections: QcInspection[];
  workCenters: WorkCenter[];
  products: Product[];
  manufacturingProducts: Product[];
  
  // KPIs & Analytics
  kpis: ManufacturingKpis | null;
  shopFloorStatus: any[];
  jobCosting: JobCosting | null;
  jobCostingReport: JobCosting[];
  productionSchedule: ProductionSchedule[];
  subcontractOrders: SubcontractOrder[];
  
  // UI State
  loading: boolean;
  error: string | null;
  filters: ManufacturingFilters;
  selectedBomId: string | null;
  selectedRoutingId: string | null;
  selectedWorkOrderId: string | null;
  selectedOperationId: string | null;
  
  // Actions - BOM
  fetchBoms: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  fetchBom: (id: string) => Promise<Bom | null>;
  createBom: (data: Partial<Bom>) => Promise<Bom | null>;
  updateBom: (id: string, data: Partial<Bom>) => Promise<Bom | null>;
  approveBom: (id: string) => Promise<Bom | null>;
  reviseBom: (id: string, revision: string) => Promise<Bom | null>;
  deleteBom: (id: string) => Promise<void>;
  copyBom: (id: string, newProductId: string) => Promise<Bom | null>;
  getBomCostRollup: (id: string) => Promise<any>;
  
  // Actions - Routing
  fetchRoutings: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  fetchRouting: (id: string) => Promise<Routing | null>;
  createRouting: (data: Partial<Routing>) => Promise<Routing | null>;
  updateRouting: (id: string, data: Partial<Routing>) => Promise<Routing | null>;
  approveRouting: (id: string) => Promise<Routing | null>;
  deleteRouting: (id: string) => Promise<void>;
  fetchWorkCenters: (companyId: string) => Promise<void>;
  createWorkCenter: (data: Partial<WorkCenter>) => Promise<WorkCenter | null>;
  updateWorkCenter: (id: string, data: Partial<WorkCenter>) => Promise<WorkCenter | null>;
  
  // Actions - Work Orders
  fetchWorkOrders: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  fetchWorkOrder: (id: string) => Promise<WorkOrder | null>;
  createWorkOrder: (data: Partial<WorkOrder>) => Promise<WorkOrder | null>;
  updateWorkOrder: (id: string, data: Partial<WorkOrder>) => Promise<WorkOrder | null>;
  releaseWorkOrder: (id: string) => Promise<WorkOrder | null>;
  startWorkOrder: (id: string) => Promise<WorkOrder | null>;
  holdWorkOrder: (id: string, reason: string) => Promise<WorkOrder | null>;
  resumeWorkOrder: (id: string) => Promise<WorkOrder | null>;
  cancelWorkOrder: (id: string, reason: string) => Promise<WorkOrder | null>;
  closeWorkOrder: (id: string) => Promise<WorkOrder | null>;
  deleteWorkOrder: (id: string) => Promise<void>;
  
  // Work Order Material
  issueMaterial: (workOrderId: string, lines: Partial<WorkOrderLine>[]) => Promise<MaterialIssue | null>;
  returnMaterial: (workOrderId: string, lines: Partial<WorkOrderLine>[]) => Promise<MaterialIssue | null>;
  backflushWorkOrder: (workOrderId: string) => Promise<MaterialIssue | null>;
  
  // Work Order Operations
  startOperation: (workOrderId: string, operationId: string, data: Partial<WorkOrderOperation>) => Promise<WorkOrderOperation | null>;
  completeOperation: (workOrderId: string, operationId: string, data: Partial<WorkOrderOperation>) => Promise<WorkOrderOperation | null>;
  scrapOperation: (workOrderId: string, operationId: string, quantity: number, reason: string) => Promise<WorkOrderOperation | null>;
  
  // Actions - Material Issues
  fetchMaterialIssues: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  fetchMaterialIssue: (id: string) => Promise<MaterialIssue | null>;
  createMaterialIssue: (data: Partial<MaterialIssue>) => Promise<MaterialIssue | null>;
  postMaterialIssue: (id: string) => Promise<MaterialIssue | null>;
  printPickList: (issueId: string) => Promise<Blob | null>;
  
  // Actions - Labor & Machine Time
  fetchLaborEntries: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  createLaborEntry: (data: Partial<LaborEntry>) => Promise<LaborEntry | null>;
  updateLaborEntry: (id: string, data: Partial<LaborEntry>) => Promise<LaborEntry | null>;
  approveLaborEntry: (id: string) => Promise<LaborEntry | null>;
  fetchMachineTimeEntries: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  createMachineTimeEntry: (data: Partial<MachineTimeEntry>) => Promise<MachineTimeEntry | null>;
  updateMachineTimeEntry: (id: string, data: Partial<MachineTimeEntry>) => Promise<MachineTimeEntry | null>;
  approveMachineTimeEntry: (id: string) => Promise<MachineTimeEntry | null>;
  
  // Actions - Quality Control
  fetchQcInspections: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  fetchQcInspection: (id: string) => Promise<QcInspection | null>;
  createQcInspection: (data: Partial<QcInspection>) => Promise<QcInspection | null>;
  updateQcInspection: (id: string, data: Partial<QcInspection>) => Promise<QcInspection | null>;
  performQcInspection: (id: string, data: Partial<QcInspection>) => Promise<QcInspection | null>;
  fetchQcSpecifications: (productId: string) => Promise<any[]>;
  createQcSpecification: (data: any) => Promise<any>;
  
  // Actions - Work Order Completion
  fetchCompletions: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  fetchCompletion: (id: string) => Promise<WorkOrderCompletion | null>;
  createCompletion: (data: Partial<WorkOrderCompletion>) => Promise<WorkOrderCompletion | null>;
  postCompletion: (id: string) => Promise<WorkOrderCompletion | null>;
  reverseCompletion: (id: string, reason: string) => Promise<WorkOrderCompletion | null>;
  
  // Actions - Job Costing
  fetchJobCosting: (workOrderId: string) => Promise<JobCosting | null>;
  fetchJobCostingReport: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  fetchWipValuation: (companyId: string, date: string) => Promise<any>;
  fetchVarianceAnalysis: (companyId: string, filters?: ManufacturingFilters) => Promise<any[]>;
  
  // Actions - Production Scheduling
  fetchProductionSchedule: (companyId: string, dateFrom: string, dateTo: string) => Promise<void>;
  updateProductionSchedule: (schedule: ProductionSchedule[]) => Promise<ProductionSchedule[] | null>;
  dispatchSchedule: (id: string) => Promise<ProductionSchedule | null>;
  fetchFiniteSchedule: (companyId: string, workCenterIds: string[], horizonDays: number) => Promise<any>;
  
  // Actions - Subcontracting
  fetchSubcontractOrders: (companyId: string, filters?: ManufacturingFilters) => Promise<void>;
  createSubcontractOrder: (data: Partial<SubcontractOrder>) => Promise<SubcontractOrder | null>;
  receiveSubcontractOrder: (id: string, lines: Partial<any>[]) => Promise<SubcontractOrder | null>;
  
  // Actions - KPIs & Analytics
  fetchManufacturingKpis: (companyId: string, dateFrom?: string, dateTo?: string) => Promise<void>;
  fetchShopFloorStatus: (companyId: string) => Promise<void>;
  fetchCapacityPlan: (companyId: string, dateFrom: string, dateTo: string) => Promise<any>;
  
  // Actions - Products
  fetchManufacturingProducts: (companyId: string) => Promise<void>;
  
  // Utility
  fetchAllManufacturing: (companyId: string) => Promise<void>;
  setFilters: (filters: Partial<ManufacturingFilters>) => void;
  clearError: () => void;
  setSelectedBom: (id: string | null) => void;
  setSelectedRouting: (id: string | null) => void;
  setSelectedWorkOrder: (id: string | null) => void;
  setSelectedOperation: (id: string | null) => void;
}

const initialFilters: ManufacturingFilters = {
  search: '',
  status: [],
  productId: '',
  workCenterId: '',
  dateFrom: '',
  dateTo: '',
  priority: [],
  assignedTo: '',
};

export const useManufacturingStore = create<ManufacturingState>((set, get) => ({
  // Initial state
  boms: [],
  routings: [],
  workOrders: [],
  workOrderLines: [],
  workOrderOperations: [],
  completions: [],
  materialIssues: [],
  laborEntries: [],
  machineTimeEntries: [],
  qcInspections: [],
  workCenters: [],
  products: [],
  manufacturingProducts: [],
  kpis: null,
  shopFloorStatus: [],
  jobCosting: null,
  jobCostingReport: [],
  productionSchedule: [],
  subcontractOrders: [],
  loading: false,
  error: null,
  filters: initialFilters,
  selectedBomId: null,
  selectedRoutingId: null,
  selectedWorkOrderId: null,
  selectedOperationId: null,

  // Utility
  clearError: () => set({ error: null }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setSelectedBom: (id) => set({ selectedBomId: id }),
  setSelectedRouting: (id) => set({ selectedRoutingId: id }),
  setSelectedWorkOrder: (id) => set({ selectedWorkOrderId: id }),
  setSelectedOperation: (id) => set({ selectedOperationId: id }),

  // BOM Actions
  fetchBoms: async (companyId, filters) => {
    set({ loading: true, error: null });
    try {
      const data = await manufacturingApi.getBoms(companyId, filters);
      set({ boms: data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch BOMs', loading: false });
    }
  },

  fetchBom: async (id) => {
    try {
      return await manufacturingApi.getBom(id);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch BOM' });
      return null;
    }
  },

  createBom: async (data) => {
    set({ loading: true, error: null });
    try {
      const bom = await manufacturingApi.createBom(data);
      set((state) => ({ boms: [bom, ...state.boms], loading: false }));
      return bom;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create BOM', loading: false });
      return null;
    }
  },

  updateBom: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const bom = await manufacturingApi.updateBom(id, data);
      set((state) => ({
        boms: state.boms.map((b) => (b.id === id ? bom : b)),
        loading: false,
      }));
      return bom;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update BOM', loading: false });
      return null;
    }
  },

  approveBom: async (id) => {
    try {
      const bom = await manufacturingApi.approveBom(id);
      set((state) => ({ boms: state.boms.map((b) => (b.id === id ? bom : b)) }));
      return bom;
    } catch (error: any) {
      set({ error: error.message || 'Failed to approve BOM' });
      return null;
    }
  },

  reviseBom: async (id, revision) => {
    try {
      const bom = await manufacturingApi.reviseBom(id, revision);
      set((state) => ({ boms: state.boms.map((b) => (b.id === id ? bom : b)) }));
      return bom;
    } catch (error: any) {
      set({ error: error.message || 'Failed to revise BOM' });
      return null;
    }
  },

  deleteBom: async (id) => {
    try {
      await manufacturingApi.deleteBom(id);
      set((state) => ({ boms: state.boms.filter((b) => b.id !== id) }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete BOM' });
    }
  },

  copyBom: async (id, newProductId) => {
    try {
      const bom = await manufacturingApi.copyBom(id, newProductId);
      set((state) => ({ boms: [bom, ...state.boms] }));
      return bom;
    } catch (error: any) {
      set({ error: error.message || 'Failed to copy BOM' });
      return null;
    }
  },

  getBomCostRollup: async (id) => {
    try {
      return await manufacturingApi.getBomCostRollup(id);
    } catch (error: any) {
      set({ error: error.message || 'Failed to get cost rollup' });
      return null;
    }
  },

  // Routing Actions
  fetchRoutings: async (companyId, filters) => {
    set({ loading: true, error: null });
    try {
      const data = await manufacturingApi.getRoutings(companyId, filters);
      set({ routings: data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch routings', loading: false });
    }
  },

  fetchRouting: async (id) => {
    try {
      return await manufacturingApi.getRouting(id);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch routing' });
      return null;
    }
  },

  createRouting: async (data) => {
    set({ loading: true, error: null });
    try {
      const routing = await manufacturingApi.createRouting(data);
      set((state) => ({ routings: [routing, ...state.routings], loading: false }));
      return routing;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create routing', loading: false });
      return null;
    }
  },

  updateRouting: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const routing = await manufacturingApi.updateRouting(id, data);
      set((state) => ({
        routings: state.routings.map((r) => (r.id === id ? routing : r)),
        loading: false,
      }));
      return routing;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update routing', loading: false });
      return null;
    }
  },

  approveRouting: async (id) => {
    try {
      const routing = await manufacturingApi.approveRouting(id);
      set((state) => ({ routings: state.routings.map((r) => (r.id === id ? routing : r)) }));
      return routing;
    } catch (error: any) {
      set({ error: error.message || 'Failed to approve routing' });
      return null;
    }
  },

  deleteRouting: async (id) => {
    try {
      await manufacturingApi.deleteRouting(id);
      set((state) => ({ routings: state.routings.filter((r) => r.id !== id) }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete routing' });
    }
  },

  fetchWorkCenters: async (companyId) => {
    try {
      const data = await manufacturingApi.getWorkCenters(companyId);
      set({ workCenters: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch work centers' });
    }
  },

  createWorkCenter: async (data) => {
    try {
      const wc = await manufacturingApi.createWorkCenter(data);
      set((state) => ({ workCenters: [...state.workCenters, wc] }));
      return wc;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create work center' });
      return null;
    }
  },

  updateWorkCenter: async (id, data) => {
    try {
      const wc = await manufacturingApi.updateWorkCenter(id, data);
      set((state) => ({ workCenters: state.workCenters.map((w) => (w.id === id ? wc : w)) }));
      return wc;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update work center' });
      return null;
    }
  },

  // Work Order Actions
  fetchWorkOrders: async (companyId, filters) => {
    set({ loading: true, error: null });
    try {
      const data = await manufacturingApi.getWorkOrders(companyId, filters);
      set({ workOrders: data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch work orders', loading: false });
    }
  },

  fetchWorkOrder: async (id) => {
    try {
      return await manufacturingApi.getWorkOrder(id);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch work order' });
      return null;
    }
  },

  createWorkOrder: async (data) => {
    set({ loading: true, error: null });
    try {
      const wo = await manufacturingApi.createWorkOrder(data);
      set((state) => ({ workOrders: [wo, ...state.workOrders], loading: false }));
      return wo;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create work order', loading: false });
      return null;
    }
  },

  updateWorkOrder: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const wo = await manufacturingApi.updateWorkOrder(id, data);
      set((state) => ({
        workOrders: state.workOrders.map((w) => (w.id === id ? wo : w)),
        loading: false,
      }));
      return wo;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update work order', loading: false });
      return null;
    }
  },

  releaseWorkOrder: async (id) => {
    try {
      const wo = await manufacturingApi.releaseWorkOrder(id);
      set((state) => ({ workOrders: state.workOrders.map((w) => (w.id === id ? wo : w)) }));
      return wo;
    } catch (error: any) {
      set({ error: error.message || 'Failed to release work order' });
      return null;
    }
  },

  startWorkOrder: async (id) => {
    try {
      const wo = await manufacturingApi.startWorkOrder(id);
      set((state) => ({ workOrders: state.workOrders.map((w) => (w.id === id ? wo : w)) }));
      return wo;
    } catch (error: any) {
      set({ error: error.message || 'Failed to start work order' });
      return null;
    }
  },

  holdWorkOrder: async (id, reason) => {
    try {
      const wo = await manufacturingApi.holdWorkOrder(id, reason);
      set((state) => ({ workOrders: state.workOrders.map((w) => (w.id === id ? wo : w)) }));
      return wo;
    } catch (error: any) {
      set({ error: error.message || 'Failed to hold work order' });
      return null;
    }
  },

  resumeWorkOrder: async (id) => {
    try {
      const wo = await manufacturingApi.resumeWorkOrder(id);
      set((state) => ({ workOrders: state.workOrders.map((w) => (w.id === id ? wo : w)) }));
      return wo;
    } catch (error: any) {
      set({ error: error.message || 'Failed to resume work order' });
      return null;
    }
  },

  cancelWorkOrder: async (id, reason) => {
    try {
      const wo = await manufacturingApi.cancelWorkOrder(id, reason);
      set((state) => ({ workOrders: state.workOrders.map((w) => (w.id === id ? wo : w)) }));
      return wo;
    } catch (error: any) {
      set({ error: error.message || 'Failed to cancel work order' });
      return null;
    }
  },

  closeWorkOrder: async (id) => {
    try {
      const wo = await manufacturingApi.closeWorkOrder(id);
      set((state) => ({ workOrders: state.workOrders.map((w) => (w.id === id ? wo : w)) }));
      return wo;
    } catch (error: any) {
      set({ error: error.message || 'Failed to close work order' });
      return null;
    }
  },

  deleteWorkOrder: async (id) => {
    try {
      await manufacturingApi.deleteWorkOrder(id);
      set((state) => ({ workOrders: state.workOrders.filter((w) => w.id !== id) }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete work order' });
    }
  },

  // Work Order Material
  issueMaterial: async (workOrderId, lines) => {
    try {
      const issue = await manufacturingApi.issueMaterialToWorkOrder(workOrderId, lines);
      set((state) => ({ materialIssues: [issue, ...state.materialIssues] }));
      return issue;
    } catch (error: any) {
      set({ error: error.message || 'Failed to issue material' });
      return null;
    }
  },

  returnMaterial: async (workOrderId, lines) => {
    try {
      const issue = await manufacturingApi.returnMaterialFromWorkOrder(workOrderId, lines);
      set((state) => ({ materialIssues: [issue, ...state.materialIssues] }));
      return issue;
    } catch (error: any) {
      set({ error: error.message || 'Failed to return material' });
      return null;
    }
  },

  backflushWorkOrder: async (workOrderId) => {
    try {
      const issue = await manufacturingApi.backflushWorkOrder(workOrderId);
      set((state) => ({ materialIssues: [issue, ...state.materialIssues] }));
      return issue;
    } catch (error: any) {
      set({ error: error.message || 'Failed to backflush work order' });
      return null;
    }
  },

  // Work Order Operations
  startOperation: async (workOrderId, operationId, data) => {
    try {
      const op = await manufacturingApi.startOperation(workOrderId, operationId, data);
      set((state) => ({
        workOrderOperations: state.workOrderOperations.map((o) =>
          o.id === operationId ? op : o
        ),
      }));
      return op;
    } catch (error: any) {
      set({ error: error.message || 'Failed to start operation' });
      return null;
    }
  },

  completeOperation: async (workOrderId, operationId, data) => {
    try {
      const op = await manufacturingApi.completeOperation(workOrderId, operationId, data);
      set((state) => ({
        workOrderOperations: state.workOrderOperations.map((o) =>
          o.id === operationId ? op : o
        ),
      }));
      return op;
    } catch (error: any) {
      set({ error: error.message || 'Failed to complete operation' });
      return null;
    }
  },

  scrapOperation: async (workOrderId, operationId, quantity, reason) => {
    try {
      const op = await manufacturingApi.scrapOperation(workOrderId, operationId, quantity, reason);
      set((state) => ({
        workOrderOperations: state.workOrderOperations.map((o) =>
          o.id === operationId ? op : o
        ),
      }));
      return op;
    } catch (error: any) {
      set({ error: error.message || 'Failed to scrap operation' });
      return null;
    }
  },

  // Material Issues
  fetchMaterialIssues: async (companyId, filters) => {
    try {
      const data = await manufacturingApi.getMaterialIssues(companyId, filters);
      set({ materialIssues: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch material issues' });
    }
  },

  fetchMaterialIssue: async (id) => {
    try {
      return await manufacturingApi.getMaterialIssue(id);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch material issue' });
      return null;
    }
  },

  createMaterialIssue: async (data) => {
    try {
      const issue = await manufacturingApi.createMaterialIssue(data);
      set((state) => ({ materialIssues: [issue, ...state.materialIssues] }));
      return issue;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create material issue' });
      return null;
    }
  },

  postMaterialIssue: async (id) => {
    try {
      const issue = await manufacturingApi.postMaterialIssue(id);
      set((state) => ({
        materialIssues: state.materialIssues.map((i) => (i.id === id ? issue : i)),
      }));
      return issue;
    } catch (error: any) {
      set({ error: error.message || 'Failed to post material issue' });
      return null;
    }
  },

  printPickList: async (issueId) => {
    try {
      return await manufacturingApi.printPickList(issueId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to print pick list' });
      return null;
    }
  },

  // Labor & Machine Time
  fetchLaborEntries: async (companyId, filters) => {
    try {
      const data = await manufacturingApi.getLaborEntries(companyId, filters);
      set({ laborEntries: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch labor entries' });
    }
  },

  createLaborEntry: async (data) => {
    try {
      const entry = await manufacturingApi.createLaborEntry(data);
      set((state) => ({ laborEntries: [entry, ...state.laborEntries] }));
      return entry;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create labor entry' });
      return null;
    }
  },

  updateLaborEntry: async (id, data) => {
    try {
      const entry = await manufacturingApi.updateLaborEntry(id, data);
      set((state) => ({
        laborEntries: state.laborEntries.map((e) => (e.id === id ? entry : e)),
      }));
      return entry;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update labor entry' });
      return null;
    }
  },

  approveLaborEntry: async (id) => {
    try {
      const entry = await manufacturingApi.approveLaborEntry(id);
      set((state) => ({
        laborEntries: state.laborEntries.map((e) => (e.id === id ? entry : e)),
      }));
      return entry;
    } catch (error: any) {
      set({ error: error.message || 'Failed to approve labor entry' });
      return null;
    }
  },

  fetchMachineTimeEntries: async (companyId, filters) => {
    try {
      const data = await manufacturingApi.getMachineTimeEntries(companyId, filters);
      set({ machineTimeEntries: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch machine time entries' });
    }
  },

  createMachineTimeEntry: async (data) => {
    try {
      const entry = await manufacturingApi.createMachineTimeEntry(data);
      set((state) => ({ machineTimeEntries: [entry, ...state.machineTimeEntries] }));
      return entry;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create machine time entry' });
      return null;
    }
  },

  updateMachineTimeEntry: async (id, data) => {
    try {
      const entry = await manufacturingApi.updateMachineTimeEntry(id, data);
      set((state) => ({
        machineTimeEntries: state.machineTimeEntries.map((e) => (e.id === id ? entry : e)),
      }));
      return entry;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update machine time entry' });
      return null;
    }
  },

  approveMachineTimeEntry: async (id) => {
    try {
      const entry = await manufacturingApi.approveMachineTimeEntry(id);
      set((state) => ({
        machineTimeEntries: state.machineTimeEntries.map((e) => (e.id === id ? entry : e)),
      }));
      return entry;
    } catch (error: any) {
      set({ error: error.message || 'Failed to approve machine time entry' });
      return null;
    }
  },

  // Quality Control
  fetchQcInspections: async (companyId, filters) => {
    try {
      const data = await manufacturingApi.getQcInspections(companyId, filters);
      set({ qcInspections: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch QC inspections' });
    }
  },

  fetchQcInspection: async (id) => {
    try {
      return await manufacturingApi.getQcInspection(id);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch QC inspection' });
      return null;
    }
  },

  createQcInspection: async (data) => {
    try {
      const inspection = await manufacturingApi.createQcInspection(data);
      set((state) => ({ qcInspections: [inspection, ...state.qcInspections] }));
      return inspection;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create QC inspection' });
      return null;
    }
  },

  updateQcInspection: async (id, data) => {
    try {
      const inspection = await manufacturingApi.updateQcInspection(id, data);
      set((state) => ({
        qcInspections: state.qcInspections.map((i) => (i.id === id ? inspection : i)),
      }));
      return inspection;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update QC inspection' });
      return null;
    }
  },

  performQcInspection: async (id, data) => {
    try {
      const inspection = await manufacturingApi.performQcInspection(id, data);
      set((state) => ({
        qcInspections: state.qcInspections.map((i) => (i.id === id ? inspection : i)),
      }));
      return inspection;
    } catch (error: any) {
      set({ error: error.message || 'Failed to perform QC inspection' });
      return null;
    }
  },

  fetchQcSpecifications: async (productId) => {
    try {
      return await manufacturingApi.getQcSpecifications(productId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch QC specifications' });
      return [];
    }
  },

  createQcSpecification: async (data) => {
    try {
      return await manufacturingApi.createQcSpecification(data);
    } catch (error: any) {
      set({ error: error.message || 'Failed to create QC specification' });
      return null;
    }
  },

  // Work Order Completion
  fetchCompletions: async (companyId, filters) => {
    try {
      const data = await manufacturingApi.getCompletions(companyId, filters);
      set({ completions: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch completions' });
    }
  },

  fetchCompletion: async (id) => {
    try {
      return await manufacturingApi.getCompletion(id);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch completion' });
      return null;
    }
  },

  createCompletion: async (data) => {
    try {
      const completion = await manufacturingApi.createCompletion(data);
      set((state) => ({ completions: [completion, ...state.completions] }));
      return completion;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create completion' });
      return null;
    }
  },

  postCompletion: async (id) => {
    try {
      const completion = await manufacturingApi.postCompletion(id);
      set((state) => ({
        completions: state.completions.map((c) => (c.id === id ? completion : c)),
      }));
      return completion;
    } catch (error: any) {
      set({ error: error.message || 'Failed to post completion' });
      return null;
    }
  },

  reverseCompletion: async (id, reason) => {
    try {
      const completion = await manufacturingApi.reverseCompletion(id, reason);
      set((state) => ({
        completions: state.completions.map((c) => (c.id === id ? completion : c)),
      }));
      return completion;
    } catch (error: any) {
      set({ error: error.message || 'Failed to reverse completion' });
      return null;
    }
  },

  // Job Costing
  fetchJobCosting: async (workOrderId) => {
    try {
      const data = await manufacturingApi.getJobCosting(workOrderId);
      set({ jobCosting: data });
      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch job costing' });
      return null;
    }
  },

  fetchJobCostingReport: async (companyId, filters) => {
    try {
      const data = await manufacturingApi.getJobCostingReport(companyId, filters);
      set({ jobCostingReport: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch job costing report' });
    }
  },

  fetchWipValuation: async (companyId, date) => {
    try {
      return await manufacturingApi.getWipValuation(companyId, date);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch WIP valuation' });
      return null;
    }
  },

  fetchVarianceAnalysis: async (companyId, filters) => {
    try {
      return await manufacturingApi.getVarianceAnalysis(companyId, filters);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch variance analysis' });
      return [];
    }
  },

  // Production Scheduling
  fetchProductionSchedule: async (companyId, dateFrom, dateTo) => {
    try {
      const data = await manufacturingApi.getProductionSchedule(companyId, dateFrom, dateTo);
      set({ productionSchedule: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch production schedule' });
    }
  },

  updateProductionSchedule: async (schedule) => {
    try {
      const data = await manufacturingApi.updateProductionSchedule(schedule);
      set({ productionSchedule: data });
      return data;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update production schedule' });
      return null;
    }
  },

  dispatchSchedule: async (id) => {
    try {
      const schedule = await manufacturingApi.dispatchSchedule(id);
      set((state) => ({
        productionSchedule: state.productionSchedule.map((s) => (s.id === id ? schedule : s)),
      }));
      return schedule;
    } catch (error: any) {
      set({ error: error.message || 'Failed to dispatch schedule' });
      return null;
    }
  },

  fetchFiniteSchedule: async (companyId, workCenterIds, horizonDays) => {
    try {
      return await manufacturingApi.getFiniteSchedule(companyId, workCenterIds, horizonDays);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch finite schedule' });
      return null;
    }
  },

  // Subcontracting
  fetchSubcontractOrders: async (companyId, filters) => {
    try {
      const data = await manufacturingApi.getSubcontractOrders(companyId, filters);
      set({ subcontractOrders: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch subcontract orders' });
    }
  },

  createSubcontractOrder: async (data) => {
    try {
      const order = await manufacturingApi.createSubcontractOrder(data);
      set((state) => ({ subcontractOrders: [order, ...state.subcontractOrders] }));
      return order;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create subcontract order' });
      return null;
    }
  },

  receiveSubcontractOrder: async (id, lines) => {
    try {
      const order = await manufacturingApi.receiveSubcontractOrder(id, lines);
      set((state) => ({
        subcontractOrders: state.subcontractOrders.map((o) => (o.id === id ? order : o)),
      }));
      return order;
    } catch (error: any) {
      set({ error: error.message || 'Failed to receive subcontract order' });
      return null;
    }
  },

  // KPIs & Analytics
  fetchManufacturingKpis: async (companyId, dateFrom, dateTo) => {
    try {
      const data = await manufacturingApi.getManufacturingKpis(companyId, dateFrom, dateTo);
      set({ kpis: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch manufacturing KPIs' });
    }
  },

  fetchShopFloorStatus: async (companyId) => {
    try {
      const data = await manufacturingApi.getShopFloorStatus(companyId);
      set({ shopFloorStatus: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch shop floor status' });
    }
  },

  fetchCapacityPlan: async (companyId, dateFrom, dateTo) => {
    try {
      return await manufacturingApi.getCapacityPlan(companyId, dateFrom, dateTo);
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch capacity plan' });
      return null;
    }
  },

  // Products
  fetchManufacturingProducts: async (companyId) => {
    try {
      const data = await manufacturingApi.getManufacturingProducts(companyId);
      set({ manufacturingProducts: data });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch manufacturing products' });
    }
  },

  // Fetch all
  fetchAllManufacturing: async (companyId) => {
    const state = get();
    await Promise.all([
      state.fetchBoms(companyId),
      state.fetchRoutings(companyId),
      state.fetchWorkOrders(companyId),
      state.fetchWorkCenters(companyId),
      state.fetchManufacturingProducts(companyId),
      state.fetchManufacturingKpis(companyId),
      state.fetchShopFloorStatus(companyId),
    ]);
  },
}));

export default useManufacturingStore;