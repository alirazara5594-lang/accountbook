import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { ReceiptText, Plus, Search } from 'lucide-react';
import type { Entity } from './EntitySettings';
import { useCoaStore, useExpenseClaimsStore } from './stores';

export const ExpenseClaimsView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const { claims, fetchClaims, createClaim, setStatus } = useExpenseClaimsStore();
  const accounts = useCoaStore((s) => s.accounts);
  const fetchAccounts = useCoaStore((s) => s.fetchAccounts);
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeName: '', department: '', date: new Date().toISOString().slice(0, 10), category: 'Travel', amount: '', notes: '', accountId: '' });

  useEffect(() => { fetchClaims(activeEntityId); fetchAccounts(); }, [activeEntityId]);

  const expenseAccounts = accounts.filter(a => a.type === 'Expense' && a.status === 'Active');
  const filtered = useMemo(() => claims.filter(c => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return c.claimNumber.toLowerCase().includes(q) || c.employeeName.toLowerCase().includes(q) || c.department.toLowerCase().includes(q) || c.status.toLowerCase().includes(q);
  }), [claims, query]);
  const exportRows = filtered.map(c => [c.claimNumber, c.date, c.employeeName, c.department, c.totalAmount, c.currency, c.status, c.notes || '']);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return alert('Enter a valid expense amount.');
    await createClaim({
      employeeName: form.employeeName || 'Employee',
      department: form.department || 'General',
      date: form.date,
      currency: 'USD',
      notes: form.notes,
      companyId: activeEntityId,
      lines: [{ accountId: form.accountId || undefined, category: form.category, description: form.notes || form.category, amount, currency: 'USD' }],
    });
    setForm({ employeeName: '', department: '', date: new Date().toISOString().slice(0, 10), category: 'Travel', amount: '', notes: '', accountId: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold"><ReceiptText className="w-4 h-4 text-emerald-600" /> Procurement</div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Expense Claims</h1>
          <p className="text-xs text-slate-500">Employee reimbursement claims for {currentEntity?.name || 'Active Entity'}.</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="h-9 gap-1.5 text-xs"><Plus className="w-4 h-4" /> New Claim</Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-white border border-slate-200 rounded-xl">
          <Input placeholder="Employee name" value={form.employeeName} onChange={e => setForm({ ...form, employeeName: e.target.value })} />
          <Input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
          <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <select value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })} className="h-10 border rounded-md px-3 text-sm">
            <option value="">Default expense account</option>
            {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
          </select>
          <Input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <Input type="number" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          <Input className="md:col-span-2" placeholder="Notes / receipt details" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" className="h-10 text-xs">Submit Claim</Button>
        </form>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative w-80"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input className="pl-9 h-9 text-xs" placeholder="Search claims..." value={query} onChange={e => setQuery(e.target.value)} /></div>
        <DataToolbar exportFileName="expense-claims" exportSheetName="Expense Claims" exportTitle="Expense Claims" exportHeaders={['Claim #', 'Date', 'Employee', 'Department', 'Amount', 'Currency', 'Status', 'Notes']} exportRows={exportRows} />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <Table><TableHeader><TableRow><TableHead>Claim #</TableHead><TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Department</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map(c => <TableRow key={c.id}><TableCell className="font-mono font-bold text-xs">{c.claimNumber}</TableCell><TableCell>{c.date}</TableCell><TableCell>{c.employeeName}</TableCell><TableCell>{c.department}</TableCell><TableCell className="text-right font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: c.currency }).format(c.totalAmount)}</TableCell><TableCell><Badge variant="outline">{c.status}</Badge></TableCell><TableCell className="text-right space-x-2">{c.status === 'Submitted' && <Button size="sm" variant="outline" onClick={() => setStatus(c.id, 'Approved', activeEntityId)}>Approve</Button>}{c.status === 'Approved' && <Button size="sm" onClick={() => setStatus(c.id, 'Paid', activeEntityId)}>Pay & Post</Button>}</TableCell></TableRow>)}</TableBody></Table>
      </div>
    </div>
  );
};
