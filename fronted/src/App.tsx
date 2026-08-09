import { useEffect, useState, useMemo } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import Intercompany from './Intercompany'
import EntitySettings, { type Entity } from './EntitySettings'
import CustomerManagement from './CustomerManagement'
import ProductsAndServices from './ProductsAndServices'
import VendorManagement from './VendorManagement'
import { ProcurementWorkspace } from './ProcurementWorkspace'
import { FixedAssets } from './FixedAssets'
import { AssetsInventoryWorkspace } from './AssetsInventoryWorkspace'
import { TaxConfiguration } from './TaxConfiguration'
import { SalesWorkspace } from './SalesWorkspace'
import { EstimatesAndQuotes } from './EstimatesAndQuotes'
import { ChartOfAccounts } from './ChartOfAccounts'
import { FinancialReports } from './FinancialReports'
import { ModuleSummary } from './ModuleSummary'

type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'ContraAsset' | 'ContraLiability' | 'ContraEquity' | 'ContraRevenue' | 'ContraExpense'
type Account = { id: string; code: string; name: string; type: AccountType; parentId?: string; status: 'Active' | 'Inactive'; openingBalance: number; reconciliationEnabled: boolean; ifrsTag?: string; gaapTag?: string; updatedAt: string }
type Journal = { id: string; date: string; reference: string; description: string; lines: { accountId: string; debit: number; credit: number }[] }
type Allocation = { id: string; name: string; sourceCompanyId: string; category: string; frequency: string; rate: number; quantity: number; status: string; recipients: { companyId: string; sharePercent: number }[] }
const api = 'http://localhost:5124/api/v1'
const accountTypes: AccountType[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense', 'ContraAsset', 'ContraLiability', 'ContraEquity', 'ContraRevenue', 'ContraExpense']
const blank = { code: '', name: '', type: 'Asset' as AccountType, parentId: '', openingBalance: '0', reconciliationEnabled: false, ifrsTag: '', gaapTag: '' }

function money(value: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value) }

