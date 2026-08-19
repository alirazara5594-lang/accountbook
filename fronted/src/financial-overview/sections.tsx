import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Building2,
  Landmark,
  PieChart,
  BarChart3,
  Scale,
  Activity,
  Clock,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Users,
  CreditCard,
  Flame,
  Zap,
  Sparkles,
  FileText,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { money } from './format';
import type { FinancialData, TxnRow, AlertItem } from './useFinancialData';
import type { CurrencyCode } from './format';

/* ═══════════════════════════════════════════════════════════════
   PALETTE & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const C = {
  emerald: '#10b981',
  emeraldLight: '#34d399',
  rose: '#ef4444',
  roseLight: '#f87171',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  amber: '#f59e0b',
  amberLight: '#fbbf24',
  violet: '#8b5cf6',
  violetLight: '#a78bfa',
  teal: '#14b8a6',
  tealLight: '#2dd4bf',
  indigo: '#6366f1',
  slate: '#64748b',
};

const AGING_COLORS = [C.emerald, C.teal, C.amber, C.rose, '#991b1b'];
const AGING_STATUS = ['Current', '1-30d', '31-60d', '61-90d', '90d+'];
const AGING_CLS = ['up', 'up', 'warn', 'down', 'down'] as const;

const tipStyle = {
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 600,
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  boxShadow: 'var(--shadow-lg)',
  padding: '8px 12px',
};

/* ═══════════════════════════════════════════════════════════════
   SECTION CARD SHELL
   ═══════════════════════════════════════════════════════════════ */

