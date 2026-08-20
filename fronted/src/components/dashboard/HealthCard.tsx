import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface HealthCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  className?: string;
}

export function HealthCard({ title, subtitle, icon: Icon, iconColor, children, className = '' }: HealthCardProps) {
  return (
    <div className={`bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-sm flex flex-col ${className}`}>
      <div className="pb-2.5 border-b border-[var(--color-border-subtle)] mb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-strong)] flex items-center gap-1.5">
          {Icon && <Icon className="w-4 h-4" style={{ color: iconColor }} />}
          {title}
        </h3>
        {subtitle && <p className="text-[10px] text-[var(--color-text-muted)]">{subtitle}</p>}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
