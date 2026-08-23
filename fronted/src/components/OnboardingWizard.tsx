import { useState } from 'react'
import {
  ChevronRight, Globe, Layers, Key, CheckCircle2,
  Briefcase, ShoppingCart, Factory, HardHat
} from 'lucide-react'
import type { UserData } from '../Login'
import { setActiveCurrency } from '../lib/currency'

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', currency: 'PKR', flag: '🇵🇰', tax: 'FBR GST 18%' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸', tax: 'State Sales Tax' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', tax: 'HMRC Standard VAT 20%' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪', tax: 'FTA Standard VAT 5%' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦', tax: 'ZATCA VAT 15%' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦', tax: 'CRA GST/HST 13%' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪', tax: 'EU Standard VAT 19%' },
  { code: 'EU', name: 'European Union', currency: 'EUR', flag: '🇪🇺', tax: 'EU Cross-Border VAT 21%' },
]

const SECTORS = [
  { id: 'Services', title: 'Services & Retainers', desc: 'Hourly billing, service items, timesheets, and consulting retainers.', icon: Briefcase },
  { id: 'Retail', title: 'Retail, E-commerce & Wholesale', desc: 'Physical inventory, multi-warehouse, moving average cost, barcoding.', icon: ShoppingCart },
  { id: 'Manufacturing', title: 'Manufacturing & Production', desc: 'Multi-level BOM, work orders, WIP material conversion, job costing.', icon: Factory },
  { id: 'Projects', title: 'Construction & Projects', desc: 'Project accounting, progress billing, retention receivables, phase budgets.', icon: HardHat },
]

const LICENSE_MODES = [
  {
    id: 'trial',
    title: '90-Day Free Commercial Trial',
    badge: 'Standard 3-Month Trial',
    desc: 'Full access to all modules for 90 days. Ideal for new prospect installations.'
  },
  {
    id: 'beta',
    title: 'Founding Customer / Beta Partner',
    badge: '1-Year Free Access',
    desc: 'Free pilot access in exchange for sector feedback and feature suggestions.'
  },
  {
    id: 'licensed',
    title: 'Commercial Licensed Edition',
    badge: 'Enter Key',
    desc: 'Unlock permanent or annual license using a signed AMS License Key.'
  }
]

export default function OnboardingWizard({ currentUser }: {
  currentUser: UserData
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [licenseMode, setLicenseMode] = useState('trial')
  const [licenseKeyInput, setLicenseKeyInput] = useState('')
  const [country, setCountry] = useState('PK')
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['Services', 'Retail', 'Manufacturing', 'Projects'])
  const [companyName, setCompanyName] = useState('Apex Enterprise')
  const [saving, setSaving] = useState(false)

  const toggleSector = (id: string) => {
    setSelectedSectors(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleFinish = async () => {
    setSaving(true)
    const selectedCountry = COUNTRIES.find(c => c.code === country)
    if (selectedCountry) {
      setActiveCurrency(selectedCountry.currency)
      localStorage.setItem('onboarding_country', selectedCountry.code)
      localStorage.setItem('onboarding_country_name', selectedCountry.name)
    }

    localStorage.setItem('erp_system_sectors', JSON.stringify(selectedSectors))
    localStorage.setItem('onboarding_company_name', companyName.trim() || 'Apex Enterprise')
    localStorage.setItem('onboarding_license_mode', licenseMode)

    if (licenseMode === 'licensed' && licenseKeyInput.trim()) {
      try {
        await fetch('http://localhost:5124/api/v1/license/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ licenseKey: licenseKeyInput.trim() })
        })
      } catch {}
    }

    localStorage.setItem(`onboarding_complete_${currentUser.email}`, 'true')
    window.location.hash = '#Dashboard'
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30 font-black text-lg">
                AMS
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">System Deployment & Setup Wizard</h2>
                <p className="text-xs text-slate-300 mt-0.5">Welcome, {currentUser.fullName}. Configure your ERP deployment.</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/30">
              <span>Step {step} of 3</span>
            </div>
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-200 min-h-[380px]">
          {/* STEP 1: License / Deployment Model */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-teal-600" /> Choose Installation License Mode
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Select how you want to deploy this ERP for this client company.</p>
              </div>

              <div className="space-y-2.5">
                {LICENSE_MODES.map(mode => (
                  <div
                    key={mode.id}
                    onClick={() => setLicenseMode(mode.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      licenseMode === mode.id
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{mode.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                          {mode.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{mode.desc}</p>
                    </div>
                    <input
                      type="radio"
                      checked={licenseMode === mode.id}
                      onChange={() => setLicenseMode(mode.id)}
                      className="accent-teal-600 mt-1 shrink-0 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {licenseMode === 'licensed' && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 animate-in fade-in">
                  <label className="font-bold text-[11px] text-slate-900 dark:text-white">Paste Signed License Key</label>
                  <input
                    type="text"
                    placeholder="AMS-eyJPcmdhbml6YXRpb25OYW1lIj..."
                    value={licenseKeyInput}
                    onChange={e => setLicenseKeyInput(e.target.value)}
                    className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Country, Tax Authority & Base Currency */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-600" /> Select Operating Country & Tax Engine
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Configures global VAT/Sales Tax, statutory payroll brackets, and base currency.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setCountry(c.code)}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      country === c.code
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{c.name}</span>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-bold">{c.currency}</span>
                    <span className="text-[9px] text-slate-400 truncate">{c.tax}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[11px] text-slate-900 dark:text-white">Organization / Legal Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Industrial Corporation"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Business Sector & Services Provided */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" /> Select Business Services & Industry Modules
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Enable the business workflows this company requires (you can activate all or specific ones).</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SECTORS.map(sec => {
                  const Icon = sec.icon
                  const active = selectedSectors.includes(sec.id)
                  return (
                    <div
                      key={sec.id}
                      onClick={() => toggleSector(sec.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                        active
                          ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 opacity-60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{sec.title}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 leading-relaxed">{sec.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={active}
                        readOnly
                        className="accent-teal-600 mt-1 shrink-0"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Launching ERP...' : 'Complete Setup & Open ERP'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
