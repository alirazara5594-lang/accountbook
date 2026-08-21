import { Bell, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  className?: string;
  onSettingsClick?: () => void;
  onNotificationClick?: () => void;
}

export function DashboardHeader({
  title = 'Accounting & Finance ERP Overview',
  subtitle = 'Real-time financial performance & business insights',
  badge,
  className = '',
  onSettingsClick,
  onNotificationClick,
}: DashboardHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate initials for avatar box based on title
  const initials = title
    .split(' ')
    .filter(w => w.length > 0 && w[0] === w[0].toUpperCase())
    .map(w => w[0])
    .slice(0, 2)
    .join('');

  return (
    <div className={`col-span-12 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-6 py-5 shadow-sm flex items-center justify-between ${className}`}>
      {/* Left */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>
          <span className="text-lg font-black text-[var(--color-primary)]">{initials || 'AF'}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-[var(--color-text-strong)] uppercase">
              {title}
            </h1>
            {badge && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">
        <span className="text-sm font-semibold text-[var(--color-text)]">{today}</span>
        <button
          onClick={onNotificationClick || (() => alert("🔔 System Notifications\n\nAll systems functional. No unread compliance alerts or message warnings."))}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-colors"
          title="Notifications"
        >
          <Bell className="w-4.5 h-4.5" />
        </button>
        <button
          onClick={onSettingsClick || (() => alert("⚙️ ERP System Settings\n\nUse the Administration sidebar menu or click settings to view system logs and configuration templates."))}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-colors"
          title="System Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </div>
  );
}
