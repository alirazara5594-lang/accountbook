import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change: string;
  trendType: 'up' | 'down' | 'neutral';
  sub?: string;
  className?: string;
}

export function KpiCard({ label, value, icon: Icon, color, change, trendType, sub, className = '' }: KpiCardProps) {
  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[112px] relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] truncate">{label}</span>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-xl font-black text-[var(--color-text-strong)] tracking-tight truncate">{value}</p>
      <div className="flex items-center gap-1.5 mt-2">
        {trendType === 'up' && (
          <>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold text-emerald-500 shrink-0">{change}</span>
          </>
        )}
        {trendType === 'down' && (
          <>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="text-[10px] font-bold text-rose-500 shrink-0">{change}</span>
          </>
        )}
        {sub && <span className="text-[9px] text-[var(--color-text-subtle)] truncate ml-1">{sub}</span>}
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
}
