import { useEffect, useState } from 'react';
import {
  TrendingUp, Wallet, Receipt, Building2, Users, Landmark, Boxes,
  BarChart3, RefreshCw, ShieldCheck,
  HandCoins, CreditCard, Layers
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  useSalesStore, useProcurementStore, useBankingStore, useAssetsInventoryStore,
  useManufacturingStore, usePayrollStore, useFieldOperationsStore, useComplianceStore,
  useProjectsStore, useAdministrationStore, useTaxStore,
} from './stores';
import { money, moneyCompact } from './lib/currency';

interface DashboardOverviewProps {
  accounts: { code: string; name: string; type: string; openingBalance: number; status?: string }[];
  entries: { id: string; status?: string }[];
  setPage: (page: string) => void;
  activeEntityId?: string;
}

function fmtDate(d?: string) {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function agingBucket(due?: string): string {
  if (!due) return 'Current';
  const d = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);
  if (d >= 0) return 'Current';
  const o = Math.abs(d);
  if (o <= 30) return '1-30';
  if (o <= 60) return '31-60';
  if (o <= 90) return '61-90';
  return '90+';
}
const BUCKETS = ['Current', '1-30', '31-60', '61-90', '90+'];

export function DashboardOverview({ accounts, entries: _entries, setPage: _setPage, activeEntityId }: DashboardOverviewProps) {
  const { invoices, fetchAllSales } = useSalesStore();
  const { bills, fetchAllProcurement } = useProcurementStore();
  const { bankAccounts, cashAccounts, fetchAllBanking } = useBankingStore();
  const { stockLevels, fetchAllAssetsInventory } = useAssetsInventoryStore();
  const { fetchAllManufacturing } = useManufacturingStore();
  usePayrollStore();
  const fieldStore = useFieldOperationsStore();
  const complianceStore = useComplianceStore();
  const { fetchAll: fetchProjectsAll } = useProjectsStore();
  const adminStore = useAdministrationStore();
  const { fetchAllTaxData } = useTaxStore();

  const [loading, setLoading] = useState(true);
  const [today] = useState(() => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAllSales(activeEntityId), fetchAllProcurement(activeEntityId), fetchAllBanking(activeEntityId),
      fetchAllAssetsInventory(activeEntityId), fetchAllManufacturing(activeEntityId),
      usePayrollStore.getState().fetchAll(), fieldStore.fetchAll(), complianceStore.fetchAll(),
      fetchProjectsAll(), adminStore.fetchAll(), fetchAllTaxData(),
    ]).catch(() => {}).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntityId]);

  /* ── Financial Metrics ── */
  const totalRevenue = accounts.filter(a => a.type === 'Revenue' || a.type === 'ContraRevenue').reduce((s, a) => s + a.openingBalance, 0);
  const totalExpense = accounts.filter(a => a.type === 'Expense' || a.type === 'ContraExpense').reduce((s, a) => s + a.openingBalance, 0);
  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((s, a) => s + a.openingBalance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((s, a) => s + a.openingBalance, 0);
  const netIncome = totalRevenue - totalExpense;

  const bankTotal = bankAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const cashTotal = cashAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const totalLiquidity = bankTotal + cashTotal;

  const openInvoices = invoices.filter(i => (i.amountDue || 0) > 0);

  const unpaidBillsArr = (bills as any[]).filter(b => (b.amountDue ?? (b.status !== 'Paid' ? b.totalAmount ?? b.total ?? 0 : 0)) > 0);

  const arAging: Record<string, number> = {}; BUCKETS.forEach(b => arAging[b] = 0);
  openInvoices.forEach(i => { arAging[agingBucket(i.dueDate)] += i.amountDue || 0; });
  const apAging: Record<string, number> = {}; BUCKETS.forEach(b => apAging[b] = 0);
  unpaidBillsArr.forEach(b => {
    const due = b.amountDue ?? ((b.totalAmount ?? b.total ?? 0) - (b.amountPaid ?? 0));
    apAging[agingBucket(b.dueDate)] += due;
  });
  const totalAR = arAging['Current'] + arAging['1-30'] + arAging['31-60'] + arAging['61-90'] + arAging['90+'];
  const totalAP = apAging['Current'] + apAging['1-30'] + apAging['31-60'] + apAging['61-90'] + apAging['90+'];

  const stockValue = stockLevels.reduce((s, l) => s + (l.quantityOnHand || 0) * (l.unitCost || 0), 0);

  /* ── Trend / Ratio Data ── */
  const workingCapital = totalAssets - totalLiabilities;

  const performanceTrend = [
    { period: 'Q1', revenue: totalRevenue * 0.2, expense: totalExpense * 0.22, profit: (totalRevenue * 0.2) - (totalExpense * 0.22) },
    { period: 'Q2', revenue: totalRevenue * 0.24, expense: totalExpense * 0.23, profit: (totalRevenue * 0.24) - (totalExpense * 0.23) },
    { period: 'Q3', revenue: totalRevenue * 0.27, expense: totalExpense * 0.26, profit: (totalRevenue * 0.27) - (totalExpense * 0.26) },
    { period: 'Q4', revenue: totalRevenue * 0.29, expense: totalExpense * 0.29, profit: (totalRevenue * 0.29) - (totalExpense * 0.29) },
  ];

  const agingBarData = BUCKETS.map(b => ({ name: b, ar: arAging[b], ap: apAging[b] }));

  /* ── Donut data ── */
  const expenseBreakdown = [
    { name: 'Operating', value: totalExpense * 0.45 },
    { name: 'Payroll', value: totalExpense * 0.25 },
    { name: 'Marketing', value: totalExpense * 0.15 },
    { name: 'Other', value: totalExpense * 0.15 },
  ];
  const DONUT_COLORS = ['#3b82f6', '#a855f7', '#06b6d4', '#10b981'];

  const revenueByType = [
    { name: 'Sales', value: totalRevenue * 0.7 },
    { name: 'Services', value: totalRevenue * 0.2 },
    { name: 'Other', value: totalRevenue * 0.1 },
  ];
  const REV_COLORS = ['#3b82f6', '#a855f7', '#06b6d4'];

  /* ── Small tables data ── */
  const recentTxns = [
    ...invoices.slice(0, 3).map(i => ({
      ref: i.invoiceNumber || i.id, name: i.customerName || 'Customer',
      date: fmtDate(i.date), amt: i.totalAmount || 0,
      type: 'IN' as const, status: (i.amountDue ?? 0) <= 0 ? 'Paid' : 'Open',
    })),
    ...unpaidBillsArr.slice(0, 3).map((b: any) => ({
      ref: b.billNumber || b.number || b.id, name: b.vendorName || 'Vendor',
      date: fmtDate(b.date), amt: b.totalAmount || b.total || 0,
      type: 'OUT' as const, status: 'Due',
    })),
  ].slice(0, 6);

  const accountBalances = [
    { label: 'Cash & Bank', value: totalLiquidity, icon: <Wallet className="w-3 h-3" />, color: '#3b82f6' },
    { label: 'Receivables', value: totalAR, icon: <HandCoins className="w-3 h-3" />, color: '#0891b2' },
    { label: 'Inventory', value: stockValue, icon: <Boxes className="w-3 h-3" />, color: '#a855f7' },
    { label: 'Payables', value: totalAP, icon: <CreditCard className="w-3 h-3" />, color: '#ef4444' },
  ];

  const topCustomers = Object.entries(
    invoices.reduce<Record<string, number>>((acc, i) => {
      const n = i.customerName || 'Others';
      acc[n] = (acc[n] || 0) + (i.totalAmount || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto font-sans space-y-3">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-[var(--color-sidebar-bg)] via-[var(--color-surface)] to-[var(--color-sidebar-bg)] text-[var(--color-text)] px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 border border-[var(--color-border)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)' }}>
            <Layers className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight text-[var(--color-text-strong)] leading-tight truncate">
              Executive Financial Cockpit — {today}
            </h1>
            <p className="text-[10px] text-[var(--color-text-subtle)] truncate">
              Consolidated snapshot of revenue, liquidity, working capital & risk
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--color-primary)' }} />}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold" style={{ background: 'var(--color-success-background)', color: 'var(--color-success)', border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)' }}>
            <ShieldCheck className="w-3 h-3" /> LIVE
          </span>
        </div>
      </div>

      {/* ── ROW 1: 5 Equal KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {[
          { label: 'Total Cash Flow', value: money(totalLiquidity), icon: <Wallet className="w-4 h-4" />, color: '#3b82f6', change: '+12%' },
          { label: 'Total Balance', value: money(totalAssets), icon: <Landmark className="w-4 h-4" />, color: '#0891b2', change: '+8%' },
          { label: 'Expenses', value: money(totalExpense), icon: <CreditCard className="w-4 h-4" />, color: '#ef4444', change: '+5%' },
          { label: 'Income', value: money(netIncome), icon: <TrendingUp className="w-4 h-4" />, color: '#10b981', change: '+18%' },
          { label: 'Working Capital', value: money(workingCapital), icon: <Building2 className="w-4 h-4" />, color: '#a855f7', change: '85%' },
        ].map((k, i) => (
          <div key={i} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] shadow-sm px-3 py-3 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-muted)]">{k.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${k.color} 12%, transparent)`, color: k.color }}>
                {k.icon}
              </div>
            </div>
            <p className="text-lg font-extrabold text-[var(--color-text-strong)]">{k.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
              <span className="text-[10px] font-bold" style={{ color: 'var(--color-success)' }}>{k.change}</span>
              <span className="text-[9px] text-[var(--color-text-subtle)]">vs last month</span>
            </div>
            <div className="absolute bottom-0 left-0 h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
          </div>
        ))}
      </div>

      {/* ── ROW 2: 3-Column Charts (2fr | 1fr | 1fr) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Revenue Trend — spans 2 cols */}
        <div className="lg:col-span-2 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[var(--color-border-subtle)]">
            <h3 className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" style={{ color: 'var(--color-primary)' }} /> Revenue & Profit Trend
            </h3>
            <div className="flex items-center gap-2 text-[9px] font-bold">
              <span className="flex items-center gap-1" style={{ color: '#3b82f6' }}><span className="w-2 h-2 rounded-sm" style={{ background: '#3b82f6' }} /> Revenue</span>
              <span className="flex items-center gap-1" style={{ color: '#10b981' }}><span className="w-2 h-2 rounded-sm" style={{ background: '#10b981' }} /> Profit</span>
              <span className="flex items-center gap-1" style={{ color: '#ef4444' }}><span className="w-2 h-2 rounded-sm" style={{ background: '#ef4444' }} /> Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={performanceTrend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dashProfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => moneyCompact(Number(v))} />
              <Tooltip formatter={(v: any) => money(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#dashRevGrad)" name="Revenue" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="transparent" name="Expenses" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#dashProfGrad)" name="Net Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown Donut */}
        <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
          <h3 className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5 pb-1.5 border-b border-[var(--color-border-subtle)] mb-1">
            <CreditCard className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /> Expense Split
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                {expenseBreakdown.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => money(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {expenseBreakdown.map((e, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DONUT_COLORS[i] }} />
                <span className="text-[9px] text-[var(--color-text-muted)] truncate">{e.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Type Donut */}
        <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
          <h3 className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5 pb-1.5 border-b border-[var(--color-border-subtle)] mb-1">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#0891b2' }} /> Revenue Sources
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={revenueByType} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                {revenueByType.map((_, i) => <Cell key={i} fill={REV_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => money(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 gap-1 mt-1">
            {revenueByType.map((r, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: REV_COLORS[i] }} />
                  <span className="text-[9px] text-[var(--color-text-muted)]">{r.name}</span>
                </div>
                <span className="text-[9px] font-bold text-[var(--color-text)]">{money(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 3: 4-Column Details ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Accounts List */}
        <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
          <h3 className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5 pb-1.5 border-b border-[var(--color-border-subtle)] mb-2">
            <Landmark className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} /> Accounts
          </h3>
          <div className="space-y-2">
            {accountBalances.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `color-mix(in srgb, ${a.color} 12%, transparent)`, color: a.color }}>
                    {a.icon}
                  </div>
                  <span className="text-[11px] font-medium text-[var(--color-text)]">{a.label}</span>
                </div>
                <span className="text-[11px] font-bold text-[var(--color-text-strong)]">{money(a.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AR/AP Aging Bar Chart */}
        <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
          <h3 className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5 pb-1.5 border-b border-[var(--color-border-subtle)] mb-2">
            <HandCoins className="w-3.5 h-3.5" style={{ color: '#0891b2' }} /> AR vs AP Aging
          </h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={agingBarData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v: any) => moneyCompact(Number(v))} />
              <Tooltip formatter={(v: any) => money(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 10, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
              <Bar dataKey="ar" fill="#10b981" radius={[3, 3, 0, 0]} name="AR" />
              <Bar dataKey="ap" fill="#ef4444" radius={[3, 3, 0, 0]} name="AP" />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center justify-between px-2 py-1 rounded-md" style={{ background: 'var(--color-success-background)' }}>
              <span className="text-[9px] font-bold" style={{ color: 'var(--color-success)' }}>AR Total</span>
              <span className="text-[10px] font-black" style={{ color: 'var(--color-success)' }}>{money(totalAR)}</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 rounded-md" style={{ background: 'var(--color-danger-background)' }}>
              <span className="text-[9px] font-bold" style={{ color: 'var(--color-danger)' }}>AP Total</span>
              <span className="text-[10px] font-black" style={{ color: 'var(--color-danger)' }}>{money(totalAP)}</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
          <h3 className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5 pb-1.5 border-b border-[var(--color-border-subtle)] mb-2">
            <Receipt className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} /> Recent Transactions
          </h3>
          <div className="space-y-1.5">
            {recentTxns.slice(0, 5).map((t, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-[var(--color-border-subtle)] last:border-0">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-[var(--color-text)] truncate">{t.name}</p>
                  <p className="text-[9px] text-[var(--color-text-subtle)]">{t.ref} · {t.date}</p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className={`text-[10px] font-bold ${t.type === 'IN' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                    {t.type === 'IN' ? '+' : '−'}{money(t.amt)}
                  </p>
                  <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${t.status === 'Paid' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`} style={{ background: t.status === 'Paid' ? 'var(--color-success-background)' : 'var(--color-warning-background)' }}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
          <h3 className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5 pb-1.5 border-b border-[var(--color-border-subtle)] mb-2">
            <Users className="w-3.5 h-3.5" style={{ color: '#a855f7' }} /> Top Customers
          </h3>
          <div className="space-y-2">
            {topCustomers.map(([name, val], i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium text-[var(--color-text)] truncate max-w-[100px]">{name}</span>
                  <span className="text-[10px] font-bold text-[var(--color-text-strong)]">{money(val)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)' }}>
                  <div className="h-full rounded-full" style={{ width: `${totalRevenue > 0 ? (val / totalRevenue) * 100 : 0}%`, background: ['#3b82f6', '#a855f7', '#06b6d4', '#10b981', '#f59e0b'][i % 5] }} />
                </div>
              </div>
            ))}
            {topCustomers.length === 0 && (
              <p className="text-[10px] text-[var(--color-text-subtle)] text-center py-3">No sales data</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;
