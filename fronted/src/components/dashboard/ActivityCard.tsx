import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface ActivityCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ActivityCard({ title, subtitle, icon: Icon, iconColor, actions, children, className = '' }: ActivityCardProps) {
  return (
    <div className={`bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-2.5 border-b border-[var(--color-border-subtle)]">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-strong)] flex items-center gap-1.5">
            {Icon && <Icon className="w-4 h-4" style={{ color: iconColor }} />}
            {title}
          </h3>
          {subtitle && <p className="text-[10px] text-[var(--color-text-muted)]">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 text-[9px] font-bold">{actions}</div>}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
