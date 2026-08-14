import { useState, useEffect } from 'react';
import { useFieldOperationsStore, usePayrollStore, useCustomersStore } from './stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import {
  Plus, ClipboardList, CalendarCheck2, ShieldCheck, Wrench, ReceiptText, Save, CheckCircle2, AlertTriangle, TrendingUp, FileBarChart, Clock3, Wallet
} from 'lucide-react';

const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const today = () => new Date().toISOString().split('T')[0];

const SURVEY_CATEGORIES = ['Customer Satisfaction', 'Quality', 'Market Research', 'Employee Engagement', 'Compliance', 'Product Feedback'];
const VISIT_TYPES = ['Site Visit', 'Support Visit', 'Audit Visit', 'Sales Visit', 'Maintenance Visit'];
const INSPECTION_TYPES = ['Quality', 'Safety', 'Compliance', 'Inventory', 'Facility'];
const WORK_TYPES = ['Repair', 'Installation', 'Maintenance', 'Inspection', 'Delivery'];
const EXPENSE_CATEGORIES = ['Travel', 'Supplies', 'Meals', 'Fuel', 'Accommodation', 'Equipment'];

const surveyBadge = (s: string) => (s === 'Active' ? 'default' : s === 'Closed' ? 'secondary' : 'outline');
const visitBadge = (s: string) => (s === 'Completed' ? 'secondary' : s === 'Cancelled' ? 'destructive' : 'default');
const inspectionBadge = (s: string) => (s === 'Passed' ? 'secondary' : s === 'Failed' ? 'destructive' : s === 'InProgress' ? 'default' : 'outline');
const woBadge = (s: string) => (s === 'Completed' ? 'secondary' : s === 'Cancelled' ? 'destructive' : s === 'InProgress' || s === 'Assigned' ? 'default' : 'outline');

const EMPTY_SURVEY = { title: '', description: '', category: 'Customer Satisfaction', status: 'Draft', startDate: today(), endDate: '', region: '', assignedTo: '', targetResponses: '100' };
const EMPTY_VISIT = { visitType: 'Site Visit', customerId: '', customerName: '', contactName: '', purpose: '', scheduledDate: today(), startTime: '10:00', durationHours: 2, status: 'Scheduled', location: '', assignedTo: '', findings: '' };
const EMPTY_INSPECTION = { inspectionType: 'Quality', location: '', scheduledDate: today(), inspectorId: '', status: 'Scheduled', score: 0, findings: '', reference: '' };
const EMPTY_WORK_ORDER = { workType: 'Repair', customerId: '', customerName: '', description: '', priority: 'Medium', status: 'Open', assignedTo: '', scheduledDate: today(), laborHours: 0, laborCost: 0, partsCost: 0, location: '' };
const EMPTY_EXPENSE = { workOrderId: '', category: 'Travel', description: '', amount: '0', currency: 'USD', expenseDate: today(), reimbursed: false };

function useFieldData() {
  const store = useFieldOperationsStore();
  const { employees, fetchAll: fetchPayrollAll } = usePayrollStore();
  const { customers, fetchCustomers } = useCustomersStore();
  useEffect(() => { store.fetchAll(); fetchPayrollAll(); fetchCustomers(); }, []);
  return { ...store, employees, customers };
}

const empName = (employees: any[], id?: string) => {
  const e = employees.find(x => x.id === id);
  return e ? `${e.firstName} ${e.lastName}` : 'Unassigned';
};
const custName = (customers: any[], id?: string) => customers.find(c => c.id === id)?.name || '—';

