import React, { useEffect, useState } from 'react';
import { useCreditNotesStore } from './stores/useCreditNotesStore';
import { useCustomersStore, useCoaStore } from './stores';
import { useToastManager } from '@/components/ui/toast';

function CreditNotesWorkspace() {
  const { creditNotes, fetchAll, create, post, void: voidNote, loading, error } = useCreditNotesStore();
  const { toast } = useToastManager();
  const customers = useCustomersStore((s) => s.customers as any[]);
  const companies = useCoaStore((s) => s.accounts as any[]);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    companyId: '',
    customerId: '',
    reason: '',
    amount: 0,
    tax: 0,
    memo: ''
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
        reason: form.reason,
        amount: Number(form.amount),
        tax: Number(form.tax),
        memo: form.memo
      });
      setShowCreate(false);
      toast({ title: '✓ Credit Note created successfully!' });
    } catch (err) {
      toast({ title: 'Error creating Credit Note', variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  return (
    <div className="credit-notes-workspace glass">
      <header className="workspace-header">
        <h2>Credit Notes</h2>
        <button className="primary" onClick={() => setShowCreate(true)}>
          ＋ Create Credit Note
        </button>
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
          {creditNotes.map((cn) => (
            <tr key={cn.id} className={cn.isPosted ? 'posted' : cn.isVoided ? 'voided' : ''}>
              <td>{formatDate(cn.createdAt)}</td>
              <td>{cn.customerId}</td>
              <td>{cn.reason}</td>
              <td>{cn.amount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
              <td>{cn.isVoided ? 'Voided' : cn.isPosted ? 'Posted' : 'Draft'}</td>
              <td>
                {!cn.isPosted && !cn.isVoided && (
                  <button className="action" onClick={() => post(cn.id)} title="Post">
                    📤
                  </button>
                )}
                {!cn.isVoided && (
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
                Reason
                <input required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </label>
              <label>
                Amount
                <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
              </label>
              <label>
                Tax
                <input type="number" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} />
              </label>
              <label>
                Memo
                <textarea value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} />
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