import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Building2,
  Landmark,
  PieChart,
  Percent,
  BarChart3,
  Scale,
  Info,
  Plus,
  X,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { money } from './format';
import type { FinancialData } from './useFinancialData';
import type { CurrencyCode } from './format';

const COLORS = {
  green: '#10b981',
  red: '#ef4444',
  blue: '#3b82f6',
  orange: '#f97316',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  yellow: '#eab308',
  darkRed: '#dc2626',
};

const AGING_COLORS = [COLORS.green, COLORS.yellow, COLORS.orange, COLORS.red, COLORS.darkRed];

const tooltipStyle = { borderRadius: 8, fontSize: 11, border: '1px solid #e2e8f0' };

/* ─────────────────────────── KPI Card ─────────────────────────── */

function KPICard({
  label,
  value,
  delta,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  delta: number | null;
  icon: typeof DollarSign;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-gray-500 font-medium leading-none block truncate">{label}</span>
        <p className="text-sm font-bold text-gray-900 leading-tight mt-0.5">{value}</p>
        {delta !== null && (
          <div className="flex items-center gap-0.5 mt-0.5">
            {delta >= 0 ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-red-500" />
            )}
            <span
              className="text-[10px] font-semibold"
              style={{ color: delta >= 0 ? COLORS.green : COLORS.red }}
            >
              {Math.abs(delta).toFixed(1)}%
            </span>
            <span className="text-[10px] text-gray-400">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Accounting Equation ─────────────────────────── */

function AccountingEquation({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const boxes = [
    { label: 'ASSETS', value: data.equation.assets, icon: Building2, bg: '#eff6ff', border: '#bfdbfe', color: COLORS.blue },
    { label: 'LIABILITIES', value: data.equation.liabilities, icon: Landmark, bg: '#fef2f2', border: '#fecaca', color: COLORS.red },
    { label: 'EQUITY', value: data.equation.equity, icon: PieChart, bg: '#ecfdf5', border: '#a7f3d0', color: COLORS.green },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accounting Equation</h3>
        <Info className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex items-center justify-center gap-3">
        {boxes.map((box, i) => (
          <div key={box.label} className="flex items-center gap-3">
            <div
              className="flex-1 rounded-xl px-5 py-4 text-center border"
              style={{ backgroundColor: box.bg, borderColor: box.border }}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <box.icon className="w-4 h-4" style={{ color: box.color }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: box.color }}>
                  {box.label}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">{money(box.value, currency)}</p>
            </div>
            {i < 2 && (
              <span className="text-2xl font-bold text-gray-400 shrink-0">{i === 0 ? '=' : '+'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── P&L Trend Chart ─────────────────────────── */

function ProfitLossTrend({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const last6 = data.series.slice(-6);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-900">Profit & Loss Trend</h3>
          <Info className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <select className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white">
          <option>Last 6 Months</option>
        </select>
      </div>
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
          <span className="text-gray-600">Revenue</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
          <span className="text-gray-600">Expenses</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
          <span className="text-gray-600">Net Profit</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={last6} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(value: unknown) => money(Number(value), currency)} contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="revenue" stroke={COLORS.green} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="expense" stroke={COLORS.red} strokeWidth={2} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="profit" stroke={COLORS.blue} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────── Cash Flow Summary ─────────────────────────── */

function CashFlowSummary({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const inflow = data.cashInflows;
  const outflow = data.cashOutflows;
  const net = inflow - outflow;
  const total = inflow + outflow;
  const inflowPct = total > 0 ? (inflow / total) * 100 : 0;
  const outflowPct = total > 0 ? (outflow / total) * 100 : 0;

  const donutData = [
    { name: 'Inflow', value: inflow || 1 },
    { name: 'Outflow', value: outflow || 1 },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-900">Cash Flow Summary</h3>
          <Info className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <select className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white">
          <option>This Month</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Cash Inflow</p>
            <p className="text-lg font-bold" style={{ color: COLORS.green }}>{money(inflow, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Cash Outflow</p>
            <p className="text-lg font-bold" style={{ color: COLORS.red }}>{money(outflow, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Net Cash Flow</p>
            <p className="text-lg font-bold text-gray-900">{money(net, currency)}</p>
          </div>
        </div>
        <div className="shrink-0">
          <ResponsiveContainer width={130} height={130}>
            <RePieChart>
              <Pie
                data={donutData}
                dataKey="value"
                innerRadius={40}
                outerRadius={55}
                paddingAngle={2}
                isAnimationActive={false}
              >
                <Cell fill={COLORS.green} />
                <Cell fill={COLORS.red} />
              </Pie>
              <Tooltip formatter={(value: unknown) => money(Number(value), currency)} contentStyle={tooltipStyle} />
            </RePieChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-3 text-[10px] mt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.green }} />
              Inflow ({inflowPct.toFixed(1)}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.red }} />
              Outflow ({outflowPct.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Account Balances ─────────────────────────── */

function AccountBalances({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const items = [
    { label: 'Total Assets', value: money(data.equation.assets, currency), icon: Building2, color: COLORS.blue, bg: '#eff6ff' },
    { label: 'Total Liabilities', value: money(data.equation.liabilities, currency), icon: Landmark, color: COLORS.red, bg: '#fef2f2' },
    { label: 'Total Equity', value: money(data.equation.equity, currency), icon: PieChart, color: COLORS.green, bg: '#ecfdf5' },
    { label: 'Equity Ratio', value: `${data.profitability.equityRatio.toFixed(1)}%`, icon: Percent, color: COLORS.purple, bg: '#faf5ff' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-gray-900">Account Balances</h3>
        <Info className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: item.bg }}
              >
                <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
              </div>
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
            <span className="text-sm font-bold text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Aging Card ─────────────────────────── */

function AgingCard({
  title,
  total,
  avgDays,
  avgLabel,
  aging,
  currency,
}: {
  title: string;
  total: number;
  avgDays: number;
  avgLabel: string;
  aging: { name: string; value: number }[];
  currency: CurrencyCode;
}) {
  const totalValue = aging.reduce((s, a) => s + a.value, 0) || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <Info className="w-3.5 h-3.5 text-gray-400" />
      </div>
      <div className="flex items-center gap-6 mb-5">
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Total {title.replace(' Aging', '')}</p>
          <p className="text-xl font-bold text-gray-900">{money(total, currency)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{avgLabel}</p>
          <p className="text-xl font-bold text-gray-900">{avgDays} Days</p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {aging.map((bucket, i) => {
          const pct = (bucket.value / totalValue) * 100;
          return (
            <div key={bucket.name} className="text-center">
              <p className="text-[10px] text-gray-500 mb-1">{bucket.name}</p>
              <p className="text-xs font-bold text-gray-900">{money(bucket.value, currency)}</p>
              <p className="text-[10px] text-gray-400 mb-1.5">{pct.toFixed(1)}%</p>
              <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, pct)}%`, backgroundColor: AGING_COLORS[i] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── Financial Position Bar ─────────────────────────── */

function FinancialPositionBar({ data, currency }: { data: FinancialData; currency: CurrencyCode }) {
  const metrics = [
    { label: 'Working Capital', value: money(data.workingCapital, currency), icon: Wallet, color: COLORS.blue, bg: '#eff6ff' },
    { label: 'Current Ratio', value: `${data.profitability.currentRatio.toFixed(2)} : 1`, icon: BarChart3, color: COLORS.green, bg: '#ecfdf5' },
    { label: 'Debt to Equity Ratio', value: `${data.profitability.debtToEquity.toFixed(2)} : 1`, icon: Scale, color: COLORS.orange, bg: '#fff7ed' },
    { label: 'Return on Equity (ROE)', value: `${data.profitability.roe.toFixed(2)}%`, icon: TrendingUp, color: COLORS.purple, bg: '#faf5ff' },
    { label: 'Gross Profit Margin', value: `${data.profitability.grossMargin.toFixed(2)}%`, icon: PieChart, color: COLORS.teal, bg: '#f0fdfa' },
    { label: 'Net Profit Margin', value: `${data.profitability.netMargin.toFixed(2)}%`, icon: Percent, color: COLORS.blue, bg: '#eff6ff' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-3.5">
      <div className="flex items-center gap-5 flex-wrap">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-gray-200">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ecfdf5' }}>
            <PieChart className="w-4 h-4" style={{ color: COLORS.green }} />
          </div>
          <span className="text-[11px] font-bold text-gray-900 leading-tight">
            Financial<br />Position Summary
          </span>
        </div>
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: m.bg }}
            >
              <m.icon className="w-3 h-3" style={{ color: m.color }} />
            </div>
            <div>
              <p className="text-[9px] text-gray-400 leading-tight">{m.label}</p>
              <p className="text-[11px] font-bold text-gray-900 leading-tight">{m.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Quick Add ─────────────────────────── */

export function QuickAdd({ setPage }: { setPage: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const actions: { label: string; page: string }[] = [
    { label: 'Customer Invoice', page: 'Sales & Customers.Sales Workspace' },
    { label: 'Customer Receipt', page: 'Sales & Customers.Customer Payments' },
    { label: 'Vendor Bill', page: 'Procurement.Bills' },
    { label: 'Vendor Payment', page: 'Procurement.Vendor Payments' },
    { label: 'Journal Entry', page: 'Accounting.Journal Entries' },
    { label: 'Sales Order', page: 'Sales & Customers.Sales Orders' },
    { label: 'Purchase Order', page: 'Procurement.Procurement Workspace' },
    { label: 'Expense', page: 'Procurement.Expense Claims' },
    { label: 'Bank Transaction', page: 'Banking & Payments.Transactions' },
  ];
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl w-52 overflow-hidden">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wide text-gray-400 border-b border-gray-100">
            Quick Add
          </div>
          <div className="py-1">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => { setOpen(false); setPage(a.page); }}
                className="w-full text-left px-3 py-1.5 text-[11px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 flex items-center justify-center transition-colors"
      >
        {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
}

/* ─────────────────────────── Exported Layout ─────────────────────────── */

export {
  KPICard,
  AccountingEquation,
  ProfitLossTrend,
  CashFlowSummary,
  AccountBalances,
  AgingCard,
  FinancialPositionBar,
};
