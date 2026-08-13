import { create } from 'zustand';
import { expenseClaimsApi, type ExpenseClaim, type ExpenseClaimRequest, type ExpenseClaimStatus } from '../api/modules/expenseClaims.api';

interface ExpenseClaimsState {
  claims: ExpenseClaim[];
  loading: boolean;
  error: string | null;
  fetchClaims: (companyId?: string) => Promise<ExpenseClaim[]>;
  createClaim: (data: ExpenseClaimRequest) => Promise<ExpenseClaim>;
  setStatus: (id: string, status: ExpenseClaimStatus, companyId?: string) => Promise<ExpenseClaim>;
}

export const useExpenseClaimsStore = create<ExpenseClaimsState>((set, get) => ({
  claims: [],
  loading: false,
  error: null,
  fetchClaims: async (companyId) => {
    set({ loading: true, error: null });
    try {
      const claims = await expenseClaimsApi.getClaims(companyId);
      set({ claims, loading: false });
      return claims;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load expense claims', loading: false });
      return [];
    }
  },
  createClaim: async (data) => {
    const created = await expenseClaimsApi.createClaim(data);
    await get().fetchClaims(data.companyId);
    return created;
  },
  setStatus: async (id, status, companyId) => {
    const updated = await expenseClaimsApi.setStatus(id, status);
    await get().fetchClaims(companyId);
    return updated;
  },
}));
