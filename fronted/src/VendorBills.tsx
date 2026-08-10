import React, { useState, useEffect } from 'react';
import { useProcurementStore, useVendorsStore, useProductsStore } from './stores';
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

  const [toast, setToast] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
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
  }, [activeEntityId]);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleOpenModal = (po?: any) => {
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
    setBillLines((po?.lines || [{ description: '', quantity: 1, unitPrice: 0, taxAmount: 0 }]).map((l: any) => ({
      description: l.description || '',
      productId: l.productId || null,
      quantity: l.quantity || 1,
      unitPrice: l.unitPrice || 0,
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
      purchaseOrderId: billForm.purchaseOrderId || null,
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
        destination: l.destination || 'Expense'
      }))
    };
    try {
      await createVendorBillStore(body, activeEntityId);
      notify('✓ Vendor Bill / Supplier Invoice saved successfully!');
      setShowBillModal(false);
    } catch (err: any) {
      notify(err.message || 'Error saving Vendor Bill');
    }
  };

  const inspectMatch = async (poId: string) => {
    if (!poId) return alert('No Purchase Order linked to inspect.');
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
          <p className="text-gray-500 text-xs mt-1">Manage accounts payable supplier bills, incoming invoices, and 3-way match audit validation.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium" onClick={() => handleOpenModal()}>
          + Create Vendor Bill
        </Button>
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
              return (
                <tr key={bill.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{bill.billNumber}</td>
                  <td className="py-3 px-4 font-mono text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded w-fit font-bold">{bill.vendorInvoiceNumber || bill.vendorBillNumber}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{vendor?.name || bill.vendorName || 'Vendor'}</td>
                  <td className="py-3 px-4 text-gray-500">{bill.date}</td>
                  <td className="py-3 px-4 text-gray-500">{bill.dueDate}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700 text-base">{money(total, bill.currencyCode || 'USD')}</td>
                  <td className="py-3 px-4 text-center">
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => inspectMatch(bill.purchaseOrderId)}>
                      Inspect Match
                    </Button>
                  </td>
                </tr>
              );
            })}
            {!loading && bills.length === 0 && (
              <tr><td colSpan={7} className="py-12 text-center text-gray-400">No Vendor Bills found. Click "+ Create Vendor Bill" to record a supplier invoice.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create Vendor Bill (Form Grid matching Customer Creation) */}
      {showBillModal && (
        <div className="overlay">
          <form className="modal" onSubmit={saveBill}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">PROCUREMENT & PAYABLES</p>
                <h2>Create New Vendor Bill / Supplier Invoice</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowBillModal(false)}>
                ×
              </button>
            </div>

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

              <label>
                Linked Purchase Order
                <select value={billForm.purchaseOrderId} onChange={e => setBillForm({ ...billForm, purchaseOrderId: e.target.value })}>
                  <option value="">-- Direct Bill (No Linked PO) --</option>
                  {orders.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.orderNumber || p.poNumber}
                    </option>
                  ))}
                </select>
              </label>

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
                  <strong style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>Billed Line Items & Unit Prices</strong>
                  <button type="button" className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setBillLines([...billLines, { description: '', quantity: 1, unitPrice: 0, taxAmount: 0 }])}>
                    + Add Line Item
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {billLines.map((l, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
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
                      <input
                        style={{ width: 80 }}
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
                        style={{ width: 110 }}
                        type="number"
                        placeholder="Unit Price"
                        value={l.unitPrice}
                        onChange={e => {
                          const u = [...billLines];
                          u[i].unitPrice = e.target.value;
                          setBillLines(u);
                        }}
                      />
                      <button
                        type="button"
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}
                        onClick={() => setBillLines(billLines.filter((_, idx) => idx !== i))}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowBillModal(false)}>
                Cancel
              </button>
              <button type="submit" className="primary">
                Save Vendor Bill & Validate Match
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
