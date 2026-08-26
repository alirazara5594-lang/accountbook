import { useEffect, useState } from 'react';
import { usePayrollStore } from './stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormSection } from '@/components/ui/form-section';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { Plus, Banknote, TrendingUp, CheckCircle2, ArrowLeft, Save, User, Wallet } from 'lucide-react';

const EMPTY_FORM = { employeeId: '', loanNumber: '', loanType: 'SalaryAdvance', principalAmount: 0, interestRate: 0, totalInstallments: 1, installmentAmount: 0, startDate: new Date().toISOString().split('T')[0] };

export default function LoansAdvancesView() {
  const { loans, employees, fetchLoans, fetchEmployees, createLoanAdvance, recordLoanRepayment } = usePayrollStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEmployees(); fetchLoans(); }, []);

  const filtered = loans.filter(l => { if (statusFilter && l.status !== statusFilter) return false; return true; });
  const set = (k: string, v: any) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'principalAmount' || k === 'interestRate' || k === 'totalInstallments') {
        const p = Number(next.principalAmount) || 0;
        const r = Number(next.interestRate) || 0;
        const n = Number(next.totalInstallments) || 1;
        if (p > 0 && n > 0) {
          const monthlyRate = r / 100 / 12;
          next.installmentAmount = monthlyRate > 0
            ? Math.round((p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) * 100) / 100
            : Math.round((p / n) * 100) / 100;
        }
      }
      return next;
    });
  };
  const getEmpName = (id: string) => { const e = employees.find(x => x.id === id); return e ? `${e.firstName} ${e.lastName}` : 'Unknown'; };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createLoanAdvance({ ...form, principalAmount: Number(form.principalAmount), interestRate: Number(form.interestRate), totalInstallments: Number(form.totalInstallments), installmentAmount: Number(form.installmentAmount), companyId: null, endDate: null });
    } finally {
      setSaving(false);
    }
    setView('list');
    setForm(EMPTY_FORM);
  };

  const activeLoans = loans.filter(l => l.status === 'Active').length;
  const totalOutstanding = loans.filter(l => l.status === 'Active').reduce((s, l) => s + l.balanceAmount, 0);
  const completedLoans = loans.filter(l => l.status === 'Completed').length;

  if (view === 'form') {
    return (
      <div className="p-6 max-w-[1100px] mx-auto space-y-5">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setView('list')}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
          <PageHeader
            title="New Loan / Advance"
            description="Create a salary advance or loan for an employee"
          />
          <Button onClick={handleCreate} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : 'Create Loan'}</Button>
        </div>

        <div className="space-y-4">
          <FormSection icon={User} title="Employee & Loan Type" tone="violet">
            <FormField label="Employee" required className="col-span-full"><Select value={form.employeeId} onValueChange={v => set('employeeId', v)}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</SelectItem>)}</SelectContent>
            </Select></FormField>
            <FormField label="Loan Number" required><Input value={form.loanNumber} onChange={e => set('loanNumber', e.target.value)} placeholder="LN-001" /></FormField>
            <FormField label="Loan Type" required><Select value={form.loanType} onValueChange={v => set('loanType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SalaryAdvance">Salary Advance</SelectItem><SelectItem value="PersonalLoan">Personal Loan</SelectItem>
                <SelectItem value="EmergencyLoan">Emergency Loan</SelectItem><SelectItem value="TravelAdvance">Travel Advance</SelectItem>
                <SelectItem value="EquipmentLoan">Equipment Loan</SelectItem>
              </SelectContent>
            </Select></FormField>
          </FormSection>

          <FormSection icon={Wallet} title="Loan Amount & Terms" tone="emerald">
            <FormField label="Principal Amount" required><Input type="number" value={form.principalAmount} onChange={e => set('principalAmount', e.target.value)} /></FormField>
            <FormField label="Annual Interest Rate %"><Input type="number" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} step="0.1" /></FormField>
            <FormField label="Number of Installments" required><Input type="number" value={form.totalInstallments} onChange={e => set('totalInstallments', e.target.value)} /></FormField>
            <FormField label="Installment Amount (auto)"><Input type="number" value={form.installmentAmount} readOnly className="bg-muted/50" /></FormField>
            <FormField label="Total Payable (auto)"><Input value={Number(form.installmentAmount) * Number(form.totalInstallments)} readOnly disabled className="bg-muted/50" /></FormField>
            <FormField label="Disbursement Date" required><Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></FormField>
          </FormSection>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4 sticky bottom-0 bg-background py-3">
          <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : 'Create Loan'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Loans & Advances"
        description="Manage salary advances, personal loans, and repayment tracking"
        actions={<Button onClick={() => setView('form')}><Plus className="mr-2 h-4 w-4" /> New Loan</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Active Loans', value: activeLoans, desc: 'Currently active', icon: Banknote, color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-600 dark:text-teal-400' },
          { label: 'Outstanding Balance', value: totalOutstanding.toLocaleString(), desc: 'Total remaining', icon: TrendingUp, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400' },
          { label: 'Completed', value: completedLoans, desc: 'Fully repaid loans', icon: CheckCircle2, color: 'from-emerald-500 to-green-500', bg: 'bg-green-50 dark:bg-green-950/30', textColor: 'text-green-600 dark:text-green-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-xl font-semibold mt-1.5 ${kpi.textColor}`}>{kpi.value}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{kpi.desc}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white shadow-lg`}>
                <kpi.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${kpi.bg} opacity-50`} />
          </div>
        ))}
      </div>

      <div className="flex gap-3 items-center">
        <Select value={statusFilter} onValueChange={v => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Defaulted">Defaulted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Loan #</th>
              <th className="text-left p-3 font-medium">Employee</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-right p-3 font-medium">Principal</th>
              <th className="text-right p-3 font-medium">Installment</th>
              <th className="text-center p-3 font-medium">Progress</th>
              <th className="text-right p-3 font-medium">Balance</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-semibold">{l.loanNumber}</td>
                <td className="p-3">{getEmpName(l.employeeId)}</td>
                <td className="p-3"><Badge variant="outline">{l.loanType}</Badge></td>
                <td className="p-3 text-right font-mono">{l.principalAmount.toLocaleString()}</td>
                <td className="p-3 text-right font-mono">{l.installmentAmount.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(l.paidInstallments / l.totalInstallments) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{l.paidInstallments}/{l.totalInstallments}</span>
                  </div>
                </td>
                <td className="p-3 text-right font-mono font-semibold">{l.balanceAmount.toLocaleString()}</td>
                <td className="p-3 text-center">
                  <Badge variant={l.status === 'Active' ? 'default' : l.status === 'Completed' ? 'secondary' : 'destructive'}>{l.status}</Badge>
                </td>
                <td className="p-3 text-right">
                  {l.status === 'Active' && <Button size="sm" variant="ghost" onClick={() => recordLoanRepayment(l.id)}><Banknote className="h-4 w-4 mr-1" />Repay</Button>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No loans found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}