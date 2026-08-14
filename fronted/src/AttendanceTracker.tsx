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
import { StatCard } from '@/components/ui/stat-card';
import { Plus, Clock, CheckCircle2, XCircle, AlertTriangle, User, ArrowLeft, Save } from 'lucide-react';

const EMPTY_FORM = { employeeId: '', date: new Date().toISOString().split('T')[0], clockIn: '09:00', clockOut: '17:00', breakStart: '', breakEnd: '', regularHours: 8, overtimeHours: 0, nightHours: 0, status: 'Present', notes: '' };

export default function AttendanceTracker() {
  const { attendanceRecords, employees, fetchAttendance, fetchEmployees, recordAttendance } = usePayrollStore();
  const [dateFilter, setDateFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEmployees(); fetchAttendance(); }, []);

  const filtered = attendanceRecords.filter(r => {
    if (dateFilter && r.date !== dateFilter) return false;
    if (empFilter && r.employeeId !== empFilter) return false;
    return true;
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await recordAttendance({ ...form, regularHours: Number(form.regularHours) || 0, overtimeHours: Number(form.overtimeHours) || 0, nightHours: Number(form.nightHours) || 0 });
    } finally {
      setSaving(false);
    }
    setView('list');
    setForm(EMPTY_FORM);
  };

  const getEmpName = (id: string) => { const e = employees.find(x => x.id === id); return e ? `${e.firstName} ${e.lastName}` : 'Unknown'; };
  const getEmpNumber = (id: string) => employees.find(x => x.id === id)?.employeeNumber || '';

  const todayPresent = attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Present').length;
  const todayAbsent = attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Absent').length;
  const todayLate = attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Late').length;

  if (view === 'form') {
    return (
      <div className="p-6 max-w-[1100px] mx-auto space-y-5">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setView('list')}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
          <PageHeader
            title="Record Attendance"
            description="Log a daily attendance entry with clock times and work hours"
          />
          <Button onClick={handleSubmit} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : 'Save Record'}</Button>
        </div>

        <div className="space-y-4">
          <FormSection icon={User} title="Employee & Date" tone="teal">
            <FormField label="Employee" required className="col-span-full"><Select value={form.employeeId} onValueChange={v => set('employeeId', v)}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</SelectItem>)}</SelectContent>
            </Select></FormField>
            <FormField label="Date" required><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></FormField>
            <FormField label="Status"><Select value={form.status} onValueChange={v => v !== null && set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Present">Present</SelectItem><SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="Late">Late</SelectItem><SelectItem value="HalfDay">Half Day</SelectItem>
                <SelectItem value="OnLeave">On Leave</SelectItem><SelectItem value="Holiday">Holiday</SelectItem>
              </SelectContent>
            </Select></FormField>
          </FormSection>

          <FormSection icon={Clock} title="Clock Times" tone="blue" columns={4}>
            <FormField label="Clock In"><Input type="time" value={form.clockIn} onChange={e => set('clockIn', e.target.value)} /></FormField>
            <FormField label="Clock Out"><Input type="time" value={form.clockOut} onChange={e => set('clockOut', e.target.value)} /></FormField>
            <FormField label="Break Start"><Input type="time" value={form.breakStart} onChange={e => set('breakStart', e.target.value)} /></FormField>
            <FormField label="Break End"><Input type="time" value={form.breakEnd} onChange={e => set('breakEnd', e.target.value)} /></FormField>
          </FormSection>

          <FormSection icon={Clock} title="Work Hours" tone="emerald">
            <FormField label="Regular Hours"><Input type="number" step="0.5" value={form.regularHours} onChange={e => set('regularHours', e.target.value)} /></FormField>
            <FormField label="Overtime Hours"><Input type="number" step="0.5" value={form.overtimeHours} onChange={e => set('overtimeHours', e.target.value)} /></FormField>
            <FormField label="Night Shift Hours"><Input type="number" step="0.5" value={form.nightHours} onChange={e => set('nightHours', e.target.value)} /></FormField>
          </FormSection>

          <FormSection icon={User} title="Additional Notes" tone="slate">
            <FormField label="Notes"><Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." /></FormField>
          </FormSection>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4 sticky bottom-0 bg-background py-3">
          <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : 'Save Record'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Attendance Tracker"
        description="Track daily attendance, clock-in/out, and work hours"
        actions={<Button onClick={() => setView('form')}><Plus className="mr-2 h-4 w-4" /> Record Attendance</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={CheckCircle2} label="Present Today" value={todayPresent} tone="green" />
        <StatCard icon={XCircle} label="Absent Today" value={todayAbsent} tone="red" />
        <StatCard icon={AlertTriangle} label="Late Today" value={todayLate} tone="amber" />
      </div>

      <div className="flex gap-3 items-center">
        <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-[180px]" />
        <Select value={empFilter} onValueChange={v => v !== null && setEmpFilter(v)}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Employees</SelectItem>
            {employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Employee</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Clock In</th>
              <th className="text-left p-3 font-medium">Clock Out</th>
              <th className="text-center p-3 font-medium">Hours</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs"><User className="h-3.5 w-3.5" /></div>
                    <div><div className="font-medium">{getEmpName(r.employeeId)}</div><div className="text-xs text-muted-foreground">{getEmpNumber(r.employeeId)}</div></div>
                  </div>
                </td>
                <td className="p-3 font-mono">{r.date}</td>
                <td className="p-3"><div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-green-600" />{r.clockIn || '-'}</div></td>
                <td className="p-3"><div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-red-600" />{r.clockOut || '-'}</div></td>
                <td className="p-3 text-center font-mono">{(r.regularHours || 0) + (r.overtimeHours || 0) + (r.nightHours || 0)}h</td>
                <td className="p-3 text-center">
                  <Badge variant={r.status === 'Present' ? 'default' : r.status === 'Absent' ? 'destructive' : r.status === 'Late' ? 'secondary' : 'outline'}>{r.status}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">{r.notes || '-'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No attendance records found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}