const NAVIGATION = [
  { name: 'Overview', icon: '▦', items: ['Dashboard'] },
  { name: 'Sales & Customers', icon: '☖', items: ['Customers', 'Products & Services', 'Sales Workspace', 'Estimates & Quotes', 'Sales Orders', 'Credit Notes', 'Customer Payments', 'Customer Statements', 'Sales Reports'] },
  { name: 'Procurement', icon: '⇡', items: ['Vendors', 'Procurement Workspace', 'Bills', 'Debit Notes', 'Expense Claims', 'Vendor Payments', 'Vendor Statements', 'Payables Aging', 'Purchase Reports'] },
  { name: 'Banking & Payments', icon: '🏛', items: ['Bank Accounts', 'Cash Accounts', 'Transactions', 'Bank Reconciliation', 'Payments', 'Receipts', 'Transfers', 'Cash Flow'] },
  { name: 'Accounting', icon: '⌘', items: ['Chart of Accounts', 'Journal Entries', 'Fixed Assets', 'General Ledger', 'Accounts Receivable', 'Accounts Payable', 'Tax Accounting', 'Budgets', 'Financial Reports', 'Period Closing', 'Audit Trail'] },
  { name: 'Assets & Inventory', icon: '📦', items: ['Assets & Inventory Workspace', 'Depreciation Schedule', 'Valuation Reports'] },
  { name: 'Payroll & HR', icon: '👥', items: ['Employees', 'Attendance', 'Leave', 'Payroll', 'Salary', 'Loans & Advances', 'HR Reports'] },
  { name: 'Survey & Field Operations', icon: '📍', items: ['Surveys', 'Field Visits', 'Inspections', 'Work Orders', 'Field Expenses', 'Field Reports'] },
  { name: 'Government Compliance', icon: '⚖', items: ['Tax Management', 'VAT / Sales Tax', 'Withholding Tax', 'Tax Returns', 'E-Invoicing', 'Compliance Reports'] },
  { name: 'Projects', icon: '🏗', items: ['Projects', 'Project Planning', 'Tasks', 'Project Budget', 'Project Costing', 'Timesheets', 'Project Billing', 'Project Expenses', 'Project Profitability', 'Reports'] },
  { name: 'AI & Analytics', icon: '✨', items: ['Analytics Dashboard', 'Financial Analytics', 'Sales Analytics', 'Expense Analytics', 'Cash Flow Analytics', 'Inventory Analytics', 'Forecasting', 'AI Insights'] },
  { name: 'Administration', icon: '⚙', items: ['Users', 'Roles & Permissions', 'Companies', 'Branches', 'Approval Workflows', 'System Settings', 'Number Series', 'Currency', 'Tax Configuration', 'Audit Logs'] }
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
  const [settingsView, setSettingsView] = useState<'home' | 'entities'>('home')
  const [entities, setEntities] = useState<Entity[]>([])
  const [activeEntityId, setActiveEntityId] = useState(() => {
    return localStorage.getItem('active_entity_id') || '';
  });

  useEffect(() => {
    localStorage.setItem('last_active_page', page);
  }, [page]);

  useEffect(() => {
    localStorage.setItem('open_groups', JSON.stringify(openGroups));
  }, [openGroups]);

  useEffect(() => {
    if (activeEntityId) {
      localStorage.setItem('active_entity_id', activeEntityId);
    }
  }, [activeEntityId]);
  const [accounts, setAccounts] = useState<Account[]>([])
  const [entries, setEntries] = useState<Journal[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [form, setForm] = useState(blank)
  const [toast, setToast] = useState('')
  const [journal, setJournal] = useState({ date: new Date().toISOString().slice(0, 10), reference: '', description: '', lines: [{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }] })
  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(''), 3500) }
  const load = async () => { try { const [a, e, i, c] = await Promise.all([fetch(`${api}/chart-of-accounts`).then(r => r.json()), fetch(`${api}/journal-entries`).then(r => r.json()), fetch(`${api}/intercompany-allocations`).then(r => r.json()), fetch(`${api}/companies`).then(r => r.json())]); setAccounts(a); setEntries(e); setAllocations(i); setEntities(c); setActiveEntityId(current => current || c[0]?.id || '') } catch { notify('API unavailable. Start the backend on port 5124.') } }
  useEffect(() => { load() }, [])
  const stats = { bank: accounts.filter(a => a.reconciliationEnabled).reduce((sum, a) => sum + a.openingBalance, 0), active: accounts.filter(a => a.status === 'Active').length, entries: entries.length }
  const openCreate = async () => { setEditing(null); setForm(blank); setModal(true) }
  const openEdit = (a: Account) => { setEditing(a); setForm({ code: a.code, name: a.name, type: a.type, parentId: a.parentId || '', openingBalance: String(a.openingBalance), reconciliationEnabled: a.reconciliationEnabled, ifrsTag: a.ifrsTag || '', gaapTag: a.gaapTag || '' }); setModal(true) }
  const saveAccount = async (e: FormEvent) => { e.preventDefault(); const body = { ...form, parentId: form.parentId || null, openingBalance: Number(form.openingBalance), openingBalanceDate: Number(form.openingBalance) ? new Date().toISOString().slice(0, 10) : null, gaapTag: form.gaapTag || null, customFields: {} }; const url = editing ? `${api}/chart-of-accounts/${editing.id}` : `${api}/chart-of-accounts`; const response = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!response.ok) { notify((await response.json()).message || 'Could not save account'); return } setModal(false); notify(editing ? 'Account updated' : 'Account created'); load() }
  const toggleStatus = async (a: Account) => { const response = await fetch(`${api}/chart-of-accounts/${a.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: a.status === 'Active' ? 'Inactive' : 'Active', reason: 'Updated from workspace' }) }); if (!response.ok) notify((await response.json()).message); else { notify(`Account ${a.status === 'Active' ? 'deactivated' : 'activated'}`); load() } }
  const postJournal = async (e: FormEvent) => { e.preventDefault(); const lines = journal.lines.map(x => ({ accountId: x.accountId, debit: Number(x.debit || 0), credit: Number(x.credit || 0), memo: null })); const response = await fetch(`${api}/journal-entries`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...journal, lines }) }); if (!response.ok) { notify((await response.json()).message); return } notify('Balanced journal draft created'); setJournal({ date: new Date().toISOString().slice(0, 10), reference: '', description: '', lines: [{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }] }); load() }
  const handleGroupClick = (groupName: string) => {
    setOpenGroups(curr => curr.includes(groupName) ? [] : [groupName]);
    setPage(`${groupName}.Summary`);
  }
  const activeEntity = entities.find(x => x.id === activeEntityId)
  const activeViewMap: Record<string, string> = {
    'Overview.Dashboard': 'dashboard',
    'Overview.Summary': 'dashboard',
    'Sales & Customers.Summary': 'module-summary',
    'Sales & Customers.Customers': 'customers',
    'Sales & Customers.Products & Services': 'products',
    'Sales & Customers.Sales Workspace': 'sales-workspace',
    'Sales & Customers.Estimates & Quotes': 'estimates-quotes',
    'Procurement.Summary': 'module-summary',
    'Procurement.Vendors': 'vendors',
    'Procurement.Procurement Workspace': 'procurement-workspace',
    'Banking & Payments.Summary': 'module-summary',
    'Accounting.Summary': 'module-summary',
    'Accounting.Chart of Accounts': 'accounts',
    'Accounting.Journal Entries': 'journal',
    'Accounting.Fixed Assets': 'fixed-assets',
    'Accounting.Financial Reports': 'financial-reports',
    'Assets & Inventory.Summary': 'module-summary',
    'Assets & Inventory.Assets & Inventory Workspace': 'assets-inventory',
    'Payroll & HR.Summary': 'module-summary',
    'Survey & Field Operations.Summary': 'module-summary',
    'Government Compliance.Summary': 'module-summary',
    'Projects.Summary': 'module-summary',
    'AI & Analytics.Summary': 'module-summary',
    'Administration.Summary': 'module-summary',
    'Administration.System Settings': 'settings',
    'Administration.Tax Configuration': 'taxes'
  }
  const activeView = activeViewMap[page] || 'placeholder'
  const [group, module] = page.split('.')

  return <div className="app"><aside><div className="brand"><b>account</b><span>book</span></div><div className="company"><div className="avatar">AC</div><div><strong>{activeEntity?.name || 'Select entity'}</strong><small>Active accounting books</small></div></div>
  <nav>
    {NAVIGATION.map(group => {
      const isOpen = openGroups.includes(group.name);
      return (
        <div className="nav-group" key={group.name}>
          <button className={'nav nav-group-toggle ' + (page.startsWith(group.name + '.') ? 'active' : '')} onClick={() => handleGroupClick(group.name)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}><span>{group.icon}</span>{group.name}</div>
            <span className="chevron">{isOpen ? '▾' : '▸'}</span>
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
  </nav><div className="bottom"><div className="user"><div className="avatar small">MA</div><div><strong>Muhammad Ali</strong><small>Finance admin</small></div></div></div></aside><main><header><div><p className="eyebrow">{group.toUpperCase()}</p><h1>{module}</h1></div><label className="entity-picker">Working in<select value={activeEntityId} onChange={e => setActiveEntityId(e.target.value)}>{entities.map(x => <option key={x.id} value={x.id}>{x.name}{x.code ? ` · ${x.code}` : ''}</option>)}</select></label>{activeView === 'journal' && <button className="primary" onClick={() => document.getElementById('journal-form')?.scrollIntoView({ behavior: 'smooth' })}>＋ New entry</button>}</header>
  {activeView === 'dashboard' && <Dashboard stats={stats} entries={entries} accounts={accounts} setPage={setPage} />}
  {activeView === 'module-summary' && <ModuleSummary moduleName={group} accounts={accounts} entries={entries} setPage={setPage} openCreateAccount={openCreate} />}
  {activeView === 'customers' && <CustomerManagement entities={entities} activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'accounts' && <ChartOfAccounts accounts={accounts} edit={openEdit} status={toggleStatus} openCreate={openCreate} setParentIdForNew={(parentId) => setForm(f => ({ ...f, parentId }))} />}
  {activeView === 'journal' && <Journals journal={journal} setJournal={setJournal} accounts={accounts.filter(a => a.status === 'Active')} entries={entries} post={postJournal} />}
  {activeView === 'intercompany' && <Intercompany allocations={allocations} reload={load} notify={notify} />}
  {activeView === 'settings' && settingsView === 'home' && <SettingsHome openEntities={() => setSettingsView('entities')} />}
  {activeView === 'settings' && settingsView === 'entities' && <EntitySettings entities={entities} selectedId={activeEntityId} select={setActiveEntityId} reload={load} notify={notify} />}
  {activeView === 'products' && <ProductsAndServices notify={notify} activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'vendors' && <VendorManagement entities={entities} activeEntityId={activeEntityId} notify={notify} />}
  {activeView === 'sales-workspace' && <SalesWorkspace activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'estimates-quotes' && <EstimatesAndQuotes activeEntityId={activeEntityId} />}
  {activeView === 'procurement-workspace' && <ProcurementWorkspace activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'taxes' && <TaxConfiguration />}
  {activeView === 'fixed-assets' && <FixedAssets activeEntityId={activeEntityId} />}
  {activeView === 'assets-inventory' && <AssetsInventoryWorkspace activeEntityId={activeEntityId} entities={entities} />}
  {activeView === 'financial-reports' && <FinancialReports accounts={accounts} entries={entries} activeEntityId={activeEntityId} />}
  {activeView === 'placeholder' && <div style={{ padding: 40, textAlign: 'center', color: '#666' }}><span style={{ fontSize: 48, opacity: 0.2, display: 'block', marginBottom: 20 }}>🏗</span><h3>Under Construction</h3><p>This module ({module}) is part of the layout but not yet developed.</p></div>}
  </main>{modal && <AccountModal form={form} setForm={setForm} accounts={accounts} editing={editing} close={() => setModal(false)} save={saveAccount} />}{toast && <div className="toast">✓ {toast}</div>}</div>
}

function SettingsHome({ openEntities }: { openEntities: () => void }) { return <section className="settings-grid"><button className="settings-card" onClick={openEntities}><span>▦</span><div><strong>Entity management</strong><small>Create entities, manage the hierarchy, and select each entity's books.</small></div><b>→</b></button><button className="settings-card" disabled><span>⌘</span><div><strong>Chart of accounts</strong><small>Account structure and financial reporting settings.</small></div><b>→</b></button></section> }

function Dashboard({ stats, entries, accounts, setPage }: { stats: { bank: number; active: number; entries: number }; entries: Journal[]; accounts: Account[]; setPage: (page: string) => void }) { return <><section className="stats"><article><span className="stat-icon teal">⌁</span><div><small>BANK & CASH</small><h2>{money(stats.bank)}</h2><p>Across reconciled accounts</p></div></article><article><span className="stat-icon blue">⌘</span><div><small>ACTIVE ACCOUNTS</small><h2>{stats.active}</h2><p>In your chart of accounts</p></div></article><article><span className="stat-icon violet">⇄</span><div><small>POSTED ENTRIES</small><h2>{stats.entries}</h2><p>Current accounting period</p></div></article></section><section className="grid"><article className="panel large"><div className="panel-head"><div><h3>Financial position</h3><p>Opening balances by account type</p></div><button className="text-button" onClick={() => setPage('Accounting.Chart of Accounts')}>View accounts →</button></div><div className="bars">{(['Asset','Liability','Equity','Revenue','Expense'] as AccountType[]).map(type => { const balance = accounts.filter(a => a.type === type).reduce((s,a) => s + Math.abs(a.openingBalance), 0); const max = Math.max(...accounts.map(a => Math.abs(a.openingBalance)), 1); return <div className="bar-row" key={type}><span>{type}</span><div className="track"><i style={{ width: `${Math.max(5, balance/max*100)}%` }} /></div><b>{money(balance)}</b></div> })}</div></article><article className="panel"><div className="panel-head"><div><h3>Recent activity</h3><p>Latest journal entries</p></div></div>{entries.length ? entries.slice(0,4).map(e => <div className="activity" key={e.id}><span className="activity-icon">⇄</span><div><strong>{e.description}</strong><small>{e.reference} · {e.date}</small></div></div>) : <div className="empty">No posted entries yet.<button className="link" onClick={() => setPage('Accounting.Journal Entries')}>Create one</button></div>}</article></section></> }

function Journals({ journal, setJournal, accounts, entries, post }: { journal: any; setJournal: any; accounts: Account[]; entries: Journal[]; post: (e: FormEvent) => void }) { const totals = journal.lines.reduce((x: any, l: any) => ({ debit: x.debit + Number(l.debit || 0), credit: x.credit + Number(l.credit || 0) }), { debit: 0, credit: 0 }); const updateLine = (i: number, key: string, value: string) => { const lines = [...journal.lines]; lines[i] = { ...lines[i], [key]: value }; setJournal({ ...journal, lines }) }; return <><form id="journal-form" className="panel entry-form" onSubmit={post}><div className="form-top"><label>Date<input type="date" value={journal.date} onChange={e => setJournal({ ...journal, date: e.target.value })} /></label><label>Reference<input required placeholder="JE-0001" value={journal.reference} onChange={e => setJournal({ ...journal, reference: e.target.value })} /></label><label className="wide">Description<input required placeholder="Describe this transaction" value={journal.description} onChange={e => setJournal({ ...journal, description: e.target.value })} /></label></div><div className="lines">{journal.lines.map((line: any, i: number) => <div className="line" key={i}><select required value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)}><option value="">Select account</option>{accounts.map(a => <option value={a.id} key={a.id}>{a.code} — {a.name}</option>)}</select><input inputMode="decimal" placeholder="Debit" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} /><input inputMode="decimal" placeholder="Credit" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} />{journal.lines.length > 2 && <button type="button" className="remove" onClick={() => setJournal({ ...journal, lines: journal.lines.filter((_: any, index: number) => index !== i) })}>×</button>}</div>)}</div><button type="button" className="text-button" onClick={() => setJournal({ ...journal, lines: [...journal.lines, { accountId: '', debit: '', credit: '' }] })}>＋ Add line</button><div className="entry-footer"><div><span>Debits <b>{money(totals.debit)}</b></span><span>Credits <b>{money(totals.credit)}</b></span>{totals.debit !== totals.credit && <em>Entry must balance</em>}</div><button className="primary" disabled={totals.debit !== totals.credit}>Post entry</button></div></form><section className="panel recent-entries"><div className="panel-head"><div><h3>Posted entries</h3><p>Immutable general ledger transactions</p></div></div>{entries.length ? entries.map(e => <div className="journal-item" key={e.id}><div className="date-box"><b>{new Date(e.date).toLocaleDateString('en-US', { month: 'short' })}</b><span>{new Date(e.date).getDate()}</span></div><div><strong>{e.description}</strong><small>{e.reference} · {e.lines.length} lines</small></div></div>) : <div className="empty">Your posted journals will appear here.</div>}</section></> }
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
  const field = (key: string, value: any) => setForm({ ...form, [key]: value });

  const [subtype, setSubtype] = useState(() => {
    if (editing) {
      return inferSubtype(editing.code, editing.type);
    }
    const initialType = form.type || 'Asset';
    return subtypesMap[initialType]?.[0] || '';
  });

  const fetchNextCode = (type: string, parentId?: string) => {
    if (editing) return;
    fetch(`${api}/chart-of-accounts/next-code?type=${type}&parentId=${parentId || ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.code) {
          setForm((f: any) => ({ ...f, code: data.code }));
        }
      })
      .catch(() => {});
  };

  const handleNameChange = (val: string) => {
    field('name', val);
    if (!editing && !form.code && val.trim().length > 0) {
      fetchNextCode(form.type, form.parentId);
    }
  };

  const handleSubtypeChange = (newSubtype: string) => {
    setSubtype(newSubtype);
    
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

  const activeSubtypes = subtypesMap[form.type] || [];
  const isCodeValid = /^\d{5}$/.test(form.code);

  return <div className="overlay"><form className="modal" onSubmit={save}><div className="modal-head"><div><p className="eyebrow">CHART OF ACCOUNTS</p><h2>{editing ? 'Edit Account' : 'Create 5-Digit Account'}</h2></div><button type="button" className="close" onClick={close}>×</button></div><div className="form-grid"><label>1. 5-Digit Account Code<input required value={form.code} onChange={e => field('code', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="e.g. 11101" className={!isCodeValid && form.code ? 'border-red-500 font-mono font-bold' : 'font-mono font-bold'} /></label><label>2. Account Name<input required value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. HBL Current Account" /></label><label>3. Major Type<select value={form.type} onChange={e => handleTypeChange(e.target.value)}>{accountTypes.map(x => <option key={x}>{x}</option>)}</select></label><label>4. Sub-Type<select value={subtype} onChange={e => handleSubtypeChange(e.target.value)}>{activeSubtypes.map(x => <option key={x} value={x}>{x}</option>)}</select></label><label>5. Parent Account (Financial Reporting Line)<select value={form.parentId} onChange={e => { field('parentId', e.target.value); if (!editing) fetchNextCode(form.type, e.target.value); }}><option value="">No Parent (Top-Level Group Line)</option>{filteredParents.map(a => <option value={a.id} key={a.id}>{a.code} — {a.name}</option>)}</select></label><label>Opening Balance ($)<input type="number" step="0.01" value={form.openingBalance} onChange={e => field('openingBalance', e.target.value)} /></label><label>IFRS Tag<input value={form.ifrsTag} onChange={e => field('ifrsTag', e.target.value)} placeholder="e.g. Cash & Cash Equivalents" /></label><label>GAAP Tag<input value={form.gaapTag} onChange={e => field('gaapTag', e.target.value)} placeholder="e.g. Current Asset" /></label></div><label className="check"><input type="checkbox" checked={form.reconciliationEnabled} onChange={e => field('reconciliationEnabled', e.target.checked)} /> Enable Bank & Ledger Account Reconciliation</label><div className="modal-footer"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={!isCodeValid || !form.name.trim()}>{editing ? 'Save Changes' : 'Create Account'}</button></div></form></div>
}
