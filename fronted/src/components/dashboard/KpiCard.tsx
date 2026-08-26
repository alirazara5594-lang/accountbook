import { KpiCard as AmsKpiCard } from '../ui/kpi-card';

interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change: string;
  trendType: 'up' | 'down' | 'neutral';
  sub?: string;
  sparkline?: { value: number }[];
  className?: string;
}

/**
 * Dashboard KPI — thin adapter over the AMS Signature KpiCard.
 * Keeps the historical dashboard props so all summary pages inherit
 * the Ledger Rail + Diamond chip design automatically.
 */
export function KpiCard({ label, value, icon, color, change, trendType, sub, sparkline, className = '' }: KpiCardProps) {
  return (
    <AmsKpiCard
      icon={icon}
      label={label}
      value={value}
      color={color}
      trend={{ change: sub ? `${change} ${sub}` : change, trendType }}
      sparkline={sparkline?.map((p) => p.value)}
      className={className}
    />
  );
}
