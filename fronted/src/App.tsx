import { useEffect, useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { Login } from './Login'
import type { UserData } from './Login'
import OnboardingWizard from './components/OnboardingWizard'
import { AiAssistantDrawer } from './components/AiAssistantDrawer'
import { LicenseModal } from './components/LicenseModal'
import { FeedbackModal } from './components/FeedbackModal'
import { ShieldAlert } from 'lucide-react'
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
import VendorPrepaymentsView from './VendorPrepaymentsView';
import CustomerDeferredRevenueView from './CustomerDeferredRevenueView';
import EmployeeDirectory from './EmployeeDirectory';
import AttendanceTracker from './AttendanceTracker';
import AttendancePoliciesView from './AttendancePoliciesView';
import BiometricDevicesView from './BiometricDevicesView';
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
import { SystemSettingsView } from './SystemSettingsView';

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
import { DashboardOverview } from './DashboardOverview'
import { DashboardHub } from './components/DashboardHub'
import { ErrorBoundary } from './components/ErrorBoundary'

import UniqueSidebar from './components/UniqueSidebar';
import { NAVIGATION } from './navigation'
import { getStoredTheme } from './themes'
import TopHeader from './components/TopHeader'
import type { Account } from './api/modules/coa.api'
type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'ContraAsset' | 'ContraLiability' | 'ContraEquity' | 'ContraRevenue' | 'ContraExpense'
type Journal = { id: string; date: string; reference: string; description: string; status?: string; lines: { accountId: string; debit: number; credit: number }[] }
type Allocation = { id: string; name: string; sourceCompanyId: string; category: string; frequency: string; rate: number; quantity: number; status: string; recipients: { companyId: string; sharePercent: number }[] }

const accountTypes: AccountType[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'ContraAsset', 'ContraLiability', 'ContraEquity', 'ContraRevenue', 'ContraExpense']
const blank = { code: '', name: '', type: 'Asset' as AccountType, parentId: '', openingBalance: '0', reconciliationEnabled: false, ifrsTag: '', gaapTag: '', isSystem: false, subtype: '', currency: 'USD', taxCategory: '', allowManualJournal: true, description: '', status: 'Active' }

export default function App() {
  const [page, setPage] = useState<string>(() => {
    return localStorage.getItem('last_active_page') || 'Overview.Dashboard';
  });
  const [theme, setTheme] = useState<string>(getStoredTheme);
  const [settingsView, setSettingsView] = useState<'home' | 'entities' | 'mappings'>('home')

  const accounts = useCoaStore((s) => s.accounts as Account[])
  const fetchAccounts = useCoaStore((s) => s.fetchAccounts)
  const saveAccountStore = useCoaStore((s) => s.saveAccount)
  const toggleAccountStatusStore = useCoaStore((s) => s.toggleAccountStatus)

  const entries = useJournalsStore((s) => s.entries as Journal[])
  const fetchJournalEntries = useJournalsStore((s) => s.fetchJournalEntries)

  const allocations = useIntercompanyStore((s) => s.allocations as Allocation[])
  const fetchAllocations = useIntercompanyStore((s) => s.fetchAllocations)

  const entities = useCompanyStore((s) => s.entities)
  const activeEntityId = useCompanyStore((s) => s.activeEntityId)
  const fetchCompanies = useCompanyStore((s) => s.fetchCompanies)
  const setActiveEntityId = useCompanyStore((s) => s.setActiveEntityId)

  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

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

  // Track onboarding setup for all users
  const needsOnboarding = (email: string) => {
    const key = `onboarding_complete_${email.toLowerCase()}`;
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
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ams_theme', theme);
  }, [theme]);

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

  // After onboarding, if no company exists, redirect to Companies setup
  useEffect(() => {
    if (currentUser && currentUser.email !== 'admin@acme.com') {
      const key = `onboarding_complete_${currentUser.email}`;
      if (localStorage.getItem(key) && entities.length === 0 && page !== 'Administration.Companies') {
        setPage('Administration.Companies');
      }
    }
  }, [currentUser, entities, page])
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

  const activeEntity = entities.find(x => x.id === activeEntityId)
  const readOnly = !!activeEntity && !activeEntity.active
  const activeViewMap: Record<string, string> = {
    'Overview.Dashboard': 'dashboard-hub',
    'Overview.Summary': 'dashboard-hub',
    'Overview.Overview': 'dashboard-overview',
    'Sales & Customers.Summary': 'sales-summary',
    'Sales & Customers.Customers': 'customers',
    'Sales & Customers.Products & Services': 'products',
    'Sales & Customers.Sales Invoices': 'sales-workspace',
    'Sales & Customers.Estimates & Quotes': 'estimates-quotes',
    'Sales & Customers.Sales Orders': 'sales-orders',
    'Sales & Customers.Credit Notes': 'credit-notes',
    'Sales & Customers.Deferred Revenue & Advances': 'deferred-revenue',
    'Procurement.Summary': 'procurement-summary',
    'Procurement.Vendors': 'vendors',
    'Procurement.Bills': 'bills',
    'Procurement.Debit Notes': 'debit-notes',
    'Procurement.Procurement Workspace': 'procurement-workspace',
    'Procurement.Vendor Payments': 'vendor-payments',
    'Procurement.Vendor Statements': 'vendor-statements',
    'Procurement.Payables Aging': 'payables-aging',
    'Procurement.Prepayments & Amortization': 'vendor-prepayments',
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
    'Accounting.Tax Accounting': 'tax-accounting',
    'Administration.Tax Accounting': 'tax-accounting',
    'Accounting.Budgets': 'budgets',
    'Accounting.Financial Reports': 'financial-reports',
    'Accounting.Prepayment Schedules': 'vendor-prepayments',
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
    'Payroll & HR.Attendance Policy': 'payroll-attendance-policies',
    'Payroll & HR.Attendance Policies': 'payroll-attendance-policies',
    'Payroll & HR.Biometric Configuration': 'payroll-biometric-config',
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
    'Administration.Biometric Configuration': 'admin-biometric-config',
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
  const activeGroup = NAVIGATION.find((g: { name: string }) => g.name === group)
  const activeGroupItems = activeGroup?.items || []

  const enabledModules = useMemo(() => {
    if (activeEntity?.modules && activeEntity.modules.length > 0) {
      return activeEntity.modules;
    }
    try {
      const saved = localStorage.getItem('erp_enabled_modules');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }, [activeEntity]);

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // Non-admin demo users must complete onboarding first
  if (needsOnboarding(currentUser.email)) {
    return <OnboardingWizard currentUser={currentUser} />;
  }

  return (
    <div className="app">
      <UniqueSidebar
        activePage={page}
        onNavigate={setPage}
        modules={enabledModules}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      <div className="main-col">
        <TopHeader
          currentUser={currentUser}
          entities={entities}
          activeEntityId={activeEntityId}
          onSelectEntity={setActiveEntityId}
          page={page}
          setPage={setPage}
          accounts={accounts}
          notify={notify}
          onLogout={handleLogout}
          theme={theme}
          onThemeChange={setTheme}
          onOpenLicense={() => setLicenseModalOpen(true)}
          onOpenFeedback={() => setFeedbackModalOpen(true)}
        />
        <div className="module-workspace">
          <header className="module-head">
            <div className="module-title">
              <span className="module-icon">
                {(() => {
                  const MIcon = activeGroup?.icon;
                  return MIcon ? <MIcon size={20} strokeWidth={1.8} /> : '▦';
                })()}
              </span>
              <div>
                <p className="eyebrow">MODULE</p>
                <h1>{activeGroup?.label || group}</h1>
              </div>
            </div>
            <div className="module-actions">
              <label className="entity-picker">
                Working in
                <select value={activeEntityId} onChange={e => setActiveEntityId(e.target.value)}>
                  {entities.map(x => (
                    <option key={x.id} value={x.id}>
                      {x.name}{x.code ? ` · ${x.code}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              {activeView === 'journal' && (
                <button
                  className="primary"
                  onClick={() => document.getElementById('journal-form')?.scrollIntoView({ behavior: 'smooth' })}
                  disabled={readOnly}
                  style={readOnly ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                >
                  ＋ New entry
                </button>
              )}
            </div>
          </header>
          <nav className="module-tabs">
            <button
              className={'tab' + (module === 'Summary' || module === 'Dashboard' ? ' active' : '')}
              onClick={() => setPage(`${group}.Summary`)}
            >
              Dashboard
            </button>
            {activeGroupItems.map((item: string) => {
              const key = `${group}.${item}`;
              return (
                <button
                  key={item}
                  className={'tab' + (page === key ? ' active' : '')}
                  onClick={() => setPage(key)}
                >
                  {item}
                </button>
              );
            })}
          </nav>
        </div>
        <main>
          {readOnly && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fef3c7', border: '1px solid #f59e0b', color: '#92400e', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5, fontWeight: 600 }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{activeEntity?.name} is <b>Deactivated</b> — read-only mode. You can view data and download reports, but editing is disabled.</span>
              <button onClick={() => setPage('Administration.Companies')} style={{ marginLeft: 'auto', background: '#fff7ed', border: '1px solid #f59e0b', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#92400e', cursor: 'pointer' }}>Manage Companies</button>
            </div>
          )}
  {activeView === 'dashboard-hub' && <DashboardHub setPage={setPage} accounts={accounts} activeEntityId={activeEntityId} currentUser={currentUser} />}
  {activeView === 'dashboard-overview' && (
    <ErrorBoundary>
      <DashboardOverview accounts={accounts} entries={entries} setPage={setPage} activeEntityId={activeEntityId} />
    </ErrorBoundary>
  )}
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
    <SystemSettingsView setPage={setPage} notify={notify} />
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
  {activeView === 'deferred-revenue' && <CustomerDeferredRevenueView activeEntityId={activeEntityId} accounts={accounts} />}
  {activeView === 'procurement-workspace' && <ProcurementWorkspace activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'vendor-payments' && <VendorPaymentsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'vendor-prepayments' && <VendorPrepaymentsView activeEntityId={activeEntityId} accounts={accounts} />}
  {activeView === 'expense-claims' && <ExpenseClaimsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'purchase-reports' && <PurchaseReportsView activeEntityId={activeEntityId} entities={entities as any} />}
  {activeView === 'payroll-employees' && <EmployeeDirectory />}
  {activeView === 'payroll-attendance' && <AttendanceTracker />}
  {activeView === 'payroll-attendance-policies' && <AttendancePoliciesView />}
  {activeView === 'payroll-leave' && <LeaveManagement />}
  {activeView === 'payroll-processing' && <PayrollProcessing />}
  {activeView === 'payroll-salary' && <SalarySlipsView />}
  {activeView === 'payroll-loans' && <LoansAdvancesView />}
  {activeView === 'payroll-reports' && <HRReportsView />}
  {activeView === 'payroll-biometric-config' && <BiometricDevicesView />}
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
  {activeView === 'admin-summary' && <AdministrationSummaryView setPage={setPage} />}
  {activeView === 'admin-users' && <UsersView activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'admin-roles' && <RolesPermissionsView activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'admin-companies' && <CompaniesView activeEntityId={activeEntityId} setPage={setPage} notify={notify} />}
  {activeView === 'admin-branches' && <BranchesView activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'admin-approvals' && <ApprovalWorkflowsView activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'admin-biometric-config' && <BiometricDevicesView />}
  {activeView === 'admin-number-series' && <NumberSeriesView activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'admin-currency' && <CurrencyView activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'admin-audit' && <AuditLogsView activeEntityId={activeEntityId} entities={entities as any} notify={notify} />}
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
        </main>
      </div>
      {modal && <AccountModal form={form} setForm={setForm} accounts={accounts} editing={editing} close={() => setModal(false)} save={saveAccount} />}
      {toast && <div className="toast">✓ {toast}</div>}
      <AiAssistantDrawer activePage={page} onNavigate={setPage} onOpenFeedback={() => setFeedbackModalOpen(true)} />
      <LicenseModal isOpen={licenseModalOpen} onClose={() => setLicenseModalOpen(false)} notify={notify} />
      <FeedbackModal isOpen={feedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} activePage={page} notify={notify} />
    </div>
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

  const [unlockOverride, setUnlockOverride] = useState(false);
  const isLocked = editing?.isSystem && !unlockOverride;

  return (
    <div className="overlay">
      <form className="modal max-w-2xl" onSubmit={save}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">CHART OF ACCOUNTS</p>
            <h2>{editing ? 'Edit Account Properties' : 'Create 5-Digit Account'}</h2>
          </div>
          <button type="button" className="close" onClick={close}>×</button>
        </div>

        <div className="form-grid">
          {/* Security Banner & Unlock Switch */}
          {editing?.isSystem ? (
            <div className="col-span-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🔒</span>
                <div>
                  <strong className="text-amber-900 dark:text-amber-300 block">Secured System Account</strong>
                  <span className="text-muted-foreground text-[11px]">Core ledger mapped for ERP integrity.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnlockOverride(!unlockOverride)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs border transition-all cursor-pointer ${
                  unlockOverride
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-background hover:bg-muted text-foreground border-border'
                }`}
              >
                {unlockOverride ? '🔓 Structure Unlocked' : '🔑 Unlock Structure'}
              </button>
            </div>
          ) : (
            <div className="col-span-2 p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <div>
                  <strong className="text-teal-900 dark:text-teal-300 block">Custom Ledger Account</strong>
                  <span className="text-muted-foreground text-[11px]">Fully customizable chart of accounts entity.</span>
                </div>
              </div>
              <label className="flex items-center gap-1.5 font-bold cursor-pointer text-teal-800 dark:text-teal-300 text-xs">
                <input
                  type="checkbox"
                  checked={form.isSystem}
                  onChange={e => field('isSystem', e.target.checked)}
                  className="rounded text-teal-600"
                />
                Secure as Protected Ledger
              </label>
            </div>
          )}

          <label>
            * 1. 5-Digit Account Code
            <input
              required
              disabled={isLocked}
              value={form.code}
              onChange={e => field('code', e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="e.g. 11101"
              className={!isCodeValid && form.code ? 'border-red-500 font-mono font-bold' : 'font-mono font-bold'}
            />
          </label>

          <label>
            * 2. Account Name
            <input
              required
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. HBL Operational Current Account"
            />
          </label>

          <label>
            3. Major Type
            <select disabled={isLocked} value={form.type} onChange={e => handleTypeChange(e.target.value)}>
              {accountTypes.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>

          <label>
            4. Sub-Type
            <select disabled={isLocked} value={subtype} onChange={e => handleSubtypeChange(e.target.value)}>
              {activeSubtypes.map(x => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>

          <label className="col-span-2">
            5. Parent Account (Financial Reporting Line)
            <select
              disabled={isLocked}
              value={form.parentId}
              onChange={e => { field('parentId', e.target.value); if (!editing) fetchNextCode(form.type, e.target.value); }}
            >
              <option value="">No Parent (Top-Level Group Line)</option>
              {filteredParents.map(a => (
                <option value={a.id} key={a.id}>{a.code} — {a.name} ({a.subtype || a.type})</option>
              ))}
            </select>
          </label>

          <label>
            Opening Balance
            <input
              type="number"
              step="0.01"
              value={form.openingBalance}
              onChange={e => field('openingBalance', e.target.value)}
              placeholder="0.00"
            />
          </label>

          <label>
            Currency
            <select value={form.currency} onChange={e => field('currency', e.target.value)}>
              <option value="PKR">PKR (Pakistani Rupee)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
              <option value="AED">AED (UAE Dirham)</option>
              <option value="SAR">SAR (Saudi Riyal)</option>
              <option value="CAD">CAD (Canadian Dollar)</option>
            </select>
          </label>

          <label>
            Tax Category
            <select value={form.taxCategory || ''} onChange={e => field('taxCategory', e.target.value)}>
              <option value="">None / Exempt</option>
              <option value="Standard VAT">Standard VAT (15% / 18%)</option>
              <option value="Zero Rated">Zero Rated</option>
              <option value="Sales Tax">US Sales Tax</option>
              <option value="GST">GST / HST (Canada / PK)</option>
            </select>
          </label>

          <label>
            Account Status
            <select value={form.status} onChange={e => field('status', e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <label className="col-span-2">
            Description / Remarks
            <textarea
              value={form.description || ''}
              onChange={e => field('description', e.target.value)}
              placeholder="Describe the business purpose and posting rules for this account..."
              style={{ width: '100%', minHeight: 65, border: '1px solid var(--color-border)', borderRadius: 8, padding: 8, fontSize: 12, resize: 'none' }}
            />
          </label>
        </div>

        {/* Derived Attributes & Options */}
        <div className="mt-4 pt-3 border-t border-border space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/40 rounded-xl border border-border">
            <div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase block">Hierarchy Level</span>
              <span className="font-semibold text-foreground text-xs">{calculatedLevel}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground font-bold uppercase block">Normal Balance</span>
              <span className={`font-bold text-xs ${calculatedNormalBalance === 'Debit' ? 'text-blue-600' : 'text-emerald-600'}`}>{calculatedNormalBalance}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="check flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={form.allowManualJournal}
                onChange={e => field('allowManualJournal', e.target.checked)}
              />
              Allow Manual General Journal Postings & Adjustments
            </label>
            <label className="check flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={form.reconciliationEnabled}
                onChange={e => field('reconciliationEnabled', e.target.checked)}
              />
              Enable Periodic Bank & Ledger Reconciliation
            </label>
            {editing && (
              <label className="check flex items-center gap-2 cursor-pointer font-bold text-amber-700 dark:text-amber-300">
                <input
                  type="checkbox"
                  checked={form.isSystem}
                  onChange={e => field('isSystem', e.target.checked)}
                />
                🔒 Protect Account Security (Lock as Core ERP Control Ledger)
              </label>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary" onClick={close}>Cancel</button>
          <button className="primary" disabled={!isCodeValid || !form.name.trim()}>
            {editing ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
