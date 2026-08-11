import { create } from 'zustand';
import { creditNotesApi, type CreditNote, type CreditNoteRequest } from '../api/modules/creditNotes.api';

interface CreditNotesState {
  creditNotes: CreditNote[];
  loading: boolean;
  error: string | null;

  fetchAll: (companyId?: string) => Promise<CreditNote[]>;
  create: (request: CreditNoteRequest) => Promise<CreditNote>;
  post: (id: string, arAccountId?: string, revenueAccountId?: string, taxLiabilityAccountId?: string) => Promise<void>;
  void: (id: string) => Promise<void>;
}

export const useCreditNotesStore = create<CreditNotesState>((set, get) => ({
  creditNotes: [],
  loading: false,
  error: null,

  fetchAll: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const notes = await creditNotesApi.getAll(companyId);
      set({ creditNotes: notes, loading: false });
      return notes;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load credit notes', loading: false });
      return [];
    }
  },

  create: async (request: CreditNoteRequest) => {
    set({ loading: true, error: null });
    try {
      const note = await creditNotesApi.create(request);
      await get().fetchAll(request.companyId);
      set({ loading: false });
      return note;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create credit note', loading: false });
      throw err;
    }
  },

  post: async (id: string, arAccountId?: string, revenueAccountId?: string, taxLiabilityAccountId?: string) => {
    set({ loading: true, error: null });
    try {
      await creditNotesApi.post(id, arAccountId, revenueAccountId, taxLiabilityAccountId);
      await get().fetchAll();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to post credit note', loading: false });
      throw err;
    }
  },

  void: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await creditNotesApi.void(id);
      await get().fetchAll();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to void credit note', loading: false });
      throw err;
    }
  },
}));
