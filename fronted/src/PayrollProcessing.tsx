import { useEffect, useState } from 'react';
import { usePayrollStore } from './stores';
import type { Payrun, PayrunEmployee } from './api/modules/payroll.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Play, CheckCircle2, FileText, Users } from 'lucide-react';

export default function PayrollProcessing() {
  const { payruns, employees, fetchPayruns, fetchEmployees, fetchPayrunEmployees, calculatePayrun, postPayrun } = usePayrollStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; payrun: Payrun | null; employees: PayrunEmployee[] }>({ open: false, payrun: null, employees: [] });
  const [form, setForm] = useState({ frequency: 'Monthly', periodStart: '', periodEnd: '', payDate: '', taxYear: 2025 });

  useEffect(() => { fetchEmployees(); fetchPayruns(); }, []);

  const filtered = payruns.filter(p => { if (statusFilter && p.status !== statusFilter) return false; return true; });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleCalculate = async () => {
    await calculatePayrun({ ...form, autoPost: false });
    setDialogOpen(false);
    fetchPayruns();
  };

  const handlePost = async () => {
    await postPayrun({ ...form, autoPost: true });
    setDialogOpen(false);
    fetchPayruns();
  };

  const viewDetail = async (payrun: Payrun) => {
    const emps = await fetchPayrunEmployees(payrun.id);
    setDetailDialog({ open: true, payrun, employees: emps });
  };

  const getEmpName = (id: string) => { const e = employees.find(x => x.id === id); return e ? `${e.firstName} ${e.lastName}` : 'Unknown'; };

  const totalPosted = payruns.filter(p => p.status === 'Posted').length;
  const totalDraft = payruns.filter(p => p.status === 'Draft' || p.status === 'Calculated').length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Processing</h1>
          <p className="text-sm text-muted-foreground">Calculate, review, and post payroll runs with country-specific statutory deductions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Payrun</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Play className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{payruns.length}</p><p className="text-xs text-muted-foreground">Total Payruns</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{totalPosted}</p><p className="text-xs text-muted-foreground">Posted</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><FileText className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{totalDraft}</p><p className="text-xs text-muted-foreground">Draft / Calculated</p></div></div></Card>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={statusFilter} onValueChange={v => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Calculated">Calculated</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Posted">Posted</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Payrun #</th>
              <th className="text-left p-3 font-medium">Frequency</th>
              <th className="text-left p-3 font-medium">Period</th>
              <th className="text-left p-3 font-medium">Pay Date</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3"><span className="font-mono font-semibold text-primary">{p.payrunNumber}</span></td>
                <td className="p-3">{p.frequency}</td>
                <td className="p-3 font-mono text-xs">{p.periodStart} to {p.periodEnd}</td>
                <td className="p-3 font-mono">{p.payDate}</td>
                <td className="p-3 text-center">
                  <Badge variant={p.status === 'Posted' ? 'default' : p.status === 'Calculated' ? 'secondary' : p.status === 'Cancelled' ? 'destructive' : 'outline'}>{p.status}</Badge>
                </td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={() => viewDetail(p)}><Users className="h-4 w-4 mr-1" />View</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No payruns found</td></tr>}
          </tbody>
        </table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Payroll Run</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Pay Frequency *</Label><Select value={form.frequency} onValueChange={v => set('frequency', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Weekly">Weekly</SelectItem><SelectItem value="BiWeekly">Bi-Weekly</SelectItem>
                <SelectItem value="SemiMonthly">Semi-Monthly</SelectItem><SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select></div>
            <div><Label>Tax Year</Label><Input type="number" value={form.taxYear} onChange={e => set('taxYear', parseInt(e.target.value) || 2025)} /></div>
            <div><Label>Period Start *</Label><Input type="date" value={form.periodStart} onChange={e => set('periodStart', e.target.value)} /></div>
            <div><Label>Period End *</Label><Input type="date" value={form.periodEnd} onChange={e => set('periodEnd', e.target.value)} /></div>
            <div className="col-span-2"><Label>Pay Date *</Label><Input type="date" value={form.payDate} onChange={e => set('payDate', e.target.value)} /></div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            All active employees will be processed. Country-specific income tax, social security, and statutory deductions will be calculated automatically based on the selected tax year slabs.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="secondary" onClick={handleCalculate}>Calculate Only</Button>
            <Button onClick={handlePost}>Calculate & Post to GL</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialog.open} onOpenChange={open => setDetailDialog(d => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payrun Detail — {detailDialog.payrun?.payrunNumber}</DialogTitle>
          </DialogHeader>
          {detailDialog.payrun && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div><span className="text-muted-foreground">Status:</span><br /><Badge>{detailDialog.payrun.status}</Badge></div>
                <div><span className="text-muted-foreground">Period:</span><br /><strong className="font-mono text-xs">{detailDialog.payrun.periodStart} to {detailDialog.payrun.periodEnd}</strong></div>
                <div><span className="text-muted-foreground">Pay Date:</span><br /><strong className="font-mono">{detailDialog.payrun.payDate}</strong></div>
                <div><span className="text-muted-foreground">Employees:</span><br /><strong>{detailDialog.employees.length}</strong></div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left p-2 font-medium">Employee</th><th className="text-right p-2 font-medium">Gross</th><th className="text-right p-2 font-medium">Deductions</th><th className="text-right p-2 font-medium">Net Pay</th></tr></thead>
                <tbody>
                  {detailDialog.employees.map(pe => (
                    <tr key={pe.id} className="border-b">
                      <td className="p-2">{getEmpName(pe.employeeId)}</td>
                      <td className="p-2 text-right font-mono">{pe.currency} {pe.grossEarnings.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono text-red-600">{pe.currency} {pe.totalDeductions.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-semibold">{pe.currency} {pe.netPay.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td className="p-2">Total</td>
                    <td className="p-2 text-right font-mono">{detailDialog.employees.reduce((s, e) => s + e.grossEarnings, 0).toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-red-600">{detailDialog.employees.reduce((s, e) => s + e.totalDeductions, 0).toLocaleString()}</td>
                    <td className="p-2 text-right font-mono">{detailDialog.employees.reduce((s, e) => s + e.netPay, 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
