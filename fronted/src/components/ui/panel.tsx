import React from 'react';

interface PanelProps {
  title: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * AMS Signature Panel — unified section container.
 * Header bar (title + meta + actions) + body. Used for every table/list section.
 */
export function Panel({ title, meta, actions, children, className = '', bodyClassName = '' }: PanelProps) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-3.5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-strong)]">{title}</p>
        <div className="flex items-center gap-2">
          {meta && <span className="text-[11px] text-[var(--color-text-muted)]">{meta}</span>}
          {actions}
        </div>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
