import { useState, type ReactNode } from 'react';
import {
  TrendingUp,
  Wallet,
  Receipt,
  Building2,
  Users,
  Truck,
  Landmark,
  Boxes,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  Scale,
  HandCoins,
  CreditCard,
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle2,
  Package,
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Plus,
  X,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { money, num, pct, fmtDate, CHART_COLORS } from './format';
import type { FinancialData, SliceDatum, SeriesPoint, TxnRow } from './useFinancialData';
import type { CurrencyCode } from './format';

/* ───────────────────────────────────────────── shared shell ───────────────────────────────────────────── */

export function Card({
  title,
  icon,
  action,
  children,
  className = '',
}: {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1.5 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 min-w-0">
          {icon}
          <span className="truncate">{title}</span>
        </h3>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <div className="py-6 text-center text-[11px] text-gray-400">{children}</div>;
}

function DeltaChip({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-[9px] font-bold text-gray-400">—</span>;
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black ${
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
      }`}
    >
      {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function Spark({ points, color }: { points: number[]; color: string }) {
  if (!points.length) return null;
  const data = points.slice(-10).map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={24}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace('#', '')})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const tooltipStyle = { borderRadius: 8, fontSize: 10, border: '1px solid #e2e8f0' };

/* ───────────────────────────────────────────── KPI strip ───────────────────────────────────────────── */

export function KpiStrip({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const revenueSpark = data.salesMonthly.map((m) => m.amount);
  const profitSpark = data.series.map((s) => s.profit);
  const cashSpark = data.recentTxns.filter((t) => t.category === 'Bank').map((t) => t.amount);
  const arSpark = data.arAging.map((a) => a.value);
  const apSpark = data.apAging.map((a) => a.value);

  const cards: {
    label: string;
    value: string;
    icon: ReactNode;
    cls: string;
    bar: string;
    delta: number | null;
    spark: number[];
    color: string;
    sub: string;
  }[] = [
    {
      label: 'Cash & Bank',
      value: money(data.cashBank, currency),
      icon: <Wallet className="w-3.5 h-3.5" />,
      cls: 'bg-cyan-50 text-cyan-600',
      bar: 'bg-cyan-500',
      delta: data.kpiDeltas.cashBank,
      spark: cashSpark,
      color: '#0891b2',
      sub: 'vs last month',
    },
    {
      label: 'Revenue',
      value: money(data.revenue, currency),
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      cls: 'bg-blue-50 text-blue-600',
      bar: 'bg-blue-500',
      delta: data.kpiDeltas.revenue,
      spark: revenueSpark,
      color: '#2563eb',
      sub: 'vs last month',
    },
    {
      label: 'Gross Profit',
      value: money(data.grossProfit, currency),
      icon: <Target className="w-3.5 h-3.5" />,
      cls: 'bg-indigo-50 text-indigo-600',
      bar: 'bg-indigo-500',
      delta: data.kpiDeltas.grossProfit,
      spark: profitSpark,
      color: '#6366f1',
      sub: 'vs last month',
    },
    {
      label: 'Net Profit',
      value: money(data.netProfit, currency),
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      cls: 'bg-emerald-50 text-emerald-600',
      bar: 'bg-emerald-500',
      delta: data.kpiDeltas.netProfit,
      spark: profitSpark,
      color: '#10b981',
      sub: 'vs last month',
    },
    {
      label: 'Customers Receivable',
      value: money(data.arTotal, currency),
      icon: <HandCoins className="w-3.5 h-3.5" />,
      cls: 'bg-violet-50 text-violet-600',
      bar: 'bg-violet-500',
      delta: data.kpiDeltas.arTotal,
      spark: arSpark,
      color: '#8b5cf6',
      sub: 'total outstanding',
    },
    {
      label: 'Vendor Payables',
      value: money(data.apTotal, currency),
      icon: <CreditCard className="w-3.5 h-3.5" />,
      cls: 'bg-amber-50 text-amber-600',
      bar: 'bg-amber-500',
      delta: data.kpiDeltas.apTotal,
      spark: apSpark,
      color: '#f59e0b',
      sub: 'total due',
    },
    {
      label: 'Inventory Value',
      value: money(data.inventoryValue, currency),
      icon: <Boxes className="w-3.5 h-3.5" />,
      cls: 'bg-rose-50 text-rose-600',
      bar: 'bg-rose-500',
      delta: data.kpiDeltas.inventoryValue,
      spark: data.stockStatus.map((s) => s.value),
      color: '#f43f5e',
      sub: `${num(data.stockItems)} SKUs`,
    },
    {
      label: 'Net Working Capital',
      value: money(data.workingCapital, currency),
      icon: <Building2 className="w-3.5 h-3.5" />,
      cls: 'bg-slate-100 text-slate-700',
      bar: 'bg-slate-700',
      delta: data.kpiDeltas.workingCapital,
      spark: data.series.map((s) => s.profit),
      color: '#475569',
      sub: 'assets − liabilities',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((k, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm px-3 pt-2.5 pb-2 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500 truncate">{k.label}</span>
            <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${k.cls}`}>{k.icon}</span>
          </div>
          <p className="text-[15px] font-black text-gray-900 mt-1 truncate">{k.value}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <DeltaChip value={k.delta} />
            <span className="text-[9px] text-gray-400 font-medium">{k.sub}</span>
          </div>
          <div className="mt-1 -mx-1">
            <Spark points={k.spark} color={k.color} />
          </div>
          <div className={`absolute bottom-0 left-0 h-0.5 ${k.bar} ${i % 2 ? 'w-1/2' : 'w-full'}`} />
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────── Performance (Rev vs Exp vs Profit) ───────────────────────────────────────────── */

type Granularity = 'Monthly' | 'Quarterly' | 'Yearly';

function aggregate(series: SeriesPoint[], g: Granularity): SeriesPoint[] {
  if (g === 'Monthly') return series;
  if (g === 'Yearly') {
    const t = series.reduce(
      (a, s) => ({ revenue: a.revenue + s.revenue, expense: a.expense + s.expense, profit: a.profit + s.profit }),
      { revenue: 0, expense: 0, profit: 0 },
    );
    return [{ label: 'FY', ...t }];
  }
  const out: SeriesPoint[] = [];
  for (let i = 0; i < 12; i += 3) {
    const chunk = series.slice(i, i + 3);
    out.push({
      label: `Q${i / 3 + 1}`,
      revenue: chunk.reduce((a, s) => a + s.revenue, 0),
      expense: chunk.reduce((a, s) => a + s.expense, 0),
      profit: chunk.reduce((a, s) => a + s.profit, 0),
    });
  }
  return out;
}

export function PerformancePanel({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const [granularity, setGranularity] = useState<Granularity>('Monthly');
  const chart = aggregate(data.series, granularity);

  return (
    <Card
      title="Revenue vs Expenses vs Profit"
      icon={<BarChart3 className="w-3.5 h-3.5 text-blue-600" />}
      className="lg:col-span-2"
      action={
        <select
          value={granularity}
          onChange={(e) => setGranularity(e.target.value as Granularity)}
          className="h-6 text-[10px] font-semibold border border-slate-200 rounded-lg bg-white text-slate-600 px-1.5 outline-none"
        >
          <option>Monthly</option>
          <option>Quarterly</option>
          <option>Yearly</option>
        </select>
      }
    >
      <div className="flex items-center gap-3 text-[9px] font-bold mb-1">
        <span className="flex items-center gap-1 text-blue-700">
          <span className="w-2 h-2 rounded-sm bg-blue-600" /> Revenue
        </span>
        <span className="flex items-center gap-1 text-rose-700">
          <span className="w-2 h-2 rounded-sm bg-rose-400" /> Expenses
        </span>
        <span className="flex items-center gap-1 text-emerald-700">
          <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Profit
        </span>
      </div>
      {chart.every((c) => c.revenue === 0 && c.expense === 0) ? (
        <EmptyNote>No sales or bills recorded this financial year.</EmptyNote>
      ) : (
        <ResponsiveContainer width="100%" height={230}>
          <ComposedChart data={chart} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 9, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: unknown) => `${(Number(value) / 1000).toFixed(0)}k`}
            />
            <Tooltip formatter={(value: unknown) => money(Number(value), currency)} contentStyle={tooltipStyle} />
            <Bar dataKey="revenue" fill="#2563eb" radius={[3, 3, 0, 0]} name="Revenue" isAnimationActive={false} />
            <Bar dataKey="expense" fill="#fb7185" radius={[3, 3, 0, 0]} name="Expenses" isAnimationActive={false} />
            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} name="Profit" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

/* ───────────────────────────────────────────── Cash flow ───────────────────────────────────────────── */

export function CashFlowPanel({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const totalSplit = data.cashFlowSplit.reduce((a, s) => a + s.value, 0);
  return (
    <Card title="Cash Flow Overview" icon={<Wallet className="w-3.5 h-3.5 text-cyan-600" />}>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {[
          { label: 'Opening', value: data.cashOpening, cls: 'text-slate-700' },
          { label: 'Inflows', value: data.cashInflows, cls: 'text-emerald-600' },
          { label: 'Outflows', value: data.cashOutflows, cls: 'text-rose-600' },
          { label: 'Closing', value: data.cashClosing, cls: 'text-blue-700' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5">
            <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`text-[11px] font-black truncate ${s.cls}`}>{money(s.value, currency)}</p>
          </div>
        ))}
      </div>
      {totalSplit > 0 ? (
        <div className="flex items-center gap-3">
          <ResponsiveContainer width="55%" height={130}>
            <PieChart>
              <Pie data={data.cashFlowSplit} dataKey="value" nameKey="name" innerRadius={34} outerRadius={54} paddingAngle={2} isAnimationActive={false}>
                {data.cashFlowSplit.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: unknown) => money(Number(value), currency)} contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">
            {data.cashFlowSplit.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                  <span className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  {s.name}
                </span>
                <span className="text-[10px] font-bold text-gray-800">
                  {pct(totalSplit > 0 ? (s.value / totalSplit) * 100 : 0, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyNote>No cash activity this financial year.</EmptyNote>
      )}
    </Card>
  );
}

/* ───────────────────────────────────────────── Profit & Loss ───────────────────────────────────────────── */

export function ProfitLossPanel({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  return (
    <Card title="Profit & Loss" icon={<Receipt className="w-3.5 h-3.5 text-indigo-600" />}>
      <div className="space-y-1">
        {data.pnl.map((r, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-2 py-1 rounded-md text-[11px] ${
              r.strong ? 'bg-slate-50 border border-slate-100 font-black text-gray-900' : 'text-slate-600'
            }`}
          >
            <span className={r.negative ? 'text-rose-600' : ''}>{r.label}</span>
            <span className={`${r.negative ? 'text-rose-600' : 'text-gray-800'} font-bold`}>{money(r.value, currency)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-2 gap-1.5">
        <div className="text-center bg-emerald-50 border border-emerald-100 rounded-lg py-1.5">
          <p className="text-[8px] font-bold uppercase text-emerald-700">Gross Margin</p>
          <p className="text-[11px] font-black text-emerald-700">{pct(data.profitability.grossMargin)}</p>
        </div>
        <div className="text-center bg-blue-50 border border-blue-100 rounded-lg py-1.5">
          <p className="text-[8px] font-bold uppercase text-blue-700">Net Margin</p>
          <p className="text-[11px] font-black text-blue-700">{pct(data.profitability.netMargin)}</p>
        </div>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────── Accounting equation ───────────────────────────────────────────── */

export function EquationPanel({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const e = data.equation;
  return (
    <Card title="Accounting Equation" icon={<Scale className="w-3.5 h-3.5 text-violet-600" />}>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-2">
          <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
            <Landmark className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-bold uppercase text-blue-700">Assets</p>
            <p className="text-xs font-extrabold text-gray-900">{money(e.assets, currency)}</p>
          </div>
        </div>
        <div className="text-center text-[10px] font-black text-slate-400 -my-0.5">=</div>
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-2">
          <div className="w-7 h-7 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-bold uppercase text-rose-700">Liabilities</p>
            <p className="text-xs font-extrabold text-gray-900">{money(e.liabilities, currency)}</p>
          </div>
        </div>
        <div className="text-center text-[10px] font-black text-slate-400 -my-0.5">+</div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-2">
          <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-bold uppercase text-emerald-700">Equity</p>
            <p className="text-xs font-extrabold text-gray-900">{money(e.equity, currency)}</p>
          </div>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase text-slate-500">Net Working Capital</span>
        <span className="text-xs font-extrabold text-violet-700">{money(data.workingCapital, currency)}</span>
      </div>
      <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-bold ${e.balanced ? 'text-emerald-700' : 'text-amber-700'}`}>
        {e.balanced ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {e.balanced ? 'Equation balanced' : `Imbalance ${money(Math.abs(e.difference), currency)}`}
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────── Needs attention ───────────────────────────────────────────── */

const SEVERITY_STYLES: Record<string, { dot: string; box: string; text: string }> = {
  critical: { dot: 'bg-rose-500', box: 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/60', text: 'text-rose-900' },
  warning: { dot: 'bg-amber-500', box: 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60', text: 'text-amber-900' },
  info: { dot: 'bg-blue-500', box: 'bg-blue-50/70 border-blue-200 hover:bg-blue-100/60', text: 'text-blue-900' },
  success: { dot: 'bg-emerald-500', box: 'bg-emerald-50/70 border-emerald-200', text: 'text-emerald-900' },
};

export function AttentionPanel({ data, setPage }: { data: FinancialData; setPage: (p: string) => void }) {
  return (
    <Card title="Needs Attention" icon={<AlertCircle className="w-3.5 h-3.5 text-amber-500" />}>
      <div className="space-y-1.5">
        {data.alerts.map((a) => {
          const s = SEVERITY_STYLES[a.severity];
          return (
            <button
              key={a.id}
              disabled={!a.page}
              onClick={() => a.page && setPage(a.page)}
              className={`w-full text-left p-2 rounded-lg border flex items-start gap-2 transition-colors ${s.box} ${a.page ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${s.dot}`} />
              <div className="min-w-0">
                <p className={`text-[11px] font-bold truncate ${s.text}`}>{a.title}</p>
                <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">{a.detail}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────── Receivables / Payables ───────────────────────────────────────────── */

function Donut({ data, currency, colors }: { data: SliceDatum[]; currency: CurrencyCode; colors: string[] }) {
  const total = data.reduce((a, s) => a + s.value, 0);
  if (total <= 0) return <EmptyNote>No outstanding amounts</EmptyNote>;
  return (
    <div className="flex items-center gap-2">
      <ResponsiveContainer width="52%" height={120}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={30} outerRadius={50} paddingAngle={2} isAnimationActive={false}>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: unknown) => money(Number(value), currency)} contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-1">
        {data.map((s, i) => (
          <div key={s.name} className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-sm" style={{ background: colors[i % colors.length] }} />
              {s.name}
            </span>
            <span className="font-bold text-gray-800">{pct(total > 0 ? (s.value / total) * 100 : 0, 0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReceivablesPanel({
  data,
  currency,
  setPage,
}: {
  data: FinancialData;
  currency: CurrencyCode;
  setPage: (p: string) => void;
}) {
  return (
    <Card
      title="Customers Receivable"
      icon={<HandCoins className="w-3.5 h-3.5 text-violet-600" />}
      action={
        <button
          onClick={() => setPage('Sales & Customers.Customer Aging')}
          className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
        >
          View all
        </button>
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[9px] font-bold uppercase text-slate-400">Total Outstanding</p>
          <p className="text-sm font-black text-gray-900">{money(data.arTotal, currency)}</p>
          <p className="text-[9px] text-amber-600 font-semibold">{num(data.overdueCount)} overdue · {money(data.arOverdue, currency)}</p>
        </div>
      </div>
      <Donut data={data.arAging} currency={currency} colors={['#8b5cf6', '#6366f1', '#0ea5e9', '#f59e0b', '#ef4444']} />
      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
        {data.topCustomers.slice(0, 4).map((c) => (
          <div key={c.name} className="flex items-center justify-between text-[10px]">
            <span className="text-slate-600 font-medium truncate pr-2">{c.name}</span>
            <span className="font-bold text-gray-800 truncate">{money(c.value, currency)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function PayablesPanel({
  data,
  currency,
  setPage,
}: {
  data: FinancialData;
  currency: CurrencyCode;
  setPage: (p: string) => void;
}) {
  return (
    <Card
      title="Vendor Payables"
      icon={<CreditCard className="w-3.5 h-3.5 text-amber-600" />}
      action={
        <button
          onClick={() => setPage('Procurement.Payables Aging')}
          className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
        >
          View all
        </button>
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[9px] font-bold uppercase text-slate-400">Total Due</p>
          <p className="text-sm font-black text-gray-900">{money(data.apTotal, currency)}</p>
          <p className="text-[9px] text-amber-600 font-semibold">{num(data.overdueBills)} overdue · {money(data.apOverdue, currency)}</p>
        </div>
      </div>
      <Donut data={data.apAging} currency={currency} colors={['#f59e0b', '#fb7185', '#f43f5e', '#ef4444', '#b91c1c']} />
      <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
        {data.topVendors.slice(0, 4).map((v) => (
          <div key={v.name} className="flex items-center justify-between text-[10px]">
            <span className="text-slate-600 font-medium truncate pr-2">{v.name}</span>
            <span className="font-bold text-gray-800 truncate">{money(v.value, currency)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────── Inventory ───────────────────────────────────────────── */

export function InventoryPanel({
  data,
  currency,
  setPage,
}: {
  data: FinancialData;
  currency: CurrencyCode;
  setPage: (p: string) => void;
}) {
  return (
    <Card
      title="Inventory Overview"
      icon={<Boxes className="w-3.5 h-3.5 text-rose-600" />}
      action={
        <button
          onClick={() => setPage('Assets & Inventory.Assets & Inventory Workspace')}
          className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
        >
          View details
        </button>
      }
    >
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <div className="text-center bg-slate-50 border border-slate-100 rounded-lg py-1.5">
          <p className="text-[8px] font-bold uppercase text-slate-400">Stock Value</p>
          <p className="text-[11px] font-black text-gray-900 truncate">{money(data.inventoryValue, currency)}</p>
        </div>
        <div className="text-center bg-blue-50 border border-blue-100 rounded-lg py-1.5">
          <p className="text-[8px] font-bold uppercase text-blue-600">Items</p>
          <p className="text-[11px] font-black text-blue-700">{num(data.stockItems)}</p>
        </div>
        <div className="text-center bg-rose-50 border border-rose-100 rounded-lg py-1.5">
          <p className="text-[8px] font-bold uppercase text-rose-600">Low / Out</p>
          <p className="text-[11px] font-black text-rose-700">
            {num(data.lowStock)} / {num(data.outOfStock)}
          </p>
        </div>
      </div>
      <Donut data={data.stockStatus} currency={currency} colors={['#10b981', '#f59e0b', '#ef4444']} />
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Top Categories</p>
        <div className="space-y-1">
          {data.topCategories.length ? (
            data.topCategories.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-[10px]">
                <span className="text-slate-600 font-medium truncate pr-2">{c.name}</span>
                <span className="font-bold text-gray-800">{money(c.value, currency)}</span>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-gray-400">No inventory data</p>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────── Recent transactions ───────────────────────────────────────────── */

const txnStatusCls = (s: string) => {
  const st = s.toLowerCase();
  if (st.includes('paid') || st.includes('reconciled') || st.includes('received')) return 'bg-emerald-100 text-emerald-700';
  if (st.includes('overdue') || st.includes('due')) return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
};

export function TransactionsPanel({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const txns: TxnRow[] = data.recentTxns;
  return (
    <Card title="Recent Transactions" icon={<Receipt className="w-3.5 h-3.5 text-blue-600" />}>
      {txns.length === 0 ? (
        <EmptyNote>No transactions yet</EmptyNote>
      ) : (
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="text-[9px] uppercase tracking-wide text-gray-400">
              <th className="py-1 pr-1">Ref</th>
              <th className="py-1 pr-1">Party</th>
              <th className="py-1 pr-1">Date</th>
              <th className="py-1 pr-1 text-right">Amount</th>
              <th className="py-1 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {txns.map((t, i) => (
              <tr key={i}>
                <td className={`py-1 pr-1 font-bold truncate max-w-[80px] ${t.type === 'IN' ? 'text-gray-900' : 'text-amber-700'}`}>
                  {t.ref}
                </td>
                <td className="py-1 pr-1 text-gray-500 truncate max-w-[80px]">{t.party}</td>
                <td className="py-1 pr-1 text-gray-400">{fmtDate(t.date)}</td>
                <td className={`py-1 pr-1 text-right font-semibold ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t.type === 'IN' ? '+' : '−'}
                  {money(t.amount, currency)}
                </td>
                <td className="py-1 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${txnStatusCls(t.status)}`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ───────────────────────────────────────────── Sales / Purchase performance ───────────────────────────────────────────── */

export function SalesPanel({
  data,
  currency,
  setPage,
}: {
  data: FinancialData;
  currency: CurrencyCode;
  setPage: (p: string) => void;
}) {
  return (
    <Card
      title="Sales Performance"
      icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
      action={
        <button onClick={() => setPage('Sales & Customers.Sales Workspace')} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">
          Open Sales
        </button>
      }
    >
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data.salesMonthly} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} interval={1} />
          <YAxis
            tick={{ fontSize: 8, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: unknown) => `${(Number(value) / 1000).toFixed(0)}k`}
          />
          <Tooltip formatter={(value: unknown) => money(Number(value), currency)} contentStyle={tooltipStyle} />
          <Bar dataKey="amount" fill="#10b981" radius={[3, 3, 0, 0]} name="Sales" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Invoice Status</p>
        {data.invoiceStatus.length ? (
          data.invoiceStatus.slice(0, 4).map((s, i) => (
            <div key={s.name} className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                {s.name}
              </span>
              <span className="font-bold text-gray-800">{num(s.value)}</span>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-gray-400">No invoices yet</p>
        )}
      </div>
    </Card>
  );
}

export function PurchasePanel({
  data,
  currency,
  setPage,
}: {
  data: FinancialData;
  currency: CurrencyCode;
  setPage: (p: string) => void;
}) {
  return (
    <Card
      title="Purchase Performance"
      icon={<Truck className="w-3.5 h-3.5 text-amber-600" />}
      action={
        <button onClick={() => setPage('Procurement.Procurement Workspace')} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">
          Open Procurement
        </button>
      }
    >
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data.purchaseMonthly} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} interval={1} />
          <YAxis
            tick={{ fontSize: 8, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: unknown) => `${(Number(value) / 1000).toFixed(0)}k`}
          />
          <Tooltip formatter={(value: unknown) => money(Number(value), currency)} contentStyle={tooltipStyle} />
          <Bar dataKey="amount" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Purchases" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 pt-2 border-t border-gray-100">
        <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Purchase Orders</p>
        {data.poStatus.length ? (
          data.poStatus.slice(0, 4).map((s, i) => (
            <div key={s.name} className="flex items-center justify-between text-[10px]">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-sm" style={{ background: CHART_COLORS[(i + 2) % CHART_COLORS.length] }} />
                {s.name}
              </span>
              <span className="font-bold text-gray-800">{num(s.value)}</span>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-gray-400">No purchase orders yet</p>
        )}
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────── Top expenses ───────────────────────────────────────────── */

export function TopExpensesPanel({
  data,
  currency,
  setPage,
}: {
  data: FinancialData;
  currency: CurrencyCode;
  setPage: (p: string) => void;
}) {
  const max = data.topExpenses[0]?.value || 1;
  return (
    <Card
      title="Top Expenses"
      icon={<CreditCard className="w-3.5 h-3.5 text-rose-600" />}
      action={
        <button onClick={() => setPage('Accounting.Financial Reports')} className="text-[10px] font-bold text-blue-600 hover:text-blue-800">
          Reports
        </button>
      }
    >
      {data.topExpenses.length ? (
        <div className="space-y-2">
          {data.topExpenses.map((e, i) => (
            <div key={e.name}>
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-slate-600 font-medium truncate pr-2">{e.name}</span>
                <span className="font-bold text-gray-800">{money(e.value, currency)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, (e.value / max) * 100)}%`, background: CHART_COLORS[(i + 3) % CHART_COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyNote>No expense accounts configured</EmptyNote>
      )}
    </Card>
  );
}

/* ───────────────────────────────────────────── Profitability ───────────────────────────────────────────── */

export function ProfitabilityPanel({ data }: { data: FinancialData }) {
  const p = data.profitability;
  const tiles = [
    { label: 'Gross Margin', value: pct(p.grossMargin), cls: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
    { label: 'Net Margin', value: pct(p.netMargin), cls: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Operating Margin', value: pct(p.operatingMargin), cls: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
    { label: 'ROE', value: pct(p.roe), cls: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
    { label: 'Current Ratio', value: `${p.currentRatio.toFixed(2)}x`, cls: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-100' },
    { label: 'Quick Ratio', value: `${p.quickRatio.toFixed(2)}x`, cls: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
  ];
  return (
    <Card title="Profitability Analysis" icon={<BarChart3 className="w-3.5 h-3.5 text-cyan-600" />}>
      <div className="grid grid-cols-2 gap-1.5">
        {tiles.map((t) => (
          <div key={t.label} className={`rounded-lg border px-2 py-2 text-center ${t.bg}`}>
            <p className="text-[8px] font-bold uppercase tracking-wide text-slate-500">{t.label}</p>
            <p className={`text-[13px] font-black ${t.cls}`}>{t.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-slate-500">
        <span className="font-semibold text-slate-600">Revenue:</span> {money(data.revenue)} ·{' '}
        <span className="font-semibold text-slate-600">Net Profit:</span> {money(data.netProfit)}
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────── Accounting control bar ───────────────────────────────────────────── */

export function ControlBar({ data, setPage }: { data: FinancialData; setPage: (p: string) => void }) {
  const items: { label: string; value: string; icon: ReactNode; page: string; cls: string }[] = [
    { label: 'Trial Balance', value: `${num(data.controls.trialBalance)} accounts`, icon: <Scale className="w-3.5 h-3.5" />, page: 'Accounting.Financial Reports', cls: 'bg-blue-50 text-blue-600' },
    { label: 'Bank Reconciliation', value: `${num(data.controls.bankRecon)} accounts`, icon: <ArrowLeftRight className="w-3.5 h-3.5" />, page: 'Banking & Payments.Bank Reconciliation', cls: 'bg-cyan-50 text-cyan-600' },
    { label: 'AR Reconciliation', value: `${num(data.controls.arRecon)} open invoices`, icon: <HandCoins className="w-3.5 h-3.5" />, page: 'Accounting.Accounts Receivable', cls: 'bg-violet-50 text-violet-600' },
    { label: 'AP Reconciliation', value: `${num(data.controls.apRecon)} open bills`, icon: <CreditCard className="w-3.5 h-3.5" />, page: 'Accounting.Accounts Payable', cls: 'bg-amber-50 text-amber-600' },
    { label: 'Unposted Journals', value: `${num(data.controls.unpostedJournals)} pending`, icon: <FileText className="w-3.5 h-3.5" />, page: 'Accounting.Journal Entries', cls: 'bg-rose-50 text-rose-600' },
  ];
  return (
    <Card title="Accounting Control Bar" icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />} className="lg:col-span-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
        {items.map((it) => (
          <button
            key={it.label}
            onClick={() => setPage(it.page)}
            className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-200 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors text-center"
          >
            <span className={`w-6 h-6 rounded-md flex items-center justify-center ${it.cls}`}>{it.icon}</span>
            <span className="text-[9px] font-bold text-slate-700 leading-tight">{it.label}</span>
            <span className="text-[9px] text-slate-400">{it.value}</span>
          </button>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" /> Accounting Period: <b className="text-slate-700">{data.controls.period}</b>
        </span>
        <button onClick={() => setPage('Accounting.Period Closing')} className="font-bold text-blue-600 hover:text-blue-800">
          Manage Period
        </button>
      </div>
    </Card>
  );
}

/* ───────────────────────────────────────────── Quick add ───────────────────────────────────────────── */

export function QuickAdd({ setPage }: { setPage: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const actions: { label: string; page: string; icon: ReactNode }[] = [
    { label: 'Customer Invoice', page: 'Sales & Customers.Sales Workspace', icon: <FileText className="w-3.5 h-3.5" /> },
    { label: 'Customer Receipt', page: 'Sales & Customers.Customer Payments', icon: <HandCoins className="w-3.5 h-3.5" /> },
    { label: 'Vendor Bill', page: 'Procurement.Bills', icon: <Receipt className="w-3.5 h-3.5" /> },
    { label: 'Vendor Payment', page: 'Procurement.Vendor Payments', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { label: 'Journal Entry', page: 'Accounting.Journal Entries', icon: <FileText className="w-3.5 h-3.5" /> },
    { label: 'Sales Order', page: 'Sales & Customers.Sales Orders', icon: <Package className="w-3.5 h-3.5" /> },
    { label: 'Purchase Order', page: 'Procurement.Procurement Workspace', icon: <Truck className="w-3.5 h-3.5" /> },
    { label: 'Expense', page: 'Procurement.Expense Claims', icon: <Receipt className="w-3.5 h-3.5" /> },
    { label: 'Bank Transaction', page: 'Banking & Payments.Transactions', icon: <Landmark className="w-3.5 h-3.5" /> },
  ];
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-52 overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-400 border-b border-slate-100">
            Quick Add
          </div>
          <div className="py-1">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  setOpen(false);
                  setPage(a.page);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors text-left"
              >
                <span className="text-slate-400">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 flex items-center justify-center transition-colors"
        aria-label="Quick add"
      >
        {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
}
