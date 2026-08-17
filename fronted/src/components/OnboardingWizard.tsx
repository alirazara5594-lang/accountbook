import { useState } from 'react'
import { ChevronRight, Globe } from 'lucide-react'
import type { UserData } from '../Login'
import { setActiveCurrency } from '../lib/currency'

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

export default function OnboardingWizard({ currentUser }: {
  currentUser: UserData
}) {
  const [country, setCountry] = useState('PK')
  const [saving, setSaving] = useState(false)

  const handleContinue = () => {
    setSaving(true)
    const selected = COUNTRIES.find(c => c.code === country)
    if (selected) {
      setActiveCurrency(selected.currency)
      localStorage.setItem('onboarding_country', selected.code)
      localStorage.setItem('onboarding_country_name', selected.name)
    }
    localStorage.setItem(`onboarding_complete_${currentUser.email}`, 'true')
    // Redirect to Administration > Companies for company setup
    window.location.hash = '#Administration.Companies'
    window.location.reload()
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="brand"><b>account</b><span>book</span></div>
          <p className="onboarding-subtitle">Welcome, {currentUser.fullName}. Select your country to configure tax rules.</p>
        </div>

        <div className="onboarding-body">
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
              <button className="btn btn-primary" onClick={handleContinue} disabled={saving}>
                {saving ? 'Setting up...' : 'Continue to Company Setup'} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
