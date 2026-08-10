import React, { useState, useEffect } from 'react';

import { API_BASE_URL as api } from './config/api';
function money(v: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v); }

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Sent: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  Void: 'bg-red-100 text-red-600',
  PartiallyPaid: 'bg-yellow-100 text-yellow-700',
  Overdue: 'bg-orange-100 text-orange-700',
};

// ─── Sales Invoices Tab ───────────────────────────────────────────────────────
const SalesInvoicesTab: React.FC<{ activeEntityId: string }> = ({ activeEntityId }) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [postModal, setPostModal] = useState<any>(null);
  const [toast, setToast] = useState('');

  // Form state
  const [form, setForm] = useState({
    customerId: '', invoiceDate: new Date().toISOString().slice(0,10),
    dueDate: new Date(Date.now() + 30*86400000).toISOString().slice(0,10),
    reference: '', notes: ''
  });
  const [lines, setLines] = useState([{ productId: '', description: '', quantity: '1', unitPrice: '0', discountAmount: '0', taxAmount: '0' }]);

  // Post form
  const [postForm, setPostForm] = useState({ arAccId: '', revenueAccId: '', taxLiabilityAccId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inv, cust, prod, acc] = await Promise.all([
        fetch(`${api}/sales-invoices?companyId=${activeEntityId}`).then(r => r.ok ? r.json() : []),
        fetch(`${api}/customers?companyId=${activeEntityId}`).then(r => r.ok ? r.json() : []),
        fetch(`${api}/products`).then(r => r.ok ? r.json() : []),
        fetch(`${api}/chart-of-accounts`).then(r => r.ok ? r.json() : []),
      ]);
      setInvoices(inv); setCustomers(cust); setProducts(prod); setAccounts(acc);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeEntityId]);

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500); };

  const addLine = () => setLines([...lines, { productId: '', description: '', quantity: '1', unitPrice: '0', discountAmount: '0', taxAmount: '0' }]);
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: string, value: string) => {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: value };
    // Auto-fill price from product
    if (field === 'productId' && value) {
      const prod = products.find((p: any) => p.id === value);
      if (prod) updated[i] = { ...updated[i], description: prod.name, unitPrice: String(prod.unitPrice) };
    }
    setLines(updated);
  };

  const subTotal = lines.reduce((s, l) => s + parseFloat(l.quantity||'0') * parseFloat(l.unitPrice||'0'), 0);
  const discountTotal = lines.reduce((s, l) => s + parseFloat(l.discountAmount||'0'), 0);
  const taxTotal = lines.reduce((s, l) => s + parseFloat(l.taxAmount||'0'), 0);

  const saveInvoice = async () => {
    const body = {
      ...form,
      companyId: activeEntityId || null,
      lines: lines.map(l => ({
        productId: l.productId || null,
        description: l.description,
        quantity: parseFloat(l.quantity),
        unitPrice: parseFloat(l.unitPrice),
        discountAmount: parseFloat(l.discountAmount || '0'),
        taxCodeId: null,
        taxAmount: parseFloat(l.taxAmount)
      }))
    };
    const r = await fetch(`${api}/sales-invoices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { notify('✓ Invoice created as Draft'); setShowForm(false); setLines([{ productId:'', description:'', quantity:'1', unitPrice:'0', discountAmount:'0', taxAmount:'0' }]); fetchData(); }
    else { const e = await r.json(); notify(e.error || 'Error saving invoice'); }
  };

  const postInvoice = async () => {
    const r = await fetch(`${api}/sales-invoices/${postModal.id}/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ arAccountId: postForm.arAccId, revenueAccountId: postForm.revenueAccId, taxLiabilityAccountId: postForm.taxLiabilityAccId || null })
    });
    if (r.ok) { notify('✓ Invoice posted! AR journal + stock movements created.'); setPostModal(null); fetchData(); }
    else { const e = await r.json(); notify(e.error || 'Error posting invoice'); }
  };

  const markVoid = async (id: string) => {
    await fetch(`${api}/sales-invoices/${id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 3 }) });
    fetchData();
  };



  return (
    <div className="space-y-4">
      {toast && <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">{toast}</div>}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Sales Invoices</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl">+ New Invoice</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Outstanding', value: money(invoices.filter((i: any) => i.status !== 2 && i.status !== 3).reduce((s: number, i: any) => s + (i.amountDue || 0), 0)), color: 'text-blue-600' },
          { label: 'Paid This Period', value: money(invoices.filter((i: any) => i.status === 2).reduce((s: number, i: any) => s + (i.totalAmount || 0), 0)), color: 'text-green-600' },
          { label: 'Draft Invoices', value: invoices.filter((i: any) => i.status === 0).length, color: 'text-orange-600' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color} mt-1`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* New Invoice Form */}
      {showForm && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: '1100px', width: '95%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">SALES & CUSTOMERS</p>
                <h2>New Sales Invoice</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowForm(false)}>×</button>
            </div>

            <div className="form-grid">
              <label>
                Customer *
                <select value={form.customerId} onChange={e => setForm(f => ({...f, customerId: e.target.value}))}>
                  <option value="">-- Select customer --</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label>
                Reference
                <input value={form.reference} onChange={e => setForm(f => ({...f, reference: e.target.value}))} placeholder="PO number etc." />
              </label>
              <label>
                Invoice Date
                <input type="date" value={form.invoiceDate} onChange={e => setForm(f => ({...f, invoiceDate: e.target.value}))} />
              </label>
              <label>
                Due Date
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} />
              </label>
            </div>

            {/* Lines */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-semibold text-gray-700">Invoice Lines</h4>
                <button onClick={addLine} className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Line</button>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="py-2 px-3 text-left">Product</th>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-right w-20">Qty</th>
                      <th className="py-2 px-3 text-right w-28">Unit Price</th>
                      <th className="py-2 px-3 text-right w-24">Discount</th>
                      <th className="py-2 px-3 text-right w-24">Tax</th>
                      <th className="py-2 px-3 text-right w-28">Total</th>
                      <th className="py-2 px-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lines.map((l, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1">
                          <select value={l.productId} onChange={e => updateLine(i, 'productId', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs">
                            <option value="">-- Select --</option>
                            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1"><input value={l.description} onChange={e => updateLine(i, 'description', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs" /></td>
                        <td className="px-2 py-1"><input type="number" value={l.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right" /></td>
                        <td className="px-2 py-1"><input type="number" value={l.unitPrice} onChange={e => updateLine(i, 'unitPrice', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right" /></td>
                        <td className="px-2 py-1"><input type="number" value={l.discountAmount} onChange={e => updateLine(i, 'discountAmount', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right" /></td>
                        <td className="px-2 py-1"><input type="number" value={l.taxAmount} onChange={e => updateLine(i, 'taxAmount', e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right" /></td>
                        <td className="px-2 py-1 text-right text-xs font-medium">{money(parseFloat(l.quantity||'0') * parseFloat(l.unitPrice||'0') - parseFloat(l.discountAmount||'0') + parseFloat(l.taxAmount||'0'))}</td>
                        <td className="px-2 py-1"><button onClick={() => removeLine(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr><td colSpan={6} className="py-2 px-3 text-right text-xs font-semibold text-gray-600">Subtotal:</td><td className="py-2 px-3 text-right text-sm font-bold">{money(subTotal)}</td><td /></tr>
                    <tr><td colSpan={6} className="py-2 px-3 text-right text-xs text-gray-500">Discount:</td><td className="py-2 px-3 text-right text-sm text-red-500">-{money(discountTotal)}</td><td /></tr>
                    <tr><td colSpan={6} className="py-2 px-3 text-right text-xs text-gray-500">Tax:</td><td className="py-2 px-3 text-right text-sm text-orange-600">{money(taxTotal)}</td><td /></tr>
                    <tr className="border-t border-gray-200"><td colSpan={6} className="py-2 px-3 text-right text-sm font-bold text-gray-800">Total:</td><td className="py-2 px-3 text-right text-lg font-bold text-blue-700">{money(subTotal - discountTotal + taxTotal)}</td><td /></tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes and Terms footer */}
            <div className="grid grid-cols-3 gap-4 items-end">
              <div style={{ gridColumn: 'span 2' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Terms</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3} placeholder="Payment terms, delivery notes..."
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 12px', fontSize: '13px' }} />
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span className="font-medium">{money(subTotal)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Total Discount</span><span className="font-medium">-{money(discountTotal)}</span>
                  </div>
                )}
                {taxTotal > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Total Tax</span><span className="font-medium">{money(taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
                  <span>Total Amount</span><span className="text-blue-700">{money(subTotal - discountTotal + taxTotal)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button onClick={saveInvoice} disabled={!form.customerId || lines.every(l => !l.description)} className="primary">
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Discount</th>
              <th className="py-3 px-4 text-right">Tax</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4 text-right">Due</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((inv: any) => (
              <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{inv.invoiceNumber}</td>
                <td className="py-3 px-4 text-gray-700">{inv.customerName}</td>
                <td className="py-3 px-4 text-gray-500">{inv.invoiceDate}</td>
                <td className="py-3 px-4 text-gray-500">{inv.dueDate}</td>
                <td className="py-3 px-4 text-right text-red-500">{inv.discountTotal > 0 ? `-${money(inv.discountTotal)}` : '—'}</td>
                <td className="py-3 px-4 text-right text-orange-500">{inv.taxTotal > 0 ? money(inv.taxTotal) : '—'}</td>
                <td className="py-3 px-4 text-right font-bold text-blue-700">{money(inv.totalAmount)}</td>
                <td className="py-3 px-4 text-right font-semibold text-red-600">{money(inv.amountDue)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[Object.keys(statusColors)[inv.status] as string] || 'bg-gray-100 text-gray-600'}`}>
                    {['Draft','Sent','Paid','Void','Partly Paid','Overdue'][inv.status]}
                  </span>
                </td>
                <td className="py-3 px-4 space-x-2">
                  {inv.status === 0 && (
                    <button onClick={() => { setPostModal(inv); setPostForm({ arAccId:'', revenueAccId:'', taxLiabilityAccId:'' }); }}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium">Post Invoice</button>
                  )}
                  {(inv.status === 0 || inv.status === 1) && (
                    <button onClick={() => markVoid(inv.id)} className="text-red-400 hover:text-red-600 text-xs font-medium">Void</button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && invoices.length === 0 && (
              <tr><td colSpan={8} className="py-10 text-center text-gray-400">No invoices yet. Create your first invoice above.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Post Invoice Modal */}
      {postModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Post Invoice to Ledger</h3>
            <div className="bg-blue-50 rounded-xl p-3 text-sm">
              <p><strong>{postModal.invoiceNumber}</strong> — {postModal.customerName}</p>
              <p className="text-gray-500 mt-1">Total: <strong className="text-blue-700">{money(postModal.totalAmount)}</strong></p>
              <p className="text-xs text-gray-500 mt-1">This will post: <strong>Dr Accounts Receivable / Cr Revenue</strong> and automatically reduce stock for Physical products.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accounts Receivable Account *</label>
              <select value={postForm.arAccId} onChange={e => setPostForm(f => ({...f, arAccId: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">-- Select AR account --</option>
                {accounts.filter((a: any) => a.type === 'Asset').map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Account *</label>
              <select value={postForm.revenueAccId} onChange={e => setPostForm(f => ({...f, revenueAccId: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">-- Select revenue account --</option>
                {accounts.filter((a: any) => a.type === 'Revenue').map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </select>
            </div>
            {postModal.taxTotal > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Liability Account (optional)</label>
                <select value={postForm.taxLiabilityAccId} onChange={e => setPostForm(f => ({...f, taxLiabilityAccId: e.target.value}))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">-- None --</option>
                  {accounts.filter((a: any) => a.type === 'Liability').map((a: any) => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                </select>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={postInvoice} disabled={!postForm.arAccId || !postForm.revenueAccId} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-medium text-sm">Post to Ledger</button>
              <button onClick={() => setPostModal(null)} className="flex-1 py-2 border rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sales Workspace ──────────────────────────────────────────────────────────
type Tab = 'invoices';

export const SalesWorkspace: React.FC<{ activeEntityId: string; entities: any[] }> = ({ activeEntityId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('invoices');

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'invoices', label: 'Sales Invoices', icon: '🧾' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sales Workspace</h1>
        <p className="text-gray-500 text-sm mt-1">Manage customers, invoices, and track your receivables. Posting invoices automatically updates stock levels.</p>
      </div>
      <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl w-fit border border-gray-200/50">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      <div>
        {activeTab === 'invoices' && <SalesInvoicesTab activeEntityId={activeEntityId} />}
      </div>
    </div>
  );
};
