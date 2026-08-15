import React, { useState, useEffect, useMemo } from 'react';
import { useManufacturingStore, useProductsStore, useAssetsInventoryStore } from './stores';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataToolbar } from '@/components/ui/data-toolbar';

function money(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

const statusColors: Record<number | string, string> = {
  0: 'bg-gray-100 text-gray-700',
  Draft: 'bg-gray-100 text-gray-700',
  1: 'bg-blue-100 text-blue-700',
  Released: 'bg-blue-100 text-blue-700',
  2: 'bg-yellow-100 text-yellow-800',
  InProgress: 'bg-yellow-100 text-yellow-800',
  3: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-emerald-100 text-emerald-800',
  4: 'bg-red-100 text-red-700',
  Cancelled: 'bg-red-100 text-red-700'
};

type Tab = 'boms' | 'orders' | 'wip' | 'costing';

export const ManufacturingWorkspace: React.FC<{ activeEntityId: string; entities?: any[]; initialTab?: Tab }> = ({ activeEntityId, initialTab }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'boms');
  const [toast, setToast] = useState('');

  const boms = useManufacturingStore((s) => s.boms);
  const workOrders = useManufacturingStore((s) => s.workOrders);
  const loading = useManufacturingStore((s) => s.loading);
  const fetchAllManufacturing = useManufacturingStore((s) => s.fetchAllManufacturing);
  const createBomStore = useManufacturingStore((s) => s.createBom);
  const createWorkOrderStore = useManufacturingStore((s) => s.createWorkOrder);
  const startWorkOrderStore = useManufacturingStore((s) => s.startWorkOrder);
  const completeWorkOrderStore = useManufacturingStore((s) => s.completeWorkOrder);

  const products = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  const warehouses = useAssetsInventoryStore((s) => s.warehouses);
  const fetchWarehouses = useAssetsInventoryStore((s) => s.fetchWarehouses);

  useEffect(() => {
    fetchAllManufacturing(activeEntityId);
    fetchProducts();
    fetchWarehouses(activeEntityId);
  }, [activeEntityId]);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  // ─── BOM Modal State ───────────────────────────────────────────────────────
  const [showBomModal, setShowBomModal] = useState(false);
  const [bomForm, setBomForm] = useState({ finishedProductId: '', quantityProduced: '1', notes: '' });
  const [bomLines, setBomLines] = useState([{ rawMaterialProductId: '', quantityRequired: '1', wastePercentage: '0' }]);

  const addBomLine = () => setBomLines([...bomLines, { rawMaterialProductId: '', quantityRequired: '1', wastePercentage: '0' }]);
  const removeBomLine = (idx: number) => setBomLines(bomLines.filter((_, i) => i !== idx));

  const saveBom = async () => {
    if (!bomForm.finishedProductId || bomLines.length === 0) return alert('Finished product and at least one raw material line required.');
    const finishedProd = products.find(p => p.id === bomForm.finishedProductId);
    const body = {
      finishedProductId: bomForm.finishedProductId,
      finishedProductName: finishedProd?.name || '',
      quantityProduced: parseFloat(bomForm.quantityProduced),
      notes: bomForm.notes,
      companyId: activeEntityId || null,
      lines: bomLines.map(l => {
        const rawMat = products.find(p => p.id === l.rawMaterialProductId);
        return {
          rawMaterialProductId: l.rawMaterialProductId,
          rawMaterialProductName: rawMat?.name || '',
          unitOfMeasure: rawMat?.unitOfMeasure || rawMat?.unit || 'Pcs',
          quantityRequired: parseFloat(l.quantityRequired),
          wastePercentage: parseFloat(l.wastePercentage || '0')
        };
      })
    };
    try {
      await createBomStore(body);
      notify('✓ Bill of Materials (BOM) created successfully!');
      setShowBomModal(false);
      setBomLines([{ rawMaterialProductId: '', quantityRequired: '1', wastePercentage: '0' }]);
    } catch (e: any) {
      notify(e.message || 'Error creating BOM');
    }
  };

  // ─── Work Order Modal State ─────────────────────────────────────────────────
  const [showWoModal, setShowWoModal] = useState(false);
  const [woForm, setWoForm] = useState({ bomId: '', rawMaterialWarehouseId: '', finishedGoodsWarehouseId: '', quantityToProduce: '10' });

  const saveWo = async () => {
    if (!woForm.bomId || !woForm.rawMaterialWarehouseId || !woForm.finishedGoodsWarehouseId) return alert('Please select BOM and Warehouses.');
    const bom = boms.find(b => b.id === woForm.bomId);
    if (!bom) return;

    const body = {
      bomId: bom.id,
      finishedProductId: bom.finishedProductId,
      finishedProductName: bom.finishedProductName,
      rawMaterialWarehouseId: woForm.rawMaterialWarehouseId,
      finishedGoodsWarehouseId: woForm.finishedGoodsWarehouseId,
      quantityToProduce: parseFloat(woForm.quantityToProduce),
      companyId: activeEntityId || null,
      lines: bom.lines.map(l => ({
        rawMaterialProductId: l.rawMaterialProductId,
        rawMaterialProductName: l.rawMaterialProductName,
        quantityRequired: l.quantityRequired,
        quantityIssued: 0,
        unitCost: 0,
        totalCost: 0
      }))
    };

    try {
      await createWorkOrderStore(body);
      notify('✓ Work Order released!');
      setShowWoModal(false);
    } catch (e: any) {
      notify(e.message || 'Error creating Work Order');
    }
  };

  // ─── Complete Work Order Modal State ─────────────────────────────────────────
  const [completeModal, setCompleteModal] = useState<any>(null);
  const [completeForm, setCompleteForm] = useState({ actualProducedQty: '10', directLabor: '0', overhead: '0' });

  const submitComplete = async () => {
    try {
      await completeWorkOrderStore(completeModal.id, {
        actualProducedQty: parseFloat(completeForm.actualProducedQty),
        directLabor: parseFloat(completeForm.directLabor || '0'),
        overhead: parseFloat(completeForm.overhead || '0')
      }, activeEntityId);
      notify('✓ Production run completed! Finished goods received into Inventory.');
      setCompleteModal(null);
    } catch (e: any) {
      notify(e.message || 'Error completing Work Order');
    }
  };

  const handleStartWo = async (id: string) => {
    try {
      await startWorkOrderStore(id, activeEntityId);
      notify('✓ Work Order started! Raw materials issued to WIP.');
    } catch (e: any) {
      notify(e.message || 'Error starting Work Order');
    }
  };

  const finishedProducts = useMemo(() => products.filter(p => p.type === 'Physical' || (p.type as any) === 'Bundle'), [products]);
  const rawMaterials = useMemo(() => products.filter(p => p.type === 'Physical' || p.type === 'NonInventoryItem' || (p.type as any) === 'NonInventory'), [products]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'boms', label: 'Bill of Materials (BOM)', icon: '📜' },
    { id: 'orders', label: 'Work Orders', icon: '🏭' },
    { id: 'wip', label: 'Material Requisitions & WIP', icon: '📦' },
    { id: 'costing', label: 'Job Costing Reports', icon: '📊' },
  ];

  const exportBomHeaders = ['BOM Number', 'Finished Product', 'Produces', 'Raw Materials'];
  const exportBomRows = boms.map(b => [b.bomNumber, b.finishedProductName, b.quantityProduced, b.lines?.map((l: any) => `${l.rawMaterialProductName} x ${l.quantityRequired}`).join('; ') || '']);

  const exportWoHeaders = ['WO No.', 'Finished Good', 'Target Qty', 'Produced', 'Unit Cost', 'Total Cost', 'Status'];
  const exportWoRows = workOrders.map(wo => [wo.workOrderNumber, wo.finishedProductName, wo.quantityToProduce, wo.quantityProduced || 0, wo.unitCost, wo.totalCost, String(wo.status)]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {toast && <div className="fixed top-6 right-6 z-50 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-lg text-sm font-medium">{toast}</div>}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manufacturing & Production Workspace</h1>
          <p className="text-gray-500 text-sm mt-1">Manage BOM recipes, work orders, WIP material issues, and IAS 2 job costing.</p>
        </div>
        <div className="flex gap-2">
          <DataToolbar
            exportFileName="manufacturing-boms"
            exportSheetName="BOM Recipes"
            exportTitle="Bill of Materials"
            exportSubtitle="BOM recipes for finished products."
            exportHeaders={exportBomHeaders}
            exportRows={exportBomRows}
          />
          <DataToolbar
            exportFileName="manufacturing-work-orders"
            exportSheetName="Work Orders"
            exportTitle="Work Orders"
            exportSubtitle="Manufacturing work orders and production costs."
            exportHeaders={exportWoHeaders}
            exportRows={exportWoRows}
            onRefresh={() => fetchAllManufacturing(activeEntityId)}
          />
          <Button variant="outline" onClick={() => setShowBomModal(true)}>+ New BOM Recipe</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowWoModal(true)}>+ New Work Order</Button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 gap-1 bg-gray-50/50 p-1 rounded-2xl">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === t.id ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: BOM List ────────────────────────────────────────────────── */}
      {activeTab === 'boms' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {boms.map(b => (
              <Card key={b.id} className="relative flex flex-col justify-between hover:shadow-md transition-shadow border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{b.bomNumber}</span>
                    <span className="text-xs text-gray-400 font-medium">{b.lines?.length || 0} Raw Materials</span>
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900 mt-2">{b.finishedProductName}</CardTitle>
                  <p className="text-xs text-gray-500">Produces: {b.quantityProduced} Units</p>
                </CardHeader>
                <CardContent className="space-y-3 text-xs pt-2">
                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    <p className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">Recipe Ingredients:</p>
                    {b.lines?.map((l, idx) => (
                      <div key={idx} className="flex justify-between text-gray-600">
                        <span>• {l.rawMaterialProductName}</span>
                        <span className="font-semibold">{l.quantityRequired} {l.unitOfMeasure || 'Pcs'}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {!loading && boms.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-200">
                No Bill of Materials (BOM) recipes defined. Click "+ New BOM Recipe" to create your first manufacturing recipe.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: Work Orders ─────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">WO No.</th>
                <th className="py-3 px-4">Finished Good</th>
                <th className="py-3 px-4 text-right">Target Qty</th>
                <th className="py-3 px-4 text-right">Produced</th>
                <th className="py-3 px-4 text-right">Unit Cost</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workOrders.map(wo => (
                <tr key={wo.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-gray-900">{wo.workOrderNumber}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{wo.finishedProductName}</td>
                  <td className="py-3 px-4 text-right font-semibold">{wo.quantityToProduce}</td>
                  <td className="py-3 px-4 text-right text-gray-500">{wo.quantityProduced || 0}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">{money(wo.unitCost)}</td>
                  <td className="py-3 px-4 text-right font-semibold text-emerald-700">{money(wo.totalCost)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[wo.status] || 'bg-gray-100 text-gray-700'}`}>
                      {String(wo.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {(String(wo.status) === 'Draft' || String(wo.status) === '0' || String(wo.status) === 'Released' || String(wo.status) === '1') && (
                      <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleStartWo(wo.id)}>
                        Start (Issue WIP)
                      </Button>
                    )}
                    {(String(wo.status) === 'InProgress' || String(wo.status) === '2') && (
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setCompleteModal(wo); setCompleteForm({ actualProducedQty: String(wo.quantityToProduce), directLabor: '0', overhead: '0' }); }}>
                        Complete Production
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && workOrders.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">No active work orders found. Release a new work order to begin production.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 3: WIP & Material Issues ───────────────────────────────────── */}
      {activeTab === 'wip' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Work-In-Progress (WIP) Balance</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {money(workOrders.filter(w => String(w.status) === 'InProgress' || String(w.status) === '2').reduce((s, w) => s + (w.totalMaterialCost || 0), 0))}
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-full text-xs font-semibold">
                IAS 2 / GAAP Account #13000 (WIP Inventory)
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 font-bold text-gray-800 text-sm">
              Issued Raw Material Lines in Active Orders
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase">
                <tr><th className="py-2.5 px-4">WO Number</th><th className="py-2.5 px-4">Raw Material Item</th><th className="py-2.5 px-4 text-right">Required Qty</th><th className="py-2.5 px-4 text-right">Issued Qty</th><th className="py-2.5 px-4 text-right">Unit Cost</th><th className="py-2.5 px-4 text-right">Total WIP Value</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {workOrders.filter(w => String(w.status) === 'InProgress' || String(w.status) === '2').flatMap(w =>
                  (w.lines || []).map(l => (
                    <tr key={l.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{w.workOrderNumber}</td>
                      <td className="py-2.5 px-4 font-medium">{l.rawMaterialProductName}</td>
                      <td className="py-2.5 px-4 text-right">{l.quantityRequired}</td>
                      <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">{l.quantityIssued || l.quantityRequired}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-xs">{money(l.unitCost)}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-yellow-700">{money(l.totalCost)}</td>
                    </tr>
                  ))
                )}
                {workOrders.filter(w => String(w.status) === 'InProgress' || String(w.status) === '2').length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">No active work orders in progress.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Job Costing Reports ─────────────────────────────────────── */}
      {activeTab === 'costing' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Finished Goods Job Costing Breakdown (IAS 2 Compliant)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="py-3 px-4">WO Number</th>
                    <th className="py-3 px-4">Finished Good</th>
                    <th className="py-3 px-4 text-right">Direct Materials</th>
                    <th className="py-3 px-4 text-right">Direct Labor</th>
                    <th className="py-3 px-4 text-right">Overhead</th>
                    <th className="py-3 px-4 text-right">Total Production Cost</th>
                    <th className="py-3 px-4 text-right">Qty Produced</th>
                    <th className="py-3 px-4 text-right font-bold text-emerald-700">Calculated Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {workOrders.filter(w => String(w.status) === 'Completed' || String(w.status) === '3').map(w => (
                    <tr key={w.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{w.workOrderNumber}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{w.finishedProductName}</td>
                      <td className="py-3 px-4 text-right">{money(w.totalMaterialCost)}</td>
                      <td className="py-3 px-4 text-right">{money(w.directLaborCost)}</td>
                      <td className="py-3 px-4 text-right">{money(w.overheadCost)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{money(w.totalCost)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{w.quantityProduced}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 text-base">{money(w.unitCost)}</td>
                    </tr>
                  ))}
                  {workOrders.filter(w => String(w.status) === 'Completed' || String(w.status) === '3').length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-gray-400">No completed manufacturing runs to report.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: Create BOM ─────────────────────────────────────────────── */}
      {showBomModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Create Bill of Materials (BOM)</h2>
              <button onClick={() => setShowBomModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">* Finished Product</label>
                <select className="w-full border rounded-xl p-2.5" value={bomForm.finishedProductId} onChange={e => setBomForm({ ...bomForm, finishedProductId: e.target.value })}>
                  <option value="">-- Select Finished Item --</option>
                  {finishedProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Batch Output Quantity</label>
                  <Input type="number" value={bomForm.quantityProduced} onChange={e => setBomForm({ ...bomForm, quantityProduced: e.target.value })} />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Notes / Assembly Specs</label>
                  <Input value={bomForm.notes} onChange={e => setBomForm({ ...bomForm, notes: e.target.value })} placeholder="Recipe notes..." />
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-gray-800 text-xs uppercase tracking-wider">* Raw Material Ingredients</p>
                  <Button size="sm" variant="outline" onClick={addBomLine}>+ Add Material</Button>
                </div>
                {bomLines.map((l, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select className="flex-1 border rounded-xl p-2 text-xs" value={l.rawMaterialProductId} onChange={e => { const updated = [...bomLines]; updated[i].rawMaterialProductId = e.target.value; setBomLines(updated); }}>
                      <option value="">-- Select Raw Material --</option>
                      {rawMaterials.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                    </select>
                    <Input className="w-24 text-xs" type="number" placeholder="Qty" value={l.quantityRequired} onChange={e => { const updated = [...bomLines]; updated[i].quantityRequired = e.target.value; setBomLines(updated); }} />
                    <Input className="w-24 text-xs" type="number" placeholder="Scrap %" value={l.wastePercentage} onChange={e => { const updated = [...bomLines]; updated[i].wastePercentage = e.target.value; setBomLines(updated); }} />
                    {bomLines.length > 1 && <button onClick={() => removeBomLine(i)} className="text-red-500 hover:text-red-700 font-bold">×</button>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setShowBomModal(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveBom}>Save BOM Recipe</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Create Work Order ──────────────────────────────────────── */}
      {showWoModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Release New Work Order</h2>
              <button onClick={() => setShowWoModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block font-medium text-gray-700 mb-1">* Select BOM Recipe</label>
                <select className="w-full border rounded-xl p-2.5" value={woForm.bomId} onChange={e => setWoForm({ ...woForm, bomId: e.target.value })}>
                  <option value="">-- Select Recipe --</option>
                  {boms.map(b => <option key={b.id} value={b.id}>{b.finishedProductName} ({b.bomNumber})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">* Raw Material Warehouse</label>
                  <select className="w-full border rounded-xl p-2" value={woForm.rawMaterialWarehouseId} onChange={e => setWoForm({ ...woForm, rawMaterialWarehouseId: e.target.value })}>
                    <option value="">-- Select Source --</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">* Finished Goods Warehouse</label>
                  <select className="w-full border rounded-xl p-2" value={woForm.finishedGoodsWarehouseId} onChange={e => setWoForm({ ...woForm, finishedGoodsWarehouseId: e.target.value })}>
                    <option value="">-- Select Target --</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">* Target Production Quantity</label>
                <Input type="number" value={woForm.quantityToProduce} onChange={e => setWoForm({ ...woForm, quantityToProduce: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setShowWoModal(false)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={saveWo}>Release Work Order</Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Complete Work Order ────────────────────────────────────── */}
      {completeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900">Complete Work Order #{completeModal.workOrderNumber}</h2>
              <button onClick={() => setCompleteModal(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <div className="space-y-4 text-sm">
              <p className="text-xs text-gray-500">Entering production completion details will automatically post Finished Goods to Warehouse and record IAS 2 Unit Cost.</p>
              <div>
                <label className="block font-medium text-gray-700 mb-1">* Actual Quantity Produced</label>
                <Input type="number" value={completeForm.actualProducedQty} onChange={e => setCompleteForm({ ...completeForm, actualProducedQty: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Direct Labor Cost ($)</label>
                  <Input type="number" value={completeForm.directLabor} onChange={e => setCompleteForm({ ...completeForm, directLabor: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Factory Overhead ($)</label>
                  <Input type="number" value={completeForm.overhead} onChange={e => setCompleteForm({ ...completeForm, overhead: e.target.value })} placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setCompleteModal(null)}>Cancel</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={submitComplete}>Complete Run & Receive Stock</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
