import React from 'react';
import { PageHeader } from './ui/page-header';
import { StatCard } from './ui/stat-card';
import { Card } from './ui/card';

interface Stat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone: 'teal' | 'blue' | 'green' | 'amber' | 'violet' | 'cyan' | 'red';
}

interface ModuleSummaryLayoutProps {
  title: string;
  description: string;
  actions?: React.ReactNode;
  stats: Stat[];
  children?: React.ReactNode;
}

export function ModuleSummaryLayout({ title, description, actions, stats, children }: ModuleSummaryLayoutProps) {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title={title} description={description} actions={actions} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <StatCard key={i} icon={s.icon} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </div>
      {children && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{children}</div>
      )}
    </div>
  );
}

export function SummaryPanel({ icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  const Icon = icon;
  return (
    <Card className="p-4 space-y-3">
      <p className="text-xs font-bold flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {title}
      </p>
      {children}
    </Card>
  );
}