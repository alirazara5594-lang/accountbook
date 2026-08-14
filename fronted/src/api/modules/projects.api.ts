import { apiClient } from '../client';

// ── Types ────────────────────────────────────────────────────────────────────
export type ProjectStatus = 'Planning' | 'Active' | 'OnHold' | 'Completed' | 'Cancelled';
export type ProjectTaskStatus = 'NotStarted' | 'InProgress' | 'Blocked' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  managerId?: string;
  departmentId?: string;
  customerId?: string;
  customerName: string;
  budget: number;
  currency: string;
  progressPercent: number;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  orderIndex: number;
  status: ProjectTaskStatus;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  phaseId?: string;
  title: string;
  description: string;
  assigneeId?: string;
  status: ProjectTaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate?: string;
  estimatedHours: number;
  actualHours: number;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetEntry {
  id: string;
  projectId: string;
  taskId?: string;
  employeeId: string;
  date: string;
  hours: number;
  description: string;
  billable: boolean;
  billableRate: number;
  currency: string;
  approved: boolean;
  approvedBy?: string;
  companyId?: string;
  createdAt: string;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  employeeId?: string;
  category: string;
  description: string;
  vendorName?: string;
  amount: number;
  currency: string;
  expenseDate: string;
  billable: boolean;
  reimbursed: boolean;
  companyId?: string;
  createdAt: string;
}

export interface ProjectDashboard {
  project: Project;
  tasks: ProjectTask[];
  timesheets: TimesheetEntry[];
  expenses: ProjectExpense[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalHours: number;
  billableHours: number;
  laborCost: number;
  expenseTotal: number;
  totalCost: number;
  budget: number;
  budgetUtilization: number;
  remainingBudget: number;
  profitability: number;
}

export const projectsApi = {
  // ── Projects ───────────────────────────────────────────────────────────────
  getProjects: async (params?: { status?: ProjectStatus; companyId?: string }): Promise<Project[]> => {
    return apiClient<Project[]>('/projects', { params });
  },
  getProject: async (id: string): Promise<Project> => {
    return apiClient<Project>(`/projects/${id}`);
  },
  createProject: async (data: any): Promise<Project> => {
    return apiClient<Project>('/projects', { method: 'POST', body: data });
  },
  updateProject: async (id: string, data: any): Promise<Project> => {
    return apiClient<Project>(`/projects/${id}`, { method: 'PUT', body: data });
  },
  setProjectStatus: async (id: string, status: ProjectStatus): Promise<Project> => {
    return apiClient<Project>(`/projects/${id}/status`, { method: 'POST', body: { status } });
  },
  deleteProject: async (id: string): Promise<void> => {
    return apiClient(`/projects/${id}`, { method: 'DELETE' });
  },
  getProjectDashboard: async (id: string): Promise<ProjectDashboard> => {
    return apiClient<ProjectDashboard>(`/projects/${id}/dashboard`);
  },

  // ── Phases ─────────────────────────────────────────────────────────────────
  getPhases: async (projectId?: string): Promise<ProjectPhase[]> => {
    return apiClient<ProjectPhase[]>('/projects/phases', { params: { projectId } });
  },
  createPhase: async (data: any): Promise<ProjectPhase> => {
    return apiClient<ProjectPhase>('/projects/phases', { method: 'POST', body: data });
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  getTasks: async (params?: { projectId?: string; assigneeId?: string; status?: ProjectTaskStatus }): Promise<ProjectTask[]> => {
    return apiClient<ProjectTask[]>('/projects/tasks', { params });
  },
  createTask: async (data: any): Promise<ProjectTask> => {
    return apiClient<ProjectTask>('/projects/tasks', { method: 'POST', body: data });
  },
  updateTask: async (id: string, data: any): Promise<ProjectTask> => {
    return apiClient<ProjectTask>(`/projects/tasks/${id}`, { method: 'PUT', body: data });
  },
  setTaskStatus: async (id: string, status: ProjectTaskStatus): Promise<ProjectTask> => {
    return apiClient<ProjectTask>(`/projects/tasks/${id}/status`, { method: 'POST', body: { status } });
  },
  deleteTask: async (id: string): Promise<void> => {
    return apiClient(`/projects/tasks/${id}`, { method: 'DELETE' });
  },

  // ── Timesheets ─────────────────────────────────────────────────────────────
  getTimesheets: async (params?: { projectId?: string; employeeId?: string; approved?: boolean }): Promise<TimesheetEntry[]> => {
    return apiClient<TimesheetEntry[]>('/projects/timesheets', { params });
  },
  logTimesheet: async (data: any): Promise<TimesheetEntry> => {
    return apiClient<TimesheetEntry>('/projects/timesheets', { method: 'POST', body: data });
  },
  approveTimesheet: async (id: string): Promise<TimesheetEntry> => {
    return apiClient<TimesheetEntry>(`/projects/timesheets/${id}/approve`, { method: 'POST' });
  },
  deleteTimesheet: async (id: string): Promise<void> => {
    return apiClient(`/projects/timesheets/${id}`, { method: 'DELETE' });
  },

  // ── Expenses ───────────────────────────────────────────────────────────────
  getExpenses: async (params?: { projectId?: string; category?: string }): Promise<ProjectExpense[]> => {
    return apiClient<ProjectExpense[]>('/projects/expenses', { params });
  },
  createExpense: async (data: any): Promise<ProjectExpense> => {
    return apiClient<ProjectExpense>('/projects/expenses', { method: 'POST', body: data });
  },
  deleteExpense: async (id: string): Promise<void> => {
    return apiClient(`/projects/expenses/${id}`, { method: 'DELETE' });
  },
};
