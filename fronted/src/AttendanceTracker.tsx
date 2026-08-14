import { useEffect, useState } from 'react';
import { usePayrollStore } from './stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Clock, CheckCircle2, XCircle, AlertTriangle, User } from 'lucide-react';

export default function AttendanceTracker() {
  const { attendanceRecords, employees, fetchAttendance, fetchEmployees, recordAttendance } = usePayrollStore();
  const [dateFilter, setDateFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: '', date: new Date().toISOString().split('T')[0], clockIn: '09:00', clockOut: '17:00', breakStart: '', breakEnd: '', regularHours: 8, overtimeHours: 0, nightHours: 0, status: 'Present', notes: '' });

  useEffect(() => { fetchEmployees(); fetchAttendance(); }, []);

  const filtered = attendanceRecords.filter(r => {
    if (dateFilter && r.date !== dateFilter) return false;
    if (empFilter && r.employeeId !== empFilter) return false;
    return true;
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    await recordAttendance({ ...form, regularHours: Number(form.regularHours) || 0, overtimeHours: Number(form.overtimeHours) || 0, nightHours: Number(form.nightHours) || 0 });
    setDialogOpen(false);
    setForm({ employeeId: '', date: new Date().toISOString().split('T')[0], clockIn: '09:00', clockOut: '17:00', breakStart: '', breakEnd: '', regularHours: 8, overtimeHours: 0, nightHours: 0, status: 'Present', notes: '' });
  };

  const getEmpName = (id: string) => { const e = employees.find(x => x.id === id); return e ? `${e.firstName} ${e.lastName}` : 'Unknown'; };
  const getEmpNumber = (id: string) => employees.find(x => x.id === id)?.employeeNumber || '';

  const todayPresent = attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Present').length;
  const todayAbsent = attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Absent').length;
  const todayLate = attendanceRecords.filter(r => r.date === new Date().toISOString().split('T')[0] && r.status === 'Late').length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Tracker</h1>
          <p className="text-sm text-muted-foreground">Track daily attendance, clock-in/out, and work hours</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Record Attendance</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{todayPresent}</p><p className="text-xs text-muted-foreground">Present Today</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center"><XCircle className="h-5 w-5 text-red-600" /></div><div><p className="text-2xl font-bold">{todayAbsent}</p><p className="text-xs text-muted-foreground">Absent Today</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{todayLate}</p><p className="text-xs text-muted-foreground">Late Today</p></div></div></Card>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Attendance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-3 flex items-center gap-2 border-l-3 border-teal-400 pl-2">Employee & Date</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Employee *</Label><Select value={form.employeeId} onValueChange={v => set('employeeId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</SelectItem>)}</SelectContent>
                </Select></div>
                <div><Label>Date *</Label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} /></div>
                <div><Label>Status</Label><Select value={form.status} onValueChange={v => v !== null && set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Present">Present</SelectItem><SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="Late">Late</SelectItem><SelectItem value="HalfDay">Half Day</SelectItem>
                    <SelectItem value="OnLeave">On Leave</SelectItem><SelectItem value="Holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select></div>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2 border-l-3 border-blue-400 pl-2">Clock Times</h4>
              <div className="grid grid-cols-4 gap-4">
                <div><Label>Clock In</Label><Input type="time" value={form.clockIn} onChange={e => set('clockIn', e.target.value)} /></div>
                <div><Label>Clock Out</Label><Input type="time" value={form.clockOut} onChange={e => set('clockOut', e.target.value)} /></div>
                <div><Label>Break Start</Label><Input type="time" value={form.breakStart} onChange={e => set('breakStart', e.target.value)} /></div>
                <div><Label>Break End</Label><Input type="time" value={form.breakEnd} onChange={e => set('breakEnd', e.target.value)} /></div>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2 border-l-3 border-emerald-400 pl-2">Work Hours</h4>
              <div className="grid grid-cols-3 gap-4">
                <div><Label>Regular Hours</Label><Input type="number" step="0.5" value={form.regularHours} onChange={e => set('regularHours', e.target.value)} /></div>
                <div><Label>Overtime Hours</Label><Input type="number" step="0.5" value={form.overtimeHours} onChange={e => set('overtimeHours', e.target.value)} /></div>
                <div><Label>Night Shift Hours</Label><Input type="number" step="0.5" value={form.nightHours} onChange={e => set('nightHours', e.target.value)} /></div>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2 border-l-3 border-slate-400 pl-2">Additional Notes</h4>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Record</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
