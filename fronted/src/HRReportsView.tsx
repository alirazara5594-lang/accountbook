import { useEffect, useMemo } from 'react';
import { usePayrollStore } from './stores';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, CalendarCheck2, HeartPulse, Banknote, Wallet, TrendingUp, Globe2, Building2, AlertTriangle, UserCheck } from 'lucide-react';
import { money } from './lib/currency';

const COUNTRY_OPTIONS: Record<string, string> = {
  US: 'United States', CA: 'Canada', UK: 'United Kingdom', DE: 'Germany', FR: 'France', NL: 'Netherlands',
  BE: 'Belgium', ES: 'Spain', IT: 'Italy', PL: 'Poland', PK: 'Pakistan', SA: 'Saudi Arabia', AE: 'UAE',
};

export default function HRReportsView() {
  const { employees, departments, leaveRequests, attendanceRecords, payruns, salarySlips, loans, fetchAll } = usePayrollStore();

  useEffect(() => { fetchAll(); }, []);

  const active = employees.filter(e => e.status === 'Active');
  const onLeave = employees.filter(e => e.status === 'OnLeave');
  const terminated = employees.filter(e => e.status === 'Terminated');

  const headcount = useMemo(() => {
    const map = new Map<string, { total: number; active: number }>();
    employees.forEach(e => {
      const key = e.departmentId || 'Unassigned';
      const cur = map.get(key) || { total: 0, active: 0 };
      cur.total++;
      if (e.status === 'Active') cur.active++;
      map.set(key, cur);
    });
    return Array.from(map.entries()).map(([deptId, v]) => ({
      deptId,
      deptName: departments.find(d => d.id === deptId)?.name || 'Unassigned',
      ...v,
    })).sort((a, b) => b.total - a.total);
  }, [employees, departments]);

  const countryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach(e => { map.set(e.country, (map.get(e.country) || 0) + 1); });
    return Array.from(map.entries()).map(([code, count]) => ({ code, label: COUNTRY_OPTIONS[code] || code, count })).sort((a, b) => b.count - a.count);
  }, [employees]);

  const attendanceStats = useMemo(() => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'Present').length;
    const late = attendanceRecords.filter(r => r.status === 'Late').length;
    const absent = attendanceRecords.filter(r => r.status === 'Absent').length;
    const avgHours = total ? attendanceRecords.reduce((s, r) => s + (r.regularHours || 0) + (r.overtimeHours || 0) + (r.nightHours || 0), 0) / total : 0;
    return { total, present, late, absent, avgHours: avgHours.toFixed(1) };
  }, [attendanceRecords]);

  const leaveStats = useMemo(() => {
    const byType = new Map<string, { total: number; days: number; approved: number; pending: number }>();
    leaveRequests.forEach(r => {
      const cur = byType.get(r.leaveType) || { total: 0, days: 0, approved: 0, pending: 0 };
      cur.total++;
      cur.days += r.totalDays || 0;
      if (r.status === 'Approved') cur.approved++;
      if (r.status === 'Pending') cur.pending++;
      byType.set(r.leaveType, cur);
    });
    return Array.from(byType.entries()).map(([type, v]) => ({ type, ...v })).sort((a, b) => b.days - a.days);
  }, [leaveRequests]);

  const payrollSummary = useMemo(() => {
    const posted = payruns.filter(p => p.status === 'Posted');
    const totalGross = salarySlips.reduce((s, slip) => s + slip.grossEarnings, 0);
    const totalDeductions = salarySlips.reduce((s, slip) => s + slip.totalDeductions, 0);
    const totalNet = salarySlips.reduce((s, slip) => s + slip.netPay, 0);
    return { runs: posted.length, totalGross, totalDeductions, totalNet };
  }, [payruns, salarySlips]);

  const loanSummary = useMemo(() => {
    const outstanding = loans.filter(l => l.status === 'Active').reduce((s, l) => s + l.balanceAmount, 0);
    const disbursed = loans.reduce((s, l) => s + l.principalAmount, 0);
    return { outstanding, disbursed, active: loans.filter(l => l.status === 'Active').length };
  }, [loans]);

  const avgSalary = active.length ? active.reduce((s, e) => s + e.basicSalary, 0) / active.length : 0;

  const perCapitaTable = useMemo(() => {
    return headcount.map(h => ({
      deptName: h.deptName,
      headcount: h.total,
      active: h.active,
      salaryCost: employees.filter(e => (e.departmentId || 'Unassigned') === h.deptId && e.status === 'Active').reduce((s, e) => s + e.basicSalary, 0),
    }));
  }, [headcount, employees]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-6">
      <PageHeader
        title="HR Reports"
        description="Headcount, attendance, leave, payroll cost, and loan analytics across your workforce"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={Users} label="Total Headcount" value={employees.length} tone="teal" />
        <StatCard icon={UserCheck} label="Active Employees" value={active.length} tone="green" />
        <StatCard icon={HeartPulse} label="On Leave" value={onLeave.length} tone="amber" />
        <StatCard icon={AlertTriangle} label="Terminated" value={terminated.length} tone="red" />
        <StatCard icon={Banknote} label="Avg. Basic Salary" value={money(avgSalary)} tone="blue" />
      </div>

      <Tabs defaultValue="headcount">
        <TabsList>
          <TabsTrigger value="headcount"><Users className="h-4 w-4" /> Headcount</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck2 className="h-4 w-4" /> Attendance</TabsTrigger>
          <TabsTrigger value="leave"><HeartPulse className="h-4 w-4" /> Leave</TabsTrigger>
          <TabsTrigger value="payroll"><Banknote className="h-4 w-4" /> Payroll Cost</TabsTrigger>
          <TabsTrigger value="loans"><Wallet className="h-4 w-4" /> Loans</TabsTrigger>
        </TabsList>

        <TabsContent value="headcount" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <div className="border-b px-5 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Building2 className="h-4 w-4 text-primary" /> Headcount by Department</h3>
              </div>
              <div className="p-5">
                {perCapitaTable.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No employee data available</p>}
                {perCapitaTable.map(d => {
                  const pct = employees.length ? (d.headcount / employees.length) * 100 : 0;
                  return (
                    <div key={d.deptName} className="mb-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{d.deptName}</span>
                        <span className="text-xs text-muted-foreground">{d.headcount} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card>
              <div className="border-b px-5 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground"><Globe2 className="h-4 w-4 text-primary" /> Headcount by Country</h3>
              </div>
              <div className="p-5">
                {countryBreakdown.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No employee data available</p>}
                {countryBreakdown.map(c => {
                  const pct = employees.length ? (c.count / employees.length) * 100 : 0;
                  return (
                    <div key={c.code} className="mb-4">
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium">{c.label}</span>
                        <span className="text-xs text-muted-foreground">{c.count} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Department Headcount & Salary Cost</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Headcount</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Annual Salary Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perCapitaTable.map(d => (
                  <TableRow key={d.deptName}>
                    <TableCell className="font-medium">{d.deptName}</TableCell>
                    <TableCell className="text-right">{d.headcount}</TableCell>
                    <TableCell className="text-right">{d.active}</TableCell>
                    <TableCell className="text-right font-mono">{money(d.salaryCost)}</TableCell>
                  </TableRow>
                ))}
                {perCapitaTable.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={CalendarCheck2} label="Records Tracked" value={attendanceStats.total} tone="teal" />
            <StatCard icon={UserCheck} label="Present" value={attendanceStats.present} tone="green" />
            <StatCard icon={AlertTriangle} label="Late Arrivals" value={attendanceStats.late} tone="amber" />
            <StatCard icon={TrendingUp} label="Avg Hours / Day" value={attendanceStats.avgHours} tone="blue" />
          </div>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.filter(e => attendanceRecords.some(r => r.employeeId === e.id)).slice(0, 20).map(e => {
                  const recs = attendanceRecords.filter(r => r.employeeId === e.id);
                  const hours = recs.reduce((s, r) => s + (r.regularHours || 0) + (r.overtimeHours || 0) + (r.nightHours || 0), 0);
                  const ot = recs.reduce((s, r) => s + (r.overtimeHours || 0), 0);
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{e.firstName[0]}{e.lastName[0]}</div>
                          <div><div className="font-medium">{e.firstName} {e.lastName}</div><div className="text-xs text-muted-foreground">{e.employeeNumber}</div></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{hours}h</TableCell>
                      <TableCell className="text-right font-mono">{ot}h</TableCell>
                      <TableCell className="text-right">{recs.length}</TableCell>
                    </TableRow>
                  );
                })}
                {attendanceRecords.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No attendance data yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={HeartPulse} label="Leave Requests" value={leaveRequests.length} tone="teal" />
            <StatCard icon={UserCheck} label="Approved" value={leaveRequests.filter(r => r.status === 'Approved').length} tone="green" />
            <StatCard icon={AlertTriangle} label="Pending" value={leaveRequests.filter(r => r.status === 'Pending').length} tone="amber" />
            <StatCard icon={CalendarCheck2} label="Total Days Taken" value={leaveRequests.filter(r => r.status === 'Approved').reduce((s, r) => s + (r.totalDays || 0), 0)} tone="blue" />
          </div>
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Leave by Type</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Days</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveStats.map(l => (
                  <TableRow key={l.type}>
                    <TableCell className="font-medium">{l.type}</TableCell>
                    <TableCell className="text-right">{l.total}</TableCell>
                    <TableCell className="text-right font-mono">{l.days}</TableCell>
                    <TableCell className="text-right"><Badge variant="default">{l.approved}</Badge></TableCell>
                    <TableCell className="text-right"><Badge variant="secondary">{l.pending}</Badge></TableCell>
                  </TableRow>
                ))}
                {leaveStats.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No leave data yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Banknote} label="Posted Payruns" value={payrollSummary.runs} tone="teal" />
            <StatCard icon={TrendingUp} label="Gross Payroll" value={money(payrollSummary.totalGross)} tone="green" />
            <StatCard icon={Wallet} label="Total Deductions" value={money(payrollSummary.totalDeductions)} tone="amber" />
            <StatCard icon={UserCheck} label="Net Pay Issued" value={money(payrollSummary.totalNet)} tone="blue" />
          </div>
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-semibold text-foreground">Salary Slips Issued</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salarySlips.slice(0, 25).map(slip => (
                  <TableRow key={slip.id}>
                    <TableCell>
                      <div><div className="font-medium">{slip.employeeName}</div><div className="text-xs text-muted-foreground">{slip.employeeNumber}</div></div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{slip.periodStart} → {slip.periodEnd}</TableCell>
                    <TableCell className="text-right font-mono">{slip.currency} {slip.grossEarnings.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-red-600">{slip.currency} {slip.totalDeductions.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{slip.currency} {slip.netPay.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {salarySlips.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No salary slips yet — run a payroll to see data</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="loans" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard icon={Wallet} label="Total Disbursed" value={money(loanSummary.disbursed)} tone="teal" />
            <StatCard icon={Banknote} label="Outstanding Balance" value={money(loanSummary.outstanding)} tone="amber" />
            <StatCard icon={UserCheck} label="Active Loans" value={loanSummary.active} tone="green" />
          </div>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Principal</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono font-semibold">{l.loanNumber}</TableCell>
                    <TableCell>{l.loanType}</TableCell>
                    <TableCell className="text-right font-mono">{l.principalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">{l.balanceAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{l.paidInstallments}/{l.totalInstallments}</TableCell>
                    <TableCell className="text-right"><Badge variant={l.status === 'Active' ? 'default' : l.status === 'Completed' ? 'secondary' : 'destructive'}>{l.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {loans.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No loans yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}