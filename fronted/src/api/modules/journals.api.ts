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
};
