import { useEffect } from 'react';
import { ModuleSummaryLayout, SummaryPanel } from '@/components/module-summary-layout';
import {
  Users, ShoppingCart, Landmark, Scale, Boxes, Wallet, TrendingUp,
  AlertTriangle, Receipt, FileText, ArrowUpRight, Package, Warehouse,
  Banknote, HandCoins, Building2, Layers, ClipboardList, CalendarCheck2,
} from 'lucide-react';
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

const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const num = (n: number) => new Intl.NumberFormat('en-US').format(n || 0);

function SectionLink({ label, page, setPage }: { label: string; page: string; setPage?: (p: string) => void }) {
  return (
    <button
      onClick={() => setPage?.(page)}
      disabled={!setPage}
      className="w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm hover:bg-muted/40 transition-colors cursor-pointer disabled:cursor-default"
    >
      <span className="font-medium">• {label}</span>
      <span className="text-primary inline-flex items-center gap-1">Open <ArrowUpRight className="h-3.5 w-3.5" /></span>
    </button>
  );
}

// ── Sales & Customers ─────────────────────────────────────────────────────────
export function SalesSummaryView({ activeEntityId, setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const sales = useSalesStore();
  const customers = useCustomersStore();
  const products = useProductsStore();
  useEffect(() => {
    Promise.all([
      sales.fetchAllSales(activeEntityId),
      customers.fetchCustomers(activeEntityId),
      products.fetchProducts(activeEntityId),
    ]).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntityId]);

  const { invoices, estimates, receipts } = sales;
  const totalInvoiced = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const collected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const outstanding = invoices.reduce((s, i) => s + ((i.amountDue ?? (i.totalAmount - (i.paidAmount || 0))) || 0), 0);
  const openInvoices = invoices.filter((i) => (i.amountDue ?? 0) > 0).length;
  const receiptTotal = receipts.reduce((s, r) => s + (r.amount || 0), 0);
  const activeCustomers = customers.customers.filter((c) => String(c.status) === 'Active').length;

  return (
    <ModuleSummaryLayout
      title="Sales & Customers"
      description="Customer profiles, invoicing, estimates & quotes, and collections"
      stats={[
        { icon: Users, label: 'Customers', value: customers.customers.length, tone: 'teal' },
        { icon: TrendingUp, label: 'Invoiced', value: money(totalInvoiced), tone: 'blue' },
        { icon: Banknote, label: 'Collected', value: money(collected), tone: 'green' },
        { icon: HandCoins, label: 'Open Invoices', value: openInvoices, tone: 'amber' },
      ]}
    >
      <SummaryPanel icon={Wallet} title="Sales Position">
        <div className="space-y-2">
          {[
            { label: 'Total Invoiced', value: money(totalInvoiced) },
            { label: 'Collected', value: money(collected) },
            { label: 'Outstanding AR', value: money(outstanding) },
            { label: 'Receipts Posted', value: money(receiptTotal) },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between border rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-mono font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </SummaryPanel>
      <SummaryPanel icon={Receipt} title="Activity & Navigation">
        <div className="space-y-1.5">
          {[
            { label: 'Customers', page: 'Sales & Customers.Customers' },
            { label: 'Products & Services', page: 'Sales & Customers.Products & Services' },
            { label: 'Sales Workspace', page: 'Sales & Customers.Sales Workspace' },
            { label: 'Estimates & Quotes', page: 'Sales & Customers.Estimates & Quotes' },
            { label: 'Sales Orders', page: 'Sales & Customers.Sales Orders' },
            { label: 'Credit Notes', page: 'Sales & Customers.Credit Notes' },
            { label: 'Customer Payments', page: 'Sales & Customers.Customer Payments' },
            { label: 'Sales Reports', page: 'Sales & Customers.Sales Reports' },
          ].map((s) => <SectionLink key={s.page} label={s.label} page={s.page} setPage={setPage} />)}
          <p className="text-xs text-muted-foreground pt-1">
            {num(activeCustomers)} active customers · {num(estimates.length)} estimates · {num(invoices.length)} invoices · {num(products.products.length)} products
          </p>
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
  );
}

// ── Procurement ───────────────────────────────────────────────────────────────
export function ProcurementSummaryView({ activeEntityId, setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const proc = useProcurementStore();
  const vendors = useVendorsStore();
  useEffect(() => {
    Promise.all([proc.fetchAllProcurement(activeEntityId), vendors.fetchVendors(activeEntityId)]).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEntityId]);

  const { orders, bills, requests, grns } = proc;
  const billTotal = bills.reduce((s, b: any) => s + (b.totalAmount || b.total || 0), 0);
  const orderValue = orders.reduce((s, o: any) => s + (o.totalAmount || o.total || 0), 0);
  const openOrders = orders.filter((o: any) => ['Open', 'Pending', 'Approved'].includes(o.status)).length;
  const openRequests = requests.filter((r) => !['Closed', 'Approved'].includes(r.status)).length;
  const paidBills = bills.filter((b: any) => b.status === 'Paid').length;

  return (
    <ModuleSummaryLayout
      title="Procurement"
      description="Purchase requests, purchase orders, goods receipts, and vendor bills"
      stats={[
        { icon: ShoppingCart, label: 'Vendors', value: vendors.vendors.length, tone: 'teal' },
        { icon: FileText, label: 'Total Bills', value: money(billTotal), tone: 'blue' },
        { icon: TrendingUp, label: 'PO Value', value: money(orderValue), tone: 'green' },
        { icon: ClipboardList, label: 'Open POs', value: openOrders, tone: 'amber' },
      ]}
    >
      <SummaryPanel icon={Wallet} title="Spend Position">
        <div className="space-y-2">
          {[
            { label: 'Purchase Order Value', value: money(orderValue) },
            { label: 'Vendor Bill Total', value: money(billTotal) },
            { label: 'Bills Paid', value: `${paidBills} / ${bills.length}` },
            { label: 'Goods Received (GRN)', value: grns.length },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between border rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-mono font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </SummaryPanel>
      <SummaryPanel icon={FileText} title="Activity & Navigation">
        <div className="space-y-1.5">
          {[
            { label: 'Vendors', page: 'Procurement.Vendors' },
            { label: 'Procurement Workspace', page: 'Procurement.Procurement Workspace' },
            { label: 'Bills', page: 'Procurement.Bills' },
            { label: 'Vendor Payments', page: 'Procurement.Vendor Payments' },
            { label: 'Payables Aging', page: 'Procurement.Payables Aging' },
            { label: 'Expense Claims', page: 'Procurement.Expense Claims' },
            { label: 'Purchase Reports', page: 'Procurement.Purchase Reports' },
          ].map((s) => <SectionLink key={s.page} label={s.label} page={s.page} setPage={setPage} />)}
          <p className="text-xs text-muted-foreground pt-1">
            {num(openRequests)} open requests · {num(orders.length)} purchase orders · {num(bills.length)} bills
          </p>
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
  );
}

// ── Banking & Payments ────────────────────────────────────────────────────────
export function BankingSummaryView({ activeEntityId, setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const banking = useBankingStore();
  useEffect(() => { banking.fetchAllBanking(activeEntityId); }, [activeEntityId]);

  const { bankAccounts, cashAccounts, transactions, transfers } = banking;
  const bankTotal = bankAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const cashTotal = cashAccounts.reduce((s, a) => s + (a.balance ?? a.openingBalance ?? 0), 0);
  const activeBank = bankAccounts.filter((a) => a.status === 'Active').length;
  const transferTotal = transfers.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <ModuleSummaryLayout
      title="Banking & Payments"
      description="Bank accounts, cash registers, transactions, reconciliation, and fund transfers"
      stats={[
        { icon: Landmark, label: 'Bank Accounts', value: bankAccounts.length, tone: 'teal' },
        { icon: Banknote, label: 'Bank Balance', value: money(bankTotal), tone: 'blue' },
        { icon: Wallet, label: 'Cash Registers', value: cashAccounts.length, tone: 'green' },
        { icon: TrendingUp, label: 'Transactions', value: transactions.length, tone: 'amber' },
      ]}
    >
      <SummaryPanel icon={Wallet} title="Liquidity Position">
        <div className="space-y-2">
          {[
            { label: 'Bank Balance', value: money(bankTotal) },
            { label: 'Cash Registers', value: money(cashTotal) },
            { label: 'Total Liquid', value: money(bankTotal + cashTotal) },
            { label: 'Fund Transfers', value: `${transfers.length} · ${money(transferTotal)}` },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between border rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-mono font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </SummaryPanel>
      <SummaryPanel icon={Landmark} title="Activity & Navigation">
        <div className="space-y-1.5">
          {[
            { label: 'Bank Accounts', page: 'Banking & Payments.Bank Accounts' },
            { label: 'Cash Accounts', page: 'Banking & Payments.Cash Accounts' },
            { label: 'Transactions', page: 'Banking & Payments.Transactions' },
            { label: 'Bank Reconciliation', page: 'Banking & Payments.Bank Reconciliation' },
            { label: 'Fund Transfers', page: 'Banking & Payments.Fund Transfers' },
            { label: 'Cash Flow Statements', page: 'Banking & Payments.Cash Flow Statements' },
          ].map((s) => <SectionLink key={s.page} label={s.label} page={s.page} setPage={setPage} />)}
          <p className="text-xs text-muted-foreground pt-1">
            {num(activeBank)} active bank accounts · {num(cashAccounts.length)} cash registers
          </p>
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
  );
}

// ── Accounting ────────────────────────────────────────────────────────────────
export function AccountingSummaryView({ accounts, entries, setPage, openCreateAccount }: {
  accounts: { code: string; name: string; type: string; openingBalance: number; status?: string }[];
  entries: { id: string; status?: string }[];
  setPage?: (p: string) => void;
  openCreateAccount?: () => void;
}) {
  const totalAssets = accounts.filter((a) => a.type === 'Asset').reduce((s, a) => s + a.openingBalance, 0);
  const totalLiabilities = accounts.filter((a) => a.type === 'Liability').reduce((s, a) => s + a.openingBalance, 0);
  const totalEquity = accounts.filter((a) => a.type === 'Equity').reduce((s, a) => s + a.openingBalance, 0);
  const totalRevenue = accounts.filter((a) => a.type === 'Revenue' || a.type === 'ContraRevenue').reduce((s, a) => s + a.openingBalance, 0);
  const totalExpense = accounts.filter((a) => a.type === 'Expense' || a.type === 'ContraExpense').reduce((s, a) => s + a.openingBalance, 0);
  const countBy = (t: string) => accounts.filter((a) => a.type === t && a.status !== 'Inactive').length;

  return (
    <ModuleSummaryLayout
      title="Accounting"
      description="Chart of accounts, journals, ledgers, tax accounting, budgets, and financial reporting"
      stats={[
        { icon: Scale, label: 'Asset Accounts', value: countBy('Asset'), tone: 'teal' },
        { icon: Building2, label: 'Liability Accounts', value: countBy('Liability'), tone: 'blue' },
        { icon: Layers, label: 'Equity Accounts', value: countBy('Equity'), tone: 'violet' },
        { icon: ClipboardList, label: 'Journal Entries', value: entries.length, tone: 'cyan' },
      ]}
    >
      <SummaryPanel icon={Wallet} title="Financial Position">
        <div className="space-y-2">
          {[
            { label: 'Total Assets', value: money(totalAssets) },
            { label: 'Total Liabilities', value: money(totalLiabilities) },
            { label: 'Total Equity', value: money(totalEquity) },
            { label: 'Revenue vs Expense', value: `${money(totalRevenue)} / ${money(totalExpense)}` },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between border rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-mono font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </SummaryPanel>
      <SummaryPanel icon={Scale} title="Activity & Navigation">
        <div className="space-y-1.5">
          {openCreateAccount && (
            <button onClick={openCreateAccount} className="w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm hover:bg-muted/40 transition-colors cursor-pointer">
              <span className="font-medium">• New Account Code</span>
              <span className="text-primary">Create →</span>
            </button>
          )}
          {[
            { label: 'Chart of Accounts', page: 'Accounting.Chart of Accounts' },
            { label: 'Journal Entries', page: 'Accounting.Journal Entries' },
            { label: 'Fixed Assets', page: 'Accounting.Fixed Assets' },
            { label: 'General Ledger', page: 'Accounting.General Ledger' },
            { label: 'Accounts Receivable', page: 'Accounting.Accounts Receivable' },
            { label: 'Accounts Payable', page: 'Accounting.Accounts Payable' },
            { label: 'Tax Accounting', page: 'Accounting.Tax Accounting' },
            { label: 'Budgets', page: 'Accounting.Budgets' },
            { label: 'Financial Reports', page: 'Accounting.Financial Reports' },
            { label: 'Period Closing', page: 'Accounting.Period Closing' },
            { label: 'Audit Trail', page: 'Accounting.Audit Trail' },
          ].map((s) => <SectionLink key={s.page} label={s.label} page={s.page} setPage={setPage} />)}
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
  );
}

// ── Assets & Inventory ────────────────────────────────────────────────────────
export function AssetsInventorySummaryView({ activeEntityId, setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const store = useAssetsInventoryStore();
  useEffect(() => { store.fetchAllAssetsInventory(activeEntityId); }, [activeEntityId]);

  const { assets, warehouses, stockLevels, stockTransactions } = store;
  const bookValue = assets.reduce((s, a) => s + (a.bookValue ?? 0), 0);
  const costValue = assets.reduce((s, a) => s + (a.cost ?? 0), 0);
  const accDep = assets.reduce((s, a) => s + (a.accumulatedDepreciation ?? 0), 0);
  const stockValue = stockLevels.reduce((s, l) => s + (l.quantityOnHand || 0) * (l.unitCost || 0), 0);
  const lowStock = stockLevels.filter((l) => (l.availableQuantity ?? l.quantityOnHand) <= (l.reorderPoint || 0)).length;
  const activeAssets = assets.filter((a) => a.status === 'Active').length;

  return (
    <ModuleSummaryLayout
      title="Assets & Inventory"
      description="Fixed assets, depreciation, warehouses, stock levels, and valuation"
      stats={[
        { icon: Boxes, label: 'Fixed Assets', value: assets.length, tone: 'teal' },
        { icon: Warehouse, label: 'Warehouses', value: warehouses.length, tone: 'blue' },
        { icon: Package, label: 'Stock Items', value: stockLevels.length, tone: 'green' },
        { icon: AlertTriangle, label: 'Low Stock', value: lowStock, tone: 'red' },
      ]}
    >
      <SummaryPanel icon={Wallet} title="Asset & Stock Position">
        <div className="space-y-2">
          {[
            { label: 'Asset Cost', value: money(costValue) },
            { label: 'Accumulated Depreciation', value: money(accDep) },
            { label: 'Net Book Value', value: money(bookValue) },
            { label: 'Inventory Value', value: money(stockValue) },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between border rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-mono font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </SummaryPanel>
      <SummaryPanel icon={Boxes} title="Activity & Navigation">
        <div className="space-y-1.5">
          {[
            { label: 'Assets & Inventory Workspace', page: 'Assets & Inventory.Assets & Inventory Workspace' },
            { label: 'Depreciation Schedule', page: 'Assets & Inventory.Depreciation Schedule' },
            { label: 'Valuation Reports', page: 'Assets & Inventory.Valuation Reports' },
          ].map((s) => <SectionLink key={s.page} label={s.label} page={s.page} setPage={setPage} />)}
          <p className="text-xs text-muted-foreground pt-1">
            {num(activeAssets)} active assets · {num(warehouses.length)} warehouses · {num(stockTransactions.length)} stock transactions
          </p>
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
  );
}

// ── Payroll & HR ──────────────────────────────────────────────────────────────
export function PayrollSummaryView({ setPage }: { activeEntityId?: string; setPage?: (p: string) => void }) {
  const payroll = usePayrollStore();
  useEffect(() => { payroll.fetchAll(); }, []);

  const { employees, departments, positions, payruns, salarySlips, leaveRequests } = payroll;
  const activeEmployees = employees.filter((e) => e.status === 'Active').length;
  const totalBasic = employees.reduce((s, e) => s + (e.basicSalary || 0), 0);
  const totalNetPay = salarySlips.reduce((s, sl) => s + (sl.netPay || 0), 0);
  const pendingLeave = leaveRequests.filter((l) => l.status === 'Pending').length;
  const postedPayruns = payruns.filter((p) => p.status === 'Posted').length;

  return (
    <ModuleSummaryLayout
      title="Payroll & HR"
      description="Employees, attendance, leave, payroll processing, salary slips, and loans"
      stats={[
        { icon: Users, label: 'Employees', value: employees.length, tone: 'teal' },
        { icon: CalendarCheck2, label: 'Active', value: activeEmployees, tone: 'blue' },
        { icon: Wallet, label: 'Gross Payroll', value: money(totalBasic), tone: 'green' },
        { icon: AlertTriangle, label: 'Pending Leave', value: pendingLeave, tone: 'amber' },
      ]}
    >
      <SummaryPanel icon={Wallet} title="Payroll Position">
        <div className="space-y-2">
          {[
            { label: 'Departments', value: departments.length },
            { label: 'Positions', value: positions.length },
            { label: 'Net Pay Posted', value: money(totalNetPay) },
            { label: 'Payruns', value: `${postedPayruns} posted / ${payruns.length} total` },
          ].map((r) => (
            <div key={r.label} className="flex items-center justify-between border rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-mono font-medium">{r.value}</span>
            </div>
          ))}
        </div>
      </SummaryPanel>
      <SummaryPanel icon={Users} title="Activity & Navigation">
        <div className="space-y-1.5">
          {[
            { label: 'Employees', page: 'Payroll & HR.Employees' },
            { label: 'Attendance', page: 'Payroll & HR.Attendance' },
            { label: 'Leave', page: 'Payroll & HR.Leave' },
            { label: 'Payroll', page: 'Payroll & HR.Payroll' },
            { label: 'Salary', page: 'Payroll & HR.Salary' },
            { label: 'Loans & Advances', page: 'Payroll & HR.Loans & Advances' },
            { label: 'HR Reports', page: 'Payroll & HR.HR Reports' },
          ].map((s) => <SectionLink key={s.page} label={s.label} page={s.page} setPage={setPage} />)}
          <p className="text-xs text-muted-foreground pt-1">
            {num(activeEmployees)} active employees · {num(salarySlips.length)} salary slips · {num(leaveRequests.length)} leave requests
          </p>
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
  );
}