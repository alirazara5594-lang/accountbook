import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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

function Donut({ segments, size = 72, thickness = 9 }: { segments: { value: number; color: string }[]; size?: number; thickness?: number }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2e4a74" strokeWidth={thickness} />
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
        {Math.round((total === 1 ? 0 : total) / 1)}
      </text>
    </svg>
  );
}

function Bars({ data, height = 56 }: { data: { label: string; value: number; color?: string }[]; height?: number }) {
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
          <span className="text-[7px] text-[#9db3cd] truncate w-full text-center leading-tight">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ points, color = '#34d399', width = 90, height = 24 }: { points: number[]; color?: string; width?: number; height?: number }) {
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
  const arBal = accounts.filter((a) => a.code.startsWith('12000') || a.code.startsWith('12001')).reduce((s, a) => s + Math.abs(a.openingBalance), 0);
  const apBal = accounts.filter((a) => a.code.startsWith('21000')).reduce((s, a) => s + Math.abs(a.openingBalance), 0);
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
  const openInvoices = invoices.filter((i) => (i.amountDue || 0) > 0).length;
  const receiptTotal = receipts.reduce((s, r) => s + (r.amount || 0), 0);

  // ---- Procurement derived ----
  const orderValue = orders.reduce((s, o: any) => s + (o.totalAmount || o.total || 0), 0);
  const openOrders = orders.filter((o: any) => ['Open', 'Pending', 'Approved'].includes(o.status)).length;
  const billTotal = bills.reduce((s, b: any) => s + (b.totalAmount || b.total || 0), 0);
  const paidBills = bills.filter((b: any) => b.status === 'Paid').length;

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

  const modules: {
    name: string;
    icon: string;
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
      icon: '☖',
      page: 'Sales & Customers.Sales Workspace',
      color: MODULE_COLORS['Sales & Customers'],
      kpis: [
        { label: 'Customers', value: num(customers.length) },
        { label: 'Open Invoices', value: num(openInvoices) },
        { label: 'Estimates', value: num(estimates.length) },
      ],
      chart: (
        <Bars
          data={[
            { label: 'Draft', value: invoices.filter((i) => i.status === 'Draft').length, color: '#475569' },
            { label: 'Open', value: openInvoices, color: '#0ea5e9' },
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
      icon: '⇡',
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
      icon: '🏛',
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
      stat: money(bankTotal + cashTotal),
      statLabel: 'Liquidity',
    },
    {
      name: 'Accounting',
      icon: '⌘',
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
      stat: money(totalRevenue - totalExpense),
      statLabel: 'Net Income',
    },
    {
      name: 'Assets & Inventory',
      icon: '📦',
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
      icon: '⚙️',
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
      icon: '👥',
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
      icon: '📍',
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
      icon: '⚖',
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
      icon: '🏗',
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
      icon: '⚙',
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

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#2e4a74] bg-gradient-to-br from-[#1d3454] via-[#17294a] to-[#14233f] p-7">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#55d8c5]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-[#55d8c5]/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#55d8c5] shadow-[0_0_10px_rgba(85,216,197,0.9)] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#c3d3e5]">Zenabook ERP — Command Center</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Enterprise Overview</h2>
            <p className="text-xs text-[#c3d3e5] mt-1.5 max-w-xl">Live cross-module KPIs across the entire ERP. Click any module card to drill into its submodules.</p>
          </div>
          <div className="flex items-center gap-3">
            {loading && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22395c] border border-[#2e4a74] text-[10px] text-[#dce7f2] uppercase tracking-widest">
                <svg className="animate-spin h-3 w-3 text-[#55d8c5]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                Syncing modules
              </span>
            )}
            <button
              onClick={() => setPage('Accounting.Chart of Accounts')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#55d8c5]/25 to-[#55d8c5]/15 text-[#55d8c5] border border-[#55d8c5]/40 hover:border-[#55d8c5]/70 hover:from-[#55d8c5]/35 hover:to-[#55d8c5]/25 transition-all"
            >
              Manage Accounts Tree <span className="text-[#55d8c5]">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Cash & Bank', value: money(cashBal + bankBal), color: '#34d399', pts: [12, 14, 13, 16, 18, 17, 20] },
          { label: 'Receivables', value: money(arBal), color: '#22d3ee', pts: [8, 9, 11, 10, 13, 14, 16] },
          { label: 'Payables', value: money(apBal), color: '#fbbf24', pts: [6, 7, 6, 9, 8, 10, 12] },
          { label: 'Inventory', value: money(invBal), color: '#a78bfa', pts: [10, 12, 11, 13, 12, 14, 15] },
          { label: 'Revenue', value: money(totalRevenue), color: '#4ade80', pts: [5, 7, 6, 9, 11, 10, 14] },
          { label: 'Expenses', value: money(totalExpense), color: '#f87171', pts: [4, 5, 7, 6, 8, 9, 11] },
        ].map((k) => (
          <div key={k.label} className="relative bg-[#1a3054] border border-[#2e4a74] rounded-2xl p-4 flex flex-col justify-between min-h-[100px] overflow-hidden group hover:border-[#55d8c5]/50 transition-colors">
            <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(90deg, ${k.color}99, transparent)` }} />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-[#d3e0ee] uppercase tracking-widest">{k.label}</span>
              <Sparkline points={k.pts} color={k.color} />
            </div>
            <span className="text-lg font-bold text-white mt-1">{k.value}</span>
          </div>
        ))}
      </div>

      {/* Accounting equation banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Assets', value: money(totalAssets), color: '#22d3ee' },
          { label: 'Total Liabilities', value: money(totalLiabilities), color: '#f87171' },
          { label: 'Total Equity', value: money(totalEquity), color: '#34d399' },
          { label: 'Net Income', value: money(totalRevenue - totalExpense), color: '#a78bfa' },
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
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}44`, boxShadow: `0 0 18px ${m.color}26` }}
                >
                  {m.icon}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">{m.name}</h3>
                  <span className="text-[10px] text-[#9db3cd] group-hover:text-[#55d8c5] transition-colors inline-flex items-center gap-1">
                    Open module <span className="group-hover:translate-x-0.5 transition-transform">→</span>
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
          {[
            { label: 'Open Sales', value: num(openInvoices), color: '#22d3ee' },
            { label: 'Open POs', value: num(openOrders), color: '#fbbf24' },
            { label: 'Bank Txn Today', value: num(transactions.length), color: '#34d399' },
            { label: 'Leave Pending', value: num(pendingLeave), color: '#f472b6' },
            { label: 'Active Projects', value: num(activeProjects), color: '#818cf8' },
            { label: 'Low Stock Items', value: num(lowStock), color: '#f87171' },
          ].map((x) => (
            <div key={x.label} className="bg-[#1e3a61] border border-[#2e4a74] rounded-xl p-3 text-center hover:border-[#55d8c5]/50 transition-colors">
              <p className="text-xl font-bold font-mono" style={{ color: x.color }}>{x.value}</p>
              <p className="text-[10px] font-medium text-[#d3e0ee] uppercase tracking-wider mt-0.5">{x.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}