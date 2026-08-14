import React, { useState, useEffect, useMemo } from 'react';
import { accountingApi, type BudgetRecord, type BudgetInput } from './api/modules/accounting.api';
import { useCoaStore } from './stores';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Pencil, Trash2, Target } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';

interface BudgetsViewProps {
  activeEntityId: string;
  entities: Entity[];
}

const PERIOD_TYPES = ['Monthly', 'Quarterly', 'Yearly'] as const;
const STATUSES = ['Draft', 'Active', 'Locked'] as const;

export const BudgetsView: React.FC<BudgetsViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const accounts = useCoaStore(s => s.accounts);
  const fetchAccounts = useCoaStore(s => s.fetchAccounts);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetRecord | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [yearFilter, setYearFilter] = useState('');

  const [form, setForm] = useState({
    budgetName: '',
    accountId: '',
    amount: '',
    fiscalYear: String(new Date().getFullYear()),
    periodType: 'Monthly' as BudgetInput['periodType'],
    status: 'Draft' as BudgetInput['status'],
  });
  const [varianceModal, setVarianceModal] = useState<{ budget: BudgetRecord; variance: any } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (activeEntityId) params.companyId = activeEntityId;
      if (yearFilter) params.fiscalYear = yearFilter;
      const data = await accountingApi.getBudgets(params);
      setBudgets(data || []);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    fetchAccounts();
  }, [activeEntityId, yearFilter]);

  const openCreate = () => {
    setEditing(null);
    setFormError('');
    setForm({
      budgetName: '',
      accountId: accounts[0]?.id || '',
      amount: '',
      fiscalYear: String(new Date().getFullYear()),
      periodType: 'Monthly',
      status: 'Draft',
    });
    setIsModalOpen(true);
  };

  const openEdit = (b: BudgetRecord) => {
    setEditing(b);
    setFormError('');
    setForm({
      budgetName: b.budgetName,
      accountId: b.accountId,
      amount: String(b.amount),
      fiscalYear: String(b.fiscalYear),
      periodType: (b.periodType as BudgetInput['periodType']) || 'Monthly',
      status: (b.status as BudgetInput['status']) || 'Draft',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amt = parseFloat(form.amount);
    if (!form.budgetName.trim()) { setFormError('Budget name is required.'); return; }
    if (!form.accountId) { setFormError('Select a budget account.'); return; }
    if (isNaN(amt) || amt <= 0) { setFormError('Amount must be greater than zero.'); return; }
    if (!form.fiscalYear || isNaN(parseInt(form.fiscalYear))) { setFormError('Fiscal year is required.'); return; }

    const payload: BudgetInput = {
      budgetName: form.budgetName.trim(),
      accountId: form.accountId,
      amount: amt,
      fiscalYear: parseInt(form.fiscalYear),
      periodType: form.periodType,
      status: form.status,
      companyId: activeEntityId || undefined,
    };

    setSaving(true);
    try {
      if (editing) {
        await accountingApi.updateBudget(editing.id, payload);
      } else {
        await accountingApi.createBudget(payload);
      }
      setIsModalOpen(false);
      await load();
    } catch (err: any) {
      setFormError(err?.data?.error || err?.data?.message || err?.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (b: BudgetRecord) => {
    if (!window.confirm(`Delete budget "${b.budgetName}" for FY${b.fiscalYear}?`)) return;
    try {
      await accountingApi.deleteBudget(b.id);
      await load();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to delete budget.');
    }
  };

  const openVariance = async (b: BudgetRecord) => {
    try {
      const variance = await accountingApi.getBudgetVariance(activeEntityId, b.fiscalYear);
      const match = variance.find((v: any) => v.Id === b.id);
      if (match) {
        setVarianceModal({ budget: b, variance: match });
      }
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to load variance.');
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return budgets;
    const q = query.toLowerCase();
    return budgets.filter(b =>
      b.budgetName.toLowerCase().includes(q) ||
      (b.accountName || '').toLowerCase().includes(q) ||
      (b.accountCode || '').toLowerCase().includes(q)
    );
  }, [budgets, query]);

  const totalBudget = budgets.reduce((s, b) => s + (b.amount || 0), 0);

  const exportHeaders = ['Budget', 'Account Code', 'Account Name', 'Fiscal Year', 'Period Type', 'Amount', 'Status'];
  const exportRows = filtered.map(b => [b.budgetName, b.accountCode, b.accountName, b.fiscalYear, b.periodType, b.amount, b.status]);

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Target className="w-4 h-4 text-indigo-600" /> Accounting & Finance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Budgets</h1>
          <p className="text-xs text-slate-500">
            Annual budgets by account for {currentEntity?.name || 'Active Entity'}, enabling variance analysis
            against posted actuals (managerial accounting, IAS 1 / IFRS disclosures).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataToolbar
            exportFileName="budgets"
            exportSheetName="Budgets"
            exportTitle="Budgets"
            exportSubtitle={`Annual budgets by account for ${currentEntity?.name || 'Active Entity'}.`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Budget', value: totalBudget }]}
            onRefresh={load}
          />
          <Button size="sm" onClick={openCreate} className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b] hover:bg-[#0f3222]">
            <Plus className="w-4 h-4" /> Create Budget
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search budget, account..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 h-9 bg-white text-xs" />
        </div>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none">
          <option value="">All Fiscal Years</option>
          {[...new Set(budgets.map(b => b.fiscalYear))].sort().reverse().map(y => <option key={y} value={String(y)}>FY {y}</option>)}
        </select>
        <span className="ml-auto text-xs font-semibold text-slate-600">Total Budgeted: <span className="font-mono text-slate-900">{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading budgets…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">BUDGET NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ACCOUNT</TableHead>
              <TableHead className="w-24 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">AMOUNT</TableHead>
              <TableHead className="w-20 text-[11px] font-bold text-slate-500 uppercase tracking-wider">FY</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">PERIOD</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
              <TableHead className="w-28 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No budgets defined yet. Use "Create Budget" to set annual targets by account.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(b => (
              <TableRow key={b.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3 pl-4 text-xs font-bold text-slate-800">{b.budgetName}</TableCell>
                <TableCell className="py-3 text-xs">
                  <span className="font-mono font-bold text-slate-800">{b.accountCode}</span>
                  <span className="text-slate-500"> — {b.accountName}</span>
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-800">{b.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="py-3 font-mono text-xs text-slate-600">{b.fiscalYear}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{b.periodType}</TableCell>
                <TableCell className="py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${b.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : b.status === 'Locked' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{b.status}</span>
                </TableCell>
                <TableCell className="py-3 pr-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button size="icon" variant="ghost" onClick={() => openVariance(b)} className="h-7 w-7" title="View Variance">
                      <Target className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(b)} className="h-7 w-7" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(b)} className="h-7 w-7 text-rose-600 hover:text-rose-700" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleSubmit}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">BUDGETING</p>
                <h2>{editing ? 'Edit Budget' : 'Create Budget'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="form-grid">
              {formError && <p className="error" style={{ gridColumn: '1 / -1', color: '#c25c5c', fontSize: 13, marginBottom: 10 }}>{formError}</p>}
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Budget Name</label>
                <Input required placeholder="e.g. Marketing FY2026" value={form.budgetName} onChange={e => setForm({ ...form, budgetName: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Budget Account</label>
                <select value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
                  <option value="">— Select Account —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount</label>
                <Input required type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="h-9 text-xs font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Fiscal Year</label>
                <Input required type="number" value={form.fiscalYear} onChange={e => setForm({ ...form, fiscalYear: e.target.value })} className="h-9 text-xs font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Period Type</label>
                <select value={form.periodType} onChange={e => setForm({ ...form, periodType: e.target.value as BudgetInput['periodType'] })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                  {PERIOD_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as BudgetInput['status'] })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="primary btn-finalize" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Budget' : 'Create Budget'}</button>
            </div>
          </form>
        </div>
      )}

      {varianceModal && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">BUDGETING</p>
                <h2>Variance Analysis — {varianceModal.budget.budgetName} (FY{varianceModal.budget.fiscalYear})</h2>
              </div>
              <button type="button" className="close" onClick={() => setVarianceModal(null)}>×</button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Budgeted</div>
                  <div className="text-xl font-bold text-slate-800">{varianceModal.variance.BudgetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Actual</div>
                  <div className="text-xl font-bold text-slate-800">{varianceModal.variance.ActualAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Variance</div>
                  <div className={`text-xl font-bold ${varianceModal.variance.Variance >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {varianceModal.variance.Variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Variance %</div>
                  <div className={`text-xl font-bold ${varianceModal.variance.VariancePct >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {varianceModal.variance.VariancePct.toFixed(2)}%
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">Period</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Budget</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Actual</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Variance</TableHead>
                    <TableHead className="text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Variance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {varianceModal.variance.PeriodActuals.map((p: any) => (
                    <TableRow key={p.Period}>
                      <TableCell className="py-3 pl-4 font-mono text-xs text-slate-600">
                        {varianceModal.budget.periodType === 'Monthly' ? `Month ${p.Period}` :
                         varianceModal.budget.periodType === 'Quarterly' ? `Q${p.Period}` : 'Annual'}
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs">{p.Budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs">{p.Actual.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs">{p.Variance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="py-3 text-right font-mono text-xs">
                        {p.Budget !== 0 ? ((p.Variance / p.Budget) * 100).toFixed(2) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary btn-cancel" onClick={() => setVarianceModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);