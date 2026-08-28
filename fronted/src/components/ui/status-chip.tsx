export type StatusPreset =
  | 'draft' | 'pending' | 'posted' | 'paid' | 'partial' | 'overdue'
  | 'cancelled' | 'active' | 'inactive' | 'approved' | 'rejected' | 'open' | 'closed' | 'sent' | 'converted';

const PRESETS: Record<StatusPreset, { label: string; hex: string; live?: boolean }> = {
  draft:     { label: 'Draft',     hex: '#94a3b8' },
  pending:   { label: 'Pending',   hex: '#f59e0b', live: true },
  sent:      { label: 'Sent',      hex: '#3b82f6' },
  posted:    { label: 'Posted',    hex: '#10b981' },
  approved:  { label: 'Approved',  hex: '#10b981' },
  paid:      { label: 'Paid',      hex: '#10b981' },
  converted: { label: 'Converted', hex: '#8b5cf6' },
  partial:   { label: 'Partial',   hex: '#f59e0b' },
  open:      { label: 'Open',      hex: '#3b82f6' },
  overdue:   { label: 'Overdue',   hex: '#f43f5e', live: true },
  rejected:  { label: 'Rejected',  hex: '#ef4444' },
  cancelled: { label: 'Cancelled', hex: '#ef4444' },
  inactive:  { label: 'Inactive',  hex: '#94a3b8' },
  closed:    { label: 'Closed',    hex: '#94a3b8' },
  active:    { label: 'Active',    hex: '#10b981', live: true },
};

interface StatusChipProps {
  status: StatusPreset | string;
  label?: string;
  hex?: string;
  className?: string;
}

/**
 * AMS Signature Status Chip — tinted pill with a status dot.
 * "Live" statuses (pending/overdue/active) get a breathing pulse.
 */
export function StatusChip({ status, label, hex, className = '' }: StatusChipProps) {
  const key = String(status).toLowerCase().trim() as StatusPreset;
  const preset = PRESETS[key];
  const color = hex ?? preset?.hex ?? '#94a3b8';
  const text = label ?? preset?.label ?? String(status);
  const live = preset?.live ?? false;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${className}`}
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
        color,
      }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? 'animate-pulse' : ''}`}
        style={{ background: color }}
      />
      {text}
    </span>
  );
}
