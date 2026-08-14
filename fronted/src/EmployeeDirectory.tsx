import { useEffect, useState } from 'react';
import { usePayrollStore } from './stores';
import type { Employee } from './api/modules/payroll.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, UserX, MapPin, Building2, Briefcase, Shield, Globe, CreditCard } from 'lucide-react';

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
};

export default function EmployeeDirectory() {
  const { employees, departments, positions, payGrades, fetchEmployees, fetchDepartments, fetchPositions, fetchPayGrades, createEmployee, updateEmployee, setEmployeeStatus } = usePayrollStore();
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab] = useState<'personal' | 'employment' | 'bank' | 'tax'>('personal');

  useEffect(() => { fetchEmployees(); fetchDepartments(); fetchPositions(); fetchPayGrades(); }, []);

  const filtered = employees.filter(e => {
    if (search && !`${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (countryFilter && e.country !== countryFilter) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    return true;
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setTab('personal'); setDialogOpen(true); };
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
    });
    setTab('personal');
    setDialogOpen(true);
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    const data = {
      ...form,
      basicSalary: Number(form.basicSalary) || 0,
      taxExemptions: Number(form.taxExemptions) || 0,
      additionalTaxWithholding: Number(form.additionalTaxWithholding) || 0,
    };
    if (editing) await updateEmployee(editing.id, data);
    else await createEmployee(data);
    setDialogOpen(false);
  };

  const getDeptName = (id?: string) => departments.find(d => d.id === id)?.name || '-';
  const getPosName = (id?: string) => positions.find(p => p.id === id)?.name || '-';

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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden pr-12">
          <DialogHeader className="pr-8">
            <DialogTitle>{editing ? `Edit Employee — ${editing.firstName} ${editing.lastName}` : 'New Employee'}</DialogTitle>
          </DialogHeader>

          <div className="flex gap-1 border-b mb-3">
            {(['personal', 'employment', 'bank', 'tax'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all ${tab === t ? 'border-[#176f76] text-[#176f76] bg-[#e1f8f4]/50' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}>
                {t === 'personal' ? 'Personal Info' : t === 'employment' ? 'Employment' : t === 'bank' ? 'Bank Details' : 'Tax Info'}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-160px)] pr-1">
            {tab === 'personal' && (
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2 border-l-3 border-[#176f76] pl-2">Basic Information</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="John" /></div>
                    <div><Label>Middle Name</Label><Input value={form.middleName} onChange={e => set('middleName', e.target.value)} placeholder="Middle" /></div>
                    <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Doe" /></div>
                    <div><Label>Preferred Name</Label><Input value={form.preferredName} onChange={e => set('preferredName', e.target.value)} placeholder="Nickname" /></div>
                    <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@company.com" /></div>
                    <div><Label>Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 234 567 890" /></div>
                    <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></div>
                    <div><Label>Gender</Label><Select value={form.gender} onValueChange={v => set('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select></div>
                    <div><Label>Marital Status</Label><Select value={form.maritalStatus} onValueChange={v => set('maritalStatus', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem><SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem><SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select></div>
                    <div><Label>Nationality</Label><Input value={form.nationality} onChange={e => set('nationality', e.target.value)} placeholder="American" /></div>
                    <div><Label>National ID / SSN</Label><Input value={form.nationalId} onChange={e => set('nationalId', e.target.value)} placeholder="123-45-6789" /></div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-2 border-l-3 border-amber-400 pl-2"><Shield className="h-3.5 w-3.5" /> Emergency Contact</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Name</Label><Input value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} /></div>
                    <div><Label>Phone</Label><Input value={form.emergencyContactPhone} onChange={e => set('emergencyContactPhone', e.target.value)} /></div>
                    <div><Label>Relation</Label><Input value={form.emergencyContactRelation} onChange={e => set('emergencyContactRelation', e.target.value)} /></div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2 border-l-3 border-blue-400 pl-2"><MapPin className="h-3.5 w-3.5" /> Address</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address" /></div>
                    <div><Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" /></div>
                    <div><Input value={form.stateProvince} onChange={e => set('stateProvince', e.target.value)} placeholder="State / Province" /></div>
                    <div><Input value={form.postalCode} onChange={e => set('postalCode', e.target.value)} placeholder="Postal code" /></div>
                    <div><Select value={form.country} onValueChange={v => set('country', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{COUNTRY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select></div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'employment' && (
              <div className="space-y-3">
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2 flex items-center gap-2 border-l-3 border-teal-400 pl-2"><Briefcase className="h-3.5 w-3.5" /> Employment Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Employment Type</Label><Select value={form.employmentType} onValueChange={v => set('employmentType', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FullTime">Full-Time</SelectItem><SelectItem value="PartTime">Part-Time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem><SelectItem value="Intern">Intern</SelectItem><SelectItem value="Seasonal">Seasonal</SelectItem>
                      </SelectContent>
                    </Select></div>
                    <div><Label>Pay Frequency</Label><Select value={form.payFrequency} onValueChange={v => set('payFrequency', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem><SelectItem value="BiWeekly">Bi-Weekly</SelectItem>
                        <SelectItem value="SemiMonthly">Semi-Monthly</SelectItem><SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select></div>
                    <div><Label>Status</Label><Select value={form.status} onValueChange={v => v !== null && set('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem><SelectItem value="OnLeave">On Leave</SelectItem>
                        <SelectItem value="Probation">Probation</SelectItem><SelectItem value="Terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select></div>
                    <div><Label>Hire Date *</Label><Input type="date" value={form.hireDate} onChange={e => set('hireDate', e.target.value)} /></div>
                    <div><Label>Probation End Date</Label><Input type="date" value={form.probationEndDate} onChange={e => set('probationEndDate', e.target.value)} /></div>
                    <div><Label>Termination Date</Label><Input type="date" value={form.terminationDate} onChange={e => set('terminationDate', e.target.value)} /></div>
                  </div>
                </div>
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2 flex items-center gap-2 border-l-3 border-violet-400 pl-2"><Building2 className="h-3.5 w-3.5" /> Organization</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Department</Label><Select value={form.departmentId} onValueChange={v => set('departmentId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select></div>
                    <div><Label>Position</Label><Select value={form.positionId} onValueChange={v => set('positionId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>{positions.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select></div>
                    <div><Label>Pay Grade</Label><Select value={form.payGradeId} onValueChange={v => set('payGradeId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select pay grade" /></SelectTrigger>
                      <SelectContent>{payGrades.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                    </Select></div>
                    <div><Label>Manager</Label><Select value={form.managerId} onValueChange={v => set('managerId', v)}>
                      <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Manager</SelectItem>
                        {employees.filter(e => e.id !== editing?.id && e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                      </SelectContent>
                    </Select></div>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-2 border-l-3 border-emerald-400 pl-2"><CreditCard className="h-3.5 w-3.5" /> Compensation</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Basic Salary *</Label><Input type="number" value={form.basicSalary} onChange={e => set('basicSalary', e.target.value)} placeholder="75000" /></div>
                    <div><Label>Currency</Label><Input value={form.currency} onChange={e => set('currency', e.target.value)} placeholder="USD" /></div>
                    <div><Label>Additional Tax Withholding</Label><Input type="number" value={form.additionalTaxWithholding} onChange={e => set('additionalTaxWithholding', e.target.value)} placeholder="0" /></div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'bank' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-2 border-l-3 border-blue-400 pl-2">Bank Account Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Bank Name</Label><Input value={form.bankName} onChange={e => set('bankName', e.target.value)} placeholder="Chase Bank" /></div>
                  <div><Label>Account Name</Label><Input value={form.bankAccountName} onChange={e => set('bankAccountName', e.target.value)} placeholder="John Doe" /></div>
                  <div><Label>Account Number</Label><Input value={form.bankAccountNumber} onChange={e => set('bankAccountNumber', e.target.value)} placeholder="123456789" /></div>
                  <div><Label>Routing Number / Sort Code</Label><Input value={form.bankRoutingNumber} onChange={e => set('bankRoutingNumber', e.target.value)} placeholder="021000021" /></div>
                  <div><Label>IBAN</Label><Input value={form.bankIBAN} onChange={e => set('bankIBAN', e.target.value)} placeholder="GB29NWBK60161331926819" /></div>
                  <div><Label>SWIFT / BIC</Label><Input value={form.bankSWIFT} onChange={e => set('bankSWIFT', e.target.value)} placeholder="NWBKGB2L" /></div>
                </div>
              </div>
            )}

            {tab === 'tax' && (
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-2 border-l-3 border-rose-400 pl-2"><Shield className="h-3.5 w-3.5" /> Tax Information</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Tax ID / UTR / NTN</Label><Input value={form.taxId} onChange={e => set('taxId', e.target.value)} placeholder="Tax identification number" /></div>
                  <div><Label>Tax Filing Status</Label><Select value={form.taxFilingStatus} onValueChange={v => set('taxFilingStatus', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem><SelectItem value="MarriedFilingJointly">Married Filing Jointly</SelectItem>
                      <SelectItem value="MarriedFilingSeparately">Married Filing Separately</SelectItem>
                      <SelectItem value="HeadOfHousehold">Head of Household</SelectItem><SelectItem value="NonResident">Non-Resident</SelectItem>
                    </SelectContent>
                  </Select></div>
                  <div><Label>Tax Exemptions</Label><Input type="number" value={form.taxExemptions} onChange={e => set('taxExemptions', e.target.value)} placeholder="0" /></div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-3 mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editing ? 'Update Employee' : 'Create Employee'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
