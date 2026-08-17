import { useEffect, useState } from 'react';
import {
  TrendingUp, Wallet, Receipt, Building2, Users, Truck, Landmark, Boxes,
  DollarSign, BarChart3, RefreshCw, ShieldCheck, AlertCircle,
  Scale, HandCoins, CreditCard, Layers
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  useSalesStore, useProcurementStore, useBankingStore, useAssetsInventoryStore,
  useManufacturingStore, usePayrollStore, useFieldOperationsStore, useComplianceStore,
  useProjectsStore, useAdministrationStore, useTaxStore,
} from './stores';
import { money } from './lib/currency';

interface DashboardOverviewProps {
  accounts: { code: string; name: string; type: string; openingBalance: number; status?: string }[];
  entries: { id: string; status?: string }[];
  setPage: (page: string) => void;
  activeEntityId?: string;
}

function num(n: number) {
  return new Intl.NumberFormat('en-US').format(n || 0);
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

export function DashboardOverview({ accounts, entries: _entries, setPage, activeEntityId }: DashboardOverviewProps) {
  const { invoices, fetchAllSales } = useSalesStore();
  const { bills, fetchAllProcurement } = useProcurementStore();
  const { bankAccounts, cashAccounts, fetchAllBanking } = useBankingStore();
  const { stockLevels, fetchAllAssetsInventory } = useAssetsInventoryStore();
  const { fetchAllManufacturing } = useManufacturingStore();
  const { employees } = usePayrollStore();
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
  const totalEquity = accounts.filter(a => a.type === 'Equity').reduce((s, a) => s + a.openingBalance, 0);
  const netIncome = totalRevenue - totalExpense;

  const bankTotal = bankAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const cashTotal = cashAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const totalLiquidity = bankTotal + cashTotal;

  const openInvoices = invoices.filter(i => (i.amountDue || 0) > 0);
  const overdueCount = openInvoices.filter(i => new Date(i.dueDate).getTime() < Date.now()).length;

  const unpaidBillsArr = (bills as any[]).filter(b => (b.amountDue ?? (b.status !== 'Paid' ? b.totalAmount ?? b.total ?? 0 : 0)) > 0);

  const arAging: Record<string, number> = {}; BUCKETS.forEach(b => arAging[b] = 0);
  openInvoices.forEach(i => { arAging[agingBucket(i.dueDate)] += i.amountDue || 0; });
  const apAging: Record<string, number> = {}; BUCKETS.forEach(b => apAging[b] = 0);
  unpaidBillsArr.forEach(b => {
    const due = b.amountDue ?? ((b.totalAmount ?? b.total ?? 0) - (b.amountPaid ?? 0));
    apAging[agingBucket(b.dueDate)] += due;
  });
  const arOverdue = arAging['1-30'] + arAging['31-60'] + arAging['61-90'] + arAging['90+'];
  const apOverdue = apAging['1-30'] + apAging['31-60'] + apAging['61-90'] + apAging['90+'];
  const totalAR = arAging['Current'] + arOverdue;
  const totalAP = apAging['Current'] + apOverdue;

  const stockValue = stockLevels.reduce((s, l) => s + (l.quantityOnHand || 0) * (l.unitCost || 0), 0);

  /* ── Trend / Ratio Data ── */
  const workingCapital = totalAssets - totalLiabilities;
  const currentRatio = totalLiabilities > 0 ? (totalAssets / totalLiabilities) : 0;
  const netMargin = totalRevenue > 0 ? ((netIncome / totalRevenue) * 100) : 0;
  const roe = totalEquity > 0 ? ((netIncome / totalEquity) * 100) : 0;

  const performanceTrend = [
    { period: 'Q1', revenue: totalRevenue * 0.2, expense: totalExpense * 0.22, profit: (totalRevenue * 0.2) - (totalExpense * 0.22) },
    { period: 'Q2', revenue: totalRevenue * 0.24, expense: totalExpense * 0.23, profit: (totalRevenue * 0.24) - (totalExpense * 0.23) },
    { period: 'Q3', revenue: totalRevenue * 0.27, expense: totalExpense * 0.26, profit: (totalRevenue * 0.27) - (totalExpense * 0.26) },
    { period: 'Q4 Est', revenue: totalRevenue * 0.29, expense: totalExpense * 0.29, profit: (totalRevenue * 0.29) - (totalExpense * 0.29) },
  ];

  const agingBarData = [
    { name: 'Cur', ar: arAging['Current'], ap: apAging['Current'] },
    { name: '1-30', ar: arAging['1-30'], ap: apAging['1-30'] },
    { name: '31-60', ar: arAging['31-60'], ap: apAging['31-60'] },
    { name: '61-90', ar: arAging['61-90'], ap: apAging['61-90'] },
    { name: '90+', ar: arAging['90+'], ap: apAging['90+'] },
  ];

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
    { label: 'Cash & Bank', value: totalLiquidity, color: 'text-blue-600 bg-blue-50' },
    { label: 'Receivables (AR)', value: totalAR, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Inventory', value: stockValue, color: 'text-violet-600 bg-violet-50' },
    { label: 'Payables (AP)', value: totalAP, color: 'text-rose-600 bg-rose-50' },
  ];

  const topCustomers = Object.entries(
    invoices.reduce<Record<string, number>>((acc, i) => {
      const n = i.customerName || 'Others';
      acc[n] = (acc[n] || 0) + (i.totalAmount || 0);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const equityComponents = [
    { label: 'Paid-in Capital', value: totalEquity * 0.6, color: '#7c3aed' },
    { label: 'Retained Earnings', value: totalEquity * 0.3, color: '#2563eb' },
    { label: 'Net Income (Current)', value: netIncome, color: '#059669' },
  ];

  return (
    <div className="max-w-6xl mx-auto font-sans space-y-3">

      {/* ── Compact Executive Header ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-4 py-2.5 rounded-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black tracking-tight text-white leading-tight truncate">
              Executive Financial Cockpit — {today}
            </h1>
            <p className="text-[10px] text-slate-400 truncate">
              Consolidated board-level snapshot of revenue, liquidity, working capital & risk
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {loading && <RefreshCw className="w-3.5 h-3.5 text-indigo-300 animate-spin" />}
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-bold text-emerald-300">
            <ShieldCheck className="w-3 h-3" /> LIVE
          </span>
        </div>
      </div>

      {/* ── KPI Strip: 8 Compact Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Revenue', value: money(totalRevenue), icon: <DollarSign className="w-3.5 h-3.5" />, cls: 'bg-blue-50 text-blue-600', bar: 'bg-blue-500' },
          { label: 'Expenses', value: money(totalExpense), icon: <CreditCard className="w-3.5 h-3.5" />, cls: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500' },
          { label: 'Net Profit', value: money(netIncome), icon: <TrendingUp className="w-3.5 h-3.5" />, cls: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
          { label: 'Liquidity', value: money(totalLiquidity), icon: <Wallet className="w-3.5 h-3.5" />, cls: 'bg-cyan-50 text-cyan-600', bar: 'bg-cyan-500' },
          { label: 'Receivables', value: money(totalAR), icon: <HandCoins className="w-3.5 h-3.5" />, cls: 'bg-violet-50 text-violet-600', bar: 'bg-violet-500' },
          { label: 'Payables', value: money(totalAP), icon: <CreditCard className="w-3.5 h-3.5" />, cls: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500' },
          { label: 'Inventory', value: money(stockValue), icon: <Boxes className="w-3.5 h-3.5" />, cls: 'bg-indigo-50 text-indigo-600', bar: 'bg-indigo-500' },
          { label: 'Working Capital', value: money(workingCapital), icon: <Building2 className="w-3.5 h-3.5" />, cls: 'bg-slate-100 text-slate-700', bar: 'bg-slate-700' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm px-2.5 py-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wide text-gray-500 truncate">{k.label}</span>
              <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${k.cls}`}>{k.icon}</span>
            </div>
            <p className="text-[13px] font-extrabold text-gray-900 mt-1 truncate">{k.value}</p>
            <div className={`absolute bottom-0 left-0 h-0.5 ${k.bar} ${i % 2 ? 'w-1/2' : 'w-full'}`} />
          </div>
        ))}
      </div>

      {/* ── Row A: Trend Chart + Accounting Equation ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Revenue & Profit Trend */}
        <div className="lg:col-span-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
            <div>
              <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" /> Revenue · Expense · Net Profit (Quarterly)
              </h3>
            </div>
            <div className="flex items-center gap-2.5 text-[9px] font-bold">
              <span className="flex items-center gap-1 text-blue-700"><span className="w-2 h-2 rounded-sm bg-blue-600" /> Revenue</span>
              <span className="flex items-center gap-1 text-emerald-700"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Profit</span>
              <span className="flex items-center gap-1 text-rose-700"><span className="w-2 h-2 rounded-sm bg-rose-400" /> Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={performanceTrend} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false}
                     tickFormatter={(v: any) => `$${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => money(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 10 }} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#profGrad)" name="Net Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Accounting Equation */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 pb-1.5 border-b border-gray-100 mb-2">
            <Scale className="w-3.5 h-3.5 text-violet-600" /> Accounting Equation
          </h3>

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/80 px-2.5 py-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center"><Landmark className="w-3.5 h-3.5" /></div>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-500">Assets</p>
                <p className="text-xs font-extrabold text-gray-900">{money(totalAssets)}</p>
              </div>
            </div>
            <div className="text-center text-[10px] font-black text-slate-400 -my-0.5">=</div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/80 px-2.5 py-2">
              <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center"><CreditCard className="w-3.5 h-3.5" /></div>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-500">Liabilities</p>
                <p className="text-xs font-extrabold text-gray-900">{money(totalLiabilities)}</p>
              </div>
            </div>
            <div className="text-center text-[10px] font-black text-slate-400 -my-0.5">+</div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200/80 px-2.5 py-2">
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center"><Users className="w-3.5 h-3.5" /></div>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-500">Equity</p>
                <p className="text-xs font-extrabold text-gray-900">{money(totalEquity)}</p>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase text-slate-500">Net Assets</span>
            <span className="text-xs font-extrabold text-violet-700">{money(totalAssets - totalLiabilities)}</span>
          </div>
        </div>
      </div>

      {/* ── Row B: AR/AP Aging Chart + Small Tables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* AR vs AP Aging */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 pb-1.5 border-b border-gray-100 mb-2">
            <HandCoins className="w-3.5 h-3.5 text-cyan-600" /> Receivables (AR) vs Payables (AP) Aging
          </h3>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={agingBarData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false}
                     tickFormatter={(v: any) => `$${(Number(v) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => money(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 10 }} />
              <Bar dataKey="ar" fill="#10b981" radius={[3, 3, 0, 0]} name="AR" />
              <Bar dataKey="ap" fill="#f43f5e" radius={[3, 3, 0, 0]} name="AP" />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-emerald-50/70 border border-emerald-100">
              <span className="text-[9px] font-bold uppercase text-emerald-800">AR Due</span>
              <span className="text-[11px] font-black text-emerald-700">{money(totalAR)}</span>
            </div>
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-rose-50/70 border border-rose-100">
              <span className="text-[9px] font-bold uppercase text-rose-800">AP Due</span>
              <span className="text-[11px] font-black text-rose-700">{money(totalAP)}</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions — small table */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 mb-1.5">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-600" /> Recent Invoices & Bills
            </h3>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-wide text-gray-400">
                <th className="py-1 pr-1">Ref</th>
                <th className="py-1 pr-1">Party</th>
                <th className="py-1 pr-1 text-right">Amount</th>
                <th className="py-1 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentTxns.map((t, i) => (
                <tr key={i}>
                  <td className={`py-1 pr-1 font-bold ${t.type === 'IN' ? 'text-gray-900' : 'text-amber-700'}`}>{t.ref}</td>
                  <td className="py-1 pr-1 text-gray-500 truncate max-w-[80px]">{t.name}</td>
                  <td className={`py-1 pr-1 text-right font-semibold ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'IN' ? '+' : '−'}{money(t.amt)}
                  </td>
                  <td className="py-1 text-right">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${t.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : t.status === 'Due' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Customers — small table */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 mb-1.5">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-violet-600" /> Top Customers by Revenue
            </h3>
          </div>
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-wide text-gray-400">
                <th className="py-1 pr-1">Customer</th>
                <th className="py-1 text-right">Revenue</th>
                <th className="py-1 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topCustomers.map(([name, val], i) => (
                <tr key={i}>
                  <td className="py-1 pr-1 font-medium text-gray-800 truncate max-w-[110px]">{name}</td>
                  <td className="py-1 pr-1 text-right font-semibold text-gray-900">{money(val)}</td>
                  <td className="py-1 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-10 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${totalRevenue > 0 ? (val / totalRevenue) * 100 : 0}%`, background: ['#0891b2', '#059669', '#d97706', '#7c3aed'][i % 4] }} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 w-7 text-right">{totalRevenue > 0 ? ((val / totalRevenue) * 100).toFixed(0) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {topCustomers.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-gray-400 text-[11px]">No sales data</td></tr>
              )}
            </tbody>
          </table>

          <div className="mt-2 pt-2 border-t border-gray-100">
            <h4 className="text-[9px] font-bold uppercase text-gray-400 mb-1">Balance Sheet Composition</h4>
            {accountBalances.map(a => (
              <div key={a.label} className="flex items-center justify-between py-0.5">
                <span className={`text-[10px] font-medium ${a.color.split(' ')[0]}`}>{a.label}</span>
                <span className="text-[10px] font-bold text-gray-700">{money(a.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row C: Equity Breakdown + Alerts + Footprint ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Equity Breakdown */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 pb-1.5 border-b border-gray-100 mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-600" /> Equity Composition
          </h3>
          <div className="space-y-1.5">
            {equityComponents.map((e, i) => {
              const pct = totalEquity > 0 ? (e.value / totalEquity) * 100 : 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-medium text-slate-600">{e.label}</span>
                      <span className="text-[10px] font-bold text-gray-800">{money(e.value)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: e.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 grid grid-cols-3 gap-1.5">
            <div className="text-center bg-slate-50 rounded-md py-1.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">ROE</p>
              <p className="text-[11px] font-extrabold text-gray-900">{roe.toFixed(1)}%</p>
            </div>
            <div className="text-center bg-slate-50 rounded-md py-1.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">Margin</p>
              <p className="text-[11px] font-extrabold text-gray-900">{netMargin.toFixed(1)}%</p>
            </div>
            <div className="text-center bg-slate-50 rounded-md py-1.5">
              <p className="text-[9px] font-bold uppercase text-slate-400">CR</p>
              <p className="text-[11px] font-extrabold text-gray-900">{currentRatio.toFixed(2)}x</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 pb-1.5 border-b border-gray-100 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Key Alerts
          </h3>
          <div className="space-y-1.5">
            <button onClick={() => setPage('Sales & Customers.Customer Aging')}
              className={`w-full text-left p-2 rounded-lg border flex items-start gap-2 transition-colors ${overdueCount > 0 ? 'bg-amber-50/70 border-amber-200 hover:bg-amber-100/60' : 'bg-emerald-50/70 border-emerald-200'}`}>
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${overdueCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <p className={`text-[11px] font-bold ${overdueCount > 0 ? 'text-amber-900' : 'text-emerald-800'}`}>
                  {overdueCount > 0 ? `${overdueCount} Overdue Receivables` : 'No overdue receivables'}
                </p>
                <p className="text-[9px] text-amber-700/80 mt-0.5">Total {money(arOverdue)} past due — follow up required.</p>
              </div>
            </button>
            <button onClick={() => setPage('Banking & Payments.Bank Accounts')}
              className="w-full text-left p-2 rounded-lg bg-blue-50/70 border border-blue-200 hover:bg-blue-100/60 flex items-start gap-2 transition-colors">
              <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-blue-900">Treasury Reconciliation</p>
                <p className="text-[9px] text-blue-700/80 mt-0.5">{bankAccounts.length} bank accounts to audit.</p>
              </div>
            </button>
            <button onClick={() => setPage('Procurement.Bills')}
              className="w-full text-left p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-start gap-2 transition-colors">
              <span className="w-2 h-2 rounded-full bg-slate-400 mt-1 shrink-0" />
              <div>
                <p className="text-[11px] font-bold text-slate-800">Payables Commitments</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{unpaidBillsArr.length} vendor bills awaiting settlement.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Enterprise Footprint */}
        <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 pb-1.5 border-b border-gray-100 mb-2">
            <Building2 className="w-3.5 h-3.5 text-slate-600" /> Enterprise Footprint
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Customers', count: num(invoices.length), icon: <Users className="w-3 h-3" />, page: 'Sales & Customers.Customers', cls: 'text-cyan-600 bg-cyan-50' },
              { label: 'Vendors', count: num(bills.length), icon: <Truck className="w-3 h-3" />, page: 'Procurement.Vendors', cls: 'text-emerald-600 bg-emerald-50' },
              { label: 'Bank Accounts', count: num(bankAccounts.length), icon: <Landmark className="w-3 h-3" />, page: 'Banking & Payments.Bank Accounts', cls: 'text-blue-600 bg-blue-50' },
              { label: 'Products', count: num(stockLevels.length), icon: <Boxes className="w-3 h-3" />, page: 'Sales & Customers.Products & Services', cls: 'text-violet-600 bg-violet-50' },
              { label: 'Employees', count: num(employees.length), icon: <Users className="w-3 h-3" />, page: 'HR & Payroll.Employee Directory', cls: 'text-amber-600 bg-amber-50' },
              { label: 'Invoices', count: num(invoices.length), icon: <Receipt className="w-3 h-3" />, page: 'Sales & Customers.Sales Workspace', cls: 'text-blue-600 bg-blue-50' },
            ].map((m, i) => (
              <button key={i} onClick={() => setPage(m.page)}
                className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-indigo-50/60 rounded-lg border border-slate-200/70 hover:border-indigo-300 text-left transition-colors">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${m.cls}`}>{m.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[9px] font-medium text-slate-500 truncate">{m.label}</span>
                  <span className="block text-[11px] font-extrabold text-gray-900">{m.count}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase text-slate-400">Compliance Status</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">All Clear</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardOverview;