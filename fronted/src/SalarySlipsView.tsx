import { useEffect, useState } from 'react';
import { usePayrollStore } from './stores';
import type { SalarySlip } from './api/modules/payroll.api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ArrowLeft, Printer } from 'lucide-react';

export default function SalarySlipsView() {
  const { salarySlips, employees, fetchSalarySlips, fetchEmployees } = usePayrollStore();
  const [empFilter, setEmpFilter] = useState('');
  const [selected, setSelected] = useState<SalarySlip | null>(null);

  useEffect(() => { fetchEmployees(); fetchSalarySlips(); }, []);

  const filtered = salarySlips.filter(s => { if (empFilter && s.employeeName !== empFilter) return false; return true; });

  const handlePrint = () => window.print();

  if (selected) {
    return (
      <div className="p-6 max-w-[900px] mx-auto space-y-4">
        <div className="no-print flex gap-2">
          <Button variant="outline" onClick={() => setSelected(null)}><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Button>
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print / Save PDF</Button>
        </div>

        <div className="bg-white border-2 border-border rounded-lg overflow-hidden shadow-sm" id="salary-slip-printable">
          <div className="flex justify-between items-start p-6 border-b-2 border-primary bg-gradient-to-br from-primary/5 to-transparent">
            <div>
              <h2 className="text-xl font-bold text-primary">Acme Holdings</h2>
              <p className="text-xs text-muted-foreground">123 Business Avenue, Suite 100</p>
              <p className="text-xs text-muted-foreground">San Francisco, CA 94102</p>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-extrabold tracking-widest text-foreground">SALARY SLIP</h1>
              <p className="font-mono text-sm text-muted-foreground mt-1">{selected.slipNumber}</p>
            </div>
          </div>

          <div className="p-6 bg-muted/30 border-b">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground font-medium">Employee:</span><br /><strong>{selected.employeeName}</strong></div>
              <div><span className="text-muted-foreground font-medium">Employee #:</span><br /><strong className="font-mono">{selected.employeeNumber}</strong></div>
              <div><span className="text-muted-foreground font-medium">Department:</span><br /><strong>{selected.department}</strong></div>
              <div><span className="text-muted-foreground font-medium">Position:</span><br /><strong>{selected.position}</strong></div>
              <div><span className="text-muted-foreground font-medium">Pay Period:</span><br /><strong className="font-mono text-xs">{selected.periodStart} to {selected.periodEnd}</strong></div>
              <div><span className="text-muted-foreground font-medium">Pay Date:</span><br /><strong className="font-mono">{selected.payDate}</strong></div>
              <div><span className="text-muted-foreground font-medium">Frequency:</span><br /><strong>{selected.payFrequency}</strong></div>
              <div><span className="text-muted-foreground font-medium">Bank:</span><br /><strong>{selected.bankName} ****{selected.bankAccountLast4}</strong></div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 pb-2 border-b-2 border-border">Earnings</h3>
                <div className="flex justify-between py-1.5 text-sm border-b border-border/50"><span>Basic Salary</span><span className="font-mono">{selected.currency} {selected.basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                {selected.earnings.map((e, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-sm border-b border-border/50"><span>{e.name}</span><span className="font-mono">{selected.currency} {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                ))}
                <div className="flex justify-between py-2.5 text-sm font-bold border-t-2 border-primary mt-2"><span>GROSS EARNINGS</span><span className="font-mono">{selected.currency} {selected.grossEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-destructive mb-3 pb-2 border-b-2 border-border">Deductions</h3>
                {selected.deductions.length === 0 && <div className="py-1.5 text-sm text-muted-foreground">No deductions</div>}
                {selected.deductions.map((d, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-sm border-b border-border/50"><span>{d.name}</span><span className="font-mono">{selected.currency} {d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                ))}
                <div className="flex justify-between py-2.5 text-sm font-bold border-t-2 border-destructive mt-2"><span>TOTAL DEDUCTIONS</span><span className="font-mono">{selected.currency} {selected.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 mt-6 rounded-lg bg-primary text-primary-foreground text-lg font-extrabold tracking-wide">
              <span>NET PAY</span>
              <span className="font-mono text-xl">{selected.currency} {selected.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            {selected.employerContribs.length > 0 && (
              <div className="mt-6 pt-4 border-t-2 border-dashed border-border">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Employer Contributions</h3>
                {selected.employerContribs.map((c, i) => (
                  <div key={i} className="flex justify-between py-1 text-sm"><span className="text-muted-foreground">{c.name}</span><span className="font-mono">{selected.currency} {c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                ))}
                <div className="flex justify-between py-2 text-sm font-bold border-t mt-2"><span>Total Employer</span><span className="font-mono">{selected.currency} {selected.employerContributions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
              </div>
            )}
          </div>

          <div className="p-4 border-t text-center text-xs text-muted-foreground">
            This is a system-generated salary slip. For queries, contact HR.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Salary Slips</h1>
          <p className="text-sm text-muted-foreground">View and print salary slips for processed payruns</p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={empFilter} onValueChange={v => v !== null && setEmpFilter(v)}>
          <SelectTrigger className="w-[250px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Employees</SelectItem>
            {employees.map(e => <SelectItem key={e.id} value={`${e.firstName} ${e.lastName}`}>{e.firstName} {e.lastName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Slip #</th>
              <th className="text-left p-3 font-medium">Employee</th>
              <th className="text-left p-3 font-medium">Period</th>
              <th className="text-left p-3 font-medium">Pay Date</th>
              <th className="text-right p-3 font-medium">Gross</th>
              <th className="text-right p-3 font-medium">Deductions</th>
              <th className="text-right p-3 font-medium">Net Pay</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-semibold text-primary">{s.slipNumber}</td>
                <td className="p-3"><div className="font-medium">{s.employeeName}</div><div className="text-xs text-muted-foreground">{s.employeeNumber}</div></td>
                <td className="p-3 font-mono text-xs">{s.periodStart} to {s.periodEnd}</td>
                <td className="p-3 font-mono">{s.payDate}</td>
                <td className="p-3 text-right font-mono">{s.currency} {s.grossEarnings.toLocaleString()}</td>
                <td className="p-3 text-right font-mono text-red-600">{s.currency} {s.totalDeductions.toLocaleString()}</td>
                <td className="p-3 text-right font-mono font-bold">{s.currency} {s.netPay.toLocaleString()}</td>
                <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={() => setSelected(s)}>View Slip</Button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No salary slips found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
