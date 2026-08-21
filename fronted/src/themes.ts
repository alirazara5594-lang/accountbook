export interface ThemeDef {
  id: string;
  name: string;
  primary: string;
  accent: string;
  sidebar: string;
  dark?: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: 'nd-dark', name: '🌌 Indigo Glow Dark', primary: '#a855f7', accent: '#ff7849', sidebar: '#16192e', dark: true },
  { id: 'nd-light', name: '🌊 Marine Light', primary: '#006aa7', accent: '#0098db', sidebar: '#0d1b2a' },
  { id: 'nd-cool', name: '🌊 Marine Executive', primary: '#006aa7', accent: '#0098db', sidebar: '#0d1b2a' },
  { id: 'va-dark', name: '🌌 Indigo Glow Dark', primary: '#a855f7', accent: '#38bdf8', sidebar: '#16192e', dark: true },
  { id: 'va-cool', name: 'Cool Slate', primary: '#00c4e8', accent: '#a855f7', sidebar: '#0d1528' },
  { id: 'va-light', name: 'Light', primary: '#8b5cf6', accent: '#a855f7', sidebar: '#f8fafc' },
  { id: 'bp-dark', name: '🌌 Indigo Glow Dark', primary: '#a855f7', accent: '#ff7849', sidebar: '#16192e', dark: true },
  { id: 'bp-cool', name: 'Cool Blue', primary: '#3b82f6', accent: '#a855f7', sidebar: '#0d1225' },
  { id: 'bp-light', name: 'Light Blue', primary: '#3b82f6', accent: '#a855f7', sidebar: '#0d1225' },
];

export const DEFAULT_THEME = 'nd-dark';

export function getStoredTheme(): string {
  try {
    const t = localStorage.getItem('ams_theme');
    if (t && THEMES.some(x => x.id === t)) return t;
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}