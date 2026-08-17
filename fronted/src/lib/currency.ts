// Global currency helper - reads from localStorage so all views use the active entity's currency.

import { create } from 'zustand';

export type CurrencyCode = 'USD' | 'PKR' | 'GBP' | 'EUR' | 'AED' | 'SAR' | 'CAD' | 'AUD';

const SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: 'PKR ',
  GBP: '\u00a3',
  EUR: '\u20ac',
  AED: 'AED ',
  SAR: 'SAR ',
  CAD: 'CAD ',
  AUD: 'A$',
};

const LOCALES: Record<string, string> = {
  USD: 'en-US',
  PKR: 'en-PK',
  GBP: 'en-GB',
  EUR: 'de-DE',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  CAD: 'en-CA',
  AUD: 'en-AU',
};

interface ActiveCurrencyState {
  code: string;
  setCode: (code: string) => void;
}

export const useActiveCurrencyStore = create<ActiveCurrencyState>((set) => ({
  code: typeof window !== 'undefined' ? localStorage.getItem('active_currency') || 'PKR' : 'PKR',
  setCode: (code) => set({ code: code.toUpperCase() }),
}));

export function getActiveCurrency(): string {
  try {
    return localStorage.getItem('active_currency') || 'PKR';
  } catch {
    return 'PKR';
  }
}

export function setActiveCurrency(code: string) {
  const upper = code.toUpperCase();
  try {
    localStorage.setItem('active_currency', upper);
  } catch { /* noop */ }
  useActiveCurrencyStore.getState().setCode(upper);
}

export function money(v: number, currency?: string): string {
  const cur = (currency || getActiveCurrency()).toUpperCase();
  const symbol = SYMBOLS[cur] || cur + ' ';
  const locale = LOCALES[cur] || 'en-US';
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(v || 0));
  return symbol.endsWith(' ') ? `${symbol}${formatted}` : `${symbol}${formatted}`;
}
