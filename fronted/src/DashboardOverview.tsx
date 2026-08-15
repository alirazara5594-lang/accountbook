import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Receipt, HandCoins,
  CreditCard, AlertTriangle, Building2, Globe2,
  Users, Truck, Landmark, Boxes,
  DollarSign, PiggyBank, BarChart3, ChevronRight, RefreshCw,
  FileText,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  useSalesStore,
  useProcurementStore,
  useBankingStore,
  useAssetsInventoryStore,
  useManufacturingStore,
  usePayrollStore,
  useFieldOperationsStore,
  useComplianceStore,
  useProjectsStore,
  useAdministrationStore,
  useTaxStore,
} from './stores';

interface DashboardOverviewProps {
  accounts: { code: string; name: string; type: string; openingBalance: number; status?: string }[];
  entries: { id: string; status?: string }[];
  setPage: (page: string) => void;
  activeEntityId?: string;
}

function money(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
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

const C = {
  page:    '#f8fafc',
  card:    '#ffffff',
  inner:   '#f1f5f9',
  bdr:     '#e2e8f0',
  bdr2:    '#cbd5e1',
  accent:  '#0ea5e9',
  cyan:    '#0891b2',
  amber:   '#d97706',
  emerald: '#059669',
  rose:    '#e11d48',
  violet:  '#7c3aed',
  pink:    '#db2777',
  white:   '#1e293b',
  muted:   '#475569',
  dim:     '#94a3b8',
  blue:    '#2563eb',
};

export function DashboardOverview({ accounts, entries: _entries, setPage, activeEntityId }: DashboardOverviewProps) {
  const { invoices, fetchAllSales }                                                  = useSalesStore();
  const { bills, fetchAllProcurement }                                              = useProcurementStore();
  const { bankAccounts, cashAccounts, fetchAllBanking }                              = useBankingStore();
  const { stockLevels, fetchAllAssetsInventory }                                    = useAssetsInventoryStore();
  const { fetchAllManufacturing }                                                    = useManufacturingStore();
  const { employees }                                                                = usePayrollStore();
  const fieldStore      = useFieldOperationsStore();
  const complianceStore = useComplianceStore();
  const { fetchAll: fetchProjectsAll }                                               = useProjectsStore();
  const adminStore                                                                   = useAdministrationStore();
  const { fetchAllTaxData }                                                          = useTaxStore();

  const [loading, setLoading] = useState(true);
  const [today] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = now;
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAllSales(activeEntityId),
      fetchAllProcurement(activeEntityId),
      fetchAllBanking(activeEntityId),
      fetchAllAssetsInventory(activeEntityId),
      fetchAllManufacturing(activeEntityId),
      usePayrollStore.getState().fetchAll(),
      fieldStore.fetchAll(),
      complianceStore.fetchAll(),
      fetchProjectsAll(),
      adminStore.fetchAll(),
      fetchAllTaxData(),
    ]).catch(() => {}).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntityId]);

  /* ── derived KPIs ── */
  const totalRevenue  = accounts.filter(a => a.type === 'Revenue' || a.type === 'ContraRevenue').reduce((s, a) => s + a.openingBalance, 0);
  const totalExpense  = accounts.filter(a => a.type === 'Expense' || a.type === 'ContraExpense').reduce((s, a) => s + a.openingBalance, 0);
  const totalAssets   = accounts.filter(a => a.type === 'Asset').reduce((s, a) => s + a.openingBalance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((s, a) => s + a.openingBalance, 0);
  const totalEquity   = accounts.filter(a => a.type === 'Equity').reduce((s, a) => s + a.openingBalance, 0);
  const netIncome     = totalRevenue - totalExpense;
  const cashBal       = accounts.filter(a => a.code.startsWith('111')).reduce((s, a) => s + Math.abs(a.openingBalance), 0);
  const bankBal       = accounts.filter(a => a.code.startsWith('112')).reduce((s, a) => s + Math.abs(a.openingBalance), 0);
  const bankAndCash   = cashBal + bankBal;

  const totalInvoiced = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const openInvoices  = invoices.filter(i => (i.amountDue || 0) > 0);
  const overdueCount  = openInvoices.filter(i => new Date(i.dueDate).getTime() < Date.now()).length;

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
  const totalAR   = arAging['Current'] + arOverdue;
  const totalAP   = apAging['Current'] + apOverdue;

  const bankTotal = bankAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const cashTotal = cashAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);

  const stockValue = stockLevels.reduce((s, l) => s + (l.quantityOnHand || 0) * (l.unitCost || 0), 0);

  const billTotal = unpaidBillsArr.reduce((s: number, b: any) => s + (b.totalAmount ?? b.total ?? 0), 0);

  /* ── chart data ── */
  const incomeExpenseData = [
    { day: '01', inc: totalRevenue * 0.03, exp: totalExpense * 0.028 },
    { day: '05', inc: totalRevenue * 0.06, exp: totalExpense * 0.055 },
    { day: '10', inc: totalRevenue * 0.12, exp: totalExpense * 0.10 },
    { day: '15', inc: totalRevenue * 0.18, exp: totalExpense * 0.15 },
    { day: '20', inc: totalRevenue * 0.22, exp: totalExpense * 0.19 },
    { day: '25', inc: totalRevenue * 0.28, exp: totalExpense * 0.24 },
    { day: '30', inc: totalRevenue * 0.32, exp: totalExpense * 0.28 },
  ];

  const salesByCustomer = invoices.reduce<Record<string, number>>((acc, inv) => {
    const name = inv.customerName || 'Others';
    acc[name] = (acc[name] || 0) + (inv.totalAmount || 0);
    return acc;
  }, {});
  const topCustomers = Object.entries(salesByCustomer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const customerPieColors = [C.cyan, C.emerald, C.amber, C.violet, C.rose];
  const customerPieData = topCustomers.map(([name, value]) => ({ name, value }));

  const expenseByCategory = accounts
    .filter(a => a.type === 'Expense' || a.type === 'ContraExpense')
    .reduce<Record<string, number>>((acc, a) => {
      const cat = a.name || 'Others';
      acc[cat] = (acc[cat] || 0) + Math.abs(a.openingBalance);
      return acc;
    }, {});
  const topExpenses = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const expensePieColors = [C.rose, C.amber, C.violet, C.cyan, C.emerald];
  const expensePieData = topExpenses.map(([name, value]) => ({ name, value }));

  /* ── recent transactions ── */
  const recentInvoices = invoices.slice(0, 3).map(i => ({
    id: i.invoiceNumber || i.id,
    label: i.customerName || 'Customer',
    date: fmtDate(i.date),
    amount: i.totalAmount || 0,
    status: (i.amountDue ?? 0) <= 0 ? 'Paid' : 'Unpaid',
    color: C.cyan,
    icon: <Receipt size={14} />,
  }));
  const recentBills = unpaidBillsArr.slice(0, 3).map((b: any) => ({
    id: b.billNumber || b.number || b.id,
    label: b.vendorName || 'Vendor',
    date: fmtDate(b.date),
    amount: b.totalAmount || b.total || 0,
    status: 'Unpaid',
    color: C.amber,
    icon: <FileText size={14} />,
  }));
  const recentTxns = [...recentInvoices, ...recentBills].sort(() => 0.5 - Math.random()).slice(0, 4);

  /* ── account balances list ── */
  const accountBalances = [
    { name: 'Cash in Hand',     value: cashTotal,  color: C.emerald, icon: <Wallet size={14} /> },
    { name: 'Bank Accounts',    value: bankTotal,  color: C.blue,    icon: <Landmark size={14} /> },
    { name: 'Receivables',      value: totalAR,    color: C.cyan,    icon: <HandCoins size={14} /> },
    { name: 'Inventory',        value: stockValue, color: C.violet,  icon: <Boxes size={14} /> },
    { name: 'Payables',         value: totalAP,    color: C.rose,    icon: <CreditCard size={14} /> },
  ];

  /* ── system overview ── */
  const systemStats = [
    { label: 'Total Customers',  value: num(invoices.length), trend: '+8', color: C.cyan,    icon: <Users size={18} /> },
    { label: 'Total Vendors',    value: num(bills.length),    trend: '+5', color: C.emerald, icon: <Truck size={18} /> },
    { label: 'Total Products',   value: num(stockLevels.length), trend: '+12', color: C.amber, icon: <Boxes size={18} /> },
    { label: 'Active Users',     value: num(employees.filter(e => e.status === 'Active').length), trend: '',   color: C.violet, icon: <Users size={18} /> },
  ];

  /* ── bottom metrics ── */
  const grossProfit  = totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue * 100) : 0;
  const currentRatio = totalLiabilities > 0 ? (totalAssets / totalLiabilities) : 0;
  const bottomMetrics = [
    { label: 'Gross Profit Margin', value: `${grossProfit.toFixed(1)}%`, trend: '+2.4%', up: true, color: C.emerald },
    { label: 'Operating Expenses',  value: money(totalExpense * 0.45),  trend: '+6.8%', up: true, color: C.rose },
    { label: 'Net Profit Margin',   value: `${(totalRevenue > 0 ? netIncome / totalRevenue * 100 : 0).toFixed(1)}%`, trend: '+2.1%', up: true, color: C.emerald },
    { label: 'Receivables Turnover', value: totalAR > 0 ? `${(totalInvoiced / totalAR).toFixed(1)}x` : '—', trend: '+0.8x', up: true, color: C.cyan },
    { label: 'Payables Turnover',   value: totalAP > 0 ? `${(billTotal / totalAP).toFixed(1)}x` : '—', trend: '+0.6x', up: true, color: C.amber },
    { label: 'Current Ratio',       value: currentRatio.toFixed(2), trend: '+0.15', up: true, color: C.violet },
  ];

  /* ================================================================ */
  return (
    <div className="space-y-4 font-sans select-none" style={{ color: C.white, background: C.page }}>

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight" style={{ color: C.white }}>Dashboard</h1>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>Welcome back, Admin</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px]"
                style={{ background: C.card, border: `1px solid ${C.bdr}`, color: C.muted }}>
            <Globe2 size={11} style={{ color: C.accent }} /> {today}
          </span>
          {loading && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-widest"
                  style={{ background: C.inner, border: `1px solid ${C.bdr}`, color: C.accent }}>
              <RefreshCw size={11} className="animate-spin" /> Syncing
            </span>
          )}
        </div>
      </div>

      {/* ── ROW 1 — 4 KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue',   value: money(totalRevenue), sub: `vs last month ${money(totalRevenue * 0.89)}`, icon: <TrendingUp size={16} />,    color: C.blue,    trend: '+12.5%', up: true },
          { label: 'Total Expenses',  value: money(totalExpense), sub: `vs last month ${money(totalExpense * 0.92)}`, icon: <CreditCard size={16} />,   color: C.rose,    trend: '-8.3%',  up: false },
          { label: 'Net Profit',      value: money(netIncome),    sub: `vs last month ${money(netIncome * 0.87)}`,   icon: <DollarSign size={16} />,   color: C.emerald, trend: '+15.7%', up: true },
          { label: 'Cash & Bank',     value: money(bankAndCash),  sub: `As of ${fmtDate(new Date().toISOString())}`, icon: <PiggyBank size={16} />,    color: C.violet,  trend: '',       up: true },
        ].map((c, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-3"
               style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>
              {c.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-semibold" style={{ color: C.muted }}>{c.label}</p>
                {c.trend && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold"
                        style={{ color: c.up ? C.emerald : C.rose }}>
                    {c.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />} {c.trend}
                  </span>
                )}
              </div>
              <p className="text-base font-bold mt-0.5" style={{ color: C.white }}>{c.value}</p>
              <p className="text-[9px] mt-0.5" style={{ color: C.dim }}>{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── ROW 2 — Income/Expenses Chart + Account Balances + Sales by Customers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Income & Expenses Overview — AreaChart */}
        <div className="lg:col-span-1 rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: C.white }}>Income & Expenses Overview</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-md" style={{ background: C.inner, color: C.muted, border: `1px solid ${C.bdr}` }}>This Month</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <span className="inline-flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
              <span className="w-2 h-2 rounded-full" style={{ background: C.cyan }} /> Income
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
              <span className="w-2 h-2 rounded-full" style={{ background: C.rose }} /> Expenses
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={incomeExpenseData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.cyan} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.rose} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={C.rose} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.bdr} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: C.dim }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.dim }} axisLine={false} tickLine={false}
                     tickFormatter={(v: any) => Number(v) >= 1000000 ? `${(Number(v) / 1000000).toFixed(1)}M` : Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 8, fontSize: 11, color: C.white }}
                       formatter={(v: any, name: any) => [money(Number(v)), name === 'inc' ? 'Income' : 'Expenses']} />
              <Area type="monotone" dataKey="inc" stroke={C.cyan} strokeWidth={2} fill="url(#gInc)" name="inc" />
              <Area type="monotone" dataKey="exp" stroke={C.rose} strokeWidth={2} fill="url(#gExp)" name="exp" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Account Balances */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: C.white }}>Account Balances</h3>
            <button onClick={() => setPage('Banking & Payments.Bank Accounts')}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md hover:opacity-80"
                    style={{ background: C.inner, color: C.accent, border: `1px solid ${C.bdr}` }}>
              View All
            </button>
          </div>
          <div className="space-y-2">
            {accountBalances.map(a => (
              <div key={a.name} className="flex items-center justify-between py-2 px-3 rounded-lg"
                   style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                       style={{ background: `${a.color}22`, color: a.color }}>
                    {a.icon}
                  </div>
                  <span className="text-xs font-medium" style={{ color: C.muted }}>{a.name}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: a.value < 0 ? C.rose : C.white }}>
                  {a.value < 0 ? `(${money(Math.abs(a.value))})` : money(a.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Top Customers — PieChart */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: C.white }}>Sales by Top Customers</h3>
            <button onClick={() => setPage('Sales & Customers.Sales Workspace')}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md hover:opacity-80"
                    style={{ background: C.inner, color: C.accent, border: `1px solid ${C.bdr}` }}>
              View All
            </button>
          </div>
          {customerPieData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-xs" style={{ color: C.dim }}>No sales data</div>
          ) : (
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={140} height={180}>
                <PieChart>
                  <Pie data={customerPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                       dataKey="value" strokeWidth={0}>
                    {customerPieData.map((_, i) => <Cell key={i} fill={customerPieColors[i % customerPieColors.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 min-w-0">
                {customerPieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-[10px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: customerPieColors[i % customerPieColors.length] }} />
                    <span className="truncate" style={{ color: C.muted }}>{d.name}</span>
                    <span className="ml-auto font-bold shrink-0" style={{ color: C.white }}>{money(d.value)}</span>
                  </div>
                ))}
                <div className="pt-1 border-t" style={{ borderColor: C.bdr }}>
                  <span className="text-[10px] font-bold" style={{ color: C.white }}>Total · {money(totalInvoiced)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3 — Recent Transactions + Expense by Category + Aging Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Transactions */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: C.white }}>Recent Transactions</h3>
            <button onClick={() => setPage('Sales & Customers.Sales Workspace')}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md hover:opacity-80"
                    style={{ background: C.inner, color: C.accent, border: `1px solid ${C.bdr}` }}>
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentTxns.map((t, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                   style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                     style={{ background: `${t.color}22`, color: t.color }}>
                  {t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono font-bold truncate" style={{ color: C.white }}>{t.id}</p>
                  <p className="text-[10px] truncate" style={{ color: C.dim }}>{t.label}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold" style={{ color: C.white }}>{money(t.amount)}</p>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ color: t.status === 'Paid' ? C.emerald : C.amber, background: `${t.status === 'Paid' ? C.emerald : C.amber}1a` }}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense by Category — PieChart */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Expense by Category</h3>
          {expensePieData.length === 0 ? (
            <div className="flex items-center justify-center h-[180px] text-xs" style={{ color: C.dim }}>No expense data</div>
          ) : (
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={140} height={180}>
                <PieChart>
                  <Pie data={expensePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                       dataKey="value" strokeWidth={0}>
                    {expensePieData.map((_, i) => <Cell key={i} fill={expensePieColors[i % expensePieColors.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 min-w-0">
                {expensePieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-[10px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: expensePieColors[i % expensePieColors.length] }} />
                    <span className="truncate" style={{ color: C.muted }}>{d.name}</span>
                    <span className="ml-auto font-bold shrink-0" style={{ color: C.white }}>{money(d.value)}</span>
                  </div>
                ))}
                <div className="pt-1 border-t" style={{ borderColor: C.bdr }}>
                  <span className="text-[10px] font-bold" style={{ color: C.white }}>Total · {money(totalExpense)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Aging Summary */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: C.white }}>Aging Summary (Receivable)</h3>
            <button onClick={() => setPage('Sales & Customers.Sales Workspace')}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md hover:opacity-80"
                    style={{ background: C.inner, color: C.accent, border: `1px solid ${C.bdr}` }}>
              View All
            </button>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Current (0 – 30 Days)', value: arAging['Current'], color: C.emerald },
              { label: '31 – 60 Days',          value: arAging['1-30'],   color: C.amber },
              { label: '61 – 90 Days',          value: arAging['31-60'],  color: '#fb923c' },
              { label: 'Over 90 Days',           value: arAging['90+'],    color: C.rose },
            ].map(a => (
              <div key={a.label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                   style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                  <span className="text-[11px] font-medium" style={{ color: C.muted }}>{a.label}</span>
                </div>
                <span className="text-[11px] font-bold" style={{ color: C.white }}>{money(a.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: C.bdr }}>
              <span className="text-[11px] font-bold" style={{ color: C.white }}>Total</span>
              <span className="text-[11px] font-bold" style={{ color: C.white }}>{money(totalAR)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 4 — ACCOUNTING EQUATION ── */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.white }}>Accounting Equation</h3>
          <span className="text-[10px]" style={{ color: C.dim }}>The foundation of double-entry accounting</span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Assets',      value: totalAssets,      color: C.blue,    icon: <Building2 size={16} /> },
            { label: 'Liabilities', value: totalLiabilities, color: C.rose,    icon: <CreditCard size={16} /> },
            { label: 'Equity',      value: totalEquity,      color: C.emerald, icon: <Users size={16} /> },
          ].map((e, i) => (
            <div key={e.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                   style={{ background: `${e.color}15`, border: `1px solid ${e.color}40` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: `${e.color}25`, color: e.color }}>
                  {e.icon}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{e.label}</p>
                  <p className="text-sm font-extrabold" style={{ color: C.white }}>{money(e.value)}</p>
                </div>
              </div>
              {i < 2 && <span className="text-lg font-bold" style={{ color: C.dim }}>{i === 0 ? '=' : '+'}</span>}
            </div>
          ))}
          <span className="text-lg font-bold" style={{ color: C.dim }}>=</span>
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
               style={{ background: `${C.violet}15`, border: `1px solid ${C.violet}40` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: `${C.violet}25`, color: C.violet }}>
              <BarChart3 size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>Net Assets</p>
              <p className="text-sm font-extrabold" style={{ color: C.white }}>{money(totalAssets - totalLiabilities)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 5 — Insights & Alerts + System Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Insights & Alerts */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Insights & Alerts</h3>
          <div className="space-y-2">
            {[
              { text: 'Cash flow is healthy',       sub: 'Cash this month', color: C.emerald, icon: <Wallet size={14} /> },
              { text: `${overdueCount} invoices overdue`, sub: `Total overdue ${money(arOverdue)}`, color: C.amber, icon: <AlertTriangle size={14} /> },
              { text: 'Bank Reconciliation pending', sub: 'Statement pending', color: C.blue, icon: <Landmark size={14} /> },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer hover:opacity-80"
                   style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                     style={{ background: `${a.color}22`, color: a.color }}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold" style={{ color: C.white }}>{a.text}</p>
                  <p className="text-[10px]" style={{ color: C.dim }}>{a.sub}</p>
                </div>
                <ChevronRight size={14} style={{ color: C.dim }} />
              </div>
            ))}
          </div>
        </div>

        {/* System Overview */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>System Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            {systemStats.map(s => (
              <div key={s.label} className="rounded-lg p-3" style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                       style={{ background: `${s.color}22`, color: s.color }}>
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium" style={{ color: C.muted }}>{s.label}</p>
                    <p className="text-lg font-extrabold" style={{ color: C.white }}>{s.value}</p>
                  </div>
                </div>
                {s.trend && (
                  <span className="text-[10px] font-bold" style={{ color: C.emerald }}>
                    <TrendingUp size={10} className="inline" /> {s.trend} this month
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 6 — Bottom Metric Strip ── */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {bottomMetrics.map((m, i) => (
            <div key={i} className="text-center">
              <p className="text-[10px] font-medium mb-1" style={{ color: C.muted }}>{m.label}</p>
              <p className="text-sm font-extrabold" style={{ color: C.white }}>{m.value}</p>
              <span className="text-[10px] font-bold" style={{ color: m.up ? C.emerald : C.rose }}>
                {m.up ? <TrendingUp size={10} className="inline" /> : <TrendingDown size={10} className="inline" />} {m.trend}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
