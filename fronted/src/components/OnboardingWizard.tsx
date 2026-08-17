import { useState } from 'react'
import { ChevronLeft, ChevronRight, Globe, CheckCircle2, Package, BarChart3, Users, Settings } from 'lucide-react'
import type { UserData } from '../Login'
import { useCompanyStore } from '../stores'
import { setActiveCurrency } from '../lib/currency'

type Step = 'country' | 'modules' | 'currency' | 'confirm'

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan', currency: 'PKR', flag: '🇵🇰' },
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'EU', name: 'Europe (EU)', currency: 'EUR', flag: '🇪🇺' },
]

const ALL_MODULES = [
  { id: 'accounting', name: 'Accounting & Finance', icon: BarChart3, description: 'Chart of accounts, general ledger, journals' },
  { id: 'sales', name: 'Sales & Customers', icon: Users, description: 'Invoices, receipts, customer management' },
  { id: 'purchasing', name: 'Purchasing & Vendors', icon: Package, description: 'Bills, purchase orders, vendor management' },
  { id: 'inventory', name: 'Inventory Management', icon: Package, description: 'Stock tracking, BOM, purchase orders' },
  { id: 'manufacturing', name: 'Manufacturing', icon: Settings, description: 'Work orders, production planning, costing' },
  { id: 'tax', name: 'Tax & Compliance', icon: BarChart3, description: 'Tax calculations, filings, compliance reports' },
  { id: 'payroll', name: 'Payroll', icon: Users, description: 'Salary processing, attendance, benefits' },
  { id: 'banking', name: 'Banking & Reconciliation', icon: BarChart3, description: 'Bank feeds, reconciliation, payments' },
]

export default function OnboardingWizard({ currentUser }: {
  currentUser: UserData
}) {
  const [step, setStep] = useState<Step>('country')
  const [country, setCountry] = useState('PK')
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set(['accounting', 'sales', 'purchasing', 'inventory']))
  const [currency, setCurrency] = useState('PKR')
  const [companyName, setCompanyName] = useState('')
  const [saving, setSaving] = useState(false)
  const saveCompanyStore = useCompanyStore((s) => s.saveCompany)

  const currentCountry = COUNTRIES.find(c => c.code === country)

  const toggleModule = (id: string) => {
    const next = new Set(selectedModules)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedModules(next)
  }

  const handleCountryNext = () => {
    setCurrency(currentCountry?.currency || 'USD')
    setStep('modules')
  }

  const handleModulesNext = () => setStep('currency')
  const handleCurrencyNext = () => setStep('confirm')

  const onComplete = () => {
    window.location.reload()
  }

  const handleFinish = async () => {
    setSaving(true)
    const finalCurrency = (currency || currentCountry?.currency || 'USD').toUpperCase()
    setActiveCurrency(finalCurrency)
    try {
      await saveCompanyStore({
        name: companyName.trim() || `${currentCountry?.name || 'My'} Company`,
        code: (companyName.trim() || currentCountry?.name || 'CMP').slice(0, 4).toUpperCase(),
        country: currentCountry?.name || 'United States',
        currencyCode: finalCurrency,
        functionalCurrency: finalCurrency,
        type: 'Parent',
      })
    } catch (err) {
      console.error('Failed to create company during onboarding:', err)
    }
    localStorage.setItem(`onboarding_complete_${currentUser.email}`, 'true')
    onComplete()
  }

  const progress = { country: 1, modules: 2, currency: 3, confirm: 4 }
  const progressVal = (progress[step] / 4) * 100

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="brand"><b>account</b><span>book</span></div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressVal}%` }} /></div>
          <p className="onboarding-subtitle">Welcome, {currentUser.fullName}. Let's set up your company.</p>
        </div>

        <div className="onboarding-body">
          {step === 'country' && (
            <div className="step">
              <h2><Globe size={24} /> Select Your Country</h2>
              <p className="step-desc">This determines your tax rules and regional settings.</p>
              <div className="country-grid">
                {COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    className={`country-option ${country === c.code ? 'selected' : ''}`}
                    onClick={() => setCountry(c.code)}
                  >
                    <span className="flag">{c.flag}</span>
                    <span className="country-name">{c.name}</span>
                    <span className="country-currency">{c.currency}</span>
                  </button>
                ))}
              </div>
              <div className="step-footer">
                <button className="btn btn-primary" onClick={handleCountryNext}>
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 'modules' && (
            <div className="step">
              <h2><Package size={24} /> Choose Modules</h2>
              <p className="step-desc">Select which modules to activate for your team.</p>
              <div className="modules-grid">
                {ALL_MODULES.map(m => {
                  const Icon = m.icon
                  const selected = selectedModules.has(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`module-option ${selected ? 'selected' : ''}`}
                      onClick={() => toggleModule(m.id)}
                    >
                      <Icon size={24} className={selected ? 'text-blue-600' : 'text-slate-400'} />
                      <span>{m.name}</span>
                      <small>{m.description}</small>
                    </button>
                  )
                })}
              </div>
              <div className="step-footer">
                <button className="btn btn-secondary" onClick={() => setStep('country')}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleModulesNext}
                  disabled={selectedModules.size === 0}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 'currency' && (
            <div className="step">
              <h2><Globe size={24} /> Base Currency</h2>
              <p className="step-desc">Your primary accounting currency will be <strong>{currentCountry?.currency}</strong> (auto-detected from country).</p>
              <div className="currency-input">
                <label>Currency Code</label>
                <input
                  type="text"
                  maxLength={3}
                  value={currency}
                  onChange={e => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
                  className="currency-field"
                />
              </div>
              <div className="company-input">
                <label>Company/Branch Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder={`${currentCountry?.name || 'My'} Branch`}
                  className="company-field"
                />
              </div>
              <div className="step-footer">
                <button className="btn btn-secondary" onClick={() => setStep('modules')}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button className="btn btn-primary" onClick={handleCurrencyNext} disabled={!currency || !companyName}>
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="step">
              <h2><CheckCircle2 size={24} /> Setup Complete</h2>
              <div className="summary">
                <div className="summary-row"><span>Country:</span><strong>{currentCountry?.flag} {currentCountry?.name}</strong></div>
                <div className="summary-row"><span>Currency:</span><strong>{currency}</strong></div>
                <div className="summary-row"><span>Company:</span><strong>{companyName || `${currentCountry?.name} Branch`}</strong></div>
                <div className="summary-row"><span>Modules:</span><strong>{selectedModules.size} active</strong></div>
                <div className="summary-row"><span>Default Chart:</span><strong>Auto-seeded {selectedModules.has('accounting') ? 'with' : 'without'} accounting COA</strong></div>
              </div>
              <p className="step-desc">Your ERP will initialize with this configuration. Welcome aboard!</p>
              <div className="step-footer">
                <button className="btn btn-secondary" onClick={() => setStep('currency')}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button className="btn btn-primary btn-success" onClick={handleFinish} disabled={saving}>
                  {saving ? 'Setting up...' : 'Enter Dashboard'} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
