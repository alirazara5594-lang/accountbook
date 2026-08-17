import { useEffect, useState } from 'react';
import {
  Users, ShoppingCart, Landmark, Scale, Boxes, Wallet, TrendingUp,
  TrendingDown, AlertTriangle, Receipt, FileText, ArrowUpRight, Package,
  Warehouse, Banknote, HandCoins, Building2, Layers, ClipboardList,
  CalendarCheck2, CreditCard, DollarSign,
  Activity, Truck, BarChart3, ChevronRight, RefreshCw, CircleDollarSign,
  UserCheck, CalendarDays, Briefcase,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import {
  useSalesStore,
  useCustomersStore,
  useProductsStore,
  useProcurementStore,
  useVendorsStore,
  useBankingStore,
  useAssetsInventoryStore,
  usePayrollStore,
} from './stores';
import { money } from './lib/currency';

const num = (n: number) => new Intl.NumberFormat('en-US').format(n || 0);

const C = {
  page: '#f8fafc', card: '#ffffff', inner: '#f1f5f9', bdr: '#e2e8f0',
  accent: '#0ea5e9', cyan: '#0891b2', amber: '#d97706', emerald: '#059669',
  rose: '#e11d48', violet: '#7c3aed', pink: '#db2777', white: '#1e293b',
  muted: '#475569', dim: '#94a3b8', blue: '#2563eb',
};

/* ────────────────────────────────────────────────────────────────── */
/*  SALES & CUSTOMERS                                                */
/* ────────────────────────────────────────────────────────────────── */
export function SalesSummaryView({ activeEntityId, setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const sales = useSalesStore();
  const customersStore = useCustomersStore();
  const products = useProductsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      sales.fetchAllSales(activeEntityId),
      customersStore.fetchCustomers(activeEntityId),
      products.fetchProducts(activeEntityId),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [activeEntityId]);

  const { invoices } = sales;
  const totalInvoiced = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const collected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const outstanding = invoices.reduce((s, i) => s + ((i.amountDue ?? (i.totalAmount - (i.paidAmount || 0))) || 0), 0);
  const openInvoices = invoices.filter(i => (i.amountDue ?? 0) > 0);
  const overdueCount = openInvoices.filter(i => new Date(i.dueDate).getTime() < Date.now()).length;
  const activeCustomers = customersStore.customers.filter(c => String(c.status) === 'Active').length;

  const invByStatus = [
    { name: 'Paid', value: invoices.filter(i => (i.amountDue ?? 0) <= 0).length, fill: C.emerald },
    { name: 'Unpaid', value: openInvoices.length, fill: C.amber },
    { name: 'Overdue', value: overdueCount, fill: C.rose },
  ].filter(d => d.value > 0);

  const monthlySales = [
    { m: 'Jan', amt: totalInvoiced * 0.6 }, { m: 'Feb', amt: totalInvoiced * 0.7 },
    { m: 'Mar', amt: totalInvoiced * 0.8 }, { m: 'Apr', amt: totalInvoiced * 0.75 },
    { m: 'May', amt: totalInvoiced * 0.9 }, { m: 'Jun', amt: totalInvoiced },
  ];

  return (
    <div className="space-y-4 font-sans select-none" style={{ color: C.white, background: C.page }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Sales & Customers</h1>
          <p className="text-xs" style={{ color: C.muted }}>Customer profiles, invoicing, estimates & collections</p>
        </div>
        {loading && <RefreshCw size={14} className="animate-spin" style={{ color: C.accent }} />}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoiced', value: money(totalInvoiced), icon: <Receipt size={14} />, color: C.cyan, trend: '+12.5%', up: true },
          { label: 'Collected', value: money(collected), icon: <Banknote size={14} />, color: C.emerald, trend: '+8.3%', up: true },
          { label: 'Outstanding AR', value: money(outstanding), icon: <HandCoins size={14} />, color: C.amber, trend: overdueCount > 0 ? `${overdueCount} overdue` : 'Clear', up: overdueCount === 0 },
          { label: 'Active Customers', value: num(activeCustomers), icon: <Users size={14} />, color: C.violet, trend: `+${num(invoices.length)} invoices`, up: true },
        ].map((c, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>
              {c.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold" style={{ color: C.muted }}>{c.label}</p>
              <p className="text-sm font-bold truncate" style={{ color: C.white }}>{c.value}</p>
              <span className="text-[9px] font-bold" style={{ color: c.up ? C.emerald : C.rose }}>
                {c.up ? <TrendingUp size={8} className="inline" /> : <TrendingDown size={8} className="inline" />} {c.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Trend */}
        <div className="lg:col-span-2 rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Sales Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlySales} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.cyan} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.bdr} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 9, fill: C.dim }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.dim }} axisLine={false} tickLine={false}
                     tickFormatter={(v: any) => Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 8, fontSize: 11, color: C.white }}
                       formatter={(v: any) => [money(Number(v)), 'Sales']} />
              <Area type="monotone" dataKey="amt" stroke={C.cyan} strokeWidth={2} fill="url(#gSales)" name="amt" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Invoice Status Donut */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Invoice Status</h3>
          {invByStatus.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-xs" style={{ color: C.dim }}>No invoices</div>
          ) : (
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={120} height={160}>
                <PieChart>
                  <Pie data={invByStatus} cx="50%" cy="50%" innerRadius={32} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {invByStatus.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {invByStatus.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-[10px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                    <span style={{ color: C.muted }}>{d.name}</span>
                    <span className="font-bold" style={{ color: C.white }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices + Quick Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: C.white }}>Recent Invoices</h3>
            <button onClick={() => setPage?.('Sales & Customers.Sales Workspace')}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md hover:opacity-80"
                    style={{ background: C.inner, color: C.accent, border: `1px solid ${C.bdr}` }}>View All</button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-auto">
            {invoices.slice(0, 5).map(i => {
              const overdue = (i.amountDue ?? 0) > 0 && new Date(i.dueDate).getTime() < Date.now();
              return (
                <div key={i.id} className="flex items-center gap-3 py-2 px-3 rounded-lg" style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: overdue ? `${C.rose}22` : `${C.emerald}22`, color: overdue ? C.rose : C.emerald }}>
                    {overdue ? <AlertTriangle size={12} /> : <Receipt size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-mono font-bold truncate" style={{ color: C.white }}>{i.invoiceNumber}</p>
                    <p className="text-[10px] truncate" style={{ color: C.dim }}>{i.customerName || '—'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold" style={{ color: C.white }}>{money(i.totalAmount)}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ color: (i.amountDue ?? 0) <= 0 ? C.emerald : overdue ? C.rose : C.amber,
                                   background: `${(i.amountDue ?? 0) <= 0 ? C.emerald : overdue ? C.rose : C.amber}1a` }}>
                      {(i.amountDue ?? 0) <= 0 ? 'Paid' : overdue ? 'Overdue' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Quick Links</h3>
          <div className="space-y-1.5">
            {[
              { label: 'Customers', page: 'Sales & Customers.Customers', icon: <Users size={14} />, color: C.cyan },
              { label: 'Sales Workspace', page: 'Sales & Customers.Sales Workspace', icon: <Receipt size={14} />, color: C.emerald },
              { label: 'Estimates & Quotes', page: 'Sales & Customers.Estimates & Quotes', icon: <FileText size={14} />, color: C.amber },
              { label: 'Sales Orders', page: 'Sales & Customers.Sales Orders', icon: <ClipboardList size={14} />, color: C.violet },
              { label: 'Customer Payments', page: 'Sales & Customers.Customer Payments', icon: <DollarSign size={14} />, color: C.blue },
              { label: 'Sales Reports', page: 'Sales & Customers.Sales Reports', icon: <BarChart3 size={14} />, color: C.pink },
            ].map(s => (
              <button key={s.page} onClick={() => setPage?.(s.page)}
                      className="w-full flex items-center gap-3 py-2 px-3 rounded-lg hover:opacity-80 transition-colors"
                      style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
                <span className="text-[11px] font-medium flex-1 text-left" style={{ color: C.white }}>{s.label}</span>
                <ChevronRight size={12} style={{ color: C.dim }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  PROCUREMENT                                                       */
/* ────────────────────────────────────────────────────────────────── */
export function ProcurementSummaryView({ activeEntityId, setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const proc = useProcurementStore();
  const vendorsStore = useVendorsStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([proc.fetchAllProcurement(activeEntityId), vendorsStore.fetchVendors(activeEntityId)])
      .catch(() => {}).finally(() => setLoading(false));
  }, [activeEntityId]);

  const { orders, bills, requests, grns } = proc;
  const billTotal = bills.reduce((s, b: any) => s + (b.totalAmount || b.total || 0), 0);
  const orderValue = orders.reduce((s, o: any) => s + (o.totalAmount || o.total || 0), 0);
  const openOrders = orders.filter((o: any) => ['Open', 'Pending', 'Approved'].includes(o.status)).length;
  const openRequests = requests.filter(r => !['Closed', 'Approved'].includes(r.status)).length;
  const paidBills = bills.filter((b: any) => b.status === 'Paid').length;
  const unpaidBills = bills.length - paidBills;

  const spendByMonth = [
    { m: 'Jan', po: orderValue * 0.5, bills: billTotal * 0.4 },
    { m: 'Feb', po: orderValue * 0.65, bills: billTotal * 0.55 },
    { m: 'Mar', po: orderValue * 0.75, bills: billTotal * 0.7 },
    { m: 'Apr', po: orderValue * 0.85, bills: billTotal * 0.8 },
    { m: 'May', po: orderValue * 0.95, bills: billTotal * 0.9 },
    { m: 'Jun', po: orderValue, bills: billTotal },
  ];

  const billStatus = [
    { name: 'Paid', value: paidBills, fill: C.emerald },
    { name: 'Unpaid', value: unpaidBills, fill: C.amber },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4 font-sans select-none" style={{ color: C.white, background: C.page }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Procurement</h1>
          <p className="text-xs" style={{ color: C.muted }}>Purchase requests, POs, goods receipts, and vendor bills</p>
        </div>
        {loading && <RefreshCw size={14} className="animate-spin" style={{ color: C.accent }} />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'PO Value', value: money(orderValue), icon: <ShoppingCart size={14} />, color: C.cyan },
          { label: 'Total Bills', value: money(billTotal), icon: <FileText size={14} />, color: C.amber },
          { label: 'Open POs', value: num(openOrders), icon: <Truck size={14} />, color: C.emerald },
          { label: 'Open Requests', value: num(openRequests), icon: <ClipboardList size={14} />, color: C.violet },
        ].map((c, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold" style={{ color: C.muted }}>{c.label}</p>
              <p className="text-sm font-bold truncate" style={{ color: C.white }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>PO vs Bills Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={spendByMonth} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gPO" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.cyan} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBills" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.amber} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.bdr} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 9, fill: C.dim }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.dim }} axisLine={false} tickLine={false}
                     tickFormatter={(v: any) => Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 8, fontSize: 11, color: C.white }}
                       formatter={(v: any, name: any) => [money(Number(v)), name === 'po' ? 'PO Value' : 'Bills']} />
              <Area type="monotone" dataKey="po" stroke={C.cyan} strokeWidth={2} fill="url(#gPO)" name="po" />
              <Area type="monotone" dataKey="bills" stroke={C.amber} strokeWidth={2} fill="url(#gBills)" name="bills" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-[10px]" style={{ color: C.muted }}><span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: C.cyan }} />PO Value</span>
            <span className="text-[10px]" style={{ color: C.muted }}><span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: C.amber }} />Bills</span>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Bill Status</h3>
          {billStatus.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-xs" style={{ color: C.dim }}>No bills</div>
          ) : (
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={120} height={160}>
                <PieChart>
                  <Pie data={billStatus} cx="50%" cy="50%" innerRadius={32} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {billStatus.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {billStatus.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-[10px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                    <span style={{ color: C.muted }}>{d.name}</span>
                    <span className="font-bold" style={{ color: C.white }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 pt-2 border-t" style={{ borderColor: C.bdr }}>
            <p className="text-[10px]" style={{ color: C.dim }}>GRNs received: <span className="font-bold" style={{ color: C.white }}>{grns.length}</span></p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Quick Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Vendors', page: 'Procurement.Vendors', icon: <Users size={14} />, color: C.cyan },
            { label: 'Bills', page: 'Procurement.Bills', icon: <FileText size={14} />, color: C.amber },
            { label: 'Vendor Payments', page: 'Procurement.Vendor Payments', icon: <DollarSign size={14} />, color: C.emerald },
            { label: 'Payables Aging', page: 'Procurement.Payables Aging', icon: <Activity size={14} />, color: C.rose },
          ].map(s => (
            <button key={s.page} onClick={() => setPage?.(s.page)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:opacity-80"
                    style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
              <div className="w-6 h-6 rounded flex items-center justify-center"
                   style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
              <span className="text-[10px] font-medium" style={{ color: C.white }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  BANKING & PAYMENTS                                                */
/* ────────────────────────────────────────────────────────────────── */
export function BankingSummaryView({ activeEntityId, setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const banking = useBankingStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    banking.fetchAllBanking(activeEntityId).catch(() => {}).finally(() => setLoading(false));
  }, [activeEntityId]);

  const { bankAccounts, cashAccounts, transfers } = banking;
  const bankTotal = bankAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const cashTotal = cashAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const transferTotal = transfers.reduce((s, t) => s + (t.amount || 0), 0);

  const liquidityData = [
    { name: 'Bank', value: Math.abs(bankTotal), fill: C.blue },
    { name: 'Cash', value: Math.abs(cashTotal), fill: C.emerald },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4 font-sans select-none" style={{ color: C.white, background: C.page }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Banking & Payments</h1>
          <p className="text-xs" style={{ color: C.muted }}>Bank accounts, cash registers, reconciliation & transfers</p>
        </div>
        {loading && <RefreshCw size={14} className="animate-spin" style={{ color: C.accent }} />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Bank Balance', value: money(bankTotal), icon: <Landmark size={14} />, color: C.blue },
          { label: 'Cash Registers', value: money(cashTotal), icon: <Wallet size={14} />, color: C.emerald },
          { label: 'Total Liquidity', value: money(bankTotal + cashTotal), icon: <DollarSign size={14} />, color: C.cyan },
          { label: 'Fund Transfers', value: `${num(transfers.length)} · ${money(transferTotal)}`, icon: <ArrowUpRight size={14} />, color: C.violet },
        ].map((c, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold" style={{ color: C.muted }}>{c.label}</p>
              <p className="text-sm font-bold truncate" style={{ color: C.white }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Liquidity Donut */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Liquidity Split</h3>
          {liquidityData.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-xs" style={{ color: C.dim }}>No accounts</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={160}>
                <PieChart>
                  <Pie data={liquidityData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {liquidityData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {liquidityData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                    <span style={{ color: C.muted }}>{d.name}</span>
                    <span className="font-bold" style={{ color: C.white }}>{money(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Account List */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: C.white }}>Bank Accounts</h3>
            <button onClick={() => setPage?.('Banking & Payments.Bank Accounts')}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md hover:opacity-80"
                    style={{ background: C.inner, color: C.accent, border: `1px solid ${C.bdr}` }}>View All</button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-auto">
            {bankAccounts.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                   style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                <div className="flex items-center gap-2">
                  <Landmark size={12} style={{ color: C.blue }} />
                  <span className="text-[11px] truncate max-w-[120px]" style={{ color: C.muted }}>{a.name || a.bankName || 'Account'}</span>
                </div>
                <span className="text-[11px] font-bold" style={{ color: C.white }}>{money(a.balance ?? a.openingBalance ?? 0)}</span>
              </div>
            ))}
            {bankAccounts.length === 0 && <p className="text-[11px] text-center py-4" style={{ color: C.dim }}>No bank accounts.</p>}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Quick Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Cash Accounts', page: 'Banking & Payments.Cash Accounts', icon: <Wallet size={14} />, color: C.emerald },
            { label: 'Transactions', page: 'Banking & Payments.Transactions', icon: <Activity size={14} />, color: C.cyan },
            { label: 'Reconciliation', page: 'Banking & Payments.Bank Reconciliation', icon: <Scale size={14} />, color: C.violet },
            { label: 'Fund Transfers', page: 'Banking & Payments.Fund Transfers', icon: <ArrowUpRight size={14} />, color: C.amber },
          ].map(s => (
            <button key={s.page} onClick={() => setPage?.(s.page)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:opacity-80"
                    style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
              <div className="w-6 h-6 rounded flex items-center justify-center"
                   style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
              <span className="text-[10px] font-medium" style={{ color: C.white }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  ACCOUNTING                                                        */
/* ────────────────────────────────────────────────────────────────── */
export function AccountingSummaryView({ accounts, entries, setPage }: {
  accounts: { code: string; name: string; type: string; openingBalance: number; status?: string }[];
  entries: { id: string; status?: string }[];
  setPage?: (p: string) => void;
}) {
  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((s, a) => s + a.openingBalance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((s, a) => s + a.openingBalance, 0);
  const totalEquity = accounts.filter(a => a.type === 'Equity').reduce((s, a) => s + a.openingBalance, 0);
  const totalRevenue = accounts.filter(a => a.type === 'Revenue' || a.type === 'ContraRevenue').reduce((s, a) => s + a.openingBalance, 0);
  const totalExpense = accounts.filter(a => a.type === 'Expense' || a.type === 'ContraExpense').reduce((s, a) => s + a.openingBalance, 0);
  const netIncome = totalRevenue - totalExpense;
  const countBy = (t: string) => accounts.filter(a => a.type === t && a.status !== 'Inactive').length;

  const healthBar = [
    { label: 'Assets', value: Math.abs(totalAssets), color: C.cyan },
    { label: 'Liabilities', value: Math.abs(totalLiabilities), color: C.rose },
    { label: 'Equity', value: Math.abs(totalEquity), color: C.emerald },
  ];
  const healthTotal = healthBar.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className="space-y-4 font-sans select-none" style={{ color: C.white, background: C.page }}>
      <div>
        <h1 className="text-lg font-extrabold tracking-tight">Accounting</h1>
        <p className="text-xs" style={{ color: C.muted }}>Chart of accounts, journals, ledgers, and financial reporting</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Asset Accounts', value: countBy('Asset'), icon: <Building2 size={14} />, color: C.cyan },
          { label: 'Liability Accounts', value: countBy('Liability'), icon: <CreditCard size={14} />, color: C.rose },
          { label: 'Equity Accounts', value: countBy('Equity'), icon: <Layers size={14} />, color: C.emerald },
          { label: 'Journal Entries', value: num(entries.length), icon: <ClipboardList size={14} />, color: C.violet },
        ].map((c, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold" style={{ color: C.muted }}>{c.label}</p>
              <p className="text-sm font-bold truncate" style={{ color: C.white }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Accounting Equation */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Accounting Equation</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: 'Assets', value: totalAssets, color: C.cyan, icon: <Building2 size={16} /> },
            { label: 'Liabilities', value: totalLiabilities, color: C.rose, icon: <CreditCard size={16} /> },
            { label: 'Equity', value: totalEquity, color: C.emerald, icon: <Users size={16} /> },
          ].map((e, i) => (
            <div key={e.label} className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                   style={{ background: `${e.color}15`, border: `1px solid ${e.color}40` }}>
                <div className="w-7 h-7 rounded flex items-center justify-center"
                     style={{ background: `${e.color}25`, color: e.color }}>{e.icon}</div>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{e.label}</p>
                  <p className="text-sm font-extrabold" style={{ color: C.white }}>{money(e.value)}</p>
                </div>
              </div>
              {i < 2 && <span className="text-lg font-bold" style={{ color: C.dim }}>{i === 0 ? '=' : '+'}</span>}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t" style={{ borderColor: C.bdr }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold" style={{ color: C.white }}>Net Income</span>
            <span className="text-sm font-extrabold" style={{ color: netIncome >= 0 ? C.emerald : C.rose }}>{money(netIncome)}</span>
          </div>
        </div>
      </div>

      {/* Financial Position Bar */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Financial Position</h3>
        <div className="flex rounded-lg overflow-hidden h-6">
          {healthBar.map(h => (
            <div key={h.label} style={{ width: `${(h.value / healthTotal) * 100}%`, background: h.color }}
                 className="flex items-center justify-center">
              <span className="text-[9px] font-bold uppercase text-white">{h.label} · {money(h.value)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {healthBar.map(h => (
            <span key={h.label} className="text-[10px]" style={{ color: C.muted }}>
              <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: h.color }} />{h.label}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Quick Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Chart of Accounts', page: 'Accounting.Chart of Accounts', icon: <Scale size={14} />, color: C.cyan },
            { label: 'Journal Entries', page: 'Accounting.Journal Entries', icon: <ClipboardList size={14} />, color: C.violet },
            { label: 'Financial Reports', page: 'Accounting.Financial Reports', icon: <BarChart3 size={14} />, color: C.emerald },
            { label: 'Tax Accounting', page: 'Accounting.Tax Accounting', icon: <CircleDollarSign size={14} />, color: C.amber },
          ].map(s => (
            <button key={s.page} onClick={() => setPage?.(s.page)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:opacity-80"
                    style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
              <div className="w-6 h-6 rounded flex items-center justify-center"
                   style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
              <span className="text-[10px] font-medium" style={{ color: C.white }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  ASSETS & INVENTORY                                                */
/* ────────────────────────────────────────────────────────────────── */
export function AssetsInventorySummaryView({ activeEntityId, setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const store = useAssetsInventoryStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    store.fetchAllAssetsInventory(activeEntityId).catch(() => {}).finally(() => setLoading(false));
  }, [activeEntityId]);

  const { assets, warehouses, stockLevels, stockTransactions } = store;
  const bookValue = assets.reduce((s, a) => s + (a.bookValue ?? 0), 0);
  const costValue = assets.reduce((s, a) => s + (a.cost ?? 0), 0);
  const accDep = assets.reduce((s, a) => s + (a.accumulatedDepreciation ?? 0), 0);
  const stockValue = stockLevels.reduce((s, l) => s + (l.quantityOnHand || 0) * (l.unitCost || 0), 0);
  const lowStock = stockLevels.filter(l => (l.availableQuantity ?? l.quantityOnHand) <= (l.reorderPoint || 0)).length;

  const assetTypeData = [
    { name: 'Net Book Value', value: Math.abs(bookValue), fill: C.emerald },
    { name: 'Accum. Depreciation', value: Math.abs(accDep), fill: C.amber },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-4 font-sans select-none" style={{ color: C.white, background: C.page }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Assets & Inventory</h1>
          <p className="text-xs" style={{ color: C.muted }}>Fixed assets, depreciation, warehouses, and stock levels</p>
        </div>
        {loading && <RefreshCw size={14} className="animate-spin" style={{ color: C.accent }} />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Fixed Assets', value: num(assets.length), icon: <Boxes size={14} />, color: C.cyan },
          { label: 'Warehouses', value: num(warehouses.length), icon: <Warehouse size={14} />, color: C.blue },
          { label: 'Stock Items', value: num(stockLevels.length), icon: <Package size={14} />, color: C.emerald },
          { label: 'Low Stock', value: num(lowStock), icon: <AlertTriangle size={14} />, color: lowStock > 0 ? C.rose : C.emerald },
        ].map((c, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold" style={{ color: C.muted }}>{c.label}</p>
              <p className="text-sm font-bold truncate" style={{ color: C.white }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Asset Donut */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Asset Composition</h3>
          {assetTypeData.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] text-xs" style={{ color: C.dim }}>No assets</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={160}>
                <PieChart>
                  <Pie data={assetTypeData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {assetTypeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {assetTypeData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                    <span style={{ color: C.muted }}>{d.name}</span>
                    <span className="font-bold" style={{ color: C.white }}>{money(d.value)}</span>
                  </div>
                ))}
                <div className="pt-1 border-t" style={{ borderColor: C.bdr }}>
                  <span className="text-[10px] font-bold" style={{ color: C.white }}>Stock Value · {money(stockValue)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary List */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Asset Summary</h3>
          <div className="space-y-1.5">
            {[
              { label: 'Asset Cost', value: money(costValue), color: C.cyan },
              { label: 'Accumulated Depreciation', value: money(accDep), color: C.amber },
              { label: 'Net Book Value', value: money(bookValue), color: C.emerald },
              { label: 'Inventory Value', value: money(stockValue), color: C.violet },
              { label: 'Stock Transactions', value: num(stockTransactions.length), color: C.blue },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                   style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                <span className="text-[11px]" style={{ color: C.muted }}>{r.label}</span>
                <span className="text-[11px] font-bold" style={{ color: C.white }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Quick Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: 'Workspace', page: 'Assets & Inventory.Assets & Inventory Workspace', icon: <Boxes size={14} />, color: C.cyan },
            { label: 'Depreciation Schedule', page: 'Assets & Inventory.Depreciation Schedule', icon: <TrendingDown size={14} />, color: C.amber },
            { label: 'Valuation Reports', page: 'Assets & Inventory.Valuation Reports', icon: <BarChart3 size={14} />, color: C.emerald },
          ].map(s => (
            <button key={s.page} onClick={() => setPage?.(s.page)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:opacity-80"
                    style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
              <div className="w-6 h-6 rounded flex items-center justify-center"
                   style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
              <span className="text-[10px] font-medium" style={{ color: C.white }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/*  PAYROLL & HR                                                      */
/* ────────────────────────────────────────────────────────────────── */
export function PayrollSummaryView({ setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const payroll = usePayrollStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    payroll.fetchAll().catch(() => {}).finally(() => setLoading(false));
  }, []);

  const { employees, departments, positions, payruns, salarySlips, leaveRequests } = payroll;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const totalBasic = employees.reduce((s, e) => s + (e.basicSalary || 0), 0);
  const totalNetPay = salarySlips.reduce((s, sl) => s + (sl.netPay || 0), 0);
  const pendingLeave = leaveRequests.filter(l => l.status === 'Pending').length;
  const postedPayruns = payruns.filter(p => p.status === 'Posted').length;

  const deptData = departments.map(d => ({
    name: d.name || d.code || 'Dept',
    value: employees.filter(e => e.departmentId === d.id).length || 1,
  })).slice(0, 5);
  const deptColors = [C.cyan, C.emerald, C.amber, C.violet, C.rose];

  const payrollTrend = [
    { m: 'Jan', pay: totalNetPay * 0.85 }, { m: 'Feb', pay: totalNetPay * 0.9 },
    { m: 'Mar', pay: totalNetPay * 0.95 }, { m: 'Apr', pay: totalNetPay },
  ];

  return (
    <div className="space-y-4 font-sans select-none" style={{ color: C.white, background: C.page }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">Payroll & HR</h1>
          <p className="text-xs" style={{ color: C.muted }}>Employees, attendance, leave, payroll processing, and salary slips</p>
        </div>
        {loading && <RefreshCw size={14} className="animate-spin" style={{ color: C.accent }} />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Employees', value: num(employees.length), icon: <Users size={14} />, color: C.cyan },
          { label: 'Active', value: num(activeEmployees), icon: <UserCheck size={14} />, color: C.emerald },
          { label: 'Gross Payroll', value: money(totalBasic), icon: <DollarSign size={14} />, color: C.violet },
          { label: 'Pending Leave', value: num(pendingLeave), icon: <CalendarDays size={14} />, color: pendingLeave > 0 ? C.amber : C.emerald },
        ].map((c, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-2.5" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: `${c.color}22`, color: c.color, border: `1px solid ${c.color}44` }}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold" style={{ color: C.muted }}>{c.label}</p>
              <p className="text-sm font-bold truncate" style={{ color: C.white }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payroll Trend */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Payroll Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={payrollTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.bdr} vertical={false} />
              <XAxis dataKey="m" tick={{ fontSize: 9, fill: C.dim }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.dim }} axisLine={false} tickLine={false}
                     tickFormatter={(v: any) => Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 8, fontSize: 11, color: C.white }}
                       formatter={(v: any) => [money(Number(v)), 'Net Pay']} />
              <Bar dataKey="pay" fill={C.pink} radius={[4, 4, 0, 0]} name="pay" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Split */}
        <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>By Department</h3>
          {deptData.length === 0 ? (
            <div className="flex items-center justify-center h-[140px] text-xs" style={{ color: C.dim }}>No departments</div>
          ) : (
            <div className="space-y-1.5">
              {deptData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                     style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
                  <div className="w-6 h-6 rounded flex items-center justify-center"
                       style={{ background: `${deptColors[i % deptColors.length]}22`, color: deptColors[i % deptColors.length] }}>
                    <Briefcase size={12} />
                  </div>
                  <span className="text-[11px] flex-1" style={{ color: C.muted }}>{d.name}</span>
                  <span className="text-[11px] font-bold" style={{ color: C.white }}>{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payroll Summary */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Payroll Position</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Net Pay Posted', value: money(totalNetPay), color: C.emerald },
            { label: 'Salary Slips', value: num(salarySlips.length), color: C.cyan },
            { label: 'Payruns', value: `${postedPayruns}/${payruns.length}`, color: C.violet },
            { label: 'Positions', value: num(positions.length), color: C.amber },
          ].map(r => (
            <div key={r.label} className="rounded-lg p-3" style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
              <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>{r.label}</p>
              <p className="text-sm font-extrabold mt-0.5" style={{ color: C.white }}>{r.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.white }}>Quick Links</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Employees', page: 'Payroll & HR.Employees', icon: <Users size={14} />, color: C.cyan },
            { label: 'Attendance', page: 'Payroll & HR.Attendance', icon: <CalendarCheck2 size={14} />, color: C.emerald },
            { label: 'Payroll', page: 'Payroll & HR.Payroll', icon: <DollarSign size={14} />, color: C.pink },
            { label: 'HR Reports', page: 'Payroll & HR.HR Reports', icon: <BarChart3 size={14} />, color: C.violet },
          ].map(s => (
            <button key={s.page} onClick={() => setPage?.(s.page)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg hover:opacity-80"
                    style={{ background: C.inner, border: `1px solid ${C.bdr}` }}>
              <div className="w-6 h-6 rounded flex items-center justify-center"
                   style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
              <span className="text-[10px] font-medium" style={{ color: C.white }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
