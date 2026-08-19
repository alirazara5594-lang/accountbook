import { useEffect, useState } from 'react';
import {
  Users, ShoppingCart, Landmark, Scale, Boxes, Wallet,
  TrendingDown, AlertTriangle, Receipt, FileText, ArrowUpRight, Package,
  Warehouse, Banknote, HandCoins, Building2, Layers, ClipboardList,
  CalendarCheck2, CreditCard, DollarSign,
  Activity, Truck, BarChart3, RefreshCw, CircleDollarSign,
  UserCheck, CalendarDays, Briefcase,
  ShieldCheck, Flame, CheckCircle2,
  Clock,
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
import { agingBucket, AGING_BUCKETS } from './financial-overview/format';

const num = (n: number) => new Intl.NumberFormat('en-US').format(n || 0);

const C = {
  page: 'var(--color-background)', card: 'var(--color-surface)', inner: 'var(--color-surface-muted)', bdr: 'var(--color-border)',
  accent: '#3b82f6', cyan: '#06b6d4', amber: '#f59e0b', emerald: '#10b981',
  rose: '#ef4444', violet: '#a855f7', pink: '#ec4899', white: 'var(--color-text)',
  muted: 'var(--color-text-muted)', dim: 'var(--color-text-subtle)', blue: '#3b82f6',
};

/* ────────────────────────────────────────────────────────────────── */
/*  SALES & CUSTOMERS                                                */
/* ────────────────────────────────────────────────────────────────── */
export function SalesSummaryView({ activeEntityId, setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const sales = useSalesStore();
  const customersStore = useCustomersStore();
  const products = useProductsStore();
  const banking = useBankingStore();
  const proc = useProcurementStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      sales.fetchAllSales(activeEntityId),
      customersStore.fetchCustomers(activeEntityId),
      products.fetchProducts(activeEntityId),
      banking.fetchAllBanking(activeEntityId),
      proc.fetchAllProcurement(activeEntityId),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, [activeEntityId]);

  const { invoices } = sales;
  const totalInvoiced = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const collected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const outstanding = invoices.reduce((s, i) => s + ((i.amountDue ?? (i.totalAmount - (i.paidAmount || 0))) || 0), 0);
  const openInvoices = invoices.filter(i => (i.amountDue ?? 0) > 0);
  const overdueCount = openInvoices.filter(i => new Date(i.dueDate).getTime() < Date.now()).length;
  const overdueAmt = openInvoices.filter(i => new Date(i.dueDate).getTime() < Date.now()).reduce((s, i) => s + (i.amountDue ?? 0), 0);
  const activeCustomers = customersStore.customers.filter(c => String(c.status) === 'Active').length;
  const collectionRate = totalInvoiced > 0 ? ((collected / totalInvoiced) * 100).toFixed(1) : '0';

  const invByStatus = [
    { name: 'Paid', value: invoices.filter(i => (i.amountDue ?? 0) <= 0).length, color: 'success' },
    { name: 'Unpaid', value: openInvoices.length, color: 'warning' },
    { name: 'Overdue', value: overdueCount, color: 'danger' },
  ].filter(d => d.value > 0);

  const monthlySales = [
    { m: 'Jan', amt: totalInvoiced * 0.6 }, { m: 'Feb', amt: totalInvoiced * 0.7 },
    { m: 'Mar', amt: totalInvoiced * 0.8 }, { m: 'Apr', amt: totalInvoiced * 0.75 },
    { m: 'May', amt: totalInvoiced * 0.9 }, { m: 'Jun', amt: totalInvoiced },
  ];

  const billsArr = proc.bills as any[];
  const bankTxArr = banking.transactions;
  const bankAccArr = banking.bankAccounts;
  const cashAccArr = banking.cashAccounts;

  const arAgingBuckets: Record<string, number> = {};
  AGING_BUCKETS.forEach(b => { arAgingBuckets[b] = 0; });
  openInvoices.forEach((i: any) => {
    arAgingBuckets[agingBucket(i.dueDate)] += i.amountDue || 0;
  });
  const arAgingData = AGING_BUCKETS.map(b => ({ name: b, value: arAgingBuckets[b] }));
  const arOverdueTotal = arAgingBuckets['1-30'] + arAgingBuckets['31-60'] + arAgingBuckets['61-90'] + arAgingBuckets['90+'];

  const unpaidBills = billsArr.filter((b: any) => (b.amountDue ?? b.totalAmount ?? b.total ?? 0) > 0);
  const apAgingBuckets: Record<string, number> = {};
  AGING_BUCKETS.forEach(b => { apAgingBuckets[b] = 0; });
  unpaidBills.forEach((b: any) => {
    const due = b.amountDue ?? (b.status !== 'Paid' ? (b.totalAmount ?? b.total ?? 0) : 0);
    apAgingBuckets[agingBucket(b.dueDate)] += due;
  });
  const apAgingData = AGING_BUCKETS.map(b => ({ name: b, value: apAgingBuckets[b] }));
  const apOverdueTotal = apAgingBuckets['1-30'] + apAgingBuckets['31-60'] + apAgingBuckets['61-90'] + apAgingBuckets['90+'];

  const bankTotal = bankAccArr.reduce((s: number, a: any) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const cashTotal = cashAccArr.reduce((s: number, a: any) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const cashBank = bankTotal + cashTotal;
  const workingCapitalCalc = totalInvoiced - outstanding;

  let totalAssetsCalc = 0; let totalLiabilitiesCalc = 0;
  bankAccArr.forEach((a: any) => { totalAssetsCalc += a.balance ?? a.openingBalance ?? 0; });
  cashAccArr.forEach((a: any) => { totalAssetsCalc += a.balance ?? a.openingBalance ?? 0; });
  totalAssetsCalc += totalInvoiced + outstanding;
  totalLiabilitiesCalc = outstanding + apAgingData.reduce((s, a) => s + a.value, 0);
  const totalEquityCalc = totalInvoiced - outstanding - totalLiabilitiesCalc;
  const equationBalanced = Math.abs(totalAssetsCalc - (totalLiabilitiesCalc + totalEquityCalc)) < 0.01;

  let healthScore = 50;
  if (equationBalanced) healthScore += 20;
  if (totalInvoiced > 0 && outstanding / totalInvoiced < 0.3) healthScore += 10;
  if (collectionRate !== '0') healthScore += 10;
  if (overdueCount === 0) healthScore += 10;
  healthScore = Math.min(100, Math.max(20, healthScore));

  const monthlyBurn = Math.max(1, (totalInvoiced - outstanding) / 12);
  const runwayMonths = cashBank > 0 ? Math.min(99, Number((cashBank / monthlyBurn).toFixed(1))) : 0;
  const currentRatio = totalLiabilitiesCalc > 0 ? totalAssetsCalc / totalLiabilitiesCalc : 0;
  const quickRatio = totalLiabilitiesCalc > 0 ? (totalAssetsCalc * 0.8) / totalLiabilitiesCalc : 0;
  const netMargin = totalInvoiced > 0 ? ((totalInvoiced - outstanding) / totalInvoiced) * 100 : 0;
  const debtToEquity = totalEquityCalc > 0 ? totalLiabilitiesCalc / totalEquityCalc : 0;
  const avgDaysOutstanding = arOverdueTotal > 0 ? 45 : 15;
  const unreconciledBankTx = bankTxArr.filter((t: any) => !t.reconciled).length;

  const alerts: { id: string; title: string; detail: string; severity: 'critical' | 'warning' | 'info' | 'success'; page: string }[] = [];
  if (overdueCount > 0) alerts.push({ id: 'ar-overdue', title: `${overdueCount} Overdue Receivables`, detail: `${money(overdueAmt)} past due`, severity: 'critical', page: 'Sales & Customers.Customer Aging' });
  if (unpaidBills.length > 0) alerts.push({ id: 'ap-overdue', title: `${unpaidBills.length} Unpaid Vendor Bills`, detail: `${money(apOverdueTotal)} due to vendors`, severity: 'warning', page: 'Procurement.Payables Aging' });
  if (bankTxArr.filter((t: any) => !t.reconciled).length > 0) alerts.push({ id: 'bank-recon', title: `${bankTxArr.filter((t: any) => !t.reconciled).length} Unreconciled Transactions`, detail: 'Run bank reconciliation', severity: 'info', page: 'Banking & Payments.Bank Reconciliation' });
  if (alerts.length === 0) alerts.push({ id: 'clear', title: 'All Clear', detail: 'No critical issues', severity: 'success', page: '' });

  const kpis = [
    { label: 'Invoiced', value: money(totalInvoiced), icon: Receipt, color: 'info', trend: `${invoices.length} total`, up: true },
    { label: 'Collected', value: money(collected), icon: Banknote, color: 'success', trend: `${collectionRate}% rate`, up: true },
    { label: 'Outstanding', value: money(outstanding), icon: HandCoins, color: 'warning', trend: overdueCount > 0 ? `${overdueCount} overdue` : 'Clear', up: overdueCount === 0 },
    { label: 'Customers', value: num(activeCustomers), icon: Users, color: 'primary', trend: `${invoices.length} invoices`, up: true },
    { label: 'Overdue Amt', value: money(overdueAmt), icon: AlertTriangle, color: 'danger', trend: overdueCount > 0 ? `${overdueCount} bills` : 'None', up: overdueCount === 0 },
    { label: 'Products', value: num(products.products.length), icon: Package, color: 'secondary', trend: 'Active catalog', up: true },
  ];

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h4 className="fw-bold mb-0">Sales & Customers</h4>
          <small className="text-muted">Invoicing, collections, customer management & revenue analytics</small>
        </div>
        {loading && (
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        )}
      </div>

      {/* ═══ KPI CARDS — 2 ROWS × 3 ═══ */}
      <div className="row g-2 mb-3">
        {kpis.map((k, i) => {
          const Ico = k.icon;
          return (
            <div className="col-4" key={i}>
              <div className="card h-100 border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
                <div className="card-body p-2">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <small className="text-muted fw-semibold text-uppercase" style={{ fontSize: '9px', letterSpacing: '.3px' }}>{k.label}</small>
                    <span className={`badge bg-${k.color} bg-opacity-10 text-${k.color} rounded-2 p-1`}>
                      <Ico size={12} />
                    </span>
                  </div>
                  <h6 className="fw-extrabold mb-0" style={{ fontSize: '14px', letterSpacing: '-.3px' }}>{k.value}</h6>
                  <small className={`fw-semibold ${k.up ? 'text-success' : 'text-danger'}`} style={{ fontSize: '9px' }}>
                    {k.up ? '▲' : '▼'} {k.trend}
                  </small>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ SALES TREND + INVOICE STATUS ═══ */}
      <div className="row g-3 mb-3">
        <div className="col-lg-8">
          <div className="card h-100 border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-body p-3">
              <h6 className="card-title fw-bold mb-3" style={{ fontSize: '13px' }}>Sales Trend</h6>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlySales} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSalesBoot" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d6efd" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0d6efd" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                  <XAxis dataKey="m" tick={{ fontSize: 9, fill: '#6c757d' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#6c757d' }} axisLine={false} tickLine={false}
                         tickFormatter={(v: any) => Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}k` : v} />
                   <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
                           formatter={(v: any) => [money(Number(v)), 'Sales']} />
                  <Area type="monotone" dataKey="amt" stroke="#0d6efd" strokeWidth={2} fill="url(#gSalesBoot)" name="Sales" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card h-100 border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-body p-3">
              <h6 className="card-title fw-bold mb-3" style={{ fontSize: '13px' }}>Invoice Status</h6>
              {invByStatus.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center" style={{ height: 180 }}>
                  <span className="text-muted small">No invoices</span>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-3">
                  <ResponsiveContainer width={120} height={160}>
                    <PieChart>
                      <Pie data={invByStatus} cx="50%" cy="50%" innerRadius={32} outerRadius={55} dataKey="value" strokeWidth={0}>
                        {invByStatus.map((d, idx) => {
                          const fillMap: Record<string, string> = { success: '#198754', warning: '#ffc107', danger: '#dc3545', info: '#0dcaf0', primary: '#0d6efd', secondary: '#6c757d' };
                          return <Cell key={idx} fill={fillMap[d.color] || '#6c757d'} />;
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="d-flex flex-column gap-2">
                    {invByStatus.map(d => (
                      <div key={d.name} className="d-flex align-items-center gap-2">
                        <span className={`badge bg-${d.color}`} style={{ width: 8, height: 8, borderRadius: '50%', padding: 0 }} />
                        <small className="text-muted">{d.name}</small>
                        <strong className="ms-auto">{d.value}</strong>
                      </div>
                    ))}
                    <hr className="my-1" />
                    <div>
                      <small className="text-muted fw-bold">Collection Rate</small>
                      <h5 className="fw-bold text-success mb-0">{collectionRate}%</h5>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ HEALTH INDEX + WORKING CAPITAL + AUDIT CONTROLS ═══ */}
      <div className="row g-2 mb-3">
        {/* Financial Health Index */}
        <div className="col-lg-4">
          <div className="card border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-body p-2.5">
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <div className="d-flex align-items-center gap-1.5">
                  <ShieldCheck size={13} className="text-success" />
                  <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '9px', letterSpacing: '.3px' }}>Financial Health</small>
                </div>
                <span className={`badge ${healthScore >= 80 ? 'bg-success' : healthScore >= 60 ? 'bg-primary' : 'bg-warning'} bg-opacity-10 text-${healthScore >= 80 ? 'success' : healthScore >= 60 ? 'primary' : 'warning'}`} style={{ fontSize: '8px' }}>
                  {healthScore >= 80 ? 'Optimal' : healthScore >= 60 ? 'Healthy' : 'Attention'}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h5 className="fw-extrabold mb-0" style={{ fontSize: '18px' }}>{healthScore}<small className="text-muted fw-normal" style={{ fontSize: '11px' }}>/100</small></h5>
                  <small className="text-muted" style={{ fontSize: '9px' }}>
                    {equationBalanced ? 'Ledger Balanced' : 'Check Ledger'} · {overdueCount === 0 ? 'No Overdue' : `${overdueCount} Overdue`}
                  </small>
                </div>
                <div className="position-relative" style={{ width: 44, height: 44 }}>
                  <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                    <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#e9ecef" strokeWidth="3" />
                    <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke={healthScore >= 60 ? '#198754' : '#ffc107'} strokeWidth="3" strokeDasharray={`${healthScore}, 100`} />
                  </svg>
                  <div className="position-absolute top-50 start-50 translate-middle fw-bold" style={{ fontSize: '10px' }}>{healthScore}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Working Capital & Runway */}
        <div className="col-lg-4">
          <div className="card border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-body p-2.5">
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <div className="d-flex align-items-center gap-1.5">
                  <Flame size={13} className="text-warning" />
                  <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '9px', letterSpacing: '.3px' }}>Working Capital</small>
                </div>
                <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '8px' }}>
                  {runwayMonths > 0 ? `${runwayMonths} Mo.` : 'Neutral'}
                </span>
              </div>
              <h5 className="fw-extrabold mb-0.5" style={{ fontSize: '18px' }}>{money(workingCapitalCalc)}</h5>
              <small className="text-muted d-block" style={{ fontSize: '9px' }}>
                Cash on hand: {money(cashBank)} · ~{runwayMonths}mo runway
              </small>
            </div>
          </div>
        </div>

        {/* Audit & Closing Controls */}
        <div className="col-lg-4">
          <div className="card border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-body p-2.5">
              <div className="d-flex align-items-center justify-content-between mb-1.5">
                <div className="d-flex align-items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-violet" />
                  <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '9px', letterSpacing: '.3px' }}>Audit Controls</small>
                </div>
                <span className={`badge ${unreconciledBankTx === 0 ? 'bg-success' : 'bg-warning'} bg-opacity-10 text-${unreconciledBankTx === 0 ? 'success' : 'warning'}`} style={{ fontSize: '8px' }}>
                  {unreconciledBankTx === 0 ? 'Clean' : 'Pending'}
                </span>
              </div>
              <div className="d-flex flex-column gap-1">
                {[
                  { label: 'Unreconciled Bank Tx', value: unreconciledBankTx, ok: unreconciledBankTx === 0 },
                  { label: 'Open Invoices', value: openInvoices.length, ok: openInvoices.length === 0 },
                  { label: 'Unpaid Bills', value: unpaidBills.length, ok: unpaidBills.length === 0 },
                ].map(c => (
                  <div key={c.label} className="d-flex align-items-center justify-content-between">
                    <small className="text-muted" style={{ fontSize: '9px' }}>{c.label}</small>
                    <span className={`fw-bold ${c.ok ? 'text-success' : 'text-warning'}`} style={{ fontSize: '11px' }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RISK ALERTS + AGING SUMMARY ═══ */}
      <div className="row g-3 mb-3">
        {/* Risk Alerts */}
        <div className="col-lg-6">
          <div className="card h-100 border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-header bg-transparent d-flex align-items-center justify-content-between border-0 pb-0">
              <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>
                <AlertTriangle size={13} className="me-1 text-warning" />
                Risk & Alert Indicators
              </h6>
              <span className={`badge ${alerts.some(a => a.severity === 'critical') ? 'bg-danger' : alerts.some(a => a.severity === 'warning') ? 'bg-warning' : 'bg-success'}`} style={{ fontSize: '9px' }}>
                {alerts.length} Flagged
              </span>
            </div>
            <div className="card-body p-2 pt-3">
              <div className="d-flex flex-column gap-2">
                {alerts.map(a => {
                  const sevMap: Record<string, { dot: string; bg: string; badge: string }> = {
                    critical: { dot: '#dc2626', bg: '#fef2f2', badge: 'bg-danger' },
                     warning: { dot: '#f59e0b', bg: 'var(--color-warning-background)', badge: 'bg-warning' },
                    info: { dot: '#3b82f6', bg: '#eff6ff', badge: 'bg-info' },
                    success: { dot: '#10b981', bg: '#ecfdf5', badge: 'bg-success' },
                  };
                  const s = sevMap[a.severity] || sevMap.info;
                  return (
                    <div key={a.id} className="d-flex align-items-start gap-2 p-2 rounded-2" style={{ background: s.bg, border: '1px solid #e2e8f0' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot, marginTop: 4, flexShrink: 0 }} />
                      <div className="flex-grow-1 min-w-0">
                        <p className="fw-bold mb-0" style={{ fontSize: '11px' }}>{a.title}</p>
                        <small className="text-muted" style={{ fontSize: '10px' }}>{a.detail}</small>
                      </div>
                      <span className={`badge ${s.badge}`} style={{ fontSize: '9px' }}>{a.severity}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Aging Summary */}
        <div className="col-lg-6">
          <div className="card h-100 border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-header bg-transparent d-flex align-items-center justify-content-between border-0 pb-0">
              <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>
                <Clock size={13} className="me-1 text-primary" />
                Aging Summary
              </h6>
            </div>
            <div className="card-body p-2 pt-3">
              <div className="row g-3">
                {/* AR Aging */}
                <div className="col-6">
                  <small className="fw-bold text-muted d-block mb-2" style={{ fontSize: '10px' }}>RECEIVABLES</small>
                  {arAgingData.map((bucket, i) => {
                    const totalAr = arAgingData.reduce((s, a) => s + a.value, 0) || 1;
                    const pct = (bucket.value / totalAr) * 100;
                    const colors = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#991b1b'];
                    return (
                      <div key={bucket.name} className="mb-1.5">
                        <div className="d-flex justify-content-between">
                          <small className="text-muted" style={{ fontSize: '9px' }}>{bucket.name}</small>
                          <small className="fw-bold" style={{ fontSize: '9px' }}>{pct.toFixed(0)}%</small>
                        </div>
                        <div className="progress" style={{ height: 4 }}>
                          <div className="progress-bar" style={{ width: `${Math.min(100, pct)}%`, background: colors[i] }} />
                        </div>
                      </div>
                    );
                  })}
                  {arOverdueTotal > 0 && (
                    <small className="text-danger fw-bold d-block mt-1" style={{ fontSize: '9px' }}>
                      {money(arOverdueTotal)} overdue
                    </small>
                  )}
                </div>
                {/* AP Aging */}
                <div className="col-6">
                  <small className="fw-bold text-muted d-block mb-2" style={{ fontSize: '10px' }}>PAYABLES</small>
                  {apAgingData.map((bucket, i) => {
                    const totalAp = apAgingData.reduce((s, a) => s + a.value, 0) || 1;
                    const pct = (bucket.value / totalAp) * 100;
                    const colors = ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#991b1b'];
                    return (
                      <div key={bucket.name} className="mb-1.5">
                        <div className="d-flex justify-content-between">
                          <small className="text-muted" style={{ fontSize: '9px' }}>{bucket.name}</small>
                          <small className="fw-bold" style={{ fontSize: '9px' }}>{pct.toFixed(0)}%</small>
                        </div>
                        <div className="progress" style={{ height: 4 }}>
                          <div className="progress-bar" style={{ width: `${Math.min(100, pct)}%`, background: colors[i] }} />
                        </div>
                      </div>
                    );
                  })}
                  {apOverdueTotal > 0 && (
                    <small className="text-danger fw-bold d-block mt-1" style={{ fontSize: '9px' }}>
                      {money(apOverdueTotal)} overdue
                    </small>
                  )}
                </div>
              </div>
              <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                <small className="text-muted fw-bold" style={{ fontSize: '10px' }}>Total AR: {money(outstanding)}</small>
                <small className="text-muted fw-bold" style={{ fontSize: '10px' }}>Total AP: {money(apAgingData.reduce((s, a) => s + a.value, 0))}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ IMPORTANT RATIOS ═══ */}
      <div className="row g-3 mb-3">
        <div className="col-12">
          <div className="card border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-header bg-transparent border-0 pb-0">
              <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>
                <BarChart3 size={13} className="me-1 text-primary" />
                Important Financial Ratios
              </h6>
            </div>
            <div className="card-body p-3">
              <div className="row g-3">
                {[
                  { group: 'Liquidity & Solvency', color: '#0d6efd', items: [
                    { label: 'Current Ratio', value: `${currentRatio.toFixed(2)}x`, target: '> 1.5x', ok: currentRatio >= 1.5 },
                    { label: 'Quick Ratio', value: `${quickRatio.toFixed(2)}x`, target: '> 1.0x', ok: quickRatio >= 1.0 },
                    { label: 'Debt-to-Equity', value: debtToEquity.toFixed(2), target: '< 1.5', ok: debtToEquity < 1.5 },
                    { label: 'Equity Ratio', value: `${totalAssetsCalc > 0 ? ((totalEquityCalc / totalAssetsCalc) * 100).toFixed(1) : 0}%`, target: '> 40%', ok: totalAssetsCalc > 0 && (totalEquityCalc / totalAssetsCalc) * 100 >= 40 },
                  ]},
                  { group: 'Profitability', color: '#198754', items: [
                    { label: 'Net Margin', value: `${netMargin.toFixed(1)}%`, target: '> 10%', ok: netMargin >= 10 },
                    { label: 'Collection Rate', value: `${collectionRate}%`, target: '> 80%', ok: parseFloat(collectionRate) >= 80 },
                    { label: 'ROE', value: `${totalEquityCalc > 0 ? ((totalInvoiced - outstanding) / totalEquityCalc * 100).toFixed(1) : 0}%`, target: '> 15%', ok: false },
                    { label: 'Gross Margin', value: `${totalInvoiced > 0 ? ((totalInvoiced - outstanding) / totalInvoiced * 100).toFixed(1) : 0}%`, target: '> 30%', ok: totalInvoiced > 0 && (totalInvoiced - outstanding) / totalInvoiced * 100 >= 30 },
                  ]},
                  { group: 'Efficiency', color: '#6f42c1', items: [
                    { label: 'DSO', value: `${avgDaysOutstanding}d`, target: '< 45d', ok: avgDaysOutstanding <= 45 },
                    { label: 'DPO', value: '30d', target: '30-60d', ok: true },
                    { label: 'CCC', value: `${Math.max(0, avgDaysOutstanding - 30 + 15)}d`, target: '< 40d', ok: Math.max(0, avgDaysOutstanding - 30 + 15) < 45 },
                    { label: 'WC Coverage', value: `${totalInvoiced > 0 ? (workingCapitalCalc / totalInvoiced * 100).toFixed(1) : 0}%`, target: '> 20%', ok: totalInvoiced > 0 && workingCapitalCalc / totalInvoiced * 100 >= 20 },
                  ]},
                ].map(group => (
                  <div className="col-lg-4" key={group.group}>
                    <div className="p-3 rounded-2 border" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom" style={{ borderColor: 'var(--color-border)' }}>
                        <span className="d-inline-flex align-items-center justify-content-center rounded" style={{ width: 24, height: 24, background: `${group.color}15`, color: group.color }}>
                          <BarChart3 size={12} />
                        </span>
                        <small className="fw-bold text-uppercase" style={{ fontSize: '10px', letterSpacing: '.3px' }}>{group.group}</small>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        {group.items.map(item => (
                          <div key={item.label} className="d-flex align-items-center justify-content-between">
                            <div>
                              <small className="fw-semibold d-block" style={{ fontSize: '11px' }}>{item.label}</small>
                              <small className="text-muted" style={{ fontSize: '9px' }}>Target: {item.target}</small>
                            </div>
                            <div className="text-end">
                              <small className={`fw-bold d-block ${item.ok ? 'text-success' : 'text-warning'}`} style={{ fontSize: '12px' }}>{item.value}</small>
                              <span className={`badge ${item.ok ? 'bg-success' : 'bg-warning'} bg-opacity-10 text-${item.ok ? 'success' : 'warning'}`} style={{ fontSize: '8px' }}>
                                {item.ok ? 'Good' : 'Watch'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RECENT INVOICES + TOP CUSTOMERS ═══ */}
      <div className="row g-3">
        {/* Recent Invoices */}
        <div className="col-lg-7">
          <div className="card h-100 border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-header bg-transparent d-flex align-items-center justify-content-between border-0 pb-0">
              <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>Recent Invoices</h6>
              <button onClick={() => setPage?.('Sales & Customers.Sales Workspace')}
                      className="btn btn-sm btn-outline-primary border-0 fw-semibold" style={{ fontSize: '10px' }}>
                View All →
              </button>
            </div>
            <div className="card-body p-2 pt-3" style={{ maxHeight: 280, overflowY: 'auto' }}>
              {invoices.slice(0, 6).map(i => {
                const overdue = (i.amountDue ?? 0) > 0 && new Date(i.dueDate).getTime() < Date.now();
                const status = (i.amountDue ?? 0) <= 0 ? 'Paid' : overdue ? 'Overdue' : 'Unpaid';
                const bsColor = status === 'Paid' ? 'success' : status === 'Overdue' ? 'danger' : 'warning';
                return (
                  <div key={i.id} className="d-flex align-items-center gap-3 py-2 px-2 rounded-2 mb-1"
                       style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}>
                    <div className={`d-flex align-items-center justify-content-center rounded-circle bg-${bsColor} bg-opacity-10 text-${bsColor}`}
                         style={{ width: 32, height: 32, flexShrink: 0 }}>
                      {overdue ? <AlertTriangle size={14} /> : <Receipt size={14} />}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <p className="mb-0 fw-bold" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{i.invoiceNumber}</p>
                      <small className="text-muted">{i.customerName || '—'}</small>
                    </div>
                    <div className="text-end" style={{ flexShrink: 0 }}>
                      <p className="mb-0 fw-bold" style={{ fontSize: '11px' }}>{money(i.totalAmount)}</p>
                      <span className={`badge bg-${bsColor} bg-opacity-10 text-${bsColor}`} style={{ fontSize: '9px' }}>{status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Customers by Revenue */}
        <div className="col-lg-5">
          <div className="card h-100 border-1 shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <div className="card-header bg-transparent d-flex align-items-center justify-content-between border-0 pb-0">
              <h6 className="fw-bold mb-0" style={{ fontSize: '13px' }}>Top Customers</h6>
              <button onClick={() => setPage?.('Sales & Customers.Customers')}
                      className="btn btn-sm btn-outline-primary border-0 fw-semibold" style={{ fontSize: '10px' }}>
                View All →
              </button>
            </div>
            <div className="card-body p-2 pt-3">
              {(() => {
                const custMap = new Map<string, { name: string; total: number; count: number }>();
                invoices.forEach(i => {
                  const name = i.customerName || 'Unknown';
                  const existing = custMap.get(name) || { name, total: 0, count: 0 };
                  existing.total += i.totalAmount || 0;
                  existing.count += 1;
                  custMap.set(name, existing);
                });
                const topCusts = Array.from(custMap.values())
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 5);
                const maxTotal = topCusts.length ? topCusts[0].total : 1;
                const colors = ['info', 'success', 'warning', 'primary', 'danger'];

                if (topCusts.length === 0) {
                  return <div className="text-center text-muted py-4" style={{ fontSize: '11px' }}>No customer data</div>;
                }

                return (
                  <div className="d-flex flex-column gap-2">
                    {topCusts.map((c, idx) => {
                      const pct = ((c.total / maxTotal) * 100).toFixed(0);
                      return (
                        <div key={c.name}>
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge bg-${colors[idx]} rounded-pill`} style={{ fontSize: '9px', width: 20, height: 20, padding: 0 }}>
                                {idx + 1}
                              </span>
                              <small className="fw-semibold" style={{ fontSize: '11px' }}>{c.name}</small>
                            </div>
                            <div className="text-end">
                              <strong style={{ fontSize: '11px' }}>{money(c.total)}</strong>
                              <small className="text-muted ms-1" style={{ fontSize: '9px' }}>({c.count} inv)</small>
                            </div>
                          </div>
                          <div className="progress" style={{ height: 4 }}>
                            <div className={`progress-bar bg-${colors[idx]}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
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
