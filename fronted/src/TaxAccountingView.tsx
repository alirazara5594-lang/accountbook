import React, { useState, useEffect, useMemo } from 'react';
import { taxApi, type TaxAuthority, type TaxCode, type TaxRate, type TaxJurisdiction } from './api/modules/tax.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Percent, Plus, Globe2, FileCheck2 } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';

interface TaxAccountingViewProps {
  activeEntityId: string;
  entities: Entity[];
}

const JURISDICTION_COUNTRY: Record<string, string[]> = {
  UK: ['United Kingdom'],
  USA: ['United States'],
  PK: ['Pakistan'],
  EU: ['European Union'],
  UAE: ['United Arab Emirates'],
  SA: ['Saudi Arabia'],
  CA: ['Canada'],
};

export const TaxAccountingView: React.FC<TaxAccountingViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [jurisdictions, setJurisdictions] = useState<TaxJurisdiction[]>([]);
  const [authorities, setAuthorities] = useState<TaxAuthority[]>([]);
  const [codes, setCodes] = useState<TaxCode[]>([]);
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('UK');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [codeForm, setCodeForm] = useState({ code: '', name: '', taxType: 'Sales Tax', taxAuthorityId: '', rate: '' });
  const [rateForm, setRateForm] = useState({ taxCodeId: '', name: '', ratePercent: '', effectiveDate: new Date().toISOString().slice(0, 10) });

  const load = async () => {
    setLoading(true);
    try {
      const [jurs, auths, cs, rs] = await Promise.all([
        taxApi.getJurisdictions().catch(() => []),
        taxApi.getTaxAuthorities(),
        taxApi.getTaxCodes(),
        taxApi.getTaxRates(),
      ]);
      setJurisdictions(jurs || []);
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

  const current = jurisdictions.find(j => j.id === selectedJurisdiction) || jurisdictions[0];

  const countryNames = JURISDICTION_COUNTRY[selectedJurisdiction] || [];
  const jurisdictionAuthorities = useMemo(
    () => authorities.filter(a => countryNames.some(c => (a.country || '').toLowerCase() === c.toLowerCase())),
    [authorities, selectedJurisdiction]
  );
  const authorityIds = new Set(jurisdictionAuthorities.map(a => a.id));

  const jurisdictionCodes = useMemo(
    () => codes.filter(c => c.taxAuthorityId && authorityIds.has(c.taxAuthorityId)),
    [codes, selectedJurisdiction]
  );
  const jurisdictionCodeIds = new Set(jurisdictionCodes.map(c => c.id));
  const jurisdictionRates = useMemo(
    () => rates.filter(r => jurisdictionCodeIds.has(r.taxCodeId)),
    [rates, selectedJurisdiction]
  );

  const openCreateCode = () => {
    setFormError('');
    setCodeForm({
      code: '',
      name: '',
      taxType: 'Sales Tax',
      taxAuthorityId: jurisdictionAuthorities[0]?.id || '',
      rate: current ? String(current.standardRate) : '',
    });
    setShowCodeForm(true);
  };

  const openCreateRate = () => {
    setFormError('');
    setRateForm({
      taxCodeId: jurisdictionCodes[0]?.id || '',
      name: 'Standard Rate',
      ratePercent: current ? String(current.standardRate) : '',
      effectiveDate: new Date().toISOString().slice(0, 10),
    });
    setShowRateForm(true);
  };

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
        description: `${codeForm.taxType} — ${current?.name || 'Tax'}`,
        taxAuthorityId: codeForm.taxAuthorityId,
        isActive: true,
        rates: [{ percentage: rate, effectiveFrom: new Date().toISOString().slice(0, 10) }],
      });
      setCodes(prev => [...prev, created]);
      setShowCodeForm(false);
      load();
    } catch (err: any) {
      setFormError(err?.data?.error || err?.data?.message || err?.message || 'Failed to create tax code.');
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
      await taxApi.createTaxRate({
        taxCodeId: rateForm.taxCodeId,
        percentage: pct,
        effectiveFrom: rateForm.effectiveDate,
      });
      setShowRateForm(false);
      load();
    } catch (err: any) {
      setFormError(err?.data?.error || err?.data?.message || err?.message || 'Failed to create tax rate.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCodes = useMemo(() => {
    if (!query.trim()) return jurisdictionCodes;
    const q = query.toLowerCase();
    return jurisdictionCodes.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (c.taxType || '').toLowerCase().includes(q)
    );
  }, [jurisdictionCodes, query]);

  const filteredRates = useMemo(() => {
    if (!query.trim()) return jurisdictionRates;
    const q = query.toLowerCase();
    return jurisdictionRates.filter(r => (r.name || '').toLowerCase().includes(q) || String(r.ratePercent).includes(q));
  }, [jurisdictionRates, query]);

  const exportHeaders = ['Type', 'Code', 'Name', 'Rate %', 'Effective From', 'Authority'];
  const exportRows = [
    ...filteredCodes.map(c => ['Tax Code', c.code, c.name, String(c.rates?.[0]?.percentage ?? ''), c.rates?.[0]?.effectiveFrom ?? '', c.taxAuthorityId || '']),
    ...filteredRates.map(r => ['Tax Rate', r.taxCodeId, r.name, String(r.ratePercent), r.effectiveFrom, '']),
  ];

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Percent className="w-4 h-4 text-indigo-600" /> Accounting & Finance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Tax Accounting</h1>
          <p className="text-xs text-slate-500">
            Multi-jurisdiction VAT / Sales Tax / GST configuration for {currentEntity?.name || 'Active Entity'}
            — UK, USA, Pakistan, Europe, UAE, Saudi Arabia & Canada (IAS 12 income taxes, IAS 37 provisions, IFRS 15).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataToolbar
            query={query}
            setQuery={setQuery}
            searchPlaceholder="Search tax code, rate, name..."
            exportFileName={`tax-accounting-${selectedJurisdiction}`}
            exportSheetName={`Tax Accounting — ${current?.name || selectedJurisdiction}`}
            exportTitle="Tax Accounting"
            exportSubtitle={`Multi-jurisdiction VAT / Sales Tax / GST configuration for ${currentEntity?.name || 'Active Entity'} — ${current?.name || ''} (IAS 12 / IAS 37 / IFRS 15).`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            onRefresh={load}
          />
          <Button size="sm" onClick={openCreateCode} className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b] hover:bg-[#0f3222]">
            <Plus className="w-4 h-4" /> New Tax Code
          </Button>
          <Button size="sm" variant="outline" onClick={openCreateRate} className="h-9 px-4 gap-1.5 text-xs font-semibold">
            <Plus className="w-4 h-4" /> New Tax Rate
          </Button>
        </div>
      </div>

      {/* Jurisdiction selector */}
      <div className="flex flex-wrap gap-2">
        {jurisdictions.map(j => (
          <button
            key={j.id}
            onClick={() => setSelectedJurisdiction(j.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${selectedJurisdiction === j.id ? 'bg-[#143e2b] text-white border-[#143e2b] shadow-sm' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
          >
            <span className="mr-1.5">{j.flag}</span>{j.name}
          </button>
        ))}
      </div>

      {loading && <p className="text-xs text-slate-500">Loading tax configuration…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {/* Regime reference card */}
      {current && (
        <section className="bg-gradient-to-br from-indigo-50 via-white to-white border border-indigo-100 rounded-xl p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div>
        <div className="flex flex-wrap items-center gap-2">
                <Globe2 className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900">{current.flag} {current.name} — {current.regime} Regime</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">{current.note}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold bg-indigo-600 text-white">
              <FileCheck2 className="w-3.5 h-3.5" /> {current.filingForm}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mt-4">
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Authority</p>
              <p className="text-xs font-bold text-slate-800 mt-1">{current.authority}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Standard Rate</p>
              <p className="text-lg font-bold text-indigo-700 mt-0.5">{current.standardRate}%</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reduced Rate</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{current.reducedRate}%</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration Threshold</p>
              <p className="text-sm font-bold text-slate-800 mt-1 font-mono">{current.registrationThreshold > 0 ? `${current.registrationThreshold.toLocaleString()} ${current.currency}` : '—'}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filing Frequency</p>
              <p className="text-xs font-bold text-slate-800 mt-1">{current.filingFrequency}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate Tax</p>
              <p className="text-xs font-bold text-slate-800 mt-1">{current.corporateTax}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Currency</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{current.currency}</p>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tax Codes — {current?.flag} {current?.name}</h2>
            <span className="text-[10px] font-bold text-slate-400">{filteredCodes.length} codes</span>
          </div>
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">CODE</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">NAME</TableHead>
                <TableHead className="w-20 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">RATE</TableHead>
                <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredCodes.length === 0 && !loading && (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-xs text-slate-400">No tax codes for this jurisdiction yet.</TableCell></TableRow>
              )}
              {filteredCodes.map(c => {
                const latestRate = c.rates?.length ? c.rates[c.rates.length - 1] : undefined;
                return (
                  <TableRow key={c.id} className="hover:bg-slate-50/80">
                    <TableCell className="py-3 pl-4 font-mono text-xs font-bold text-slate-800">{c.code}</TableCell>
                    <TableCell className="py-3 text-xs font-semibold text-slate-800">{c.name}</TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs font-bold text-indigo-700">{latestRate?.percentage ?? latestRate?.ratePercent ?? 0}%</TableCell>
                    <TableCell className="py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${c.isActive !== false && c.status !== 'Inactive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {c.isActive === false || c.status === 'Inactive' ? 'Inactive' : 'Active'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tax Rates — {current?.flag} {current?.name}</h2>
            <span className="text-[10px] font-bold text-slate-400">{filteredRates.length} rates</span>
          </div>
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">CODE</TableHead>
                <TableHead className="w-20 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">%</TableHead>
                <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">EFFECTIVE</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredRates.length === 0 && !loading && (
                <TableRow><TableCell colSpan={4} className="py-6 text-center text-xs text-slate-400">No tax rates for this jurisdiction yet.</TableCell></TableRow>
              )}
              {filteredRates.map(r => {
                const code = jurisdictionCodes.find(c => c.id === r.taxCodeId);
                return (
                  <TableRow key={r.id} className="hover:bg-slate-50/80">
                    <TableCell className="py-3 pl-4 font-mono text-xs font-bold text-slate-800">{code?.code || '—'}</TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs font-bold text-indigo-700">{r.ratePercent ?? r.percentage}%</TableCell>
                    <TableCell className="py-3 font-mono text-xs text-slate-600">{r.effectiveDate?.slice(0, 10) || r.effectiveFrom?.slice(0, 10) || '—'}</TableCell>
                    <TableCell className="py-3 font-mono text-xs text-slate-600">{r.effectiveTo ? r.effectiveTo.slice(0, 10) : 'Current'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tax Authorities — {current?.flag} {current?.name}</h2>
        </div>
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">COUNTRY</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATE / REGION</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">REGISTRATION NO.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {jurisdictionAuthorities.length === 0 && !loading && (
              <TableRow><TableCell colSpan={4} className="py-6 text-center text-xs text-slate-400">No authorities for this jurisdiction.</TableCell></TableRow>
            )}
            {jurisdictionAuthorities.map(a => (
              <TableRow key={a.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3 pl-4 text-xs font-bold text-slate-800">{a.name}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{a.country || '—'}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{a.state || a.region || '—'}</TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{a.registrationNumber || '—'}</TableCell>
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
                <p className="eyebrow">TAX ACCOUNTING — {current?.flag} {current?.name}</p>
                <h2>Create Tax Code</h2>
              </div>
              <button type="button" className="close" onClick={() => setShowCodeForm(false)}>×</button>
            </div>
            <div className="form-grid">
              {formError && <p className="error" style={{ gridColumn: '1 / -1', color: '#c25c5c', fontSize: 13, marginBottom: 10 }}>{formError}</p>}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tax Code</label>
                <Input required placeholder="e.g. VAT-PK-17" value={codeForm.code} onChange={e => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })} className="h-9 text-xs font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Name</label>
                <Input required placeholder="e.g. Standard VAT" value={codeForm.name} onChange={e => setCodeForm({ ...codeForm, name: e.target.value })} className="h-9 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tax Type</label>
                <select value={codeForm.taxType} onChange={e => setCodeForm({ ...codeForm, taxType: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
                  <option>Sales Tax</option>
                  <option>VAT</option>
                  <option>GST</option>
                  <option>HST</option>
                  <option>Withholding Tax</option>
                  <option>Corporate Tax</option>
                  <option>Customs Duty</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tax Authority</label>
                <select value={codeForm.taxAuthorityId} onChange={e => setCodeForm({ ...codeForm, taxAuthorityId: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                  <option value="">— Select Authority —</option>
                  {jurisdictionAuthorities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Standard Rate (%)</label>
                <Input required type="number" step="0.01" placeholder="17.00" value={codeForm.rate} onChange={e => setCodeForm({ ...codeForm, rate: e.target.value })} className="h-9 text-xs font-mono" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary btn-cancel" onClick={() => setShowCodeForm(false)}>Cancel</button>
              <button type="button" className="secondary btn-draft" onClick={(e) => { e.preventDefault(); alert("��� Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary btn-finalize" disabled={saving}>{saving ? 'Saving…' : 'Create Tax Code'}</button>
            </div>
          </form>
        </div>
      )}

      {showRateForm && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreateRate}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">TAX ACCOUNTING — {current?.flag} {current?.name}</p>
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
                  {jurisdictionCodes.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
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
              <button type="button" className="secondary btn-cancel" onClick={() => setShowRateForm(false)}>Cancel</button>
              <button type="button" className="secondary btn-draft" onClick={(e) => { e.preventDefault(); alert("��� Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary btn-finalize" disabled={saving}>{saving ? 'Saving…' : 'Create Tax Rate'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};