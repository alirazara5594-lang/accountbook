import React from 'react';
import { ModuleSummaryLayout, SummaryPanel } from '@/components/module-summary-layout';
import { money } from '@/lib/currency';
import { Users, ShoppingBag, Landmark, Scale, Boxes, Wallet, Sparkles, Settings2 } from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  openingBalance: number;
  status: string;
  reconciliationEnabled: boolean;
}

interface Journal {
  id: string;
  description: string;
  reference: string;
  date: string;
  lines: any[];
}

interface ModuleSummaryProps {
  moduleName: string;
  accounts: Account[];
  entries: Journal[];
  setPage: (page: string) => void;
  openCreateAccount: () => void;
}

const formatCurrency = (val: number) => {
  return money(val);
};

const MODULE_META: Record<string, { icon: React.ComponentType<{ className?: string }> }> = {
  'Sales & Customers': { icon: Users },
  'Procurement': { icon: ShoppingBag },
  'Banking & Payments': { icon: Landmark },
  'Accounting': { icon: Scale },
  'Assets & Inventory': { icon: Boxes },
  'Payroll & HR': { icon: Wallet },
  'AI & Analytics': { icon: Sparkles },
  'Administration': { icon: Settings2 },
};

export const ModuleSummary: React.FC<ModuleSummaryProps> = ({
  moduleName,
  accounts,
  entries,
  setPage,
  openCreateAccount
}) => {
  const getMetrics = () => {
    switch (moduleName) {
      case 'Sales & Customers': {
        const receivables = accounts
          .filter(a => a.code.startsWith('12') || a.name.toLowerCase().includes('receivable'))
          .reduce((s, a) => s + a.openingBalance, 0);
        const revenue = accounts
          .filter(a => a.type === 'Revenue')
          .reduce((s, a) => s + a.openingBalance, 0);
        const activeCustomers = accounts
          .filter(a => a.type === 'Asset' && a.code.startsWith('12'))
          .length;
        return {
          card1: { title: 'RECEIVABLES LEDGER', val: formatCurrency(receivables), desc: 'Outstanding balances from customers' },
          card2: { title: 'TOTAL SALES REVENUE', val: formatCurrency(revenue), desc: 'Accrued sales and customer billing' },
          card3: { title: 'ACTIVE CUSTOMERS', val: String(activeCustomers), desc: 'Approved customer profile records' }
        };
      }
      case 'Procurement': {
        const payables = accounts
          .filter(a => a.code.startsWith('21') || a.name.toLowerCase().includes('payable'))
          .reduce((s, a) => s + a.openingBalance, 0);
        const grni = accounts
          .filter(a => a.code === '22000')
          .reduce((s, a) => s + a.openingBalance, 0);
        const totalVendors = accounts
          .filter(a => a.code.startsWith('21') || a.name.toLowerCase().includes('payable'))
          .length;
        return {
          card1: { title: 'PAYABLES LEDGER', val: formatCurrency(payables), desc: 'Outstanding balance due to suppliers' },
          card2: { title: 'GRNI ACCRUALS', val: formatCurrency(grni), desc: 'Goods Received Not Invoiced accruals' },
          card3: { title: 'TOTAL VENDORS', val: String(totalVendors), desc: 'Approved vendor profile records' }
        };
      }
      case 'Banking & Payments': {
        const liquid = accounts
          .filter(a => a.code.startsWith('11') || a.reconciliationEnabled)
          .reduce((s, a) => s + a.openingBalance, 0);
        const count = accounts.filter(a => a.reconciliationEnabled && a.status === 'Active').length;
        const totalEntries = entries.filter(e => e.description.toLowerCase().includes('bank') || e.description.toLowerCase().includes('cash')).length;
        return {
          card1: { title: 'CASH & EQUIVALENTS', val: formatCurrency(liquid), desc: 'Total liquid bank & cash balances' },
          card2: { title: 'RECONCILED ACCOUNTS', val: String(count), desc: 'Active bank accounts with audit enabled' },
          card3: { title: 'BANK JOURNAL ACTIVITY', val: String(totalEntries), desc: 'Bank postings in active period' }
        };
      }
      case 'Accounting': {
        const assetsCount = accounts.filter(a => a.type === 'Asset').length;
        const liabilitiesCount = accounts.filter(a => a.type === 'Liability').length;
        const equityCount = accounts.filter(a => a.type === 'Equity').length;
        return {
          card1: { title: 'ASSET LEDGER CODES', val: String(assetsCount), desc: 'Active asset account classifications' },
          card2: { title: 'LIABILITY LEDGER CODES', val: String(liabilitiesCount), desc: 'Active liability account classifications' },
          card3: { title: 'EQUITY LEDGER CODES', val: String(equityCount), desc: 'Active equity and reserve accounts' }
        };
      }
      case 'Assets & Inventory': {
        const ppe = accounts
          .filter(a => a.code.startsWith('151') || a.name.toLowerCase().includes('equipment') || a.name.toLowerCase().includes('property'))
          .reduce((s, a) => s + a.openingBalance, 0);
        const inventory = accounts
          .filter(a => a.code === '13000' || a.name.toLowerCase().includes('inventory'))
          .reduce((s, a) => s + a.openingBalance, 0);
        const depreciation = accounts
          .filter(a => a.code === '15200' || a.name.toLowerCase().includes('depreciation'))
          .reduce((s, a) => s + a.openingBalance, 0);
        return {
          card1: { title: 'FIXED ASSETS (PPE)', val: formatCurrency(ppe), desc: 'Net book value of fixed assets' },
          card2: { title: 'INVENTORY VALUE', val: formatCurrency(inventory), desc: 'Valued balance of physical stock' },
          card3: { title: 'ACCUMULATED DEPRECIATION', val: formatCurrency(depreciation), desc: 'Accrued write-downs under IAS 16' }
        };
      }
      default: {
        return {
          card1: { title: 'ACTIVE MODULE', val: moduleName, desc: 'Selected system operational area' },
          card2: { title: 'METRIC MONITOR', val: 'Operational', desc: 'Status checks are active and running' },
          card3: { title: 'GL POSTINGS', val: String(entries.length), desc: 'System journal entries recorded' }
        };
      }
    }
  };

  const metrics = getMetrics();

  const renderWorkflows = () => {
    switch (moduleName) {
      case 'Sales & Customers':
        return [
          { label: 'Add New Customer', desc: 'Register customer contact details, tax identification numbers, and credit terms.', page: 'Sales & Customers.Customers' },
          { label: 'Sales Invoicing & Ledger', desc: 'Issue billing statements, record local VAT/sales tax, and trace balances due.', page: 'Sales & Customers.Sales Invoices' },
        ];
      case 'Procurement':
        return [
          { label: 'Add New Vendor', desc: 'Register supplier credentials, base billing currencies, and payment terms.', page: 'Procurement.Vendors' },
          { label: 'Procurement Workspace', desc: 'Generate Purchase Orders, post Goods Receipt Notes (GRN), and verify vendor invoices.', page: 'Procurement.Procurement Workspace' },
        ];
      case 'Banking & Payments':
        return [
          { label: 'Record Bank Transaction', desc: 'Record bank deposits, external transfers, or cash receipts and disbursements.', page: 'Accounting.Journal Entries' },
          { label: 'Cash Flow Statements', desc: 'Inspect the Statement of Cash Flows matching cash movements to core activities.', page: 'Accounting.Financial Reports' },
        ];
      case 'Accounting':
        return [
          { label: 'New Account Code', desc: 'Add new accounts using standard 5-digit sequences under appropriate subgroups.', page: '', openAccount: true },
          { label: 'New Journal Entry', desc: 'Post custom double-entry General Ledger transactions with balanced debits and credits.', page: 'Accounting.Journal Entries' },
          { label: 'General Ledger', desc: 'Posting-level register of all journal lines from posted entries.', page: 'Accounting.General Ledger' },
          { label: 'Accounts Receivable', desc: 'Aged customer trade receivables by due date (IFRS 9).', page: 'Accounting.Accounts Receivable' },
          { label: 'Accounts Payable', desc: 'Aged vendor trade payables by due date (IAS 37).', page: 'Accounting.Accounts Payable' },
          { label: 'Budgets', desc: 'Annual budgets by account for variance analysis against actuals.', page: 'Accounting.Budgets' },
          { label: 'Financial Reporting', desc: 'Verify compliance reporting including Balance Sheets and Profit & Loss reports.', page: 'Accounting.Financial Reports' },
          { label: 'Period Closing', desc: 'Close accounting periods to lock books against prior-period postings.', page: 'Accounting.Period Closing' },
          { label: 'Audit Trail', desc: 'Immutable event log across the ERP (IAS 8 audit evidence).', page: 'Accounting.Audit Trail' },
        ];
      case 'Assets & Inventory':
        return [
          { label: 'Inventory Workspace', desc: 'Manage physical warehousing locations, calculate values, and post adjustments.', page: 'Assets & Inventory.Assets & Inventory Workspace' },
          { label: 'Fixed Asset Register', desc: 'Record assets, trigger depreciation schedules, and manage disposal entries.', page: 'Accounting.Fixed Assets' },
        ];
      case 'Government Compliance':
        return [
          { label: 'Tax Management', desc: 'Configure tax authorities, tax codes, and rates for multi-jurisdiction compliance.', page: 'Government Compliance.Tax Management' },
          { label: 'Tax Accounting', desc: 'Multi-jurisdiction VAT, GST, Sales Tax & WHT (UK, USA, PK, EU, UAE, KSA, CA).', page: 'Government Compliance.Tax Accounting' },
        ];
      default:
        return [];
    }
  };

  const getSubList = () => {
    switch (moduleName) {
      case 'Sales & Customers':
        return ['Customers', 'Products & Services', 'Sales Invoices', 'Estimates & Quotes', 'Sales Reports'];
      case 'Procurement':
        return ['Vendors', 'Procurement Workspace', 'Bills', 'Expense Claims', 'Purchase Reports'];
      case 'Banking & Payments':
        return ['Bank Accounts', 'Cash Accounts', 'Transactions', 'Bank Reconciliation', 'Cash Flow'];
      case 'Accounting':
        return ['Chart of Accounts', 'Journal Entries', 'Fixed Assets', 'General Ledger', 'Accounts Receivable', 'Accounts Payable', 'Budgets', 'Financial Reports', 'Period Closing', 'Audit Trail'];
      case 'Assets & Inventory':
        return ['Depreciation Schedule', 'Valuation Reports'];
      default:
        return [];
    }
  };

  const subItems = getSubList();
  const workflows = renderWorkflows();
  const meta = MODULE_META[moduleName] || { icon: Scale };
  const Icon = meta.icon;

  return (
    <ModuleSummaryLayout
      title={moduleName}
      description="Module overview with key metrics, quick workflows, and direct navigation"
      stats={[
        { icon: Icon, label: metrics.card1.title, value: metrics.card1.val, tone: 'teal' },
        { icon: Icon, label: metrics.card2.title, value: metrics.card2.val, tone: 'blue' },
        { icon: Icon, label: metrics.card3.title, value: metrics.card3.val, tone: 'violet' },
        { icon: Icon, label: 'GL POSTINGS', value: entries.length, tone: 'cyan' },
      ]}
    >
      <SummaryPanel icon={Icon} title="Workflows & Actions">
        <div className="space-y-2">
          {workflows.map(w => (
            <button key={w.label} onClick={() => w.openAccount ? openCreateAccount() : setPage(w.page)} className="w-full text-left border rounded-lg p-3 hover:bg-muted/40 transition-colors cursor-pointer">
              <p className="font-medium text-sm">{w.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{w.desc}</p>
            </button>
          ))}
          {workflows.length === 0 && <p className="text-sm text-muted-foreground">Use the sub-menus in the sidebar to navigate.</p>}
        </div>
      </SummaryPanel>
      <SummaryPanel icon={Icon} title="Available Sub-sections">
        <div className="space-y-1.5">
          {subItems.map(item => (
            <button key={item} onClick={() => setPage(`${moduleName}.${item}`)} className="w-full flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors cursor-pointer">
              <span className="font-medium">• {item}</span>
              <span className="text-primary">View →</span>
            </button>
          ))}
          {subItems.length === 0 && <p className="text-sm text-muted-foreground">Navigate using the sidebar menu items.</p>}
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
  );
};
