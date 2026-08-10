import React, { useState, useEffect } from 'react';
import { useProcurementStore, useVendorsStore, useProductsStore, useCoaStore } from './stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function money(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
}

export const VendorBills: React.FC<{ activeEntityId: string }> = ({ activeEntityId }) => {
  const bills = useProcurementStore((s) => s.bills);
  const orders = useProcurementStore((s) => s.orders);
  const loading = useProcurementStore((s) => s.loading);
  const fetchBills = useProcurementStore((s) => s.fetchBills);
  const fetchOrders = useProcurementStore((s) => s.fetchOrders);
  const createVendorBillStore = useProcurementStore((s) => s.createVendorBill);
  const validateThreeWayMatchStore = useProcurementStore((s) => s.validateThreeWayMatch);

  const vendors = useVendorsStore((s) => s.vendors);
  const fetchVendors = useVendorsStore((s) => s.fetchVendors);

  const fetchProducts = useProductsStore((s) => s.fetchProducts);
  const accounts = useCoaStore((s) => s.accounts);
  const fetchAccounts = useCoaStore((s) => s.fetchAccounts);

  const [toast, setToast] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [entryMode, setEntryMode] = useState<'direct' | 'procurement'>('direct');
  const [forcedMode, setForcedMode] = useState<'direct' | 'procurement' | null>(null);
  
  const [billForm, setBillForm] = useState({
    purchaseOrderId: '',
    vendorId: '',
    billNumber: '',
    vendorInvoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    paymentTermsDays: '30',
    currencyCode: 'USD',
    notes: '',
    taxAmount: '0'
  });

  const [billLines, setBillLines] = useState<any[]>([]);
  const [matchModal, setMatchModal] = useState<any>(null);

  useEffect(() => {
    fetchBills(activeEntityId);
    fetchOrders(activeEntityId);
    fetchVendors(activeEntityId);
    fetchProducts();
    fetchAccounts();
  }, [activeEntityId]);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleOpenModal = (po?: any, mode: 'direct' | 'procurement' = 'direct') => {
    const resolvedMode = po ? 'procurement' : mode;
    setEntryMode(resolvedMode);
    setForcedMode(resolvedMode);
    const vId = po?.vendorId || vendors[0]?.id || '';
    setBillForm({
      purchaseOrderId: po?.id || '',
      vendorId: vId,
      billNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorInvoiceNumber: `INV-SUPP-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paymentTermsDays: '30',
      currencyCode: 'USD',
      notes: '',
      taxAmount: '0'
    });
    setBillLines((po?.lines || [{ description: '', quantity: 1, unitPrice: 0, accountId: '', destination: 'Expense' }]).map((l: any) => ({
      description: l.description || '',
      productId: l.productId || null,
      quantity: l.quantity || 1,
      unitPrice: l.unitPrice || 0,
      accountId: l.expenseAccountId || accounts[0]?.id || '',
      destination: l.destination || 'Expense',
      taxAmount: l.taxAmount || 0
    })));
    setShowBillModal(true);
  };

  const saveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billForm.vendorId) return alert('Please select Vendor.');
    if (!billForm.vendorInvoiceNumber) return alert('Please enter Supplier Invoice Number.');
    const body = {
      purchaseOrderId: entryMode === 'procurement' ? (billForm.purchaseOrderId || null) : null,
      vendorId: billForm.vendorId,
      billNumber: billForm.billNumber,
      vendorInvoiceNumber: billForm.vendorInvoiceNumber,
      date: billForm.date,
      dueDate: billForm.dueDate,
      paymentTermsDays: parseInt(billForm.paymentTermsDays || '30'),
      currencyCode: billForm.currencyCode,
      notes: billForm.notes,
      companyId: activeEntityId || null,
      lines: billLines.map(l => ({
        description: l.description,
        productId: l.productId || null,
        quantity: parseFloat(l.quantity),
        unitPrice: parseFloat(l.unitPrice),
        taxAmount: parseFloat(l.taxAmount || '0'),
        destination: l.destination || 'Expense',
        accountId: l.accountId || null
      }))
    };
    try {
      await createVendorBillStore(body, activeEntityId);
      notify(entryMode === 'direct' ? '✓ Direct Vendor Bill & Accounts Payable Liability posted!' : '✓ Procurement Vendor Bill saved & 3-Way Match updated!');
      setShowBillModal(false);
    } catch (err: any) {
      notify(err.message || 'Error saving Vendor Bill');
    }
  };

  const inspectMatch = async (poId: string) => {
    if (!poId) return alert('Direct Bill has no PO reference.');
    const res = await validateThreeWayMatchStore(poId);
    setMatchModal(res);
  };

  const totalOutstanding = bills.reduce((sum, b: any) => sum + (b.lines?.reduce((s: number, l: any) => s + ((l.quantity || 1) * (l.unitPrice || 0)), 0) || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-lg text-sm font-medium">{toast}</div>}

      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span>💳</span> Vendor Bills & Supplier Invoices
          </h1>
          <p className="text-gray-500 text-xs mt-1">Direct supplier liability creation or procurement-linked 3-way match invoices.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleOpenModal(null, 'direct')}>
            ⚡ Direct Bill Entry
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium" onClick={() => handleOpenModal(null, 'procurement')}>
            📜 Procurement PO Bill
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500 uppercase">Total Outstanding Bills</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-gray-900">{money(totalOutstanding)}</p></CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500 uppercase">Recorded Supplier Invoices</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{bills.length} Vendor Bills</p></CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500 uppercase">3-Way Match Verification</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-600">Active Audit Engine</p></CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Bill Number</th>
              <th className="py-3 px-4">Supplier Invoice #</th>
              <th className="py-3 px-4">Entry Type</th>
              <th className="py-3 px-4">Vendor Name</th>
              <th className="py-3 px-4">Bill Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-center">3-Way Match</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(bills as any[]).map((bill: any) => {
              const vendor = vendors.find(v => v.id === bill.vendorId);
              const total = bill.lines?.reduce((acc: number, l: any) => acc + ((l.quantity || 1) * (l.unitPrice || 0)), 0) || 0;
              const isDirect = !bill.purchaseOrderId;
              return (
                <tr key={bill.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{bill.billNumber}</td>
                  <td className="py-3 px-4 font-mono text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded w-fit font-bold">{bill.vendorInvoiceNumber || bill.vendorBillNumber}</td>
                  <td className="py-3 px-4">
                    {isDirect ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full border border-blue-200">⚡ Direct Bill</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">📜 Procurement PO</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{vendor?.name || bill.vendorName || 'Vendor'}</td>
                  <td className="py-3 px-4 text-gray-500">{bill.date}</td>
                  <td className="py-3 px-4 text-gray-500">{bill.dueDate}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700 text-base">{money(total, bill.currencyCode || 'USD')}</td>
                  <td className="py-3 px-4 text-center">
                    {bill.purchaseOrderId ? (
                      <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => inspectMatch(bill.purchaseOrderId)}>
                        Inspect Match
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">Direct AP Posted</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {!loading && bills.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-gray-400">No Vendor Bills found. Click "+ Direct Bill Entry" or "+ Procurement PO Bill" to record a supplier invoice.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Dual Workflow Vendor Bill Creation Form */}
      {showBillModal && (
        <div className="overlay">
          <form className="modal" onSubmit={saveBill}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">PROCUREMENT & PAYABLES</p>
                <h2>{entryMode === 'direct' ? '⚡ Enter Direct Vendor Bill (Direct AP Liability)' : '📜 Enter Procurement Vendor Bill (PO & GRN Linked)'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowBillModal(false)}>
                ×
              </button>
            </div>

            {/* Entry Mode Toggle Selector — only shown when not forced to a specific mode */}
            {!forcedMode && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 20, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: entryMode === 'direct' ? '#fff' : 'transparent',
                    color: entryMode === 'direct' ? '#1d4ed8' : '#64748b',
                    boxShadow: entryMode === 'direct' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onClick={() => setEntryMode('direct')}
                >
                  ⚡ Direct Vendor Bill (Direct GL Liability)
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: entryMode === 'procurement' ? '#fff' : 'transparent',
                    color: entryMode === 'procurement' ? '#047857' : '#64748b',
                    boxShadow: entryMode === 'procurement' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onClick={() => setEntryMode('procurement')}
                >
                  📜 Procurement Procedure Bill (PO & GRN Linked)
                </button>
              </div>
            )}

            <div className="form-grid">
              <label>
                Vendor / Supplier Name *
                <select required value={billForm.vendorId} onChange={e => setBillForm({ ...billForm, vendorId: e.target.value })}>
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Supplier Invoice Number *
                <input
                  required
                  placeholder="e.g. INV-SUPP-9982"
                  value={billForm.vendorInvoiceNumber}
                  onChange={e => setBillForm({ ...billForm, vendorInvoiceNumber: e.target.value })}
                />
              </label>

              <label>
                System Bill Number
                <input
                  placeholder="Auto-generated e.g. BILL-0001"
                  value={billForm.billNumber}
                  onChange={e => setBillForm({ ...billForm, billNumber: e.target.value })}
                />
              </label>

              {entryMode === 'procurement' ? (
                <label>
                  Linked Purchase Order *
                  <select value={billForm.purchaseOrderId} onChange={e => setBillForm({ ...billForm, purchaseOrderId: e.target.value })}>
                    <option value="">-- Select Purchase Order --</option>
                    {orders.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.orderNumber || p.poNumber}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  Direct AP Ledger Posting
                  <input disabled value="Direct Accounts Payable Liability (Posting to GL)" style={{ background: '#f8fafc', color: '#0284c7', fontWeight: 'bold' }} />
                </label>
              )}

              <label>
                Invoice / Bill Date *
                <input
                  type="date"
                  required
                  value={billForm.date}
                  onChange={e => setBillForm({ ...billForm, date: e.target.value })}
                />
              </label>

              <label>
                Due Date *
                <input
                  type="date"
                  required
                  value={billForm.dueDate}
                  onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })}
                />
              </label>

              <label>
                Payment Terms (Days)
                <input
                  type="number"
                  placeholder="30"
                  value={billForm.paymentTermsDays}
                  onChange={e => setBillForm({ ...billForm, paymentTermsDays: e.target.value })}
                />
              </label>

              <label>
                Transaction Currency
                <select value={billForm.currencyCode} onChange={e => setBillForm({ ...billForm, currencyCode: e.target.value })}>
                  {['USD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD'].map(curr => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Payment Notes / Internal References
                <input
                  placeholder="Payment instructions, bank wire info, or reference tags"
                  value={billForm.notes}
                  onChange={e => setBillForm({ ...billForm, notes: e.target.value })}
                />
              </label>

              {/* Line Items Section */}
              <div style={{ gridColumn: '1 / -1', marginTop: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <strong style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>Billed Line Items & GL Account Distributions</strong>
                  <button type="button" className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setBillLines([...billLines, { description: '', quantity: 1, unitPrice: 0, accountId: '', destination: 'Expense', taxAmount: 0 }])}>
                    + Add Line Item
                  </button>
                </div>

                {/* Column Headers */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', marginBottom: 4 }}>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Description</span>
                  {entryMode === 'direct' && (
                    <span style={{ flex: 1, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>GL Account</span>
                  )}
                  <span style={{ width: 70, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'center' }}>Qty</span>
                  <span style={{ width: 100, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'center' }}>Unit Price</span>
                  <span style={{ width: 90, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'center' }}>Tax</span>
                  <span style={{ width: 100, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</span>
                  <span style={{ width: 24 }}></span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {billLines.map((l, i) => {
                    const lineSubtotal = (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0);
                    const lineTax = parseFloat(l.taxAmount) || 0;
                    const lineTotal = lineSubtotal + lineTax;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <input
                          style={{ flex: 1 }}
                          placeholder="Item Description *"
                          value={l.description}
                          onChange={e => {
                            const u = [...billLines];
                            u[i].description = e.target.value;
                            setBillLines(u);
                          }}
                        />
                        {entryMode === 'direct' && (
                          <select
                            style={{ flex: 1 }}
                            value={l.accountId}
                            onChange={e => {
                              const u = [...billLines];
                              u[i].accountId = e.target.value;
                              setBillLines(u);
                            }}
                          >
                            <option value="">-- Select GL Account --</option>
                            {accounts.map(a => (
                              <option key={a.id} value={a.id}>
                                {a.code} - {a.name} ({a.type})
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          style={{ width: 70, textAlign: 'center' }}
                          type="number"
                          placeholder="Qty"
                          value={l.quantity}
                          onChange={e => {
                            const u = [...billLines];
                            u[i].quantity = e.target.value;
                            setBillLines(u);
                          }}
                        />
                        <input
                          style={{ width: 100, textAlign: 'center' }}
                          type="number"
                          placeholder="Unit Price"
                          value={l.unitPrice}
                          onChange={e => {
                            const u = [...billLines];
                            u[i].unitPrice = e.target.value;
                            setBillLines(u);
                          }}
                        />
                        <input
                          style={{ width: 90, textAlign: 'center' }}
                          type="number"
                          step="0.01"
                          placeholder="Tax Amt"
                          value={l.taxAmount}
                          onChange={e => {
                            const u = [...billLines];
                            u[i].taxAmount = e.target.value;
                            setBillLines(u);
                          }}
                        />
                        <span style={{ width: 100, textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#0f172a', fontFamily: 'monospace' }}>
                          {money(lineTotal, billForm.currencyCode)}
                        </span>
                        <button
                          type="button"
                          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16, width: 24 }}
                          onClick={() => setBillLines(billLines.filter((_, idx) => idx !== i))}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Bill Totals Summary */}
                {billLines.length > 0 && (() => {
                  const subtotal = billLines.reduce((sum, l) => sum + ((parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0)), 0);
                  const taxTotal = billLines.reduce((sum, l) => sum + (parseFloat(l.taxAmount) || 0), 0);
                  const grandTotal = subtotal + taxTotal;
                  return (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: '#f1f5f9', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40 }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>Subtotal</span>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#334155', fontFamily: 'monospace', margin: '2px 0 0' }}>{money(subtotal, billForm.currencyCode)}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#dc2626', fontWeight: 600, letterSpacing: '0.05em' }}>Tax (VAT/GST/Sales Tax)</span>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', fontFamily: 'monospace', margin: '2px 0 0' }}>{money(taxTotal, billForm.currencyCode)}</p>
                        </div>
                        <div style={{ textAlign: 'right', borderLeft: '2px solid #cbd5e1', paddingLeft: 20 }}>
                          <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#047857', fontWeight: 700, letterSpacing: '0.05em' }}>Grand Total</span>
                          <p style={{ fontSize: 18, fontWeight: 800, color: '#047857', fontFamily: 'monospace', margin: '2px 0 0' }}>{money(grandTotal, billForm.currencyCode)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowBillModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                {entryMode === 'direct' ? 'Post Direct Accounts Payable Liability' : 'Save Vendor Bill & Validate Match'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Inspect 3-Way Match */}
      {matchModal && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">AUDIT & COMPLIANCE</p>
                <h2>3-Way Match Audit Inspection</h2>
              </div>
              <button type="button" className="close" onClick={() => setMatchModal(null)}>
                ×
              </button>
            </div>
            <div className={`p-4 rounded-xl border ${matchModal.isMatched ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">PO #{matchModal.purchaseOrderNumber}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${matchModal.isMatched ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>{matchModal.status}</span>
              </div>
              <p className="text-xs font-medium text-gray-700">{matchModal.details}</p>
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t text-xs">
                <div><span className="text-gray-500">Ordered:</span> <p className="font-bold">{money(matchModal.orderedAmount)}</p></div>
                <div><span className="text-gray-500">Received:</span> <p className="font-bold">{money(matchModal.receivedAmount)}</p></div>
                <div><span className="text-gray-500">Billed:</span> <p className="font-bold">{money(matchModal.billedAmount)}</p></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setMatchModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
