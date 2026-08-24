import React, { useState, useEffect, useMemo } from 'react';
import {
  taxApi,
  type TaxAuthority,
  type TaxCode,
  type TaxExemption,
  type TaxJurisdiction,
  type TaxSummaryReport,
} from './api/modules/tax.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Percent,
  Plus,
  Globe2,
  FileCheck2,
  Landmark,
  ShieldCheck,
  FileText,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';
import { money } from './lib/currency';

interface TaxAccountingViewProps {
  activeEntityId: string;
  entities: Entity[];
}

const JURISDICTION_COUNTRY: Record<string, string[]> = {
  UK: ['United Kingdom', 'UK', 'Great Britain', 'England', 'Scotland', 'Wales'],
  USA: ['United States', 'USA', 'US', 'America'],
  PK: ['Pakistan', 'PK'],
  EU: ['European Union', 'EU', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Ireland'],
  UAE: ['United Arab Emirates', 'UAE', 'Dubai', 'Abu Dhabi'],
  SA: ['Saudi Arabia', 'KSA', 'SA'],
  CA: ['Canada', 'CA'],
};

const COUNTRY_TO_JURISDICTION: Record<string, string> = {
  'united kingdom': 'UK',
  'uk': 'UK',
  'great britain': 'UK',
  'united states': 'USA',
  'us': 'USA',
  'usa': 'USA',
  'pakistan': 'PK',
  'pk': 'PK',
  'european union': 'EU',
  'eu': 'EU',
  'united arab emirates': 'UAE',
  'uae': 'UAE',
  'ae': 'UAE',
  'saudi arabia': 'SA',
  'sa': 'SA',
  'ksa': 'SA',
  'canada': 'CA',
  'ca': 'CA',
};

type ActiveTab = 'codes' | 'authorities' | 'exemptions' | 'returns' | 'regime';

export const TaxAccountingView: React.FC<TaxAccountingViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [activeTab, setActiveTab] = useState<ActiveTab>('codes');
  const [jurisdictions, setJurisdictions] = useState<TaxJurisdiction[]>([]);
  const [authorities, setAuthorities] = useState<TaxAuthority[]>([]);
  const [codes, setCodes] = useState<TaxCode[]>([]);
  const [exemptions, setExemptions] = useState<TaxExemption[]>([]);
  const [summaryReport, setSummaryReport] = useState<TaxSummaryReport | null>(null);

  const [selectedJurisdiction, setSelectedJurisdiction] = useState('UK');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [query, setQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [showExemptionForm, setShowExemptionForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Edit States
  const [editingCode, setEditingCode] = useState<TaxCode | null>(null);
  const [editingAuth, setEditingAuth] = useState<TaxAuthority | null>(null);

  // Form States
  const [codeForm, setCodeForm] = useState({
    code: '',
    name: '',
    description: '',
    taxType: 'Standard' as any,
    scope: 'Both' as any,
    taxAuthorityId: '',
    jurisdictionId: 'UK',
    deductibilityPercentage: '100',
    isCompound: false,
    rate: '',
  });

  const [rateForm, setRateForm] = useState({
    taxCodeId: '',
    ratePercent: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
  });

  const [authForm, setAuthForm] = useState({
    name: '',
    code: '',
    country: '',
    state: '',
    registrationNumber: '',
    filingFrequency: 'Quarterly',
    remittanceDueDay: '20',
    website: '',
  });

  const [exemptionForm, setExemptionForm] = useState({
    certificateNumber: '',
    type: 'Resale' as any,
    counterpartyName: '',
    taxId: '',
    issuingAuthority: '',
    jurisdictionId: 'UK',
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: '',
    status: 'Active' as any,
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [jurs, auths, cs, exs, summ] = await Promise.all([
        taxApi.getJurisdictions().catch(() => []),
        taxApi.getTaxAuthorities(activeEntityId).catch(() => []),
        taxApi.getTaxCodes(undefined, activeEntityId).catch(() => []),
        taxApi.getTaxExemptions(undefined, activeEntityId).catch(() => []),
        taxApi.getTaxSummaryReport({ jurisdictionId: selectedJurisdiction, companyId: activeEntityId }).catch(() => null),
      ]);
      setJurisdictions(jurs || []);
      setAuthorities(auths || []);
      setCodes(cs || []);
      setExemptions(exs || []);
      setSummaryReport(summ);
      setError('');

      // Auto-provision if store is empty on first load
      if (!cs || cs.length === 0) {
        const countryToSeed = currentEntity?.country || 'Pakistan';
        taxApi.seedCountryPreset(countryToSeed, activeEntityId).then(async () => {
          const [newAuths, newCs] = await Promise.all([
            taxApi.getTaxAuthorities(activeEntityId).catch(() => []),
            taxApi.getTaxCodes(undefined, activeEntityId).catch(() => []),
          ]);
          setAuthorities(newAuths || []);
          setCodes(newCs || []);
        }).catch(() => {});
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load tax data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeEntityId]);

  useEffect(() => {
    if (currentEntity?.country) {
      const jurId = COUNTRY_TO_JURISDICTION[currentEntity.country.toLowerCase()];
      if (jurId) setSelectedJurisdiction(jurId);
    }
  }, [currentEntity?.country]);

  useEffect(() => {
    taxApi
      .getTaxSummaryReport({ jurisdictionId: selectedJurisdiction, companyId: activeEntityId })
      .then(setSummaryReport)
      .catch(() => {});
  }, [selectedJurisdiction, activeEntityId]);

  const current = jurisdictions.find(j => j.id === selectedJurisdiction) || jurisdictions[0];
  const countryNames = JURISDICTION_COUNTRY[selectedJurisdiction] || [];
  const jurisdictionAuthorities = useMemo(
    () => authorities.filter(a => countryNames.some(c => (a.country || '').toLowerCase().includes(c.toLowerCase()))),
    [authorities, selectedJurisdiction]
  );
  const authorityIds = new Set(jurisdictionAuthorities.map(a => a.id));
  const jurisdictionCodes = useMemo(
    () =>
      codes.filter(c => {
        if (c.jurisdictionId && c.jurisdictionId.toUpperCase() === selectedJurisdiction.toUpperCase()) return true;
        if (c.taxAuthorityId && authorityIds.has(c.taxAuthorityId)) return true;
        const codeUpper = (c.code || '').toUpperCase();
        if (selectedJurisdiction === 'UK' && codeUpper.includes('UK')) return true;
        if (selectedJurisdiction === 'PK' && (codeUpper.includes('PK') || codeUpper.includes('PRA') || codeUpper.includes('SRB') || codeUpper.includes('KPRA') || codeUpper.includes('BRA') || codeUpper.includes('FBR'))) return true;
        if (selectedJurisdiction === 'SA' && (codeUpper.includes('KSA') || codeUpper.includes('SA') || codeUpper.includes('ZATCA'))) return true;
        if (selectedJurisdiction === 'UAE' && (codeUpper.includes('UAE') || codeUpper.includes('FTA'))) return true;
        if (selectedJurisdiction === 'USA' && (codeUpper.includes('US') || codeUpper.includes('CA-') || codeUpper.includes('NY') || codeUpper.includes('TX'))) return true;
        if (selectedJurisdiction === 'CA' && (codeUpper.includes('CA') || codeUpper.includes('GST') || codeUpper.includes('HST'))) return true;
        if (selectedJurisdiction === 'EU' && (codeUpper.includes('EU') || codeUpper.includes('DE') || codeUpper.includes('FR') || codeUpper.includes('NL') || codeUpper.includes('IE'))) return true;
        return false;
      }),
    [codes, selectedJurisdiction, authorityIds]
  );

  const filteredCodes = useMemo(
    () =>
      jurisdictionCodes.filter(c => {
        const matchQuery =
          !query ||
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.description || '').toLowerCase().includes(query.toLowerCase());
        const matchScope =
          scopeFilter === 'all' ||
          String(c.scope).toLowerCase() === scopeFilter.toLowerCase() ||
          String(c.scope) === '0' ||
          String(c.scope).toLowerCase() === 'both';
        const matchType = typeFilter === 'all' || String(c.taxType).toLowerCase() === typeFilter.toLowerCase();
        return matchQuery && matchScope && matchType;
      }),
    [jurisdictionCodes, query, scopeFilter, typeFilter]
  );

  const handleProvisionPreset = async (targetCountry?: string) => {
    const countryToSeed = targetCountry || currentEntity?.country || current?.name || 'United Kingdom';
    setSeeding(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await taxApi.seedCountryPreset(countryToSeed, activeEntityId);
      setSuccessMsg(res.message || `Tax preset for ${countryToSeed} provisioned successfully.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to auto-provision country tax pack.');
    } finally {
      setSeeding(false);
    }
  };

  const openCreateCode = () => {
    setFormError('');
    setEditingCode(null);
    setCodeForm({
      code: '',
      name: '',
      description: '',
      taxType: 'Standard',
      scope: 'Both',
      taxAuthorityId: jurisdictionAuthorities[0]?.id || authorities[0]?.id || '',
      jurisdictionId: selectedJurisdiction,
      deductibilityPercentage: '100',
      isCompound: false,
      rate: current ? String(current.standardRate) : '20',
    });
    setShowCodeForm(true);
  };

  const openEditCode = (c: TaxCode) => {
    setFormError('');
    setEditingCode(c);
    const latestRate = c.rates?.length ? c.rates[c.rates.length - 1] : undefined;
    setCodeForm({
      code: c.code,
      name: c.name,
      description: c.description || '',
      taxType: c.taxType || 'Standard',
      scope: c.scope || 'Both',
      taxAuthorityId: c.taxAuthorityId || '',
      jurisdictionId: c.jurisdictionId || selectedJurisdiction,
      deductibilityPercentage: String(c.deductibilityPercentage ?? 100),
      isCompound: Boolean(c.isCompound),
      rate: String(latestRate?.percentage ?? latestRate?.ratePercent ?? 0),
    });
    setShowCodeForm(true);
  };

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const rateVal = parseFloat(codeForm.rate);
    if (!codeForm.code || !codeForm.name) {
      setFormError('Code and name are required.');
      return;
    }
    if (isNaN(rateVal) || rateVal < 0) {
      setFormError('Rate must be 0% or positive.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        code: codeForm.code.trim().toUpperCase(),
        name: codeForm.name.trim(),
        description: codeForm.description.trim(),
        taxType: codeForm.taxType,
        scope: codeForm.scope,
        taxAuthorityId: codeForm.taxAuthorityId,
        jurisdictionId: codeForm.jurisdictionId || selectedJurisdiction,
        deductibilityPercentage: parseFloat(codeForm.deductibilityPercentage) || 100,
        isCompound: codeForm.isCompound,
        isActive: editingCode ? editingCode.isActive !== false : true,
        companyId: activeEntityId,
        rates: [{ percentage: rateVal, effectiveFrom: new Date().toISOString().slice(0, 10) }],
      };
      if (editingCode) await taxApi.updateTaxCode(editingCode.id, payload);
      else await taxApi.createTaxCode(payload);
      setShowCodeForm(false);
      setEditingCode(null);
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save tax code.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax code?')) return;
    try {
      await taxApi.deleteTaxCode(id);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete tax code.');
    }
  };

  const handleToggleCodeStatus = async (c: TaxCode) => {
    const latestRate = c.rates?.length ? c.rates[c.rates.length - 1] : undefined;
    const rateVal = latestRate?.percentage ?? latestRate?.ratePercent ?? 0;
    try {
      await taxApi.updateTaxCode(c.id, {
        code: c.code,
        name: c.name,
        description: c.description || '',
        taxType: c.taxType || 'Standard',
        scope: c.scope || 'Both',
        taxAuthorityId: c.taxAuthorityId,
        jurisdictionId: c.jurisdictionId || selectedJurisdiction,
        deductibilityPercentage: c.deductibilityPercentage ?? 100,
        isCompound: c.isCompound ?? false,
        isActive: !(c.isActive !== false),
        companyId: activeEntityId,
        rates: [{ percentage: rateVal, effectiveFrom: new Date().toISOString().slice(0, 10) }],
      });
      await load();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status.');
    }
  };

  const openCreateRateForCode = (c: TaxCode) => {
    setFormError('');
    setRateForm({
      taxCodeId: c.id,
      ratePercent: '',
      effectiveDate: new Date().toISOString().slice(0, 10),
    });
    setShowRateForm(true);
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const pct = parseFloat(rateForm.ratePercent);
    if (!rateForm.taxCodeId) {
      setFormError('Select a tax code.');
      return;
    }
    if (isNaN(pct) || pct < 0) {
      setFormError('Rate percent must be zero or positive.');
      return;
    }
    setSaving(true);
    try {
      await taxApi.createTaxRate({
        taxCodeId: rateForm.taxCodeId,
        percentage: pct,
        effectiveFrom: rateForm.effectiveDate,
      });
      setShowRateForm(false);
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create tax rate.');
    } finally {
      setSaving(false);
    }
  };

  const openCreateAuth = () => {
    setFormError('');
    setEditingAuth(null);
    setAuthForm({
      name: '',
      code: '',
      country: current?.name || 'United Kingdom',
      state: '',
      registrationNumber: '',
      filingFrequency: current?.filingFrequency || 'Quarterly',
      remittanceDueDay: '20',
      website: '',
    });
    setShowAuthForm(true);
  };

  const openEditAuth = (a: TaxAuthority) => {
    setFormError('');
    setEditingAuth(a);
    setAuthForm({
      name: a.name,
      code: a.code || '',
      country: a.country || '',
      state: a.state || '',
      registrationNumber: a.registrationNumber || '',
      filingFrequency: a.filingFrequency || 'Quarterly',
      remittanceDueDay: String(a.remittanceDueDay || 20),
      website: a.website || '',
    });
    setShowAuthForm(true);
  };

  const handleSaveAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!authForm.name) {
      setFormError('Authority name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: authForm.name.trim(),
        code: authForm.code.trim().toUpperCase(),
        country: authForm.country.trim(),
        state: authForm.state.trim(),
        registrationNumber: authForm.registrationNumber.trim(),
        filingFrequency: authForm.filingFrequency,
        remittanceDueDay: parseInt(authForm.remittanceDueDay, 10) || 20,
        website: authForm.website.trim(),
        companyId: activeEntityId,
      };
      if (editingAuth) await taxApi.updateTaxAuthority(editingAuth.id, payload);
      else await taxApi.createTaxAuthority(payload);
      setShowAuthForm(false);
      setEditingAuth(null);
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save authority.');
    } finally {
      setSaving(false);
    }
  };

  const openCreateExemption = () => {
    setFormError('');
    setExemptionForm({
      certificateNumber: '',
      type: 'Resale',
      counterpartyName: '',
      taxId: '',
      issuingAuthority: jurisdictionAuthorities[0]?.name || '',
      jurisdictionId: selectedJurisdiction,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      status: 'Active',
      notes: '',
    });
    setShowExemptionForm(true);
  };

  const handleSaveExemption = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!exemptionForm.certificateNumber || !exemptionForm.counterpartyName) {
      setFormError('Certificate number and counterparty are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        certificateNumber: exemptionForm.certificateNumber.trim(),
        type: exemptionForm.type,
        counterpartyName: exemptionForm.counterpartyName.trim(),
        taxId: exemptionForm.taxId.trim(),
        issuingAuthority: exemptionForm.issuingAuthority.trim(),
        jurisdictionId: exemptionForm.jurisdictionId || selectedJurisdiction,
        validFrom: exemptionForm.validFrom,
        validTo: exemptionForm.validTo || undefined,
        status: exemptionForm.status,
        notes: exemptionForm.notes.trim(),
        companyId: activeEntityId,
      };
      await taxApi.createTaxExemption(payload);
      setShowExemptionForm(false);
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save exemption certificate.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Auto-Provisioning & Country Quick Switcher */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{current?.flag || '🌐'}</span>
              <h1 className="text-xl font-bold tracking-tight">
                {current?.name || 'Global'} Tax & Compliance Hub
              </h1>
              <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/30 text-xs font-semibold px-2.5 py-0.5">
                {current?.regime || 'VAT / Sales Tax'}
              </Badge>
            </div>
            <p className="text-xs text-indigo-200/80 max-w-2xl">
              Active Entity: <strong className="text-white">{currentEntity?.name || 'Main Company'}</strong> ({currentEntity?.country || 'Default Country'}).
              Automatic country presets configure official tax authorities, rates, IFRS dual-entry GL mappings, and tax return forms.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => handleProvisionPreset()}
              disabled={seeding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              {seeding ? 'Provisioning...' : `⚡ Auto-Provision ${current?.name} Tax Pack`}
            </Button>
          </div>
        </div>

        {/* Quick Country Switcher Bar */}
        <div className="mt-5 pt-4 border-t border-indigo-700/40 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider whitespace-nowrap mr-1">
            Country Presets:
          </span>
          {jurisdictions.map(j => (
            <button
              key={j.id}
              onClick={() => setSelectedJurisdiction(j.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                selectedJurisdiction === j.id
                  ? 'bg-white text-indigo-900 shadow-sm font-bold'
                  : 'bg-indigo-800/60 hover:bg-indigo-700/80 text-indigo-100'
              }`}
            >
              <span>{j.flag}</span>
              <span>{j.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({j.standardRate}%)</span>
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('codes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'codes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          Tax Codes & Rates
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {jurisdictionCodes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('authorities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'authorities'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          Tax Authorities & GL Mapping
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {jurisdictionAuthorities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('exemptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'exemptions'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Exemption Certificates
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
            {exemptions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('returns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'returns'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Box-by-Box Return Preview
        </button>

        <button
          onClick={() => setActiveTab('regime')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'regime'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          {current?.flag} {current?.name} Rules
        </button>
      </div>

      {/* ─── TAB 1: TAX CODES & RATES ─── */}
      {activeTab === 'codes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DataToolbar
              searchPlaceholder="Search tax codes, descriptions..."
              query={query}
              setQuery={setQuery}
            />

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={scopeFilter}
                onChange={e => setScopeFilter(e.target.value)}
                className="h-8 px-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xs font-medium"
              >
                <option value="all">All Scopes</option>
                <option value="both">Both (Sales & Purchases)</option>
                <option value="sales">Sales (Output)</option>
                <option value="purchases">Purchases (Input)</option>
              </select>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="h-8 px-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xs font-medium"
              >
                <option value="all">All Tax Types</option>
                <option value="standard">Standard Rated</option>
                <option value="reduced">Reduced Rated</option>
                <option value="zerorated">Zero-Rated (0%)</option>
                <option value="exempt">Exempt</option>
                <option value="withholding">Withholding (WHT)</option>
                <option value="reversecharge">Reverse Charge (RCM)</option>
                <option value="compound">Compound / Multi-tier</option>
              </select>

              <Button
                size="sm"
                onClick={openCreateCode}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Tax Code
              </Button>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)]">
                <TableRow>
                  <TableHead className="w-32 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pl-4">CODE</TableHead>
                  <TableHead className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">NAME & DESCRIPTION</TableHead>
                  <TableHead className="w-28 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">TAX TYPE</TableHead>
                  <TableHead className="w-24 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">SCOPE</TableHead>
                  <TableHead className="w-24 text-right text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">RATE %</TableHead>
                  <TableHead className="w-24 text-center text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">DEDUCTIBLE</TableHead>
                  <TableHead className="w-20 text-center text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">STATUS</TableHead>
                  <TableHead className="w-32 text-right text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pr-4">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[var(--color-border)]">
                {filteredCodes.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <span>No tax codes found for {current?.name}.</span>
                        <Button
                          size="sm"
                          onClick={() => handleProvisionPreset()}
                          disabled={seeding}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Provision Standard {current?.name} Tax Pack
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filteredCodes.map(c => {
                  const latestRate = c.rates?.length ? c.rates[c.rates.length - 1] : undefined;
                  const rateVal = latestRate?.percentage ?? latestRate?.ratePercent ?? 0;
                  const isActive = c.isActive !== false;
                  return (
                    <TableRow key={c.id} className="hover:bg-slate-50/70">
                      <TableCell className="pl-4 font-mono font-bold text-xs text-indigo-700">
                        {c.code}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-bold text-[var(--color-text-strong)]">{c.name}</p>
                        {c.description && (
                          <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">{c.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border-indigo-300"
                        >
                          {String(c.taxType || 'Standard')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[var(--color-text-muted)] font-medium">
                        {String(c.scope || 'Both')}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs text-indigo-600">
                        {rateVal}%
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-[var(--color-text-muted)]">
                        {c.deductibilityPercentage ?? 100}%
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleToggleCodeStatus(c)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? 'Active' : 'Inactive'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openCreateRateForCode(c)}
                            title="Add Rate History"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditCode(c)}
                            title="Edit Tax Code"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCode(c.id)}
                            title="Delete Tax Code"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: TAX AUTHORITIES & GL MAPPING ─── */}
      {activeTab === 'authorities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-strong)]">
                Tax Authorities & Dual-Entry Ledger Accounts
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Configure government tax bodies and link Output VAT, Input VAT, and Withholding Tax to your Chart of Accounts.
              </p>
            </div>
            <Button
              size="sm"
              onClick={openCreateAuth}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Authority
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jurisdictionAuthorities.map(a => (
              <div
                key={a.id}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-indigo-600 shrink-0" />
                      <h3 className="text-sm font-bold text-[var(--color-text-strong)]">{a.name}</h3>
                      {a.code && (
                        <Badge variant="outline" className="text-[10px] font-mono font-bold">
                          {a.code}
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditAuth(a)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <p className="text-xs text-[var(--color-text-muted)]">
                    {a.country || 'Global'}{a.state ? ` · ${a.state}` : ''}
                  </p>

                  <div className="bg-[var(--color-surface-muted)] rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Filing Cycle:</span>
                      <span className="font-semibold text-[var(--color-text-strong)]">{a.filingFrequency || 'Monthly'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Remittance Due:</span>
                      <span className="font-semibold text-[var(--color-text-strong)]">{a.remittanceDueDay || 20}th of month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">TRN / Tax ID:</span>
                      <span className="font-mono font-bold text-indigo-600">{a.registrationNumber || 'Not Registered'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                  <span>Linked Codes: {codes.filter(c => c.taxAuthorityId === a.id).length}</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Mapped GL
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: EXEMPTION CERTIFICATES ─── */}
      {activeTab === 'exemptions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-text-strong)]">
                Tax Exemption & Resale Certificates
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Store valid customer and vendor tax exemption certificates (Resale, 501(c)(3) Non-profit, Diplomatic, Export) for automatic zero-tax invoicing.
              </p>
            </div>
            <Button
              size="sm"
              onClick={openCreateExemption}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Register Certificate
            </Button>
          </div>

          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)]">
                <TableRow>
                  <TableHead className="w-36 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pl-4">CERTIFICATE #</TableHead>
                  <TableHead className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">COUNTERPARTY</TableHead>
                  <TableHead className="w-28 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">EXEMPTION TYPE</TableHead>
                  <TableHead className="w-32 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">TAX / NTN ID</TableHead>
                  <TableHead className="w-36 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">VALIDITY PERIOD</TableHead>
                  <TableHead className="w-24 text-center text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">STATUS</TableHead>
                  <TableHead className="w-24 text-right text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pr-4">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[var(--color-border)]">
                {exemptions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      No exemption certificates registered. Click "Register Certificate" to add one.
                    </TableCell>
                  </TableRow>
                )}
                {exemptions.map(ex => (
                  <TableRow key={ex.id} className="hover:bg-slate-50/70">
                    <TableCell className="pl-4 font-mono font-bold text-xs text-indigo-700">
                      {ex.certificateNumber}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-[var(--color-text-strong)]">{ex.counterpartyName}</p>
                      {ex.issuingAuthority && (
                        <p className="text-[11px] text-[var(--color-text-muted)]">Issued by {ex.issuingAuthority}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold bg-amber-50 text-amber-800 border-amber-300">
                        {String(ex.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-700">
                      {ex.taxId || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-[var(--color-text-muted)]">
                      {ex.validFrom} {ex.validTo ? `→ ${ex.validTo}` : ''}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {String(ex.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (confirm('Delete this exemption certificate?')) {
                            await taxApi.deleteTaxExemption(ex.id);
                            await load();
                          }
                        }}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: TAX RETURNS & BOX-BY-BOX SUMMARY PREVIEW ─── */}
      {activeTab === 'returns' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Total Sales Turnover</p>
              <p className="text-xl font-bold text-[var(--color-text-strong)] mt-1 font-mono">
                {money(summaryReport?.totalSales ?? 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Excl. Tax</p>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Output Tax (Sales)</p>
              <p className="text-xl font-bold text-rose-600 mt-1 font-mono">
                {money(summaryReport?.totalOutputTax ?? 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Collected from customers</p>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Input Tax (Purchases)</p>
              <p className="text-xl font-bold text-emerald-600 mt-1 font-mono">
                {money(summaryReport?.totalInputTax ?? 0)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Claimable deduction</p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 shadow-xs">
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Net Tax Payable / (Refund)</p>
              <p className="text-xl font-bold text-indigo-900 mt-1 font-mono">
                {money(summaryReport?.netTaxPayable ?? 0)}
              </p>
              <p className="text-[11px] text-indigo-600 mt-1">Remittance to {current?.authority}</p>
            </div>
          </div>

          {/* Official Box-by-Box Return Table */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[var(--color-text-strong)] uppercase tracking-wider">
                  Official {current?.flag} {current?.name} Return Form — {current?.filingForm}
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Live calculation from all posted invoices, credit notes, and vendor bills.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => alert(`Tax return for ${current?.name} generated and ready for electronic filing.`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <FileCheck2 className="w-3.5 h-3.5" /> File Tax Return
              </Button>
            </div>

            <Table>
              <TableHeader className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)]">
                <TableRow>
                  <TableHead className="w-40 text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pl-4">FORM BOX / ROW</TableHead>
                  <TableHead className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">DESCRIPTION</TableHead>
                  <TableHead className="w-40 text-right text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider pr-4">CALCULATED AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[var(--color-border)]">
                {(summaryReport?.boxes || []).map((b, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/70">
                    <TableCell className="pl-4 font-mono font-bold text-xs text-indigo-700">
                      {b.box}
                    </TableCell>
                    <TableCell className="text-xs text-[var(--color-text-strong)] font-medium">
                      {b.description}
                    </TableCell>
                    <TableCell className="text-right pr-4 font-mono font-bold text-xs text-[var(--color-text-strong)]">
                      {money(b.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ─── TAB 5: REGIME REFERENCE CARD ─── */}
      {activeTab === 'regime' && current && (
        <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Globe2 className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-[var(--color-text-strong)]">
                  {current.flag} {current.name} — {current.regime} Regime
                </h2>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-3xl">{current.note}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold bg-indigo-600 text-white shadow-xs">
              <FileCheck2 className="w-3.5 h-3.5" /> {current.filingForm}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
            <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Authority</p>
              <p className="text-xs font-bold text-[var(--color-text-strong)] mt-1">{current.authority}</p>
            </div>
            <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Standard Rate</p>
              <p className="text-lg font-bold text-indigo-600 mt-0.5">{current.standardRate}%</p>
            </div>
            <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Reduced Rate</p>
              <p className="text-lg font-bold text-[var(--color-text-strong)] mt-0.5">{current.reducedRate}%</p>
            </div>
            <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Threshold</p>
              <p className="text-xs font-bold text-[var(--color-text-strong)] mt-1 font-mono">
                {current.registrationThreshold > 0 ? `${current.registrationThreshold.toLocaleString()} ${current.currency}` : 'None / 0'}
              </p>
            </div>
            <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Filing Frequency</p>
              <p className="text-xs font-bold text-[var(--color-text-strong)] mt-1">{current.filingFrequency}</p>
            </div>
            <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Corporate Tax</p>
              <p className="text-xs font-bold text-[var(--color-text-strong)] mt-1">{current.corporateTax}</p>
            </div>
            <div className="bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-3">
              <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Currency</p>
              <p className="text-lg font-bold text-[var(--color-text-strong)] mt-0.5">{current.currency}</p>
            </div>
          </div>
        </section>
      )}

      {/* ─── MODAL: CREATE / EDIT TAX CODE ─── */}
      {showCodeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveCode} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  {selectedJurisdiction} Tax Code
                </p>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingCode ? 'Edit Tax Code' : 'Create New Tax Code'}
                </h3>
              </div>
              <button type="button" onClick={() => setShowCodeForm(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Code *</label>
                  <Input
                    required
                    placeholder="e.g. SALES-PK-18"
                    value={codeForm.code}
                    onChange={e => setCodeForm({ ...codeForm, code: e.target.value.toUpperCase() })}
                    className="h-9 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Rate (%) *</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="18.00"
                    value={codeForm.rate}
                    onChange={e => setCodeForm({ ...codeForm, rate: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Name *</label>
                <Input
                  required
                  placeholder="e.g. Pakistan Standard Sales Tax 18%"
                  value={codeForm.name}
                  onChange={e => setCodeForm({ ...codeForm, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <Input
                  placeholder="e.g. Standard rate on taxable supplies of goods (FBR)"
                  value={codeForm.description}
                  onChange={e => setCodeForm({ ...codeForm, description: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tax Type</label>
                  <select
                    value={codeForm.taxType}
                    onChange={e => setCodeForm({ ...codeForm, taxType: e.target.value as any })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Standard">Standard Rated</option>
                    <option value="Reduced">Reduced Rated</option>
                    <option value="ZeroRated">Zero-Rated (0%)</option>
                    <option value="Exempt">Exempt (0%)</option>
                    <option value="Withholding">Withholding Tax (WHT)</option>
                    <option value="ReverseCharge">Reverse Charge (RCM)</option>
                    <option value="ServiceTax">Service Tax (Provincial)</option>
                    <option value="Compound">Compound / Tiered</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Scope</label>
                  <select
                    value={codeForm.scope}
                    onChange={e => setCodeForm({ ...codeForm, scope: e.target.value as any })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Both">Both Sales & Purchases</option>
                    <option value="Sales">Sales Only (Output)</option>
                    <option value="Purchases">Purchases Only (Input)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tax Authority</label>
                  <select
                    value={codeForm.taxAuthorityId}
                    onChange={e => setCodeForm({ ...codeForm, taxAuthorityId: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    {authorities.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.country || 'Global'})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deductibility (%)</label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="100"
                    value={codeForm.deductibilityPercentage}
                    onChange={e => setCodeForm({ ...codeForm, deductibilityPercentage: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCodeForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 text-white font-semibold">
                {saving ? 'Saving...' : editingCode ? 'Update Code' : 'Create Code'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: ADD TAX RATE ─── */}
      {showRateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveRate} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add Rate History</h3>
              <button type="button" onClick={() => setShowRateForm(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Rate Percentage (%) *</label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="20.00"
                  value={rateForm.ratePercent}
                  onChange={e => setRateForm({ ...rateForm, ratePercent: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Effective Date *</label>
                <Input
                  required
                  type="date"
                  value={rateForm.effectiveDate}
                  onChange={e => setRateForm({ ...rateForm, effectiveDate: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowRateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 text-white font-semibold">
                {saving ? 'Saving...' : 'Add Rate'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT AUTHORITY ─── */}
      {showAuthForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveAuth} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingAuth ? 'Edit Tax Authority' : 'Add Tax Authority'}
              </h3>
              <button type="button" onClick={() => setShowAuthForm(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Authority Name *</label>
                  <Input
                    required
                    placeholder="e.g. FBR / HMRC / ZATCA"
                    value={authForm.name}
                    onChange={e => setAuthForm({ ...authForm, name: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Short Code</label>
                  <Input
                    placeholder="e.g. FBR"
                    value={authForm.code}
                    onChange={e => setAuthForm({ ...authForm, code: e.target.value.toUpperCase() })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Country</label>
                  <Input
                    placeholder="e.g. Pakistan"
                    value={authForm.country}
                    onChange={e => setAuthForm({ ...authForm, country: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State / Province</label>
                  <Input
                    placeholder="e.g. Punjab / California"
                    value={authForm.state}
                    onChange={e => setAuthForm({ ...authForm, state: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Registration / TRN Number</label>
                  <Input
                    placeholder="e.g. 1234567-8"
                    value={authForm.registrationNumber}
                    onChange={e => setAuthForm({ ...authForm, registrationNumber: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Filing Frequency</label>
                  <select
                    value={authForm.filingFrequency}
                    onChange={e => setAuthForm({ ...authForm, filingFrequency: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAuthForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 text-white font-semibold">
                {saving ? 'Saving...' : editingAuth ? 'Update Authority' : 'Create Authority'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: REGISTER EXEMPTION CERTIFICATE ─── */}
      {showExemptionForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSaveExemption} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Register Exemption Certificate</h3>
              <button type="button" onClick={() => setShowExemptionForm(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Certificate # *</label>
                  <Input
                    required
                    placeholder="e.g. RESALE-2026-001"
                    value={exemptionForm.certificateNumber}
                    onChange={e => setExemptionForm({ ...exemptionForm, certificateNumber: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Exemption Type</label>
                  <select
                    value={exemptionForm.type}
                    onChange={e => setExemptionForm({ ...exemptionForm, type: e.target.value as any })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Resale">Resale / Wholesale</option>
                    <option value="NonProfit">Non-Profit / 501(c)(3)</option>
                    <option value="Government">Government / Public Body</option>
                    <option value="Diplomatic">Diplomatic</option>
                    <option value="Export">Export Out-of-Country</option>
                    <option value="Manufacturing">Manufacturing / Raw Material</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Counterparty (Customer / Vendor) *</label>
                  <Input
                    required
                    placeholder="e.g. Apex Global Ltd"
                    value={exemptionForm.counterpartyName}
                    onChange={e => setExemptionForm({ ...exemptionForm, counterpartyName: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Tax / NTN / EIN ID</label>
                  <Input
                    placeholder="e.g. GB123456789 / 12-3456789"
                    value={exemptionForm.taxId}
                    onChange={e => setExemptionForm({ ...exemptionForm, taxId: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Valid From *</label>
                  <Input
                    required
                    type="date"
                    value={exemptionForm.validFrom}
                    onChange={e => setExemptionForm({ ...exemptionForm, validFrom: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Valid To (Expiration)</label>
                  <Input
                    type="date"
                    value={exemptionForm.validTo}
                    onChange={e => setExemptionForm({ ...exemptionForm, validTo: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowExemptionForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving} className="bg-indigo-600 text-white font-semibold">
                {saving ? 'Saving...' : 'Register Certificate'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};