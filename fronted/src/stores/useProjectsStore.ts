import { create } from 'zustand';
import { projectsApi, type Project, type ProjectPhase, type ProjectTask, type TimesheetEntry, type ProjectExpense, type ProjectStatus, type ProjectTaskStatus } from '../api/modules/projects.api';

interface ProjectsState {
  projects: Project[];
  phases: ProjectPhase[];
  tasks: ProjectTask[];
  timesheets: TimesheetEntry[];
  expenses: ProjectExpense[];
  loading: boolean;
  error: string | null;
  activeTab: string;
  selectedProjectId: string | null;

  setActiveTab: (tab: string) => void;
  selectProject: (id: string | null) => void;
  fetchAll: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (data: any) => Promise<Project | null>;
  updateProject: (id: string, data: any) => Promise<Project | null>;
  setProjectStatus: (id: string, status: ProjectStatus) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  fetchPhases: (projectId?: string) => Promise<void>;
  createPhase: (data: any) => Promise<ProjectPhase | null>;
  fetchTasks: (projectId?: string) => Promise<void>;
  createTask: (data: any) => Promise<ProjectTask | null>;
  updateTask: (id: string, data: any) => Promise<ProjectTask | null>;
  setTaskStatus: (id: string, status: ProjectTaskStatus) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  fetchTimesheets: (projectId?: string) => Promise<void>;
  logTimesheet: (data: any) => Promise<TimesheetEntry | null>;
  approveTimesheet: (id: string) => Promise<boolean>;
  deleteTimesheet: (id: string) => Promise<boolean>;
  fetchExpenses: (projectId?: string) => Promise<void>;
  createExpense: (data: any) => Promise<ProjectExpense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
}

export const useProjectsStore = create<ProjectsState>((set, _get) => ({
  projects: [],
  phases: [],
  tasks: [],
  timesheets: [],
  expenses: [],
  loading: false,
  error: null,
  activeTab: 'overview',
  selectedProjectId: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  selectProject: (id) => set({ selectedProjectId: id }),

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [p, ph, t, ts, e] = await Promise.allSettled([
        projectsApi.getProjects(),
        projectsApi.getPhases(),
        projectsApi.getTasks(),
        projectsApi.getTimesheets(),
        projectsApi.getExpenses(),
      ]);
      set({
        projects: p.status === 'fulfilled' ? p.value : [],
        phases: ph.status === 'fulfilled' ? ph.value : [],
        tasks: t.status === 'fulfilled' ? t.value : [],
        timesheets: ts.status === 'fulfilled' ? ts.value : [],
        expenses: e.status === 'fulfilled' ? e.value : [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchProjects: async () => {
    try {
      const data = await projectsApi.getProjects();
      set({ projects: data });
    } catch {}
  },

  fetchProject: async (id) => {
    try {
      return await projectsApi.getProject(id);
    } catch { return null; }
  },

  createProject: async (data) => {
    try {
      const project = await projectsApi.createProject(data);
      set(s => ({ projects: [project, ...s.projects] }));
      return project;
    } catch { return null; }
  },

  updateProject: async (id, data) => {
    try {
      const project = await projectsApi.updateProject(id, data);
      set(s => ({ projects: s.projects.map(p => p.id === id ? project : p) }));
      return project;
    } catch { return null; }
  },

  setProjectStatus: async (id, status) => {
    try {
      const project = await projectsApi.setProjectStatus(id, status);
      set(s => ({ projects: s.projects.map(p => p.id === id ? project : p) }));
      return true;
    } catch { return false; }
  },

  deleteProject: async (id) => {
    try {
      await projectsApi.deleteProject(id);
      set(s => ({ projects: s.projects.filter(p => p.id !== id) }));
      return true;
    } catch { return false; }
  },

  fetchPhases: async (projectId) => {
    try {
      const data = await projectsApi.getPhases(projectId);
      set({ phases: data });
    } catch {}
  },

  createPhase: async (data) => {
    try {
      const phase = await projectsApi.createPhase(data);
      set(s => ({ phases: [...s.phases, phase] }));
      return phase;
    } catch { return null; }
  },

  fetchTasks: async (projectId) => {
    try {
      const data = await projectsApi.getTasks(projectId ? { projectId } : undefined);
      set({ tasks: data });
    } catch {}
  },

  createTask: async (data) => {
    try {
      const task = await projectsApi.createTask(data);
      set(s => ({ tasks: [task, ...s.tasks] }));
      return task;
    } catch { return null; }
  },

  updateTask: async (id, data) => {
    try {
      const task = await projectsApi.updateTask(id, data);
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? task : t) }));
      return task;
    } catch { return null; }
  },

  setTaskStatus: async (id, status) => {
    try {
      const task = await projectsApi.setTaskStatus(id, status);
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? task : t) }));
      return true;
    } catch { return false; }
  },

  deleteTask: async (id) => {
    try {
      await projectsApi.deleteTask(id);
      set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }));
      return true;
    } catch { return false; }
  },

  fetchTimesheets: async (projectId) => {
    try {
      const data = await projectsApi.getTimesheets(projectId ? { projectId } : undefined);
      set({ timesheets: data });
    } catch {}
  },

  logTimesheet: async (data) => {
    try {
      const entry = await projectsApi.logTimesheet(data);
      set(s => ({ timesheets: [entry, ...s.timesheets] }));
      return entry;
    } catch { return null; }
  },

  approveTimesheet: async (id) => {
    try {
      const entry = await projectsApi.approveTimesheet(id);
      set(s => ({ timesheets: s.timesheets.map(t => t.id === id ? entry : t) }));
      return true;
    } catch { return false; }
  },

  deleteTimesheet: async (id) => {
    try {
      await projectsApi.deleteTimesheet(id);
      set(s => ({ timesheets: s.timesheets.filter(t => t.id !== id) }));
      return true;
    } catch { return false; }
  },

  fetchExpenses: async (projectId) => {
    try {
      const data = await projectsApi.getExpenses(projectId ? { projectId } : undefined);
      set({ expenses: data });
    } catch {}
  },

  createExpense: async (data) => {
    try {
      const expense = await projectsApi.createExpense(data);
      set(s => ({ expenses: [expense, ...s.expenses] }));
      return expense;
    } catch { return null; }
  },

  deleteExpense: async (id) => {
    try {
      await projectsApi.deleteExpense(id);
      set(s => ({ expenses: s.expenses.filter(e => e.id !== id) }));
      return true;
    } catch { return false; }
  },
}));