// ── Summary (module overview) ─────────────────────────────────────────────────
export function FieldOperationsSummaryView() {
  const { dashboard, surveys, expenses } = useFieldData();
  const responses = surveys.reduce((s, x) => s + x.responseCount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Survey & Field Operations" description="Manage surveys, field visits, inspections, field work orders, and expenses" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Active Surveys" value={dashboard?.activeSurveys ?? 0} tone="teal" />
        <StatCard icon={CalendarCheck2} label="Upcoming Visits" value={dashboard?.upcomingVisits ?? 0} tone="blue" />
        <StatCard icon={Wrench} label="Open Work Orders" value={dashboard?.openOrders ?? 0} tone="amber" />
        <StatCard icon={ShieldCheck} label="Pending Inspections" value={dashboard?.pendingInspections ?? 0} tone="violet" />
        <StatCard icon={TrendingUp} label="Survey Responses" value={responses} tone="green" />
        <StatCard icon={CheckCircle2} label="Completed Visits" value={dashboard?.completedVisits ?? 0} tone="cyan" />
        <StatCard icon={AlertTriangle} label="Failed Inspections" value={dashboard?.failedInspections ?? 0} tone="red" />
        <StatCard icon={ReceiptText} label="Field Expenses" value={money(totalExpenses)} tone="amber" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Surveys</p>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Total</span><span className="font-medium">{dashboard?.surveys ?? 0}</span></div>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Active</span><span className="font-medium">{dashboard?.activeSurveys ?? 0}</span></div>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Responses</span><span className="font-medium">{dashboard?.totalResponses ?? 0}</span></div>
        </Card>
        <Card className="p-4 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2"><CalendarCheck2 className="h-4 w-4" /> Field Visits</p>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Total</span><span className="font-medium">{dashboard?.visits ?? 0}</span></div>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Upcoming</span><span className="font-medium">{dashboard?.upcomingVisits ?? 0}</span></div>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Completed</span><span className="font-medium">{dashboard?.completedVisits ?? 0}</span></div>
        </Card>
        <Card className="p-4 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2"><Wrench className="h-4 w-4" /> Work Orders</p>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Total</span><span className="font-medium">{dashboard?.workOrders ?? 0}</span></div>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Open</span><span className="font-medium">{dashboard?.openOrders ?? 0}</span></div>
          <div className="flex justify-between text-sm text-muted-foreground"><span>Cost to date</span><span className="font-medium">{money(dashboard?.totalOrderCost ?? 0)}</span></div>
        </Card>
      </div>
    </div>
  );
}