export function SectionCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeCls,
  actions,
  children,
  className,
}: {
  icon: typeof DollarSign;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeCls?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`fcard section-card ${className || ''}`}>
      <div className="section-card-header">
        <div className="section-card-title-row">
          <span className="section-card-icon">
            <Icon className="w-4 h-4" />
          </span>
          <div>
            <h3 className="section-card-title">{title}</h3>
            {subtitle ? <p className="section-card-sub">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {badge ? <span className={`section-badge ${badgeCls || ''}`}>{badge}</span> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   1. HERO KPI CARD (Uniform 90px height)
   ═══════════════════════════════════════════════════════════════ */

export function HeroKPI({
  label,
  value,
  delta,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  delta: number | null;
  icon: typeof DollarSign;
  color: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="hero-kpi">
      <div className="hero-kpi-top">
        <span className="hero-kpi-label">{label}</span>
        <span className="hero-kpi-chip" style={{ background: `linear-gradient(135deg,${color},${color}bb)` }}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 mt-auto">
        <p className="hero-kpi-value">{value}</p>
        {delta !== null && delta !== undefined ? (
          <div className="hero-kpi-delta">
            {up ? (
              <span className="hero-delta-up">
                <ArrowUpRight className="w-3 h-3" /> {Math.abs(delta).toFixed(1)}%
              </span>
            ) : (
              <span className="hero-delta-down">
                <ArrowDownRight className="w-3 h-3" /> {Math.abs(delta).toFixed(1)}%
              </span>
            )}
          </div>
        ) : (
          <div className="hero-kpi-delta">
            <span className="hero-delta-neutral">—</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   2. EXECUTIVE HEALTH & RUNWAY COMMAND
   ═══════════════════════════════════════════════════════════════ */

export function ExecutiveHealthBar({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const { profitability: p, equation, workingCapital, cashBank, revenue, netProfit, controls } = data;

  // Calculate an Executive Health Score out of 100
  let score = 50;
  if (equation.balanced) score += 20;
  if (p.currentRatio >= 1.5) score += 10;
  else if (p.currentRatio >= 1.0) score += 5;
  if (p.netMargin > 15) score += 10;
  else if (p.netMargin > 0) score += 5;
  if (p.debtToEquity < 1.5) score += 5;
  if (controls.unpostedJournals === 0) score += 5;
  score = Math.min(100, Math.max(20, score));

  const monthlyBurn = Math.max(1, (revenue - netProfit) / 12);
  const runwayMonths = Math.min(99, Number((cashBank / monthlyBurn).toFixed(1)));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Financial Health Score */}
      <div className="fcard p-4 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Financial Health Index
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight">{score}/100</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {score >= 80 ? 'Optimal' : score >= 60 ? 'Healthy' : 'Attention'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {equation.balanced ? 'Ledger Balanced' : 'Unbalanced Ledger'} · Current Ratio {p.currentRatio.toFixed(2)}x
          </p>
        </div>
        <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-500">
          <span className="text-sm font-extrabold text-emerald-700">{score}%</span>
        </div>
      </div>

      {/* Net Working Capital & Runway */}
      <div className="fcard p-4 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-500" />
            Working Capital & Runway
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black tracking-tight">{money(workingCapital, currency)}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {runwayMonths > 0 ? `${runwayMonths} Mo. Runway` : 'Cash Neutral'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Cash on hand covers ~{runwayMonths} months operating expenses
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center">
          <Zap className="w-5 h-5" />
        </div>
      </div>

      {/* Governance & Audit Controls */}
      <div className="fcard p-4 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-violet-500" />
            Audit & Closing Controls
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">
              {controls.unpostedJournals === 0 ? 'All Journals Posted' : `${controls.unpostedJournals} Unposted Entries`}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                controls.unpostedJournals === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {controls.unpostedJournals === 0 ? 'Clean' : 'Pending'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            AR Recon: {money(controls.arRecon, currency)} · AP Recon: {money(controls.apRecon, currency)}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 grid place-items-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   3. REVENUE vs EXPENSES & NET PROFIT TREND (Dynamic Visual)
   ═══════════════════════════════════════════════════════════════ */

export function RevenueExpensesTrendChart({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const [viewMode, setViewMode] = useState<'area' | 'bar'>('area');
  const [range, setRange] = useState<2 | 3 | 4 | 5 | 6>(6);
  const series = data.series.slice(-range);

  const totalRev = series.reduce((s, x) => s + x.revenue, 0);
  const totalExp = series.reduce((s, x) => s + x.expense, 0);
  const totalProf = series.reduce((s, x) => s + x.profit, 0);
  const avgMargin = totalRev > 0 ? ((totalProf / totalRev) * 100).toFixed(1) : '0';

  return (
    <SectionCard
      icon={TrendingUp}
      title="Revenue, Expenses & Profit Trend"
      subtitle={`${range}-Month trajectory and operating performance`}
      actions={
        <div className="flex items-center gap-2">
          {/* Month range selector */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border">
            {[2, 3, 4, 5, 6].map((m) => (
              <button
                key={m}
                onClick={() => setRange(m as 2 | 3 | 4 | 5 | 6)}
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all ${
                  range === m ? 'bg-surface shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m}M
              </button>
            ))}
          </div>
          {/* View mode toggle */}
          <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('area')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                viewMode === 'area' ? 'bg-surface shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                viewMode === 'bar' ? 'bg-surface shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bars
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-2 mb-3 p-2.5 bg-muted/40 rounded-xl border border-border/60">
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{range}M Total Revenue</span>
          <p className="text-sm font-extrabold text-emerald-600">{money(totalRev, currency)}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">{range}M Total Expenses</span>
          <p className="text-sm font-extrabold text-rose-500">{money(totalExp, currency)}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Avg Net Margin</span>
          <p className="text-sm font-extrabold text-blue-600">{avgMargin}%</p>
        </div>
      </div>

      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: C.emerald }} /> Revenue
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: C.rose }} /> Expenses
        </span>
        <span className="legend-item">
          <span className="legend-dot" style={{ background: C.blue }} /> Net Profit
        </span>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        {viewMode === 'area' ? (
          <AreaChart data={series} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.emerald} stopOpacity={0.3} />
                <stop offset="100%" stopColor={C.emerald} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.rose} stopOpacity={0.2} />
                <stop offset="100%" stopColor={C.rose} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gProf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blue} stopOpacity={0.25} />
                <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: unknown) => money(Number(v), currency)} contentStyle={tipStyle} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.emerald} strokeWidth={2.5} fill="url(#gRev)" />
            <Area type="monotone" dataKey="expense" name="Expenses" stroke={C.rose} strokeWidth={2} fill="url(#gExp)" />
            <Area type="monotone" dataKey="profit" name="Net Profit" stroke={C.blue} strokeWidth={2} fill="url(#gProf)" />
          </AreaChart>
        ) : (
          <BarChart data={series} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: unknown) => money(Number(v), currency)} contentStyle={tipStyle} />
            <Bar dataKey="revenue" name="Revenue" fill={C.emerald} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expenses" fill={C.rose} radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name="Net Profit" fill={C.blue} radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   4. OPERATING CASH FLOW & LIQUIDITY (Compact Horizontal)
   ═══════════════════════════════════════════════════════════════ */

export function CashFlowCompact({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const { cashOpening, cashInflows: inflow, cashOutflows: outflow, cashClosing } = data;
  const net = inflow - outflow;

  const steps = [
    { label: 'Opening', value: cashOpening, color: C.slate },
    { label: 'Inflows', value: inflow, color: C.emerald, prefix: '+' },
    { label: 'Outflows', value: outflow, color: C.rose, prefix: '-' },
    { label: 'Net', value: net, color: net >= 0 ? C.emerald : C.rose, prefix: net >= 0 ? '+' : '' },
    { label: 'Closing', value: cashClosing, color: C.blue },
  ];

  return (
    <SectionCard
      icon={Wallet}
      title="Cash Flow Summary"
      badge={`${net >= 0 ? 'Positive' : 'Negative'} Flow`}
      badgeCls={net >= 0 ? 'badge-ok' : 'badge-danger'}
    >
      <div className="cf-compact-row">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="cf-compact-step">
              <span className="cf-compact-dot" style={{ background: s.color }} />
              <div>
                <p className="cf-compact-label">{s.label}</p>
                <p className="cf-compact-value" style={{ color: s.color }}>
                  {s.prefix}{money(s.value, currency)}
                </p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   5. ACCOUNTING EQUATION — EXECUTIVE VISUAL STATEMENT
   ═══════════════════════════════════════════════════════════════ */

export function AccountingEquationBar({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const { assets, liabilities, equity, balanced, difference } = data.equation;
  const total = Math.max(1, assets);
  const liabPct = Math.min(100, Math.max(5, (liabilities / total) * 100));
  const eqPct = Math.max(0, 100 - liabPct);

  return (
    <SectionCard
      icon={Scale}
      title="Accounting Equation & Balance Sheet Integrity"
      subtitle="Assets = Liabilities + Owner's Equity"
      badge={balanced ? 'Balanced & Reconciled' : 'Discrepancy Detected'}
      badgeCls={balanced ? 'badge-ok' : 'badge-danger'}
    >
      {/* Big Hero Equation Display */}
      <div className="eq-equation-row">
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#06b6d4' }}>Total Assets</span>
          <span className="eq-term eq-term-asset">{money(assets, currency)}</span>
        </div>
        <span className="eq-operator">=</span>
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#f97316' }}>Total Liabilities</span>
          <span className="eq-term eq-term-liab">{money(liabilities, currency)}</span>
        </div>
        <span className="eq-operator">+</span>
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: '#8b5cf6' }}>Owner's Equity</span>
          <span className="eq-term eq-term-eq">{money(equity, currency)}</span>
        </div>
      </div>

      {/* Proportional Comparative Bars */}
      <div className="eq-bars">
        <div className="eq-bar-row">
          <span className="eq-bar-label-side">Assets</span>
          <div className="eq-bar eq-bar-full">
            <div className="eq-seg eq-seg-assets">
              <span>Assets {money(assets, currency)} (100%)</span>
            </div>
          </div>
        </div>
        <div className="eq-bar-row">
          <span className="eq-bar-label-side">L + E</span>
          <div className="eq-bar eq-bar-split">
            <div className="eq-seg eq-seg-liab" style={{ width: `${liabPct}%` }}>
              <span>Liab {money(liabilities, currency)} ({liabPct.toFixed(0)}%)</span>
            </div>
            <div className="eq-seg eq-seg-eq" style={{ width: `${eqPct}%` }}>
              <span>Equity {money(equity, currency)} ({eqPct.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="eq-cards">
        <div className="eq-card eq-card-asset">
          <div className="eq-card-dot" style={{ background: 'linear-gradient(135deg,#14b8a6,#06b6d4)' }} />
          <div>
            <p className="eq-card-label">Current & Fixed Assets</p>
            <p className="eq-card-value">{money(assets, currency)}</p>
          </div>
        </div>
        <div className="eq-card eq-card-liab">
          <div className="eq-card-dot" style={{ background: 'linear-gradient(135deg,#f97316,#ef4444)' }} />
          <div>
            <p className="eq-card-label">Creditors & Debt Obligations</p>
            <p className="eq-card-value">{money(liabilities, currency)}</p>
          </div>
        </div>
        <div className="eq-card eq-card-eq">
          <div className="eq-card-dot" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }} />
          <div>
            <p className="eq-card-label">Share Capital & Retained P&L</p>
            <p className="eq-card-value">{money(equity, currency)}</p>
          </div>
        </div>
      </div>

      {!balanced && (
        <div className="eq-footer-alert">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Ledger variance: {money(difference, currency)} — Please verify trial balance & unposted journals.</span>
        </div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   6. EXECUTIVE FINANCIAL RATIOS MATRIX (Grouped & Benchmarked)
   ═══════════════════════════════════════════════════════════════ */

export function ExecutiveRatioMatrix({ data }: { data: FinancialData }) {
  const { profitability: p, avgDaysOutstanding, avgDaysPayable } = data;

  const ccc = Math.max(0, avgDaysOutstanding - avgDaysPayable + 15); // Cash Conversion Cycle approximation

  const ratioGroups = [
    {
      group: 'Liquidity & Solvency',
      icon: Landmark,
      color: C.blue,
      items: [
        { label: 'Current Ratio', value: `${p.currentRatio.toFixed(2)}x`, target: '> 1.5x', status: p.currentRatio >= 1.5 ? 'Optimal' : p.currentRatio >= 1.0 ? 'Acceptable' : 'Low', cls: p.currentRatio >= 1.5 ? 'text-emerald-600' : 'text-amber-600' },
        { label: 'Quick Ratio', value: `${p.quickRatio.toFixed(2)}x`, target: '> 1.0x', status: p.quickRatio >= 1.0 ? 'Optimal' : 'Watch', cls: p.quickRatio >= 1.0 ? 'text-emerald-600' : 'text-amber-600' },
        { label: 'Debt-to-Equity', value: `${p.debtToEquity.toFixed(2)}`, target: '< 1.5', status: p.debtToEquity < 1.5 ? 'Healthy' : 'High Debt', cls: p.debtToEquity < 1.5 ? 'text-emerald-600' : 'text-rose-600' },
        { label: 'Equity Ratio', value: `${p.equityRatio.toFixed(1)}%`, target: '> 40%', status: p.equityRatio >= 40 ? 'Solvent' : 'Leveraged', cls: p.equityRatio >= 40 ? 'text-emerald-600' : 'text-amber-600' },
      ],
    },
    {
      group: 'Profitability & Returns',
      icon: TrendingUp,
      color: C.emerald,
      items: [
        { label: 'Gross Margin', value: `${p.grossMargin.toFixed(1)}%`, target: '> 30%', status: p.grossMargin >= 30 ? 'Strong' : 'Moderate', cls: 'text-emerald-600' },
        { label: 'Operating Margin', value: `${p.operatingMargin.toFixed(1)}%`, target: '> 15%', status: p.operatingMargin >= 15 ? 'Optimal' : 'Thin', cls: 'text-teal-600' },
        { label: 'Net Profit Margin', value: `${p.netMargin.toFixed(1)}%`, target: '> 10%', status: p.netMargin >= 10 ? 'High' : 'Normal', cls: 'text-blue-600' },
        { label: 'Return on Equity (ROE)', value: `${p.roe.toFixed(1)}%`, target: '> 15%', status: p.roe >= 15 ? 'Superior' : 'Standard', cls: 'text-violet-600' },
      ],
    },
    {
      group: 'Operating Cycle & Efficiency',
      icon: Activity,
      color: C.amber,
      items: [
        { label: 'DSO (Receivables Days)', value: `${avgDaysOutstanding}d`, target: '< 45d', status: avgDaysOutstanding <= 45 ? 'Fast' : 'Overdue Risk', cls: avgDaysOutstanding <= 45 ? 'text-emerald-600' : 'text-amber-600' },
        { label: 'DPO (Payables Days)', value: `${avgDaysPayable}d`, target: '30-60d', status: 'Managed', cls: 'text-indigo-600' },
        { label: 'Cash Conversion (CCC)', value: `${ccc}d`, target: '< 40d', status: ccc < 45 ? 'Efficient' : 'Extended', cls: 'text-blue-600' },
        { label: 'Working Capital Coverage', value: `${(data.workingCapital / (data.revenue || 1) * 100).toFixed(1)}%`, target: '> 20%', status: 'Adequate', cls: 'text-teal-600' },
      ],
    },
  ];

  return (
    <SectionCard
      icon={BarChart3}
      title="Executive Financial Ratio Intelligence"
      subtitle="Comprehensive liquidity, profitability, and operational performance standards"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ratioGroups.map((group) => (
          <div key={group.group} className="p-3.5 rounded-xl border border-border/80 bg-surface space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <span className="p-1.5 rounded-lg" style={{ background: `${group.color}15`, color: group.color }}>
                <group.icon className="w-4 h-4" />
              </span>
              <span className="text-xs font-extrabold text-foreground uppercase tracking-wide">{group.group}</span>
            </div>
            <div className="space-y-2.5">
              {group.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">Target: {item.target}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-sm ${item.cls}`}>{item.value}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. RECEIVABLES & PAYABLES AGING COMMAND
   ═══════════════════════════════════════════════════════════════ */

export function AgingSection({
  title,
  subtitle,
  avgDays,
  aging,
  overdueAmount,
  currency,
}: {
  title: string;
  subtitle: string;
  avgDays: number;
  aging: { name: string; value: number }[];
  overdueAmount?: number;
  currency: CurrencyCode;
}) {
  const totalVal = aging.reduce((s, a) => s + a.value, 0) || 1;

  return (
    <SectionCard
      icon={Clock}
      title={title}
      subtitle={subtitle}
      badge={`${avgDays} Days Avg`}
      badgeCls={avgDays > 45 ? 'badge-warn' : 'badge-ok'}
    >
      <div className="aging-grid">
        {aging.map((bucket, i) => {
          const pct = (bucket.value / totalVal) * 100;
          return (
            <div key={bucket.name} className="aging-col">
              <span className={`aging-pill ${AGING_CLS[i]}`}>{AGING_STATUS[i]}</span>
              <p className="aging-bucket-name">{bucket.name}</p>
              <p className="aging-bucket-value">{money(bucket.value, currency)}</p>
              <p className="aging-bucket-pct">{pct.toFixed(0)}%</p>
              <div className="aging-bar-bg">
                <div className="aging-bar-fill" style={{ width: `${Math.min(100, pct)}%`, background: AGING_COLORS[i] }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="aging-total">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground">Total Book Value</span>
          {overdueAmount && overdueAmount > 0 ? (
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {money(overdueAmount, currency)} Overdue
            </span>
          ) : null}
        </div>
        <span className="aging-total-val">{money(totalVal, currency)}</span>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   8. COMMERCIAL CONCENTRATION: TOP CUSTOMERS & VENDORS
   ═══════════════════════════════════════════════════════════════ */

export function CommercialConcentration({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const topCust = data.topCustomers.slice(0, 4);
  const topVend = data.topVendors.slice(0, 4);
  const maxCust = topCust.length ? Math.max(...topCust.map((c) => c.value)) : 1;
  const maxVend = topVend.length ? Math.max(...topVend.map((v) => v.value)) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* Top Customers */}
      <SectionCard icon={Users} title="Top Revenue Contributors" subtitle="Key customer accounts by total billed volume">
        <div className="space-y-3">
          {topCust.length > 0 ? (
            topCust.map((c, i) => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="truncate max-w-[200px] text-foreground">
                    <span className="text-muted-foreground mr-1.5 font-bold">#{i + 1}</span>
                    {c.name}
                  </span>
                  <span className="font-extrabold text-emerald-600">{money(c.value, currency)}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(c.value / (maxCust || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No customer invoices posted yet.</p>
          )}
        </div>
      </SectionCard>

      {/* Top Vendors */}
      <SectionCard icon={CreditCard} title="Top Supplier Obligations" subtitle="Key procurement and vendor spend exposure">
        <div className="space-y-3">
          {topVend.length > 0 ? (
            topVend.map((v, i) => (
              <div key={v.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="truncate max-w-[200px] text-foreground">
                    <span className="text-muted-foreground mr-1.5 font-bold">#{i + 1}</span>
                    {v.name}
                  </span>
                  <span className="font-extrabold text-rose-500">{money(v.value, currency)}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${(v.value / (maxVend || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No supplier bills posted yet.</p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   9. TOP EXPENSE CATEGORIES BREAKDOWN
   ═══════════════════════════════════════════════════════════════ */

export function ExpenseDistributionCard({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const expenses = data.topExpenses.slice(0, 5);
  const totalExp = expenses.reduce((s, e) => s + e.value, 0) || 1;

  const COLORS = [C.rose, C.amber, C.violet, C.blue, C.teal];

  return (
    <SectionCard
      icon={PieChart}
      title="Operating Cost Center Breakdown"
      subtitle="Primary expenditure distribution by general ledger category"
    >
      <div className="space-y-3">
        {expenses.length > 0 ? (
          expenses.map((e, idx) => {
            const pct = ((e.value / totalExp) * 100).toFixed(1);
            return (
              <div key={e.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                    <span className="text-foreground truncate max-w-[200px]">{e.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px] font-bold">{pct}%</span>
                    <span className="font-extrabold text-foreground">{money(e.value, currency)}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: COLORS[idx % COLORS.length] }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-xs text-muted-foreground py-4 text-center">No recorded general expenses.</p>
        )}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   10. EXECUTIVE RISK & AUDIT ALERTS
   ═══════════════════════════════════════════════════════════════ */

const ALERT_SEV: Record<string, { dot: string; bg: string; label: string; badgeCls: string }> = {
  critical: { dot: '#dc2626', bg: '#fef2f2', label: 'Critical Risk', badgeCls: 'badge-danger' },
  warning: { dot: '#f59e0b', bg: '#fffbeb', label: 'Warning', badgeCls: 'badge-warn' },
  info: { dot: '#3b82f6', bg: '#eff6ff', label: 'FY Notice', badgeCls: 'badge-info' },
  success: { dot: '#10b981', bg: '#ecfdf5', label: 'All Clear', badgeCls: 'badge-ok' },
};

export function ExecutiveRiskAlerts({
  alerts,
  setPage,
}: {
  alerts: AlertItem[];
  setPage: (p: string) => void;
}) {
  if (!alerts.length) return null;

  return (
    <SectionCard
      icon={AlertTriangle}
      title="Financial Risk & Compliance Radar"
      subtitle="Active alerts, pending compliance milestones and ledger signals"
      badge={`${alerts.length} Flagged`}
      badgeCls={alerts.some((a) => a.severity === 'critical') ? 'badge-danger' : 'badge-warn'}
    >
      <div className="alert-list">
        {alerts.map((a) => {
          const sev = ALERT_SEV[a.severity] || ALERT_SEV.info;
          return (
            <div
              key={a.id}
              onClick={() => a.page && setPage(a.page)}
              className="alert-row cursor-pointer hover:shadow-xs transition-all"
              style={{ background: sev.bg }}
            >
              <span className="alert-dot" style={{ background: sev.dot }} />
              <div className="alert-body">
                <p className="alert-title">{a.title}</p>
                <p className="alert-detail">{a.detail}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className={`section-badge ${sev.badgeCls}`}>{sev.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   11. LIVE RECENT ACTIVITY & AUDIT LOG
   ═══════════════════════════════════════════════════════════════ */

export function LiveActivityAuditFeed({
  txns,
  currency,
  setPage,
}: {
  txns: TxnRow[];
  currency: CurrencyCode;
  setPage: (p: string) => void;
}) {
  if (!txns.length) return null;

  return (
    <SectionCard
      icon={Activity}
      title="Recent Live Financial Movements"
      subtitle="Real-time transaction stream across accounts"
      actions={
        <button
          onClick={() => setPage('Banking & Payments.Transactions')}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          View Full Journal <ChevronRight className="w-3 h-3" />
        </button>
      }
    >
      <div className="activity-list">
        {txns.slice(0, 5).map((t, i) => (
          <div key={i} className="activity-row">
            <span className={`activity-type-chip ${t.type === 'IN' ? 'type-in' : 'type-out'}`}>
              {t.type === 'IN' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            </span>
            <div className="activity-body">
              <p className="activity-party">{t.party}</p>
              <p className="activity-meta">
                {t.category} · Ref: <span className="font-mono">{t.ref}</span> · {t.date}
              </p>
            </div>
            <div className="activity-right">
              <p className={`activity-amount ${t.type === 'IN' ? 'amt-in' : 'amt-out'}`}>
                {t.type === 'IN' ? '+' : '-'}
                {money(t.amount, currency)}
              </p>
              <p className="activity-status">
                <span className={`activity-status-dot ${t.status === 'Paid' || t.status === 'Reconciled' ? 'st-ok' : 'st-wait'}`} />
                {t.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   12. COMPANY & GROUP VITAL SNAPSHOT
   ═══════════════════════════════════════════════════════════════ */

export function CompanySnapshot({ data }: { data: FinancialData }) {
  const { counts, controls } = data;
  const items = [
    { label: 'Active Customers', value: counts.customers, color: C.blue, icon: Users },
    { label: 'Approved Vendors', value: counts.vendors, color: C.violet, icon: CreditCard },
    { label: 'Bank Accounts', value: counts.banks, color: C.teal, icon: Landmark },
    { label: 'Product Catalog', value: counts.products, color: C.emerald, icon: Building2 },
    { label: 'Headcount', value: counts.employees, color: C.amber, icon: Users },
    { label: 'Fiscal Invoices', value: counts.invoices, color: C.rose, icon: FileText },
    { label: 'Branches / Entities', value: counts.branches, color: C.indigo, icon: Building2 },
    { label: 'Open Journals', value: controls.unpostedJournals, color: C.slate, icon: Activity },
  ];

  return (
    <SectionCard
      icon={Building2}
      title="Enterprise Vital Signs"
      subtitle="Operational capacity, entities and master catalog footprint"
    >
      <div className="snapshot-grid">
        {items.map((item) => (
          <div key={item.label} className="snapshot-chip">
            <span className="p-1.5 rounded-lg" style={{ background: `${item.color}15`, color: item.color }}>
              <item.icon className="w-3.5 h-3.5" />
            </span>
            <div>
              <p className="snapshot-value">{item.value}</p>
              <p className="snapshot-label">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUICK ADD SPEED DIAL
   ═══════════════════════════════════════════════════════════════ */

export function QuickAdd({ setPage }: { setPage: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const actions = [
    { label: 'Customer Invoice', page: 'Sales & Customers.Sales Workspace' },
    { label: 'Customer Receipt', page: 'Sales & Customers.Customer Payments' },
    { label: 'Vendor Bill', page: 'Procurement.Bills' },
    { label: 'Vendor Payment', page: 'Procurement.Vendor Payments' },
    { label: 'Journal Entry', page: 'Accounting.Journal Entries' },
    { label: 'Sales Order', page: 'Sales & Customers.Sales Orders' },
    { label: 'Purchase Order', page: 'Procurement.Procurement Workspace' },
    { label: 'Bank Transaction', page: 'Banking & Payments.Transactions' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="fcard quick-add-menu animate-in fade-in zoom-in-95 duration-100">
          <div className="quick-add-header">Quick Create Document</div>
          <div className="quick-add-list">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  setOpen(false);
                  setPage(a.page);
                }}
                className="quick-add-item"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="quick-add-fab"
        title="Quick Actions"
      >
        {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
}
