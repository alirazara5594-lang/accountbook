import { useState, useEffect, useMemo } from 'react';
import { useCoaStore, useJournalsStore, useSalesStore, useExpenseClaimsStore, useBankingStore, useAssetsInventoryStore, useProjectsStore, useComplianceStore, useFieldOperationsStore, usePayrollStore } from './stores';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { ModuleSummaryLayout, SummaryPanel } from '@/components/module-summary-layout';
import {
  Sparkles, TrendingUp, TrendingDown, BarChart3, PieChart, Activity, AlertTriangle, Wallet, ShoppingBag, ArrowDownRight, ArrowUpRight, Lightbulb, Target, Boxes, Scale, FileCheck, Clock3, Landmark, LineChart, Info
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart as RAreaChart, Area as RArea, BarChart as RBarChart, Bar as RBar, LineChart as RLineChart, Line as RLine, PieChart as RPieChart, Pie as RPie, Cell as RCell, XAxis as RXAxis, YAxis as RYAxis, CartesianGrid as RCartesianGrid, Tooltip as RTooltip, Legend as RLegend
} from 'recharts';

const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const today = () => new Date().toISOString().split('T')[0];
const monthKey = (d: string) => d.slice(0, 7);
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_COLORS = ['#0d9488', '#2563eb', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#64748b'];

function useAnalyticsData() {
  const coa = useCoaStore();
  const journals = useJournalsStore();
  const sales = useSalesStore();
  const expenses = useExpenseClaimsStore();
  const banking = useBankingStore();
  const inventory = useAssetsInventoryStore();
  const projects = useProjectsStore();
  const compliance = useComplianceStore();
  const field = useFieldOperationsStore();
  const payroll = usePayrollStore();

  useEffect(() => {
    coa.fetchAccounts();
    journals.fetchJournalEntries();
    sales.fetchAllSales();
    expenses.fetchClaims();
    banking.fetchAllBanking();
    inventory.fetchAllAssetsInventory();
    projects.fetchAll();
    compliance.fetchAll();
    field.fetchAll();
    payroll.fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accounts = coa.accounts;
  const entries = journals.entries;
  const invoices = sales.invoices;
  const receipts = sales.receipts;
  const claims = expenses.claims;
  const bankAccounts = banking.bankAccounts;
  const cashAccounts = banking.cashAccounts;
  const stockLevels = inventory.stockLevels;
  const assets = inventory.assets;
  const projectsList = projects.projects;
  const obligations = compliance.obligations;
  const fieldExpenses = field.expenses;
  const employees = payroll.employees;

  const accountById = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

  // Monthly revenue/expense from invoices + claims, bucketed by month
  const monthly = useMemo(() => {
    const buckets: Record<string, { revenue: number; expenses: number; profit: number }> = {};
    invoices.forEach(inv => {
      const k = monthKey(inv.date);
      buckets[k] = buckets[k] || { revenue: 0, expenses: 0, profit: 0 };
      buckets[k].revenue += inv.totalAmount || 0;
    });
    claims.forEach(c => {
      if (c.status !== 'Rejected') {
        const k = monthKey(c.date);
        buckets[k] = buckets[k] || { revenue: 0, expenses: 0, profit: 0 };
        buckets[k].expenses += c.totalAmount || 0;
      }
    });
    fieldExpenses.forEach(fe => {
      const k = monthKey(fe.expenseDate || today());
      buckets[k] = buckets[k] || { revenue: 0, expenses: 0, profit: 0 };
      buckets[k].expenses += fe.amount || 0;
    });
    return Object.keys(buckets).sort().map(k => {
      const b = buckets[k];
      const [y, m] = k.split('-').map(Number);
      return { month: `${MONTH_LABELS[m - 1]} ${y}`, revenue: b.revenue, expenses: b.expenses, profit: b.revenue - b.expenses };
    });
  }, [invoices, claims, fieldExpenses]);

  const totalRevenue = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalExpenses = claims.filter(c => c.status !== 'Rejected').reduce((s, c) => s + (c.totalAmount || 0), 0)
    + fieldExpenses.reduce((s, f) => s + (f.amount || 0), 0);
  const totalProfit = totalRevenue - totalExpenses;

  const cashBalances = bankAccounts.reduce((s, a) => s + (a.balance || 0), 0) + cashAccounts.reduce((s, a) => s + (a.balance || 0), 0);
  const inventoryValue = stockLevels.reduce((s, l) => s + (l.quantityOnHand || 0) * (l.unitCost || 0), 0);
  const lowStock = stockLevels.filter(l => (l.availableQuantity || 0) <= (l.reorderPoint || 0)).length;

  const revenueByCustomer = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.forEach(i => { map[i.customerName || 'Unknown'] = (map[i.customerName || 'Unknown'] || 0) + (i.totalAmount || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [invoices]);

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    claims.forEach(c => { if (c.status !== 'Rejected') map[c.department || 'General'] = (map[c.department || 'General'] || 0) + (c.totalAmount || 0); });
    fieldExpenses.forEach(f => { map[f.category || 'Field'] = (map[f.category || 'Field'] || 0) + (f.amount || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [claims, fieldExpenses]);

  // Cash in/out from bank transactions + receipts
  const cashFlow = useMemo(() => {
    const map: Record<string, { inflow: number; outflow: number }> = {};
    banking.transactions.forEach(t => {
      const k = monthKey(t.date);
      map[k] = map[k] || { inflow: 0, outflow: 0 };
      if (t.type === 'Deposit' || t.type === 'Credit' || t.amount > 0) map[k].inflow += Math.abs(t.amount || 0);
      else map[k].outflow += Math.abs(t.amount || 0);
    });
    receipts.forEach(r => {
      const k = monthKey(r.date);
      map[k] = map[k] || { inflow: 0, outflow: 0 };
      map[k].inflow += r.amount || 0;
    });
    return Object.keys(map).sort().map(k => {
      const [y, m] = k.split('-').map(Number);
      return { month: `${MONTH_LABELS[m - 1]} ${y}`, inflow: map[k].inflow, outflow: map[k].outflow, net: map[k].inflow - map[k].outflow };
    });
  }, [banking.transactions, receipts]);

  const openProjects = projectsList.filter(p => p.status === 'Active').length;
  const obligationsDue = obligations.filter(o => o.status === 'Due' || o.status === 'Overdue').length;

  return {
    accounts, entries, invoices, receipts, claims, bankAccounts, cashAccounts, stockLevels, assets, projectsList, obligations, employees,
    monthly, totalRevenue, totalExpenses, totalProfit, cashBalances, inventoryValue, lowStock,
    revenueByCustomer, expensesByCategory, cashFlow, openProjects, obligationsDue, fieldExpenses,
    fieldCounts: { surveys: field.surveys.length, visits: field.visits.length, inspections: field.inspections.length, workOrders: field.workOrders.length },
    accountById,
  };
}

// ── Summary (module overview) ─────────────────────────────────────────────────
export function AnalyticsDashboardView() {
  const d = useAnalyticsData();
  const chartData = d.monthly.length ? d.monthly.slice(-6) : [{ month: 'No data', revenue: 0, expenses: 0 }];
  const aiScore = Math.min(100, Math.round((d.totalProfit / Math.max(d.totalRevenue, 1)) * 50 + 50));

  return (
    <ModuleSummaryLayout
      title="AI & Analytics"
      description="Business intelligence across financial, sales, expense, cash flow, inventory, and forecasting"
      stats={[
        { icon: Wallet, label: 'Total Revenue', value: money(d.totalRevenue), tone: 'teal' },
        { icon: TrendingDown, label: 'Total Expenses', value: money(d.totalExpenses), tone: 'red' },
        { icon: TrendingUp, label: 'Net Profit', value: money(d.totalProfit), tone: 'green' },
        { icon: Activity, label: 'AI Health Score', value: `${aiScore}/100`, tone: 'violet' },
      ]}
    >
      <SummaryPanel icon={BarChart3} title="Revenue vs Expenses (6 months)">
        <ResponsiveContainer width="100%" height={220}>
          <RAreaChart data={chartData}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} /><stop offset="95%" stopColor="#0d9488" stopOpacity={0} /></linearGradient>
              <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
            </defs>
            <RCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <RXAxis dataKey="month" tick={{ fontSize: 11 }} />
            <RYAxis tick={{ fontSize: 11 }} />
            <RTooltip formatter={(v: any) => money(Number(v))} />
            <RLegend />
            <RArea type="monotone" dataKey="revenue" stroke="#0d9488" fill="url(#gRev)" name="Revenue" />
            <RArea type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#gExp)" name="Expenses" />
          </RAreaChart>
        </ResponsiveContainer>
      </SummaryPanel>
      <SummaryPanel icon={Sparkles} title="Module Activity">
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{d.projectsList.length}</p><p className="text-[10px] text-muted-foreground">Projects</p></div>
          <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{d.openProjects}</p><p className="text-[10px] text-muted-foreground">Active Projects</p></div>
          <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{d.fieldCounts.surveys}</p><p className="text-[10px] text-muted-foreground">Field Surveys</p></div>
          <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{d.obligationsDue}</p><p className="text-[10px] text-muted-foreground">Tax Obligations Due</p></div>
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
  );
}

// ── Financial Analytics ───────────────────────────────────────────────────────
export function FinancialAnalyticsView() {
  const d = useAnalyticsData();
  const profitMargin = d.totalRevenue ? (d.totalProfit / d.totalRevenue) * 100 : 0;
  const expenseRatio = d.totalRevenue ? (d.totalExpenses / d.totalRevenue) * 100 : 0;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Financial Analytics" description="Revenue, expense, and profitability trends across the business" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Total Revenue" value={money(d.totalRevenue)} tone="teal" />
        <StatCard icon={TrendingDown} label="Total Expenses" value={money(d.totalExpenses)} tone="red" />
        <StatCard icon={TrendingUp} label="Net Profit" value={money(d.totalProfit)} tone="green" />
        <StatCard icon={Scale} label="Profit Margin" value={`${profitMargin.toFixed(1)}%`} tone="violet" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 col-span-3 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Monthly Revenue & Profit</p>
          <ResponsiveContainer width="100%" height={260}>
            <RBarChart data={d.monthly.length ? d.monthly : [{ month: 'No data', revenue: 0, expenses: 0, profit: 0 }]}>
              <RCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <RXAxis dataKey="month" tick={{ fontSize: 11 }} />
              <RYAxis tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v: any) => money(Number(v))} />
              <RLegend />
              <RBar dataKey="revenue" fill="#0d9488" name="Revenue" radius={[4, 4, 0, 0]} />
              <RBar dataKey="profit" fill="#8b5cf6" name="Profit" radius={[4, 4, 0, 0]} />
            </RBarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4" /> Key Ratios</p>
          <div className="space-y-2">
            <div className="border rounded-lg p-3"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Expense ratio</span><span className="font-mono font-medium">{expenseRatio.toFixed(1)}%</span></div><div className="mt-1.5 h-2 rounded bg-muted overflow-hidden"><div className="h-full rounded" style={{ width: `${Math.min(100, expenseRatio)}%`, background: expenseRatio > 70 ? '#ef4444' : '#f59e0b' }} /></div></div>
            <div className="border rounded-lg p-3"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Profit margin</span><span className="font-mono font-medium">{profitMargin.toFixed(1)}%</span></div><div className="mt-1.5 h-2 rounded bg-muted overflow-hidden"><div className="h-full rounded bg-teal-500" style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }} /></div></div>
            <div className="border rounded-lg p-3 flex justify-between text-sm"><span className="text-muted-foreground">Invoices issued</span><span className="font-mono font-medium">{d.invoices.length}</span></div>
            <div className="border rounded-lg p-3 flex justify-between text-sm"><span className="text-muted-foreground">Outstanding AR</span><span className="font-mono font-medium">{money(d.invoices.reduce((s, i) => s + (i.amountDue || 0), 0))}</span></div>
            <div className="border rounded-lg p-3 flex justify-between text-sm"><span className="text-muted-foreground">Payments received</span><span className="font-mono font-medium">{d.receipts.length}</span></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Sales Analytics ───────────────────────────────────────────────────────────
export function SalesAnalyticsView() {
  const d = useAnalyticsData();
  const outstanding = d.invoices.reduce((s, i) => s + (i.amountDue || 0), 0);
  const collected = d.receipts.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Sales Analytics" description="Revenue, collections, and customer concentration analysis" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Total Sales" value={money(d.totalRevenue)} tone="teal" />
        <StatCard icon={ArrowUpRight} label="Collected" value={money(collected)} tone="green" />
        <StatCard icon={ArrowDownRight} label="Outstanding" value={money(outstanding)} tone="amber" />
        <StatCard icon={PieChart} label="Invoices" value={d.invoices.length} tone="blue" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 col-span-3 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Monthly Sales Revenue</p>
          <ResponsiveContainer width="100%" height={260}>
            <RAreaChart data={d.monthly.length ? d.monthly : [{ month: 'No data', revenue: 0, expenses: 0, profit: 0 }]}>
              <defs><linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient></defs>
              <RCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <RXAxis dataKey="month" tick={{ fontSize: 11 }} />
              <RYAxis tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v: any) => money(Number(v))} />
              <RArea type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#gSales)" name="Revenue" />
            </RAreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><PieChart className="h-4 w-4" /> Top Customers</p>
          <ResponsiveContainer width="100%" height={220}>
            <RPieChart>
              <RPie data={d.revenueByCustomer.length ? d.revenueByCustomer : [{ name: 'No data', value: 1 }]} dataKey="value" nameKey="name" outerRadius={80} label={(p: any) => `${p.name}`}>
                {(d.revenueByCustomer.length ? d.revenueByCustomer : [{ name: 'No data', value: 1 }]).map((_, i) => <RCell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </RPie>
              <RTooltip formatter={(v: any) => money(Number(v))} />
            </RPieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 col-span-5 space-y-3">
          <p className="text-sm font-medium">Customer Concentration</p>
          <div className="space-y-2">
            {d.revenueByCustomer.map(c => {
              const pct = d.totalRevenue ? (c.value / d.totalRevenue) * 100 : 0;
              return (
                <div key={c.name} className="flex items-center gap-3 text-sm">
                  <span className="w-48 truncate">{c.name}</span>
                  <div className="flex-1 h-2 rounded bg-muted overflow-hidden"><div className="h-full rounded bg-teal-500" style={{ width: `${pct}%` }} /></div>
                  <span className="w-24 text-right font-mono font-medium">{money(c.value)}</span>
                  <span className="w-14 text-right text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
            {d.revenueByCustomer.length === 0 && <p className="text-sm text-muted-foreground">No sales data recorded yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Expense Analytics ─────────────────────────────────────────────────────────
export function ExpenseAnalyticsView() {
  const d = useAnalyticsData();
  const paidClaims = d.claims.filter(c => c.status === 'Paid').length;
  const pendingClaims = d.claims.filter(c => c.status === 'Submitted' || c.status === 'Approved').length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Expense Analytics" description="Spend analysis by category and department" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={TrendingDown} label="Total Expenses" value={money(d.totalExpenses)} tone="red" />
        <StatCard icon={FileCheck} label="Paid Claims" value={paidClaims} tone="teal" />
        <StatCard icon={Clock3} label="Pending Claims" value={pendingClaims} tone="amber" />
        <StatCard icon={Wallet} label="Avg Claim Size" value={money(d.claims.length ? (d.claims.reduce((s, c) => s + (c.totalAmount || 0), 0) / d.claims.length) : 0)} tone="blue" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><PieChart className="h-4 w-4" /> Spend by Category</p>
          <ResponsiveContainer width="100%" height={240}>
            <RPieChart>
              <RPie data={d.expensesByCategory.length ? d.expensesByCategory : [{ name: 'No data', value: 1 }]} dataKey="value" nameKey="name" outerRadius={85}>
                {(d.expensesByCategory.length ? d.expensesByCategory : [{ name: 'No data', value: 1 }]).map((_, i) => <RCell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </RPie>
              <RTooltip formatter={(v: any) => money(Number(v))} />
              <RLegend />
            </RPieChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4 col-span-3 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Monthly Expenses</p>
          <ResponsiveContainer width="100%" height={260}>
            <RBarChart data={d.monthly.length ? d.monthly : [{ month: 'No data', revenue: 0, expenses: 0, profit: 0 }]}>
              <RCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <RXAxis dataKey="month" tick={{ fontSize: 11 }} />
              <RYAxis tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v: any) => money(Number(v))} />
              <RBar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
            </RBarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ── Cash Flow Analytics ───────────────────────────────────────────────────────
export function CashFlowAnalyticsView() {
  const d = useAnalyticsData();
  const inflow = d.cashFlow.reduce((s, c) => s + c.inflow, 0);
  const outflow = d.cashFlow.reduce((s, c) => s + c.outflow, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Cash Flow Analytics" description="Cash movements across bank and cash accounts" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Cash & Equivalents" value={money(d.cashBalances)} tone="teal" />
        <StatCard icon={ArrowUpRight} label="Inflows" value={money(inflow)} tone="green" />
        <StatCard icon={ArrowDownRight} label="Outflows" value={money(outflow)} tone="red" />
        <StatCard icon={Activity} label="Net Movement" value={money(inflow - outflow)} tone="blue" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 col-span-3 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><LineChart className="h-4 w-4" /> Monthly Cash Flow</p>
          <ResponsiveContainer width="100%" height={260}>
            <RLineChart data={d.cashFlow.length ? d.cashFlow : [{ month: 'No data', inflow: 0, outflow: 0, net: 0 }]}>
              <RCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <RXAxis dataKey="month" tick={{ fontSize: 11 }} />
              <RYAxis tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v: any) => money(Number(v))} />
              <RLegend />
              <RLine type="monotone" dataKey="inflow" stroke="#10b981" name="Inflow" />
              <RLine type="monotone" dataKey="outflow" stroke="#ef4444" name="Outflow" />
              <RLine type="monotone" dataKey="net" stroke="#2563eb" name="Net" />
            </RLineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Landmark className="h-4 w-4" /> Account Balances</p>
          <div className="space-y-2">
            {[...d.bankAccounts, ...d.cashAccounts].slice(0, 8).map(a => (
              <div key={a.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
                <div className="min-w-0"><p className="font-medium truncate">{a.name}</p><p className="text-xs text-muted-foreground">{a.currency}</p></div>
                <span className="font-mono font-medium">{money(a.balance || 0)}</span>
              </div>
            ))}
            {d.bankAccounts.length + d.cashAccounts.length === 0 && <p className="text-sm text-muted-foreground">No bank or cash accounts configured.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Inventory Analytics ───────────────────────────────────────────────────────
export function InventoryAnalyticsView() {
  const d = useAnalyticsData();
  const totalUnits = d.stockLevels.reduce((s, l) => s + (l.quantityOnHand || 0), 0);
  const assetValue = d.assets.reduce((s, a) => s + (a.bookValue || 0), 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Inventory Analytics" description="Stock valuation, availability, and fixed asset position" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Boxes} label="Inventory Value" value={money(d.inventoryValue)} tone="teal" />
        <StatCard icon={Target} label="Units on Hand" value={totalUnits} tone="blue" />
        <StatCard icon={AlertTriangle} label="Low Stock Items" value={d.lowStock} tone="amber" />
        <StatCard icon={Scale} label="Fixed Assets (NBV)" value={money(assetValue)} tone="violet" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 col-span-3 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Boxes className="h-4 w-4" /> Stock Level & Reorder Points</p>
          <ResponsiveContainer width="100%" height={260}>
            <RBarChart data={d.stockLevels.length ? d.stockLevels.slice(0, 12).map(l => ({ name: l.productName || l.itemCode || 'Item', onHand: l.quantityOnHand || 0, reorder: l.reorderPoint || 0 })) : [{ name: 'No data', onHand: 0, reorder: 0 }]}>
              <RCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <RXAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <RYAxis tick={{ fontSize: 11 }} />
              <RTooltip />
              <RLegend />
              <RBar dataKey="onHand" fill="#0d9488" name="On Hand" radius={[4, 4, 0, 0]} />
              <RBar dataKey="reorder" fill="#f59e0b" name="Reorder Point" radius={[4, 4, 0, 0]} />
            </RBarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Stock Alerts</p>
          <div className="space-y-2">
            {d.stockLevels.filter(l => (l.availableQuantity || 0) <= (l.reorderPoint || 0)).slice(0, 8).map(l => (
              <div key={l.id} className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm">
                <div className="min-w-0"><p className="font-medium truncate">{l.productName || l.itemCode || 'Item'}</p><p className="text-xs text-muted-foreground">{l.warehouseName || 'Main'}</p></div>
                <Badge variant="destructive">{l.availableQuantity || 0} left</Badge>
              </div>
            ))}
            {d.lowStock === 0 && <p className="text-sm text-muted-foreground">No stock alerts — all items above reorder points.</p>}
          </div>
          <p className="text-sm font-medium flex items-center gap-2 mt-4"><Scale className="h-4 w-4" /> Asset Depreciation Status</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{d.assets.length}</p><p className="text-[10px] text-muted-foreground">Assets Registered</p></div>
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{d.assets.filter(a => a.status === 'Active').length}</p><p className="text-[10px] text-muted-foreground">Active</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Forecasting ───────────────────────────────────────────────────────────────
export function ForecastingView() {
  const d = useAnalyticsData();
  const [horizon, setHorizon] = useState('3');

  const forecast = useMemo(() => {
    const series = d.monthly.map(m => m.revenue);
    if (series.length < 2) return [];
    const n = series.length;
    const sumX = series.reduce((s, _, i) => s + i, 0);
    const sumY = series.reduce((s, y) => s + y, 0);
    const sumXY = series.reduce((s, y, i) => s + i * y, 0);
    const sumX2 = series.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const last = d.monthly[d.monthly.length - 1];
    const [y0, m0] = last.month.split(' ');
    const year = Number(y0); const monthIdx = MONTH_LABELS.indexOf(m0);
    const out: { month: string; revenue: number; expenses: number; profit: number; forecast?: boolean }[] = [...d.monthly];
    for (let i = 1; i <= Number(horizon); i++) {
      const ym = monthIdx + i;
      const ny = year + Math.floor(ym / 12);
      const nm = ym % 12;
      out.push({ month: `${MONTH_LABELS[nm]} ${ny}`, revenue: Math.max(0, intercept + slope * (series.length - 1 + i)), expenses: Math.max(0, (intercept + slope * (series.length - 1 + i)) * 0.7), profit: (intercept + slope * (series.length - 1 + i)) * 0.3, forecast: true });
    }
    return out.slice(-(Number(horizon) + 3));
  }, [d.monthly, horizon]);

  const projectedRevenue = forecast.filter(f => (f as any).forecast).reduce((s, f) => s + f.revenue, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Forecasting"
        description="Linear trend projection of revenue and expenses"
        actions={
          <Select value={horizon} onValueChange={v => setHorizon(v || '3')}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Horizon" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 months</SelectItem>
              <SelectItem value="6">6 months</SelectItem>
              <SelectItem value="12">12 months</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Target} label="Forecast Horizon" value={`${horizon} mo`} tone="teal" />
        <StatCard icon={TrendingUp} label="Projected Revenue" value={money(projectedRevenue)} tone="green" />
        <StatCard icon={TrendingDown} label="Projected Expenses" value={money(forecast.filter(f => (f as any).forecast).reduce((s, f) => s + f.expenses, 0))} tone="red" />
        <StatCard icon={Lightbulb} label="Data Points" value={d.monthly.length} tone="blue" />
      </div>
      <Card className="p-4 space-y-3">
        <p className="text-sm font-medium flex items-center gap-2"><LineChart className="h-4 w-4" /> Revenue Forecast (Linear Trend)</p>
        <ResponsiveContainer width="100%" height={300}>
          <RLineChart data={forecast}>
            <RCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <RXAxis dataKey="month" tick={{ fontSize: 11 }} />
            <RYAxis tick={{ fontSize: 11 }} />
            <RTooltip formatter={(v: any) => money(Number(v))} />
            <RLegend />
            <RLine type="monotone" dataKey="revenue" stroke="#0d9488" name="Revenue" dot={{ r: 3 }} />
            <RLine type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" dot={{ r: 3 }} strokeDasharray="5 5" />
          </RLineChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground">Dashed segments represent projected values extrapolated from historical trend. Forecast quality improves as more months of data are recorded.</p>
      </Card>
    </div>
  );
}

// ── AI Insights ───────────────────────────────────────────────────────────────
export function AIInsightsView() {
  const d = useAnalyticsData();
  const profitMargin = d.totalRevenue ? (d.totalProfit / d.totalRevenue) * 100 : 0;
  const expensesPct = d.totalRevenue ? (d.totalExpenses / d.totalRevenue) * 100 : 0;

  const insights = useMemo(() => {
    const list: { icon: React.ReactNode; title: string; detail: string; tone: 'teal' | 'amber' | 'red' | 'blue' | 'violet' }[] = [];

    if (d.totalRevenue === 0) list.push({ icon: <Info className="h-4 w-4" />, title: 'No sales recorded', detail: 'Create invoices or record sales receipts to unlock revenue analytics and forecasting.', tone: 'blue' });
    if (expensesPct > 70) list.push({ icon: <AlertTriangle className="h-4 w-4" />, title: 'High expense ratio', detail: `Expenses consume ${expensesPct.toFixed(1)}% of revenue. Review spending by category in Expense Analytics.`, tone: 'red' });
    if (profitMargin < 15 && d.totalRevenue > 0) list.push({ icon: <TrendingDown className="h-4 w-4" />, title: 'Thin profit margins', detail: `Current margin is ${profitMargin.toFixed(1)}%. Consider repricing, cost controls, or reducing low-margin SKUs.`, tone: 'amber' });
    if (profitMargin >= 15) list.push({ icon: <TrendingUp className="h-4 w-4" />, title: 'Healthy margins', detail: `Profit margin of ${profitMargin.toFixed(1)}% is above the 15% benchmark. Maintain current cost structure.`, tone: 'teal' });

    const topCustomer = d.revenueByCustomer[0];
    if (topCustomer) {
      const pct = d.totalRevenue ? (topCustomer.value / d.totalRevenue) * 100 : 0;
      if (pct > 40) list.push({ icon: <AlertTriangle className="h-4 w-4" />, title: 'Customer concentration risk', detail: `${topCustomer.name} contributes ${pct.toFixed(1)}% of revenue. Diversify to reduce dependence on a single customer.`, tone: 'red' });
      else list.push({ icon: <Target className="h-4 w-4" />, title: 'Top customer', detail: `${topCustomer.name} leads revenue at ${money(topCustomer.value)}. Consider a loyalty or upsell program.`, tone: 'teal' });
    }

    if (d.lowStock > 0) list.push({ icon: <Boxes className="h-4 w-4" />, title: 'Inventory replenishment needed', detail: `${d.lowStock} item(s) are at or below reorder point. Create purchase orders before stockouts occur.`, tone: 'amber' });

    const cash = d.cashFlow[d.cashFlow.length - 1];
    if (cash && cash.net < 0) list.push({ icon: <Wallet className="h-4 w-4" />, title: 'Negative net cash movement', detail: `Net cash flow was ${money(cash.net)} in ${cash.month}. Monitor liquidity in Cash Flow Analytics.`, tone: 'red' });
    if (cash && cash.net >= 0) list.push({ icon: <Wallet className="h-4 w-4" />, title: 'Positive cash position', detail: `Net cash movement of ${money(cash.net)} in ${cash.month}. Consider investing surplus or short-term instruments.`, tone: 'teal' });

    if (d.obligationsDue > 0) list.push({ icon: <AlertTriangle className="h-4 w-4" />, title: 'Tax obligations due', detail: `${d.obligationsDue} obligation(s) are due or overdue. File returns in Government Compliance to avoid penalties.`, tone: 'red' });

    if (d.assets.length > 0) {
      const depreciating = d.assets.filter(a => a.status === 'Active' && a.accumulatedDepreciation > 0).length;
      list.push({ icon: <Scale className="h-4 w-4" />, title: 'Asset depreciation', detail: `${depreciating} of ${d.assets.length} assets are depreciating. Net book value is ${money(d.assets.reduce((s, a) => s + (a.bookValue || 0), 0))}.`, tone: 'blue' });
    }

    if (list.length === 0) list.push({ icon: <Sparkles className="h-4 w-4" />, title: 'No insights yet', detail: 'Add financial activity to generate AI-driven business insights.', tone: 'blue' });

    return list;
  }, [d, expensesPct, profitMargin]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="AI Insights" description="Automated, rule-based business intelligence generated from live data" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Sparkles} label="Insights Generated" value={insights.length} tone="violet" />
        <StatCard icon={AlertTriangle} label="Risks Detected" value={insights.filter(i => i.tone === 'red').length} tone="red" />
        <StatCard icon={TrendingUp} label="Opportunities" value={insights.filter(i => i.tone === 'teal').length} tone="green" />
        <StatCard icon={Lightbulb} label="Recommendations" value={insights.filter(i => i.tone === 'amber').length} tone="amber" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {insights.map((ins, i) => (
          <Card key={i} className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className={`flex size-8 items-center justify-center rounded-lg ${ins.tone === 'teal' ? 'bg-teal-500/10 text-teal-600' : ins.tone === 'red' ? 'bg-red-500/10 text-red-600' : ins.tone === 'amber' ? 'bg-amber-500/10 text-amber-600' : ins.tone === 'blue' ? 'bg-blue-500/10 text-blue-600' : 'bg-violet-500/10 text-violet-600'}`}>{ins.icon}</span>
              {ins.title}
            </div>
            <p className="text-sm text-muted-foreground">{ins.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}