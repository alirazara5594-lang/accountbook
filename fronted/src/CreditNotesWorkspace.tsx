import React, { useEffect, useState, useMemo } from 'react';
import { useCreditNotesStore } from './stores/useCreditNotesStore';
import { useCustomersStore, useCompanyStore } from './stores';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { money } from '@/lib/currency';
import { Plus, X, Send, Trash2, FileText } from 'lucide-react';

function CreditNotesWorkspace() {
  const { creditNotes, fetchAll, create, post, void: voidNote } = useCreditNotesStore();

  const notify = (m: string) => alert(m);
  const customers = useCustomersStore((s) => s.customers as any[]);
  const { entities: companies, fetchCompanies, activeEntityId } = useCompanyStore();

  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({
    companyId: '',
    customerId: '',
    creditNoteDate: new Date().toISOString().slice(0, 10),
    notes: '',
    amount: 0,
    tax: 0
  });

  useEffect(() => {
    fetchCompanies();
    fetchAll(activeEntityId);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({
        companyId: form.companyId || activeEntityId,
        customerId: form.customerId,
        creditNoteDate: form.creditNoteDate,
        notes: form.notes,
        lines: [{
          description: form.notes || 'Credit Note',
          quantity: 1,
          unitPrice: Number(form.amount),
          discountAmount: 0,
          taxAmount: Number(form.tax)
        }]
      });
      setShowCreate(false);
      setForm({ companyId: '', customerId: '', creditNoteDate: new Date().toISOString().slice(0, 10), notes: '', amount: 0, tax: 0 });
      notify('✓ Credit Note created successfully!');
    } catch {
      notify('Error creating Credit Note');
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  const filtered = useMemo(() => {
    if (!query.trim()) return creditNotes;
    const q = query.toLowerCase();
    return creditNotes.filter((cn: any) =>
      (cn.customerId || '').toLowerCase().includes(q) ||
      (cn.notes || '').toLowerCase().includes(q) ||
      (cn.status || '').toLowerCase().includes(q)
    );
  }, [creditNotes, query]);

  const exportHeaders = ['Date', 'Customer', 'Reason', 'Amount', 'Status'];
  const exportRows = filtered.map((cn: any) => [formatDate(cn.creditNoteDate || cn.createdAt), cn.customerId, cn.notes || '', cn.totalAmount, cn.status]);
  const totalCredit = filtered.reduce((s: number, cn: any) => s + (cn.totalAmount || 0), 0);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-lg">📝</span> Credit Notes
          </h1>
          <p className="text-gray-500 text-[10px] mt-0.5">Issue credit notes to customers for returns, adjustments, or refunds.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search customer, reason, status..."
            exportFileName="credit-notes"
            exportSheetName="Credit Notes"
            exportTitle="Credit Notes"
            exportSubtitle="Customer credit notes with draft → posted lifecycle."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Credit', value: totalCredit }]}
            onRefresh={() => fetchAll(activeEntityId)}
          />
          <button
            onClick={() => setShowCreate(true)}
            className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Create Credit Note
          </button>
        </div>
      </div>

      {/* Stats */}
      <section className="stats">
        <article>
          <span className="stat-icon blue"><FileText className="w-4 h-4" /></span>
          <div>
            <small>TOTAL CREDIT NOTES</small>
            <h2>{creditNotes.length}</h2>
            <p>All issued notes</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><span className="text-sm">📝</span></span>
          <div>
            <small>DRAFT NOTES</small>
            <h2>{creditNotes.filter((cn: any) => cn.status === 'Draft').length}</h2>
            <p>Awaiting posting</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><span className="text-sm">✅</span></span>
          <div>
            <small>POSTED NOTES</small>
            <h2>{creditNotes.filter((cn: any) => cn.status === 'Posted').length}</h2>
            <p>Applied to accounts</p>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><span className="text-sm">💰</span></span>
          <div>
            <small>TOTAL CREDIT VALUE</small>
            <h2>{money(totalCredit)}</h2>
            <p>Outstanding credit</p>
          </div>
        </article>
      </section>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-[10px] uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-4">Date</th>
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Reason</th>
              <th className="py-2.5 px-4 text-right">Amount</th>
              <th className="py-2.5 px-4 text-center">Status</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((cn: any) => (
              <tr key={cn.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 px-4 text-gray-600">{formatDate(cn.creditNoteDate || cn.createdAt)}</td>
                <td className="py-2.5 px-4 font-medium text-gray-900">{cn.customerId}</td>
                <td className="py-2.5 px-4 text-gray-600">{cn.notes || '—'}</td>
                <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                  {money(cn.totalAmount)}
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    cn.status === 'Posted' ? 'bg-emerald-100 text-emerald-700' :
                    cn.status === 'Void' ? 'bg-rose-100 text-rose-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {cn.status === 'Void' ? 'Voided' : cn.status === 'Posted' ? 'Posted' : 'Draft'}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {cn.status === 'Draft' && (
                      <button
                        onClick={() => post(cn.id)}
                        className="h-6 px-2 text-[10px] font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center gap-1"
                        title="Post"
                      >
                        <Send className="w-3 h-3" /> Post
                      </button>
                    )}
                    {cn.status !== 'Void' && (
                      <button
                        onClick={() => voidNote(cn.id)}
                        className="h-6 px-2 text-[10px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md flex items-center gap-1"
                        title="Void"
                      >
                        <Trash2 className="w-3 h-3" /> Void
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📝</span>
                    <p className="text-sm font-semibold">No credit notes found</p>
                    <p className="text-[10px]">Create a credit note to get started.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Credit Note Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-lg">📝</span> Create Credit Note
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">Issue a credit note to adjust customer balance</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Company */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Company *</label>
                  <select
                    required
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400"
                  >
                    <option value="">Select company</option>
                    {companies.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Credit Note Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Credit Note Date *</label>
                  <input
                    type="date"
                    required
                    value={form.creditNoteDate}
                    onChange={(e) => setForm({ ...form, creditNoteDate: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Customer */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Customer *</label>
                <select
                  required
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400"
                >
                  <option value="">Select customer</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Reason / Notes *</label>
                <input
                  required
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Product return, pricing adjustment..."
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400 placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Credit Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400 placeholder:text-gray-400"
                  />
                </div>

                {/* Tax */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Tax Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.tax || ''}
                    onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })}
                    placeholder="0.00"
                    className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-blue-400 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Total Preview */}
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">{money(form.amount || 0)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">Tax</span>
                  <span className="font-semibold">{money(form.tax || 0)}</span>
                </div>
                <div className="flex justify-between text-xs mt-2 pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-700">Total Credit</span>
                  <span className="font-bold text-blue-600">{money((form.amount || 0) + (form.tax || 0))}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="h-8 px-4 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" /> Create Credit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreditNotesWorkspace;
