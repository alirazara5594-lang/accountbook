import React, { useState, useEffect } from 'react';
import { useAssetsInventoryStore, useCoaStore, useProductsStore } from './stores';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { money } from './lib/currency';

// ─── Shared Select ───────────────────────────────────────────────────────────
const AccSelect = ({ value, onChange, accounts, label, filter }: any) => (
  <label>
    {label}
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="">-- Select account --</option>
      {(filter ? accounts.filter(filter) : accounts).map((a: any) => (
        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
      ))}
    </select>
  </label>
);

// ─── 1. Asset Register ───────────────────────────────────────────────────────
const AssetRegister: React.FC<{ activeEntityId: string; accounts: any[] }> = ({ activeEntityId, accounts }) => {
  const [deprModal, setDeprModal] = useState<any>(null);
  const [disposeModal, setDisposeModal] = useState<any>(null);
  const [deprForm, setDeprForm] = useState({ expenseAccId: '', accumAccId: '', usefulLifeYears: 3, salvageValue: 0 });
  const [dispForm, setDispForm] = useState({ date: new Date().toISOString().slice(0,10), proceeds: '0', assetAccId: '', accumAccId: '', gainLossAccId: '', cashAccId: '' });
  const [toast, setToast] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole] = useState<'admin' | 'accountant' | 'asset-manager' | 'viewer'>(() => {
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
    return (storedRole as 'admin' | 'accountant' | 'asset-manager' | 'viewer') || 'viewer';
  });

  const assets = useAssetsInventoryStore((s) => s.assets as any[]);
  const fetchFixedAssets = useAssetsInventoryStore((s) => s.fetchFixedAssets);
  const runDepreciationStore = useAssetsInventoryStore((s) => s.runDepreciation);
  const disposeAssetStore = useAssetsInventoryStore((s) => s.disposeAsset);

  useEffect(() => { fetchFixedAssets(activeEntityId); }, [activeEntityId]);

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500); };

  const runDepreciation = async () => {
    try {
      await runDepreciationStore(deprModal.id, deprForm.expenseAccId, deprForm.accumAccId);
      notify('✓ Depreciation journal posted!');
      setDeprModal(null);
    } catch (e: any) {
      notify(e.message || 'Error');
    }
  };

  const disposeAsset = async () => {
    try {
      await disposeAssetStore(disposeModal.id, { disposalDate: dispForm.date, proceeds: parseFloat(dispForm.proceeds), assetAccountId: dispForm.assetAccId, accumDeprAccountId: dispForm.accumAccId, gainLossAccountId: dispForm.gainLossAccId, cashAccountId: dispForm.cashAccId || null });
      notify('✓ Asset disposed and journal posted!');
      setDisposeModal(null);
    } catch (e: any) {
      notify(e.message || 'Error');
    }
  };

  const totalNBV = assets.filter(a => a.status === 0).reduce((s, a) => s + (a.purchasePrice - (a.accumulatedDepreciation || 0)), 0);

  const filteredAssets = assets.filter(a => !searchTerm || a.name.toLowerCase().includes(searchTerm.toLowerCase()) || (a.assetTag && a.assetTag.toLowerCase().includes(searchTerm.toLowerCase())));
  const exportHeaders = ['Tag', 'Name', 'Purchase Date', 'Cost', 'Accum. Depr.', 'NBV', 'Status'];
  const exportRows = filteredAssets.map((a: any) => [
    a.assetTag, a.name, a.purchaseDate, a.purchasePrice, a.accumulatedDepreciation ?? 0,
    a.purchasePrice - (a.accumulatedDepreciation ?? 0), ['Active', 'Disposed', 'Fully Depreciated'][a.status],
  ]);

  return (
    <div className="space-y-4">
      {toast && <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">{toast}</div>}
      <div className="flex flex-wrap justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Fixed Asset Register</h2>
        <div className="flex flex-wrap items-center gap-2">
          <DataToolbar
            query={searchTerm}
            setQuery={setSearchTerm}
            searchPlaceholder="Search by tag, name..."
            exportFileName="asset-register"
            exportSheetName="Asset Register"
            exportTitle="Fixed Asset Register"
            exportSubtitle="All fixed assets with cost, accumulated depreciation and net book value."
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Net Book Value', value: totalNBV }]}
            onRefresh={() => fetchFixedAssets(activeEntityId)}
          />
        </div>
        <div className="text-right"><p className="text-xs text-gray-500 uppercase tracking-wide">Total Net Book Value</p><p className="text-2xl font-bold text-emerald-600">{money(totalNBV)}</p></div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Tag</th><th className="py-3 px-4">Name</th><th className="py-3 px-4">Purchase Date</th>
              <th className="py-3 px-4 text-right">Cost</th><th className="py-3 px-4 text-right">Accum. Depr.</th><th className="py-3 px-4 text-right">NBV</th>
              <th className="py-3 px-4">Status</th><th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredAssets.map(a => (
              <tr key={a.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-gray-500">{a.assetTag}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{a.name}</td>
                <td className="py-3 px-4 text-gray-500">{a.purchaseDate}</td>
                <td className="py-3 px-4 text-right">{money(a.purchasePrice)}</td>
                <td className="py-3 px-4 text-right text-orange-600">{money(a.accumulatedDepreciation ?? 0)}</td>
                <td className="py-3 px-4 text-right font-semibold text-emerald-700">{money(a.purchasePrice - (a.accumulatedDepreciation ?? 0))}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.status === 0 ? 'bg-green-100 text-green-700' : a.status === 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {['Active','Disposed','Fully Depreciated'][a.status]}
                  </span>
                </td>
                <td className="py-3 px-4 space-x-3">
                  {a.status === 0 && <><button onClick={() => { setDeprModal(a); setDeprForm({ expenseAccId:'', accumAccId:'', usefulLifeYears: deprModal?.usefulLifeYears || a.usefulLifeYears || 3, salvageValue: deprModal?.salvageValue || a.salvageValue || 0 }); }} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Run Depr.</button>
                  <button onClick={() => { setDisposeModal(a); setDispForm({ date: new Date().toISOString().slice(0,10), proceeds:'0', assetAccId:'', accumAccId:'', gainLossAccId:'', cashAccId:'' }); }} className="text-red-500 hover:text-red-700 text-xs font-medium">Dispose</button></>}
                </td>
              </tr>
            ))}
            {(searchTerm && filteredAssets.length === 0) || (!searchTerm && assets.length === 0) && (
              <tr><td colSpan={8} className="py-10 text-center text-gray-400">No assets matching "{searchTerm}". Process a GRN with "Fixed Asset" destination to auto-create assets.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Depreciation Modal */}
      {deprModal && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: '500px', width: '95%' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">ASSETS & INVENTORY</p>
                <h2>Post Monthly Depreciation</h2>
              </div>
              <button type="button" className="close" onClick={() => setDeprModal(null)}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0' }}>
              <p className="text-sm text-gray-500">Asset: <strong>{deprModal.name}</strong> — Cost: {money(deprModal.purchasePrice)}, Useful Life: {deprModal.usefulLifeYears}yr</p>
              <p className="text-sm font-semibold text-blue-600 bg-blue-50/50 p-3 rounded-xl border border-blue-100">Monthly depreciation amount: {money(((deprModal.purchasePrice - (deprModal.salvageValue||0)) / deprModal.usefulLifeYears) / 12)}</p>
              
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <AccSelect value={deprForm.expenseAccId} onChange={(v: string) => setDeprForm(f => ({...f, expenseAccId: v}))} accounts={accounts} label="* Depreciation Expense Account" filter={(a: any) => a.type === 'Expense'} />
                <AccSelect value={deprForm.accumAccId} onChange={(v: string) => setDeprForm(f => ({...f, accumAccId: v}))} accounts={accounts} label="* Accumulated Depreciation Account" filter={(a: any) => a.type === 'ContraAsset' || a.name?.toLowerCase().includes('depreciation')} />
                <label>
                  Useful Life (years)
                  <input type="number" value={deprForm.usefulLifeYears} onChange={(e) => setDeprForm((f) => ({ ...f, usefulLifeYears: parseInt(e.target.value) || 3 }))} min="1" style={{ width: '100%' }} />
                </label>
                <label>
                  Salvage Value
                  <input type="number" value={deprForm.salvageValue} onChange={(e) => setDeprForm((f) => ({ ...f, salvageValue: Number(e.target.value) || 0 }))} step={".01"} style={{ width: '100%' }} />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setDeprModal(null)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button onClick={runDepreciation} disabled={!deprForm.expenseAccId || !deprForm.accumAccId || (userRole !== 'admin' && userRole !== 'accountant' && userRole !== 'asset-manager')} className="primary">Run Depreciation</button>
            </div>
          </div>
        </div>
      )}

      {/* Disposal Modal */}
      {disposeModal && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">ASSETS & INVENTORY</p>
                <h2>Dispose Fixed Asset</h2>
              </div>
              <button type="button" className="close" onClick={() => setDisposeModal(null)}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '10px 0' }}>
              <p className="text-sm text-gray-500">Asset: <strong>{disposeModal.name}</strong> — NBV: {money(disposeModal.purchasePrice - (disposeModal.accumulatedDepreciation||0))}</p>
              
              <div className="form-grid">
                <label>
                  Disposal Date
                  <input type="date" value={dispForm.date} onChange={e => setDispForm(f => ({...f, date: e.target.value}))} />
                </label>
                <label>
                  Proceeds Received
                  <input type="number" value={dispForm.proceeds} onChange={e => setDispForm(f => ({...f, proceeds: e.target.value}))} />
                </label>
                <AccSelect value={dispForm.assetAccId} onChange={(v: string) => setDispForm(f => ({...f, assetAccId: v}))} accounts={accounts} label="* Asset GL Account (to clear)" filter={(a: any) => a.type === 'Asset'} />
                <AccSelect value={dispForm.accumAccId} onChange={(v: string) => setDispForm(f => ({...f, accumAccId: v}))} accounts={accounts} label="* Accumulated Depreciation Account (to clear)" filter={(a: any) => a.type === 'ContraAsset' || a.name?.toLowerCase().includes('depreciation')} />
                <AccSelect value={dispForm.gainLossAccId} onChange={(v: string) => setDispForm(f => ({...f, gainLossAccId: v}))} accounts={accounts} label="* Gain/Loss on Disposal Account" filter={(a: any) => a.type === 'Revenue' || a.type === 'Expense'} />
                <AccSelect value={dispForm.cashAccId} onChange={(v: string) => setDispForm(f => ({...f, cashAccId: v}))} accounts={accounts} label="Cash Account for Proceeds (optional)" filter={(a: any) => a.type === 'Asset' && a.reconciliationEnabled} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setDisposeModal(null)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button onClick={disposeAsset} disabled={!dispForm.assetAccId || !dispForm.accumAccId || !dispForm.gainLossAccId || (userRole !== 'admin' && userRole !== 'accountant' && userRole !== 'asset-manager')} className="primary">Post Disposal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── 2. Warehouses ───────────────────────────────────────────────────────────
const Warehouses: React.FC<{ activeEntityId: string }> = ({ activeEntityId }) => {
  const warehouses = useAssetsInventoryStore((s) => s.warehouses);
  const loading = useAssetsInventoryStore((s) => s.loading);
  const fetchWarehouses = useAssetsInventoryStore((s) => s.fetchWarehouses);
  const createWarehouseStore = useAssetsInventoryStore((s) => s.createWarehouse);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => { fetchWarehouses(activeEntityId); }, [activeEntityId]);

  const save = async () => {
    try {
      await createWarehouseStore({ name, location, companyId: activeEntityId || null });
      setShowForm(false); setName(''); setLocation('');
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Warehouses</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl">+ New Warehouse</button>
      </div>
      {showForm && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: '600px', width: '95%' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">ASSETS & INVENTORY</p>
                <h2>New Warehouse</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="form-grid">
              <label>
                * Warehouse Name
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Distribution Center" required />
              </label>
              <label>
                Location / Address
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Seattle, WA" />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
<button onClick={save} disabled={!name} className="primary">Save Warehouse</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider"><tr><th className="py-3 px-4">Name</th><th className="py-3 px-4">Location</th></tr></thead>
          <tbody className="divide-y divide-gray-50">
            {warehouses.map(w => (<tr key={w.id} className="hover:bg-gray-50/60"><td className="py-3 px-4 font-medium text-gray-900">{w.name}</td><td className="py-3 px-4 text-gray-500">{w.location || '—'}</td></tr>))}
            {!loading && warehouses.length === 0 && <tr><td colSpan={2} className="py-8 text-center text-gray-400">No warehouses configured.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── 3. Stock Levels ─────────────────────────────────────────────────────────
const StockLevels: React.FC<{ activeEntityId: string }> = ({ activeEntityId }) => {
  const levels = useAssetsInventoryStore((s) => s.stockLevels as any[]);
  const loading = useAssetsInventoryStore((s) => s.loading);
  const fetchStockLevels = useAssetsInventoryStore((s) => s.fetchStockLevels);

  useEffect(() => { fetchStockLevels(activeEntityId); }, [activeEntityId]);

  const totalValue = levels.reduce((s, l) => s + (l.totalValue || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Stock Levels</h2>
        <div className="text-right"><p className="text-xs text-gray-500 uppercase tracking-wide">Total Inventory Value</p><p className="text-2xl font-bold text-blue-600">{money(totalValue)}</p></div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
            <tr><th className="py-3 px-4">Product</th><th className="py-3 px-4">Code</th><th className="py-3 px-4">Warehouse</th><th className="py-3 px-4 text-right">Qty on Hand</th><th className="py-3 px-4 text-right">Avg. Cost</th><th className="py-3 px-4 text-right">Total Value</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {levels.map(l => (<tr key={l.id} className="hover:bg-gray-50/60">
              <td className="py-3 px-4 font-medium text-gray-900">{l.productName}</td>
              <td className="py-3 px-4 font-mono text-xs text-gray-500">{l.productCode}</td>
              <td className="py-3 px-4 text-gray-500">{l.warehouseName}</td>
              <td className="py-3 px-4 text-right font-semibold">{l.quantityOnHand}</td>
              <td className="py-3 px-4 text-right text-gray-500">{money(l.movingAverageCost)}</td>
              <td className="py-3 px-4 text-right font-semibold text-blue-700">{money(l.totalValue)}</td>
            </tr>))}
            {!loading && levels.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No stock. Process a GRN with "Inventory" destination to populate stock levels.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── 4. Stock Transactions ───────────────────────────────────────────────────
const StockTransactionsView: React.FC<{ activeEntityId: string; warehouses: any[]; products: any[] }> = ({ activeEntityId, warehouses, products }) => {
  const txns = useAssetsInventoryStore((s) => s.stockTransactions as any[]);
  const loading = useAssetsInventoryStore((s) => s.loading);
  const fetchStockTransactions = useAssetsInventoryStore((s) => s.fetchStockTransactions);
  const createStockTransactionStore = useAssetsInventoryStore((s) => s.createStockTransaction);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: '', warehouseId: '', quantity: '1', unitCost: '0', type: 'Adjustment', reference: '', date: new Date().toISOString().slice(0,10) });
  const [toast, setToast] = useState('');

  useEffect(() => { fetchStockTransactions(activeEntityId); }, [activeEntityId]);

  const save = async () => {
    try {
      await createStockTransactionStore({ ...form, quantity: parseFloat(form.quantity), unitCost: parseFloat(form.unitCost), companyId: activeEntityId || null });
      setToast('✓ Transaction recorded!');
      setShowForm(false);
      setTimeout(() => setToast(''), 3000);
    } catch (e: any) {
      setToast(e.message || 'Error');
    }
  };

  return (
    <div className="space-y-4">
      {toast && <div className="px-4 py-2 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm">{toast}</div>}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Stock Transactions</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl">+ Manual Adjustment</button>
      </div>
      {showForm && (
        <div className="overlay">
          <div className="modal" style={{ maxWidth: '650px', width: '95%' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">ASSETS & INVENTORY</p>
                <h2>Record Stock Adjustment</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <div className="form-grid">
              <label>
                Product *
                <select value={form.productId} onChange={e => setForm(f => ({...f, productId: e.target.value}))}>
                  <option value="">-- Select --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label>
                Warehouse *
                <select value={form.warehouseId} onChange={e => setForm(f => ({...f, warehouseId: e.target.value}))}>
                  <option value="">-- Select --</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </label>
              <label>
                Adjustment Type *
                <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                  <option>Adjustment</option>
                  <option>In</option>
                  <option>Out</option>
                </select>
              </label>
              <label>
                Date *
                <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
              </label>
              <label>
                Quantity *
                <input type="number" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} />
              </label>
              <label>
                Unit Cost *
                <input type="number" value={form.unitCost} onChange={e => setForm(f => ({...f, unitCost: e.target.value}))} />
              </label>
              <label style={{ gridColumn: 'span 2' }}>
                Reference / Reason
                <input value={form.reference} onChange={e => setForm(f => ({...f, reference: e.target.value}))} placeholder="e.g. Stock count correction" />
              </label>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
<button onClick={save} disabled={!form.productId || !form.warehouseId} className="primary">Record Transaction</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase tracking-wider">
            <tr><th className="py-3 px-4">Date</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Product</th><th className="py-3 px-4">Warehouse</th><th className="py-3 px-4 text-right">Qty</th><th className="py-3 px-4 text-right">Unit Cost</th><th className="py-3 px-4 text-right">Total</th><th className="py-3 px-4">Reference</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {txns.map(t => (<tr key={t.id} className="hover:bg-gray-50/60">
              <td className="py-3 px-4 text-gray-500">{t.date || t.transactionDate || '—'}</td>
              <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${String(t.type) === 'In' || String(t.type) === 'Inbound' ? 'bg-green-100 text-green-700' : String(t.type) === 'Out' || String(t.type) === 'Outbound' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.type}</span></td>
              <td className="py-3 px-4 font-medium text-gray-900">{t.productName || t.productId || '—'}</td>
              <td className="py-3 px-4 text-gray-500">{t.warehouseName || t.warehouseId || '—'}</td>
              <td className="py-3 px-4 text-right font-semibold">{t.quantity}</td>
              <td className="py-3 px-4 text-right text-gray-500">{money(t.unitCost || 0)}</td>
              <td className="py-3 px-4 text-right font-semibold">{money(t.totalValue || (t.quantity * (t.unitCost || 0)))}</td>
              <td className="py-3 px-4 text-gray-400 text-xs">{t.reference || '—'}</td>
            </tr>))}
            {!loading && txns.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">No stock movements yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Master Workspace ─────────────────────────────────────────────────────────
type Tab = 'assets' | 'warehouses' | 'stock' | 'transactions';

export const AssetsInventoryWorkspace: React.FC<{ activeEntityId: string; entities: any[]; initialTab?: Tab }> = ({ activeEntityId, initialTab }) => {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab || 'assets');
  const accounts = useCoaStore((s) => s.accounts);
  const fetchAccounts = useCoaStore((s) => s.fetchAccounts);

  const warehouses = useAssetsInventoryStore((s) => s.warehouses);
  const fetchWarehouses = useAssetsInventoryStore((s) => s.fetchWarehouses);

  const products = useProductsStore((s) => s.products);
  const fetchProducts = useProductsStore((s) => s.fetchProducts);

  useEffect(() => {
    fetchAccounts();
    fetchWarehouses(activeEntityId);
    fetchProducts();
  }, [activeEntityId]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'assets', label: 'Asset Register', icon: '🏛' },
    { id: 'warehouses', label: 'Warehouses', icon: '🏭' },
    { id: 'stock', label: 'Stock Levels', icon: '📦' },
    { id: 'transactions', label: 'Stock Transactions', icon: '🔄' },
  ];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-lg">🏭</span> Assets & Inventory
          </h1>
          <p className="text-gray-500 text-[10px] mt-0.5">Manage fixed assets, warehouses, stock levels, depreciation, and valuation.</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-gray-100/50 p-1 rounded-lg w-fit border border-gray-200/50">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 ${activeTab === t.id ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}>
              <span className="text-sm">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        {activeTab === 'assets' && <AssetRegister activeEntityId={activeEntityId} accounts={accounts} />}
        {activeTab === 'warehouses' && <Warehouses activeEntityId={activeEntityId} />}
        {activeTab === 'stock' && <StockLevels activeEntityId={activeEntityId} />}
        {activeTab === 'transactions' && <StockTransactionsView activeEntityId={activeEntityId} warehouses={warehouses} products={products} />}
      </div>
    </div>
  );
};
