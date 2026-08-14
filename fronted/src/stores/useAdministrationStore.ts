import { create } from 'zustand';
import { administrationApi, type AdministrationDashboard, type AdminUser, type UserRole, type Branch, type ApprovalWorkflow, type NumberSeries, type Currency, type UserStatus } from '../api/modules/administration.api';

interface AdministrationState {
  dashboard: AdministrationDashboard | null;
  users: AdminUser[];
  roles: UserRole[];
  branches: Branch[];
  workflows: ApprovalWorkflow[];
  numberSeries: NumberSeries[];
  currencies: Currency[];
  loading: boolean;
  error: string | null;
  activeTab: string;

  setActiveTab: (tab: string) => void;
  fetchAll: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchUsers: (params?: any) => Promise<void>;
  createUser: (data: any) => Promise<AdminUser | null>;
  updateUser: (id: string, data: any) => Promise<AdminUser | null>;
  setUserStatus: (id: string, status: UserStatus) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  fetchRoles: (params?: any) => Promise<void>;
  createRole: (data: any) => Promise<UserRole | null>;
  updateRole: (id: string, data: any) => Promise<UserRole | null>;
  deleteRole: (id: string) => Promise<boolean>;
  fetchBranches: (params?: any) => Promise<void>;
  createBranch: (data: any) => Promise<Branch | null>;
  setBranchStatus: (id: string, active: boolean) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;
  fetchWorkflows: (params?: any) => Promise<void>;
  createWorkflow: (data: any) => Promise<ApprovalWorkflow | null>;
  setWorkflowStatus: (id: string, active: boolean) => Promise<boolean>;
  deleteWorkflow: (id: string) => Promise<boolean>;
  fetchNumberSeries: (params?: any) => Promise<void>;
  createNumberSeries: (data: any) => Promise<NumberSeries | null>;
  setNumberSeriesStatus: (id: string, active: boolean) => Promise<boolean>;
  deleteNumberSeries: (id: string) => Promise<boolean>;
  fetchCurrencies: (params?: any) => Promise<void>;
  createCurrency: (data: any) => Promise<Currency | null>;
  setCurrencyStatus: (id: string, active: boolean) => Promise<boolean>;
  deleteCurrency: (id: string) => Promise<boolean>;
}

