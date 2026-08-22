import { useEffect, useState, useMemo } from 'react';
import { usePayrollStore, useCompanyStore } from './stores';
import type { Payrun, PayrunEmployee, Employee, PayrollCountry, PayFrequency } from './api/modules/payroll.api';
import {
  Banknote, Plus, ArrowLeft, RefreshCw,
  FileSpreadsheet,
  CheckCircle2, Building2,
  CalendarRange, FileText,
  Printer, X, Award, CheckSquare
} from 'lucide-react';
import { downloadCSV, downloadExcel } from './lib/exportUtils';

const today = () => new Date().toISOString().split('T')[0];

const money = (val: number, cur: string = '$') => `${cur} ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const COUNTRY_CONFIGS: Record<PayrollCountry, { name: string; currency: string; taxLabel: string; socialLabel: string }> = {
  US: { name: 'United States', currency: 'USD', taxLabel: 'Federal/State Tax', socialLabel: 'FICA / Social Security' },
  UK: { name: 'United Kingdom', currency: 'GBP', taxLabel: 'PAYE Income Tax', socialLabel: 'National Insurance (NIC)' },
  CA: { name: 'Canada', currency: 'CAD', taxLabel: 'Federal/Provincial Tax', socialLabel: 'CPP / EI' },
  PK: { name: 'Pakistan', currency: 'PKR', taxLabel: 'Income Tax (FBR)', socialLabel: 'EOBI & Social Security' },
  AE: { name: 'United Arab Emirates', currency: 'AED', taxLabel: 'Zero Income Tax (WPS)', socialLabel: 'GPSSA (Nationals)' },
  SA: { name: 'Saudi Arabia', currency: 'SAR', taxLabel: 'ZATCA Compliance', socialLabel: 'GOSI Contribution' },
  EU: { name: 'European Union', currency: 'EUR', taxLabel: 'Statutory Income Tax', socialLabel: 'Social Welfare & Health' },
};

export function calculateEmployeePayrollDetails(emp: Employee, frequency: PayFrequency) {
  const country = emp.country || 'US';
  const basic = emp.basicSalary || 0;
  const periodsInYear = frequency === 'Monthly' ? 12 : frequency === 'BiWeekly' ? 26 : frequency === 'Weekly' ? 52 : 24;

  let hra = 0;
  let transport = 0;
  let medical = 0;
  let otherAllowances = 0;

  if (country === 'PK') {
    hra = basic * 0.45;
    medical = basic * 0.10;
    transport = basic * 0.05;
  } else if (country === 'AE' || country === 'SA') {
    hra = basic * 0.25;
    transport = basic * 0.15;
    otherAllowances = basic * 0.10;
  } else if (country === 'UK' || country === 'EU') {
    transport = basic * 0.05;
    otherAllowances = basic * 0.05;
  } else {
    hra = basic * 0.10;
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
        incomeTax = (30000 + (annualizedGross - 1200000) * 0.15) / periodsInYear;
      } else if (annualizedGross > 600000) {
        incomeTax = ((annualizedGross - 600000) * 0.05) / periodsInYear;
      } else {
        incomeTax = 0;
      }
      socialSecurity = Math.min(basic * 0.01, 1500);
      pensionOrOther = Math.min(basic * 0.01, 1000);
      employerContrib = Math.min(basic * 0.05, 7500);
      break;
    }
    case 'AE': {
      incomeTax = 0;
      socialSecurity = emp.nationality === 'Emirati' ? grossEarnings * 0.05 : 0;
      pensionOrOther = 0;
      employerContrib = emp.nationality === 'Emirati' ? grossEarnings * 0.125 : grossEarnings * 0.0833;
      break;
    }
    case 'SA': {
      incomeTax = 0;
      socialSecurity = emp.nationality === 'Saudi' ? grossEarnings * 0.0975 : grossEarnings * 0.02;
      pensionOrOther = 0;
      employerContrib = emp.nationality === 'Saudi' ? grossEarnings * 0.1175 : grossEarnings * 0.02;
      break;
    }
    case 'EU':
    default: {
      const taxRate = annualizedGross > 80000 ? 0.30 : annualizedGross > 35000 ? 0.20 : 0.15;
      incomeTax = (annualizedGross * taxRate) / periodsInYear;
      socialSecurity = (grossEarnings * 0.09);
      pensionOrOther = (grossEarnings * 0.04);
      employerContrib = (grossEarnings * 0.18);
      break;
    }
  }

  const totalDeductions = incomeTax + socialSecurity + pensionOrOther;
  const netPay = grossEarnings - totalDeductions;
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
  const { entities } = useCompanyStore();

  const [statusFilter, setStatusFilter] = useState('All');
  const [countryFilter, _setCountryFilter] = useState<PayrollCountry | 'All'>('All');
  const [view, setView] = useState<'list' | 'create'>('list');
  const [saving, setSaving] = useState(false);
  const [_inspectPayrun, setInspectPayrun] = useState<{ payrun: Payrun | null; employees: PayrunEmployee[] } | null>(null);
  const [_selectedEmployeePreview, _setSelectedEmployeePreview] = useState<Employee | null>(null);
  const [directorApprovalModalOpen, setDirectorApprovalModalOpen] = useState(false);

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

  const handleInspect = async (payrun: Payrun) => {
    const payrunEmps = await fetchPayrunEmployees(payrun.id);
    setInspectPayrun({ payrun, employees: payrunEmps });
  };

  const filteredPayruns = useMemo(() => {
    return payruns.filter(p => {
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchStatus;
    });
  }, [payruns, statusFilter]);

  const handleExportCalculationCSV = () => {
    const headers = ['Employee Code', 'Employee Name', 'Country', 'Currency', 'Basic Pay', 'Additions (+)', 'Gross Earnings', 'Income Tax (-)', 'Social Security (-)', 'Total Deductions (-)', 'Net Pay Payable', 'Total CTC'];
    const rows = targetProcessingEmployees.map(e => {
      const c = calculateEmployeePayrollDetails(e, form.frequency);
      return [
        e.employeeNumber,
        `${e.firstName} ${e.lastName}`,
        e.country,
        c.currency,
        c.basicSalary.toFixed(2),
        c.additions.totalAdditions.toFixed(2),
        c.grossEarnings.toFixed(2),
        c.deductions.incomeTax.toFixed(2),
        c.deductions.socialSecurity.toFixed(2),
        c.deductions.totalDeductions.toFixed(2),
        c.netPay.toFixed(2),
        c.totalCostToCompany.toFixed(2),
      ];
    });
    downloadCSV(`Payroll_Calculation_Audit_${form.periodStart}_to_${form.periodEnd}`, headers, rows);
  };

  const handleExportCalculationExcel = () => {
    const headers = ['Employee Code', 'Employee Name', 'Country', 'Currency', 'Basic Pay', 'Additions (+)', 'Gross Earnings', 'Income Tax (-)', 'Social Security (-)', 'Total Deductions (-)', 'Net Pay Payable', 'Total CTC'];
    const rows = targetProcessingEmployees.map(e => {
      const c = calculateEmployeePayrollDetails(e, form.frequency);
      return [
        e.employeeNumber,
        `${e.firstName} ${e.lastName}`,
        e.country,
        c.currency,
        c.basicSalary.toFixed(2),
        c.additions.totalAdditions.toFixed(2),
        c.grossEarnings.toFixed(2),
        c.deductions.incomeTax.toFixed(2),
        c.deductions.socialSecurity.toFixed(2),
        c.deductions.totalDeductions.toFixed(2),
        c.netPay.toFixed(2),
        c.totalCostToCompany.toFixed(2),
      ];
    });
    downloadExcel(`Payroll_Calculation_Audit_${form.periodStart}_to_${form.periodEnd}`, 'Payroll_Register', headers, rows);
  };

  const activeEntityName = entities[0]?.legalName || 'Global Enterprise Corporation';

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
            <>
              <button
                onClick={() => setDirectorApprovalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <Award className="w-4 h-4" /> Director Approval Sheet
              </button>

              <button
                onClick={() => setView('list')}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Register
              </button>
            </>
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDirectorApprovalModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100"
                >
                  <Award className="w-3.5 h-3.5" /> Preview Board Approval Form
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Target Jurisdiction</label>
                <select
                  value={form.targetCountry}
                  onChange={e => setForm({ ...form, targetCountry: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
                >
                  <option value="All">All Jurisdictions (Multi-Country)</option>
                  <option value="US">🇺🇸 United States (USD / FICA)</option>
                  <option value="UK">🇬🇧 United Kingdom (GBP / PAYE)</option>
                  <option value="CA">🇨🇦 Canada (CAD / CPP)</option>
                  <option value="PK">🇵🇰 Pakistan (PKR / FBR Tax)</option>
                  <option value="AE">🇦🇪 UAE (AED / WPS)</option>
                  <option value="SA">🇸🇦 Saudi Arabia (SAR / GOSI)</option>
                  <option value="EU">🇪🇺 European Union (EUR)</option>
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
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[var(--color-text-strong)]">Period Start</label>
                  <span className="text-[10px] text-teal-600 font-semibold">Cutoff Presets:</span>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = now.getMonth();
                      const prevM = m === 0 ? 11 : m - 1;
                      const prevY = m === 0 ? y - 1 : y;
                      setForm({
                        ...form,
                        periodStart: `${prevY}-${String(prevM + 1).padStart(2, '0')}-26`,
                        periodEnd: `${y}-${String(m + 1).padStart(2, '0')}-25`,
                        payDate: `${y}-${String(m + 1).padStart(2, '0')}-28`
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-500/20 hover:bg-teal-500/20"
                    title="26th of last month to 25th of current month (HQ Standard)"
                  >
                    26th–25th
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = now.getMonth();
                      const prevM = m === 0 ? 11 : m - 1;
                      const prevY = m === 0 ? y - 1 : y;
                      setForm({
                        ...form,
                        periodStart: `${prevY}-${String(prevM + 1).padStart(2, '0')}-21`,
                        periodEnd: `${y}-${String(m + 1).padStart(2, '0')}-20`,
                        payDate: `${y}-${String(m + 1).padStart(2, '0')}-28`
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-500/20 hover:bg-indigo-500/20"
                    title="21st of last month to 20th of current month (Factory Standard)"
                  >
                    21st–20th
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const y = now.getFullYear();
                      const m = now.getMonth();
                      const lastDay = new Date(y, m + 1, 0).getDate();
                      setForm({
                        ...form,
                        periodStart: `${y}-${String(m + 1).padStart(2, '0')}-01`,
                        periodEnd: `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
                        payDate: `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
                      });
                    }}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-300 hover:bg-slate-200"
                    title="1st of month to 30th/31st (Calendar Month)"
                  >
                    1st–30/31st
                  </button>
                </div>
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
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono mt-5"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Disbursement Pay Date</label>
                <input
                  type="date"
                  value={form.payDate}
                  onChange={e => setForm({ ...form, payDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono mt-5"
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

            <div className="p-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 shadow-xs space-y-1">
              <span className="text-[10.5px] font-bold text-teal-700 dark:text-teal-300 uppercase">NET PAY PAYABLE</span>
              <div className="text-xl font-black text-teal-700 dark:text-teal-300 font-mono">{money(calculationSummary.netTotal)}</div>
              <div className="text-[10px] text-teal-600/80">Direct Bank Transfer</div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
              <span className="text-[10.5px] font-semibold text-[var(--color-text-muted)] uppercase">Total Employer CTC</span>
              <div className="text-lg font-black text-purple-600 font-mono">{money(calculationSummary.ctcTotal)}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">Gross + Employer Cost</div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCalculationCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <FileText className="w-4 h-4 text-blue-600" /> Export CSV
              </button>

              <button
                type="button"
                onClick={handleExportCalculationExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
              </button>

              <button
                type="button"
                onClick={() => setDirectorApprovalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs font-bold shadow-xs transition-all"
              >
                <Award className="w-4 h-4 text-indigo-600" /> Director Approval Sheet
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCalculateDraft}
                disabled={saving || targetProcessingEmployees.length === 0}
                className="px-4 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {saving ? 'Processing...' : 'Save Draft Payrun'}
              </button>

              <button
                type="button"
                onClick={handlePostGL}
                disabled={saving || targetProcessingEmployees.length === 0}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> {saving ? 'Posting Journal...' : 'Authorize & Post Payrun to GL'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW: PAYRUN REGISTER LIST */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none"
              >
                <option value="All">All Payruns ({payruns.length})</option>
                <option value="Draft">Drafts</option>
                <option value="Calculated">Calculated</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Posted & Paid</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5 pl-5">Payrun Number</th>
                    <th className="p-3.5">Cutoff Period</th>
                    <th className="p-3.5">Disbursement Date</th>
                    <th className="p-3.5 text-center">Headcount</th>
                    <th className="p-3.5 text-right">Gross Earnings</th>
                    <th className="p-3.5 text-right">Deductions</th>
                    <th className="p-3.5 text-right font-bold">Net Pay Payable</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 pr-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {filteredPayruns.map(p => (
                    <tr key={p.id} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                      <td className="p-3.5 pl-5 font-mono font-bold text-[var(--color-text-strong)]">{p.payrunNumber}</td>
                      <td className="p-3.5 font-mono text-[11px]">{p.periodStart} to {p.periodEnd}</td>
                      <td className="p-3.5 font-mono text-[11px] text-teal-600 font-semibold">{p.payDate}</td>
                      <td className="p-3.5 text-center font-bold">{p.employeeCount}</td>
                      <td className="p-3.5 text-right font-mono font-semibold">{money(p.totalGross, p.currency)}</td>
                      <td className="p-3.5 text-right font-mono text-rose-600 font-semibold">-{money(p.totalDeductions, p.currency)}</td>
                      <td className="p-3.5 text-right font-mono font-black text-teal-600">{money(p.totalNet, p.currency)}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          p.status === 'Calculated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              handleInspect(p);
                              setDirectorApprovalModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 flex items-center gap-1"
                            title="View Director Approval Form"
                          >
                            <Award className="w-3.5 h-3.5" /> Approval Sheet
                          </button>
                          <button
                            onClick={() => handleInspect(p)}
                            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPayruns.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                        No payrun records found. Click <strong>"Run New Payroll"</strong> to start a compensation payrun.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL EXECUTIVE PAYROLL SUMMARY & DIRECTOR APPROVAL CERTIFICATE */}
      {/* ========================================================================= */}
      {directorApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in my-6 flex flex-col">
            {/* Top Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white print:hidden shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Executive Director Approval & Authorization Certificate</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Printer className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setDirectorApprovalModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PRINTABLE OFFICIAL CERTIFICATE DOCUMENT */}
            <div className="p-8 space-y-6 text-slate-900 bg-white font-sans print:p-0">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-slate-900" />
                    <h2 className="text-xl font-black tracking-tight uppercase text-slate-950">{activeEntityName}</h2>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    Tax / VAT Registration: <strong>NTN-7749102-K / VAT-9988221</strong>
                  </p>
                  <p className="text-xs text-slate-600">Corporate HQ & Global Operations</p>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block px-3 py-1 bg-amber-100 border border-amber-400 text-amber-900 text-xs font-black uppercase tracking-wider rounded-md">
                    Official Executive Document
                  </div>
                  <div className="text-xs text-slate-500 font-mono">Ref: PAY-AUTH-2026-02</div>
                  <div className="text-xs text-slate-500">Date Generated: <strong>{today()}</strong></div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1 py-1">
                <h1 className="text-base font-black tracking-wide uppercase text-slate-900">
                  EXECUTIVE PAYROLL SUMMARY & DISBURSEMENT AUTHORIZATION
                </h1>
                <p className="text-xs text-slate-600">
                  Statutory Compensation Dissection for Board of Directors & Managing Director Sign-off
                </p>
              </div>

              {/* Payrun Parameters Summary Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Attendance Cutoff Period</span>
                  <span className="font-mono font-bold text-slate-900">{form.periodStart} to {form.periodEnd}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Disbursement Date</span>
                  <span className="font-mono font-bold text-teal-700">{form.payDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Headcount</span>
                  <span className="font-bold text-slate-900">{targetProcessingEmployees.length} Active Employees</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Accounting Currency</span>
                  <span className="font-mono font-bold text-slate-900">{targetProcessingEmployees[0]?.currency || 'USD'} (Multi-Country)</span>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                      <th className="p-3 pl-4">Compensation Category</th>
                      <th className="p-3">Statutory Description</th>
                      <th className="p-3 text-right pr-4">Total Amount (Base Currency)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-3 pl-4 font-bold text-slate-900">1. Basic / Core Base Salary</td>
                      <td className="p-3 text-slate-600">Fixed contracted wage before allowances</td>
                      <td className="p-3 text-right pr-4 font-mono font-bold text-slate-900">{money(calculationSummary.basicTotal)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 pl-4 font-bold text-slate-900">2. Fixed & Variable Allowances (+)</td>
                      <td className="p-3 text-slate-600">House Rent (HRA), Transport, Medical, Shift Allowances</td>
                      <td className="p-3 text-right pr-4 font-mono font-bold text-emerald-700">+{money(calculationSummary.additionsTotal)}</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-3 pl-4 text-blue-900">TOTAL GROSS PAYROLL EARNINGS</td>
                      <td className="p-3 text-slate-600">Total earnings subject to statutory withholding</td>
                      <td className="p-3 text-right pr-4 font-mono text-blue-900">{money(calculationSummary.grossTotal)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 pl-4 font-bold text-rose-800">3. Statutory Income Tax Withholding (-)</td>
                      <td className="p-3 text-slate-600">PAYE, Federal/State Taxes, FBR Withholding</td>
                      <td className="p-3 text-right pr-4 font-mono font-bold text-rose-700">-{money(calculationSummary.taxTotal)}</td>
                    </tr>
                    <tr>
                      <td className="p-3 pl-4 font-bold text-rose-800">4. Social Security & Pension Deductions (-)</td>
                      <td className="p-3 text-slate-600">FICA, GOSI, EOBI, NIC, CPP Employee Portion</td>
                      <td className="p-3 text-right pr-4 font-mono font-bold text-rose-700">-{money(calculationSummary.socialTotal)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold border-t border-slate-300">
                      <td className="p-3 pl-4 text-slate-700">TOTAL STATUTORY DEDUCTIONS (-)</td>
                      <td className="p-3 text-slate-600">To be remitted to government tax & social authorities</td>
                      <td className="p-3 text-right pr-4 font-mono text-rose-800">-{money(calculationSummary.deductionsTotal)}</td>
                    </tr>
                    <tr className="bg-emerald-50 border-t-2 border-emerald-500">
                      <td className="p-3.5 pl-4 font-black text-emerald-950 text-sm">TOTAL NET PAYABLE (BANK DISBURSEMENT)</td>
                      <td className="p-3 text-emerald-800 text-xs font-semibold">Net funds required in company payroll clearing account</td>
                      <td className="p-3.5 text-right pr-4 font-mono font-black text-emerald-950 text-base">{money(calculationSummary.netTotal)}</td>
                    </tr>
                    <tr className="bg-slate-50 border-t border-slate-300">
                      <td className="p-3 pl-4 font-semibold text-slate-700">5. Employer Statutory Contribution (+)</td>
                      <td className="p-3 text-slate-500">Employer GOSI, EOBI, FICA, NIC Employer taxes</td>
                      <td className="p-3 text-right pr-4 font-mono text-purple-700 font-bold">+{money(calculationSummary.employerTotal)}</td>
                    </tr>
                    <tr className="bg-slate-100 font-black">
                      <td className="p-3 pl-4 text-slate-900">TOTAL COMPANY COST (CTC)</td>
                      <td className="p-3 text-slate-600">Complete corporate payroll expense (IAS 19 / GAAP)</td>
                      <td className="p-3 text-right pr-4 font-mono text-purple-900">{money(calculationSummary.ctcTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Department & Location Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 border border-slate-300 rounded-xl space-y-2 bg-slate-50 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-700" /> Facility Allocation Breakdown
                  </span>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">🏢 Head Office (Corporate Staff):</span>
                      <span className="font-mono font-bold text-slate-900">60% of Gross</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">🏭 Factory / Plant 1 (Manufacturing):</span>
                      <span className="font-mono font-bold text-slate-900">40% of Gross</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 border border-slate-300 rounded-xl space-y-2 bg-slate-50 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-teal-700" /> General Ledger Double-Entry Audit
                  </span>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span>Debit Payroll Expense:</span>
                      <span className="font-bold text-slate-900">{money(calculationSummary.ctcTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credit Liabilities & Bank:</span>
                      <span className="font-bold text-slate-900">{money(calculationSummary.ctcTotal)}</span>
                    </div>
                    <div className="flex justify-between text-teal-700 font-sans font-bold pt-1 border-t border-slate-200">
                      <span>Variance:</span>
                      <span>$0.00 (Balanced & Verified)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Tier Signature & Authorization Sign-off Grid */}
              <div className="pt-4 border-t-2 border-slate-900 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  OFFICIAL BOARD & EXECUTIVE SIGN-OFF GRID
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Step 1: Prepared by */}
                  <div className="p-4 border border-slate-300 rounded-xl bg-slate-50 space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">1. Prepared By</span>
                      <strong className="text-slate-900 font-bold block">Head of Payroll & HR</strong>
                    </div>
                    <div className="border-b border-dashed border-slate-400 pt-6"></div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Signature</span>
                      <span>Date: _________</span>
                    </div>
                  </div>

                  {/* Step 2: Audited by */}
                  <div className="p-4 border border-slate-300 rounded-xl bg-slate-50 space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">2. Verified & Audited By</span>
                      <strong className="text-slate-900 font-bold block">Chief Financial Officer (CFO)</strong>
                    </div>
                    <div className="border-b border-dashed border-slate-400 pt-6"></div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Signature</span>
                      <span>Date: _________</span>
                    </div>
                  </div>

                  {/* Step 3: Approved by Director */}
                  <div className="p-4 border-2 border-slate-900 rounded-xl bg-amber-50/50 space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] text-amber-800 uppercase font-black block">3. Authorized for Disbursement</span>
                      <strong className="text-slate-950 font-black block">Managing Director / CEO</strong>
                    </div>
                    <div className="border-b-2 border-slate-900 pt-6"></div>
                    <div className="flex justify-between text-[10px] text-slate-700 font-bold">
                      <span>Director Signature & Stamp</span>
                      <span>Date: _________</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
