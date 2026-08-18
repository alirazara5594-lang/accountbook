import { apiClient } from '../client';

export interface Entity {
  id: string;
  name: string;
  code?: string;
  legalName?: string;
  type?: string;
  parentId?: string;
  country: string;
  currencyCode?: string;
  functionalCurrency?: string;
  modules?: string[];
  active: boolean;
  taxAuthorityId?: string | null;
  taxId?: string;
  fiscalYearEnd?: string;
}

export const entitiesApi = {
  getCompanies: async (): Promise<Entity[]> => {
    return apiClient<Entity[]>('/companies', { params: { includeInactive: true } });
  },

  saveCompany: async (entityData: any, id?: string): Promise<Entity> => {
    const endpoint = id ? `/companies/${id}` : '/companies';
    const method = id ? 'PUT' : 'POST';
    return apiClient<Entity>(endpoint, {
      method,
      body: entityData,
    });
  },

  toggleCompanyStatus: async (id: string, active: boolean): Promise<void> => {
    return apiClient(`/companies/${id}/status`, {
      method: 'PATCH',
      body: { active },
    });
  },

  deleteCompany: async (id: string): Promise<void> => {
    return apiClient(`/companies/${id}`, {
      method: 'DELETE',
    });
  },
};
