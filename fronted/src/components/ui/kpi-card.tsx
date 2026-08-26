import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type KpiTone = 'blue' | 'indigo' | 'emerald' | 'green' | 'amber' | 'orange' | 'purple' | 'violet' | 'rose' | 'red' | 'teal' | 'cyan';

/** Single source of truth — every KPI visual derives from this hex. */
export const TONE_HEX: Record<KpiTone, string> = {
  blue: '#3b82f6',
  indigo: '#6366f1',
  emerald: '#10b981',
  green: '#22c55e',
  amber: '#f59e0b',
  orange: '#f97316',
  purple: '#a855f7',
  violet: '#8b5cf6',
  rose: '#f43f5e',
  red: '#ef4444',
  teal: '#14b8a6',
  cyan: '#06b6d4',
};

const toneFromHex = (hex: string): KpiTone => {
  const entry = (Object.entries(TONE_HEX) as [KpiTone, string][]).find(([, v]) => v.toLowerCase() === hex.toLowerCase());
  return entry?.[0] ?? 'blue';
};

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const W = 64, H = 22, P = 2;
  const coords = points.map((v, i) => [
    P + (i / (points.length - 1)) * (W - P * 2),
    H - P - ((v - min) / range) * (H - P * 2),
  ]);
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L ');
  return (
    <svg className="h-5 w-16 shrink-0 overflow-visible opacity-70" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={`M ${line} L ${W - P},${H} L ${P},${H} Z`} fill={color} fillOpacity={0.12} />
      <path d={`M ${line}`} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface KpiCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  desc?: React.ReactNode;
  /** Named tone — or pass `color` hex for custom module DNA. */
  tone?: KpiTone | (string & {});
  /** Raw hex color (module DNA). Overrides tone. */
  color?: string;
  /** Optional trend row: change text + direction. */
  trend?: { change: React.ReactNode; trendType: 'up' | 'down' | 'neutral' };
  /** Optional sparkline values rendered next to the trend. */
  sparkline?: number[];
  className?: string;
}

/**
 * AMS Signature KPI Card — "Ledger Rail" edition.
 * Left gradient rail + diamond icon chip. Uniform across every AMS module.
 */
export function KpiCard({ icon: Icon, label, value, desc, tone = 'blue', color, trend, sparkline, className = '' }: KpiCardProps) {
  const hex = color ?? TONE_HEX[(tone as KpiTone) in TONE_HEX ? (tone as KpiTone) : toneFromHex(String(tone))] ?? TONE_HEX.blue;

  const trendColor =
    trend?.trendType === 'up' ? 'var(--color-success)'
    : trend?.trendType === 'down' ? 'var(--color-danger)'
    : 'var(--color-text-muted)';
  const TrendIcon = trend?.trendType === 'up' ? TrendingUp : trend?.trendType === 'down' ? TrendingDown : Minus;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 pl-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${trend ? 'min-h-[124px]' : 'min-h-[96px]'} ${className}`}>
      {/* AMS Signature: Ledger Rail */}
      <span
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
        style={{ background: `linear-gradient(180deg, ${hex}, color-mix(in srgb, ${hex} 25%, transparent))` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
          <p className="mt-1.5 truncate text-xl font-extrabold leading-tight tracking-tight text-[var(--color-text-strong)]">{value}</p>
          {desc && !trend && <p className="mt-1 truncate text-[11px] text-[var(--color-text-muted)]">{desc}</p>}
        </div>
        {/* AMS Signature: Diamond icon chip */}
        <div className="relative mt-0.5 h-9 w-9 shrink-0">
          <div
            className="absolute inset-[3px] rotate-45 rounded-[9px] shadow-lg transition-transform duration-200 group-hover:rotate-[50deg]"
            style={{ background: `linear-gradient(135deg, ${hex}, color-mix(in srgb, ${hex} 60%, #1e1b4b))` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>

      {trend && (
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--color-border-subtle)] pt-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <TrendIcon className="h-3.5 w-3.5 shrink-0" style={{ color: trendColor }} />
            <span className="truncate text-[11px] font-bold" style={{ color: trendColor }}>{trend.change}</span>
          </div>
          {sparkline && sparkline.length >= 2 && <Sparkline points={sparkline} color={hex} />}
        </div>
      )}

      {/* Ambient wash */}
      <div
        className="pointer-events-none absolute -bottom-5 -right-5 h-24 w-24 rounded-full opacity-[0.08]"
        style={{ background: hex }}
      />
    </div>
  );
}

interface KpiGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const colMap = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
} as const;

export function KpiGrid({ children, cols = 4, className = '' }: KpiGridProps) {
  return <div className={`grid grid-cols-2 ${colMap[cols]} gap-4 ${className}`}>{children}</div>;
}
