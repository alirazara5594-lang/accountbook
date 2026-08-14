import { useEffect, useState } from 'react';
import { usePayrollStore } from './stores';
import type { Employee } from './api/modules/payroll.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, UserX, MapPin, Building2, Briefcase, Shield, Globe, CreditCard, GraduationCap, ArrowLeft, ArrowRight, Save, Users, Check } from 'lucide-react';

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' }, { value: 'CA', label: 'Canada' }, { value: 'UK', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' }, { value: 'FR', label: 'France' }, { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' }, { value: 'ES', label: 'Spain' }, { value: 'IT', label: 'Italy' },
  { value: 'PL', label: 'Poland' }, { value: 'PK', label: 'Pakistan' }, { value: 'SA', label: 'Saudi Arabia' }, { value: 'AE', label: 'UAE' },
];

const EMPTY_FORM = {
  firstName: '', lastName: '', middleName: '', preferredName: '', email: '', phone: '', gender: '', maritalStatus: '', nationality: '',
  dateOfBirth: '', nationalId: '', taxId: '', country: 'US', stateProvince: '', city: '', address: '', postalCode: '',
  bankName: '', bankAccountNumber: '', bankRoutingNumber: '', bankIBAN: '', bankSWIFT: '', bankAccountName: '',
  employmentType: 'FullTime', payFrequency: 'Monthly', status: 'Active', hireDate: '', probationEndDate: '', terminationDate: '',
  managerId: '', departmentId: '', positionId: '', payGradeId: '', basicSalary: 0, currency: 'USD',
  taxFilingStatus: 'Single', taxExemptions: 0, additionalTaxWithholding: 0, emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
  highestDegree: '', institution: '', fieldOfStudy: '', graduationYear: '', skills: '', certifications: '',
};

const STEPS = [
  { key: 'personal', label: 'Personal Info', icon: Users },
  { key: 'employment', label: 'Employment', icon: Briefcase },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'bank', label: 'Bank Details', icon: CreditCard },
  { key: 'tax', label: 'Tax Info', icon: Shield },
] as const;

type StepKey = typeof STEPS[number]['key'];

