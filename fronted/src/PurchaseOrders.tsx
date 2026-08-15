import React, { useState, useEffect } from 'react';
import { useProcurementStore, useVendorsStore, useProductsStore, useTaxStore } from './stores';
import { DataToolbar } from '@/components/ui/data-toolbar';
import './App.css';

interface TaxRate {
  percentage: number;
}
interface TaxCode {
  id: string;
  code: string;
  name: string;
  rates: TaxRate[];
}

interface Product {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  taxCodeId?: string;
}

interface Vendor {
  id: string;
  vendorNumber: string;
  name: string;
}

interface PurchaseOrderLine {
  id?: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxCodeId?: string;
  taxAmount: number;
  destination: number; // 0 = Inventory, 1 = FixedAsset, 2 = Expense
  totalAmount?: number;
  receivedQuantity?: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  date: string;
  status: number; // 0=Draft, 1=Issued, 2=PartiallyReceived, 3=Fulfilled
  lines: PurchaseOrderLine[];
}

interface GoodsReceiptNoteLine {
  purchaseOrderLineId: string;
  quantityReceived: number;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  dateReceived: string;
  lines: GoodsReceiptNoteLine[];
  isProcessed: boolean;
}

export const PurchaseOrders: React.FC<{activeEntityId?: string, entities?: any[]}> = ({activeEntityId, entities}) => {
  const [activeTab, setActiveTab] = useState<'pos' | 'grns'>('pos');

  const pos = useProcurementStore((s) => s.orders as PurchaseOrder[]);
  const grns = useProcurementStore((s) => s.receipts as any[]);
  const fetchOrders = useProcurementStore((s) => s.fetchOrders);
  const fetchReceipts = useProcurementStore((s) => s.fetchReceipts);
  const createPOStore = useProcurementStore((s) => s.createPurchaseOrder);
  const createGRNStore = useProcurementStore((s) => s.createGoodsReceipt);

  const vendors = useVendorsStore((s) => s.vendors as Vendor[]);
  const fetchVendors = useVendorsStore((s) => s.fetchVendors);

  const products = useProductsStore((s) => s.products as Product[]);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const taxCodes = useTaxStore((s) => s.taxCodes as TaxCode[]);
  const fetchTaxCodes = useTaxStore((s) => s.fetchTaxCodes);

  const [loading, setLoading] = useState(true);
  
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);

  // New PO State
  const [poVendorId, setPoVendorId] = useState('');
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [poLines, setPoLines] = useState<PurchaseOrderLine[]>([]);

  // New GRN State
  const [grnPoId, setGrnPoId] = useState('');
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split('T')[0]);
  const [grnLines, setGrnLines] = useState<GoodsReceiptNoteLine[]>([]);
  const [selectedPoForGrn, setSelectedPoForGrn] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    fetchData().then(() => {
      const draftPrId = localStorage.getItem('draftPrId');
      if (draftPrId) {
        loadDraftPr(draftPrId);
        localStorage.removeItem('draftPrId');
      }
    });
  }, []);

  const loadDraftPr = async (id: string) => {
    try {
      const prs = await useProcurementStore.getState().fetchRequests(activeEntityId);
      const pr = prs.find((x: any) => x.id === id);
      if (pr && pr.lines) {
        setIsPoModalOpen(true);
        setPoLines(pr.lines.map((l: any) => ({
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: 0,
          taxCodeId: undefined,
          taxAmount: 0,
          destination: 2
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchOrders(activeEntityId),
        fetchReceipts(activeEntityId),
        fetchVendors(activeEntityId),
        fetchProducts(),
        fetchTaxCodes(),
      ]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getTaxPercentage = (taxCodeId?: string) => {
    if (!taxCodeId) return 0;
    const code = taxCodes.find(c => c.id === taxCodeId);
    if (!code || code.rates.length === 0) return 0;
    return code.rates[code.rates.length - 1].percentage;
  };

  const defaultTaxAuthorityId = React.useMemo(() => {
    return entities?.find((e: any) => e.id === activeEntityId)?.taxAuthorityId || '';
  }, [entities, activeEntityId]);

  const groupedTaxCodes = React.useMemo(() => {
    return {
      default: taxCodes.filter(t => (t as any).taxAuthorityId === defaultTaxAuthorityId),
      other: taxCodes.filter(t => (t as any).taxAuthorityId !== defaultTaxAuthorityId)
    };
  }, [taxCodes, defaultTaxAuthorityId]);

  const addPoLine = () => {
    setPoLines([...poLines, { productId: '', description: '', quantity: 1, unitPrice: 0, taxCodeId: undefined, taxAmount: 0, destination: 2 }]);
  };

  const updatePoLine = (index: number, field: keyof PurchaseOrderLine, value: any) => {
    const newLines = [...poLines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newLines[index].unitPrice = prod.unitPrice;
        newLines[index].taxCodeId = prod.taxCodeId;
        newLines[index].description = prod.name;
        
        const rate = getTaxPercentage(prod.taxCodeId);
        newLines[index].taxAmount = (newLines[index].quantity * newLines[index].unitPrice * rate) / 100;
      }
    } else if (field === 'quantity' || field === 'unitPrice' || field === 'taxCodeId') {
      const rate = getTaxPercentage(newLines[index].taxCodeId);
      newLines[index].taxAmount = (newLines[index].quantity * newLines[index].unitPrice * rate) / 100;
    }
    
    setPoLines(newLines);
  };

  // Re-calculate prices for PR items when PO is opened
  useEffect(() => {
    if (poLines.length > 0 && products.length > 0 && poLines.some(l => l.unitPrice === 0 && l.productId)) {
      setPoLines(curr => curr.map(l => {
        if (l.unitPrice === 0 && l.productId) {
          const prod = products.find(p => p.id === l.productId);
          if (prod) {
            const rate = getTaxPercentage(prod.taxCodeId);
            return {
              ...l,
              unitPrice: prod.unitPrice,
              taxCodeId: prod.taxCodeId,
              description: l.description || prod.name,
              taxAmount: (l.quantity * prod.unitPrice * rate) / 100
            };
          }
        }
        return l;
      }));
    }
  }, [poLines, products, taxCodes]);

  const submitPo = async () => {
    if (!poVendorId || poLines.length === 0) return alert('Vendor and at least one line required.');
    try {
      await createPOStore({
        vendorId: poVendorId,
        date: poDate,
        lines: poLines,
        companyId: activeEntityId || null
      });
      setIsPoModalOpen(false);
      setPoVendorId('');
      setPoLines([]);
    } catch (e: any) {
      alert(e.message || 'Failed to create PO');
    }
  };

  const handleGrnPoChange = (id: string) => {
    setGrnPoId(id);
    const po = pos.find(p => p.id === id);
    setSelectedPoForGrn(po || null);
    if (po) {
      setGrnLines(po.lines.filter(l => l.receivedQuantity! < l.quantity).map(l => ({
        purchaseOrderLineId: l.id!,
        quantityReceived: l.quantity - l.receivedQuantity!
      })));
    } else {
      setGrnLines([]);
    }
  };

  const updateGrnLine = (id: string, qty: number) => {
    setGrnLines(grnLines.map(l => l.purchaseOrderLineId === id ? { ...l, quantityReceived: qty } : l));
  };

  const submitGrn = async () => {
    if (!grnPoId || grnLines.length === 0) return alert('PO and at least one line required.');
    try {
      await createGRNStore({
        purchaseOrderId: grnPoId,
        dateReceived: grnDate,
        lines: grnLines,
        companyId: activeEntityId || null
      });
      setIsGrnModalOpen(false);
      setGrnPoId('');
      setGrnLines([]);
    } catch (e: any) {
      alert(e.message || 'Failed to create Goods Receipt');
    }
  };

  const getStatusString = (s: number) => ['Draft', 'Issued', 'Partially Rcvd', 'Fulfilled'][s];
  const getDestString = (d: number) => ['Inventory', 'Fixed Asset', 'Expense'][d];

  if (loading) return <div className="p-8 text-center text-gray-500">Loading procurement dashboard...</div>;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <span className="text-lg">📦</span> Purchase Orders & GRN
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <DataToolbar
            exportFileName="purchase-orders-grns"
            exportSheetName="Purchase Orders & GRNs"
            exportTitle="Purchase Orders & Goods Receipts"
            exportSubtitle="Procurement purchase orders and goods receipt notes."
            exportHeaders={['PO Number', 'Date', 'Vendor', 'Total Amount', 'Status']}
            exportRows={pos.map((po: any) => {
              const vendor = vendors.find(v => v.id === po.vendorId);
              const total = po.lines.reduce((s: number, l: any) => s + (l.totalAmount || 0), 0);
              return [po.poNumber, po.date, vendor?.name || 'Unknown', total, getStatusString(po.status)];
            })}
            exportTotals={[{ label: 'Total PO Value', value: pos.reduce((s: number, po: any) => s + po.lines.reduce((a: number, l: any) => a + (l.totalAmount || 0), 0), 0) }]}
            onRefresh={fetchData}
          />
          <button onClick={() => setIsPoModalOpen(true)}
            className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap">
            + New PO
          </button>
          <button onClick={() => setIsGrnModalOpen(true)}
            className="h-8 px-2.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap">
            + GRN
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setActiveTab('pos')} className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'pos' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}>Purchase Orders</button>
          <button onClick={() => setActiveTab('grns')} className={`flex-1 py-4 text-sm font-medium transition-colors ${activeTab === 'grns' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'}`}>Goods Receipts (GRN)</button>
        </div>
        <div className="p-6">
          {activeTab === 'pos' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium">PO Number</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Vendor</th>
                    <th className="pb-3 font-medium text-right">Total Amount</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pos.map(po => {
                    const vendor = vendors.find(v => v.id === po.vendorId);
                    const total = po.lines.reduce((s, l) => s + (l.totalAmount || 0), 0);
                    return (
                      <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 font-medium text-gray-900">{po.poNumber}</td>
                        <td className="py-4 text-gray-500">{po.date}</td>
                        <td className="py-4 text-gray-700">{vendor?.name || 'Unknown'}</td>
                        <td className="py-4 text-gray-900 font-medium text-right">${total.toFixed(2)}</td>
                        <td className="py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${po.status === 3 ? 'bg-green-100 text-green-700' : po.status === 1 ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                            {getStatusString(po.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {pos.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No purchase orders found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'grns' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-100">
                    <th className="pb-3 font-medium">GRN Number</th>
                    <th className="pb-3 font-medium">Date Received</th>
                    <th className="pb-3 font-medium">PO Reference</th>
                    <th className="pb-3 font-medium text-center">Lines Received</th>
                    <th className="pb-3 font-medium text-center">Processed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {grns.map(grn => {
                    const po = pos.find(p => p.id === grn.purchaseOrderId);
                    return (
                      <tr key={grn.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 font-medium text-gray-900">{grn.grnNumber}</td>
                        <td className="py-4 text-gray-500">{grn.dateReceived}</td>
                        <td className="py-4 text-blue-600">{po?.poNumber || 'Unknown'}</td>
                        <td className="py-4 text-gray-900 text-center">{grn.lines.length} lines</td>
                        <td className="py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${grn.isProcessed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {grn.isProcessed ? 'Processed to Inventory/Asset' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {grns.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No goods receipts found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isPoModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in pl-64">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Create Purchase Order</h2>
              <button onClick={() => setIsPoModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor</label>
                  <select value={poVendorId} onChange={e => setPoVendorId(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name} ({v.vendorNumber})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">PO Date</label>
                  <input type="date" value={poDate} onChange={e => setPoDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
                </div>
              </div>

              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                <button onClick={addPoLine} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                  + Add Line
                </button>
              </div>

              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium w-1/4">Product/Service</th>
                    <th className="pb-2 font-medium w-1/6">Destination</th>
                    <th className="pb-2 font-medium w-1/12 text-right">Qty</th>
                    <th className="pb-2 font-medium w-1/6 text-right">Price</th>
                    <th className="pb-2 font-medium w-1/6 text-right">Tax Code</th>
                    <th className="pb-2 font-medium w-1/6 text-right">Total</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {poLines.map((line, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-2">
                        <select value={line.productId} onChange={e => updatePoLine(i, 'productId', e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          <option value="">Select...</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <select value={line.destination} onChange={e => updatePoLine(i, 'destination', parseInt(e.target.value))} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          <option value={0}>Inventory (Resale)</option>
                          <option value={1}>Fixed Asset (Internal)</option>
                          <option value={2}>Expense</option>
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" min="1" value={line.quantity} onChange={e => updatePoLine(i, 'quantity', parseFloat(e.target.value))} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right" />
                      </td>
                      <td className="py-2 pr-2">
                        <input type="number" step="0.01" value={line.unitPrice} onChange={e => updatePoLine(i, 'unitPrice', parseFloat(e.target.value))} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right" />
                      </td>
                      <td className="py-2 pr-2">
                        <select value={line.taxCodeId || ''} onChange={e => updatePoLine(i, 'taxCodeId', e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          <option value="">No Tax</option>
                          {groupedTaxCodes.default.length > 0 && (
                            <optgroup label="Default Tax Authority">
                              {groupedTaxCodes.default.map(c => <option key={c.id} value={c.id}>{c.code} ({c.rates.length > 0 ? c.rates[c.rates.length - 1].percentage : 0}%)</option>)}
                            </optgroup>
                          )}
                          {groupedTaxCodes.other.length > 0 && (
                            <optgroup label="Other Tax Authorities">
                              {groupedTaxCodes.other.map(c => <option key={c.id} value={c.id}>{c.code} ({c.rates.length > 0 ? c.rates[c.rates.length - 1].percentage : 0}%)</option>)}
                            </optgroup>
                          )}
                        </select>
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900 pr-4">
                        ${((line.quantity * line.unitPrice) + line.taxAmount).toFixed(2)}
                      </td>
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => setPoLines(poLines.filter((_, idx) => idx !== i))} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">✕</button>
                      </td>
                    </tr>
                  ))}
                  {poLines.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-gray-400">No lines added. Click "+ Add Line" to begin.</td></tr>}
                </tbody>
              </table>

                {poLines.length > 0 && (() => {
                  const subtotal = poLines.reduce((sum, l) => sum + ((l.quantity || 0) * (l.unitPrice || 0)), 0);
                  const taxTotal = poLines.reduce((sum, l) => sum + (l.taxAmount || 0), 0);
                  const grandTotal = subtotal + taxTotal;
                  return (
                    <div style={{ marginTop: 16, padding: '12px 16px', background: '#f1f5f9', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40 }}>
                        <div style={{ textAlign: 'right' as const }}>
                          <span style={{ fontSize: 11, textTransform: 'uppercase' as const, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>Subtotal</span>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#334155', fontFamily: 'monospace', margin: '2px 0 0' }}>${subtotal.toFixed(2)}</p>
                        </div>
                        <div style={{ textAlign: 'right' as const }}>
                          <span style={{ fontSize: 11, textTransform: 'uppercase' as const, color: '#dc2626', fontWeight: 600, letterSpacing: '0.05em' }}>Tax (VAT/GST/Sales Tax)</span>
                          <p style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', fontFamily: 'monospace', margin: '2px 0 0' }}>${taxTotal.toFixed(2)}</p>
                        </div>
                        <div style={{ textAlign: 'right' as const, borderLeft: '2px solid #cbd5e1', paddingLeft: 20 }}>
                          <span style={{ fontSize: 11, textTransform: 'uppercase' as const, color: '#047857', fontWeight: 700, letterSpacing: '0.05em' }}>Grand Total</span>
                          <p style={{ fontSize: 18, fontWeight: 800, color: '#047857', fontFamily: 'monospace', margin: '2px 0 0' }}>${grandTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button onClick={() => setIsPoModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={submitPo} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm shadow-blue-600/20 transition-all">Issue Purchase Order</button>
            </div>
          </div>
        </div>
      )}

      {isGrnModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in pl-64">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Receive Goods (GRN)</h2>
              <button onClick={() => setIsGrnModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 flex gap-3 text-sm text-blue-800">
                <span className="text-blue-500">ℹ️</span>
                <p>Processing a GRN will automatically increase Inventory quantities or create Fixed Assets in the Asset Register, depending on the destination selected during PO creation.</p>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Purchase Order</label>
                  <select value={grnPoId} onChange={e => handleGrnPoChange(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none">
                    <option value="">Select PO...</option>
                    {pos.filter(p => p.status === 1 || p.status === 2).map(p => <option key={p.id} value={p.id}>{p.poNumber} ({vendors.find(v => v.id === p.vendorId)?.name})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Received</label>
                  <input type="date" value={grnDate} onChange={e => setGrnDate(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none" />
                </div>
              </div>

              {selectedPoForGrn && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Items to Receive</h3>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="pb-2 font-medium">Product/Description</th>
                        <th className="pb-2 font-medium">Destination</th>
                        <th className="pb-2 font-medium text-right">Ordered Qty</th>
                        <th className="pb-2 font-medium text-right">Previously Rcvd</th>
                        <th className="pb-2 font-medium text-right w-32">Receiving Now</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedPoForGrn.lines.map(line => {
                        const grnLine = grnLines.find(l => l.purchaseOrderLineId === line.id);
                        if (!grnLine) return null;
                        const p = products.find(prod => prod.id === line.productId);
                        return (
                          <tr key={line.id}>
                            <td className="py-3 pr-2 text-gray-900">{p?.code} - {p?.name}</td>
                            <td className="py-3 pr-2 text-gray-500">{getDestString(line.destination)}</td>
                            <td className="py-3 pr-2 text-right">{line.quantity}</td>
                            <td className="py-3 pr-2 text-right text-gray-500">{line.receivedQuantity || 0}</td>
                            <td className="py-3 text-right">
                              <input 
                                type="number" 
                                min="0" 
                                max={line.quantity - (line.receivedQuantity || 0)} 
                                value={grnLine.quantityReceived} 
                                onChange={e => updateGrnLine(line.id!, parseFloat(e.target.value) || 0)} 
                                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-right focus:bg-white focus:border-blue-500" 
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button onClick={() => setIsGrnModalOpen(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
              <button onClick={submitGrn} disabled={!grnPoId} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-sm shadow-green-600/20 transition-all">Process Goods Receipt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
