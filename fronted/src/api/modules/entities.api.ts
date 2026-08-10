import { apiClient } from '../client';

export interface Entity {
  id: string;
  name: string;
  code: string;
  functionalCurrency: string;
  country: string;
  structure: string;
  active: boolean;
  parentId?: string | null;
  taxAuthorityId?: string | null;
  taxId?: string;
  fiscalYearEnd?: string;
}

export const entitiesApi = {
  getCompanies: async (): Promise<Entity[]> => {
    return apiClient<Entity[]>('/companies');
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
};