export default function EmployeeDirectory() {
  const { employees, departments, positions, payGrades, fetchEmployees, fetchDepartments, fetchPositions, fetchPayGrades, createEmployee, updateEmployee, setEmployeeStatus } = usePayrollStore();
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState<StepKey>('personal');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEmployees(); fetchDepartments(); fetchPositions(); fetchPayGrades(); }, []);

  const filtered = employees.filter(e => {
    if (search && !`${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (countryFilter && e.country !== countryFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setStep('personal'); setView('form'); };
  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, middleName: emp.middleName, preferredName: emp.preferredName, email: emp.email, phone: emp.phone,
      gender: emp.gender, maritalStatus: emp.maritalStatus, nationality: emp.nationality, dateOfBirth: emp.dateOfBirth, nationalId: emp.nationalId,
      taxId: emp.taxId, country: emp.country, stateProvince: emp.stateProvince, city: emp.city, address: emp.address,
      postalCode: emp.postalCode, bankName: emp.bankName, bankAccountNumber: emp.bankAccountNumber,
      bankRoutingNumber: emp.bankRoutingNumber, bankIBAN: emp.bankIBAN, bankSWIFT: emp.bankSWIFT, bankAccountName: emp.bankAccountName,
      employmentType: emp.employmentType, payFrequency: emp.payFrequency, status: emp.status, hireDate: emp.hireDate,
      probationEndDate: emp.probationEndDate || '', terminationDate: emp.terminationDate || '', managerId: emp.managerId || '',
      departmentId: emp.departmentId || '', positionId: emp.positionId || '', payGradeId: emp.payGradeId || '',
      basicSalary: emp.basicSalary, currency: emp.currency, taxFilingStatus: emp.taxFilingStatus, taxExemptions: emp.taxExemptions,
      additionalTaxWithholding: emp.additionalTaxWithholding || 0,
      emergencyContactName: emp.emergencyContactName, emergencyContactPhone: emp.emergencyContactPhone,
      emergencyContactRelation: emp.emergencyContactRelation,
      highestDegree: (emp as any).highestDegree || '', institution: (emp as any).institution || '', fieldOfStudy: (emp as any).fieldOfStudy || '',
      graduationYear: (emp as any).graduationYear || '', skills: (emp as any).skills || '', certifications: (emp as any).certifications || '',
    });
    setStep('personal');
    setView('form');
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const stepIndex = STEPS.findIndex(s => s.key === step);
  const isLastStep = stepIndex === STEPS.length - 1;

  const validateStep = (): string[] => {
    const errs: string[] = [];
    if (step === 'personal') {
      if (!form.firstName.trim()) errs.push('First Name is required.');
      if (!form.lastName.trim()) errs.push('Last Name is required.');
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.push('Enter a valid email address.');
    }
    if (step === 'employment' && !form.hireDate) errs.push('Hire Date is required.');
    return errs;
  };

  const goToNext = () => {
    const errs = validateStep();
    if (errs.length) { window.alert(errs.join('\n')); return; }
    if (!isLastStep) setStep(STEPS[stepIndex + 1].key);
    else handleSubmit();
  };

  const goToPrev = () => { if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key); };

  const handleSubmit = async () => {
    setSaving(true);
    const data = {
      ...form,
      basicSalary: Number(form.basicSalary) || 0,
      taxExemptions: Number(form.taxExemptions) || 0,
      additionalTaxWithholding: Number(form.additionalTaxWithholding) || 0,
    };
    try {
      if (editing) await updateEmployee(editing.id, data);
      else await createEmployee(data);
    } finally {
      setSaving(false);
    }
    setView('list');
  };

  const getDeptName = (id?: string) => departments.find(d => d.id === id)?.name || '-';
  const getPosName = (id?: string) => positions.find(p => p.id === id)?.name || '-';

  if (view === 'form') {
    return (
      <div className="p-6 max-w-[1000px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setView('list')}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{editing ? `Edit Employee — ${editing.firstName} ${editing.lastName}` : 'New Employee'}</h1>
              <p className="text-sm text-muted-foreground">Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex].label}</p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const isDone = i < stepIndex;
            const isActive = i === stepIndex;
            return (
              <div key={s.key} className={`flex-1 flex items-center gap-2 rounded-xl border px-3 py-2 ${isActive ? 'border-[#176f76] bg-teal-50' : isDone ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isActive ? 'bg-[#176f76] text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {isDone ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold truncate ${isActive ? 'text-[#176f76]' : isDone ? 'text-emerald-700' : 'text-slate-500'}`}>{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {step === 'personal' && (
            <>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2 border-l-4 border-slate-400 pl-2 justify-start text-left"><Users className="h-4 w-4 text-slate-500" /> Personal Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label className="justify-start text-left">First Name <span className="text-red-500">*</span></Label><Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="John" /></div>
                  <div><Label className="justify-start text-left">Middle Name</Label><Input value={form.middleName} onChange={e => set('middleName', e.target.value)} placeholder="Middle" /></div>
                  <div><Label className="justify-start text-left">Last Name <span className="text-red-500">*</span></Label><Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Doe" /></div>
                  <div><Label className="justify-start text-left">Preferred Name</Label><Input value={form.preferredName} onChange={e => set('preferredName', e.target.value)} placeholder="Nickname" /></div>
                  <div><Label className="justify-start text-left">Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@company.com" /></div>
                  <div><Label className="justify-start text-left">Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 890" /></div>
                  <div><Label className="justify-start text-left">Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></div>
                  <div><Label className="justify-start text-left">Gender</Label><Select value={form.gender} onValueChange={v => v !== null && set('gender', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select></div>
                  <div><Label className="justify-start text-left">Marital Status</Label><Select value={form.maritalStatus} onValueChange={v => v !== null && set('maritalStatus', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem><SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select></div>
                  <div><Label className="justify-start text-left">Nationality</Label><Input value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="American" /></div>
                  <div><Label className="justify-start text-left">National ID / SSN</Label><Input value={form.nationalId} onChange={e => set('nationalId', e.target.value)} placeholder="123-45-6789" /></div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-700 mb-3 flex items-center gap-2 border-l-4 border-blue-400 pl-2 justify-start text-left"><MapPin className="h-4 w-4 text-blue-500" /> Address</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-3"><Label className="justify-start text-left">Street Address</Label><Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" /></div>
                  <div><Label className="justify-start text-left">City</Label><Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" /></div>
                  <div><Label className="justify-start text-left">State / Province</Label><Input value={form.stateProvince} onChange={e => set('stateProvince', e.target.value)} placeholder="State / Province" /></div>
                  <div><Label className="justify-start text-left">Postal Code</Label><Input value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="Postal code" /></div>
                  <div><Label className="justify-start text-left">Country</Label><Select value={form.country} onValueChange={v => v !== null && set('country', v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{COUNTRY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select></div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2 border-l-4 border-amber-400 pl-2 justify-start text-left"><Shield className="h-4 w-4 text-amber-500" /> Emergency Contact</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label className="justify-start text-left">Name</Label><Input value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} /></div>
                  <div><Label className="justify-start text-left">Phone</Label><Input value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} /></div>
                  <div><Label className="justify-start text-left">Relation</Label><Input value={form.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} /></div>
                </div>
              </div>
            </>
          )}

          {step === 'employment' && (
            <>
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-teal-700 mb-3 flex items-center gap-2 border-l-4 border-teal-400 pl-2 justify-start text-left"><Briefcase className="h-4 w-4 text-teal-500" /> Employment Details</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label className="justify-start text-left">Employment Type</Label><Select value={form.employmentType} onValueChange={v => v !== null && set('employmentType', v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FullTime">Full-Time</SelectItem><SelectItem value="PartTime">Part-Time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem><SelectItem value="Intern">Intern</SelectItem><SelectItem value="Seasonal">Seasonal</SelectItem>
                    </SelectContent>
                  </Select></div>
                  <div><Label className="justify-start text-left">Pay Frequency</Label><Select value={form.payFrequency} onValueChange={v => v !== null && set('payFrequency', v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem><SelectItem value="BiWeekly">Bi-Weekly</SelectItem>
                      <SelectItem value="SemiMonthly">Semi-Monthly</SelectItem><SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select></div>
                  <div><Label className="justify-start text-left">Status</Label><Select value={form.status} onValueChange={v => v !== null && set('status', v)}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem><SelectItem value="OnLeave">On Leave</SelectItem>
                      <SelectItem value="Probation">Probation</SelectItem><SelectItem value="Terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select></div>
                  <div><Label className="justify-start text-left">Hire Date</Label><Input type="date" value={form.hireDate} onChange={e => set('hireDate', e.target.value)} /></div>
                  <div><Label className="justify-start text-left">Probation End Date</Label><Input type="date" value={form.probationEndDate} onChange={e => set('probationEndDate', e.target.value)} /></div>
                  <div><Label className="justify-start text-left">Termination Date</Label><Input type="date" value={form.terminationDate} onChange={e => set('terminationDate', e.target.value)} /></div>
                </div>
              </div>
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-violet-700 mb-3 flex items-center gap-2 border-l-4 border-violet-400 pl-2 justify-start text-left"><Building2 className="h-4 w-4 text-violet-500" /> Organization</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label className="justify-start text-left">Department</Label><Select value={form.departmentId} onValueChange={v => set('departmentId', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                  <div><Label className="justify-start text-left">Position</Label><Select value={form.positionId} onValueChange={v => set('positionId', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select position" /></SelectTrigger>
                    <SelectContent>{positions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                  <div><Label className="justify-start text-left">Pay Grade</Label><Select value={form.payGradeId} onValueChange={v => set('payGradeId', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select pay grade" /></SelectTrigger>
                    <SelectContent>{payGrades.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                  </Select></div>
                  <div><Label className="justify-start text-left">Manager</Label><Select value={form.managerId} onValueChange={v => set('managerId', v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select manager" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Manager</SelectItem>
                      {employees.filter(e => e.id !== editing?.id && e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select></div>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2 border-l-4 border-emerald-400 pl-2 justify-start text-left"><CreditCard className="h-4 w-4 text-emerald-500" /> Compensation</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label className="justify-start text-left">Basic Salary</Label><Input type="number" value={form.basicSalary} onChange={e => set('basicSalary', e.target.value)} placeholder="75000" /></div>
                  <div><Label className="justify-start text-left">Currency</Label><Input value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="USD" /></div>
                  <div><Label className="justify-start text-left">Additional Tax Withholding</Label><Input type="number" value={form.additionalTaxWithholding} onChange={e => set('additionalTaxWithholding', e.target.value)} placeholder="0" /></div>
                </div>
              </div>
            </>
          )}

          {step === 'education' && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <h4 className="text-sm font-bold text-indigo-700 mb-3 flex items-center gap-2 border-l-4 border-indigo-400 pl-2 justify-start text-left"><GraduationCap className="h-4 w-4 text-indigo-500" /> Education Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="justify-start text-left">Highest Degree</Label><Select value={form.highestDegree} onValueChange={v => v !== null && set('highestDegree', v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select degree" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HighSchool">High School</SelectItem><SelectItem value="Diploma">Diploma</SelectItem>
                    <SelectItem value="Associate">Associate Degree</SelectItem><SelectItem value="Bachelor">Bachelor's</SelectItem>
                    <SelectItem value="Master">Master's</SelectItem><SelectItem value="Doctorate">Doctorate / PhD</SelectItem>
                  </SelectContent>
                </Select></div>
                <div><Label className="justify-start text-left">Field of Study</Label><Input value={form.fieldOfStudy} onChange={e => set('fieldOfStudy', e.target.value)} placeholder="Computer Science" /></div>
                <div><Label className="justify-start text-left">Graduation Year</Label><Input type="number" value={form.graduationYear} onChange={e => set('graduationYear', e.target.value)} placeholder="2020" /></div>
                <div><Label className="justify-start text-left">Institution</Label><Input value={form.institution} onChange={e => set('institution', e.target.value)} placeholder="University / College name" /></div>
                <div><Label className="justify-start text-left">Skills</Label><Input value={form.skills} onChange={e => set('skills', e.target.value)} placeholder="JavaScript, Leadership, SAP..." /></div>
                <div><Label className="justify-start text-left">Certifications</Label><Input value={form.certifications} onChange={e => set('certifications', e.target.value)} placeholder="PMP, CFA, AWS Certified..." /></div>
              </div>
            </div>
          )}

          {step === 'bank' && (
            <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
              <h4 className="text-sm font-bold text-cyan-700 mb-3 flex items-center gap-2 border-l-4 border-cyan-400 pl-2 justify-start text-left"><CreditCard className="h-4 w-4 text-cyan-500" /> Bank Account Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="justify-start text-left">Bank Name</Label><Input value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Chase Bank" /></div>
                <div><Label className="justify-start text-left">Account Name</Label><Input value={form.bankAccountName} onChange={e => set('bankAccountName', e.target.value)} placeholder="John Doe" /></div>
                <div><Label className="justify-start text-left">Account Number</Label><Input value={form.bankAccountNumber} onChange={e => set('bankAccountNumber', e.target.value)} placeholder="123456789" /></div>
                <div><Label className="justify-start text-left">Routing Number / Sort Code</Label><Input value={form.bankRoutingNumber} onChange={e => set('bankRoutingNumber', e.target.value)} placeholder="021000021" /></div>
                <div><Label className="justify-start text-left">IBAN</Label><Input value={form.bankIBAN} onChange={e => set('bankIBAN', e.target.value)} placeholder="GB29NWBK60161331926819" /></div>
                <div><Label className="justify-start text-left">SWIFT / BIC</Label><Input value={form.bankSWIFT} onChange={e => set('bankSWIFT', e.target.value)} placeholder="NWBKGB2L" /></div>
              </div>
            </div>
          )}

          {step === 'tax' && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
              <h4 className="text-sm font-bold text-rose-700 mb-3 flex items-center gap-2 border-l-4 border-rose-400 pl-2 justify-start text-left"><Shield className="h-4 w-4 text-rose-500" /> Tax Information</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="justify-start text-left">Tax ID / UTR / NTN</Label><Input value={form.taxId} onChange={e => set('taxId', e.target.value)} placeholder="Tax identification number" /></div>
                <div><Label className="justify-start text-left">Tax Filing Status</Label><Select value={form.taxFilingStatus} onValueChange={v => set('taxFilingStatus', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem><SelectItem value="MarriedFilingJointly">Married Filing Jointly</SelectItem>
                    <SelectItem value="MarriedFilingSeparately">Married Filing Separately</SelectItem>
                    <SelectItem value="HeadOfHousehold">Head of Household</SelectItem><SelectItem value="NonResident">Non-Resident</SelectItem>
                  </SelectContent>
                </Select></div>
                <div><Label className="justify-start text-left">Tax Exemptions</Label><Input type="number" value={form.taxExemptions} onChange={e => set('taxExemptions', e.target.value)} placeholder="0" /></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-4 sticky bottom-0 bg-[#f5f7fa] py-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
            {stepIndex > 0 && <Button variant="outline" onClick={goToPrev}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>}
          </div>
          {isLastStep
            ? <Button onClick={handleSubmit} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : editing ? 'Update Employee' : 'Create Employee'}</Button>
            : <Button onClick={goToNext}>Save & Move to Next Tab <ArrowRight className="ml-1.5 h-4 w-4" /></Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Directory</h1>
          <p className="text-sm text-muted-foreground">Manage employee records, contracts, and personal information</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Employee</Button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="Search by name, number, or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={countryFilter} onValueChange={v => v !== null && setCountryFilter(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Countries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Countries</SelectItem>
            {COUNTRY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="OnLeave">On Leave</SelectItem>
            <SelectItem value="Probation">Probation</SelectItem>
            <SelectItem value="Terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Employee</th>
              <th className="text-left p-3 font-medium">Country</th>
              <th className="text-left p-3 font-medium">Department</th>
              <th className="text-left p-3 font-medium">Position</th>
              <th className="text-right p-3 font-medium">Basic Salary</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(emp => (
              <tr key={emp.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div>
                      <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                      <div className="text-xs text-muted-foreground">{emp.employeeNumber} · {emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3"><div className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{COUNTRY_OPTIONS.find(c => c.value === emp.country)?.label || emp.country}</div></td>
                <td className="p-3"><div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{getDeptName(emp.departmentId)}</div></td>
                <td className="p-3"><div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" />{getPosName(emp.positionId)}</div></td>
                <td className="p-3 text-right font-mono">{emp.currency} {emp.basicSalary.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <Badge variant={emp.status === 'Active' ? 'default' : emp.status === 'Terminated' ? 'destructive' : 'secondary'}>{emp.status}</Badge>
                </td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(emp)}><Pencil className="h-3.5 w-3.5" /></Button>
                    {emp.status === 'Active' && <Button variant="ghost" size="icon-sm" onClick={() => setEmployeeStatus(emp.id, 'OnLeave')}><UserX className="h-3.5 w-3.5" /></Button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No employees found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}