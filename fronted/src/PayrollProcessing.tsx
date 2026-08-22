import { useEffect, useState, useMemo } from 'react';
import { usePayrollStore, useCompanyStore } from './stores';
import type { Payrun, PayrunEmployee, PayrollCountry, PayFrequency, Employee } from './api/modules/payroll.api';
import {
  Plus, CalendarRange, Scale, Banknote, ShieldCheck,
  Eye, Save, X, RefreshCw, FileText, FileSpreadsheet, ArrowLeft
} from 'lucide-react';
import { money } from './lib/currency';
import { downloadCSV, downloadExcel } from './lib/exportUtils';

const today = () => new Date().toISOString().split('T')[0];

export const COUNTRY_CONFIGS: Record<PayrollCountry, { name: string; currency: string; flag: string; statutoryLabels: { tax: string; social: string; employer: string } }> = {
  US: { name: 'United States', currency: 'USD', flag: '🇺🇸', statutoryLabels: { tax: 'Federal & State Tax (FIT/SIT)', social: 'FICA (SS & Medicare)', employer: 'Employer FICA / FUTA' } },
  UK: { name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', statutoryLabels: { tax: 'HMRC PAYE Tax', social: 'National Insurance (NIC)', employer: 'Employer NIC (13.8%)' } },
  CA: { name: 'Canada', currency: 'CAD', flag: '🇨🇦', statutoryLabels: { tax: 'Federal & Prov Tax (CRA)', social: 'CPP & EI Premiums', employer: 'Employer CPP/EI Match' } },
  PK: { name: 'Pakistan', currency: 'PKR', flag: '🇵🇰', statutoryLabels: { tax: 'FBR Salary Tax u/s 149', social: 'EOBI Employee (1%)', employer: 'EOBI (5%) + SESSI (6%)' } },
  SA: { name: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦', statutoryLabels: { tax: '0% Personal Tax', social: 'GOSI Employee (9.75%)', employer: 'GOSI (11.75%) + EOSB' } },
  AE: { name: 'United Arab Emirates', currency: 'AED', flag: '🇦🇪', statutoryLabels: { tax: '0% Personal Tax', social: 'GPSSA (National Pension)', employer: 'End-of-Service Gratuity (EOSG)' } },
  DE: { name: 'Germany / Europe', currency: 'EUR', flag: '🇩🇪', statutoryLabels: { tax: 'Lohnsteuer & Soli', social: 'RV, KV, PV, AV (Social)', employer: 'Employer Social Match' } },
  FR: { name: 'France / Europe', currency: 'EUR', flag: '🇫🇷', statutoryLabels: { tax: 'IR & Prélèvement', social: 'Sécurité Sociale / CSG', employer: 'Cotisations Patronales' } },
  NL: { name: 'Netherlands / EU', currency: 'EUR', flag: '🇳🇱', statutoryLabels: { tax: 'Loonheffing', social: 'Volksverzekeringen (AOW/Wlz)', employer: 'Werkgeversheffing Zvw' } },
  BE: { name: 'Belgium / EU', currency: 'EUR', flag: '🇧🇪', statutoryLabels: { tax: 'Bedrijfsvoorheffing', social: 'RSZ / ONSS (13.07%)', employer: 'Employer RSZ (25%)' } },
  ES: { name: 'Spain / Europe', currency: 'EUR', flag: '🇪🇸', statutoryLabels: { tax: 'IRPF Withholding', social: 'Seguridad Social (6.35%)', employer: 'Seguridad Social Patronal' } },
  IT: { name: 'Italy / Europe', currency: 'EUR', flag: '🇮🇹', statutoryLabels: { tax: 'IRPEF Withholding', social: 'INPS Contribution', employer: 'INPS Employer Cost' } },
  PL: { name: 'Poland / Europe', currency: 'PLN', flag: '🇵🇱', statutoryLabels: { tax: 'PIT Withholding (12%/32%)', social: 'ZUS (Emerytalne/Rentowe)', employer: 'ZUS Employer Burden' } },
};

// Helper: Calculate itemized additions & deductions per employee based on country rules
export function calculateEmployeePayrollDetails(emp: Employee, frequency: PayFrequency = 'Monthly') {
  const periodsInYear = frequency === 'Weekly' ? 52 : frequency === 'BiWeekly' ? 26 : frequency === 'SemiMonthly' ? 24 : 12;
  const basic = emp.basicSalary || 5000;
  const country = (emp.country || 'US') as PayrollCountry;

  // Additions (Allowances & Benefits)
  let hra = 0;
  let transport = 0;
  let medical = 0;
  let otherAllowances = 0;

  if (country === 'PK') {
    hra = basic * 0.40;
    medical = basic * 0.10;
    transport = basic * 0.05;
  } else if (country === 'SA' || country === 'AE') {
    hra = basic * 0.25;
    transport = basic * 0.10;
    otherAllowances = basic * 0.05;
  } else if (country === 'UK' || country === 'CA' || country === 'US' || country === 'DE') {
    transport = basic * 0.05;
    otherAllowances = basic * 0.05;
  }

  const grossEarnings = basic + hra + transport + medical + otherAllowances;
  const annualizedGross = grossEarnings * periodsInYear;

  // Statutory Deductions
  let incomeTax = 0;
  let socialSecurity = 0;
  let pensionOrOther = 0;
  let employerContrib = 0;

  switch (country) {
    case 'US': {
      const taxRate = annualizedGross > 100000 ? 0.22 : annualizedGross > 45000 ? 0.12 : 0.10;
      incomeTax = (annualizedGross * taxRate) / periodsInYear;
      socialSecurity = (grossEarnings * 0.062);
      pensionOrOther = (grossEarnings * 0.0145);
      employerContrib = socialSecurity + pensionOrOther;
      break;
    }
    case 'UK': {
      const taxable = Math.max(0, annualizedGross - 12570);
      incomeTax = (taxable * 0.20) / periodsInYear;
      socialSecurity = (grossEarnings * 0.08);
      pensionOrOther = (grossEarnings * 0.05);
      employerContrib = (grossEarnings * 0.138) + (grossEarnings * 0.03);
      break;
    }
    case 'CA': {
      const taxable = Math.max(0, annualizedGross - 15000);
      incomeTax = (taxable * 0.20) / periodsInYear;
      socialSecurity = (grossEarnings * 0.0595);
      pensionOrOther = (grossEarnings * 0.0166);
      employerContrib = (socialSecurity * 1.0) + (pensionOrOther * 1.4);
      break;
    }
    case 'PK': {
      if (annualizedGross > 3600000) {
        incomeTax = (435000 + (annualizedGross - 3600000) * 0.35) / periodsInYear;
      } else if (annualizedGross > 2400000) {
        incomeTax = (165000 + (annualizedGross - 2400000) * 0.25) / periodsInYear;
      } else if (annualizedGross > 1200000) {
        incomeTax = (15000 + (annualizedGross - 1200000) * 0.15) / periodsInYear;
      } else if (annualizedGross > 600000) {
        incomeTax = ((annualizedGross - 600000) * 0.05) / periodsInYear;
      }
      socialSecurity = Math.min(grossEarnings * 0.01, 250);
      employerContrib = Math.min(grossEarnings * 0.05, 1250) + (grossEarnings * 0.06);
      break;
    }
    case 'SA': {
      incomeTax = 0;
      socialSecurity = (basic + hra) * 0.0975;
      pensionOrOther = (basic + hra) * 0.0075;
      employerContrib = ((basic + hra) * 0.1175) + (basic * 0.0833);
      break;
    }
    case 'AE': {
      incomeTax = 0;
      socialSecurity = 0;
      employerContrib = basic * 0.0833;
      break;
    }
    default: {
      const taxRate = annualizedGross > 60000 ? 0.30 : 0.20;
      incomeTax = (annualizedGross * taxRate) / periodsInYear;
      socialSecurity = grossEarnings * 0.093;
      pensionOrOther = (grossEarnings * 0.073) + (grossEarnings * 0.022) + (grossEarnings * 0.013);
      employerContrib = socialSecurity + pensionOrOther;
      break;
    }
  }

  const totalDeductions = incomeTax + socialSecurity + pensionOrOther;
  const netPay = Math.max(0, grossEarnings - totalDeductions);
  const totalCostToCompany = grossEarnings + employerContrib;

  return {
    basicSalary: basic,
    additions: {
      hra,
      transport,
      medical,
      otherAllowances,
      totalAdditions: hra + transport + medical + otherAllowances,
    },
    grossEarnings,
    deductions: {
      incomeTax,
      socialSecurity,
      pensionOrOther,
      totalDeductions,
    },
    netPay,
    employerContrib,
    totalCostToCompany,
    currency: emp.currency || COUNTRY_CONFIGS[country]?.currency || 'USD',
    country,
  };
}

export default function PayrollProcessing() {
  const { payruns, employees, fetchPayruns, fetchEmployees, fetchPayrunEmployees, calculatePayrun, postPayrun } = usePayrollStore();
  const { entities: _entities } = useCompanyStore();

  const [statusFilter, setStatusFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState<PayrollCountry | 'All'>('All');
  const [view, setView] = useState<'list' | 'create'>('list');
  const [saving, setSaving] = useState(false);
  const [inspectPayrun, setInspectPayrun] = useState<{ payrun: Payrun | null; employees: PayrunEmployee[] } | null>(null);
  const [selectedEmployeePreview, setSelectedEmployeePreview] = useState<Employee | null>(null);

  const [form, setForm] = useState({
    frequency: 'Monthly' as PayFrequency,
    periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    payDate: today(),
    taxYear: new Date().getFullYear(),
    targetCountry: 'All' as PayrollCountry | 'All',
  });

  useEffect(() => {
    fetchEmployees();
    fetchPayruns();
  }, []);

  const targetProcessingEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchStatus = e.status === 'Active';
      const matchCountry = form.targetCountry === 'All' || e.country === form.targetCountry;
      return matchStatus && matchCountry;
    });
  }, [employees, form.targetCountry]);

  // Aggregate stats across target employees for live calculation matrix
  const calculationSummary = useMemo(() => {
    let grossTotal = 0;
    let basicTotal = 0;
    let additionsTotal = 0;
    let taxTotal = 0;
    let socialTotal = 0;
    let voluntaryTotal = 0;
    let deductionsTotal = 0;
    let netTotal = 0;
    let employerTotal = 0;
    let ctcTotal = 0;

    targetProcessingEmployees.forEach(emp => {
      const calc = calculateEmployeePayrollDetails(emp, form.frequency);
      basicTotal += calc.basicSalary;
      additionsTotal += calc.additions.totalAdditions;
      grossTotal += calc.grossEarnings;
      taxTotal += calc.deductions.incomeTax;
      socialTotal += calc.deductions.socialSecurity;
      voluntaryTotal += calc.deductions.pensionOrOther;
      deductionsTotal += calc.deductions.totalDeductions;
      netTotal += calc.netPay;
      employerTotal += calc.employerContrib;
      ctcTotal += calc.totalCostToCompany;
    });

    return {
      grossTotal, basicTotal, additionsTotal, taxTotal, socialTotal,
      voluntaryTotal, deductionsTotal, netTotal, employerTotal, ctcTotal,
    };
  }, [targetProcessingEmployees, form.frequency]);

  const handleCalculateDraft = async () => {
    setSaving(true);
    try {
      await calculatePayrun({
        frequency: form.frequency,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        payDate: form.payDate,
        taxYear: form.taxYear,
        autoPost: false,
      });
      fetchPayruns();
      setView('list');
    } finally {
      setSaving(false);
    }
  };

  const handlePostGL = async () => {
    setSaving(true);
    try {
      await postPayrun({
        frequency: form.frequency,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        payDate: form.payDate,
        taxYear: form.taxYear,
        autoPost: true,
      });
      fetchPayruns();
      setView('list');
    } finally {
      setSaving(false);
    }
  };

  const handleInspect = async (p: Payrun) => {
    const emps = await fetchPayrunEmployees(p.id);
    setInspectPayrun({ payrun: p, employees: emps });
  };

  // Export master payrun audit sheet
  const handleExportPayrunCSV = () => {
    const headers = ['Employee Code', 'Full Name', 'Country', 'Designation', 'Basic Salary', 'Total Additions', 'Gross Earnings', 'Statutory Tax', 'Social Security', 'Other Deductions', 'Total Deductions', 'Net Take-Home Pay', 'Employer Burden (CTC)'];
    const rows = targetProcessingEmployees.map(emp => {
      const c = calculateEmployeePayrollDetails(emp, form.frequency);
      return [
        emp.employeeNumber,
        `${emp.firstName} ${emp.lastName}`,
        emp.country,
        (emp as any).position || 'Staff',
        c.basicSalary.toFixed(2),
        c.additions.totalAdditions.toFixed(2),
        c.grossEarnings.toFixed(2),
        c.deductions.incomeTax.toFixed(2),
        c.deductions.socialSecurity.toFixed(2),
        c.deductions.pensionOrOther.toFixed(2),
        c.deductions.totalDeductions.toFixed(2),
        c.netPay.toFixed(2),
        c.totalCostToCompany.toFixed(2),
      ];
    });
    downloadCSV(`Payroll_Calculation_Audit_${form.periodStart}_to_${form.periodEnd}`, headers, rows);
  };

  const handleExportPayrunExcel = () => {
    const headers = ['Employee Code', 'Full Name', 'Country', 'Designation', 'Basic Salary', 'Total Additions', 'Gross Earnings', 'Statutory Tax', 'Social Security', 'Other Deductions', 'Total Deductions', 'Net Take-Home Pay', 'Employer Burden (CTC)'];
    const rows = targetProcessingEmployees.map(emp => {
      const c = calculateEmployeePayrollDetails(emp, form.frequency);
      return [
        emp.employeeNumber,
        `${emp.firstName} ${emp.lastName}`,
        emp.country,
        (emp as any).position || 'Staff',
        c.basicSalary.toFixed(2),
        c.additions.totalAdditions.toFixed(2),
        c.grossEarnings.toFixed(2),
        c.deductions.incomeTax.toFixed(2),
        c.deductions.socialSecurity.toFixed(2),
        c.deductions.pensionOrOther.toFixed(2),
        c.deductions.totalDeductions.toFixed(2),
        c.netPay.toFixed(2),
        c.totalCostToCompany.toFixed(2),
      ];
    });
    downloadExcel(`Payroll_Calculation_Audit_${form.periodStart}_to_${form.periodEnd}`, 'Payroll_Register', headers, rows);
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight text-[var(--color-text-strong)] flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 border border-teal-500/20 shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            Global Payroll Processing & Statutory Dissection
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            IAS 19 / IFRS & GAAP aligned multi-country compensation engine for UK, Europe, Canada, USA, UAE, Saudi Arabia, and Pakistan.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          {view === 'create' ? (
            <button
              onClick={() => setView('list')}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Register
            </button>
          ) : (
            <>
              <button
                onClick={() => { fetchPayruns(); fetchEmployees(); }}
                title="Refresh Payroll"
                className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-teal-600" />
              </button>

              <button
                onClick={() => setView('create')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Run New Payroll
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW: CREATE / RUN PAYROLL WIZARD */}
      {view === 'create' ? (
        <div className="space-y-6">
          {/* Step 1: Configuration Toolbar */}
          <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <h2 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-teal-600" /> 1. Payrun Period & Statutory Parameters
              </h2>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200">
                {targetProcessingEmployees.length} Eligible Employees Found
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Jurisdiction / Country</label>
                <select
                  value={form.targetCountry}
                  onChange={e => setForm({ ...form, targetCountry: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
                >
                  <option value="All">🌍 All Global Entities ({employees.length})</option>
                  {Object.entries(COUNTRY_CONFIGS).map(([code, cfg]) => (
                    <option key={code} value={code}>{cfg.flag} {cfg.name} ({cfg.currency})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={e => setForm({ ...form, frequency: e.target.value as PayFrequency })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                >
                  <option value="Monthly">Monthly (12 Periods)</option>
                  <option value="SemiMonthly">Semi-Monthly (24 Periods)</option>
                  <option value="BiWeekly">Bi-Weekly (26 Periods)</option>
                  <option value="Weekly">Weekly (52 Periods)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Period Start</label>
                <input
                  type="date"
                  value={form.periodStart}
                  onChange={e => setForm({ ...form, periodStart: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Period End</label>
                <input
                  type="date"
                  value={form.periodEnd}
                  onChange={e => setForm({ ...form, periodEnd: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Disbursement Pay Date</label>
                <input
                  type="date"
                  value={form.payDate}
                  onChange={e => setForm({ ...form, payDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Live Forensic Calculation Summary KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
              <span className="text-[10.5px] font-semibold text-[var(--color-text-muted)] uppercase">Total Basic Salary</span>
              <div className="text-lg font-black text-[var(--color-text-strong)] font-mono">{money(calculationSummary.basicTotal)}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">Fixed Core Base</div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
              <span className="text-[10.5px] font-semibold text-[var(--color-text-muted)] uppercase">Total Additions (+)</span>
              <div className="text-lg font-black text-emerald-600 font-mono">+{money(calculationSummary.additionsTotal)}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">HRA, Transport, Medical</div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
              <span className="text-[10.5px] font-semibold text-[var(--color-text-muted)] uppercase">Gross Payroll</span>
              <div className="text-lg font-black text-blue-600 font-mono">{money(calculationSummary.grossTotal)}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">Base + Allowances</div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
              <span className="text-[10.5px] font-semibold text-[var(--color-text-muted)] uppercase">Statutory Deductions (-)</span>
              <div className="text-lg font-black text-rose-600 font-mono">-{money(calculationSummary.deductionsTotal)}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">Taxes, GOSI, EOBI, FICA, NIC</div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
              <span className="text-[10.5px] font-semibold text-[var(--color-text-muted)] uppercase">Net Take-Home Pay</span>
              <div className="text-lg font-black text-teal-600 font-mono">{money(calculationSummary.netTotal)}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">To Disburse to Staff</div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
              <span className="text-[10.5px] font-semibold text-[var(--color-text-muted)] uppercase">Total Employer Cost (CTC)</span>
              <div className="text-lg font-black text-purple-600 font-mono">{money(calculationSummary.ctcTotal)}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">Gross + Employer Burden</div>
            </div>
          </div>

          {/* Step 3: Forensic Line-by-Line Calculation Matrix Table */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden space-y-3">
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-teal-600" /> Employee Breakdown: Gross Additions vs Statutory Deductions vs Net Pay
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Live itemization calculated per employee country rules, tax slabs, and benefit structures.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-nowrap">
                <button
                  onClick={handleExportPayrunCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" /> CSV
                </button>
                <button
                  onClick={handleExportPayrunExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 pl-4">Employee</th>
                    <th className="p-3.5">Country & Rules</th>
                    <th className="p-3.5 text-right">Basic Pay</th>
                    <th className="p-3.5 text-right text-emerald-700 dark:text-emerald-300">Allowances (+)</th>
                    <th className="p-3.5 text-right font-bold">Gross Earnings</th>
                    <th className="p-3.5 text-right text-rose-600">Statutory Tax (-)</th>
                    <th className="p-3.5 text-right text-amber-600">Social / Pension (-)</th>
                    <th className="p-3.5 text-right font-bold text-teal-600">Net Take-Home</th>
                    <th className="p-3.5 text-right text-purple-600">Employer CTC</th>
                    <th className="p-3.5 pr-4 text-center">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {targetProcessingEmployees.map(emp => {
                    const c = calculateEmployeePayrollDetails(emp, form.frequency);
                    const cfg = COUNTRY_CONFIGS[c.country] || COUNTRY_CONFIGS.US;

                    return (
                      <tr key={emp.id} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                        <td className="p-3.5 pl-4">
                          <div className="font-bold text-[var(--color-text-strong)]">{emp.firstName} {emp.lastName}</div>
                          <div className="font-mono text-[10.5px] text-[var(--color-text-muted)]">{emp.employeeNumber} · {(emp as any).position || 'Staff'}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 font-bold text-[var(--color-text-strong)]">
                            <span>{cfg.flag}</span>
                            <span>{cfg.name}</span>
                          </div>
                          <div className="text-[10px] text-[var(--color-text-muted)]">{emp.currency || cfg.currency}</div>
                        </td>

                        <td className="p-3.5 text-right font-mono font-semibold text-[var(--color-text-strong)]">
                          {c.currency} {c.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-mono font-semibold text-emerald-600">
                          +{c.currency} {c.additions.totalAdditions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-blue-600">
                          {c.currency} {c.grossEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-mono font-semibold text-rose-600">
                          -{c.currency} {c.deductions.incomeTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-mono font-semibold text-amber-600">
                          -{c.currency} {(c.deductions.socialSecurity + c.deductions.pensionOrOther).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-mono font-black text-teal-600 bg-teal-50/20">
                          {c.currency} {c.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 text-right font-mono font-bold text-purple-600">
                          {c.currency} {c.totalCostToCompany.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-3.5 pr-4 text-center">
                          <button
                            onClick={() => setSelectedEmployeePreview(emp)}
                            className="p-1.5 rounded-lg hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-teal-600 transition-colors"
                            title="Inspect Itemized Breakdown"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {targetProcessingEmployees.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                        No active employees found matching the selected country filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Double-entry GL Journal Entry will automatically post to General Ledger upon execution.</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCalculateDraft}
                  disabled={saving || targetProcessingEmployees.length === 0}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Save Draft Payrun'}
                </button>
                <button
                  type="button"
                  onClick={handlePostGL}
                  disabled={saving || targetProcessingEmployees.length === 0}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Posting to GL...' : 'Calculate & Post to General Ledger'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW: PAYRUN MASTER LIST */
        <div className="space-y-4">
          {/* Filters & Status Toolbar */}
          <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={countryFilter}
                onChange={e => setCountryFilter(e.target.value as any)}
                className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none font-semibold"
              >
                <option value="All">All Countries ({employees.length} Active)</option>
                {Object.entries(COUNTRY_CONFIGS).map(([code, cfg]) => (
                  <option key={code} value={code}>{cfg.flag} {cfg.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none"
              >
                <option value="All">All Statuses ({payruns.length})</option>
                <option value="Draft">Draft</option>
                <option value="Calculated">Calculated</option>
                <option value="Posted">Posted to GL</option>
              </select>
            </div>

            <div className="text-xs text-[var(--color-text-muted)] font-semibold">
              Total Recorded Payruns: <span className="font-bold text-[var(--color-text-strong)]">{payruns.length}</span>
            </div>
          </div>

          {/* Payruns Table */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 pl-5">Payrun Number</th>
                    <th className="p-3.5">Frequency</th>
                    <th className="p-3.5">Pay Period</th>
                    <th className="p-3.5">Disbursement Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {payruns.filter(p => statusFilter === 'All' || p.status === statusFilter).map(p => (
                    <tr key={p.id} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-teal-600">{p.payrunNumber}</td>
                      <td className="p-3.5 font-semibold text-[var(--color-text-strong)]">{p.frequency}</td>
                      <td className="p-3.5 font-mono text-[11px] text-[var(--color-text-muted)]">{p.periodStart} to {p.periodEnd}</td>
                      <td className="p-3.5 font-mono text-[11px] text-[var(--color-text-strong)]">{p.payDate}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold border ${p.status === 'Posted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {p.status === 'Posted' ? '✓ Posted to GL' : p.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => handleInspect(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-xs font-semibold text-teal-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Inspect Payrun
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payruns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                        No payrun batches generated yet. Click <strong>"Run New Payroll"</strong> above to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* INDIVIDUAL EMPLOYEE ITEMIZATION MODAL */}
      {selectedEmployeePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            {(() => {
              const c = calculateEmployeePayrollDetails(selectedEmployeePreview, form.frequency);
              const cfg = COUNTRY_CONFIGS[c.country] || COUNTRY_CONFIGS.US;

              return (
                <div>
                  <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cfg.flag}</span>
                        <h3 className="font-bold text-sm text-[var(--color-text-strong)]">{selectedEmployeePreview.firstName} {selectedEmployeePreview.lastName}</h3>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] font-mono">{selectedEmployeePreview.employeeNumber} · {cfg.name} Statutory Structure</p>
                    </div>
                    <button onClick={() => setSelectedEmployeePreview(null)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
                    {/* Additions */}
                    <div className="space-y-2">
                      <div className="font-bold text-emerald-600 flex items-center justify-between border-b border-emerald-200 pb-1">
                        <span>EARNINGS & ADDITIONS</span>
                        <span>{c.currency} {c.grossEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="space-y-1 text-[11.5px]">
                        <div className="flex justify-between py-0.5">
                          <span className="text-[var(--color-text-muted)]">Basic Monthly Salary:</span>
                          <span className="font-mono font-semibold">{c.currency} {c.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        {c.additions.hra > 0 && (
                          <div className="flex justify-between py-0.5">
                            <span className="text-[var(--color-text-muted)]">House Rent Allowance (HRA):</span>
                            <span className="font-mono font-semibold text-emerald-600">+{c.currency} {c.additions.hra.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {c.additions.transport > 0 && (
                          <div className="flex justify-between py-0.5">
                            <span className="text-[var(--color-text-muted)]">Transport Allowance:</span>
                            <span className="font-mono font-semibold text-emerald-600">+{c.currency} {c.additions.transport.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {c.additions.medical > 0 && (
                          <div className="flex justify-between py-0.5">
                            <span className="text-[var(--color-text-muted)]">Medical Allowance:</span>
                            <span className="font-mono font-semibold text-emerald-600">+{c.currency} {c.additions.medical.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {c.additions.otherAllowances > 0 && (
                          <div className="flex justify-between py-0.5">
                            <span className="text-[var(--color-text-muted)]">Special / Dearness Allowance:</span>
                            <span className="font-mono font-semibold text-emerald-600">+{c.currency} {c.additions.otherAllowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deductions */}
                    <div className="space-y-2">
                      <div className="font-bold text-rose-600 flex items-center justify-between border-b border-rose-200 pb-1">
                        <span>STATUTORY & VOLUNTARY DEDUCTIONS</span>
                        <span>-{c.currency} {c.deductions.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="space-y-1 text-[11.5px]">
                        <div className="flex justify-between py-0.5">
                          <span className="text-[var(--color-text-muted)]">{cfg.statutoryLabels.tax}:</span>
                          <span className="font-mono font-semibold text-rose-600">-{c.currency} {c.deductions.incomeTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between py-0.5">
                          <span className="text-[var(--color-text-muted)]">{cfg.statutoryLabels.social}:</span>
                          <span className="font-mono font-semibold text-amber-600">-{c.currency} {c.deductions.socialSecurity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        {c.deductions.pensionOrOther > 0 && (
                          <div className="flex justify-between py-0.5">
                            <span className="text-[var(--color-text-muted)]">Pension / Voluntary / Insurance:</span>
                            <span className="font-mono font-semibold text-amber-600">-{c.currency} {c.deductions.pensionOrOther.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Net Pay */}
                    <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center justify-between text-teal-800 dark:text-teal-200 font-bold">
                      <span>NET TAKE-HOME DISBURSEMENT:</span>
                      <span className="text-base font-mono">{c.currency} {c.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    {/* Employer Burden */}
                    <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-between text-purple-800 dark:text-purple-200 text-xs">
                      <span>{cfg.statutoryLabels.employer}:</span>
                      <span className="font-mono font-bold">+{c.currency} {c.employerContrib.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] flex justify-end">
                    <button
                      onClick={() => setSelectedEmployeePreview(null)}
                      className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs"
                    >
                      Close Breakdown
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* INSPECT PAYRUN MODAL */}
      {inspectPayrun && inspectPayrun.payrun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--color-text-strong)]">
                  Payrun Batch: {inspectPayrun.payrun.payrunNumber}
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Period: {inspectPayrun.payrun.periodStart} to {inspectPayrun.payrun.periodEnd} · Status: {inspectPayrun.payrun.status}
                </p>
              </div>
              <button onClick={() => setInspectPayrun(null)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs max-h-[65vh] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase text-[10px]">
                    <th className="p-2.5">Employee ID</th>
                    <th className="p-2.5 text-right">Gross Earnings</th>
                    <th className="p-2.5 text-right">Deductions</th>
                    <th className="p-2.5 text-right">Net Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {inspectPayrun.employees.map(pe => (
                    <tr key={pe.id} className="hover:bg-[var(--color-surface-muted)]/40">
                      <td className="p-2.5 font-bold font-mono">{pe.employeeId}</td>
                      <td className="p-2.5 text-right font-mono">{pe.currency} {pe.grossEarnings.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono text-rose-600">-{pe.currency} {pe.totalDeductions.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-teal-600">{pe.currency} {pe.netPay.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] flex justify-end">
              <button onClick={() => setInspectPayrun(null)} className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
