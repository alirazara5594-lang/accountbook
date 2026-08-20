import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

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
        <div className="flex items-center gap-1.5 shrink-0">
          {trendType === 'up' && <TrendingUp className="w-3.5 h-3.5 shrink-0" style={{ color: trendColor }} />}
          {trendType === 'down' && <TrendingDown className="w-3.5 h-3.5 shrink-0" style={{ color: trendColor }} />}
          {trendType === 'neutral' && <Minus className="w-3.5 h-3.5 shrink-0" style={{ color: trendColor }} />}
          <span className="text-[11px] font-bold shrink-0" style={{ color: trendColor }}>{change}</span>
          {sub && <span className="text-[9px] text-[var(--color-text-subtle)] truncate">{sub}</span>}
        </div>
        {sparkline && sparkline.length > 0 && (
          <div className="w-20 h-8 shrink-0 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`spark-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#spark-${label.replace(/\s/g, '')})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom accent bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
}
