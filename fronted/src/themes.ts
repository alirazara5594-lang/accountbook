export interface ThemeDef {
  id: string;
  name: string;
  primary: string;
  accent: string;
  sidebar: string;
}

export const THEMES: ThemeDef[] = [
  { id: 'teal', name: 'Teal', primary: '#0d9488', accent: '#2fb8a6', sidebar: '#0f1d33' },
  { id: 'indigo', name: 'Indigo', primary: '#4f46e5', accent: '#818cf8', sidebar: '#171a3a' },
  { id: 'ocean', name: 'Ocean', primary: '#0284c7', accent: '#38bdf8', sidebar: '#082f49' },
  { id: 'emerald', name: 'Emerald', primary: '#059669', accent: '#34d399', sidebar: '#052e24' },
  { id: 'violet', name: 'Violet', primary: '#7c3aed', accent: '#a78bfa', sidebar: '#1e1b4b' },
  { id: 'amber', name: 'Amber', primary: '#d97706', accent: '#fbbf24', sidebar: '#231705' },
  { id: 'rose', name: 'Rose', primary: '#e11d48', accent: '#fb7185', sidebar: '#2d0a1c' },
  { id: 'graphite', name: 'Graphite', primary: '#334155', accent: '#64748b', sidebar: '#0b1220' },
];

export const DEFAULT_THEME = 'teal';

export function getStoredTheme(): string {
  try {
    const t = localStorage.getItem('acfin_theme');
    if (t && THEMES.some(x => x.id === t)) return t;
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}