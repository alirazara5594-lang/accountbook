import { useEffect, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { THEMES } from '../themes';

export default function ThemeSwitcher({ theme, onSelect }: { theme: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = THEMES.find(t => t.id === theme) || THEMES[0];

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
    minWidth: 240,
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
        title="Change theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          background: 'var(--color-surface-muted)',
          border: '1px solid var(--color-border)',
          borderRadius: 9,
          height: 34,
          padding: '0 10px',
          cursor: 'pointer',
          color: 'var(--color-text)',
        }}
      >
        <span
          className="theme-dot"
          style={{
            width: 15,
            height: 15,
            borderRadius: 99,
            background: `linear-gradient(135deg, ${current.primary} 50%, ${current.sidebar} 50%)`,
            boxShadow: '0 0 0 1px rgba(15,23,42,0.12)',
            flexShrink: 0,
          }}
        />
        <Palette size={15} />
      </button>

      {open && (
        <div style={dropdownBase}>
          <div style={{ padding: '8px 14px', fontSize: 10, fontWeight: 800, letterSpacing: 1, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Choose theme
          </div>
          {THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { onSelect(t.id); setOpen(false); }}
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
              <span style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                <span style={{ width: 15, height: 15, borderRadius: 99, background: t.primary }} />
                <span style={{ width: 15, height: 15, borderRadius: 99, background: t.sidebar }} />
              </span>
              <span style={{ flex: 1, fontWeight: theme === t.id ? 700 : 600 }}>{t.name}</span>
              {theme === t.id && <Check size={14} style={{ color: 'var(--color-primary)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}