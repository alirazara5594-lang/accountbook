import React, { useEffect, useState } from 'react';
import { useAssetsInventoryStore } from './stores';
import { assetsInventoryApi } from './api/modules/assetsInventory.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Zap, Trash2, Wallet } from 'lucide-react';

interface FixedAsset {
  id: string;
  assetTag?: string;
  assetCode?: string;
  name: string;
  description?: string;
  purchaseDate?: string;
  acquisitionDate?: string;
  purchasePrice?: number;
  cost?: number;
  salvageValue?: number;
  accumulatedDepreciation?: number;
  netBookValue?: number;
  status: number | string;
  assetAccountId?: string;
  accumulatedDepreciationAccountId?: string;
  depreciationExpenseAccountId?: string;
}

function money(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const isActive = (a: FixedAsset) => a.status === 0 || (a.status as any) === 'Active';

export const FixedAssets: React.FC<{activeEntityId: string}> = ({activeEntityId}) => {
  const assets = useAssetsInventoryStore((s) => s.assets as unknown as FixedAsset[]);
  const loading = useAssetsInventoryStore((s) => s.loading);
  const fetchFixedAssets = useAssetsInventoryStore((s) => s.fetchFixedAssets);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [deprModal, setDeprModal] = useState<FixedAsset | null>(null);
  const [disposeModal, setDisposeModal] = useState<FixedAsset | null>(null);
  const [deprForm, setDeprForm] = useState({ expenseAccId: '', accumAccId: '' });
  const [disposeForm, setDisposeForm] = useState({ disposalDate: new Date().toISOString().slice(0, 10), proceeds: '0', cashAccountId: '' });

  useEffect(() => {
    fetchFixedAssets(activeEntityId);
  }, [activeEntityId]);

  const openDepr = (a: FixedAsset) => {
    setMessage(''); setError('');
    setDeprForm({
      expenseAccId: a.depreciationExpenseAccountId || '',
      accumAccId: a.accumulatedDepreciationAccountId || '',
    });
    setDeprModal(a);
  };

  const runDepreciation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deprModal) return;
    if (!deprForm.expenseAccId || !deprForm.accumAccId) { setError('Select Depreciation Expense and Accumulated Depreciation accounts.'); return; }
    setActingId(deprModal.id);
    setMessage(''); setError('');
    try {
      await assetsInventoryApi.runDepreciation(deprModal.id, deprForm.expenseAccId, deprForm.accumAccId);
      setMessage('Depreciation posted to the general ledger.');
      setDeprModal(null);
      await fetchFixedAssets(activeEntityId);
    } catch (err: any) {
      setError(err?.data?.error || err?.data?.message || err?.message || 'Failed to run depreciation.');
    } finally {
      setActingId(null);
    }
  };

  const openDispose = (a: FixedAsset) => {
    setMessage(''); setError('');
    setDisposeForm({ disposalDate: new Date().toISOString().slice(0, 10), proceeds: '0', cashAccountId: '' });
    setDisposeModal(a);
  };

  const disposeAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeModal) return;
    const proceeds = parseFloat(disposeForm.proceeds);
    if (isNaN(proceeds) || proceeds < 0) { setError('Proceeds cannot be negative.'); return; }
    setActingId(disposeModal.id);
    setMessage(''); setError('');
    try {
      await assetsInventoryApi.disposeAsset(disposeModal.id, {
        disposalDate: disposeForm.disposalDate,
        proceeds,
        assetAccountId: disposeModal.assetAccountId || undefined,
        accumDeprAccountId: disposeModal.accumulatedDepreciationAccountId || undefined,
        cashAccountId: disposeForm.cashAccountId || undefined,
      });
      setMessage('Asset disposed and gain/loss journal posted.');
      setDisposeModal(null);
      await fetchFixedAssets(activeEntityId);
    } catch (err: any) {
      setError(err?.data?.error || err?.data?.message || err?.message || 'Failed to dispose asset.');
    } finally {
      setActingId(null);
    }
  };

  const activeAssets = assets.filter(isActive);
  const totalValue = activeAssets.reduce((sum, a) => sum + ((a.netBookValue ?? (a.purchasePrice || a.cost || 0)) - (a.accumulatedDepreciation || 0) || (a.purchasePrice || a.cost || 0)), 0);
  const totalCost = activeAssets.reduce((sum, a) => sum + (a.purchasePrice || a.cost || 0), 0);
  const totalDepr = assets.reduce((sum, a) => sum + (a.accumulatedDepreciation || 0), 0);

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Wallet className="w-4 h-4 text-indigo-600" /> Accounting & Finance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Fixed Assets</h1>
          <p className="text-xs text-slate-500">
            Asset register with depreciation and disposal actions that post to the general ledger (IAS 16 property, plant & equipment).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => fetchFixedAssets(activeEntityId)} className="h-9 px-3 gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {message && <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">✓ {message}</p>}
      {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Asset Cost</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">{money(totalCost)}</p>
        </div>
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Accumulated Depreciation</p>
          <p className="text-xl font-bold text-indigo-800 font-mono mt-1">- {money(totalDepr)}</p>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Net Book Value</p>
          <p className="text-xl font-bold text-emerald-800 font-mono mt-1">{money(totalValue)}</p>
        </div>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading asset register…</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">ASSET TAG</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NAME</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">PURCHASE DATE</TableHead>
              <TableHead className="w-28 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">COST</TableHead>
              <TableHead className="w-28 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">ACCUM. DEPR.</TableHead>
              <TableHead className="w-28 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">NBV</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
              <TableHead className="w-64 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {assets.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">
                  No fixed assets in the register yet.
                </TableCell>
              </TableRow>
            )}
            {assets.map(asset => (
              <TableRow key={asset.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3 pl-4 font-mono text-xs font-bold text-slate-800">{asset.assetTag || asset.assetCode || asset.id.slice(0, 8)}</TableCell>
                <TableCell className="py-3 font-bold text-xs text-slate-800">{asset.name}</TableCell>
                <TableCell className="py-3 font-mono text-xs text-slate-600">{(asset.purchaseDate || asset.acquisitionDate || '').slice(0, 10) || '—'}</TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-800">{money(asset.purchasePrice || asset.cost || 0)}</TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-rose-600">{(asset.accumulatedDepreciation || 0) > 0 ? `- ${money(asset.accumulatedDepreciation || 0)}` : '—'}</TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-emerald-700">{money(asset.netBookValue ?? (asset.purchasePrice || asset.cost || 0) - (asset.accumulatedDepreciation || 0))}</TableCell>
                <TableCell className="py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${isActive(asset) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (asset.status as any) === 'FullyDepreciated' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {isActive(asset) ? 'Active' : (asset.status as any) === 'FullyDepreciated' ? 'Fully Depr.' : 'Disposed'}
                  </span>
                </TableCell>
                <TableCell className="py-3 pr-4">
                  <div className="flex items-center justify-end gap-1.5">
                    {isActive(asset) && (
                      <Button size="sm" variant="outline" disabled={actingId === asset.id} onClick={() => openDepr(asset)} className="h-7 px-2.5 text-[11px] gap-1">
                        <Zap className="w-3 h-3" /> Run Depreciation
                      </Button>
                    )}
                    {isActive(asset) && (
                      <Button size="sm" variant="outline" disabled={actingId === asset.id} onClick={() => openDispose(asset)} className="h-7 px-2.5 text-[11px] gap-1 text-rose-600 hover:text-rose-700">
                        <Trash2 className="w-3 h-3" /> Dispose
                      </Button>
                    )}
                    {!isActive(asset) && <span className="text-[11px] font-semibold text-slate-400">No actions</span>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {deprModal && (
        <div className="overlay">
          <form className="modal" onSubmit={runDepreciation}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">FIXED ASSETS</p>
                <h2>Run Depreciation — {deprModal.name}</h2>
              </div>
              <button type="button" className="close" onClick={() => setDeprModal(null)}>×</button>
            </div>
            <div className="form-grid">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Depreciation Expense Account</label>
                <Input required placeholder="Account ID" value={deprForm.expenseAccId} onChange={e => setDeprForm({ ...deprForm, expenseAccId: e.target.value })} className="h-9 text-xs font-mono" />
                <p className="text-[10px] text-slate-400 mt-1">Use the account ID from Chart of Accounts (Dr expense on posting).</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Accumulated Depreciation Account</label>
                <Input required placeholder="Account ID" value={deprForm.accumAccId} onChange={e => setDeprForm({ ...deprForm, accumAccId: e.target.value })} className="h-9 text-xs font-mono" />
                <p className="text-[10px] text-slate-400 mt-1">Accumulated depreciation balance sheet account (Cr on posting).</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setDeprModal(null)}>Cancel</button>
              <button type="submit" className="primary" disabled={actingId === deprModal.id}>{actingId === deprModal.id ? 'Posting…' : 'Post Depreciation'}</button>
            </div>
          </form>
        </div>
      )}

      {disposeModal && (
        <div className="overlay">
          <form className="modal" onSubmit={disposeAsset}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">FIXED ASSETS</p>
                <h2>Dispose Asset — {disposeModal.name}</h2>
              </div>
              <button type="button" className="close" onClick={() => setDisposeModal(null)}>×</button>
            </div>
            <div className="form-grid">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Disposal Date</label>
                <Input required type="date" value={disposeForm.disposalDate} onChange={e => setDisposeForm({ ...disposeForm, disposalDate: e.target.value })} className="h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Proceeds</label>
                <Input required type="number" step="0.01" placeholder="0.00" value={disposeForm.proceeds} onChange={e => setDisposeForm({ ...disposeForm, proceeds: e.target.value })} className="h-9 text-xs font-mono" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">Proceeds To (Cash/Bank Account ID)</label>
                <Input placeholder="Account ID" value={disposeForm.cashAccountId} onChange={e => setDisposeForm({ ...disposeForm, cashAccountId: e.target.value })} className="h-9 text-xs font-mono" />
                <p className="text-[10px] text-slate-400 mt-1">Optional — posts Dr Cash / Cr Asset & gain on disposal.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setDisposeModal(null)}>Cancel</button>
              <button type="submit" className="primary" disabled={actingId === disposeModal.id}>{actingId === disposeModal.id ? 'Posting…' : 'Dispose & Post Journal'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};