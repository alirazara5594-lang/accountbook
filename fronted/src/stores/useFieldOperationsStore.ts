import { create } from 'zustand';
import { fieldOperationsApi, type Survey, type FieldVisit, type Inspection, type FieldWorkOrder, type FieldExpense, type FieldOperationsDashboard, type SurveyStatus, type FieldVisitStatus, type InspectionStatus, type FieldWorkOrderStatus } from '../api/modules/fieldOperations.api';

interface FieldOperationsState {
  dashboard: FieldOperationsDashboard | null;
  surveys: Survey[];
  visits: FieldVisit[];
  inspections: Inspection[];
  workOrders: FieldWorkOrder[];
  expenses: FieldExpense[];
  loading: boolean;
  error: string | null;
  activeTab: string;

  setActiveTab: (tab: string) => void;
  fetchAll: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchSurveys: (params?: any) => Promise<void>;
  createSurvey: (data: any) => Promise<Survey | null>;
  setSurveyStatus: (id: string, status: SurveyStatus) => Promise<boolean>;
  fetchVisits: (params?: any) => Promise<void>;
  createVisit: (data: any) => Promise<FieldVisit | null>;
  setVisitStatus: (id: string, status: FieldVisitStatus) => Promise<boolean>;
  fetchInspections: (params?: any) => Promise<void>;
  createInspection: (data: any) => Promise<Inspection | null>;
  setInspectionStatus: (id: string, status: InspectionStatus) => Promise<boolean>;
  fetchWorkOrders: (params?: any) => Promise<void>;
  createWorkOrder: (data: any) => Promise<FieldWorkOrder | null>;
  setWorkOrderStatus: (id: string, status: FieldWorkOrderStatus) => Promise<boolean>;
  fetchExpenses: (params?: any) => Promise<void>;
  createExpense: (data: any) => Promise<FieldExpense | null>;
}

export const useFieldOperationsStore = create<FieldOperationsState>((set, _get) => ({
  dashboard: null,
  surveys: [],
  visits: [],
  inspections: [],
  workOrders: [],
  expenses: [],
  loading: false,
  error: null,
  activeTab: 'overview',

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [d, s, v, i, w, e] = await Promise.allSettled([
        fieldOperationsApi.getDashboard(),
        fieldOperationsApi.getSurveys(),
        fieldOperationsApi.getVisits(),
        fieldOperationsApi.getInspections(),
        fieldOperationsApi.getWorkOrders(),
        fieldOperationsApi.getExpenses(),
      ]);
      set({
        dashboard: d.status === 'fulfilled' ? d.value : null,
        surveys: s.status === 'fulfilled' ? s.value : [],
        visits: v.status === 'fulfilled' ? v.value : [],
        inspections: i.status === 'fulfilled' ? i.value : [],
        workOrders: w.status === 'fulfilled' ? w.value : [],
        expenses: e.status === 'fulfilled' ? e.value : [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchDashboard: async () => {
    try {
      const data = await fieldOperationsApi.getDashboard();
      set({ dashboard: data });
    } catch {}
  },

  fetchSurveys: async (params) => {
    try {
      const data = await fieldOperationsApi.getSurveys(params);
      set({ surveys: data });
    } catch {}
  },

  createSurvey: async (data) => {
    try {
      const survey = await fieldOperationsApi.createSurvey(data);
      set(s => ({ surveys: [survey, ...s.surveys] }));
      return survey;
    } catch { return null; }
  },

  setSurveyStatus: async (id, status) => {
    try {
      const survey = await fieldOperationsApi.setSurveyStatus(id, status);
      set(s => ({ surveys: s.surveys.map(x => x.id === id ? survey : x) }));
      return true;
    } catch { return false; }
  },

  fetchVisits: async (params) => {
    try {
      const data = await fieldOperationsApi.getVisits(params);
      set({ visits: data });
    } catch {}
  },

  createVisit: async (data) => {
    try {
      const visit = await fieldOperationsApi.createVisit(data);
      set(s => ({ visits: [visit, ...s.visits] }));
      return visit;
    } catch { return null; }
  },

  setVisitStatus: async (id, status) => {
    try {
      const visit = await fieldOperationsApi.setVisitStatus(id, status);
      set(s => ({ visits: s.visits.map(x => x.id === id ? visit : x) }));
      return true;
    } catch { return false; }
  },

  fetchInspections: async (params) => {
    try {
      const data = await fieldOperationsApi.getInspections(params);
      set({ inspections: data });
    } catch {}
  },

  createInspection: async (data) => {
    try {
      const inspection = await fieldOperationsApi.createInspection(data);
      set(s => ({ inspections: [inspection, ...s.inspections] }));
      return inspection;
    } catch { return null; }
  },

  setInspectionStatus: async (id, status) => {
    try {
      const inspection = await fieldOperationsApi.setInspectionStatus(id, status);
      set(s => ({ inspections: s.inspections.map(x => x.id === id ? inspection : x) }));
      return true;
    } catch { return false; }
  },

  fetchWorkOrders: async (params) => {
    try {
      const data = await fieldOperationsApi.getWorkOrders(params);
      set({ workOrders: data });
    } catch {}
  },

  createWorkOrder: async (data) => {
    try {
      const order = await fieldOperationsApi.createWorkOrder(data);
      set(s => ({ workOrders: [order, ...s.workOrders] }));
      return order;
    } catch { return null; }
  },

  setWorkOrderStatus: async (id, status) => {
    try {
      const order = await fieldOperationsApi.setWorkOrderStatus(id, status);
      set(s => ({ workOrders: s.workOrders.map(x => x.id === id ? order : x) }));
      return true;
    } catch { return false; }
  },

  fetchExpenses: async (params) => {
    try {
      const data = await fieldOperationsApi.getExpenses(params);
      set({ expenses: data });
    } catch {}
  },

  createExpense: async (data) => {
    try {
      const expense = await fieldOperationsApi.createExpense(data);
      set(s => ({ expenses: [expense, ...s.expenses] }));
      return expense;
    } catch { return null; }
  },
}));