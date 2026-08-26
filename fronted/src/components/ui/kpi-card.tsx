import React from 'react';

export type KpiTone = 'blue' | 'indigo' | 'emerald' | 'green' | 'amber' | 'orange' | 'purple' | 'violet' | 'rose' | 'red' | 'teal' | 'cyan';

const toneGradients: Record<KpiTone, string> = {
  blue: 'from-blue-500 to-indigo-600',
  indigo: 'from-indigo-500 to-blue-600',
  emerald: 'from-emerald-500 to-green-600',
  green: 'from-green-500 to-emerald-600',
  amber: 'from-amber-500 to-orange-600',
  orange: 'from-orange-500 to-amber-600',
  purple: 'from-purple-500 to-violet-600',
  violet: 'from-violet-500 to-purple-600',
  rose: 'from-rose-500 to-red-600',
  red: 'from-red-500 to-rose-600',
  teal: 'from-teal-500 to-cyan-600',
  cyan: 'from-cyan-500 to-teal-600',
};

const toneWashes: Record<KpiTone, string> = {
  blue: 'bg-blue-500/10 dark:bg-blue-500/15',
  indigo: 'bg-indigo-500/10 dark:bg-indigo-500/15',
  emerald: 'bg-emerald-500/10 dark:bg-emerald-500/15',
  green: 'bg-green-500/10 dark:bg-green-500/15',
  amber: 'bg-amber-500/10 dark:bg-amber-500/15',
  orange: 'bg-orange-500/10 dark:bg-orange-500/15',
  purple: 'bg-purple-500/10 dark:bg-purple-500/15',
  violet: 'bg-violet-500/10 dark:bg-violet-500/15',
  rose: 'bg-rose-500/10 dark:bg-rose-500/15',
  red: 'bg-red-500/10 dark:bg-red-500/15',
  teal: 'bg-teal-500/10 dark:bg-teal-500/15',
  cyan: 'bg-cyan-500/10 dark:bg-cyan-500/15',
};

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  desc?: React.ReactNode;
  tone?: KpiTone | (string & {});
}

export function KpiCard({ icon: Icon, label, value, desc, tone = 'blue' }: KpiCardProps) {
  const gradient = toneGradients[tone as KpiTone] ?? toneGradients.blue;
  const wash = toneWashes[tone as KpiTone] ?? toneWashes.blue;
  return (
    <div className="group relative min-h-[96px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1.5 truncate text-xl font-extrabold leading-tight tracking-tight text-[var(--color-text-strong)]">{value}</p>
          {desc && <p className="mt-1 truncate text-[11px] text-[var(--color-text-muted)]">{desc}</p>}
        </div>
        <div className={`flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className={`absolute -bottom-5 -right-5 w-24 h-24 rounded-full ${wash} opacity-60`} />
    </div>
  );
}

interface KpiGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}

const colMap = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
} as const;

export function KpiGrid({ children, cols = 4, className = '' }: KpiGridProps) {
  return <div className={`grid grid-cols-2 ${colMap[cols]} gap-4 ${className}`}>{children}</div>;
}
