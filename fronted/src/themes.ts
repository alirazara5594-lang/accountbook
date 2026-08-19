export interface ThemeDef {
  id: string;
  name: string;
  primary: string;
  accent: string;
  sidebar: string;
  dark?: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: 'bp-dark', name: 'Dark', primary: '#3b82f6', accent: '#a855f7', sidebar: '#0d1225', dark: true },
  { id: 'bp-cool', name: 'Cool', primary: '#3b82f6', accent: '#a855f7', sidebar: '#0d1225' },
  { id: 'bp-light', name: 'Light', primary: '#3b82f6', accent: '#a855f7', sidebar: '#ffffff' },
];

export const DEFAULT_THEME = 'bp-dark';

export function getStoredTheme(): string {
  try {
    const t = localStorage.getItem('ams_theme');
    if (t && THEMES.some(x => x.id === t)) return t;
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}