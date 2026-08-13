import React, { useState, useEffect } from 'react';
import { taxApi, type TaxAuthority, type TaxCode, type TaxRate } from './api/modules/tax.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Percent, RefreshCw, Plus } from 'lucide-react';
import type { Entity } from './EntitySettings';

interface TaxAccountingViewProps {
  activeEntityId: string;
  entities: Entity[];
}

export const TaxAccountingView: React.FC<TaxAccountingViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [authorities, setAuthorities] = useState<TaxAuthority[]>([]);
  const [codes, setCodes] = useState<TaxCode[]>([]);
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [codeForm, setCodeForm] = useState({ code: '', name: '', taxType: 'Sales Tax', taxAuthorityId: '', rate: '' });
  const [rateForm, setRateForm] = useState({ taxCodeId: '', name: '', ratePercent: '', effectiveDate: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    setLoading(true);
    try {
      const [auths, cs, rs] = await Promise.all([
        taxApi.getTaxAuthorities(),
        taxApi.getTaxCodes(),
        taxApi.getTaxRates(),
      ]);
      setAuthorities(auths || []);
      setCodes(cs || []);
      setRates(rs || []);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load tax data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const rate = parseFloat(codeForm.rate);
    if (!codeForm.code || !codeForm.name) { setFormError('Code and name are required.'); return; }
    if (isNaN(rate) || rate <= 0) { setFormError('Rate must be greater than zero.'); return; }
    setSaving(true);
    try {
      const created = await taxApi.createTaxCode({
        code: codeForm.code,
        name: codeForm.name,
        taxType: codeForm.taxType,
        taxAuthorityId: codeForm.taxAuthorityId || undefined,
        rates: [{ name: `${codeForm.name} Standard`, ratePercent: rate, effectiveDate: new Date().toISOString().slice(0, 10) }],
      });
      setCodes(prev => [...prev, created]);
      setShowCodeForm(false);
      setCodeForm({ code: '', name: '', taxType: 'Sales Tax', taxAuthorityId: '', rate: '' });
      load();
    } catch (err: any) {
      setFormError(err?.data?.message || err?.message || 'Failed to create tax code.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const pct = parseFloat(rateForm.ratePercent);
    if (!rateForm.taxCodeId) { setFormError('Select a tax code.'); return; }
    if (isNaN(pct) || pct <= 0) { setFormError('Rate percent must be positive.'); return; }
    setSaving(true);
    try {
      const created = await taxApi.createTaxRate({
        taxCodeId: rateForm.taxCodeId,
        name: rateForm.name,
        ratePercent: pct,
        effectiveDate: rateForm.effectiveDate,
      });
      setRates(prev => [...prev, created]);
      setShowRateForm(false);
      setRateForm({ taxCodeId: '', name: '', ratePercent: '', effectiveDate: new Date().toISOString().slice(0, 10) });
      load();
    } catch (err: any) {
      setFormError(err?.data?.message || err?.message || 'Failed to create tax rate.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Percent className="w-4 h-4 text-indigo-600" /> Accounting & Finance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Tax Accounting</h1>
          <p className="text-xs text-slate-500">
            Sales tax, VAT, GST and withholding configuration for {currentEntity?.name || 'Active Entity'}
            (IAS 12 income taxes / IAS 37, IFRS 15 transaction price allocation).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load} className="h-9 px-3 gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCodeForm(true)} className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b] hover:bg-[#0f3222]">
            <Plus className="w-4 h-4" /> New Tax Code
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRateForm(true)} className="h-9 px-4 gap-1.5 text-xs font-semibold">
            <Plus className="w-4 h-4" /> New Tax Rate
          </Button>
        </div>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading tax configuration…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tax Codes</h2>
          </div>
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">CODE</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NAME</TableHead>
                <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">TYPE</TableHead>
                <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {codes.length === 0 && !loading && (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-xs text-slate-400">No tax codes defined.</TableCell></TableRow>
              )}
              {codes.map(c => (
                <TableRow key={c.id} className="hover:bg-slate-50/80">
                  <TableCell className="py-3 pl-4 font-mono text-xs font-bold text-slate-800">{c.code}</TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-slate-800">{c.name}</TableCell>
                  <TableCell className="py-3 text-xs text-slate-600">{c.taxType || c.taxType}</TableCell>
                  <TableCell className="py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${c.isActive !== false && c.status !== 'Inactive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                      {c.isActive === false || c.status === 'Inactive' ? 'Inactive' : 'Active'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tax Rates</h2>
          </div>
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">CODE</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">RATE NAME</TableHead>
                <TableHead className="w-20 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">%</TableHead>
                <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">EFFECTIVE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {rates.length === 0 && !loading && (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-xs text-slate-400">No tax rates defined.</TableCell></TableRow>
              )}
              {rates.map(r => {
                const code = codes.find(c => c.id === r.taxCodeId);
                return (
                  <TableRow key={r.id} className="hover:bg-slate-50/80">
                    <TableCell className="py-3 pl-4 font-mono text-xs font-bold text-slate-800">{code?.code || '—'}</TableCell>
                    <TableCell className="py-3 text-xs font-semibold text-slate-800">{r.name}</TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs font-bold text-indigo-700">{r.ratePercent ?? r.percentage}%</TableCell>
                    <TableCell className="py-3 font-mono text-xs text-slate-600">{r.effectiveDate?.slice(0, 10)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tax Authorities & Jurisdictions</h2>
        </div>
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">COUNTRY</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">REGION</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">JURISDICTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {authorities.length === 0 && !loading && (
              <TableRow><TableCell colSpan={4} className="py-6 text-center text-xs text-slate-400">No tax authorities defined.</TableCell></TableRow>
            )}
            {authorities.map(a => (
              <TableRow key={a.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3 pl-4 text-xs font-bold text-slate-800">{a.name}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{a.country || a.jurisdiction || '—'}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{a.region || '—'}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{a.jurisdiction || a.state || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {showCodeForm && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreateCode}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">TAX ACCOUNTING</p>
                <h2>Create Tax Code</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowCodeForm(false)}>×</button>
            </div>
            <div className="form-grid">
              {formError && <p className="error" style={{ gridColumn: '1 / -1', color: '#c25c5c', fontSize: 13, marginBottom: 10 }}>{formError}</p>}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tax Code</label>
                <Input required placeholder="e.g. ST-17" value={codeForm.code} onChange={e => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })} className="h-9 text-xs font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Name</label>
                <Input required placeholder="e.g. Standard Sales Tax" value={codeForm.name} onChange={e => setCodeForm({ ...codeForm, name: e.target.value })} className="h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tax Type</label>
                <select value={codeForm.taxType} onChange={e => setCodeForm({ ...codeForm, taxType: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
                  <option>Sales Tax</option>
                  <option>VAT</option>
                  <option>GST</option>
                  <option>Withholding Tax</option>
                  <option>Customs Duty</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tax Authority</label>
                <select value={codeForm.taxAuthorityId} onChange={e => setCodeForm({ ...codeForm, taxAuthorityId: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                  <option value="">— Select Authority —</option>
                  {authorities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Standard Rate (%)</label>
                <Input required type="number" step="0.01" placeholder="17.00" value={codeForm.rate} onChange={e => setCodeForm({ ...codeForm, rate: e.target.value })} className="h-9 text-xs font-mono" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowCodeForm(false)}>Cancel</button>
              <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Create Tax Code'}</button>
            </div>
          </form>
        </div>
      )}

      {showRateForm && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreateRate}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">TAX ACCOUNTING</p>
                <h2>Create Tax Rate</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowRateForm(false)}>×</button>
            </div>
            <div className="form-grid">
              {formError && <p className="error" style={{ gridColumn: '1 / -1', color: '#c25c5c', fontSize: 13, marginBottom: 10 }}>{formError}</p>}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tax Code</label>
                <select required value={rateForm.taxCodeId} onChange={e => setRateForm({ ...rateForm, taxCodeId: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                  <option value="">— Select Code —</option>
                  {codes.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Rate Name</label>
                <Input required placeholder="e.g. Standard Rate" value={rateForm.name} onChange={e => setRateForm({ ...rateForm, name: e.target.value })} className="h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Rate (%)</label>
                <Input required type="number" step="0.01" placeholder="17.00" value={rateForm.ratePercent} onChange={e => setRateForm({ ...rateForm, ratePercent: e.target.value })} className="h-9 text-xs font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Effective Date</label>
                <Input required type="date" value={rateForm.effectiveDate} onChange={e => setRateForm({ ...rateForm, effectiveDate: e.target.value })} className="h-9 text-xs" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setShowRateForm(false)}>Cancel</button>
              <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Create Tax Rate'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};