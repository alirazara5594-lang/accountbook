import React from 'react';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}

/** AMS Signature empty state — diamond icon, title, hint, optional CTA. */
export function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="relative mb-1 h-12 w-12">
        <div className="absolute inset-[6px] rotate-45 rounded-[10px] bg-[var(--color-surface-muted)] border border-[var(--color-border)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="h-5 w-5 text-[var(--color-text-muted)]" />
        </div>
      </div>
      <p className="text-sm font-bold text-[var(--color-text-strong)]">{title}</p>
      {hint && <p className="max-w-sm text-xs text-[var(--color-text-muted)]">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** AMS Signature loading skeleton — shimmering rows matching table density. */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-lg bg-[var(--color-surface-muted)]"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
