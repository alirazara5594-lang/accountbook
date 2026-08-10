import { create } from 'zustand';
import { journalsApi, type JournalEntry } from '../api/modules/journals.api';

interface JournalsState {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;

  fetchJournalEntries: () => Promise<JournalEntry[]>;
  postJournalEntry: (entryData: any) => Promise<JournalEntry>;
}

export const useJournalsStore = create<JournalsState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  fetchJournalEntries: async () => {
    set({ loading: true, error: null });
    try {
      const entries = await journalsApi.getJournalEntries();
      set({ entries, loading: false });
      return entries;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load journal entries', loading: false });
      return [];
    }
  },

  postJournalEntry: async (entryData: any) => {
    set({ loading: true, error: null });
    try {
      const posted = await journalsApi.postJournalEntry(entryData);
      await get().fetchJournalEntries();
      return posted;
    } catch (err: any) {
      set({ error: err.message || 'Failed to post journal entry', loading: false });
      throw err;
    }
  },
}));
