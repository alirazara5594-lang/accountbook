import React, { useState, useEffect, useMemo } from 'react';
import { useSalesStore, useCustomersStore, useProductsStore } from './stores';
import { DataToolbar } from '@/components/ui/data-toolbar';
const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const statusColors: Record<number, string> = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-red-100 text-red-600',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-purple-100 text-purple-700',
};
const statusLabels = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Invoiced'];

interface Line {
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountType: 0 | 1; // 0=Percentage, 1=FixedAmount
  discountValue: string;
  taxPercent: string;
}

const defaultLine = (): Line => ({
  productId: '', description: '', quantity: '1',
  unitPrice: '0', discountType: 0, discountValue: '0', taxPercent: '0',
});

// ─── Line Item Row ────────────────────────────────────────────────────────────
const LineRow = ({ line, idx, products, onChange, onRemove }: {
  line: Line; idx: number; products: any[];
  onChange: (i: number, f: string, v: any) => void;
  onRemove: (i: number) => void;
}) => {
  const qty = parseFloat(line.quantity) || 0;
  const price = parseFloat(line.unitPrice) || 0;
  const subTotal = qty * price;
  const discVal = parseFloat(line.discountValue) || 0;
  const discAmt = line.discountType === 0 ? Math.round(subTotal * discVal / 100 * 100) / 100 : discVal;
  const afterDisc = subTotal - discAmt;
  const taxAmt = Math.round(afterDisc * (parseFloat(line.taxPercent) || 0) / 100 * 100) / 100;
  const lineTotal = afterDisc + taxAmt;

  const onProduct = (id: string) => {
    onChange(idx, 'productId', id);
    const p = products.find((p: any) => p.id === id);
    if (p) { onChange(idx, 'description', p.name); onChange(idx, 'unitPrice', String(p.unitPrice)); }
  };

  const inp = 'border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 w-full';

  return (
    <tr className="border-b border-gray-100 hover:bg-blue-50/20 transition-colors">
      <td className="px-2 py-2">
        <select value={line.productId} onChange={e => onProduct(e.target.value)} className={inp}>
          <option value="">-- Select --</option>
          {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </td>
      <td className="px-2 py-2">
        <input value={line.description} onChange={e => onChange(idx, 'description', e.target.value)} className={inp} placeholder="Description" />
      </td>
      <td className="px-2 py-2 w-16">
        <input type="number" value={line.quantity} onChange={e => onChange(idx, 'quantity', e.target.value)} className={inp + ' text-right'} min="0" />
      </td>
      <td className="px-2 py-2 w-24">
        <input type="number" value={line.unitPrice} onChange={e => onChange(idx, 'unitPrice', e.target.value)} className={inp + ' text-right'} min="0" />
      </td>
      <td className="px-2 py-2 w-36">
        <div className="flex gap-1">
          <select value={line.discountType} onChange={e => onChange(idx, 'discountType', parseInt(e.target.value))}
            className="border border-gray-200 rounded-lg px-1 py-1.5 text-xs w-12">
            <option value={0}>%</option>
            <option value={1}>$</option>
          </select>
          <input type="number" value={line.discountValue} onChange={e => onChange(idx, 'discountValue', e.target.value)}
            className={inp + ' text-right'} min="0" />
        </div>
      </td>
      <td className="px-2 py-2 w-16">
        <input type="number" value={line.taxPercent} onChange={e => onChange(idx, 'taxPercent', e.target.value)} className={inp + ' text-right'} min="0" placeholder="%" />
      </td>
      <td className="px-3 py-2 text-right text-xs text-gray-500">{money(subTotal)}</td>
      <td className="px-3 py-2 text-right text-xs text-red-500">{discAmt > 0 ? `-${money(discAmt)}` : '—'}</td>
      <td className="px-3 py-2 text-right text-xs text-orange-500">{taxAmt > 0 ? money(taxAmt) : '—'}</td>
      <td className="px-3 py-2 text-right text-sm font-semibold text-blue-700">{money(lineTotal)}</td>
      <td className="px-2 py-2 text-center">
        <button onClick={() => onRemove(idx)} className="text-red-300 hover:text-red-500 text-sm transition-colors">✕</button>
      </td>
    </tr>
  );
};

// ─── Estimate Form ────────────────────────────────────────────────────────────
const EstimateForm = ({ customers, products, onSave, onCancel }: {
  customers: any[]; products: any[];
  onSave: (body: any) => void; onCancel: () => void;
}) => {
  const [form, setForm] = useState({
    customerId: '', estimateDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    reference: '', notes: '', terms: 'Payment due within 30 days of invoice date.',
  });
  const [lines, setLines] = useState<Line[]>([defaultLine()]);

  // Auto-generate estimate number when form opens
  useEffect(() => {
    if (!form.reference) {
      const salesStore = useSalesStore.getState();
      salesStore.fetchNextNumber('estimate').then(n => setForm(f => ({ ...f, reference: f.reference || n })));
    }
  }, [form.reference]);

  const updateLine = (i: number, f: string, v: any) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [f]: v } : l));

  const calcs = lines.map(l => {
    const qty = parseFloat(l.quantity) || 0, price = parseFloat(l.unitPrice) || 0;
    const sub = qty * price;
    const discAmt = l.discountType === 0 ? Math.round(sub * (parseFloat(l.discountValue) || 0) / 100 * 100) / 100 : (parseFloat(l.discountValue) || 0);
    const afterDisc = sub - discAmt;
    const taxAmt = Math.round(afterDisc * (parseFloat(l.taxPercent) || 0) / 100 * 100) / 100;
    return { sub, discAmt, taxAmt, total: afterDisc + taxAmt };
  });

  const totals = calcs.reduce((acc, c) => ({
    sub: acc.sub + c.sub,
    disc: acc.disc + c.discAmt,
    tax: acc.tax + c.taxAmt,
    total: acc.total + c.total,
  }), { sub: 0, disc: 0, tax: 0, total: 0 });

  const submit = () => {
    onSave({
      ...form,
      expiryDate: form.expiryDate || null,
      lines: lines.map(l => ({
        productId: l.productId || null,
        description: l.description,
        quantity: parseFloat(l.quantity),
        unitPrice: parseFloat(l.unitPrice),
        discountType: l.discountType,
        discountValue: parseFloat(l.discountValue),
        taxCodeId: null,
        taxPercent: parseFloat(l.taxPercent),
      }))
    });
  };

  return (
    <div className="overlay">
      <div className="modal" style={{ maxWidth: '1100px', width: '95%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">SALES & CUSTOMERS</p>
            <h2>New Estimate / Quote</h2>
          </div>
          <button type="button" className="close" onClick={onCancel}>×</button>
        </div>

        {/* Header fields */}
        <div className="form-grid">
          <label>
            Customer *
            <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}>
              <option value="">-- Select customer --</option>
              {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>
            Estimate Date
            <input type="date" value={form.estimateDate} onChange={e => setForm(f => ({ ...f, estimateDate: e.target.value }))} />
          </label>
          <label>
            Expiry Date
            <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
          </label>
          <label>
            Reference
            <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="Project name, RFQ#..." />
          </label>
          <label style={{ gridColumn: 'span 2' }}>
            Notes
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes for the customer..." />
          </label>
        </div>

        {/* Lines */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold text-gray-700">Line Items</h4>
            <button onClick={() => setLines(l => [...l, defaultLine()])}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium">+ Add Line</button>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="py-2 px-2 text-left">Product</th>
                  <th className="py-2 px-2 text-left">Description</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Unit Price</th>
                  <th className="py-2 px-2 text-center">Discount (% / $)</th>
                  <th className="py-2 px-2 text-right">Tax %</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                  <th className="py-2 px-3 text-right">Discount</th>
                  <th className="py-2 px-3 text-right">Tax</th>
                  <th className="py-2 px-3 text-right font-semibold">Total</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <LineRow key={i} line={l} idx={i} products={products}
                    onChange={updateLine} onRemove={idx => setLines(ls => ls.filter((_, j) => j !== idx))} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals summary and terms */}
        <div className="grid grid-cols-3 gap-4 items-end">
          <div style={{ gridColumn: 'span 2' }}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
            <textarea value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} rows={3}
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '8px 12px', fontSize: '13px' }} />
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span className="font-medium">{money(totals.sub)}</span>
            </div>
            {totals.disc > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Total Discount</span><span className="font-medium">-{money(totals.disc)}</span>
              </div>
            )}
            {totals.tax > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Total Tax</span><span className="font-medium">{money(totals.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Total Amount</span><span className="text-blue-700">{money(totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary btn-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="secondary btn-draft" onClick={(e) => { e.preventDefault(); alert("��� Draft saved locally"); }}>Save Draft</button>
          <button type="button" className="primary btn-finalize" onClick={submit} disabled={!form.customerId || lines.every(l => !l.description)}>
            Save Estimate
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Convert to Invoice Modal ─────────────────────────────────────────────────
const ConvertModal = ({ estimate, onConfirm, onClose }: { estimate: any; onConfirm: (inv: string, due: string) => void; onClose: () => void }) => {
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Convert to Sales Invoice</h3>
        <div className="bg-blue-50 rounded-xl p-3 text-sm space-y-1">
          <p><strong>{estimate.estimateNumber}</strong> — {estimate.customerName}</p>
          <p className="text-gray-600">Total: <strong className="text-blue-700">{money(estimate.totalAmount)}</strong></p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <input type="date" value={invDate} onChange={e => setInvDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" /></div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={() => onConfirm(invDate as any, dueDate as any)}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-sm">Create Invoice</button>
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const EstimatesAndQuotes: React.FC<{ activeEntityId: string }> = ({ activeEntityId }) => {
  const estimates = useSalesStore((s) => s.estimates);
  const fetchEstimates = useSalesStore((s) => s.fetchEstimates);
  const createEstimateStore = useSalesStore((s) => s.createEstimate);
  const updateEstimateStatusStore = useSalesStore((s) => s.updateEstimateStatus);
  const convertToInvoiceStore = useSalesStore((s) => s.convertToInvoice);

  const customers = useCustomersStore((s) => s.customers);
  const fetchCustomers = useCustomersStore((s) => s.fetchCustomers);

  const products = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [convertModal, setConvertModal] = useState<any>(null);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEstimates(activeEntityId),
        fetchCustomers(activeEntityId),
        fetchProducts(),
      ]);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [activeEntityId]);
  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500); };

  const saveEstimate = async (body: any) => {
    try {
      await createEstimateStore({ ...body, companyId: activeEntityId || null });
      notify('✓ Estimate saved as Draft!');
      setShowForm(false);
    } catch (e: any) {
      notify(e.message || 'Error');
    }
  };

  const updateStatus = async (id: string, status: number) => {
    try {
      await updateEstimateStatusStore(id, String(status));
    } catch {}
  };

  const convertToInvoice = async (invDate: string, dueDate: string) => {
    try {
      await convertToInvoiceStore(convertModal.id, { invoiceDate: invDate, dueDate });
      notify('✓ Invoice created! Go to Sales Workspace → Sales Invoices to post it.');
      setConvertModal(null);
    } catch (e: any) {
      notify(e.message || 'Error');
    }
  };

  // Summary stats
  const totalValue = estimates.filter((e: any) => String(e.status) !== '3' && String(e.status) !== '4').reduce((s: number, e: any) => s + (e.totalAmount || 0), 0);
  const accepted = estimates.filter((e: any) => String(e.status) === '2').length;
  const pending = estimates.filter((e: any) => Number(e.status) <= 1).length;

  const filteredEstimates = useMemo(() => {
    if (!query.trim()) return estimates;
    const q = query.toLowerCase();
    return estimates.filter((e: any) =>
      (e.estimateNumber || '').toLowerCase().includes(q) ||
      (e.customerName || '').toLowerCase().includes(q) ||
      (statusLabels[e.status] || '').toLowerCase().includes(q)
    );
  }, [estimates, query]);

  const exportHeaders = ['Estimate #', 'Customer', 'Date', 'Expiry', 'Subtotal', 'Discount', 'Tax', 'Total', 'Status'];
  const exportRows = filteredEstimates.map((e: any) => [
    e.estimateNumber, e.customerName, e.estimateDate, e.expiryDate || '',
    e.subTotal, e.totalDiscount, e.totalTax, e.totalAmount, statusLabels[e.status],
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-green-600 text-white rounded-2xl shadow-lg text-sm font-medium">{toast}</div>}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Estimates & Quotes</h1>
          <p className="text-gray-500 text-sm mt-1">Create quotes for customers and convert accepted ones into Sales Invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search estimate #, customer, status..."
            exportFileName="estimates-and-quotes"
            exportSheetName="Estimates & Quotes"
            exportTitle="Estimates & Quotes"
            exportSubtitle="Quotes and estimates with conversion to sales invoices."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Value', value: totalValue }]}
            onRefresh={() => fetchData()}
          />
          <button onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-blue-600/20 transition-all active:scale-95">
            + New Estimate
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Pipeline Value', value: money(totalValue), color: 'text-blue-600', icon: '💰' },
          { label: 'Accepted Quotes', value: accepted, color: 'text-green-600', icon: '✅' },
          { label: 'Awaiting Response', value: pending, color: 'text-orange-600', icon: '⏳' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <span className="text-3xl">{c.icon}</span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color} mt-0.5`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* New Estimate Form */}
      {showForm && (
        <EstimateForm customers={customers} products={products}
          onSave={saveEstimate} onCancel={() => setShowForm(false)} />
      )}

      {/* Estimates Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Estimate #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Expiry</th>
              <th className="py-3 px-4 text-right">Subtotal</th>
              <th className="py-3 px-4 text-right">Discount</th>
              <th className="py-3 px-4 text-right">Tax</th>
              <th className="py-3 px-4 text-right font-bold">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredEstimates.map((e: any) => (
              <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{e.estimateNumber}</td>
                <td className="py-3 px-4 text-gray-700">{e.customerName}</td>
                <td className="py-3 px-4 text-gray-500">{e.estimateDate}</td>
                <td className="py-3 px-4 text-gray-500">{e.expiryDate || '—'}</td>
                <td className="py-3 px-4 text-right">{money(e.subTotal)}</td>
                <td className="py-3 px-4 text-right text-red-500">{e.totalDiscount > 0 ? `-${money(e.totalDiscount)}` : '—'}</td>
                <td className="py-3 px-4 text-right text-orange-500">{e.totalTax > 0 ? money(e.totalTax) : '—'}</td>
                <td className="py-3 px-4 text-right font-bold text-blue-700">{money(e.totalAmount)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[e.status]}`}>
                    {statusLabels[e.status]}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-2">
                    {e.status === 0 && (
                      <button onClick={() => updateStatus(e.id, 1)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Mark Sent</button>
                    )}
                    {(e.status === 0 || e.status === 1) && (
                      <button onClick={() => updateStatus(e.id, 2)} className="text-green-600 hover:text-green-800 text-xs font-medium">Accept</button>
                    )}
                    {(e.status === 0 || e.status === 1) && (
                      <button onClick={() => updateStatus(e.id, 3)} className="text-red-400 hover:text-red-600 text-xs font-medium">Reject</button>
                    )}
                    {(e.status === 2) && (
                      <button onClick={() => setConvertModal(e)}
                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all">
                        → Create Invoice
                      </button>
                    )}
                    {e.status === 5 && e.convertedToInvoiceId && (
                      <span className="text-purple-600 text-xs font-medium">✓ Invoiced</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredEstimates.length === 0 && (
              <tr><td colSpan={10} className="py-12 text-center text-gray-400">
                No estimates yet. Create your first estimate to start the sales cycle.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Convert Modal */}
      {convertModal && (
        <ConvertModal estimate={convertModal} onConfirm={convertToInvoice} onClose={() => setConvertModal(null)} />
      )}
    </div>
  );
};
