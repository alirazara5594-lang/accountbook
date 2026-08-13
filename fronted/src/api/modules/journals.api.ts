import { apiClient } from '../client';

export interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
  memo?: string | null;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  status?: string;
  createdAt?: string;
}

export const journalsApi = {
  getJournalEntries: async (): Promise<JournalEntry[]> => {
    return apiClient<JournalEntry[]>('/journal-entries');
  },

  postJournalEntry: async (entryData: any): Promise<JournalEntry> => {
    return apiClient<JournalEntry>('/journal-entries', {
      method: 'POST',
      body: entryData,
    });
  },

  submit: async (id: string, note?: string): Promise<JournalEntry> =>
    apiClient<JournalEntry>(`/journal-entries/${id}/submit`, {
      method: 'POST',
      body: { note },
    }),

  approve: async (id: string, note?: string): Promise<JournalEntry> =>
    apiClient<JournalEntry>(`/journal-entries/${id}/approve`, {
      method: 'POST',
      body: { note },
    }),

  post: async (id: string, note?: string): Promise<JournalEntry> =>
    apiClient<JournalEntry>(`/journal-entries/${id}/post`, {
      method: 'POST',
      body: { note },
    }),

  batchPost: async (entryIds: string[]): Promise<{ posted: number }> =>
    apiClient<{ posted: number }>('/journal-entries/batch-post', {
      method: 'POST',
      body: { entryIds },
    }),
};
