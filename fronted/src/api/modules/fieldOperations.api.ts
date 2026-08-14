import { apiClient } from '../client';

// ── Types ────────────────────────────────────────────────────────────────────
export type SurveyStatus = 'Draft' | 'Active' | 'Closed' | 'Archived';
export type FieldVisitStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
export type InspectionStatus = 'Scheduled' | 'InProgress' | 'Passed' | 'Failed' | 'Cancelled';
export type FieldWorkOrderStatus = 'Open' | 'Assigned' | 'InProgress' | 'Completed' | 'Cancelled';

export interface Survey {
  id: string;
  surveyNumber: string;
  title: string;
  description: string;
  category: string;
  status: SurveyStatus;
  startDate: string;
  endDate?: string;
  region: string;
  assignedTo?: string;
  targetResponses: number;
  responseCount: number;
  companyId?: string;
  createdAt: string;
}

export interface FieldVisit {
  id: string;
  visitNumber: string;
  visitType: string;
  customerId?: string;
  customerName: string;
  contactName: string;
  purpose: string;
  scheduledDate: string;
  startTime?: string;
  durationHours: number;
  status: FieldVisitStatus;
  location: string;
  assignedTo?: string;
  findings: string;
  companyId?: string;
  createdAt: string;
}

export interface Inspection {
  id: string;
  inspectionNumber: string;
  inspectionType: string;
  location: string;
  scheduledDate: string;
  inspectorId?: string;
  status: InspectionStatus;
  score: number;
  findings: string;
  reference?: string;
  companyId?: string;
  createdAt: string;
}

export interface FieldWorkOrder {
  id: string;
  workOrderNumber: string;
  workType: string;
  customerId?: string;
  customerName: string;
  description: string;
  priority: string;
  status: FieldWorkOrderStatus;
  assignedTo?: string;
  scheduledDate: string;
  completedDate?: string;
  laborHours: number;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  location: string;
  companyId?: string;
  createdAt: string;
}

export interface FieldExpense {
  id: string;
  expenseNumber: string;
  workOrderId?: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  reimbursed: boolean;
  companyId?: string;
  createdAt: string;
}

export interface FieldOperationsDashboard {
  surveys: number;
  activeSurveys: number;
  totalResponses: number;
  visits: number;
  upcomingVisits: number;
  completedVisits: number;
  workOrders: number;
  openOrders: number;
  completedOrders: number;
  totalOrderCost: number;
  inspections: number;
  pendingInspections: number;
  failedInspections: number;
  expenses: number;
  totalExpenses: number;
}

export const fieldOperationsApi = {
  getDashboard: async (): Promise<FieldOperationsDashboard> => {
    return apiClient<FieldOperationsDashboard>('/field-operations/dashboard');
  },

  getSurveys: async (params?: { status?: SurveyStatus; category?: string; companyId?: string }): Promise<Survey[]> => {
    return apiClient<Survey[]>('/field-operations/surveys', { params });
  },
  createSurvey: async (data: any): Promise<Survey> => {
    return apiClient<Survey>('/field-operations/surveys', { method: 'POST', body: data });
  },
  setSurveyStatus: async (id: string, status: SurveyStatus): Promise<Survey> => {
    return apiClient<Survey>(`/field-operations/surveys/${id}/status`, { method: 'POST', body: { status } });
  },

  getVisits: async (params?: { status?: FieldVisitStatus; visitType?: string; companyId?: string }): Promise<FieldVisit[]> => {
    return apiClient<FieldVisit[]>('/field-operations/visits', { params });
  },
  createVisit: async (data: any): Promise<FieldVisit> => {
    return apiClient<FieldVisit>('/field-operations/visits', { method: 'POST', body: data });
  },
  setVisitStatus: async (id: string, status: FieldVisitStatus): Promise<FieldVisit> => {
    return apiClient<FieldVisit>(`/field-operations/visits/${id}/status`, { method: 'POST', body: { status } });
  },

  getInspections: async (params?: { status?: InspectionStatus; type?: string; companyId?: string }): Promise<Inspection[]> => {
    return apiClient<Inspection[]>('/field-operations/inspections', { params });
  },
  createInspection: async (data: any): Promise<Inspection> => {
    return apiClient<Inspection>('/field-operations/inspections', { method: 'POST', body: data });
  },
  setInspectionStatus: async (id: string, status: InspectionStatus): Promise<Inspection> => {
    return apiClient<Inspection>(`/field-operations/inspections/${id}/status`, { method: 'POST', body: { status } });
  },

  getWorkOrders: async (params?: { status?: FieldWorkOrderStatus; priority?: string; companyId?: string }): Promise<FieldWorkOrder[]> => {
    return apiClient<FieldWorkOrder[]>('/field-operations/work-orders', { params });
  },
  createWorkOrder: async (data: any): Promise<FieldWorkOrder> => {
    return apiClient<FieldWorkOrder>('/field-operations/work-orders', { method: 'POST', body: data });
  },
  setWorkOrderStatus: async (id: string, status: FieldWorkOrderStatus): Promise<FieldWorkOrder> => {
    return apiClient<FieldWorkOrder>(`/field-operations/work-orders/${id}/status`, { method: 'POST', body: { status } });
  },

  getExpenses: async (params?: { workOrderId?: string; category?: string; companyId?: string }): Promise<FieldExpense[]> => {
    return apiClient<FieldExpense[]>('/field-operations/expenses', { params });
  },
  createExpense: async (data: any): Promise<FieldExpense> => {
    return apiClient<FieldExpense>('/field-operations/expenses', { method: 'POST', body: data });
  },
};
