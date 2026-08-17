// Global currency helper - reads from localStorage so all views use the active entity's currency.

import { create } from 'zustand';

export type CurrencyCode = 'USD' | 'PKR' | 'GBP' | 'EUR' | 'AED' | 'SAR' | 'CAD';

const SYMBOLS: Record<string, string> = {
  USD: '$',
  PKR: 'Rs ',
  GBP: '\u00a3',
  EUR: '\u20ac',
  AED: 'AED ',
  SAR: 'SAR ',
  CAD: 'CAD ',
};

const LOCALES: Record<string, string> = {
  USD: 'en-US',
  PKR: 'en-PK',
  GBP: 'en-GB',
  EUR: 'de-DE',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  CAD: 'en-CA',
};

interface ActiveCurrencyState {
  code: string;
  setCode: (code: string) => void;
}

export const useActiveCurrencyStore = create<ActiveCurrencyState>((set) => ({
  code: typeof window !== 'undefined' ? localStorage.getItem('active_currency') || 'USD' : 'USD',
  setCode: (code) => set({ code: code.toUpperCase() }),
}));

export function getActiveCurrency(): string {
  try {
    return localStorage.getItem('active_currency') || 'USD';
  } catch {
    return 'USD';
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
