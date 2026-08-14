import { useEffect, useState } from 'react';
import { usePayrollStore } from './stores';
import type { LeaveRequest } from './api/modules/payroll.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, CheckCircle2, XCircle, Clock, Calendar, ArrowLeft, Save } from 'lucide-react';

const EMPTY_FORM = { employeeId: '', leaveType: 'Annual', startDate: '', endDate: '', reason: '' };

export default function LeaveManagement() {
  const { leaveRequests, employees, fetchLeaveRequests, fetchEmployees, createLeaveRequest, actionLeaveRequest } = usePayrollStore();
  const [statusFilter, setStatusFilter] = useState('');
  const [empFilter, setEmpFilter] = useState('');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [actionDialog, setActionDialog] = useState<{ open: boolean; request: LeaveRequest | null; action: 'Approved' | 'Rejected' }>({ open: false, request: null, action: 'Approved' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [actionComment, setActionComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchEmployees(); fetchLeaveRequests(); }, []);

  const filtered = leaveRequests.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (empFilter && r.employeeId !== empFilter) return false;
    return true;
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const getEmpName = (id: string) => { const e = employees.find(x => x.id === id); return e ? `${e.firstName} ${e.lastName}` : 'Unknown'; };

  const calcDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    const ms = new Date(form.endDate).getTime() - new Date(form.startDate).getTime();
    return Math.max(0, Math.floor(ms / 86400000) + 1);
  };
  const calcWorkingDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count++;
    }
    return count;
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createLeaveRequest(form);
    } finally {
      setSaving(false);
    }
    setView('list');
    setForm(EMPTY_FORM);
  };

  const handleAction = async () => {
    if (!actionDialog.request) return;
    await actionLeaveRequest(actionDialog.request.id, actionDialog.action, actionComment);
    setActionDialog({ open: false, request: null, action: 'Approved' });
    setActionComment('');
  };

  const pending = leaveRequests.filter(r => r.status === 'Pending').length;
  const approved = leaveRequests.filter(r => r.status === 'Approved').length;
  const thisMonth = leaveRequests.filter(r => r.status === 'Approved' && new Date(r.startDate).getMonth() === new Date().getMonth()).length;

  if (view === 'form') {
    return (
      <div className="p-6 max-w-[1100px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setView('list')}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">New Leave Request</h1>
              <p className="text-sm text-muted-foreground">Create a leave request for an employee</p>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : 'Submit Request'}</Button>
        </div>

        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <h4 className="text-sm font-bold text-violet-600 mb-3 flex items-center gap-2 border-l-4 border-violet-400 pl-2 justify-start text-left">Employee & Leave Type</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-3"><Label>Employee *</Label><Select value={form.employeeId} onValueChange={v => set('employeeId', v)}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</SelectItem>)}</SelectContent>
              </Select></div>
              <div><Label>Leave Type *</Label><Select value={form.leaveType} onValueChange={v => set('leaveType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">Annual Leave</SelectItem><SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Maternity">Maternity</SelectItem><SelectItem value="Paternity">Paternity</SelectItem>
                  <SelectItem value="Bereavement">Bereavement</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="CompOff">Compensatory Off</SelectItem><SelectItem value="PublicHoliday">Public Holiday</SelectItem>
                </SelectContent>
              </Select></div>
              <div><Label>Total Days (auto)</Label><Input value={form.startDate && form.endDate ? calcDays() : '-'} disabled /></div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="text-sm font-bold text-blue-600 mb-3 flex items-center gap-2 border-l-4 border-blue-400 pl-2 justify-start text-left">Leave Period</h4>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Start Date *</Label><Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
              <div><Label>End Date *</Label><Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} /></div>
              <div><Label>Working Days (auto)</Label><Input value={form.startDate && form.endDate ? calcWorkingDays() : '-'} disabled /></div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
            <h4 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2 border-l-4 border-slate-400 pl-2 justify-start text-left">Reason</h4>
            <div><Label>Reason</Label><Textarea value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Reason for leave..." rows={3} /></div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4 sticky bottom-0 bg-[#f5f7fa] py-3">
          <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : 'Submit Request'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground">Manage employee leave requests, approvals, and balances</p>
        </div>
        <Button onClick={() => setView('form')}><Plus className="mr-2 h-4 w-4" /> New Leave Request</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><Clock className="h-5 w-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{pending}</p><p className="text-xs text-muted-foreground">Pending Approval</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{approved}</p><p className="text-xs text-muted-foreground">Approved (Total)</p></div></div></Card>
        <Card className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center"><Calendar className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{thisMonth}</p><p className="text-xs text-muted-foreground">This Month</p></div></div></Card>
      </div>

      <div className="flex gap-3 items-center">
        <Select value={statusFilter} onValueChange={v => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={empFilter} onValueChange={v => v !== null && setEmpFilter(v)}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Employees</SelectItem>
            {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Employee</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Period</th>
              <th className="text-center p-3 font-medium">Days</th>
              <th className="text-left p-3 font-medium">Reason</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(lr => (
              <tr key={lr.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{getEmpName(lr.employeeId)}</td>
                <td className="p-3"><Badge variant="outline">{lr.leaveType}</Badge></td>
                <td className="p-3 font-mono text-xs">{lr.startDate} → {lr.endDate}</td>
                <td className="p-3 text-center font-semibold">{lr.totalDays}</td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">{lr.reason || '-'}</td>
                <td className="p-3 text-center">
                  <Badge variant={lr.status === 'Pending' ? 'secondary' : lr.status === 'Approved' ? 'default' : 'destructive'}>{lr.status}</Badge>
                </td>
                <td className="p-3 text-right">
                  {lr.status === 'Pending' && (
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="text-green-600" onClick={() => setActionDialog({ open: true, request: lr, action: 'Approved' })}><CheckCircle2 className="h-4 w-4 mr-1" />Approve</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setActionDialog({ open: true, request: lr, action: 'Rejected' })}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No leave requests found</td></tr>}
          </tbody>
        </table>
      </Card>

      <Dialog open={actionDialog.open} onOpenChange={open => setActionDialog(d => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className={actionDialog.action === 'Approved' ? 'text-green-600' : 'text-red-600'}>
              {actionDialog.action === 'Approved' ? 'Approve Leave' : 'Reject Leave'}
            </DialogTitle>
          </DialogHeader>
          {actionDialog.request && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Employee:</span> <strong>{getEmpName(actionDialog.request.employeeId)}</strong></div>
                <div><span className="text-muted-foreground">Type:</span> <strong>{actionDialog.request.leaveType}</strong></div>
                <div><span className="text-muted-foreground">Period:</span> <strong>{actionDialog.request.startDate} to {actionDialog.request.endDate}</strong></div>
                <div><span className="text-muted-foreground">Days:</span> <strong>{actionDialog.request.totalDays}</strong></div>
              </div>
              <div><Label>Comments</Label><Textarea value={actionComment} onChange={e => setActionComment(e.target.value)} placeholder="Optional comments..." rows={2} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(d => ({ ...d, open: false }))}>Cancel</Button>
            <Button variant={actionDialog.action === 'Approved' ? 'default' : 'destructive'} onClick={handleAction}>
              {actionDialog.action === 'Approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}