import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, CloudSun, Check } from 'lucide-react';

const MODES = [
  { id: 'dark', name: 'Dark', icon: Moon },
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'cool', name: 'Cool', icon: CloudSun },
] as const;

type ModeId = (typeof MODES)[number]['id'];

export function getDisplayMode(theme: string): ModeId {
  if (theme.endsWith('-light')) return 'light';
  if (theme.endsWith('-cool')) return 'cool';
  return 'dark';
}

export function getThemeFamily(_theme: string): string {
  return 'bp';
}

export function resolveThemeId(_family: string, mode: ModeId): string {
  return `bp-${mode}`;
}

export default function ThemeSwitcher({ theme, onSelect }: { theme: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const family = getThemeFamily(theme);
  const mode = getDisplayMode(theme);
  const current = MODES.find(m => m.id === mode) || MODES[0];
  const CurrentIcon = current.icon;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const dropdownBase: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    minWidth: 180,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
    zIndex: 60,
    overflow: 'hidden',
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Display mode"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface-muted)',
          border: '1px solid var(--color-border)',
          borderRadius: 9,
          height: 30,
          width: 30,
          cursor: 'pointer',
          color: 'var(--color-text)',
        }}
      >
        <CurrentIcon size={14} style={{ color: 'var(--color-primary)' }} />
      </button>

      {open && (
        <div style={dropdownBase}>
          <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Display Mode
          </div>
          {MODES.map(m => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => { onSelect(resolveThemeId(family, m.id)); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  width: '100%',
                  padding: '9px 14px',
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 13,
                  color: 'var(--color-text)',
                  borderBottom: '1px solid var(--color-border-subtle)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-muted)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span style={{ flex: 1, fontWeight: mode === m.id ? 700 : 600 }}>{m.name}</span>
                {mode === m.id && <Check size={14} style={{ color: 'var(--color-primary)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