export const useAdministrationStore = create<AdministrationState>((set, _get) => ({
  dashboard: null,
  users: [],
  roles: [],
  branches: [],
  workflows: [],
  numberSeries: [],
  currencies: [],
  loading: false,
  error: null,
  activeTab: 'overview',

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [d, u, r, b, w, n, c] = await Promise.allSettled([
        administrationApi.getDashboard(),
        administrationApi.getUsers(),
        administrationApi.getRoles(),
        administrationApi.getBranches(),
        administrationApi.getWorkflows(),
        administrationApi.getNumberSeries(),
        administrationApi.getCurrencies(),
      ]);
      set({
        dashboard: d.status === 'fulfilled' ? d.value : null,
        users: u.status === 'fulfilled' ? u.value : [],
        roles: r.status === 'fulfilled' ? r.value : [],
        branches: b.status === 'fulfilled' ? b.value : [],
        workflows: w.status === 'fulfilled' ? w.value : [],
        numberSeries: n.status === 'fulfilled' ? n.value : [],
        currencies: c.status === 'fulfilled' ? c.value : [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchDashboard: async () => {
    try {
      const data = await administrationApi.getDashboard();
      set({ dashboard: data });
    } catch {}
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  fetchUsers: async (params) => {
    try {
      const data = await administrationApi.getUsers(params);
      set({ users: data });
    } catch {}
  },

  createUser: async (data) => {
    try {
      const user = await administrationApi.createUser(data);
      set(s => ({ users: [user, ...s.users] }));
      return user;
    } catch { return null; }
  },

  updateUser: async (id, data) => {
    try {
      const user = await administrationApi.updateUser(id, data);
      set(s => ({ users: s.users.map(u => u.id === id ? user : u) }));
      return user;
    } catch { return null; }
  },

  setUserStatus: async (id, status) => {
    try {
      const user = await administrationApi.setUserStatus(id, status);
      set(s => ({ users: s.users.map(u => u.id === id ? user : u) }));
      return true;
    } catch { return false; }
  },

  deleteUser: async (id) => {
    try {
      await administrationApi.deleteUser(id);
      set(s => ({ users: s.users.filter(u => u.id !== id) }));
      return true;
    } catch { return false; }
  },

  // ── Roles ──────────────────────────────────────────────────────────────────
  fetchRoles: async (params) => {
    try {
      const data = await administrationApi.getRoles(params);
      set({ roles: data });
    } catch {}
  },

  createRole: async (data) => {
    try {
      const role = await administrationApi.createRole(data);
      set(s => ({ roles: [...s.roles, role] }));
      return role;
    } catch { return null; }
  },

  updateRole: async (id, data) => {
    try {
      const role = await administrationApi.updateRole(id, data);
      set(s => ({ roles: s.roles.map(r => r.id === id ? role : r) }));
      return role;
    } catch { return null; }
  },

  deleteRole: async (id) => {
    try {
      await administrationApi.deleteRole(id);
      set(s => ({ roles: s.roles.filter(r => r.id !== id) }));
      return true;
    } catch { return false; }
  },

  // ── Branches ───────────────────────────────────────────────────────────────
  fetchBranches: async (params) => {
    try {
      const data = await administrationApi.getBranches(params);
      set({ branches: data });
    } catch {}
  },

  createBranch: async (data) => {
    try {
      const branch = await administrationApi.createBranch(data);
      set(s => ({ branches: [...s.branches, branch] }));
      return branch;
    } catch { return null; }
  },

  setBranchStatus: async (id, active) => {
    try {
      const branch = await administrationApi.setBranchStatus(id, active);
      set(s => ({ branches: s.branches.map(b => b.id === id ? branch : b) }));
      return true;
    } catch { return false; }
  },

  deleteBranch: async (id) => {
    try {
      await administrationApi.deleteBranch(id);
      set(s => ({ branches: s.branches.filter(b => b.id !== id) }));
      return true;
    } catch { return false; }
  },

  // ── Approval Workflows ─────────────────────────────────────────────────────
  fetchWorkflows: async (params) => {
    try {
      const data = await administrationApi.getWorkflows(params);
      set({ workflows: data });
    } catch {}
  },

  createWorkflow: async (data) => {
    try {
      const workflow = await administrationApi.createWorkflow(data);
      set(s => ({ workflows: [...s.workflows, workflow] }));
      return workflow;
    } catch { return null; }
  },

  setWorkflowStatus: async (id, active) => {
    try {
      const workflow = await administrationApi.setWorkflowStatus(id, active);
      set(s => ({ workflows: s.workflows.map(w => w.id === id ? workflow : w) }));
      return true;
    } catch { return false; }
  },

  deleteWorkflow: async (id) => {
    try {
      await administrationApi.deleteWorkflow(id);
      set(s => ({ workflows: s.workflows.filter(w => w.id !== id) }));
      return true;
    } catch { return false; }
  },

  // ── Number Series ──────────────────────────────────────────────────────────
  fetchNumberSeries: async (params) => {
    try {
      const data = await administrationApi.getNumberSeries(params);
      set({ numberSeries: data });
    } catch {}
  },

  createNumberSeries: async (data) => {
    try {
      const series = await administrationApi.createNumberSeries(data);
      set(s => ({ numberSeries: [...s.numberSeries, series] }));
      return series;
    } catch { return null; }
  },

  setNumberSeriesStatus: async (id, active) => {
    try {
      const series = await administrationApi.setNumberSeriesStatus(id, active);
      set(s => ({ numberSeries: s.numberSeries.map(n => n.id === id ? series : n) }));
      return true;
    } catch { return false; }
  },

  deleteNumberSeries: async (id) => {
    try {
      await administrationApi.deleteNumberSeries(id);
      set(s => ({ numberSeries: s.numberSeries.filter(n => n.id !== id) }));
      return true;
    } catch { return false; }
  },

  // ── Currencies ─────────────────────────────────────────────────────────────
  fetchCurrencies: async (params) => {
    try {
      const data = await administrationApi.getCurrencies(params);
      set({ currencies: data });
    } catch {}
  },

  createCurrency: async (data) => {
    try {
      const currency = await administrationApi.createCurrency(data);
      set(s => ({ currencies: [...s.currencies, currency] }));
      return currency;
    } catch { return null; }
  },

  setCurrencyStatus: async (id, active) => {
    try {
      const currency = await administrationApi.setCurrencyStatus(id, active);
      set(s => ({ currencies: s.currencies.map(c => c.id === id ? currency : c) }));
      return true;
    } catch { return false; }
  },

  deleteCurrency: async (id) => {
    try {
      await administrationApi.deleteCurrency(id);
      set(s => ({ currencies: s.currencies.filter(c => c.id !== id) }));
      return true;
    } catch { return false; }
  },
}));