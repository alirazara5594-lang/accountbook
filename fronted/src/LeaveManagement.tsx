import { useEffect, useState } from 'react';
import { usePayrollStore } from './stores';
import type { LeaveRequest } from './api/modules/payroll.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormSection } from '@/components/ui/form-section';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
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
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setView('list')}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
          <PageHeader
            title="New Leave Request"
            description="Create a leave request for an employee"
          />
          <Button onClick={handleCreate} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : 'Submit Request'}</Button>
        </div>

        <div className="space-y-4">
          <FormSection icon={Calendar} title="Employee & Leave Type" tone="violet">
            <FormField label="Employee" required className="col-span-full"><Select value={form.employeeId} onValueChange={v => set('employeeId', v)}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.employeeNumber})</SelectItem>)}</SelectContent>
            </Select></FormField>
            <FormField label="Leave Type" required><Select value={form.leaveType} onValueChange={v => set('leaveType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Annual">Annual Leave</SelectItem><SelectItem value="Sick">Sick Leave</SelectItem>
                <SelectItem value="Maternity">Maternity</SelectItem><SelectItem value="Paternity">Paternity</SelectItem>
                <SelectItem value="Bereavement">Bereavement</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="CompOff">Compensatory Off</SelectItem><SelectItem value="PublicHoliday">Public Holiday</SelectItem>
              </SelectContent>
            </Select></FormField>
            <FormField label="Total Days (auto)"><Input value={form.startDate && form.endDate ? calcDays() : '-'} disabled /></FormField>
          </FormSection>

          <FormSection icon={Calendar} title="Leave Period" tone="blue">
            <FormField label="Start Date" required><Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></FormField>
            <FormField label="End Date" required><Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} /></FormField>
            <FormField label="Working Days (auto)"><Input value={form.startDate && form.endDate ? calcWorkingDays() : '-'} disabled /></FormField>
          </FormSection>

          <FormSection icon={Calendar} title="Reason" tone="slate">
            <FormField label="Reason"><Textarea value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Reason for leave..." rows={3} /></FormField>
          </FormSection>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4 sticky bottom-0 bg-background py-3">
          <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : 'Submit Request'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Leave Management"
        description="Manage employee leave requests, approvals, and balances"
        actions={<Button onClick={() => setView('form')}><Plus className="mr-2 h-4 w-4" /> New Leave Request</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Approval', value: pending, desc: 'Awaiting manager review', icon: Clock, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400' },
          { label: 'Approved (Total)', value: approved, desc: 'All approved leave requests', icon: CheckCircle2, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50 dark:bg-green-950/30', textColor: 'text-green-600 dark:text-green-400' },
          { label: 'This Month', value: thisMonth, desc: 'Approved leaves this month', icon: Calendar, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400' },
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