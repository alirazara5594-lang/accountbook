import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Wallet, HandCoins, CreditCard, Package, TrendingUp, TrendingDown,
  Users, Landmark, Calculator, Boxes, Factory, Truck, MapPin, Scale, Hammer, Settings,
  ArrowUpRight, Building2, Globe2, ShieldCheck, Receipt, FileText, AlertTriangle, Banknote,
} from 'lucide-react';
import {
  useSalesStore,
  useCustomersStore,
  useProcurementStore,
  useVendorsStore,
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

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0);
}

function num(n: number) {
  return new Intl.NumberFormat('en-US').format(n || 0);
}

function fmtDate(d?: string) {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function agingBucket(dueDate?: string): string {
  if (!dueDate) return 'Current';
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) {
    const o = Math.abs(days);
    if (o <= 30) return '1-30';
    if (o <= 60) return '31-60';
    if (o <= 90) return '61-90';
    return '90+';
  }
  return 'Current';
}

const AGING_BUCKETS = ['Current', '1-30', '31-60', '61-90', '90+'];

function Sparkline({ points, color = '#55d8c5', width = 84, height = 28 }: { points: number[]; color?: string; width?: number; height?: number }) {
  if (!points.length) return <div style={{ width, height }} />;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = width / (points.length - 1 || 1);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${(height - ((p - min) / range) * (height - 4) - 2).toFixed(1)}`);
  const area = `0,${height} ${coords.join(' ')} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline points={coords.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].split(',')[0]} cy={coords[coords.length - 1].split(',')[1]} r="2" fill={color} />
    </svg>
  );
}

function Donut({ segments, size = 84, thickness = 10 }: { segments: { value: number; color: string }[]; size?: number; thickness?: number }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#22395c" strokeWidth={thickness} />
      {segments.map((s, i) => {
        const frac = (s.value || 0) / total;
        const dash = frac * circ;
        const el = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        );
        offset += dash;
        return el;
      })}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="#fff" fontSize={size * 0.16} fontWeight={700}>
        {Math.round(total)}
      </text>
    </svg>
  );
}

