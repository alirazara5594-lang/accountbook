import { apiClient } from '../client';

export type LeaseType = 'FinanceLease' | 'OperatingLease';

export interface LeaseAgreement {
  id: string;
  leaseNumber: string;
  counterparty: string;
  type: LeaseType;
  propertyDescription: string;
  initialValue: number;
  monthlyRent: number;
  annualEscalationRate: number;
  startDate: string;
  endDate: string;
  termMonths: number;
  presentValue: number;
  rightOfUseAssetValue: number;
  accumulatedDepreciation: number;
  balanceSheetLiability: number;
  assetAccountId?: string | null;
  liabilityAccountId?: string | null;
  interestAccountId?: string | null;
  cashAccountId?: string | null;
  companyId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaseScheduleResponse {
  leaseId: string;
  schedule: LeaseScheduleItem[];
  totalInterest: number;
  totalPayments: number;
  presentValue: number;
}

export interface LeaseScheduleItem {
  period: number;
  date: string;
  openingLiability: number;
  interestExpense: number;
  principalPayment: number;
  closingLiability: number;
  depreciationExpense: number;
}

export const leasesApi = {
  getLeases: async (companyId?: string): Promise<LeaseAgreement[]> => {
    return apiClient<LeaseAgreement[]>('/leases', {
      params: { companyId },
    });
  },

  createLease: async (lease: Partial<LeaseAgreement>): Promise<LeaseAgreement> => {
    return apiClient<LeaseAgreement>('/leases', {
      method: 'POST',
      body: lease,
    });
  },

  getSchedule: async (id: string, months: number = 12): Promise<LeaseScheduleResponse> => {
    return apiClient<LeaseScheduleResponse>(`/leases/${id}/schedule`, {
      params: { months },
    });
  },

  postMonthlyAccrual: async (id: string): Promise<any> => {
    return apiClient(`/leases/${id}/post-accrual`, {
      method: 'POST',
    });
  },
};