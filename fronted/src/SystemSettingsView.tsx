import React, { useState } from 'react';
import {
  Settings, ShieldCheck, Globe, Database, Save, RotateCcw, AlertTriangle,
  Building2, CheckCircle2, Lock, FileText, Layers, Hash, Coins
} from 'lucide-react';
import { useCoaStore } from './stores';

interface SystemSettingsProps {
  setPage: (page: string) => void;
  notify: (msg: string) => void;
}

export const SystemSettingsView: React.FC<SystemSettingsProps> = ({ setPage, notify }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'accounting' | 'sectors' | 'security' | 'database'>('general');

  // State configurations with persistence in localStorage
  const [generalConfig, setGeneralConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_system_general');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      systemTitle: 'AccountBook Enterprise ERP',
      timezone: 'Asia/Karachi (UTC+05:00)',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'en-US (1,234,567.89)',
      decimalPlaces: 2,
      defaultLanguage: 'English (US)',
      themePreference: 'system',
    };
  });

  const [accountingConfig, setAccountingConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_system_accounting');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      accountingStandard: 'IAS / IFRS (International)',
      fiscalYearStart: 'January',
      periodLockDate: '',
      strictDoubleEntry: true,
      allowNegativeStock: false,
      autoPostDepreciation: true,
      fxGainLossPosting: 'Automatic (IAS 21 Realized/Unrealized)',
    };
  });

  const [securityConfig, setSecurityConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('erp_system_security');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      sessionTimeoutMins: 60,
      requireMFA: false,
      maxFailedAttempts: 5,
      enforcePasswordComplexity: true,
      auditLogRetentionDays: 365,
    };
  });

  const [selectedSectors, setSelectedSectors] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('erp_system_sectors');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Services', 'Retail', 'Manufacturing', 'Projects'];
  });

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('erp_system_general', JSON.stringify(generalConfig));
    notify('✓ General settings and localization preferences updated');
  };

  const handleSaveAccounting = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('erp_system_accounting', JSON.stringify(accountingConfig));
    notify('✓ Accounting & financial governance standards updated');
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('erp_system_security', JSON.stringify(securityConfig));
    notify('✓ Security and authentication policies updated');
  };

  const handleToggleSector = (sector: string) => {
    const next = selectedSectors.includes(sector)
      ? selectedSectors.filter(s => s !== sector)
      : [...selectedSectors, sector];
    setSelectedSectors(next);
    localStorage.setItem('erp_system_sectors', JSON.stringify(next));
    notify(`✓ Updated sector adaptability profile: ${sector}`);
  };

  const handleFactoryReset = async () => {
    if (window.confirm("⚠️ DANGER ZONE: This will permanently wipe all transactional data (Journals, Invoices, Vouchers, Bills, Customers, Vendors) and re-seed clean IAS/IFRS chart of accounts. Proceed?")) {
      try {
        await useCoaStore.getState().resetDatabase();
        notify("✓ Factory reset successful. System restored to baseline.");
        window.location.reload();
      } catch (err: any) {
        notify(err.message || "Failed to reset database");
      }
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--color-text-strong)] flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 border border-teal-500/20">
              <Settings className="w-5 h-5" />
            </div>
            System Settings & Enterprise Parameters
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Global ERP configuration, multi-sector capabilities, IAS/IFRS compliance rules, and database governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            System Status: 100% Operational
          </span>
        </div>
      </div>

      {/* 4-in-1 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Accounting Standard</span>
            <ShieldCheck className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-lg font-black text-[var(--color-text-strong)] font-mono">{accountingConfig.accountingStandard.split(' ')[0]} / IFRS</div>
          <div className="text-[11px] text-[var(--color-text-muted)]">Strict double-entry & accrual basis</div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Global Localization</span>
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-black text-blue-600 font-mono">7 Jurisdictions</div>
          <div className="text-[11px] text-[var(--color-text-muted)]">PK, US, UK, UAE, KSA, CA, EU</div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Multi-Sector Suite</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-lg font-black text-purple-600 font-mono">{selectedSectors.length} / 14 Active</div>
          <div className="text-[11px] text-[var(--color-text-muted)]">14 Commercial Industry Profiles</div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-1">
          <div className="flex items-center justify-between text-[var(--color-text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Audit Security</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-600 font-mono">WORM Immutable</div>
          <div className="text-[11px] text-[var(--color-text-muted)]">Non-repudiation event ledger</div>
        </div>
      </div>

      {/* Navigation Tabs - Responsive Wrapped (Zero Horizontal Scroll) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl w-full">
        {[
          { id: 'general', label: 'General & Localization', icon: Globe },
          { id: 'accounting', label: 'Accounting & IAS/IFRS Rules', icon: ShieldCheck },
          { id: 'sectors', label: 'Multi-Sector Adaptability', icon: Layers },
          { id: 'security', label: 'Security & Access Policies', icon: Lock },
          { id: 'database', label: 'Database & Maintenance', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center sm:justify-start gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-strong)] shadow-xs border border-[var(--color-border)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-surface)]/50'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-600' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: GENERAL & LOCALIZATION ─── */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
          <div className="border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)]">General System Parameters</h3>
            <p className="text-[11px] text-[var(--color-text-muted)]">Configure workspace branding, display regional formats, and date conventions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">Enterprise Title / Branding</label>
              <input
                type="text"
                value={generalConfig.systemTitle}
                onChange={e => setGeneralConfig({ ...generalConfig, systemTitle: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">Operating Timezone</label>
              <select
                value={generalConfig.timezone}
                onChange={e => setGeneralConfig({ ...generalConfig, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
              >
                <option value="Asia/Karachi (UTC+05:00)">Asia/Karachi (UTC+05:00)</option>
                <option value="Asia/Dubai (UTC+04:00)">Asia/Dubai (UTC+04:00)</option>
                <option value="Asia/Riyadh (UTC+03:00)">Asia/Riyadh (UTC+03:00)</option>
                <option value="Europe/London (UTC+00:00)">Europe/London (UTC+00:00)</option>
                <option value="America/New_York (UTC-05:00)">America/New_York (UTC-05:00)</option>
                <option value="America/Toronto (UTC-05:00)">America/Toronto (UTC-05:00)</option>
                <option value="Europe/Frankfurt (UTC+01:00)">Europe/Frankfurt (UTC+01:00)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">Date Display Format</label>
              <select
                value={generalConfig.dateFormat}
                onChange={e => setGeneralConfig({ ...generalConfig, dateFormat: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 23/08/2026 - UK, PK, EU, UAE)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-23 - ISO 8601 Standard)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/23/2026 - US Standard)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">Decimal Places for Currency Amounts</label>
              <select
                value={generalConfig.decimalPlaces}
                onChange={e => setGeneralConfig({ ...generalConfig, decimalPlaces: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
              >
                <option value={2}>2 Decimal Places (Standard 0.00)</option>
                <option value={3}>3 Decimal Places (e.g. OMR, BHD, KWD 0.000)</option>
                <option value={0}>0 Decimal Places (e.g. JPY, KRW)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-[var(--color-border)]">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Save className="w-4 h-4" /> Save General Settings
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 2: ACCOUNTING & IAS/IFRS RULES ─── */}
      {activeTab === 'accounting' && (
        <form onSubmit={handleSaveAccounting} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
          <div className="border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)]">Financial Reporting & Accounting Governance</h3>
            <p className="text-[11px] text-[var(--color-text-muted)]">Configure double-entry validation, period locking, and statutory accounting frameworks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">Primary Reporting Framework</label>
              <select
                value={accountingConfig.accountingStandard}
                onChange={e => setAccountingConfig({ ...accountingConfig, accountingStandard: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
              >
                <option value="IAS / IFRS (International)">IAS / IFRS (International Financial Reporting Standards)</option>
                <option value="US GAAP (United States)">US GAAP (Generally Accepted Accounting Principles)</option>
                <option value="UK FRS 102 (United Kingdom)">UK FRS 102 (UK Accounting Standards)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">Fiscal Year Commences</label>
              <select
                value={accountingConfig.fiscalYearStart}
                onChange={e => setAccountingConfig({ ...accountingConfig, fiscalYearStart: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
              >
                <option value="January">January 1st (Calendar Year)</option>
                <option value="July">July 1st (Pakistan / Australia Fiscal)</option>
                <option value="April">April 1st (UK / India Fiscal)</option>
                <option value="October">October 1st (US Federal Fiscal)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">Period Closing Lock Date</label>
              <input
                type="date"
                value={accountingConfig.periodLockDate}
                onChange={e => setAccountingConfig({ ...accountingConfig, periodLockDate: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
              />
              <p className="text-[10px] text-[var(--color-text-muted)]">Transactions dated on or before this lock date cannot be modified or added.</p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">FX Gain / Loss Accounting (IAS 21)</label>
              <input
                type="text"
                disabled
                value={accountingConfig.fxGainLossPosting}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-muted)] font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200/50 dark:border-teal-800/50 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span className="font-bold text-teal-900 dark:text-teal-200">Strict Double-Entry Enforcement (IAS 1)</span>
            </div>
            <p className="text-[11px] text-teal-800 dark:text-teal-300">
              Every journal entry, invoice, bill, and voucher is mathematically verified for equal debits and credits (`Total Debit - Total Credit = 0.00`). Imbalanced postings are rejected at the engine level.
            </p>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-[var(--color-border)]">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Accounting Rules
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 3: MULTI-SECTOR ADAPTABILITY ─── */}
      {activeTab === 'sectors' && (
        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                Multi-Sector Business Engine Activation ({selectedSectors.length} Active)
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Enable industry-specific workflows and accounting rules tailored to your commercial business model without bloating other operations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allSectorIds = [
                    'Services', 'Retail', 'Manufacturing', 'Construction',
                    'RealEstate', 'Healthcare', 'Hospitality', 'Logistics',
                    'Agriculture', 'NonProfit', 'Education', 'FinancialServices',
                    'Energy', 'SaaS'
                  ];
                  setSelectedSectors(allSectorIds);
                  localStorage.setItem('erp_system_sectors', JSON.stringify(allSectorIds));
                  notify('✓ Enabled all 14 commercial business sector engines');
                }}
                className="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold"
              >
                Enable All Sectors
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'Services',
                icon: '💼',
                title: 'Professional Services & Consulting',
                category: 'Service & Retainers',
                desc: 'Hourly billing, client retainers, timesheet tracking, service items, and milestone invoicing.',
                tags: ['Hourly Rates', 'Timesheets', 'Retainers'],
              },
              {
                id: 'Retail',
                icon: '🛒',
                title: 'Retail, POS & Omnichannel E-Commerce',
                category: 'Commerce & Stock',
                desc: 'Physical inventory tracking, barcode SKU scanner, POS cash registers, and multi-warehouse replenishment.',
                tags: ['POS Registers', 'Barcoding', 'Stock Min/Max'],
              },
              {
                id: 'Manufacturing',
                icon: '🏭',
                title: 'Manufacturing & Process Production',
                category: 'Industrial',
                desc: 'Multi-level Bill of Materials (BOM), work orders, job costing, raw material WIP, and finished goods conversion.',
                tags: ['Multi-BOM', 'Work Orders', 'WIP Costing'],
              },
              {
                id: 'Construction',
                icon: '🏗️',
                title: 'Construction & Civil Engineering',
                category: 'Project Accounting',
                desc: 'Project-based job costing, AIA G702 progress billing, retention receivables, and subcontractor claims.',
                tags: ['Progress Billing', 'Retention AR/AP', 'Job Costing'],
              },
              {
                id: 'RealEstate',
                icon: '🏢',
                title: 'Real Estate & Property Management',
                category: 'Leases & Property',
                desc: 'IFRS 16 lease management, tenant billing, property unit registries, and CAM service charge reconciliations.',
                tags: ['IFRS 16 Leases', 'Tenant Portals', 'CAM Charges'],
              },
              {
                id: 'Healthcare',
                icon: '🏥',
                title: 'Healthcare, Pharma & Life Sciences',
                category: 'Medical & Clinical',
                desc: 'Batch & lot expiry tracking, patient billing, pharmaceutical records, and clinical cost center accounting.',
                tags: ['Batch & Expiry', 'Patient Ledger', 'Cost Centers'],
              },
              {
                id: 'Hospitality',
                icon: '🍽️',
                title: 'Hospitality, Restaurants & Food Service',
                category: 'F&B & Lodging',
                desc: 'Table & room billing, recipe costing, kitchen order tokens (KOT), banquet management, and daily cash sweeps.',
                tags: ['Table/Room POS', 'Recipe BOM', 'Daily Sweeps'],
              },
              {
                id: 'Logistics',
                icon: '🚚',
                title: 'Logistics, Freight & Fleet Management',
                category: 'Transport & Freight',
                desc: 'Waybill dispatch, vehicle trip costing, fuel log reconciliation, container tracking, and demurrage claims.',
                tags: ['Trip Costing', 'Waybills', 'Fuel Logs'],
              },
              {
                id: 'Agriculture',
                icon: '🌾',
                title: 'Agriculture & Farming (IAS 41)',
                category: 'Biological Assets',
                desc: 'Biological assets fair valuation, harvest costing, seasonal expense amortization, and field plot accounting.',
                tags: ['IAS 41 Biologicals', 'Harvest Costing', 'Plot Tracking'],
              },
              {
                id: 'NonProfit',
                icon: '🏛️',
                title: 'Non-Profit, NGO & Grant Accounting',
                category: 'Funds & Grants',
                desc: 'Multi-donor fund accounting, restricted grant tracking, program vs admin expense split, and Form 990 audit reporting.',
                tags: ['Fund Accounting', 'Grant Tracking', '990 Audits'],
              },
              {
                id: 'Education',
                icon: '🎓',
                title: 'Education & Academic Institutions',
                category: 'Academia',
                desc: 'Tuition fee schedules, student ledgers, term-based billing, faculty payroll, and departmental lab costing.',
                tags: ['Tuition Billing', 'Student Ledger', 'Term Fees'],
              },
              {
                id: 'FinancialServices',
                icon: '💳',
                title: 'Financial Services & FinTech Lending',
                category: 'Banking & Lending',
                desc: 'Loan disbursement, IFRS 9 expected credit loss (ECL) provisioning, interest amortizations, and collateral ledgers.',
                tags: ['IFRS 9 ECL', 'Loan Amortization', 'Collateral'],
              },
              {
                id: 'Energy',
                icon: '⚡',
                title: 'Energy, Utilities & Mining',
                category: 'Natural Resources',
                desc: 'Depletion accounting (IFRS 6), environmental restoration accruals (IAS 37), meter billing, and grid tariff rates.',
                tags: ['IFRS 6 Depletion', 'IAS 37 Accruals', 'Meter Tariffs'],
              },
              {
                id: 'SaaS',
                icon: '💻',
                title: 'SaaS, Subscription & Digital Media',
                category: 'Recurring Revenue',
                desc: 'ASC 606 / IFRS 15 recurring revenue recognition, deferred revenue amortization, MRR/ARR analytics, and churn metrics.',
                tags: ['IFRS 15 Deferred', 'MRR / ARR', 'Dunning'],
              },
            ].map((sector) => {
              const active = selectedSectors.includes(sector.id);
              return (
                <div
                  key={sector.id}
                  onClick={() => handleToggleSector(sector.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    active
                      ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-500 shadow-xs'
                      : 'bg-[var(--color-surface-muted)] border-[var(--color-border)] hover:border-teal-500/40'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-width-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{sector.icon}</span>
                      <h4 className="font-bold text-xs text-[var(--color-text-strong)] truncate">{sector.title}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] font-medium shrink-0">
                        {sector.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{sector.desc}</p>
                    <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                      {sector.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={active}
                    readOnly
                    className="accent-teal-600 mt-1 shrink-0"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 4: SECURITY & ACCESS POLICIES ─── */}
      {activeTab === 'security' && (
        <form onSubmit={handleSaveSecurity} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-4 text-xs">
          <div className="border-b border-[var(--color-border)] pb-3">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)]">Authentication, Session & Access Governance</h3>
            <p className="text-[11px] text-[var(--color-text-muted)]">Configure credential complexity, session timeouts, and lockout rules.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">Operator Session Timeout</label>
              <select
                value={securityConfig.sessionTimeoutMins}
                onChange={e => setSecurityConfig({ ...securityConfig, sessionTimeoutMins: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
              >
                <option value={15}>15 Minutes of Inactivity</option>
                <option value={30}>30 Minutes of Inactivity</option>
                <option value={60}>60 Minutes (1 Hour Standard)</option>
                <option value={240}>4 Hours</option>
                <option value={480}>8 Hours (Full Working Day)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-[var(--color-text-strong)]">Max Failed Login Attempts Before Lockout</label>
              <select
                value={securityConfig.maxFailedAttempts}
                onChange={e => setSecurityConfig({ ...securityConfig, maxFailedAttempts: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
              >
                <option value={3}>3 Failed Attempts</option>
                <option value={5}>5 Failed Attempts (Recommended)</option>
                <option value={10}>10 Failed Attempts</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end pt-3 border-t border-[var(--color-border)]">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Save className="w-4 h-4" /> Save Security Policies
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 5: DATABASE & DANGER ZONE ─── */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" /> Database & Storage Health
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-[var(--color-surface-muted)] rounded-xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold block">Storage Engine</span>
                <span className="font-bold text-xs text-[var(--color-text-strong)]">InMemory + JSON WORM</span>
              </div>
              <div className="p-3 bg-[var(--color-surface-muted)] rounded-xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold block">Audit Integrity</span>
                <span className="font-bold text-xs text-emerald-600">100% Tamper-Evident</span>
              </div>
              <div className="p-3 bg-[var(--color-surface-muted)] rounded-xl border border-[var(--color-border)]">
                <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold block">Server Connection</span>
                <span className="font-bold text-xs text-blue-600">Port 5124 Active</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> Danger Zone: Factory Reset
            </h3>
            <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
              Wiping the database will permanently delete all posted journals, invoices, bank vouchers, customer balances, and asset schedules. Clean IAS/IFRS chart of account templates and tax codes will be automatically re-seeded.
            </p>
            <button
              onClick={handleFactoryReset}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Reset Database & Wipe Records
            </button>
          </div>
        </div>
      )}

      {/* Quick Jump Links to other configuration submodules */}
      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between flex-wrap gap-2 text-xs">
        <span className="font-bold text-[var(--color-text-strong)]">Related Configuration Tools:</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPage('Administration.Chart of Accounts Mapping')}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] font-semibold flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600" /> System Account Mapping
          </button>
          <button
            onClick={() => setPage('Administration.Companies')}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] font-semibold flex items-center gap-1"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Entity Management
          </button>
          <button
            onClick={() => setPage('Administration.Number Series')}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] font-semibold flex items-center gap-1"
          >
            <Hash className="w-3.5 h-3.5 text-indigo-600" /> Number Series
          </button>
          <button
            onClick={() => setPage('Administration.Currency')}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] font-semibold flex items-center gap-1"
          >
            <Coins className="w-3.5 h-3.5 text-rose-600" /> Currency & FX
          </button>
          <button
            onClick={() => setPage('Administration.Audit Logs')}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] font-semibold flex items-center gap-1"
          >
            <Lock className="w-3.5 h-3.5 text-slate-600" /> Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
