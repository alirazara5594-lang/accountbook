import { useEffect, useState } from 'react';
import { usePayrollStore } from './stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Banknote, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function LoansAdvancesView() {
  const { loans, employees, fetchLoans, fetchEmployees, createLoanAdvance, recordLoanRepayment } = usePayrollStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', loanNumber: '', loanType: 'Salary Advance', principalAmount: 0, interestRate: 0, totalInstallments: 1, installmentAmount: 0, startDate: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchEmployees(); fetchLoans(); }, []);

  const filtered = loans.filter(l => { if (statusFilter && l.status !== statusFilter) return false; return true; });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const getEmpName = (id: string) => { const e = employees.find(x => x.id === id); return e ? `${e.firstName} ${e.lastName}` : 'Unknown'; };

  const handleCreate = async () => {
    await createLoanAdvance({ ...form, principalAmount: Number(form.principalAmount), interestRate: Number(form.interestRate), totalInstallments: Number(form.totalInstallments), installmentAmount: Number(form.installmentAmount), companyId: null, endDate: null });
    setDialogOpen(false);
    setForm({ employeeId: '', loanNumber: '', loanType: 'Salary Advance', principalAmount: 0, interestRate: 0, totalInstallments: 1, installmentAmount: 0, startDate: new Date().toISOString().split('T')[0] });
  };

  const activeLoans = loans.filter(l => l.status === 'Active').length;
  const totalOutstanding = loans.filter(l => l.status === 'Active').reduce((s, l) => s + l.balanceAmount, 0);
  const completedLoans = loans.filter(l => l.status === 'Completed').length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loans & Advances</h1>
          <p className="text-sm text-muted-foreground">Manage salary advances, personal loans, and repayment tracking</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Loan</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Banknote className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{activeLoans}</p><p className="text-xs text-muted-foreground">Active Loans</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{totalOutstanding.toLocaleString()}</p><p className="text-xs text-muted-foreground">Outstanding Balance</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{completedLoans}</p><p className="text-xs text-muted-foreground">Completed</p></div></div></Card>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Loan / Advance</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>Employee *</Label><Select value={form.employeeId} onValueChange={v => set('employeeId', v)}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
            </Select></div>
            <div><Label>Loan Number *</Label><Input value={form.loanNumber} onChange={e => set('loanNumber', e.target.value)} placeholder="LA-001" /></div>
            <div><Label>Loan Type</Label><Select value={form.loanType} onValueChange={v => set('loanType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Salary Advance">Salary Advance</SelectItem><SelectItem value="Personal Loan">Personal Loan</SelectItem>
                <SelectItem value="Car Loan">Car Loan</SelectItem><SelectItem value="Housing Loan">Housing Loan</SelectItem>
                <SelectItem value="Education Loan">Education Loan</SelectItem>
              </SelectContent>
            </Select></div>
            <div><Label>Principal Amount *</Label><Input type="number" value={form.principalAmount} onChange={e => set('principalAmount', e.target.value)} /></div>
            <div><Label>Interest Rate (%)</Label><Input type="number" step="0.1" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} /></div>
            <div><Label>Total Installments</Label><Input type="number" value={form.totalInstallments} onChange={e => set('totalInstallments', e.target.value)} /></div>
            <div><Label>Installment Amount</Label><Input type="number" value={form.installmentAmount} onChange={e => set('installmentAmount', e.target.value)} /></div>
            <div className="col-span-2"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Loan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
