// Shared formatting helpers + types for the Financial Overview dashboard.
// All values are computed from the live ERP stores / APIs (no hardcoded figures).

export type CurrencyCode = 'USD' | 'PKR' | 'GBP' | 'EUR' | 'AED';

const SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  PKR: 'Rs ',
  GBP: '£',
  EUR: '€',
  AED: 'AED ',
};

export function money(v: number, currency: CurrencyCode = 'USD'): string {
  const symbol = SYMBOLS[currency] || '$';
  const formatted = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(v || 0));
  return symbol.endsWith(' ') ? `${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function num(n: number): string {
  return new Intl.NumberFormat('en-US').format(n || 0);
}

export function pct(v: number, digits = 1): string {
  return `${(v || 0).toFixed(digits)}%`;
}

export function fmtDate(d?: string): string {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function monthKey(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface FiscalMonth {
  key: string;
  label: string;
  short: string;
}

/** Fiscal year runs Jul(prev calendar year) -> Jun(fyYear). fyYear is the year the FY ends. */
export function fiscalMonths(fyYear: number): FiscalMonth[] {
  const out: FiscalMonth[] = [];
  for (let i = 0; i < 12; i++) {
    const m = (6 + i) % 12;
    const year = m >= 6 ? fyYear - 1 : fyYear;
    out.push({
      key: `${year}-${String(m + 1).padStart(2, '0')}`,
      label: `${MONTH_SHORT[m]} ${String(year).slice(2)}`,
      short: MONTH_SHORT[m],
    });
  }
  return out;
}

export function fyStartDate(fyYear: number): string {
  return `${fyYear - 1}-07-01`;
}

export function currentFiscalYear(): number {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
}

export function agingBucket(due?: string): string {
  if (!due) return 'Current';
  const d = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);
  if (d >= 0) return 'Current';
  const o = Math.abs(d);
  if (o <= 30) return '1-30';
  if (o <= 60) return '31-60';
  if (o <= 90) return '61-90';
  return '90+';
}

export const AGING_BUCKETS = ['Current', '1-30', '31-60', '61-90', '90+'];

export const CHART_COLORS = ['#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f43f5e'];
