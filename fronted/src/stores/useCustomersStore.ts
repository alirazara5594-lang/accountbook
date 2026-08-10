import { create } from 'zustand';
import { customersApi, type Customer } from '../api/modules/customers.api';

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;

  fetchCustomers: (companyId?: string) => Promise<Customer[]>;
  fetchNextNumber: () => Promise<string>;
  saveCustomer: (data: any, id?: string) => Promise<Customer>;
  toggleCustomerStatus: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  loading: false,
  error: null,

  fetchCustomers: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const customers = await customersApi.getCustomers(companyId);
      set({ customers, loading: false });
      return customers;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load customers', loading: false });
      return [];
    }
  },

  fetchNextNumber: async () => {
    try {
      const res = await customersApi.getNextCustomerNumber();
      return res.customerNumber;
    } catch {
      return '';
    }
  },

  saveCustomer: async (data: any, id?: string) => {
    set({ loading: true, error: null });
    try {
      const saved = await customersApi.saveCustomer(data, id);
      await get().fetchCustomers();
      return saved;
    } catch (err: any) {
      set({ error: err.message || 'Failed to save customer', loading: false });
      throw err;
    }
  },

  toggleCustomerStatus: async (customer: Customer) => {
    set({ loading: true, error: null });
    try {
      const nextStatus = customer.status === 'Active' ? 'Inactive' : 'Active';
      await customersApi.toggleCustomerStatus(customer.id, nextStatus);
      await get().fetchCustomers();
    } catch (err: any) {
      set({ error: err.message || 'Failed to update customer status', loading: false });
      throw err;
    }
  },

  deleteCustomer: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await customersApi.deleteCustomer(id);
      await get().fetchCustomers();
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete customer', loading: false });
      throw err;
    }
  },
}));
