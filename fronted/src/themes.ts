export interface ThemeDef {
  id: string;
  name: string;
  primary: string;
  accent: string;
  sidebar: string;
  dark?: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: 'nd-dark', name: '🌊 Navy Dark', primary: '#63b3ed', accent: '#90cdf4', sidebar: '#0d1b2a', dark: true },
  { id: 'va-dark', name: 'Dark', primary: '#00d4ff', accent: '#a855f7', sidebar: '#0a1020', dark: true },
  { id: 'va-cool', name: 'Cool', primary: '#00c4e8', accent: '#a855f7', sidebar: '#0d1528' },
  { id: 'va-light', name: 'Light', primary: '#8b5cf6', accent: '#a855f7', sidebar: '#f8fafc' },
  { id: 'bp-dark', name: 'Dark', primary: '#3b82f6', accent: '#a855f7', sidebar: '#0d1225', dark: true },
  { id: 'bp-cool', name: 'Cool', primary: '#3b82f6', accent: '#a855f7', sidebar: '#0d1225' },
  { id: 'bp-light', name: 'Light', primary: '#3b82f6', accent: '#a855f7', sidebar: '#0d1225' },
  { id: 'pi-dark', name: 'Indigo Dark', primary: '#6366f1', accent: '#ec4899', sidebar: '#151929', dark: true },
  { id: 'pi-cool', name: 'Indigo Cool', primary: '#6366f1', accent: '#ec4899', sidebar: '#151929' },
  { id: 'pi-light', name: 'Indigo Light', primary: '#6366f1', accent: '#ec4899', sidebar: '#151929' },
  { id: 'gp-dark', name: 'Gold Dark', primary: '#eab308', accent: '#ec4899', sidebar: '#2a1a3a', dark: true },
  { id: 'gp-cool', name: 'Gold Cool', primary: '#eab308', accent: '#ec4899', sidebar: '#2a1a3a' },
  { id: 'gp-light', name: 'Gold Light', primary: '#eab308', accent: '#ec4899', sidebar: '#2a1a3a' },
  { id: 'fn-dark', name: 'Finance Dark', primary: '#3b82f6', accent: '#7c3aed', sidebar: '#111827', dark: true },
  { id: 'fn-cool', name: 'Finance Cool', primary: '#3b82f6', accent: '#7c3aed', sidebar: '#111827' },
  { id: 'fn-light', name: 'Finance Light', primary: '#3b82f6', accent: '#7c3aed', sidebar: '#111827' },
  { id: 'nc-dark', name: 'Neon Dark', primary: '#00f5ff', accent: '#c400ff', sidebar: '#0a0e1a', dark: true },
  { id: 'nc-cool', name: 'Neon Cool', primary: '#00f5ff', accent: '#c400ff', sidebar: '#0a0e1a' },
  { id: 'nc-light', name: 'Neon Light', primary: '#4f46e5', accent: '#475569', sidebar: '#0a0e1a' },
];

export const DEFAULT_THEME = 'va-cool';

export function getStoredTheme(): string {
  try {
    const t = localStorage.getItem('ams_theme');
    if (t && THEMES.some(x => x.id === t)) return t;
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}