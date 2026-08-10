import { create } from 'zustand';
import { entitiesApi, type Entity } from '../api/modules/entities.api';

interface CompanyState {
  entities: Entity[];
  activeEntityId: string;
  loading: boolean;
  error: string | null;

  fetchCompanies: () => Promise<Entity[]>;
  setActiveEntityId: (id: string) => void;
  saveCompany: (data: any, id?: string) => Promise<Entity>;
  toggleCompanyStatus: (id: string, active: boolean) => Promise<void>;
  getActiveEntity: () => Entity | undefined;
}

export const useCompanyStore = create<CompanyState>((set, get) => ({
  entities: [],
  activeEntityId: typeof window !== 'undefined' ? localStorage.getItem('active_entity_id') || '' : '',
  loading: false,
  error: null,

  fetchCompanies: async () => {
    set({ loading: true, error: null });
    try {
      const companies = await entitiesApi.getCompanies();
      set((state) => {
        const currentActive = state.activeEntityId;
        const newActive = currentActive && companies.some((c) => c.id === currentActive)
          ? currentActive
          : companies[0]?.id || '';

        if (newActive) {
          localStorage.setItem('active_entity_id', newActive);
        }

        return {
          entities: companies,
          activeEntityId: newActive,
          loading: false,
        };
      });
      return companies;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch companies', loading: false });
      return [];
    }
  },

  setActiveEntityId: (id: string) => {
    localStorage.setItem('active_entity_id', id);
    set({ activeEntityId: id });
  },

  saveCompany: async (data: any, id?: string) => {
    set({ loading: true, error: null });
    try {
      const saved = await entitiesApi.saveCompany(data, id);
      await get().fetchCompanies();
      return saved;
    } catch (err: any) {
      set({ error: err.message || 'Failed to save company', loading: false });
      throw err;
    }
  },

  toggleCompanyStatus: async (id: string, active: boolean) => {
    set({ loading: true, error: null });
    try {
      await entitiesApi.toggleCompanyStatus(id, active);
      await get().fetchCompanies();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update company status', loading: false });
      throw err;
    }
  },

  getActiveEntity: () => {
    const { entities, activeEntityId } = get();
    return entities.find((e) => e.id === activeEntityId);
  },
}));
