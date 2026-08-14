import { create } from 'zustand';
import { complianceApi, type TaxObligation, type TaxReturn, type WithholdingCertificate, type EInvoice, type ComplianceDashboard, type TaxObligationStatus, type EInvoiceStatus } from '../api/modules/compliance.api';

interface ComplianceState {
  dashboard: ComplianceDashboard | null;
  obligations: TaxObligation[];
  returns: TaxReturn[];
  withholding: WithholdingCertificate[];
  eInvoices: EInvoice[];
  loading: boolean;
  error: string | null;
  activeTab: string;

  setActiveTab: (tab: string) => void;
  fetchAll: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchObligations: (params?: any) => Promise<void>;
  createObligation: (data: any) => Promise<TaxObligation | null>;
  setObligationStatus: (id: string, status: TaxObligationStatus) => Promise<boolean>;
  fetchReturns: (params?: any) => Promise<void>;
  createReturn: (data: any) => Promise<TaxReturn | null>;
  fileReturn: (id: string) => Promise<boolean>;
  fetchWithholding: (params?: any) => Promise<void>;
  createWithholding: (data: any) => Promise<WithholdingCertificate | null>;
  fetchEInvoices: (params?: any) => Promise<void>;
  createEInvoice: (data: any) => Promise<EInvoice | null>;
  setEInvoiceStatus: (id: string, status: EInvoiceStatus) => Promise<boolean>;
}

export const useComplianceStore = create<ComplianceState>((set, _get) => ({
  dashboard: null,
  obligations: [],
  returns: [],
  withholding: [],
  eInvoices: [],
  loading: false,
  error: null,
  activeTab: 'overview',

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const [d, o, r, w, e] = await Promise.allSettled([
        complianceApi.getDashboard(),
        complianceApi.getObligations(),
        complianceApi.getReturns(),
        complianceApi.getWithholding(),
        complianceApi.getEInvoices(),
      ]);
      set({
        dashboard: d.status === 'fulfilled' ? d.value : null,
        obligations: o.status === 'fulfilled' ? o.value : [],
        returns: r.status === 'fulfilled' ? r.value : [],
        withholding: w.status === 'fulfilled' ? w.value : [],
        eInvoices: e.status === 'fulfilled' ? e.value : [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchDashboard: async () => {
    try {
      const data = await complianceApi.getDashboard();
      set({ dashboard: data });
    } catch {}
  },

  fetchObligations: async (params) => {
    try {
      const data = await complianceApi.getObligations(params);
      set({ obligations: data });
    } catch {}
  },

  createObligation: async (data) => {
    try {
      const obligation = await complianceApi.createObligation(data);
      set(s => ({ obligations: [obligation, ...s.obligations] }));
      return obligation;
    } catch { return null; }
  },

  setObligationStatus: async (id, status) => {
    try {
      const obligation = await complianceApi.setObligationStatus(id, status);
      set(s => ({ obligations: s.obligations.map(o => o.id === id ? obligation : o) }));
      return true;
    } catch { return false; }
  },

  fetchReturns: async (params) => {
    try {
      const data = await complianceApi.getReturns(params);
      set({ returns: data });
    } catch {}
  },

  createReturn: async (data) => {
    try {
      const ret = await complianceApi.createReturn(data);
      set(s => ({ returns: [ret, ...s.returns] }));
      return ret;
    } catch { return null; }
  },

  fileReturn: async (id) => {
    try {
      const ret = await complianceApi.fileReturn(id);
      set(s => ({ returns: s.returns.map(r => r.id === id ? ret : r) }));
      return true;
    } catch { return false; }
  },

  fetchWithholding: async (params) => {
    try {
      const data = await complianceApi.getWithholding(params);
      set({ withholding: data });
    } catch {}
  },

  createWithholding: async (data) => {
    try {
      const cert = await complianceApi.createWithholding(data);
      set(s => ({ withholding: [cert, ...s.withholding] }));
      return cert;
    } catch { return null; }
  },

  fetchEInvoices: async (params) => {
    try {
      const data = await complianceApi.getEInvoices(params);
      set({ eInvoices: data });
    } catch {}
  },

  createEInvoice: async (data) => {
    try {
      const invoice = await complianceApi.createEInvoice(data);
      set(s => ({ eInvoices: [invoice, ...s.eInvoices] }));
      return invoice;
    } catch { return null; }
  },

  setEInvoiceStatus: async (id, status) => {
    try {
      const invoice = await complianceApi.setEInvoiceStatus(id, status);
      set(s => ({ eInvoices: s.eInvoices.map(e => e.id === id ? invoice : e) }));
      return true;
    } catch { return false; }
  },
}));