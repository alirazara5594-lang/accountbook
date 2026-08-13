import React, { useEffect, useState, useMemo } from 'react';
import { useCreditNotesStore } from './stores/useCreditNotesStore';
import { useCustomersStore, useCoaStore } from './stores';
import { DataToolbar } from '@/components/ui/data-toolbar';

function CreditNotesWorkspace() {
  const { creditNotes, fetchAll, create, post, void: voidNote, loading, error } = useCreditNotesStore();

  const notify = (m: string) => alert(m);
  const customers = useCustomersStore((s) => s.customers as any[]);
  const companies = useCoaStore((s) => s.accounts as any[]);

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
    fetchAll();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({
        companyId: form.companyId,
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
    <div className="credit-notes-workspace glass">
      <header className="workspace-header">
        <h2>Credit Notes</h2>
        <div className="flex items-center gap-2">
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
            onRefresh={() => fetchAll()}
          />
          <button className="primary" onClick={() => setShowCreate(true)}>
            ＋ Create Credit Note
          </button>
        </div>
      </header>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      <table className="credit-notes-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>Reason</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((cn) => (
            <tr key={cn.id} className={cn.status === 'Posted' ? 'posted' : cn.status === 'Void' ? 'voided' : ''}>
              <td>{formatDate(cn.creditNoteDate || cn.createdAt)}</td>
              <td>{cn.customerId}</td>
              <td>{cn.notes || '—'}</td>
              <td>{cn.totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
              <td>{cn.status === 'Void' ? 'Voided' : cn.status === 'Posted' ? 'Posted' : 'Draft'}</td>
              <td>
                {cn.status === 'Draft' && (
                  <button className="action" onClick={() => post(cn.id)} title="Post">
                    📤
                  </button>
                )}
                {cn.status !== 'Void' && (
                  <button className="action" onClick={() => voidNote(cn.id)} title="Void">
                    🗑️
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Credit Note</h3>
            <form onSubmit={handleCreate} className="modal-form">
              <label>
                Company *
                <select required value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
                  <option value="">-- Select Company --</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Customer *
                <select required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.customerNumber})</option>
                  ))}
                </select>
              </label>
              <label>
                Date *
                <input type="date" required value={form.creditNoteDate} onChange={(e) => setForm({ ...form, creditNoteDate: e.target.value })} />
              </label>
              <label>
                Reason / Notes
                <input required value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </label>
              <label>
                Amount
                <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </label>
              <label>
                Tax
                <input type="number" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} />
              </label>
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreditNotesWorkspace;