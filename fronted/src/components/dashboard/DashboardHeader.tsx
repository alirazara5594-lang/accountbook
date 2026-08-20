import { Bell, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  className?: string;
}

export function DashboardHeader({ className = '' }: DashboardHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={`col-span-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-6 py-5 shadow-sm flex items-center justify-between ${className}`}>
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>
          <span className="text-lg font-black text-[var(--color-primary)]">AF</span>
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-[var(--color-text-strong)] uppercase">
            Accounting & Finance ERP Overview
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Real-time financial performance & business insights
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <span className="text-sm font-semibold text-[var(--color-text)]">{today}</span>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-colors">
          <Bell className="w-4.5 h-4.5" />
        </button>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-colors">
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