// ── Surveys ───────────────────────────────────────────────────────────────────
export function SurveysView({ activeEntityId }: { activeEntityId?: string }) {
  const { surveys, employees, createSurvey, setSurveyStatus } = useFieldData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_SURVEY);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await createSurvey({ title: form.title, description: form.description, category: form.category, status: form.status, startDate: form.startDate, endDate: form.endDate || null, region: form.region, assignedTo: form.assignedTo || null, targetResponses: Number(form.targetResponses) || 0, companyId: activeEntityId || null });
      setForm(EMPTY_SURVEY);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const active = surveys.filter(s => s.status === 'Active').length;
  const responses = surveys.reduce((s, x) => s + x.responseCount, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Surveys" description="Launch and track customer and field surveys" actions={<Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" /> New Survey</Button>} />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Surveys" value={surveys.length} tone="teal" />
        <StatCard icon={TrendingUp} label="Active" value={active} tone="blue" />
        <StatCard icon={CheckCircle2} label="Closed" value={surveys.filter(s => s.status === 'Closed').length} tone="green" />
        <StatCard icon={AlertTriangle} label="Responses" value={responses} tone="amber" />
      </div>
      {showForm && (
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3"><FormField label="Title"><Input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Survey title" /></FormField></div>
            <div className="col-span-2"><FormField label="Category"><Select value={form.category} onValueChange={v => v !== null && setF('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SURVEY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Region"><Input value={form.region} onChange={e => setF('region', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Start Date"><Input type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Target"><Input type="number" value={form.targetResponses} onChange={e => setF('targetResponses', e.target.value)} /></FormField></div>
            <div className="col-span-2"><Button onClick={save} disabled={saving || !form.title}><Save className="mr-1.5 h-4 w-4" />Create</Button></div>
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Survey</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Region</th>
              <th className="text-left p-3 font-medium">Assigned</th>
              <th className="text-right p-3 font-medium">Responses</th>
              <th className="text-center p-3 font-medium">Progress</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map(s => {
              const pct = s.targetResponses > 0 ? Math.min(100, Math.round((s.responseCount / s.targetResponses) * 100)) : 0;
              return (
                <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3"><p className="font-semibold">{s.title}</p><p className="font-mono text-xs text-muted-foreground">{s.surveyNumber}</p></td>
                  <td className="p-3"><Badge variant="outline">{s.category}</Badge></td>
                  <td className="p-3">{s.region || '—'}</td>
                  <td className="p-3">{empName(employees, s.assignedTo)}</td>
                  <td className="p-3 text-right font-mono">{s.responseCount}/{s.targetResponses}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-center"><Badge variant={surveyBadge(s.status) as any}>{s.status}</Badge></td>
                  <td className="p-3 text-right">
                    {s.status === 'Draft' && <Button size="sm" variant="ghost" onClick={() => setSurveyStatus(s.id, 'Active')}>Launch</Button>}
                    {s.status === 'Active' && <Button size="sm" variant="ghost" onClick={() => setSurveyStatus(s.id, 'Closed')}>Close</Button>}
                  </td>
                </tr>
              );
            })}
            {surveys.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No surveys found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Field Visits ─────────────────────────────────────────────────────────────
export function FieldVisitsView({ activeEntityId }: { activeEntityId?: string }) {
  const { visits, customers, employees, createVisit, setVisitStatus } = useFieldData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_VISIT);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await createVisit({ visitType: form.visitType, customerId: form.customerId || null, customerName: form.customerName, contactName: form.contactName, purpose: form.purpose, scheduledDate: form.scheduledDate, startTime: form.startTime || null, durationHours: Number(form.durationHours) || 0, status: form.status, location: form.location, assignedTo: form.assignedTo || null, findings: form.findings, companyId: activeEntityId || null });
      setForm(EMPTY_VISIT);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Field Visits" description="Schedule and complete on-site field visits" actions={<Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" /> Schedule Visit</Button>} />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck2} label="Total Visits" value={visits.length} tone="teal" />
        <StatCard icon={Clock3} label="Upcoming" value={visits.filter(v => v.status === 'Scheduled').length} tone="blue" />
        <StatCard icon={TrendingUp} label="In Progress" value={visits.filter(v => v.status === 'InProgress').length} tone="amber" />
        <StatCard icon={CheckCircle2} label="Completed" value={visits.filter(v => v.status === 'Completed').length} tone="green" />
      </div>
      {showForm && (
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-2"><FormField label="Type"><Select value={form.visitType} onValueChange={v => v !== null && setF('visitType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VISIT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Customer"><Select value={form.customerId} onValueChange={v => { if (v !== null) { setF('customerId', v); setF('customerName', custName(customers, v)); } }}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Contact"><Input value={form.contactName} onChange={e => setF('contactName', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Purpose"><Input value={form.purpose} onChange={e => setF('purpose', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Date"><Input type="date" value={form.scheduledDate} onChange={e => setF('scheduledDate', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Location"><Input value={form.location} onChange={e => setF('location', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Assignee"><Select value={form.assignedTo} onValueChange={v => v !== null && setF('assignedTo', v)}>
              <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-1"><Button onClick={save} disabled={saving || !form.purpose}><Save className="mr-1.5 h-4 w-4" />Schedule</Button></div>
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Visit</th>
              <th className="text-left p-3 font-medium">Customer</th>
              <th className="text-left p-3 font-medium">Purpose</th>
              <th className="text-right p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Assignee</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.map(v => (
              <tr key={v.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-medium">{v.visitNumber}</td>
                <td className="p-3"><p className="font-medium">{v.customerName || '—'}</p><p className="text-xs text-muted-foreground">{v.visitType}</p></td>
                <td className="p-3 text-muted-foreground max-w-[240px] truncate">{v.purpose}</td>
                <td className="p-3 text-right">{v.scheduledDate}</td>
                <td className="p-3">{empName(employees, v.assignedTo)}</td>
                <td className="p-3 text-center"><Badge variant={visitBadge(v.status) as any}>{v.status}</Badge></td>
                <td className="p-3 text-right">
                  {v.status === 'Scheduled' && <Button size="sm" variant="ghost" onClick={() => setVisitStatus(v.id, 'InProgress')}>Start</Button>}
                  {v.status === 'InProgress' && <Button size="sm" variant="ghost" onClick={() => setVisitStatus(v.id, 'Completed')}>Complete</Button>}
                </td>
              </tr>
            ))}
            {visits.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No field visits found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Inspections ──────────────────────────────────────────────────────────────
export function InspectionsView({ activeEntityId }: { activeEntityId?: string }) {
  const { inspections, employees, createInspection, setInspectionStatus } = useFieldData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_INSPECTION);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await createInspection({ inspectionType: form.inspectionType, location: form.location, scheduledDate: form.scheduledDate, inspectorId: form.inspectorId || null, status: form.status, score: Number(form.score) || 0, findings: form.findings, reference: form.reference || null, companyId: activeEntityId || null });
      setForm(EMPTY_INSPECTION);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Inspections" description="Schedule and record field inspection results" actions={<Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" /> Schedule Inspection</Button>} />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ShieldCheck} label="Total Inspections" value={inspections.length} tone="teal" />
        <StatCard icon={Clock3} label="Scheduled" value={inspections.filter(i => i.status === 'Scheduled').length} tone="blue" />
        <StatCard icon={CheckCircle2} label="Passed" value={inspections.filter(i => i.status === 'Passed').length} tone="green" />
        <StatCard icon={AlertTriangle} label="Failed" value={inspections.filter(i => i.status === 'Failed').length} tone="red" />
      </div>
      {showForm && (
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-2"><FormField label="Type"><Select value={form.inspectionType} onValueChange={v => v !== null && setF('inspectionType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INSPECTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Location"><Input value={form.location} onChange={e => setF('location', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Date"><Input type="date" value={form.scheduledDate} onChange={e => setF('scheduledDate', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Inspector"><Select value={form.inspectorId} onValueChange={v => v !== null && setF('inspectorId', v)}>
              <SelectTrigger><SelectValue placeholder="Inspector" /></SelectTrigger>
              <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Reference"><Input value={form.reference} onChange={e => setF('reference', e.target.value)} /></FormField></div>
            <div className="col-span-2"><Button onClick={save} disabled={saving || !form.location}><Save className="mr-1.5 h-4 w-4" />Schedule</Button></div>
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Inspection</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Location</th>
              <th className="text-right p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Inspector</th>
              <th className="text-right p-3 font-medium">Score</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inspections.map(i => (
              <tr key={i.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-medium">{i.inspectionNumber}</td>
                <td className="p-3">{i.inspectionType}</td>
                <td className="p-3">{i.location || '—'}</td>
                <td className="p-3 text-right">{i.scheduledDate}</td>
                <td className="p-3">{empName(employees, i.inspectorId)}</td>
                <td className="p-3 text-right font-mono">{i.score || '—'}</td>
                <td className="p-3 text-center"><Badge variant={inspectionBadge(i.status) as any}>{i.status}</Badge></td>
                <td className="p-3 text-right">
                  {i.status === 'Scheduled' && <Button size="sm" variant="ghost" onClick={() => setInspectionStatus(i.id, 'InProgress')}>Start</Button>}
                  {i.status === 'InProgress' && <Button size="sm" variant="ghost" className="text-green-700" onClick={() => setInspectionStatus(i.id, 'Passed')}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Pass</Button>}
                  {i.status === 'InProgress' && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setInspectionStatus(i.id, 'Failed')}>Fail</Button>}
                </td>
              </tr>
            ))}
            {inspections.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No inspections found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Work Orders ──────────────────────────────────────────────────────────────
export function WorkOrdersView({ activeEntityId }: { activeEntityId?: string }) {
  const { workOrders, customers, employees, createWorkOrder, setWorkOrderStatus } = useFieldData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_WORK_ORDER);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await createWorkOrder({ workType: form.workType, customerId: form.customerId || null, customerName: form.customerName, description: form.description, priority: form.priority, status: form.status, assignedTo: form.assignedTo || null, scheduledDate: form.scheduledDate, completedDate: null, laborHours: Number(form.laborHours) || 0, laborCost: Number(form.laborCost) || 0, partsCost: Number(form.partsCost) || 0, location: form.location, companyId: activeEntityId || null });
      setForm(EMPTY_WORK_ORDER);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const totalCost = workOrders.reduce((s, w) => s + w.totalCost, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Work Orders" description="Create, assign, and complete field work orders" actions={<Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" /> New Work Order</Button>} />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Wrench} label="Total Orders" value={workOrders.length} tone="teal" />
        <StatCard icon={Clock3} label="Open" value={workOrders.filter(w => w.status === 'Open').length} tone="blue" />
        <StatCard icon={TrendingUp} label="In Progress" value={workOrders.filter(w => w.status === 'Assigned' || w.status === 'InProgress').length} tone="amber" />
        <StatCard icon={Wallet} label="Total Cost" value={money(totalCost)} tone="violet" />
      </div>
      {showForm && (
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-2"><FormField label="Type"><Select value={form.workType} onValueChange={v => v !== null && setF('workType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{WORK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Customer"><Select value={form.customerId} onValueChange={v => { if (v !== null) { setF('customerId', v); setF('customerName', custName(customers, v)); } }}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-3"><FormField label="Description"><Input value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Work to be performed" /></FormField></div>
            <div className="col-span-1"><FormField label="Priority"><Select value={form.priority} onValueChange={v => v !== null && setF('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Assignee"><Select value={form.assignedTo} onValueChange={v => v !== null && setF('assignedTo', v)}>
              <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
              <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-1"><FormField label="Date"><Input type="date" value={form.scheduledDate} onChange={e => setF('scheduledDate', e.target.value)} /></FormField></div>
            <div className="col-span-1"><Button onClick={save} disabled={saving || !form.description}><Save className="mr-1.5 h-4 w-4" />Create</Button></div>
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Work Order</th>
              <th className="text-left p-3 font-medium">Customer</th>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-center p-3 font-medium">Priority</th>
              <th className="text-right p-3 font-medium">Cost</th>
              <th className="text-right p-3 font-medium">Date</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.map(w => (
              <tr key={w.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-medium">{w.workOrderNumber}</td>
                <td className="p-3">{w.customerName || '—'}</td>
                <td className="p-3 text-muted-foreground max-w-[240px] truncate">{w.description}</td>
                <td className="p-3 text-center"><Badge variant={w.priority === 'High' || w.priority === 'Critical' ? 'destructive' : 'outline'}>{w.priority}</Badge></td>
                <td className="p-3 text-right font-mono">{money(w.totalCost)}</td>
                <td className="p-3 text-right">{w.scheduledDate}</td>
                <td className="p-3 text-center"><Badge variant={woBadge(w.status) as any}>{w.status}</Badge></td>
                <td className="p-3 text-right">
                  {w.status === 'Open' && <Button size="sm" variant="ghost" onClick={() => setWorkOrderStatus(w.id, 'Assigned')}>Assign</Button>}
                  {w.status === 'Assigned' && <Button size="sm" variant="ghost" onClick={() => setWorkOrderStatus(w.id, 'InProgress')}>Start</Button>}
                  {w.status === 'InProgress' && <Button size="sm" variant="ghost" onClick={() => setWorkOrderStatus(w.id, 'Completed')}>Complete</Button>}
                </td>
              </tr>
            ))}
            {workOrders.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No work orders found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Field Expenses ────────────────────────────────────────────────────────────
export function FieldExpensesView({ activeEntityId }: { activeEntityId?: string }) {
  const { workOrders, expenses, createExpense } = useFieldData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_EXPENSE);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await createExpense({ workOrderId: form.workOrderId || null, category: form.category, description: form.description, amount: Number(form.amount) || 0, currency: form.currency, expenseDate: form.expenseDate, reimbursed: form.reimbursed, companyId: activeEntityId || null });
      setForm(EMPTY_EXPENSE);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const getWo = (id?: string) => workOrders.find(w => w.id === id);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Field Expenses" description="Log and reimburse field operation expenses" actions={<Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" /> Log Expense</Button>} />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ReceiptText} label="Total Expenses" value={expenses.length} tone="teal" />
        <StatCard icon={Wallet} label="Total Amount" value={money(total)} tone="blue" />
        <StatCard icon={CheckCircle2} label="Reimbursed" value={expenses.filter(e => e.reimbursed).length} tone="green" />
        <StatCard icon={AlertTriangle} label="Pending" value={expenses.filter(e => !e.reimbursed).length} tone="amber" />
      </div>
      {showForm && (
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-2"><FormField label="Work Order"><Select value={form.workOrderId} onValueChange={v => v !== null && setF('workOrderId', v)}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>{workOrders.map(w => <SelectItem key={w.id} value={w.id}>{w.workOrderNumber} · {w.workType}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Category"><Select value={form.category} onValueChange={v => v !== null && setF('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-3"><FormField label="Description"><Input value={form.description} onChange={e => setF('description', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Amount"><Input type="number" value={form.amount} onChange={e => setF('amount', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Date"><Input type="date" value={form.expenseDate} onChange={e => setF('expenseDate', e.target.value)} /></FormField></div>
            <div className="col-span-2"><Button onClick={save} disabled={saving || !form.description}><Save className="mr-1.5 h-4 w-4" />Log Expense</Button></div>
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Expense</th>
              <th className="text-left p-3 font-medium">Work Order</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-right p-3 font-medium">Date</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-center p-3 font-medium">Reimbursed</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-medium">{e.expenseNumber}</td>
                <td className="p-3">{getWo(e.workOrderId) ? `${getWo(e.workOrderId)!.workOrderNumber} · ${getWo(e.workOrderId)!.workType}` : '—'}</td>
                <td className="p-3"><Badge variant="outline">{e.category}</Badge></td>
                <td className="p-3 text-muted-foreground max-w-[240px] truncate">{e.description}</td>
                <td className="p-3 text-right">{e.expenseDate}</td>
                <td className="p-3 text-right font-mono font-medium">{money(e.amount)}</td>
                <td className="p-3 text-center">{e.reimbursed ? <Badge variant="secondary">Yes</Badge> : <Badge variant="outline">No</Badge>}</td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No field expenses found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Field Reports ─────────────────────────────────────────────────────────────
export function FieldReportsView() {
  const { dashboard, surveys, visits, workOrders, inspections, expenses } = useFieldData();
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCost = workOrders.reduce((s, w) => s + w.totalCost, 0);
  const responses = surveys.reduce((s, x) => s + x.responseCount, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Field Reports" description="Field operations performance and reporting" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Surveys" value={surveys.length} tone="teal" />
        <StatCard icon={CalendarCheck2} label="Total Visits" value={visits.length} tone="blue" />
        <StatCard icon={Wrench} label="Work Order Cost" value={money(totalCost)} tone="amber" />
        <StatCard icon={ReceiptText} label="Field Expenses" value={money(totalExpenses)} tone="violet" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Performance Overview</p>
          <div className="space-y-2">
            {[
              { label: 'Survey Responses', value: responses },
              { label: 'Completed Visits', value: dashboard?.completedVisits ?? 0 },
              { label: 'Passed Inspections', value: inspections.filter(i => i.status === 'Passed').length },
              { label: 'Failed Inspections', value: inspections.filter(i => i.status === 'Failed').length },
              { label: 'Open Work Orders', value: dashboard?.openOrders ?? 0 },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><FileBarChart className="h-4 w-4" /> Cost & Activity</p>
          <div className="space-y-2">
            {[
              { label: 'Total Work Order Cost', value: money(totalCost) },
              { label: 'Total Field Expenses', value: money(totalExpenses) },
              { label: 'Total Visit Cost', value: '—' },
              { label: 'Active Surveys', value: dashboard?.activeSurveys ?? 0 },
              { label: 'Pending Inspections', value: dashboard?.pendingInspections ?? 0 },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-mono font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}