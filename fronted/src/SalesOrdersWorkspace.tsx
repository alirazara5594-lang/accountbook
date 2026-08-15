import React, { useState, useEffect } from 'react';
import { useSalesOrdersStore, useCustomersStore, useProductsStore } from './stores';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { 
  Plus, Shield, Search, Calendar, Eye, XCircle, ArrowRight 
} from 'lucide-react';

function money(v: number) { 
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v); 
}

const statusColors: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600 border-gray-200',
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Invoiced: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

interface SalesOrdersWorkspaceProps {
  activeEntityId: string;
}

export const SalesOrdersWorkspace: React.FC<SalesOrdersWorkspaceProps> = ({ activeEntityId }) => {
  const orders = useSalesOrdersStore(s => s.orders);
  const fetchOrders = useSalesOrdersStore(s => s.fetchOrders);
  const createOrder = useSalesOrdersStore(s => s.createOrder);
  const updateOrderStatus = useSalesOrdersStore(s => s.updateOrderStatus);
  const convertToInvoice = useSalesOrdersStore(s => s.convertToInvoice);
  const fetchNextNumber = useSalesOrdersStore(s => s.fetchNextNumber);

  const customers = useCustomersStore(s => s.customers);
  const fetchCustomers = useCustomersStore(s => s.fetchCustomers);

  const products = useProductsStore(s => s.products);
  const fetchProducts = useProductsStore(s => s.fetchProducts);

  const [showForm, setShowForm] = useState(false);
  const [activeOrderDetails, setActiveOrderDetails] = useState<any | null>(null);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');

  // Form State
  const [form, setForm] = useState({
    customerId: '',
    orderDate: new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    reference: '',
    notes: '',
    terms: '',
  });

  // Auto-generate reference number when form opens
  useEffect(() => {
    if (!form.reference) {
      fetchNextNumber().then(n => setForm(f => ({ ...f, reference: f.reference || n })));
    }
  }, [form.reference, fetchNextNumber]);

  const [lines, setLines] = useState<any[]>([
    { productId: '', description: '', quantity: '1', unitPrice: '0', discountAmount: '0', taxAmount: '0' }
  ]);

  const notify = (m: string) => { 
    setToast(m); 
    setTimeout(() => setToast(''), 3500); 
  };

  const loadData = async () => {
    try {
      await Promise.all([
        fetchOrders(activeEntityId),
        fetchCustomers(activeEntityId),
        fetchProducts(),
      ]);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, [activeEntityId]);

  const addLine = () => setLines([...lines, { productId: '', description: '', quantity: '1', unitPrice: '0', discountAmount: '0', taxAmount: '0' }]);
  
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const updateLine = (i: number, field: string, value: string) => {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'productId' && value) {
      const prod = products.find((p: any) => p.id === value);
      if (prod) {
        updated[i] = { 
          ...updated[i], 
          description: prod.name, 
          unitPrice: String(prod.unitPrice || prod.salesPrice || 0) 
        };
      }
    }
    setLines(updated);
  };

  const subTotal = lines.reduce((s, l) => s + parseFloat(l.quantity || '0') * parseFloat(l.unitPrice || '0'), 0);
  const discountTotal = lines.reduce((s, l) => s + parseFloat(l.discountAmount || '0'), 0);
  const taxTotal = lines.reduce((s, l) => s + parseFloat(l.taxAmount || '0'), 0);
  const grandTotal = subTotal - discountTotal + taxTotal;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) {
      notify('Please select a customer.');
      return;
    }
    if (lines.some(l => !l.productId)) {
      notify('Please select a product for all lines.');
      return;
    }

    const payload = {
      customerId: form.customerId,
      orderDate: form.orderDate,
      expectedDeliveryDate: form.expectedDeliveryDate || undefined,
      reference: form.reference || undefined,
      notes: form.notes || undefined,
      terms: form.terms || undefined,
      companyId: activeEntityId || undefined,
      lines: lines.map(l => ({
        productId: l.productId,
        description: l.description,
        quantity: parseFloat(l.quantity),
        unitPrice: parseFloat(l.unitPrice),
        discountAmount: parseFloat(l.discountAmount || '0'),
        taxAmount: parseFloat(l.taxAmount || '0')
      }))
    };

    try {
      await createOrder(payload);
      notify('✓ Sales Order created successfully.');
      setShowForm(false);
      setForm({
        customerId: '',
        orderDate: new Date().toISOString().slice(0, 10),
        expectedDeliveryDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        reference: '',
        notes: '',
        terms: '',
      });
      setLines([{ productId: '', description: '', quantity: '1', unitPrice: '0', discountAmount: '0', taxAmount: '0' }]);
    } catch (err: any) {
      notify(err.message || 'Error creating sales order');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await updateOrderStatus(id, 'Confirmed');
      notify('✓ Sales Order confirmed.');
    } catch (err: any) {
      notify(err.message || 'Error confirming order');
    }
  };

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this Sales Order?')) {
      try {
        await updateOrderStatus(id, 'Cancelled');
        notify('✓ Sales Order cancelled.');
      } catch (err: any) {
        notify(err.message || 'Error cancelling order');
      }
    }
  };

  const handleConvertToInvoice = async (id: string) => {
    try {
      const res = await convertToInvoice(id);
      notify(`✓ Sales Order converted to draft Invoice: ${res.invoiceNumber}`);
    } catch (err: any) {
      notify(err.message || 'Failed to convert order to invoice');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    if (!query.trim()) return true;
    const lower = query.toLowerCase();
    const cust = customers.find(c => c.id === o.customerId);
    return (
      o.orderNumber.toLowerCase().includes(lower) ||
      o.reference?.toLowerCase().includes(lower) ||
      cust?.name.toLowerCase().includes(lower)
    );
  });

  // Analytics Metrics
  const metrics = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'Draft').length,
    confirmed: orders.filter(o => o.status === 'Confirmed').length,
    invoiced: orders.filter(o => o.status === 'Invoiced').length,
    totalVal: orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + o.totalAmount, 0)
  };

  const exportHeaders = ['Order Number', 'Order Date', 'Customer', 'Expected Delivery', 'Reference', 'Total Amount', 'Status'];
  const exportRows = filteredOrders.map(o => {
    const cust = customers.find(c => c.id === o.customerId);
    return [o.orderNumber, o.orderDate, cust?.name || 'Unknown', o.expectedDeliveryDate || '', o.reference || '', o.totalAmount, o.status];
  });

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="text-lg">📦</span> Sales Orders
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Manage sales orders, confirmations, and delivery tracking.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DataToolbar
            exportFileName="sales-orders"
            exportSheetName="Sales Orders"
            exportTitle="Sales Orders"
            exportSubtitle="Sales order register with confirmation and invoicing workflow."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Active Value', value: metrics.totalVal }]}
            onRefresh={() => loadData()}
          />
          <button
            onClick={() => setShowForm(true)}
            className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New Order
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="stats">
        <article>
          <span className="stat-icon blue"><span className="text-sm">📋</span></span>
          <div>
            <small>TOTAL ORDERS</small>
            <h2>{metrics.total}</h2>
            <p>Registered confirmations</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><span className="text-sm">📝</span></span>
          <div>
            <small>DRAFT ORDERS</small>
            <h2>{metrics.draft}</h2>
            <p>Requires confirmation</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><span className="text-sm">🚚</span></span>
          <div>
            <small>PENDING DELIVERY</small>
            <h2>{metrics.confirmed}</h2>
            <p>Confirmed sales order</p>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><span className="text-sm">✅</span></span>
          <div>
            <small>INVOICED ORDERS</small>
            <h2>{metrics.invoiced}</h2>
            <p>Invoiced to client</p>
          </div>
        </article>
      </section>

      {/* Search & Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search order no, customer, ref..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-8 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-slate-400"
            />
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50/80 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ORDER NUMBER</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">ORDER DATE</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">CUSTOMER</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">EXPECTED DELIVERY</th>
              <th className="py-2.5 px-4 text-left text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">REFERENCE</th>
              <th className="py-2.5 px-4 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">TOTAL AMOUNT</th>
              <th className="py-2.5 px-4 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">STATUS</th>
              <th className="py-2.5 px-4 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pr-4">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredOrders.map(o => {
              const cust = customers.find(c => c.id === o.customerId);
              return (
                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#143e2b]">{o.orderNumber}</td>
                  <td className="py-3 px-4 text-slate-500">{o.orderDate}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{cust?.name || 'Unknown'}</td>
                  <td className="py-3 px-4 text-slate-500">{o.expectedDeliveryDate || 'Not Specified'}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-xs">{o.reference || '—'}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800 font-mono">{money(o.totalAmount)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${statusColors[o.status] || ''}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right pr-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setActiveOrderDetails(o)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {o.status === 'Draft' && (
                        <>
                          <button
                            onClick={() => handleConfirm(o.id)}
                            className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleCancel(o.id)}
                            className="p-1 text-rose-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="Cancel Order"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {o.status === 'Confirmed' && (
                        <>
                          <button
                            onClick={() => handleConvertToInvoice(o.id)}
                            className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Generate invoice for this Sales Order"
                          >
                            Convert to Invoice
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleCancel(o.id)}
                            className="p-1 text-rose-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="Cancel Order"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <span className="text-3xl">📂</span>
                    <p className="text-xs font-bold text-slate-500">No Sales Orders found</p>
                    <p className="text-[10px] text-slate-400">Create a new sales order to confirm customer commitments.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* NEW SALES ORDER FORM MODAL */}
      {showForm && (
        <div className="overlay">
          <form className="modal" onSubmit={handleSave} >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Sales & Customers</p>
                <h2>New Confirmation Sales Order</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowForm(false)}>×</button>
            </div>

            <div className="form-grid">
              <label>
                * Customer
                <select 
                  required 
                  value={form.customerId} 
                  onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Reference / PO
                <input 
                  value={form.reference} 
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} 
                  placeholder="PO-99120" 
                />
              </label>

              <label>
                Order Date
                <input 
                  type="date" 
                  value={form.orderDate} 
                  onChange={e => setForm(f => ({ ...f, orderDate: e.target.value }))} 
                />
              </label>

              <label>
                Expected Delivery Date
                <input 
                  type="date" 
                  value={form.expectedDeliveryDate} 
                  onChange={e => setForm(f => ({ ...f, expectedDeliveryDate: e.target.value }))} 
                />
              </label>
            </div>

            {/* lines */}
            <div className="mt-5">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Itemized Lines</h4>
                <button 
                  type="button" 
                  onClick={addLine} 
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  + Add Line Item
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[9px] border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 text-left">Product/Service</th>
                      <th className="py-2 px-3 text-left">Description</th>
                      <th className="py-2 px-3 text-right w-20">Quantity</th>
                      <th className="py-2 px-3 text-right w-24">Price</th>
                      <th className="py-2 px-3 text-right w-20">Discount ($)</th>
                      <th className="py-2 px-3 text-right w-20">Taxes ($)</th>
                      <th className="py-2 px-3 text-right w-28">Total</th>
                      <th className="py-2 px-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50/30">
                        <td className="p-2 w-1/4">
                          <select 
                            value={l.productId} 
                            onChange={e => updateLine(i, 'productId', e.target.value)}
                            className="w-full border border-slate-200 rounded p-1 text-[11px] outline-none"
                          >
                            <option value="">-- Choose Product --</option>
                            {products.map((p: any) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input 
                            value={l.description} 
                            onChange={e => updateLine(i, 'description', e.target.value)} 
                            className="w-full border border-slate-200 rounded p-1 text-[11px] outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={l.quantity} 
                            onChange={e => updateLine(i, 'quantity', e.target.value)} 
                            className="w-full border border-slate-200 rounded p-1 text-[11px] text-right outline-none font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            step="0.01"
                            value={l.unitPrice} 
                            onChange={e => updateLine(i, 'unitPrice', e.target.value)} 
                            className="w-full border border-slate-200 rounded p-1 text-[11px] text-right outline-none font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            step="0.01"
                            value={l.discountAmount} 
                            onChange={e => updateLine(i, 'discountAmount', e.target.value)} 
                            className="w-full border border-slate-200 rounded p-1 text-[11px] text-right outline-none font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            step="0.01"
                            value={l.taxAmount} 
                            onChange={e => updateLine(i, 'taxAmount', e.target.value)} 
                            className="w-full border border-slate-200 rounded p-1 text-[11px] text-right outline-none font-mono"
                          />
                        </td>
                        <td className="p-2 text-right font-bold text-slate-800 font-mono text-[11px]">
                          {money(
                            parseFloat(l.quantity || '0') * parseFloat(l.unitPrice || '0') - 
                            parseFloat(l.discountAmount || '0') + 
                            parseFloat(l.taxAmount || '0')
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {lines.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeLine(i)} 
                              className="text-rose-500 font-bold hover:text-rose-700 text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/50 text-[11px] font-semibold">
                    <tr>
                      <td colSpan={6} className="py-2 px-3 text-right text-slate-500">Subtotal:</td>
                      <td className="py-2 px-3 text-right font-mono">{money(subTotal)}</td>
                      <td></td>
                    </tr>
                    {discountTotal > 0 && (
                      <tr>
                        <td colSpan={6} className="py-2 px-3 text-right text-rose-600">Discounts:</td>
                        <td className="py-2 px-3 text-right font-mono text-rose-600">-{money(discountTotal)}</td>
                        <td></td>
                      </tr>
                    )}
                    {taxTotal > 0 && (
                      <tr>
                        <td colSpan={6} className="py-2 px-3 text-right text-orange-600">Taxes:</td>
                        <td className="py-2 px-3 text-right font-mono text-orange-600">+{money(taxTotal)}</td>
                        <td></td>
                      </tr>
                    )}
                    <tr className="border-t border-slate-200 bg-slate-100/50 font-bold">
                      <td colSpan={6} className="py-3 px-3 text-right text-xs text-slate-800">Total Order Amount:</td>
                      <td className="py-3 px-3 text-right text-sm text-[#143e2b] font-mono font-extrabold">{money(grandTotal)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="text-xs font-semibold text-slate-700">Special Notes & Remarks</span>
                <textarea 
                  value={form.notes} 
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional delivery instructions, client remarks..."
                  style={{ width: '100%', minHeight: 60, border: '1px solid #dce3eb', borderRadius: 8, padding: 8, fontSize: 12, resize: 'none' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }} className="mt-1">
                <span className="text-xs font-semibold text-slate-700">Order Terms & Conditions</span>
                <input 
                  value={form.terms} 
                  onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
                  placeholder="Standard sales terms, delivery clauses..."
                  className="w-full border border-slate-200 rounded p-1.5 text-xs outline-none"
                />
              </label>
            </div>

            <div className="modal-footer mt-5">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="primary" disabled={lines.some(l => !l.productId)}>Save Sales Order</button>
            </div>
          </form>
        </div>
      )}

      {/* DETAIL VIEW MODAL */}
      {activeOrderDetails && (
        <div className="overlay">
          <div className="modal" >
            <div className="modal-head">
        <div className="flex flex-wrap items-center gap-2">
                <span className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Sales Order Audit Sheet
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">
                    Order Document Reference Detail
                  </p>
                </div>
              </div>
              <button type="button" className="close" onClick={() => setActiveOrderDetails(null)}>×</button>
            </div>

            <div className="space-y-4 text-xs">
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16 }} className="p-4 flex justify-between">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Order reference</span>
                  <h4 className="text-base font-extrabold text-[#143e2b]">{activeOrderDetails.orderNumber}</h4>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ordered: {activeOrderDetails.orderDate}</span>
                  </div>
                  {activeOrderDetails.expectedDeliveryDate && (
                    <div className="text-slate-500 text-[11px] font-medium">Expected Delivery: {activeOrderDetails.expectedDeliveryDate}</div>
                  )}
                </div>
                <div className="text-right space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Customer client</span>
                  <p className="font-bold text-slate-800 text-sm">
                    {customers.find(c => c.id === activeOrderDetails.customerId)?.name || 'Unknown'}
                  </p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusColors[activeOrderDetails.status]}`}>
                    {activeOrderDetails.status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wide text-[9px]">
                    <tr>
                      <th className="py-2.5 px-3 text-left">ITEM / DESCRIPTION</th>
                      <th className="py-2.5 px-3 text-center w-16">QTY</th>
                      <th className="py-2.5 px-3 text-right w-24">UNIT PRICE</th>
                      <th className="py-2.5 px-3 text-right w-28">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans text-slate-700">
                    {activeOrderDetails.lines?.map((line: any, idx: number) => {
                      const prod = products.find(p => p.id === line.productId);
                      return (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <span className="font-bold block text-slate-800">{prod?.name || 'Custom Product'}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{line.description}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{line.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-mono">{money(line.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{money(line.lineTotalWithTax)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Remarks */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {activeOrderDetails.notes && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Special Remarks</span>
                      <p className="text-slate-600 mt-1 leading-relaxed">{activeOrderDetails.notes}</p>
                    </div>
                  )}
                  {activeOrderDetails.terms && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Order Terms & Rules</span>
                      <p className="text-slate-600 mt-1 leading-relaxed">{activeOrderDetails.terms}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end items-start">
                  <div className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 font-semibold">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-mono">{money(activeOrderDetails.subTotal)}</span>
                    </div>
                    {activeOrderDetails.discountTotal > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Discounts:</span>
                        <span className="font-mono">-{money(activeOrderDetails.discountTotal)}</span>
                      </div>
                    )}
                    {activeOrderDetails.taxTotal > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span>Taxes:</span>
                        <span className="font-mono">+{money(activeOrderDetails.taxTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-250 pt-2 text-slate-950 font-extrabold text-sm">
                      <span>Order Value:</span>
                      <span className="font-mono text-[#143e2b]">{money(activeOrderDetails.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer mt-5 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                className="secondary" 
                onClick={() => setActiveOrderDetails(null)}
              >
                Close Audit Sheet
              </button>
              {activeOrderDetails.status === 'Confirmed' && (
                <button
                  type="button"
                  onClick={() => {
                    handleConvertToInvoice(activeOrderDetails.id);
                    setActiveOrderDetails(null);
                  }}
                  className="primary bg-[#143e2b] hover:bg-[#0c2a1d] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Convert to Invoice
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}
    </div>
  );
};
