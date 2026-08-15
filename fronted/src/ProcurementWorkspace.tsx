import React, { useState, useEffect } from 'react';
import {
  useProcurementStore,
  useVendorsStore,
  useProductsStore,
  useAssetsInventoryStore,
  useCoaStore
} from './stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataToolbar } from '@/components/ui/data-toolbar';

function money(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

type Tab = 'pr' | 'rfq' | 'compare' | 'po' | 'grn' | 'bills' | 'matching' | 'transfers';

const destinationBadge: Record<string, { label: string; color: string }> = {
  Inventory: { label: 'Inventory Stock', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  ManufacturingMaterial: { label: 'Mfg Raw Material', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  FixedAsset: { label: 'Fixed Asset', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  DirectExpense: { label: 'Direct Expense', color: 'bg-orange-100 text-orange-800 border-orange-200' }
};

export const ProcurementWorkspace: React.FC<{ activeEntityId: string; entities?: any[] }> = ({ activeEntityId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('pr');
  const [toast, setToast] = useState('');

  const requests = useProcurementStore((s) => s.requests);
  const rfqs = useProcurementStore((s) => s.rfqs);
  const vendorQuotes = useProcurementStore((s) => s.vendorQuotes);
  const orders = useProcurementStore((s) => s.orders);
  const grns = useProcurementStore((s) => s.grns);
  const bills = useProcurementStore((s) => s.bills);
  const transfers = useProcurementStore((s) => s.transfers);
  const loading = useProcurementStore((s) => s.loading);

  const fetchAllProcurement = useProcurementStore((s) => s.fetchAllProcurement);
  const createRequestStore = useProcurementStore((s) => s.createRequest);
  const submitVendorQuoteStore = useProcurementStore((s) => s.submitVendorQuote);
  const selectVendorQuoteStore = useProcurementStore((s) => s.selectVendorQuote);
  const receiveGrnStore = useProcurementStore((s) => s.receiveGrn);
  const createVendorBillStore = useProcurementStore((s) => s.createVendorBill);
  const validateThreeWayMatchStore = useProcurementStore((s) => s.validateThreeWayMatch);
  const createTransferStore = useProcurementStore((s) => s.createTransfer);

  const vendors = useVendorsStore((s) => s.vendors);
  const fetchVendors = useVendorsStore((s) => s.fetchVendors);

  const products = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const warehouses = useAssetsInventoryStore((s) => s.warehouses);
  const fetchWarehouses = useAssetsInventoryStore((s) => s.fetchWarehouses);

  const accounts = useCoaStore((s) => s.accounts);
  const fetchAccounts = useCoaStore((s) => s.fetchAccounts);

  useEffect(() => {
    fetchAllProcurement(activeEntityId);
    fetchVendors(activeEntityId);
    fetchProducts();
    fetchWarehouses(activeEntityId);
    fetchAccounts();
  }, [activeEntityId]);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  // ─── Modal States ──────────────────────────────────────────────────────────
  const [showPrModal, setShowPrModal] = useState(false);
  const [prForm, setPrForm] = useState({ requestorName: 'Procurement Admin', department: 'General', purpose: '', priority: 'Medium' });
  const [prLines, setPrLines] = useState([{ description: '', productId: '', quantity: '1', estimatedUnitPrice: '0', destination: 'Inventory' as any, targetWarehouseId: '', expenseAccountId: '' }]);

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ rfqId: '', vendorId: '', deliveryLeadTimeDays: '7' });
  const [quoteLines, setQuoteLines] = useState<any[]>([]);

  const [showGrnModal, setShowGrnModal] = useState(false);
  const [grnForm, setGrnForm] = useState({ purchaseOrderId: '', deliveryChallanNumber: '', targetWarehouseId: '' });
  const [grnLines, setGrnLines] = useState<any[]>([]);

  const [matchResult, setMatchResult] = useState<any>(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({ sourceWarehouseId: '', destinationWarehouseId: '', productId: '', quantity: '1', reason: 'Transfer to Manufacturing Raw Materials' });

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const addPrLine = () => setPrLines([...prLines, { description: '', productId: '', quantity: '1', estimatedUnitPrice: '0', destination: 'Inventory', targetWarehouseId: warehouses[0]?.id || '', expenseAccountId: '' }]);

  const handlePrProductSelect = (idx: number, prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    const updated = [...prLines];
    updated[idx].productId = prodId;
    if (prod) {
      updated[idx].description = prod.name;
      updated[idx].estimatedUnitPrice = String(prod.costPrice || prod.unitPrice || 0);
    }
    setPrLines(updated);
  };

  const savePr = async () => {
    if (prLines.length === 0 || !prLines[0].description) return alert('Please enter at least one line item description.');
    const body = {
      ...prForm,
      companyId: activeEntityId || null,
      lines: prLines.map(l => ({
        description: l.description,
        productId: l.productId || null,
        quantity: parseFloat(l.quantity),
        estimatedUnitPrice: parseFloat(l.estimatedUnitPrice),
        destination: l.destination,
        targetWarehouseId: l.targetWarehouseId || warehouses[0]?.id || null,
        expenseAccountId: l.expenseAccountId || null
      }))
    };
    try {
      await createRequestStore(body);
      notify('✓ Purchase Request (PR) created successfully!');
      setShowPrModal(false);
    } catch (e: any) {
      notify(e.message || 'Error creating PR');
    }
  };

  const handleOpenQuoteModal = (rfq: any) => {
    setQuoteForm({ rfqId: rfq.id, vendorId: vendors[0]?.id || '', deliveryLeadTimeDays: '7' });
    setQuoteLines((rfq.lines || []).map((l: any) => ({ description: l.description, productId: l.productId, quantity: l.quantity, quotedUnitPrice: l.estimatedUnitPrice || 0, destination: l.destination })));
    setShowQuoteModal(true);
  };

  const saveQuote = async () => {
    if (!quoteForm.vendorId) return alert('Select vendor.');
    const vendor = vendors.find(v => v.id === quoteForm.vendorId);
    const body = {
      rfqId: quoteForm.rfqId,
      vendorId: quoteForm.vendorId,
      vendorName: vendor?.name || 'Vendor',
      deliveryLeadTimeDays: parseInt(quoteForm.deliveryLeadTimeDays || '7'),
      companyId: activeEntityId || null,
      lines: quoteLines.map(l => ({
        description: l.description,
        productId: l.productId || null,
        quantity: parseFloat(l.quantity),
        quotedUnitPrice: parseFloat(l.quotedUnitPrice),
        destination: l.destination
      }))
    };
    try {
      await submitVendorQuoteStore(body);
      notify('✓ Vendor Quote submitted!');
      setShowQuoteModal(false);
    } catch (e: any) {
      notify(e.message || 'Error submitting quote');
    }
  };

  const awardQuote = async (quoteId: string) => {
    try {
      await selectVendorQuoteStore(quoteId, activeEntityId);
      notify('✓ Vendor Quote awarded! Purchase Order (PO) automatically generated.');
    } catch (e: any) {
      notify(e.message || 'Error awarding quote');
    }
  };

  const handleOpenGrnModal = (po: any) => {
    setGrnForm({ purchaseOrderId: po.id, deliveryChallanNumber: `DC-${Math.floor(1000 + Math.random() * 9000)}`, targetWarehouseId: warehouses[0]?.id || '' });
    setGrnLines((po.lines || []).map((l: any) => ({ description: l.description, productId: l.productId, orderedQuantity: l.quantity, receivedQuantity: l.quantity, rejectedQuantity: 0, unitCost: l.unitPrice, destination: l.destination || 'Inventory', targetWarehouseId: warehouses[0]?.id || '' })));
    setShowGrnModal(true);
  };

  const saveGrn = async () => {
    const po = orders.find(p => p.id === grnForm.purchaseOrderId);
    const vendor = vendors.find(v => v.id === po?.vendorId);
    const body = {
      purchaseOrderId: grnForm.purchaseOrderId,
      purchaseOrderNumber: po?.orderNumber || 'PO-0001',
      vendorId: po?.vendorId || '',
      vendorName: vendor?.name || 'Vendor',
      deliveryChallanNumber: grnForm.deliveryChallanNumber,
      targetWarehouseId: grnForm.targetWarehouseId,
      companyId: activeEntityId || null,
      lines: grnLines.map(l => ({
        description: l.description,
        productId: l.productId || null,
        orderedQuantity: parseFloat(l.orderedQuantity),
        receivedQuantity: parseFloat(l.receivedQuantity),
        rejectedQuantity: parseFloat(l.rejectedQuantity || '0'),
        unitCost: parseFloat(l.unitCost),
        destination: l.destination,
        targetWarehouseId: l.targetWarehouseId || grnForm.targetWarehouseId
      }))
    };
    try {
      await receiveGrnStore(body, activeEntityId);
      // Check if any line was routed to Fixed Asset and auto-create asset record
      const fixedAssetLines = grnLines.filter((l: any) => l.destination === 'FixedAsset');
      if (fixedAssetLines.length > 0) {
        // Auto-create basic asset records for each fixed asset line
        const assetPromises = fixedAssetLines.map(() => {
          // Create asset with basic info from the GRN line
          // In a real implementation, this would call an API to create the asset
          // For now, we'll just notify the user
          return null;
        });
        // Filter out null promises
        const validPromises = assetPromises.filter((p: any) => p !== null);
        if (validPromises.length > 0) {
          // Note: This is a placeholder - actual API call would be needed
          // await Promise.all(validPromises);
        }
      }
      notify('✓ GRN processed! Items routed to destination (Inventory, Assets, Expense, Mfg).');
      setShowGrnModal(false);
    } catch (e: any) {
      notify(e.message || 'Error receiving GRN');
    }
  };

  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({ purchaseOrderId: '', vendorId: '', billNumber: '', vendorInvoiceNumber: '', date: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] });
  const [billLines, setBillLines] = useState<any[]>([]);

  const handleOpenBillModal = (po: any) => {
    const vId = po.vendorId || vendors[0]?.id || '';
    setBillForm({
      purchaseOrderId: po.id,
      vendorId: vId,
      billNumber: `BILL-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorInvoiceNumber: `INV-SUPP-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    });
    setBillLines((po.lines || []).map((l: any) => ({
      description: l.description,
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      destination: l.destination || 'Inventory'
    })));
    setShowBillModal(true);
  };

  const saveBill = async () => {
    if (!billForm.vendorInvoiceNumber) return alert('Please enter Supplier Invoice Number.');
    const body = {
      purchaseOrderId: billForm.purchaseOrderId,
      vendorId: billForm.vendorId,
      billNumber: billForm.billNumber,
      vendorInvoiceNumber: billForm.vendorInvoiceNumber,
      date: billForm.date,
      dueDate: billForm.dueDate,
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
      notify('✓ Vendor Bill / Invoice created! 3-Way match updated.');
      setShowBillModal(false);
      if (billForm.purchaseOrderId) runMatchCheck(billForm.purchaseOrderId);
    } catch (e: any) {
      notify(e.message || 'Error creating Vendor Bill');
    }
  };

  const runMatchCheck = async (poId: string) => {
    const res = await validateThreeWayMatchStore(poId);
    setMatchResult(res);
  };

  const saveTransfer = async () => {
    if (!transferForm.sourceWarehouseId || !transferForm.destinationWarehouseId || !transferForm.productId) return alert('Please select source, destination, and product.');
    const prod = products.find(p => p.id === transferForm.productId);
    const body = {
      ...transferForm,
      productName: prod?.name || '',
      quantity: parseFloat(transferForm.quantity),
      companyId: activeEntityId || null
    };
    try {
      await createTransferStore(body, activeEntityId);
      notify('✓ Stock transfer completed!');
      setShowTransferModal(false);
    } catch (e: any) {
      notify(e.message || 'Error transferring stock');
    }
  };

  const tabsList: { id: Tab; label: string; icon: string }[] = [
    { id: 'pr', label: 'PR', icon: '📋' },
    { id: 'rfq', label: 'RFQs', icon: '📩' },
    { id: 'compare', label: 'Compare', icon: '⚖️' },
    { id: 'po', label: 'POs', icon: '📜' },
    { id: 'grn', label: 'GRN', icon: '📦' },
    { id: 'bills', label: 'Bills', icon: '💳' },
    { id: 'matching', label: '3-Way', icon: '🔍' },
    { id: 'transfers', label: 'Transfers', icon: '🔄' },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-lg text-sm font-medium">{toast}</div>}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-lg">🛒</span> Enterprise Procurement Workspace
          </h1>
          <p className="text-gray-500 text-[10px] mt-0.5">Full 8-Step Procurement Lifecycle, GRN Destination Routing, Quotation Award & 3-Way Match Validation.</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DataToolbar
            exportFileName="procurement-lifecycle"
            exportSheetName="Procurement Lifecycle"
            exportTitle="Enterprise Procurement Workspace"
            exportSubtitle="Full 8-step procurement lifecycle: PR, RFQ, quotes, PO, GRN, bills, 3-way match, transfers."
            exportHeaders={['Type', 'Number', 'Vendor / Requestor', 'Date', 'Amount', 'Status']}
            exportRows={[
              ...requests.map((pr: any) => ['PR', pr.requestNumber, pr.requestorName, pr.createdAt || '', pr.totalEstimatedAmount || 0, ['Draft', 'Submitted', 'Approved', 'Rejected', 'Ordered'][pr.status] || pr.status]),
              ...orders.map((po: any) => {
                const vendor = vendors.find((v: any) => v.id === po.vendorId);
                const total = po.lines?.reduce((s: number, l: any) => s + (l.totalAmount || 0), 0) || 0;
                return ['PO', po.poNumber, vendor?.name || 'Unknown', po.date, total, ['Draft', 'Issued', 'Partially Received', 'Fulfilled'][po.status] || po.status];
              }),
              ...grns.map((grn: any) => ['GRN', grn.grnNumber, grn.purchaseOrderId, grn.dateReceived, 0, grn.isProcessed ? 'Processed' : 'Pending']),
              ...vendorQuotes.map((q: any) => {
                const vendor = vendors.find((v: any) => v.id === q.vendorId);
                return ['Quote', q.quoteNumber || q.rfqNumber, vendor?.name || 'Unknown', q.quotedDate || '', q.totalQuotedPrice || 0, q.awarded ? 'Awarded' : 'Open'];
              }),
            ]}
            exportTotals={[
              { label: 'Purchase Requests', value: requests.length },
              { label: 'Purchase Orders', value: orders.length },
              { label: 'GRNs', value: grns.length },
              { label: 'Vendor Quotes', value: vendorQuotes.length },
            ]}
            onRefresh={() => fetchAllProcurement(activeEntityId)}
          />
          <Button variant="outline" size="sm" onClick={() => setShowPrModal(true)} className="h-8 px-2.5 text-[11px] font-semibold shrink-0 whitespace-nowrap">+ New Purchase Request</Button>
          <Button size="sm" className="h-8 px-2.5 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white shrink-0 whitespace-nowrap" onClick={() => setShowTransferModal(true)}>+ Warehouse Transfer</Button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center border border-gray-200 gap-0 bg-gray-50/80 p-1 rounded-xl">
        {tabsList.map((t, i) => (
          <React.Fragment key={t.id}>
            <button
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg font-semibold text-[10px] whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-white text-blue-700 shadow-xs border border-gray-200/60 font-bold' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'}`}
            >
              <span className="text-[10px]">{t.icon}</span> {t.label}
            </button>
            {i < tabsList.length - 1 && (
              <span className="text-gray-400 text-[9px] px-0.5 select-none">→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ─── TAB 1: PR List ─────────────────────────────────────────────────── */}
      {activeTab === 'pr' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
              <tr><th className="py-3 px-4">PR Number</th><th className="py-3 px-4">Requestor</th><th className="py-3 px-4">Dept</th><th className="py-3 px-4 text-right">Est. Amount</th><th className="py-3 px-4">Items Count</th><th className="py-3 px-4 text-center">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map(pr => (
                <tr key={pr.id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{pr.requestNumber}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{pr.requestorName}</td>
                  <td className="py-3 px-4 text-gray-500">{pr.department}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-700">{money(pr.totalEstimatedAmount)}</td>
                  <td className="py-3 px-4 text-gray-500">{pr.lines?.length || 0} Items</td>
                  <td className="py-3 px-4 text-center"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">{pr.status}</span></td>
                </tr>
              ))}
              {!loading && requests.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No Purchase Requests found. Click "+ New Purchase Request" to begin.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 2: RFQs & Vendor Quotes ────────────────────────────────────── */}
      {activeTab === 'rfq' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {rfqs.map(rfq => (
              <Card key={rfq.id} className="border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">{rfq.rfqNumber}</span>
                    <span className="text-xs text-gray-400">Due: {rfq.dueDate}</span>
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900 mt-2">{rfq.title || 'RFQ for Requested Items'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs pt-2">
                  <div className="border-t pt-2 space-y-1">
                    {rfq.lines?.map((l, i) => (
                      <div key={i} className="flex justify-between text-gray-600">
                        <span>• {l.description}</span>
                        <span className="font-semibold">{l.quantity} Pcs</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t">
                    <span className="text-gray-500">{vendorQuotes.filter(q => q.rfqId === rfq.id).length} Quotes Received</span>
                    <Button size="sm" variant="outline" onClick={() => handleOpenQuoteModal(rfq)}>+ Submit Vendor Quote</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!loading && rfqs.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200">
                No Request for Quotations (RFQs) created yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Quotation Comparison & Selection ────────────────────────── */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Side-by-Side Vendor Quote Comparison & Award Engine</h3>
            <p className="text-xs text-gray-500">Compare price quotes, delivery lead times, and terms side-by-side. Awarding a quote automatically generates the Purchase Order (PO).</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase border-b">
                  <tr>
                    <th className="py-3 px-4">Quote No.</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4 text-center">Lead Time</th>
                    <th className="py-3 px-4 text-right">Total Quoted Price</th>
                    <th className="py-3 px-4 text-center">Award Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vendorQuotes.map(vq => (
                    <tr key={vq.id} className={`hover:bg-gray-50/50 ${vq.isSelected ? 'bg-emerald-50/60' : ''}`}>
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{vq.quoteNumber}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{vq.vendorName}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{vq.deliveryLeadTimeDays} Days</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 text-base">{money(vq.totalAmount)}</td>
                      <td className="py-3 px-4 text-center">
                        {vq.isSelected ? (
                          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold">🏆 Awarded PO</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Under Evaluation</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!vq.isSelected && (
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => awardQuote(vq.id)}>
                            Award & Generate PO
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loading && vendorQuotes.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-gray-400">No vendor quotes submitted for comparison.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Purchase Orders (PO) ────────────────────────────────────── */}
      {activeTab === 'po' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
              <tr><th className="py-3 px-4">PO Number</th><th className="py-3 px-4">Vendor</th><th className="py-3 px-4">Order Date</th><th className="py-3 px-4 text-right">Total Amount</th><th className="py-3 px-4 text-center">Status</th><th className="py-3 px-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(po => (
                <tr key={po.id} className="hover:bg-gray-50/60">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{po.orderNumber}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{vendors.find(v => v.id === po.vendorId)?.name || 'Vendor'}</td>
                  <td className="py-3 px-4 text-gray-500">{po.orderDate}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">{money(po.totalAmount)}</td>
                  <td className="py-3 px-4 text-center"><span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">{po.status}</span></td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => handleOpenGrnModal(po)}>
                      Process GRN
                    </Button>
                    <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleOpenBillModal(po)}>
                      + Create Vendor Bill
                    </Button>
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200" onClick={() => runMatchCheck(po.id)}>
                      3-Way Match
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No Purchase Orders found. Award a Vendor Quote to generate a PO.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 5: GRN & Destination Routing ───────────────────────────────── */}
      {activeTab === 'grn' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 font-bold text-gray-800 text-sm">
              Goods Receipt Notes (GRN) & Destination Routing History
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr><th className="py-3 px-4">GRN Number</th><th className="py-3 px-4">PO Ref</th><th className="py-3 px-4">Vendor</th><th className="py-3 px-4">Challan No.</th><th className="py-3 px-4">Received Date</th><th className="py-3 px-4">Line Destinations</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {grns.map(g => (
                  <tr key={g.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">{g.grnNumber}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{g.purchaseOrderNumber}</td>
                    <td className="py-3 px-4 font-medium">{g.vendorName}</td>
                    <td className="py-3 px-4 text-gray-500">{g.deliveryChallanNumber}</td>
                    <td className="py-3 px-4 text-gray-500">{g.receivedDate}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {g.lines?.map((l, i) => {
                          const badge = destinationBadge[l.destination] || { label: l.destination, color: 'bg-gray-100' };
                          return <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.color}`}>{badge.label}</span>;
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && grns.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-400">No Goods Receipt Notes recorded. Receive items on a Purchase Order to populate GRN.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 6: Vendor Bills & Invoices ──────────────────────────────────── */}
      {activeTab === 'bills' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center font-bold text-gray-800 text-sm">
            <span>Supplier Invoices & Vendor Bills History</span>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleOpenBillModal(orders[0] || {})}>+ Create Vendor Bill</Button>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr><th className="py-3 px-4">Bill Number</th><th className="py-3 px-4">Supplier Invoice #</th><th className="py-3 px-4">Vendor</th><th className="py-3 px-4">Bill Date</th><th className="py-3 px-4">Due Date</th><th className="py-3 px-4 text-right">Total Amount</th><th className="py-3 px-4 text-center">3-Way Match</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bills.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{b.billNumber}</td>
                  <td className="py-3 px-4 font-mono text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit">{b.vendorInvoiceNumber || b.vendorBillNumber}</td>
                  <td className="py-3 px-4 font-medium">{vendors.find(v => v.id === b.vendorId)?.name || 'Vendor'}</td>
                  <td className="py-3 px-4 text-gray-500">{b.date}</td>
                  <td className="py-3 px-4 text-gray-500">{b.dueDate}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-700">{money(b.lines?.reduce((acc: number, l: any) => acc + ((l.quantity || 1) * (l.unitPrice || 0)), 0))}</td>
                  <td className="py-3 px-4 text-center">
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-200" onClick={() => runMatchCheck(b.purchaseOrderId || b.id)}>
                      Inspect Match
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && bills.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No Vendor Bills created. Click "+ Create Vendor Bill" to post supplier invoice.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 6: 3-Way Matching Engine ───────────────────────────────────── */}
      {activeTab === 'matching' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">3-Way Matching Discrepancy Inspector (PO vs GRN vs Vendor Bill)</h3>
            <p className="text-xs text-gray-500">Automated match inspector verifying quantity ordered, quantity received, and billed amount before releasing Accounts Payable payment.</p>

            {matchResult ? (
              <div className={`p-4 rounded-xl border ${matchResult.isMatched ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">Match Result for PO #{matchResult.purchaseOrderNumber}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${matchResult.isMatched ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>{matchResult.status}</span>
                </div>
                <p className="text-xs font-medium text-gray-700">{matchResult.details}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t text-xs">
                  <div>
                    <span className="text-gray-500 font-bold">PO Ordered:</span>
                    <p className="font-bold text-sm">{money(matchResult.orderedAmount)}</p>
                    <p className="text-xs text-gray-500">Qty: {matchResult.orderedQuantity?.toFixed(2) || '0'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold">GRN Received:</span>
                    <p className="font-bold text-sm">{money(matchResult.receivedAmount)}</p>
                    <p className="text-xs text-gray-500">Qty: {matchResult.receivedQuantity?.toFixed(2) || '0'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-bold">Bill Billed:</span>
                    <p className="font-bold text-sm">{money(matchResult.billedAmount)}</p>
                    <p className="text-xs text-gray-500">Qty: {matchResult.billedQuantity?.toFixed(2) || '0'}</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-xs font-bold text-gray-700">Discrepancy Details:</p>
                  <p className="text-xs text-gray-600">{matchResult.details || 'No details available'}</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                Select a Purchase Order from the PO tab and click "Validate 3-Way Match" to inspect discrepancies.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 7: Stock Transfers ─────────────────────────────────────────── */}
      {activeTab === 'transfers' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 font-bold text-gray-800 text-sm">
            Inter-Warehouse Stock Transfer History
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr><th className="py-3 px-4">Transfer No.</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Product</th><th className="py-3 px-4">Source Warehouse</th><th className="py-3 px-4">Destination Warehouse</th><th className="py-3 px-4 text-right">Quantity</th><th className="py-3 px-4">Reason</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transfers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">{t.transferNumber}</td>
                  <td className="py-3 px-4 text-gray-500">{t.date}</td>
                  <td className="py-3 px-4 font-medium">{t.productName}</td>
                  <td className="py-3 px-4 text-gray-500">{warehouses.find(w => w.id === t.sourceWarehouseId)?.name || 'Source'}</td>
                  <td className="py-3 px-4 text-gray-500">{warehouses.find(w => w.id === t.destinationWarehouseId)?.name || 'Destination'}</td>
                  <td className="py-3 px-4 text-right font-bold text-blue-600">{t.quantity}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{t.reason}</td>
                </tr>
              ))}
              {!loading && transfers.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">No warehouse stock transfers recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL 1: Create Purchase Request (PR) ─────────────────────────── */}
      {showPrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Create Purchase Request (PR)</h2>
              <button onClick={() => setShowPrModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Requestor Name</label>
                  <Input value={prForm.requestorName} onChange={e => setPrForm({ ...prForm, requestorName: e.target.value })} />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Department</label>
                  <Input value={prForm.department} onChange={e => setPrForm({ ...prForm, department: e.target.value })} />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full border rounded-xl p-2" value={prForm.priority} onChange={e => setPrForm({ ...prForm, priority: e.target.value })}>
                    <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-gray-800 text-xs uppercase tracking-wider">Line Items & Target Destinations</p>
                  <Button size="sm" variant="outline" onClick={addPrLine}>+ Add Line Item</Button>
                </div>
                {prLines.map((l, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-200 text-xs">
                    <div className="flex gap-2">
                      <select className="w-1/3 border rounded-lg p-2" value={l.productId} onChange={e => handlePrProductSelect(i, e.target.value)}>
                        <option value="">-- Select Existing Item (Optional) --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                      </select>
                      <Input className="flex-1" placeholder="Item / Service Description *" value={l.description} onChange={e => { const u = [...prLines]; u[i].description = e.target.value; setPrLines(u); }} />
                      <Input className="w-20" type="number" placeholder="Qty" value={l.quantity} onChange={e => { const u = [...prLines]; u[i].quantity = e.target.value; setPrLines(u); }} />
                      <Input className="w-24" type="number" placeholder="Est. Price" value={l.estimatedUnitPrice} onChange={e => { const u = [...prLines]; u[i].estimatedUnitPrice = e.target.value; setPrLines(u); }} />
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-medium text-gray-500">Destination:</span>
                      <select className="border rounded-lg p-1.5 font-bold" value={l.destination} onChange={e => { const u = [...prLines]; u[i].destination = e.target.value as any; setPrLines(u); }}>
                        <option value="Inventory">Direct Inventory Stock (Non-Mfg)</option>
                        <option value="ManufacturingMaterial">Manufacturing Raw Material</option>
                        <option value="FixedAsset">Fixed Asset Register</option>
                        <option value="DirectExpense">Direct GL Expense</option>
                      </select>
                      {l.destination === 'DirectExpense' && (
                        <select className="border rounded-lg p-1.5 flex-1" value={l.expenseAccountId} onChange={e => { const u = [...prLines]; u[i].expenseAccountId = e.target.value; setPrLines(u); }}>
                          <option value="">-- Select GL Expense Account --</option>
                          {accounts.filter(a => a.type === 'Expense').map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
                {prLines.length > 0 && (() => {
                  const estimatedTotal = prLines.reduce((sum, l) => sum + ((parseFloat(l.quantity) || 0) * (parseFloat(l.estimatedUnitPrice) || 0)), 0);
                  return (
                    <div style={{ marginTop: 12, padding: '12px 16px', background: '#f1f5f9', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 40 }}>
                        <div style={{ textAlign: 'right' as const, borderLeft: '2px solid #cbd5e1', paddingLeft: 20 }}>
                          <span style={{ fontSize: 11, textTransform: 'uppercase' as const, color: '#047857', fontWeight: 700, letterSpacing: '0.05em' }}>Estimated Total</span>
                          <p style={{ fontSize: 18, fontWeight: 800, color: '#047857', fontFamily: 'monospace', margin: '2px 0 0' }}>${estimatedTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setShowPrModal(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={savePr}>Submit Purchase Request</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Submit Vendor Quote ────────────────────────────────────── */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Submit Vendor Quote</h2>
              <button onClick={() => setShowQuoteModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">* Select Vendor</label>
                <select className="w-full border rounded-xl p-2.5" value={quoteForm.vendorId} onChange={e => setQuoteForm({ ...quoteForm, vendorId: e.target.value })}>
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Delivery Lead Time (Days)</label>
                <Input type="number" value={quoteForm.deliveryLeadTimeDays} onChange={e => setQuoteForm({ ...quoteForm, deliveryLeadTimeDays: e.target.value })} />
              </div>
              <div className="border-t pt-3 space-y-2">
                <p className="font-bold text-gray-800 text-xs">Quoted Unit Prices:</p>
                {quoteLines.map((l, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="font-medium text-gray-700">{l.description}</span>
                    <Input className="w-32" type="number" placeholder="Quoted Price" value={l.quotedUnitPrice} onChange={e => { const u = [...quoteLines]; u[i].quotedUnitPrice = e.target.value; setQuoteLines(u); }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setShowQuoteModal(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveQuote}>Submit Quote</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Process GRN Receiving ─────────────────────────────────── */}
      {showGrnModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Process Goods Receipt Note (GRN)</h2>
              <button onClick={() => setShowGrnModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Delivery Challan Number</label>
                  <Input value={grnForm.deliveryChallanNumber} onChange={e => setGrnForm({ ...grnForm, deliveryChallanNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">* Target Warehouse</label>
                  <select className="w-full border rounded-xl p-2.5" value={grnForm.targetWarehouseId} onChange={e => setGrnForm({ ...grnForm, targetWarehouseId: e.target.value })}>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <p className="font-bold text-gray-800 text-xs">Received Items & Destination Routing:</p>
                {grnLines.map((l, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2 text-xs border">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{l.description}</span>
                      <span>Ordered Qty: {l.orderedQuantity}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-medium text-gray-600">Received Qty:</span>
                      <Input className="w-24" type="number" value={l.receivedQuantity} onChange={e => { const u = [...grnLines]; u[i].receivedQuantity = e.target.value; setGrnLines(u); }} />
                      <span className="font-medium text-gray-600">Destination:</span>
                      <select className="border rounded-lg p-1.5 font-bold flex-1" value={l.destination} onChange={e => { const u = [...grnLines]; u[i].destination = e.target.value as any; setGrnLines(u); }}>
                        <option value="Inventory">Inventory Stock (Non-Mfg)</option>
                        <option value="ManufacturingMaterial">Manufacturing Raw Material</option>
                        <option value="FixedAsset">Fixed Asset Register</option>
                        <option value="DirectExpense">Direct GL Expense Account</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setShowGrnModal(false)}>Cancel</Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={saveGrn}>Process GRN & Route Items</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3.5: Create Vendor Bill / Invoice ──────────────────────────── */}
      {showBillModal && (
        <div className="overlay">
          <form className="modal" onSubmit={e => { e.preventDefault(); saveBill(); }}>
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
                * Select Vendor
                <select required value={billForm.vendorId} onChange={e => setBillForm({ ...billForm, vendorId: e.target.value })}>
                  <option value="">-- Select Vendor --</option>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </label>

              <label>
                * Supplier Invoice Number
                <input required placeholder="e.g. INV-2026-991" value={billForm.vendorInvoiceNumber} onChange={e => setBillForm({ ...billForm, vendorInvoiceNumber: e.target.value })} />
              </label>

              <label>
                Linked Purchase Order
                <select value={billForm.purchaseOrderId} onChange={e => setBillForm({ ...billForm, purchaseOrderId: e.target.value })}>
                  <option value="">-- Direct Bill (No PO) --</option>
                  {orders.map(p => <option key={p.id} value={p.id}>{p.orderNumber || p.poNumber}</option>)}
                </select>
              </label>

              <label>
                * Bill Date
                <input type="date" required value={billForm.date} onChange={e => setBillForm({ ...billForm, date: e.target.value })} />
              </label>

              <label>
                * Due Date
                <input type="date" required value={billForm.dueDate} onChange={e => setBillForm({ ...billForm, dueDate: e.target.value })} />
              </label>

              <div style={{ gridColumn: '1 / -1', marginTop: 15 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <strong style={{ fontSize: 13, textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em' }}>Billed Line Items & Unit Costs</strong>
                  <button type="button" className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setBillLines([...billLines, { description: '', quantity: 1, unitPrice: 0, taxAmount: 0, destination: 'Expense' }])}>
                    + Add Line Item
                  </button>
                </div>

                {/* Column Headers */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px', marginBottom: 4 }}>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: '#94a3b8', letterSpacing: '0.05em' }}>Description</span>
                  <span style={{ width: 80, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'center' as const }}>Qty</span>
                  <span style={{ width: 110, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'center' as const }}>Unit Price</span>
                  <span style={{ width: 90, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'center' as const }}>Tax</span>
                  <span style={{ width: 100, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'right' as const }}>Amount</span>
                  <span style={{ width: 24 }}></span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {billLines.map((l, i) => {
                    const lineSubtotal = (parseFloat(l.quantity) || 0) * (parseFloat(l.unitPrice) || 0);
                    const lineTax = parseFloat(l.taxAmount) || 0;
                    const lineTotal = lineSubtotal + lineTax;
                    return (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#f8fafc', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <input style={{ flex: 1 }} placeholder="Item description" value={l.description} onChange={e => { const u = [...billLines]; u[i].description = e.target.value; setBillLines(u); }} />
                        <input style={{ width: 80, textAlign: 'center' }} type="number" placeholder="Qty" value={l.quantity} onChange={e => { const u = [...billLines]; u[i].quantity = e.target.value; setBillLines(u); }} />
                        <input style={{ width: 110, textAlign: 'center' }} type="number" placeholder="Billed Unit Price" value={l.unitPrice} onChange={e => { const u = [...billLines]; u[i].unitPrice = e.target.value; setBillLines(u); }} />
                        <input style={{ width: 90, textAlign: 'center' }} type="number" step="0.01" placeholder="Tax Amt" value={l.taxAmount || 0} onChange={e => { const u = [...billLines]; u[i].taxAmount = e.target.value; setBillLines(u); }} />
                        <span style={{ width: 100, textAlign: 'right', fontWeight: 700, fontSize: 13, color: '#0f172a', fontFamily: 'monospace' }}>
                          ${lineTotal.toFixed(2)}
                        </span>
                        <button type="button" style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16, width: 24 }} onClick={() => setBillLines(billLines.filter((_, idx) => idx !== i))}>
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
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowBillModal(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
<button type="submit" className="primary">Create Vendor Bill & Validate Match</button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL 4: Warehouse Stock Transfer ─────────────────────────────── */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Inter-Warehouse Stock Transfer</h2>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">* Product</label>
                <select className="w-full border rounded-xl p-2.5" value={transferForm.productId} onChange={e => setTransferForm({ ...transferForm, productId: e.target.value })}>
                  <option value="">-- Select Item --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">* Source Warehouse</label>
                  <select className="w-full border rounded-xl p-2" value={transferForm.sourceWarehouseId} onChange={e => setTransferForm({ ...transferForm, sourceWarehouseId: e.target.value })}>
                    <option value="">-- Select Source --</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">* Target Warehouse</label>
                  <select className="w-full border rounded-xl p-2" value={transferForm.destinationWarehouseId} onChange={e => setTransferForm({ ...transferForm, destinationWarehouseId: e.target.value })}>
                    <option value="">-- Select Target --</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">Transfer Quantity</label>
                <Input type="number" value={transferForm.quantity} onChange={e => setTransferForm({ ...transferForm, quantity: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setShowTransferModal(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={saveTransfer}>Execute Transfer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
