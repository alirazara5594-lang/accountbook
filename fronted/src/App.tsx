import { useEffect, useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { Login } from './Login'
import type { UserData } from './Login'
import OnboardingWizard from './components/OnboardingWizard'
import { LogOut } from 'lucide-react'
import { authApi } from './api/modules/auth.api'
import Intercompany from './Intercompany'
import EntitySettings from './EntitySettings'
import CustomerManagement from './CustomerManagement'
import ProductsAndServices from './ProductsAndServices'
import VendorManagement from './VendorManagement'
import { ProcurementWorkspace } from './ProcurementWorkspace'
import { VendorBills } from './VendorBills'
import { FixedAssets } from './FixedAssets'
import { AssetsInventoryWorkspace } from './AssetsInventoryWorkspace'
import DepreciationRun from './DepreciationRun'
import DepreciationSchedule from './DepreciationSchedule'
import ValuationReport from './ValuationReport'
import { SalesWorkspace } from './SalesWorkspace'
import { EstimatesAndQuotes } from './EstimatesAndQuotes'
import { SalesOrdersWorkspace } from './SalesOrdersWorkspace'
import { ManufacturingWorkspace } from './ManufacturingWorkspace'
import { ChartOfAccounts } from './ChartOfAccounts'
import { FinancialReports } from './FinancialReports';
import { LeaseAccounting } from './Accounting.Leases';
import CreditNotesWorkspace from './CreditNotesWorkspace';
import CustomerPaymentsWorkspace from './CustomerPaymentsWorkspace';
import CustomerStatementsWorkspace from './CustomerStatementsWorkspace';
import CustomerAgingWorkspace from './CustomerAgingWorkspace';
import SalesReportsWorkspace from './SalesReportsWorkspace';
import VendorStatementsWorkspace from './VendorStatementsWorkspace';
import PayablesAgingWorkspace from './PayablesAgingWorkspace';
import { DebitNotes } from './DebitNotes';
import { ExpenseClaimsView } from './ExpenseClaimsView';
import { PurchaseReportsView } from './PurchaseReportsView';
import EmployeeDirectory from './EmployeeDirectory';
import AttendanceTracker from './AttendanceTracker';
import LeaveManagement from './LeaveManagement';
import PayrollProcessing from './PayrollProcessing';
import SalarySlipsView from './SalarySlipsView';
import LoansAdvancesView from './LoansAdvancesView';
import HRReportsView from './HRReportsView';
import {
  FieldOperationsSummaryView, SurveysView, FieldVisitsView, InspectionsView, WorkOrdersView, FieldExpensesView, FieldReportsView
} from './FieldOperationsViews';
import {
  ProjectsSummaryView, ProjectsListView, ProjectPlanningView, ProjectsTasksView, ProjectBudgetView, ProjectCostingView,
  ProjectsTimesheetsView, ProjectBillingView, ProjectsExpensesView, ProjectProfitabilityView, ProjectsReportsView
} from './ProjectsViews';
import {
  ComplianceSummaryView, TaxManagementView, VatSalesTaxView, WithholdingTaxView, TaxReturnsView, EInvoicingView, ComplianceReportsView
} from './ComplianceViews';
import {
  AnalyticsDashboardView, FinancialAnalyticsView, SalesAnalyticsView, ExpenseAnalyticsView, CashFlowAnalyticsView, InventoryAnalyticsView, ForecastingView, AIInsightsView
} from './AnalyticsViews';
import {
  AdministrationSummaryView, UsersView, RolesPermissionsView, CompaniesView, BranchesView, ApprovalWorkflowsView, NumberSeriesView, CurrencyView, AuditLogsView
} from './AdministrationViews';
import {
  ManufacturingSummaryView, ManufacturingWorkspaceView, BillOfMaterialsView, WorkOrdersMfgView, JobCostingView
} from './ManufacturingViews';

import { SystemAccountMapping } from './components/SystemAccountMapping'
import { ModuleSummary } from './ModuleSummary'
import { SalesSummaryView, ProcurementSummaryView, BankingSummaryView, AccountingSummaryView, AssetsInventorySummaryView, PayrollSummaryView } from './MainModuleSummaries'
import { BankAccountsView } from './BankAccountsView'
import { CashAccountsView } from './CashAccountsView'
import { BankConnectionView } from './BankConnectionView'
import { BankImportView } from './BankImportView'
import { BankTransactionsView } from './BankTransactionsView'
import { BankReconciliationView } from './BankReconciliationView'
import { FundTransfersView } from './FundTransfersView'
import { VendorPaymentsView } from './VendorPaymentsView'
import { VoucherManagement } from './VoucherManagement'
import { CashFlowView } from './CashFlowView'
import { GeneralLedgerView } from './GeneralLedgerView'
import { AccountsReceivableView } from './AccountsReceivableView'
import { AccountsPayableView } from './AccountsPayableView'
import { TaxAccountingView } from './TaxAccountingView'
import { BudgetsView } from './BudgetsView'
import { PeriodClosingView } from './PeriodClosingView'
import { AuditTrailView } from './AuditTrailView'
import { JournalEntriesView } from './JournalEntriesView'
import { useCoaStore, useJournalsStore, useCompanyStore, useIntercompanyStore } from './stores'
import { FinancialOverview } from './financial-overview/FinancialOverview'

import type { Account } from './api/modules/coa.api'
type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'ContraAsset' | 'ContraLiability' | 'ContraEquity' | 'ContraRevenue' | 'ContraExpense'
type Journal = { id: string; date: string; reference: string; description: string; status?: string; lines: { accountId: string; debit: number; credit: number }[] }
type Allocation = { id: string; name: string; sourceCompanyId: string; category: string; frequency: string; rate: number; quantity: number; status: string; recipients: { companyId: string; sharePercent: number }[] }

const accountTypes: AccountType[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'ContraAsset', 'ContraLiability', 'ContraEquity', 'ContraRevenue', 'ContraExpense']
const blank = { code: '', name: '', type: 'Asset' as AccountType, parentId: '', openingBalance: '0', reconciliationEnabled: false, ifrsTag: '', gaapTag: '', isSystem: false, subtype: '', currency: 'USD', taxCategory: '', allowManualJournal: true, description: '', status: 'Active' }

const NAVIGATION = [
  { name: 'Overview', icon: '▦', items: [] },
  { name: 'Sales & Customers', icon: '☖', items: ['Customers', 'Products & Services', 'Sales Workspace', 'Estimates & Quotes', 'Sales Orders', 'Credit Notes', 'Customer Payments', 'Customer Statements', 'Customer Aging', 'Sales Reports'] },
  { name: 'Procurement', icon: '⇡', items: ['Vendors', 'Procurement Workspace', 'Bills', 'Debit Notes', 'Expense Claims', 'Vendor Payments', 'Vendor Statements', 'Payables Aging', 'Purchase Reports'] },
  { name: 'Banking & Payments', icon: '🏛', items: ['Bank Accounts', 'Cash Accounts', 'Bank Connection', 'Bank Import', 'Transactions', 'Bank Reconciliation', 'Voucher Management', 'Fund Transfers', 'Cash Flow Statements'] },
              { name: 'Accounting', icon: '⌘', items: ['Chart of Accounts', 'Journal Entries', 'Fixed Assets', 'General Ledger', 'Accounts Receivable', 'Accounts Payable', 'Budgets', 'Financial Reports', 'Period Closing', 'Audit Trail', 'Intercompany Allocations', 'Lease Accounting'] },
  { name: 'Assets & Inventory', icon: '📦', items: ['Assets & Inventory Workspace', 'Depreciation Run', 'Depreciation Schedule', 'Valuation Reports'] },
  { name: 'Manufacturing & Production', icon: '⚙️', items: ['Manufacturing Workspace', 'Bill of Materials', 'Work Orders', 'Job Costing'] },
  { name: 'Payroll & HR', icon: '👥', items: ['Employees', 'Attendance', 'Leave', 'Payroll', 'Salary', 'Loans & Advances', 'HR Reports'] },
  { name: 'Survey & Field Operations', icon: '📍', items: ['Surveys', 'Field Visits', 'Inspections', 'Work Orders', 'Field Expenses', 'Field Reports'] },
  { name: 'Government Compliance', icon: '⚖', items: ['Tax Management', 'VAT / Sales Tax', 'Withholding Tax', 'Tax Returns', 'E-Invoicing', 'Compliance Reports'] },
  { name: 'Projects', icon: '🏗', items: ['Projects', 'Project Planning', 'Tasks', 'Project Budget', 'Project Costing', 'Timesheets', 'Project Billing', 'Project Expenses', 'Project Profitability', 'Reports'] },
  { name: 'AI & Analytics', icon: '✨', items: ['Analytics Dashboard', 'Financial Analytics', 'Sales Analytics', 'Expense Analytics', 'Cash Flow Analytics', 'Inventory Analytics', 'Forecasting', 'AI Insights'] },
  { name: 'Administration', icon: '⚙', items: ['Users', 'Roles & Permissions', 'Companies', 'Branches', 'Approval Workflows', 'System Settings', 'Chart of Accounts Mapping', 'Number Series', 'Currency', 'Tax Accounting', 'Audit Logs'] }
];

export default function App() {
  const [page, setPage] = useState<string>(() => {
    return localStorage.getItem('last_active_page') || 'Overview.Dashboard';
  });
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('open_groups');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [settingsView, setSettingsView] = useState<'home' | 'entities' | 'mappings'>('home')

  const accounts = useCoaStore((s) => s.accounts as Account[])
  const fetchAccounts = useCoaStore((s) => s.fetchAccounts)
  const saveAccountStore = useCoaStore((s) => s.saveAccount)
  const toggleAccountStatusStore = useCoaStore((s) => s.toggleAccountStatus)
  const resetDatabaseStore = useCoaStore((s) => s.resetDatabase)

  const entries = useJournalsStore((s) => s.entries as Journal[])
  const fetchJournalEntries = useJournalsStore((s) => s.fetchJournalEntries)

  const allocations = useIntercompanyStore((s) => s.allocations as Allocation[])
  const fetchAllocations = useIntercompanyStore((s) => s.fetchAllocations)

  const entities = useCompanyStore((s) => s.entities)
  const activeEntityId = useCompanyStore((s) => s.activeEntityId)
  const fetchCompanies = useCompanyStore((s) => s.fetchCompanies)
  const setActiveEntityId = useCompanyStore((s) => s.setActiveEntityId)

  const [currentUser, setCurrentUser] = useState<UserData | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      if (stored && token) {
        return JSON.parse(stored) as UserData;
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      const token = authApi.getToken();
      // Demo-mode sessions (no real JWT) are never validated against the backend.
      if (!token || token === 'demo-mode') return;
      authApi.validate().catch((err) => {
        // Only log out on an explicit auth rejection (401/403). If the backend
        // is unreachable (network error), keep the session in demo mode.
        const status = err && typeof err.status === 'number' ? err.status : 0;
        if (status >= 400 && status < 500) {
          setCurrentUser(null);
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('ab_demo_mode');
        }
      });
    }
  }, [currentUser]);

  // Track if onboarding is needed (for non-admin demo accounts)
  const needsOnboarding = (email: string) => {
    if (email === 'admin@acme.com') return false; // Admin gets instant access
    // Check if THIS user has completed onboarding
    const key = `onboarding_complete_${email}`;
    return !localStorage.getItem(key);
  };

  const handleLogin = async (userData: UserData) => {
    try {
      const response = await authApi.login({ email: userData.email, password: 'password123' });
      authApi.setToken(response.token);
      authApi.setUser({
        id: response.user.id,
        username: response.user.username,
        fullName: response.user.fullName,
        email: response.user.email,
        role: response.user.role,
      });
      setCurrentUser({
        email: userData.email,
        fullName: userData.fullName,
        role: response.user.role,
        avatar: userData.avatar,
        provider: userData.provider,
      });
      localStorage.setItem('auth_user', JSON.stringify({
        email: userData.email,
        fullName: userData.fullName,
        role: response.user.role,
        avatar: userData.avatar,
        provider: userData.provider,
      }));
      notify(`Logged in as ${userData.fullName}`);
    } catch (error) {
      // Fallback to demo mode (no backend auth)
      const user = {
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
        avatar: userData.avatar,
        provider: userData.provider,
      };
      authApi.setToken('demo-mode');
      localStorage.setItem('ab_demo_mode', 'true');
      setCurrentUser(user);
      localStorage.setItem('auth_user', JSON.stringify(user));
      notify(`Logged in as ${userData.fullName}`);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    localStorage.removeItem('ab_demo_mode');
    setCurrentUser(null);
    notify('Logged out successfully');
  };

  useEffect(() => {
    localStorage.setItem('last_active_page', page);
  }, [page]);

  useEffect(() => {
    localStorage.setItem('open_groups', JSON.stringify(openGroups));
  }, [openGroups]);

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [form, setForm] = useState(blank)
  const [toast, setToast] = useState('')
  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(''), 3500) }

  const load = async () => {
    try {
      await Promise.all([
        fetchAccounts(),
        fetchJournalEntries(),
        fetchAllocations(),
        fetchCompanies(),
      ]);
    } catch {
      notify('API unavailable. Start the backend on port 5124.');
    }
  }

  useEffect(() => { load() }, [])
  const openCreate = async () => { setEditing(null); setForm(blank); setModal(true) }
  const openEdit = (a: Account) => { setEditing(a); setForm({ code: a.code, name: a.name, type: a.type as AccountType, parentId: a.parentId || '', openingBalance: String(a.openingBalance), reconciliationEnabled: a.reconciliationEnabled, ifrsTag: a.ifrsTag || '', gaapTag: a.gaapTag || '', isSystem: a.isSystem, subtype: a.subtype || '', currency: a.currency || 'USD', taxCategory: a.taxCategory || '', allowManualJournal: a.allowManualJournal !== false, description: a.description || '', status: a.status || 'Active' }); setModal(true) }

  const saveAccount = async (e: FormEvent) => {
    e.preventDefault();
    const body = { 
      ...form, 
      parentId: form.parentId || null, 
      openingBalance: Number(form.openingBalance), 
      openingBalanceDate: Number(form.openingBalance) ? new Date().toISOString().slice(0, 10) : null, 
      gaapTag: form.gaapTag || null, 
      customFields: {}, 
      isSystem: form.isSystem,
      subtype: form.subtype || "",
      currency: form.currency || 'USD',
      taxCategory: form.taxCategory || null,
      allowManualJournal: form.allowManualJournal,
      description: form.description || null,
      status: form.status || 'Active'
    };
    try {
      await saveAccountStore(body, editing ? editing.id : undefined);
      setModal(false);
      notify(editing ? 'Account updated' : 'Account created');
    } catch (err: any) {
      notify(err.message || 'Could not save account');
    }
  }

  const toggleStatus = async (a: Account) => {
    try {
      await toggleAccountStatusStore(a);
      notify(`Account ${a.status === 'Active' ? 'deactivated' : 'activated'}`);
    } catch (err: any) {
      notify(err.message || 'Failed to update status');
    }
  }

  const handleGroupClick = (groupName: string) => {
    setOpenGroups(curr => curr.includes(groupName) ? [] : [groupName]);
    setPage(`${groupName}.Summary`);
  }
  const activeEntity = entities.find(x => x.id === activeEntityId)
  const activeViewMap: Record<string, string> = {
    'Overview.Dashboard': 'dashboard',
    'Overview.Summary': 'dashboard',
    'Sales & Customers.Summary': 'sales-summary',
    'Sales & Customers.Customers': 'customers',
    'Sales & Customers.Products & Services': 'products',
    'Sales & Customers.Sales Workspace': 'sales-workspace',
    'Sales & Customers.Estimates & Quotes': 'estimates-quotes',
    'Sales & Customers.Sales Orders': 'sales-orders',
    'Sales & Customers.Credit Notes': 'credit-notes',
    'Procurement.Summary': 'procurement-summary',
    'Procurement.Vendors': 'vendors',
    'Procurement.Bills': 'bills',
    'Procurement.Debit Notes': 'debit-notes',
    'Procurement.Procurement Workspace': 'procurement-workspace',
    'Procurement.Vendor Payments': 'vendor-payments',
    'Procurement.Vendor Statements': 'vendor-statements',
    'Procurement.Payables Aging': 'payables-aging',
    'Procurement.Expense Claims': 'expense-claims',
    'Procurement.Purchase Reports': 'purchase-reports',
    'Banking & Payments.Summary': 'banking-summary',
    'Banking & Payments.Bank Accounts': 'bank-accounts',
    'Banking & Payments.Cash Accounts': 'cash-accounts',
    'Banking & Payments.Bank Connection': 'bank-connection',
    'Banking & Payments.Bank Import': 'bank-import',
    'Banking & Payments.Transactions': 'bank-transactions',
    'Banking & Payments.Bank Reconciliation': 'bank-reconciliation',
    'Banking & Payments.Voucher Management': 'vouchers-workspace',
    'Banking & Payments.Fund Transfers': 'fund-transfers',
    'Banking & Payments.Cash Flow Statements': 'cash-flow-statements',
    'Accounting.Summary': 'accounting-summary',
    'Accounting.Chart of Accounts': 'accounts',
    'Accounting.Journal Entries': 'journal',
    'Accounting.Fixed Assets': 'fixed-assets',
    'Accounting.General Ledger': 'general-ledger',
    'Accounting.Accounts Receivable': 'accounts-receivable',
    'Accounting.Accounts Payable': 'accounts-payable',
    'Administration.Tax Accounting': 'tax-accounting',
    'Accounting.Budgets': 'budgets',
    'Accounting.Financial Reports': 'financial-reports',
    'Accounting.Period Closing': 'period-closing',
    'Accounting.Audit Trail': 'audit-trail',
    'Accounting.Lease Accounting': 'lease-accounting',
    'Accounting.Intercompany Allocations': 'intercompany',
    'Assets & Inventory.Summary': 'assets-inventory-summary',
    'Assets & Inventory.Assets & Inventory Workspace': 'assets-inventory',
    'Assets & Inventory.Depreciation Run': 'depreciation-run',
    'Assets & Inventory.Depreciation Schedule': 'depreciation-schedule',
    'Assets & Inventory.Valuation Reports': 'valuation-report',
    'Manufacturing & Production.Summary': 'mfg-summary',
    'Manufacturing & Production.Manufacturing Workspace': 'mfg-workspace',
    'Manufacturing & Production.Bill of Materials': 'mfg-bom',
    'Manufacturing & Production.Work Orders': 'mfg-orders',
    'Manufacturing & Production.Job Costing': 'mfg-costing',
    'Payroll & HR.Summary': 'payroll-summary',
    'Payroll & HR.Employees': 'payroll-employees',
    'Payroll & HR.Attendance': 'payroll-attendance',
    'Payroll & HR.Leave': 'payroll-leave',
    'Payroll & HR.Payroll': 'payroll-processing',
    'Payroll & HR.Salary': 'payroll-salary',
    'Payroll & HR.Loans & Advances': 'payroll-loans',
    'Payroll & HR.HR Reports': 'payroll-reports',
    'Survey & Field Operations.Summary': 'field-summary',
    'Survey & Field Operations.Surveys': 'field-surveys',
    'Survey & Field Operations.Field Visits': 'field-visits',
    'Survey & Field Operations.Inspections': 'field-inspections',
    'Survey & Field Operations.Work Orders': 'field-work-orders',
    'Survey & Field Operations.Field Expenses': 'field-expenses',
    'Survey & Field Operations.Field Reports': 'field-reports',
    'Government Compliance.Summary': 'compliance-summary',
    'Government Compliance.Tax Management': 'compliance-tax',
    'Government Compliance.VAT / Sales Tax': 'compliance-vat',
    'Government Compliance.Withholding Tax': 'compliance-withholding',
    'Government Compliance.Tax Returns': 'compliance-returns',
    'Government Compliance.E-Invoicing': 'compliance-einvoicing',
    'Government Compliance.Compliance Reports': 'compliance-reports',
    'Projects.Summary': 'projects-summary',
    'Projects.Projects': 'projects-list',
    'Projects.Project Planning': 'projects-planning',
    'Projects.Tasks': 'projects-tasks',
    'Projects.Project Budget': 'projects-budget',
    'Projects.Project Costing': 'projects-costing',
    'Projects.Timesheets': 'projects-timesheets',
    'Projects.Project Billing': 'projects-billing',
    'Projects.Project Expenses': 'projects-expenses',
    'Projects.Project Profitability': 'projects-profitability',
    'Projects.Reports': 'projects-reports',
    'AI & Analytics.Summary': 'analytics-summary',
    'AI & Analytics.Analytics Dashboard': 'analytics-summary',
    'AI & Analytics.Financial Analytics': 'analytics-financial',
    'AI & Analytics.Sales Analytics': 'analytics-sales',
    'AI & Analytics.Expense Analytics': 'analytics-expense',
    'AI & Analytics.Cash Flow Analytics': 'analytics-cashflow',
    'AI & Analytics.Inventory Analytics': 'analytics-inventory',
    'AI & Analytics.Forecasting': 'analytics-forecast',
    'AI & Analytics.AI Insights': 'analytics-insights',
    'Administration.Summary': 'admin-summary',
    'Administration.Users': 'admin-users',
    'Administration.Roles & Permissions': 'admin-roles',
    'Administration.Companies': 'admin-companies',
    'Administration.Branches': 'admin-branches',
    'Administration.Approval Workflows': 'admin-approvals',
    'Administration.System Settings': 'settings',
    'Administration.Chart of Accounts Mapping': 'coa-mapping',
    'Administration.Number Series': 'admin-number-series',
    'Administration.Currency': 'admin-currency',
    'Administration.Audit Logs': 'admin-audit',
    'Sales & Customers.Customer Payments': 'customer-payments',
    'Sales & Customers.Customer Statements': 'customer-statements',
    'Sales & Customers.Customer Aging': 'customer-aging',
    'Sales & Customers.Sales Reports': 'sales-reports'
  }
  const activeView = activeViewMap[page] || 'placeholder'
  const [group, module] = page.split('.')

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Non-admin demo users must complete onboarding first
  if (needsOnboarding(currentUser.email)) {
    return <OnboardingWizard currentUser={currentUser} />;
  }

  return <div className="app"><aside><div className="brand"><b>account</b><span>book</span></div><div className="company"><div className="avatar">AC</div><div><strong>{activeEntity?.name || 'Select entity'}</strong><small>Active accounting books</small></div></div>
  <nav>
    {NAVIGATION.map(group => {
      const isOpen = openGroups.includes(group.name);
      return (
        <div className="nav-group" key={group.name}>
          <button className={'nav nav-group-toggle ' + (page.startsWith(group.name + '.') ? 'active' : '')} onClick={() => handleGroupClick(group.name)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}><span>{group.icon}</span>{group.name}</div>
            {group.items.length > 0 && <span className="chevron">{isOpen ? '▾' : '▸'}</span>}
          </button>
          {isOpen && (
            <div className="nav-sub-list">
              {group.items.map(item => {
                const fullKey = `${group.name}.${item}`;
                return (
                  <button key={item} className={'nav nav-sub ' + (page === fullKey ? 'active' : '')} onClick={() => setPage(fullKey)}>
                    <span className="sub-bullet">•</span>{item}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      );
    })}
  </nav><div className="bottom"><div className="user"><div className="avatar small">{currentUser?.avatar}</div><div style={{ flex: 1, minWidth: 0 }}><strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.fullName}</strong><small style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.role}</small></div><button onClick={handleLogout} title="Sign Out" style={{ background: 'transparent', border: 'none', color: '#aebed0', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s ease', flexShrink: 0 }} onMouseEnter={(e) => (e.currentTarget.style.color = '#fca5a5')} onMouseLeave={(e) => (e.currentTarget.style.color = '#aebed0')}><LogOut size={16} /></button></div></div></aside><main><header><div><p className="eyebrow">{group.toUpperCase()}</p><h1>{module}</h1></div><label className="entity-picker">Working in<select value={activeEntityId} onChange={e => setActiveEntityId(e.target.value)}>{entities.map(x => <option key={x.id} value={x.id}>{x.name}{x.code ? ` · ${x.code}` : ''}</option>)}</select></label>{activeView === 'journal' && <button className="primary" onClick={() => document.getElementById('journal-form')?.scrollIntoView({ behavior: 'smooth' })}>＋ New entry</button>}</header>
  {activeView === 'dashboard' && <FinancialOverview accounts={accounts} entries={entries} setPage={setPage} activeEntityId={activeEntityId} />}
  {activeView === 'module-summary' && <ModuleSummary moduleName={group} accounts={accounts} entries={entries} setPage={setPage} openCreateAccount={openCreate} />}
  {activeView === 'sales-summary' && <SalesSummaryView activeEntityId={activeEntityId} setPage={setPage} />}
  {activeView === 'procurement-summary' && <ProcurementSummaryView activeEntityId={activeEntityId} setPage={setPage} />}
  {activeView === 'banking-summary' && <BankingSummaryView activeEntityId={activeEntityId} setPage={setPage} />}
  {activeView === 'accounting-summary' && <AccountingSummaryView accounts={accounts} entries={entries} setPage={setPage} />}
  {activeView === 'assets-inventory-summary' && <AssetsInventorySummaryView activeEntityId={activeEntityId} setPage={setPage} />}
  {activeView === 'payroll-summary' && <PayrollSummaryView activeEntityId={activeEntityId} setPage={setPage} />}
  {activeView === 'customers' && <CustomerManagement entities={entities as any} activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'accounts' && (
    <ChartOfAccounts accounts={accounts} edit={openEdit} status={toggleStatus} openCreate={openCreate} setParentIdForNew={(parentId) => setForm(f => ({ ...f, parentId }))} reloadAccounts={load} />
  )}
  {activeView.startsWith('vouchers') && <VoucherManagement subView={module} activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'bank-accounts' && <BankAccountsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'cash-accounts' && <CashAccountsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'bank-connection' && <BankConnectionView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'bank-import' && <BankImportView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'bank-transactions' && <BankTransactionsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'bank-reconciliation' && <BankReconciliationView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'fund-transfers' && <FundTransfersView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'cash-flow-statements' && <CashFlowView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'journal' && <JournalEntriesView accounts={accounts.filter(a => a.status === 'Active')} initialEntries={entries} onEntriesChange={async () => { await fetchJournalEntries(); }} />}
  {activeView === 'intercompany' && <Intercompany allocations={allocations} reload={load} notify={notify} />}
  {activeView === 'settings' && settingsView === 'home' && (
    <SettingsHome 
      openEntities={() => setSettingsView('entities')} 
      openMappings={() => setSettingsView('mappings')} 
      onReset={async () => {
        if (window.confirm("⚠️ WARNING: This will permanently delete all transactions, journals, customers, products, vendors, and custom configurations to start completely clean. Standard chart templates and tax rates will be reseeded. Are you sure you want to proceed?")) {
          try {
            await resetDatabaseStore();
            notify("✓ Database reset successfully. System cleared.");
            window.location.reload();
          } catch (err: any) {
            notify(err.message || "Failed to reset database");
          }
        }
      }}
    />
  )}
  {activeView === 'settings' && settingsView === 'mappings' && <SystemAccountMapping accounts={accounts} close={() => setSettingsView('home')} notify={notify} />}
  {activeView === 'coa-mapping' && <SystemAccountMapping accounts={accounts} close={() => setPage('Overview.Dashboard')} notify={notify} />}
  {activeView === 'settings' && settingsView === 'entities' && <EntitySettings entities={entities as any} selectedId={activeEntityId} select={setActiveEntityId} reload={load} notify={notify} />}
  {activeView === 'products' && <ProductsAndServices notify={notify} activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'vendors' && <VendorManagement entities={entities as any} activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'sales-workspace' && <SalesWorkspace activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'estimates-quotes' && <EstimatesAndQuotes activeEntityId={activeEntityId} />}
  {activeView === 'sales-orders' && <SalesOrdersWorkspace activeEntityId={activeEntityId} />}
        {activeView === 'credit-notes' && <CreditNotesWorkspace />}
  {activeView === 'procurement-workspace' && <ProcurementWorkspace activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'vendor-payments' && <VendorPaymentsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'expense-claims' && <ExpenseClaimsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'purchase-reports' && <PurchaseReportsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'payroll-employees' && <EmployeeDirectory />}
  {activeView === 'payroll-attendance' && <AttendanceTracker />}
  {activeView === 'payroll-leave' && <LeaveManagement />}
  {activeView === 'payroll-processing' && <PayrollProcessing />}
  {activeView === 'payroll-salary' && <SalarySlipsView />}
  {activeView === 'payroll-loans' && <LoansAdvancesView />}
  {activeView === 'payroll-reports' && <HRReportsView />}
  {activeView === 'projects-summary' && <ProjectsSummaryView />}
  {activeView === 'projects-list' && <ProjectsListView activeEntityId={activeEntityId} />}
  {activeView === 'projects-planning' && <ProjectPlanningView activeEntityId={activeEntityId} />}
  {activeView === 'projects-tasks' && <ProjectsTasksView activeEntityId={activeEntityId} />}
  {activeView === 'projects-budget' && <ProjectBudgetView activeEntityId={activeEntityId} />}
  {activeView === 'projects-costing' && <ProjectCostingView activeEntityId={activeEntityId} />}
  {activeView === 'projects-timesheets' && <ProjectsTimesheetsView activeEntityId={activeEntityId} />}
  {activeView === 'projects-billing' && <ProjectBillingView activeEntityId={activeEntityId} />}
  {activeView === 'projects-expenses' && <ProjectsExpensesView activeEntityId={activeEntityId} />}
  {activeView === 'projects-profitability' && <ProjectProfitabilityView activeEntityId={activeEntityId} />}
  {activeView === 'projects-reports' && <ProjectsReportsView activeEntityId={activeEntityId} />}
  {activeView === 'compliance-summary' && <ComplianceSummaryView />}
  {activeView === 'compliance-tax' && <TaxManagementView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'compliance-vat' && <VatSalesTaxView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'compliance-withholding' && <WithholdingTaxView activeEntityId={activeEntityId} />}
  {activeView === 'compliance-returns' && <TaxReturnsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'compliance-einvoicing' && <EInvoicingView activeEntityId={activeEntityId} />}
  {activeView === 'compliance-reports' && <ComplianceReportsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'field-summary' && <FieldOperationsSummaryView />}
  {activeView === 'field-surveys' && <SurveysView activeEntityId={activeEntityId} />}
  {activeView === 'field-visits' && <FieldVisitsView activeEntityId={activeEntityId} />}
  {activeView === 'field-inspections' && <InspectionsView activeEntityId={activeEntityId} />}
  {activeView === 'field-work-orders' && <WorkOrdersView activeEntityId={activeEntityId} />}
  {activeView === 'field-expenses' && <FieldExpensesView activeEntityId={activeEntityId} />}
  {activeView === 'field-reports' && <FieldReportsView />}
  {activeView === 'analytics-summary' && <AnalyticsDashboardView />}
  {activeView === 'analytics-financial' && <FinancialAnalyticsView />}
  {activeView === 'analytics-sales' && <SalesAnalyticsView />}
  {activeView === 'analytics-expense' && <ExpenseAnalyticsView />}
  {activeView === 'analytics-cashflow' && <CashFlowAnalyticsView />}
  {activeView === 'analytics-inventory' && <InventoryAnalyticsView />}
  {activeView === 'analytics-forecast' && <ForecastingView />}
  {activeView === 'analytics-insights' && <AIInsightsView />}
  {activeView === 'admin-summary' && <AdministrationSummaryView />}
  {activeView === 'admin-users' && <UsersView />}
  {activeView === 'admin-roles' && <RolesPermissionsView />}
  {activeView === 'admin-companies' && <CompaniesView />}
  {activeView === 'admin-branches' && <BranchesView />}
  {activeView === 'admin-approvals' && <ApprovalWorkflowsView />}
  {activeView === 'admin-number-series' && <NumberSeriesView />}
  {activeView === 'admin-currency' && <CurrencyView />}
  {activeView === 'admin-audit' && <AuditLogsView activeEntityId={activeEntityId} />}
  {activeView === 'bills' && <VendorBills activeEntityId={activeEntityId} />}
  {activeView === 'vendor-statements' && <VendorStatementsWorkspace activeEntityId={activeEntityId} />}
  {activeView === 'payables-aging' && <PayablesAgingWorkspace activeEntityId={activeEntityId} />}
  {activeView === 'debit-notes' && <DebitNotes activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'taxes' && <TaxAccountingView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'fixed-assets' && <FixedAssets activeEntityId={activeEntityId} />}
  {activeView === 'assets-inventory' && <AssetsInventoryWorkspace activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'depreciation-run' && <DepreciationRun activeEntityId={activeEntityId} />}
  {activeView === 'depreciation-schedule' && <DepreciationSchedule activeEntityId={activeEntityId} />}
  {activeView === 'valuation-report' && <ValuationReport activeEntityId={activeEntityId} />}
  {activeView === 'manufacturing' && <ManufacturingWorkspace activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'mfg-summary' && <ManufacturingSummaryView activeEntityId={activeEntityId} />}
  {activeView === 'mfg-workspace' && <ManufacturingWorkspaceView activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'mfg-bom' && <BillOfMaterialsView activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'mfg-orders' && <WorkOrdersMfgView activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'mfg-costing' && <JobCostingView activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'financial-reports' && <FinancialReports accounts={accounts} entries={entries} activeEntityId={activeEntityId} />}
  {activeView === 'general-ledger' && <GeneralLedgerView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'accounts-receivable' && <AccountsReceivableView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'accounts-payable' && <AccountsPayableView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'tax-accounting' && <TaxAccountingView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'budgets' && <BudgetsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'period-closing' && <PeriodClosingView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'audit-trail' && <AuditTrailView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'lease-accounting' && <LeaseAccounting activeEntityId={activeEntityId} />}
  {activeView === 'customer-payments' && <CustomerPaymentsWorkspace />}
  {activeView === 'customer-statements' && <CustomerStatementsWorkspace activeEntityId={activeEntityId} />}
  {activeView === 'customer-aging' && <CustomerAgingWorkspace activeEntityId={activeEntityId} />}
  {activeView === 'sales-reports' && <SalesReportsWorkspace activeEntityId={activeEntityId} />}
  {activeView === 'placeholder' && <div style={{ padding: 40, textAlign: 'center', color: '#666' }}><span style={{ fontSize: 48, opacity: 0.2, display: 'block', marginBottom: 20 }}>🏗</span><h3>Under Construction</h3><p>This module ({module}) is part of the layout but not yet developed.</p></div>}
  </main>{modal && <AccountModal form={form} setForm={setForm} accounts={accounts} editing={editing} close={() => setModal(false)} save={saveAccount} />}{toast && <div className="toast">✓ {toast}</div>}</div>
}

function SettingsHome({ openEntities, openMappings, onReset }: { openEntities: () => void; openMappings: () => void; onReset: () => void }) { 
  return (
    <section className="settings-grid">
      <button className="settings-card font-sans" onClick={openEntities}>
        <span>▦</span>
        <div>
          <strong>Entity management</strong>
          <small>Create entities, manage the hierarchy, and select each entity's books.</small>
        </div>
        <b>→</b>
      </button>
      <button className="settings-card font-sans" onClick={openMappings}>
        <span>⚙️</span>
        <div>
          <strong>System Account Mapping</strong>
          <small>Map default operational accounts (Accounts Receivable, Accounts Payable, Taxes) for posting.</small>
        </div>
        <b>→</b>
      </button>
      <button className="settings-card font-sans" disabled>
        <span>⌘</span>
        <div>
          <strong>Chart of accounts</strong>
          <small>Account structure and financial reporting settings.</small>
        </div>
        <b>→</b>
      </button>
      <button 
        className="settings-card border border-red-200/50 hover:bg-rose-50/40 font-sans group cursor-pointer" 
        onClick={onReset}
      >
        <span className="text-red-500 scale-105">⚠️</span>
        <div>
          <strong className="text-red-700">Danger Zone: Reset Database</strong>
          <small className="text-red-500">Wipe all posted transactions, journals, customers, vendors, and products to start clean.</small>
        </div>
        <b className="text-red-500">→</b>
      </button>
    </section>
  ); 
}

const subtypesMap: Record<string, string[]> = {
  Asset: ['Current Assets', 'Non-Current Assets'],
  ContraAsset: ['Non-Current Assets'],
  Liability: ['Current Liabilities', 'Non-Current Liabilities'],
  ContraLiability: ['Current Liabilities'],
  Equity: ['Share Capital & Premium', 'Retained Earnings & Reserves'],
  ContraEquity: ['Share Capital & Premium', 'Retained Earnings & Reserves'],
  Revenue: ['Operating Revenue', 'Non-Operating Revenue'],
  ContraRevenue: ['Operating Revenue'],
  Expense: ['Cost of Goods Sold', 'Operating Expenses', 'Non-Operating Expenses'],
  ContraExpense: ['Operating Expenses']
};

const inferSubtype = (code: string, type: string): string => {
  if (type === 'Asset' || type === 'ContraAsset') {
    return code.startsWith('11') ? 'Current Assets' : 'Non-Current Assets';
  }
  if (type === 'Liability' || type === 'ContraLiability') {
    return code.startsWith('25') ? 'Non-Current Liabilities' : 'Current Liabilities';
  }
  if (type === 'Equity' || type === 'ContraEquity') {
    return code.startsWith('32') ? 'Retained Earnings & Reserves' : 'Share Capital & Premium';
  }
  if (type === 'Revenue' || type === 'ContraRevenue') {
    return code.startsWith('42') ? 'Non-Operating Revenue' : 'Operating Revenue';
  }
  if (type === 'Expense' || type === 'ContraExpense') {
    if (code.startsWith('5')) return 'Cost of Goods Sold';
    return code.startsWith('61') ? 'Operating Expenses' : 'Non-Operating Expenses';
  }
  return '';
};

function AccountModal({ form, setForm, accounts, editing, close, save }: { form: any; setForm: any; accounts: Account[]; editing: Account | null; close: () => void; save: (e: FormEvent) => void }) {
  const field = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));

  const [subtype, setSubtype] = useState(() => {
    if (editing) {
      return inferSubtype(editing.code, editing.type);
    }
    const initialType = form.type || 'Asset';
    return subtypesMap[initialType]?.[0] || '';
  });

  // Deep-link support: read URL params on mount to prefill form
  useEffect(() => {
    if (editing) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('type')) {
      const type = params.get('type');
      if (type && accountTypes.includes(type as AccountType)) field('type', type);
    }
    if (params.has('subtype')) {
      const st = params.get('subtype');
      const newSubtypes = subtypesMap[form.type] || [];
      if (st && newSubtypes.includes(st)) setSubtype(st);
    }
    if (params.has('parent')) {
      const parentCode = params.get('parent');
      if (parentCode) {
        const parent = accounts.find(a => a.code === parentCode);
        if (parent) field('parentId', parent.id);
      }
    }
    if (params.has('name')) {
      const name = params.get('name');
      if (name) field('name', name);
    }
  }, []);

  const fetchNextCode = async (type: string, parentId?: string) => {
    if (editing) return;
    try {
      const code = await useCoaStore.getState().getNextCode(type, parentId);
      if (code) {
        setForm((f: any) => ({ ...f, code }));
      }
    } catch {}
  };

  const handleNameChange = (val: string) => {
    field('name', val);
    if (!editing && !form.code && val.trim().length > 0) {
      fetchNextCode(form.type, form.parentId);
    }
  };

  const handleSubtypeChange = (newSubtype: string) => {
    setSubtype(newSubtype);
    field('subtype', newSubtype);
    
    // Suggest standard parent account based on selected subtype
    let suggestedParentCode = '';
    switch (newSubtype) {
      case 'Current Assets': suggestedParentCode = '11000'; break;
      case 'Non-Current Assets': suggestedParentCode = '15000'; break;
      case 'Current Liabilities': suggestedParentCode = '21000'; break;
      case 'Non-Current Liabilities': suggestedParentCode = '25000'; break;
      case 'Share Capital & Premium': suggestedParentCode = '31000'; break;
      case 'Retained Earnings & Reserves': suggestedParentCode = '32000'; break;
      case 'Operating Revenue': suggestedParentCode = '41000'; break;
      case 'Non-Operating Revenue': suggestedParentCode = '42000'; break;
      case 'Cost of Goods Sold': suggestedParentCode = '50000'; break;
      case 'Operating Expenses': suggestedParentCode = '61000'; break;
      case 'Non-Operating Expenses': suggestedParentCode = '60000'; break;
    }
    
    const suggestedParent = accounts.find(a => a.code === suggestedParentCode);
    const parentId = suggestedParent ? suggestedParent.id : '';
    setForm((f: any) => ({ ...f, parentId }));
    
    if (!editing) {
      fetchNextCode(form.type, parentId);
    }
  };

  const handleTypeChange = (val: string) => {
    field('type', val);
    const newSubtypes = subtypesMap[val] || [];
    const firstSubtype = newSubtypes[0] || '';
    setSubtype(firstSubtype);
    field('subtype', firstSubtype);

    // Auto-select standard parent based on subtype
    let suggestedParentCode = '';
    switch (firstSubtype) {
      case 'Current Assets': suggestedParentCode = '11000'; break;
      case 'Non-Current Assets': suggestedParentCode = '15000'; break;
      case 'Current Liabilities': suggestedParentCode = '21000'; break;
      case 'Non-Current Liabilities': suggestedParentCode = '25000'; break;
      case 'Share Capital & Premium': suggestedParentCode = '31000'; break;
      case 'Retained Earnings & Reserves': suggestedParentCode = '32000'; break;
      case 'Operating Revenue': suggestedParentCode = '41000'; break;
      case 'Non-Operating Revenue': suggestedParentCode = '42000'; break;
      case 'Cost of Goods Sold': suggestedParentCode = '50000'; break;
      case 'Operating Expenses': suggestedParentCode = '61000'; break;
      case 'Non-Operating Expenses': suggestedParentCode = '60000'; break;
    }
    const suggestedParent = accounts.find(a => a.code === suggestedParentCode);
    const parentId = suggestedParent ? suggestedParent.id : '';
    setForm((f: any) => ({ ...f, parentId }));

    if (!editing) {
      fetchNextCode(val, parentId);
    }
  };

  const filteredParents = useMemo(() => {
    if (!subtype) return accounts.filter(a => a.id !== editing?.id);
    return accounts.filter(a => {
      if (a.id === editing?.id) return false;
      switch (subtype) {
        case 'Current Assets':
          return a.code.startsWith('11') || a.code === '10000';
        case 'Non-Current Assets':
          return a.code.startsWith('15') || a.code === '10000';
        case 'Current Liabilities':
          return a.code.startsWith('21') || a.code.startsWith('22') || a.code === '20000';
        case 'Non-Current Liabilities':
          return a.code.startsWith('25') || a.code === '20000';
        case 'Share Capital & Premium':
          return a.code === '30000' || a.code.startsWith('31');
        case 'Retained Earnings & Reserves':
          return a.code === '30000' || a.code.startsWith('32');
        case 'Operating Revenue':
          return a.code === '40000' || a.code.startsWith('41');
        case 'Non-Operating Revenue':
          return a.code === '40000' || a.code.startsWith('42');
        case 'Cost of Goods Sold':
          return a.code === '50000' || a.code.startsWith('5');
        case 'Operating Expenses':
          return a.code === '60000' || a.code.startsWith('61');
        case 'Non-Operating Expenses':
          return a.code === '60000';
        default:
          return true;
      }
    });
  }, [accounts, subtype, editing]);

  const calculatedLevel = useMemo(() => {
    if (!form.parentId) return 'Main Head';
    const parent = accounts.find(a => a.id === form.parentId);
    if (!parent) return 'Main Head';
    if (!parent.parentId) return 'Sub Head';
    return 'Detail Account';
  }, [form.parentId, accounts]);

  const calculatedNormalBalance = useMemo(() => {
    const type = form.type;
    if (type === 'Asset' || type === 'Expense' || type === 'ContraLiability' || type === 'ContraEquity' || type === 'ContraRevenue') {
      return 'Debit';
    }
    return 'Credit';
  }, [form.type]);

  const activeSubtypes = subtypesMap[form.type] || [];
  const isCodeValid = /^\d{5}$/.test(form.code);

  return <div className="overlay"><form className="modal" onSubmit={save} ><div className="modal-head"><div><p className="eyebrow">CHART OF ACCOUNTS</p><h2>{editing ? 'Edit Account properties' : 'Create 5-Digit Account'}</h2></div><button type="button" className="close" onClick={close}>×</button></div><div className="form-grid">{editing?.isSystem && <div style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 8, gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}><span>🔒</span><strong>Protected System Account:</strong> Critical settings (Code, Type, Sub-type, Parent) are locked for operational integrity.</div>}<label>* 1. 5-Digit Account Code<input required disabled={editing?.isSystem} value={form.code} onChange={e => field('code', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="e.g. 11101" className={!isCodeValid && form.code ? 'border-red-500 font-mono font-bold' : 'font-mono font-bold'} /></label><label>* 2. Account Name<input required value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. HBL Current Account" /></label><label>3. Major Type<select disabled={editing?.isSystem} value={form.type} onChange={e => handleTypeChange(e.target.value)}>{accountTypes.map(x => <option key={x}>{x}</option>)}</select></label><label>4. Sub-Type<select disabled={editing?.isSystem} value={subtype} onChange={e => handleSubtypeChange(e.target.value)}>{activeSubtypes.map(x => <option key={x} value={x}>{x}</option>)}</select></label><label>5. Parent Account (Financial Reporting Line)<select disabled={editing?.isSystem} value={form.parentId} onChange={e => { field('parentId', e.target.value); if (!editing) fetchNextCode(form.type, e.target.value); }}><option value="">No Parent (Top-Level Group Line)</option>{filteredParents.map(a => <option value={a.id} key={a.id}>{a.code} — {a.name}</option>)}</select></label><label>Opening Balance ($)<input type="number" step="0.01" value={form.openingBalance} onChange={e => field('openingBalance', e.target.value)} /></label><label>Account Level (Derived)<input disabled value={calculatedLevel} style={{ background: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }} /></label><label>Normal Balance (Derived)<input disabled value={calculatedNormalBalance} style={{ background: '#f8fafc', color: '#1e293b', fontWeight: 'bold' }} /></label><label>Posting Account Status (Derived)<input disabled value={editing ? (editing.isPosting ? 'Posting Account (Leaf)' : 'Non-Posting (Header)') : 'Posting Account (Leaf)'} style={{ background: '#f8fafc', color: '#16a34a', fontWeight: 'bold' }} /></label><label>Currency<select value={form.currency} onChange={e => field('currency', e.target.value)}><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option><option value="AED">AED</option><option value="SAR">SAR</option><option value="PKR">PKR</option><option value="CAD">CAD</option></select></label><label>Tax Category<select value={form.taxCategory || ''} onChange={e => field('taxCategory', e.target.value)}><option value="">None / Exempt</option><option value="Standard VAT">Standard VAT</option><option value="Zero Rated">Zero Rated</option><option value="Sales Tax">US Sales Tax</option><option value="GST">GST / HST (Canada)</option></select></label><label>Status<select value={form.status} onChange={e => field('status', e.target.value)}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label><label style={{ gridColumn: 'span 2' }}>Description / Remarks<textarea value={form.description || ''} onChange={e => field('description', e.target.value)} placeholder="Describe the purpose of this ledger register..." style={{ width: '100%', minHeight: 70, border: '1px solid #dce3eb', borderRadius: 7, padding: 8, fontSize: 13, resize: 'none' }} /></label></div><div className="flex flex-col gap-2 mt-4"><label className="check"><input type="checkbox" checked={form.allowManualJournal} onChange={e => field('allowManualJournal', e.target.checked)} /> Allow Manual General Journal Adjustments</label><label className="check"><input type="checkbox" checked={form.reconciliationEnabled} onChange={e => field('reconciliationEnabled', e.target.checked)} /> Enable Bank & Ledger Account Reconciliation</label></div><div className="modal-footer"><button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
<button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={!isCodeValid || !form.name.trim()}>{editing ? 'Save Changes' : 'Create Account'}</button></div></form></div>;
}
