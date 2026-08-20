import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change: string;
  trendType: 'up' | 'down' | 'neutral';
  sub?: string;
  sparkline?: { value: number }[];
  className?: string;
}

function Sparkline({ data, color }: { data: { value: number }[]; color: string }) {
  const values = data.map((d) => d.value);
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 80;
  const H = 30;
  const P = 2;
  const usableW = W - P * 2;
  const usableH = H - P * 2;
  const points = values.map((v, i) => {
    const x = P + (i / (values.length - 1)) * usableW;
    const y = H - P - ((v - min) / range) * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const lineD = `M ${points.join(' L ')}`;
  const areaD = `M ${points[0]} L ${points.join(' L ')} L ${(W - P).toFixed(1)},${H.toFixed(1)} L ${P},${H.toFixed(1)} Z`;
  return (
    <svg className="w-20 h-8 shrink-0 overflow-visible" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={areaD} fill={color} fillOpacity={0.15} />
      <path d={lineD} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiCard({ label, value, icon: Icon, color, change, trendType, sub, sparkline, className = '' }: KpiCardProps) {
  const trendColor = trendType === 'up' ? 'var(--color-success)' : trendType === 'down' ? 'var(--color-danger)' : 'var(--color-text-muted)';

  return (
    <div className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[140px] relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className}`}>
      {/* Top: Icon + Label */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] truncate">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {/* Value */}
      <p className="text-xl font-black text-[var(--color-text-strong)] tracking-tight truncate">{value}</p>

      {/* Trend + Sparkline Row */}
      <div className="flex items-end justify-between mt-2 gap-2">
        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
          {trendType === 'up' && <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: trendColor }} />}
          {trendType === 'down' && <TrendingDown className="w-3.5 h-3.5 shrink-0" style={{ color: trendColor }} />}
          {trendType === 'neutral' && <Minus className="w-3.5 h-3.5 shrink-0" style={{ color: trendColor }} />}
          <span className="text-[11px] font-bold shrink-0" style={{ color: trendColor }}>{change}</span>
          {sub && <span className="text-[9px] text-[var(--color-text-subtle)] truncate">{sub}</span>}
        </div>
        {sparkline && sparkline.length > 0 && (
          <div className="shrink-0" style={{ opacity: 0.7 }}>
            <Sparkline data={sparkline} color={color} />
          </div>
        )}
      </div>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
}