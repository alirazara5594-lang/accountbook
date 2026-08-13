import { apiClient } from '../client';

export type ExpenseClaimStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Paid';

export interface ExpenseClaimLine {
  id?: string;
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
}

export interface ExpenseClaim {
  id: string;
  claimNumber: string;
  employeeName: string;
  department: string;
  date: string;
  status: ExpenseClaimStatus;
  lines: ExpenseClaimLine[];
  totalAmount: number;
  currency: string;
  notes?: string;
  journalEntryId?: string;
  companyId?: string;
  createdAt?: string;
}

export interface ExpenseClaimRequest {
  employeeName?: string;
  department?: string;
  date: string;
  lines: Omit<ExpenseClaimLine, 'id' | 'accountCode' | 'accountName'>[];
  currency?: string;
  notes?: string;
  companyId?: string;
}

export const expenseClaimsApi = {
  getClaims: async (companyId?: string): Promise<ExpenseClaim[]> => {
    return apiClient<ExpenseClaim[]>('/expense-claims', { params: { companyId } });
  },
  createClaim: async (data: ExpenseClaimRequest): Promise<ExpenseClaim> => {
    return apiClient<ExpenseClaim>('/expense-claims', { method: 'POST', body: data });
  },
  setStatus: async (id: string, status: ExpenseClaimStatus): Promise<ExpenseClaim> => {
    return apiClient<ExpenseClaim>(`/expense-claims/${id}/status`, { method: 'PATCH', body: { status } });
  },
};