function Bars({ data, height = 64 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center justify-end flex-1 min-w-0 h-full">
          <div
            className="w-full rounded-t"
            style={{
              height: `${Math.max((d.value / max) * 100, 3)}%`,
              background: `linear-gradient(180deg, ${d.color || '#55d8c5'}55, ${d.color || '#55d8c5'})`,
              opacity: 0.95,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[7px] text-[#9db3cd] truncate w-full text-center leading-tight mt-0.5">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// Grouped AR vs AP aging bars, one pair per aging bucket
function AgingBars({ ar, ap, height = 120 }: { ar: Record<string, number>; ap: Record<string, number>; height?: number }) {
  const max = Math.max(...AGING_BUCKETS.map((b) => Math.max(ar[b] || 0, ap[b] || 0)), 1);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {AGING_BUCKETS.map((b) => (
        <div key={b} className="flex flex-col items-center flex-1 min-w-0 h-full justify-end">
          <div className="flex items-end gap-1 h-full">
            <div
              className="w-3.5 rounded-t"
              style={{ height: `${Math.max(((ar[b] || 0) / max) * 100, 3)}%`, background: 'linear-gradient(180deg, #22d3ee66, #22d3ee)' }}
              title={`AR ${b}: ${money(ar[b] || 0)}`}
            />
            <div
              className="w-3.5 rounded-t"
              style={{ height: `${Math.max(((ap[b] || 0) / max) * 100, 3)}%`, background: 'linear-gradient(180deg, #fbbf2466, #fbbf24)' }}
              title={`AP ${b}: ${money(ap[b] || 0)}`}
            />
          </div>
          <span className="text-[8px] text-[#9db3cd] truncate w-full text-center leading-tight mt-1">{b}</span>
        </div>
      ))}
    </div>
  );
}

const MODULE_COLORS: Record<string, string> = {
  'Sales & Customers': '#22d3ee',
  Procurement: '#fbbf24',
  'Banking & Payments': '#34d399',
  Accounting: '#a78bfa',
  'Assets & Inventory': '#2dd4bf',
  'Manufacturing & Production': '#fb923c',
  'Payroll & HR': '#f472b6',
  'Survey & Field Operations': '#4ade80',
  'Government Compliance': '#f87171',
  Projects: '#818cf8',
  Administration: '#94a3b8',
  'AI & Analytics': '#c084fc',
};

const STATUS_COLORS: Record<string, string> = {
  Draft: '#94a3b8',
  Open: '#22d3ee',
  Sent: '#22d3ee',
  Pending: '#fbbf24',
  Approved: '#34d399',
  Paid: '#34d399',
  Overdue: '#f87171',
  Received: '#34d399',
  Completed: '#34d399',
  Cancelled: '#64748b',
};

export function DashboardOverview({ accounts, entries, setPage, activeEntityId }: DashboardOverviewProps) {
  // Sales & Customers
  const { invoices, estimates, receipts, fetchAllSales } = useSalesStore();
  const { customers, fetchCustomers } = useCustomersStore();
  // Procurement
  const { orders, bills, requests, fetchAllProcurement } = useProcurementStore();
  const { vendors, fetchVendors } = useVendorsStore();
  // Banking
  const { bankAccounts, cashAccounts, transactions, fetchAllBanking } = useBankingStore();
  // Assets & Inventory
  const { assets, warehouses, stockLevels, fetchAllAssetsInventory } = useAssetsInventoryStore();
  // Manufacturing
  const { boms, workOrders, fetchAllManufacturing } = useManufacturingStore();
  // Payroll
  const { employees, departments, payruns, salarySlips, leaveRequests } = usePayrollStore();
  // Field Operations
  const fieldStore = useFieldOperationsStore();
  // Compliance
  const complianceStore = useComplianceStore();
  // Projects
  const { projects, tasks, fetchAll: fetchProjectsAll } = useProjectsStore();
  // Administration
  const adminStore = useAdministrationStore();
  // Tax
  const { taxCodes, fetchAllTaxData } = useTaxStore();

  const [loading, setLoading] = useState(true);
  const [today] = useState(() => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  useEffect(() => {
    Promise.all([
      fetchAllSales(activeEntityId),
      fetchCustomers(activeEntityId),
      fetchAllProcurement(activeEntityId),
      fetchVendors(activeEntityId),
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

  // ---- Financial KPIs from chart of accounts ----
  const cashBal = accounts.filter((a) => a.code.startsWith('111')).reduce((s, a) => s + Math.abs(a.openingBalance), 0);
  const bankBal = accounts.filter((a) => a.code.startsWith('112')).reduce((s, a) => s + Math.abs(a.openingBalance), 0);
  const invBal = accounts.filter((a) => a.code.startsWith('13000')).reduce((s, a) => s + Math.abs(a.openingBalance), 0);
  const faBal = accounts.filter((a) => a.code.startsWith('15100')).reduce((s, a) => s + Math.abs(a.openingBalance), 0);
  const totalRevenue = accounts.filter((a) => a.type === 'Revenue' || a.type === 'ContraRevenue').reduce((s, a) => s + a.openingBalance, 0);
  const totalExpense = accounts.filter((a) => a.type === 'Expense' || a.type === 'ContraExpense').reduce((s, a) => s + a.openingBalance, 0);
  const totalAssets = accounts.filter((a) => a.type === 'Asset').reduce((s, a) => s + a.openingBalance, 0);
  const totalLiabilities = accounts.filter((a) => a.type === 'Liability').reduce((s, a) => s + a.openingBalance, 0);
  const totalEquity = accounts.filter((a) => a.type === 'Equity').reduce((s, a) => s + a.openingBalance, 0);

  // ---- Sales derived ----
  const totalInvoiced = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const collected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const openInvoices = invoices.filter((i) => (i.amountDue || 0) > 0);
  const unpaidInvoices = openInvoices.length;
  const overdueInvoices = openInvoices.filter((i) => new Date(i.dueDate).getTime() < Date.now()).length;
  const receiptTotal = receipts.reduce((s, r) => s + (r.amount || 0), 0);

  // ---- Procurement / bills derived ----
  const orderValue = orders.reduce((s, o: any) => s + (o.totalAmount || o.total || 0), 0);
  const openOrders = orders.filter((o: any) => ['Open', 'Pending', 'Approved'].includes(o.status)).length;
  const billTotal = bills.reduce((s, b: any) => s + (b.totalAmount || b.total || 0), 0);
  const paidBills = bills.filter((b: any) => b.status === 'Paid').length;
  const unpaidBillsArr = (bills as any[]).filter((b) => (b.amountDue ?? (b.status !== 'Paid' ? b.totalAmount ?? b.total ?? 0 : 0)) > 0);

  // ---- AR / AP aging ----
  const arAging: Record<string, number> = {};
  AGING_BUCKETS.forEach((b) => (arAging[b] = 0));
  openInvoices.forEach((i) => {
    const b = agingBucket(i.dueDate);
    arAging[b] = (arAging[b] || 0) + (i.amountDue || 0);
  });

  const apAging: Record<string, number> = {};
  AGING_BUCKETS.forEach((b) => (apAging[b] = 0));
  unpaidBillsArr.forEach((b) => {
    const bucket = agingBucket(b.dueDate);
    const due = b.amountDue ?? ((b.totalAmount ?? b.total ?? 0) - (b.amountPaid ?? 0));
    apAging[bucket] = (apAging[bucket] || 0) + due;
  });
  const arOverdueTotal = arAging['1-30'] + arAging['31-60'] + arAging['61-90'] + arAging['90+'];
  const apOverdueTotal = apAging['1-30'] + apAging['31-60'] + apAging['61-90'] + apAging['90+'];

  // ---- Banking derived ----
  const bankTotal = bankAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const cashTotal = cashAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);

  // ---- Assets & Inventory derived ----
  const bookValue = assets.reduce((s, a) => s + (a.bookValue ?? 0), 0);
  const stockValue = stockLevels.reduce((s, l) => s + (l.quantityOnHand || 0) * (l.unitCost || 0), 0);
  const lowStock = stockLevels.filter((l) => (l.availableQuantity ?? l.quantityOnHand) <= (l.reorderPoint || 0)).length;

  // ---- Manufacturing derived ----
  const activeWorkOrders = workOrders.filter((w) => w.status !== 'Completed' && w.status !== 'Cancelled').length;
  const mfgCost = workOrders.reduce((s, w) => s + (w.totalCost || 0), 0);

  // ---- Payroll derived ----
  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const totalNetPay = salarySlips.reduce((s, sl) => s + (sl.netPay || 0), 0);
  const pendingLeave = leaveRequests.filter((l) => l.status === 'Pending').length;

  // ---- Projects derived ----
  const activeProjects = projects.filter((p) => p.status === 'Active').length;
  const projectBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);

  // ---- Field Ops / Compliance / Admin dashboards ----
  const fDash = fieldStore.dashboard;
  const cDash = complianceStore.dashboard;
  const aDash = adminStore.dashboard;

  const liquidity = cashBal + bankBal;
  const netIncome = totalRevenue - totalExpense;
  const bankAndCash = bankTotal + cashTotal;
  const totalBillsDue = apAging['Current'] + apOverdueTotal;

  // ---- Scorecard strip ----
  const scorecards = [
    { label: 'Cash & Bank', value: money(liquidity), color: '#34d399', icon: <Wallet size={16} />, trend: +3.2, pts: [12, 14, 13, 16, 18, 17, 20] },
    { label: 'Invoiced', value: money(totalInvoiced), color: '#22d3ee', icon: <Receipt size={16} />, trend: +4.1, pts: [8, 9, 11, 10, 13, 14, 16] },
    { label: 'Collected', value: money(collected), color: '#34d399', icon: <Banknote size={16} />, trend: +2.7, pts: [7, 9, 8, 10, 12, 11, 14] },
    { label: 'Outstanding AR', value: money(arAging['Current'] + arOverdueTotal), color: '#22d3ee', icon: <HandCoins size={16} />, trend: +1.2, pts: [6, 7, 6, 9, 8, 10, 12] },
    { label: 'Outstanding AP', value: money(totalBillsDue), color: '#fbbf24', icon: <CreditCard size={16} />, trend: -0.8, pts: [5, 6, 8, 7, 9, 8, 10] },
    { label: 'Revenue', value: money(totalRevenue), color: '#4ade80', icon: <TrendingUp size={16} />, trend: +5.6, pts: [5, 7, 6, 9, 11, 10, 14] },
    { label: 'Net Income', value: money(netIncome), color: '#a78bfa', icon: <TrendingDown size={16} />, trend: +1.9, pts: [4, 5, 7, 6, 8, 9, 11] },
    { label: 'Inventory', value: money(invBal), color: '#a78bfa', icon: <Package size={16} />, trend: +2.1, pts: [10, 12, 11, 13, 12, 14, 15] },
  ];

  // ---- Module registry ----
  const modules: {
    name: string;
    icon: ReactNode;
    page: string;
    color: string;
    kpis: { label: string; value: string }[];
    chart: ReactNode;
    stat: string;
    statLabel: string;
    sub?: string;
  }[] = [
    {
      name: 'Sales & Customers',
      icon: <Users size={20} />,
      page: 'Sales & Customers.Sales Workspace',
      color: MODULE_COLORS['Sales & Customers'],
      kpis: [
        { label: 'Customers', value: num(customers.length) },
        { label: 'Open Invoices', value: num(unpaidInvoices) },
        { label: 'Estimates', value: num(estimates.length) },
      ],
      chart: (
        <Bars
          data={[
            { label: 'Draft', value: invoices.filter((i) => i.status === 'Draft').length, color: '#475569' },
            { label: 'Open', value: unpaidInvoices, color: '#0ea5e9' },
            { label: 'Paid', value: invoices.filter((i) => (i.amountDue ?? 0) <= 0).length, color: '#10b981' },
          ]}
        />
      ),
      stat: money(collected),
      statLabel: 'Collected',
      sub: `${money(totalInvoiced)} invoiced · ${money(receiptTotal)} receipts`,
    },
    {
      name: 'Procurement',
      icon: <Truck size={20} />,
      page: 'Procurement.Procurement Workspace',
      color: MODULE_COLORS.Procurement,
      kpis: [
        { label: 'Vendors', value: num(vendors.length) },
        { label: 'Open POs', value: num(openOrders) },
        { label: 'Purchase Reqs', value: num(requests.length) },
      ],
      chart: (
        <Bars
          data={[
            { label: 'Pending', value: orders.filter((o: any) => o.status === 'Pending').length, color: '#f59e0b' },
            { label: 'Open', value: openOrders, color: '#0ea5e9' },
            { label: 'Received', value: orders.filter((o: any) => o.status === 'Received' || o.status === 'Completed').length, color: '#10b981' },
          ]}
        />
      ),
      stat: money(billTotal),
      statLabel: 'Total Bills',
      sub: `${money(orderValue)} on PO · ${num(paidBills)} bills paid`,
    },
    {
      name: 'Banking & Payments',
      icon: <Landmark size={20} />,
      page: 'Banking & Payments.Bank Accounts',
      color: MODULE_COLORS['Banking & Payments'],
      kpis: [
        { label: 'Bank Accounts', value: num(bankAccounts.length) },
        { label: 'Cash Registers', value: num(cashAccounts.length) },
        { label: 'Transactions', value: num(transactions.length) },
      ],
      chart: (
        <Donut
          segments={[
            { value: Math.abs(bankTotal), color: '#10b981' },
            { value: Math.abs(cashTotal), color: '#0ea5e9' },
          ]}
        />
      ),
      stat: money(bankAndCash),
      statLabel: 'Liquidity',
    },
    {
      name: 'Accounting',
      icon: <Calculator size={20} />,
      page: 'Accounting.Chart of Accounts',
      color: MODULE_COLORS.Accounting,
      kpis: [
        { label: 'Active Accounts', value: num(accounts.filter((a) => a.status !== 'Inactive').length) },
        { label: 'Journal Entries', value: num(entries.length) },
        { label: 'Tax Codes', value: num(taxCodes.length) },
      ],
      chart: (
        <Donut
          segments={[
            { value: Math.abs(totalAssets), color: '#0ea5e9' },
            { value: Math.abs(totalLiabilities), color: '#f87171' },
            { value: Math.abs(totalEquity), color: '#10b981' },
          ]}
        />
      ),
      stat: money(netIncome),
      statLabel: 'Net Income',
    },
    {
      name: 'Assets & Inventory',
      icon: <Boxes size={20} />,
      page: 'Assets & Inventory.Assets & Inventory Workspace',
      color: MODULE_COLORS['Assets & Inventory'],
      kpis: [
        { label: 'Fixed Assets', value: num(assets.length) },
        { label: 'Warehouses', value: num(warehouses.length) },
        { label: 'Low Stock', value: num(lowStock) },
      ],
      chart: (
        <Bars
          data={[
            { label: 'Assets', value: Math.abs(faBal / 1000), color: '#14b8a6' },
            { label: 'Inventory', value: Math.abs(invBal / 1000), color: '#0ea5e9' },
            { label: 'Stock', value: stockValue / 1000, color: '#8b5cf6' },
          ]}
        />
      ),
      stat: money(bookValue + stockValue),
      statLabel: 'Asset Value',
    },
    {
      name: 'Manufacturing & Production',
      icon: <Factory size={20} />,
      page: 'Manufacturing & Production.Manufacturing Workspace',
      color: MODULE_COLORS['Manufacturing & Production'],
      kpis: [
        { label: 'BOMs', value: num(boms.length) },
        { label: 'Active WOs', value: num(activeWorkOrders) },
        { label: 'Total WOs', value: num(workOrders.length) },
      ],
      chart: (
        <Bars
          data={[
            { label: 'Planned', value: workOrders.filter((w) => w.status === 'Planned').length, color: '#475569' },
            { label: 'In Prog', value: workOrders.filter((w) => w.status === 'InProgress' || w.status === 'Started').length, color: '#f97316' },
            { label: 'Done', value: workOrders.filter((w) => w.status === 'Completed').length, color: '#10b981' },
          ]}
        />
      ),
      stat: money(mfgCost),
      statLabel: 'Production Cost',
    },
    {
      name: 'Payroll & HR',
      icon: <Users size={20} />,
      page: 'Payroll & HR.Employees',
      color: MODULE_COLORS['Payroll & HR'],
      kpis: [
        { label: 'Employees', value: num(employees.length) },
        { label: 'Active', value: num(activeEmployees) },
        { label: 'Departments', value: num(departments.length) },
      ],
      chart: (
        <Bars
          data={[
            { label: 'Leave Pnd', value: pendingLeave, color: '#f59e0b' },
            { label: 'Payruns', value: payruns.length, color: '#ec4899' },
            { label: 'Slips', value: salarySlips.length, color: '#22c55e' },
          ]}
        />
      ),
      stat: money(totalNetPay),
      statLabel: 'Net Pay',
    },
    {
      name: 'Survey & Field Operations',
      icon: <MapPin size={20} />,
      page: 'Survey & Field Operations.Surveys',
      color: MODULE_COLORS['Survey & Field Operations'],
      kpis: [
        { label: 'Surveys', value: num(fDash?.surveys ?? fieldStore.surveys.length) },
        { label: 'Visits', value: num(fDash?.visits ?? fieldStore.visits.length) },
        { label: 'Work Orders', value: num(fDash?.workOrders ?? fieldStore.workOrders.length) },
      ],
      chart: (
        <Bars
          data={[
            { label: 'Active', value: fDash?.activeSurveys ?? 0, color: '#22c55e' },
            { label: 'Open WO', value: fDash?.openOrders ?? 0, color: '#f59e0b' },
            { label: 'Insp.', value: fDash?.pendingInspections ?? 0, color: '#8b5cf6' },
          ]}
        />
      ),
      stat: money(fDash?.totalExpenses ?? 0),
      statLabel: 'Field Expenses',
    },
    {
      name: 'Government Compliance',
      icon: <Scale size={20} />,
      page: 'Government Compliance.Tax Management',
      color: MODULE_COLORS['Government Compliance'],
      kpis: [
        { label: 'Obligations', value: num(cDash?.obligations ?? complianceStore.obligations.length) },
        { label: 'Due Now', value: num(cDash?.due ?? 0) },
        { label: 'Overdue', value: num(cDash?.overdue ?? 0) },
      ],
      chart: (
        <Bars
          data={[
            { label: 'Filed', value: cDash?.filed ?? 0, color: '#10b981' },
            { label: 'Due', value: cDash?.due ?? 0, color: '#f59e0b' },
            { label: 'Ovrdue', value: cDash?.overdue ?? 0, color: '#e11d48' },
          ]}
        />
      ),
      stat: money(cDash?.totalDue ?? 0),
      statLabel: 'Tax Due',
    },
    {
      name: 'Projects',
      icon: <Hammer size={20} />,
      page: 'Projects.Projects',
      color: MODULE_COLORS.Projects,
      kpis: [
        { label: 'Projects', value: num(projects.length) },
        { label: 'Active', value: num(activeProjects) },
        { label: 'Tasks', value: num(tasks.length) },
      ],
      chart: (
        <Donut
          segments={[
            { value: activeProjects, color: '#6366f1' },
            { value: projects.filter((p) => p.status === 'Completed').length, color: '#10b981' },
            { value: projects.filter((p) => p.status === 'OnHold' || p.status === 'Planning').length, color: '#f59e0b' },
          ]}
        />
      ),
      stat: money(projectBudget),
      statLabel: 'Budget',
    },
    {
      name: 'Administration',
      icon: <Settings size={20} />,
      page: 'Administration.Users',
      color: MODULE_COLORS.Administration,
      kpis: [
        { label: 'Users', value: num(aDash?.users ?? adminStore.users.length) },
        { label: 'Roles', value: num(aDash?.roles ?? adminStore.roles.length) },
        { label: 'Branches', value: num(aDash?.activeBranches ?? adminStore.branches.length) },
      ],
      chart: (
        <Bars
          data={[
            { label: 'Users', value: aDash?.users ?? 0, color: '#64748b' },
            { label: 'Roles', value: aDash?.roles ?? 0, color: '#0ea5e9' },
            { label: 'WF', value: aDash?.activeWorkflows ?? 0, color: '#10b981' },
          ]}
        />
      ),
      stat: num(aDash?.permissions ?? 0),
      statLabel: 'Permissions',
      sub: `${num(aDash?.activeUsers ?? 0)} active users · ${num(aDash?.activeWorkflows ?? 0)} workflows`,
    },
  ];

  const pulse = [
    { label: 'Open Sales', value: num(unpaidInvoices), color: '#22d3ee', icon: <HandCoins size={14} /> },
    { label: 'Overdue AR', value: num(overdueInvoices), color: '#f87171', icon: <AlertTriangle size={14} /> },
    { label: 'Open POs', value: num(openOrders), color: '#fbbf24', icon: <Truck size={14} /> },
    { label: 'Bank Txns', value: num(transactions.length), color: '#34d399', icon: <Landmark size={14} /> },
    { label: 'Leave Pending', value: num(pendingLeave), color: '#f472b6', icon: <Users size={14} /> },
    { label: 'Low Stock Items', value: num(lowStock), color: '#f87171', icon: <Boxes size={14} /> },
  ];

  return (
    <div className="space-y-5 font-sans select-none">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Billing & Financial Dashboard</h1>
          <p className="text-xs text-[#c3d3e5] mt-1 flex items-center gap-2">
            <Globe2 size={12} className="text-[#55d8c5]" />
            Accounts receivable · accounts payable · bank summary · {today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a3054] border border-[#2e4a74] text-[10px] text-[#c3d3e5]">
            <Building2 size={12} className="text-[#55d8c5]" /> {num(accounts.length)} accounts
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a3054] border border-[#2e4a74] text-[10px] text-[#c3d3e5]">
            <ShieldCheck size={12} className="text-[#55d8c5]" /> {num(entries.length)} entries
          </span>
          {loading && (
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#22395c] border border-[#2e4a74] text-[10px] text-[#dce7f2] uppercase tracking-widest">
              <svg className="animate-spin h-3 w-3 text-[#55d8c5]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
              Syncing
            </span>
          )}
        </div>
      </div>

      {/* Scorecard strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {scorecards.map((k) => (
          <div key={k.label} className="relative bg-[#1a3054] border border-[#2e4a74] rounded-2xl p-4 overflow-hidden group hover:border-[#55d8c5]/50 hover:-translate-y-0.5 transition-all">
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
            <div className="flex items-start justify-between mb-2">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${k.color}22`, color: k.color, border: `1px solid ${k.color}44` }}
              >
                {k.icon}
              </span>
              <span
                className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: `${k.color}1a`, color: k.color }}
              >
                {k.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(k.trend)}%
              </span>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-[#d3e0ee] uppercase tracking-widest mb-0.5">{k.label}</p>
                <p className="text-lg font-bold text-white truncate">{k.value}</p>
              </div>
              <Sparkline points={k.pts} color={k.color} width={48} height={26} />
            </div>
          </div>
        ))}
      </div>

      {/* AR / AP aging + bank summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aging by due period */}
        <div className="lg:col-span-2 bg-[#1a3054] border border-[#2e4a74] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#55d8c5] shadow-[0_0_8px_rgba(85,216,197,0.8)]" /> Aging by Due Period
            </h3>
            <span className="text-[10px] text-[#9db3cd] uppercase tracking-widest">Invoices vs Bills</span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#c3d3e5]"><span className="w-2.5 h-2.5 rounded-sm bg-[#22d3ee]" /> AR Receivables</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#c3d3e5]"><span className="w-2.5 h-2.5 rounded-sm bg-[#fbbf24]" /> AP Payables</span>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-[#9db3cd]">
              <AlertTriangle size={11} className="text-[#f87171]" /> {num(overdueInvoices)} overdue invoices
            </span>
          </div>
          <AgingBars ar={arAging} ap={apAging} />
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-[#1e3a61] border border-[#2e4a74] rounded-xl p-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#d3e0ee] uppercase tracking-wider">AR Overdue</span>
              <span className="text-sm font-bold text-[#22d3ee]">{money(arOverdueTotal)}</span>
            </div>
            <div className="bg-[#1e3a61] border border-[#2e4a74] rounded-xl p-3 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[#d3e0ee] uppercase tracking-wider">AP Overdue</span>
              <span className="text-sm font-bold text-[#fbbf24]">{money(apOverdueTotal)}</span>
            </div>
          </div>
        </div>

        {/* Bank summary */}
        <div className="bg-[#1a3054] border border-[#2e4a74] rounded-2xl p-5 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Bank Summary
          </h3>
          <span className="text-[10px] text-[#9db3cd] uppercase tracking-widest mb-3">Available cash vs bills due</span>
          <div className="space-y-2 flex-1">
            {bankAccounts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-[#1e3a61] border border-[#2e4a74] rounded-lg px-3 py-2">
                <span className="text-[11px] text-[#c3d3e5] truncate flex items-center gap-2">
                  <Landmark size={12} className="text-[#55d8c5] shrink-0" /> {a.name || a.bankName || 'Bank account'}
                </span>
                <span className="text-xs font-bold text-white font-mono">{money(a.balance ?? a.openingBalance ?? 0)}</span>
              </div>
            ))}
            {bankAccounts.length === 0 && (
              <p className="text-[11px] text-[#9db3cd] text-center py-4">No bank accounts configured.</p>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-[#1e3a61] border border-[#2e4a74] rounded-xl p-3">
              <span className="text-[9px] font-semibold text-[#d3e0ee] uppercase tracking-wider block">Bank & Cash</span>
              <span className="text-base font-bold text-[#34d399]">{money(bankAndCash)}</span>
            </div>
            <div className="bg-[#1e3a61] border border-[#2e4a74] rounded-xl p-3">
              <span className="text-[9px] font-semibold text-[#d3e0ee] uppercase tracking-wider block">Bills Due</span>
              <span className="text-base font-bold text-[#fbbf24]">{money(totalBillsDue)}</span>
            </div>
          </div>
          <div className="mt-3 rounded-xl p-3 border" style={{ background: bankAndCash >= totalBillsDue ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', borderColor: bankAndCash >= totalBillsDue ? '#34d39966' : '#f8717166' }}>
            <span className="text-[9px] font-semibold uppercase tracking-wider block" style={{ color: bankAndCash >= totalBillsDue ? '#34d399' : '#f87171' }}>
              {bankAndCash >= totalBillsDue ? 'Adequate to cover bills' : 'Coverage shortfall'}
            </span>
            <span className="text-xs text-[#c3d3e5]">Available cash covers <b className="text-white">{(bankAndCash / (totalBillsDue || 1)) * 100 >= 0 ? Math.min((bankAndCash / (totalBillsDue || 1)) * 100, 999).toFixed(0) : 0}%</b> of outstanding bills.</span>
          </div>
        </div>
      </div>

      {/* Unpaid invoices & bills tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Unpaid invoices */}
        <div className="bg-[#1a3054] border border-[#2e4a74] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Receipt size={14} className="text-[#22d3ee]" /> Unpaid Invoices
            </h3>
            <button onClick={() => setPage('Sales & Customers.Sales Workspace')} className="inline-flex items-center gap-1 text-[10px] text-[#55d8c5] hover:underline uppercase tracking-wider">
              View all <ArrowUpRight size={11} />
            </button>
          </div>
          {openInvoices.length === 0 ? (
            <p className="text-[11px] text-[#9db3cd] text-center py-6">No outstanding invoices.</p>
          ) : (
            <div className="max-h-56 overflow-auto">
              <table className="w-full text-left">
                <thead className="text-[9px] text-[#9db3cd] uppercase tracking-wider border-b border-[#2e4a74]">
                  <tr>
                    <th className="py-1.5 pr-2">Number</th>
                    <th className="py-1.5 pr-2">Customer</th>
                    <th className="py-1.5 pr-2">Due Date</th>
                    <th className="py-1.5 pr-2">Amount Due</th>
                    <th className="py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {openInvoices.slice(0, 8).map((i) => {
                    const overdue = new Date(i.dueDate).getTime() < Date.now();
                    return (
                      <tr key={i.id} className="border-b border-[#2e4a74]/50">
                        <td className="py-1.5 pr-2 text-white font-mono">{i.invoiceNumber}</td>
                        <td className="py-1.5 pr-2 text-[#c3d3e5] truncate max-w-[110px]">{i.customerName || '—'}</td>
                        <td className="py-1.5 pr-2 text-[#c3d3e5]">{fmtDate(i.dueDate)}</td>
                        <td className="py-1.5 pr-2 text-white font-mono font-semibold">{money(i.amountDue)}</td>
                        <td className="py-1.5">
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ color: overdue ? '#f87171' : STATUS_COLORS[i.status] || '#22d3ee', background: `${overdue ? '#f87171' : STATUS_COLORS[i.status] || '#22d3ee'}1a` }}
                          >
                            {overdue && <AlertTriangle size={9} />} {overdue ? 'Overdue' : i.status || 'Open'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Unpaid bills */}
        <div className="bg-[#1a3054] border border-[#2e4a74] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <FileText size={14} className="text-[#fbbf24]" /> Unpaid Bills
            </h3>
            <button onClick={() => setPage('Procurement.Procurement Workspace')} className="inline-flex items-center gap-1 text-[10px] text-[#55d8c5] hover:underline uppercase tracking-wider">
              View all <ArrowUpRight size={11} />
            </button>
          </div>
          {unpaidBillsArr.length === 0 ? (
            <p className="text-[11px] text-[#9db3cd] text-center py-6">No outstanding bills.</p>
          ) : (
            <div className="max-h-56 overflow-auto">
              <table className="w-full text-left">
                <thead className="text-[9px] text-[#9db3cd] uppercase tracking-wider border-b border-[#2e4a74]">
                  <tr>
                    <th className="py-1.5 pr-2">Number</th>
                    <th className="py-1.5 pr-2">Vendor</th>
                    <th className="py-1.5 pr-2">Due Date</th>
                    <th className="py-1.5 pr-2">Amount Due</th>
                    <th className="py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[11px]">
                  {unpaidBillsArr.slice(0, 8).map((b: any) => {
                    const due = b.amountDue ?? ((b.totalAmount ?? b.total ?? 0) - (b.amountPaid ?? 0));
                    const overdue = new Date(b.dueDate).getTime() < Date.now();
                    return (
                      <tr key={b.id || b.billNumber} className="border-b border-[#2e4a74]/50">
                        <td className="py-1.5 pr-2 text-white font-mono">{b.billNumber || b.number || '—'}</td>
                        <td className="py-1.5 pr-2 text-[#c3d3e5] truncate max-w-[110px]">{b.vendorName || '—'}</td>
                        <td className="py-1.5 pr-2 text-[#c3d3e5]">{fmtDate(b.dueDate)}</td>
                        <td className="py-1.5 pr-2 text-white font-mono font-semibold">{money(due)}</td>
                        <td className="py-1.5">
                          <span
                            className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{ color: overdue ? '#f87171' : STATUS_COLORS[b.status] || '#fbbf24', background: `${overdue ? '#f87171' : STATUS_COLORS[b.status] || '#fbbf24'}1a` }}
                          >
                            {overdue && <AlertTriangle size={9} />} {overdue ? 'Overdue' : b.status || 'Open'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Accounting equation banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Assets', value: money(totalAssets), color: '#22d3ee' },
          { label: 'Total Liabilities', value: money(totalLiabilities), color: '#f87171' },
          { label: 'Total Equity', value: money(totalEquity), color: '#34d399' },
          { label: 'Net Income', value: money(netIncome), color: '#a78bfa' },
        ].map((x) => (
          <div key={x.label} className="bg-[#1a3054] border border-[#2e4a74] rounded-2xl p-4 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#d3e0ee] uppercase tracking-widest">{x.label}</span>
            <span className="text-base font-bold" style={{ color: x.color }}>{x.value}</span>
          </div>
        ))}
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modules.map((m) => (
          <button
            key={m.name}
            onClick={() => setPage(m.page)}
            className="group relative text-left bg-[#1a3054] border border-[#2e4a74] rounded-2xl p-5 hover:border-[#55d8c5]/50 transition-all cursor-pointer overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(10,20,40,0.8)]"
          >
            <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl opacity-80 group-hover:opacity-100 transition-opacity" style={{ background: m.color }} />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}44`, boxShadow: `0 0 18px ${m.color}26` }}
                >
                  {m.icon}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">{m.name}</h3>
                  <span className="text-[10px] text-[#9db3cd] group-hover:text-[#55d8c5] transition-colors inline-flex items-center gap-1">
                    Open module <ArrowUpRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex-1 space-y-2">
                {m.kpis.map((k) => (
                  <div key={k.label} className="flex items-center justify-between border-b border-[#2e4a74]/70 pb-1">
                    <span className="text-[10px] font-medium text-[#c3d3e5] uppercase tracking-wider">{k.label}</span>
                    <strong className="text-sm text-white font-mono">{k.value}</strong>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center gap-1">
                {m.chart}
                <span className="text-[10px] text-[#9db3cd] uppercase tracking-widest">{m.statLabel}</span>
                <span className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.stat}</span>
              </div>
            </div>
            {'sub' in m && m.sub && (
              <div className="mt-3 pt-2 border-t border-[#2e4a74]/70 text-[10px] text-[#9db3cd] leading-snug">{m.sub}</div>
            )}
          </button>
        ))}
      </div>

      {/* Cross-module summary strip */}
      <div className="bg-[#1a3054] border border-[#2e4a74] rounded-2xl p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#55d8c5] shadow-[0_0_8px_rgba(85,216,197,0.8)]" /> Operational Pulse
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {pulse.map((x) => (
            <div key={x.label} className="bg-[#1e3a61] border border-[#2e4a74] rounded-xl p-3 text-center hover:border-[#55d8c5]/50 transition-colors">
              <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider mb-1" style={{ color: x.color }}>
                {x.icon} {x.label}
              </div>
              <p className="text-xl font-bold font-mono text-white">{x.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}