import { useState, useEffect, useMemo } from 'react';
import { useProjectsStore, usePayrollStore } from './stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import {
  FolderKanban, Plus, TrendingUp, Wallet, Clock3, CheckCircle2, ArrowLeft, Save, Trash2, User, ListChecks, Timer, ReceiptText, Layers, AlertTriangle, Percent, Banknote, CircleDollarSign
} from 'lucide-react';

const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const today = () => new Date().toISOString().split('T')[0];

const STATUS_OPTIONS = ['Planning', 'Active', 'OnHold', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];
const EXPENSE_CATEGORIES = ['Travel', 'Hardware', 'Software', 'Consulting', 'Meals', 'Supplies', 'Training', 'Other'];

const projectStatusBadge = (s: string) =>
  s === 'Completed' ? 'secondary' : s === 'Active' ? 'default' : s === 'OnHold' ? 'outline' : s === 'Cancelled' ? 'destructive' : 'outline';

const taskStatusBadge = (s: string) =>
  s === 'Completed' ? 'secondary' : s === 'InProgress' ? 'default' : s === 'Blocked' ? 'destructive' : 'outline';

const priorityBadge = (p: string) =>
  p === 'Critical' ? 'destructive' : p === 'High' ? 'default' : 'outline';

const EMPTY_PROJECT = { name: '', description: '', status: 'Planning', startDate: today(), endDate: '', managerId: '', departmentId: '', customerName: '', budget: 0, currency: 'USD' };
const EMPTY_TASK = { projectId: '', title: '', assigneeId: '', status: 'NotStarted', priority: 'Medium', startDate: today(), dueDate: '', estimatedHours: 0 };
const EMPTY_TIMESHEET = { projectId: '', employeeId: '', date: today(), hours: 8, description: '', billable: true, billableRate: 0, currency: 'USD' };
const EMPTY_EXPENSE = { projectId: '', employeeId: '', category: 'Travel', description: '', vendorName: '', amount: 0, currency: 'USD', expenseDate: today(), billable: true };
const EMPTY_PHASE = { projectId: '', name: '', description: '', status: 'NotStarted' };

function useProjectData() {
  const store = useProjectsStore();
  const { employees, departments, fetchAll: fetchPayrollAll } = usePayrollStore();
  useEffect(() => { store.fetchAll(); fetchPayrollAll(); }, []);
  return { ...store, employees, departments };
}

const empName = (employees: any[], id?: string) => {
  const e = employees.find(x => x.id === id);
  return e ? `${e.firstName} ${e.lastName}` : 'Unassigned';
};
const deptName = (departments: any[], id?: string) => departments.find(d => d.id === id)?.name || '—';

// ── Summary (module overview) ─────────────────────────────────────────────────
export function ProjectsSummaryView() {
  const { projects, tasks, timesheets, expenses, employees } = useProjectData();
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalHours = timesheets.reduce((s, t) => s + t.hours, 0);
  const totalCost = timesheets.reduce((s, t) => s + t.hours * t.billableRate, 0) + expenses.reduce((s, e) => s + e.amount, 0);
  const done = tasks.filter(t => t.status === 'Completed').length;
  const overdue = tasks.filter(t => t.status !== 'Completed' && t.dueDate && t.dueDate < today()).length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Projects" description="Portfolio overview of projects, tasks, timesheets, expenses, and profitability" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Active Projects" value={projects.filter(p => p.status === 'Active').length} tone="teal" />
        <StatCard icon={Wallet} label="Total Budget" value={money(totalBudget)} tone="blue" />
        <StatCard icon={CheckCircle2} label="Tasks Completed" value={`${done}/${tasks.length}`} tone="green" />
        <StatCard icon={AlertTriangle} label="Overdue Tasks" value={overdue} tone="red" />
        <StatCard icon={Clock3} label="Hours Logged" value={totalHours.toFixed(1)} tone="violet" />
        <StatCard icon={ReceiptText} label="Total Cost" value={money(totalCost)} tone="amber" />
        <StatCard icon={TrendingUp} label="Project Margin" value={`${totalBudget > 0 ? Math.round(((totalBudget - totalCost) / totalBudget) * 100) : 0}%`} tone="cyan" />
        <StatCard icon={Layers} label="Total Projects" value={projects.length} tone="blue" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {projects.slice(0, 6).map(p => {
          const pTasks = tasks.filter(t => t.projectId === p.id);
          const pHours = timesheets.filter(t => t.projectId === p.id).reduce((s, t) => s + t.hours, 0);
          return (
            <Card key={p.id} className="hover:shadow-md transition-shadow p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{p.projectNumber}</p>
                  <p className="font-semibold">{p.name}</p>
                </div>
                <Badge variant={projectStatusBadge(p.status) as any}>{p.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">{p.description || '—'}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground"><span>Progress</span><span className="font-medium">{p.progressPercent}%</span></div>
                <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${p.progressPercent}%` }} /></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Budget <span className="font-mono font-medium">{money(p.budget)}</span></span>
                <span>{pTasks.length} tasks · {pHours.toFixed(1)}h</span>
              </div>
              <p className="text-xs text-muted-foreground">Manager: <span className="font-medium">{empName(employees, p.managerId)}</span></p>
            </Card>
          );
        })}
        {projects.length === 0 && <Card className="p-10 col-span-3 text-center text-muted-foreground">No projects yet.</Card>}
      </div>
    </div>
  );
}

// ── Projects ──────────────────────────────────────────────────────────────────
export function ProjectsListView({ activeEntityId }: { activeEntityId?: string }) {
  const { projects, employees, departments, createProject, updateProject, setProjectStatus, deleteProject } = useProjectData();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(EMPTY_PROJECT);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const filtered = projects.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const startNew = () => { setEditingId(null); setForm(EMPTY_PROJECT); setView('form'); };
  const startEdit = (p: any) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description, status: p.status, startDate: p.startDate, endDate: p.endDate || '', managerId: p.managerId || '', departmentId: p.departmentId || '', customerName: p.customerName, budget: p.budget, currency: p.currency });
    setView('form');
  };
  const save = async () => {
    setSaving(true);
    try {
      const body = {
        name: form.name, description: form.description, status: form.status,
        startDate: form.startDate, endDate: form.endDate || null,
        managerId: form.managerId || null, departmentId: form.departmentId || null,
        customerName: form.customerName, budget: Number(form.budget) || 0,
        currency: form.currency, companyId: activeEntityId || null,
      };
      if (editingId) await updateProject(editingId, body); else await createProject(body);
    } finally { setSaving(false); }
    setView('list');
  };

  if (view === 'form') {
    return (
      <div className="p-6 max-w-[1100px] mx-auto space-y-5">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setView('list')}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
          <PageHeader title={editingId ? 'Edit Project' : 'New Project'} description="Plan, budget, and track a project" />
          <Button onClick={save} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}</Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 space-y-4">
            <p className="text-sm font-medium flex items-center gap-2"><FolderKanban className="h-4 w-4" /> Project Details</p>
            <FormField label="Project Name" required><Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. ERP Cloud Migration" /></FormField>
            <FormField label="Description"><Input value={form.description} onChange={e => setF('description', e.target.value)} /></FormField>
            <FormField label="Status"><Select value={form.status} onValueChange={v => v !== null && setF('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select></FormField>
            <FormField label="Budget" required><Input type="number" value={form.budget} onChange={e => setF('budget', e.target.value)} /></FormField>
          </Card>
          <Card className="p-4 space-y-4">
            <p className="text-sm font-medium flex items-center gap-2"><User className="h-4 w-4" /> Assignment</p>
            <FormField label="Project Manager"><Select value={form.managerId} onValueChange={v => v !== null && setF('managerId', v)}>
              <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
              <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
            </Select></FormField>
            <FormField label="Department"><Select value={form.departmentId} onValueChange={v => v !== null && setF('departmentId', v)}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select></FormField>
            <FormField label="Start Date" required><Input type="date" value={form.startDate} onChange={e => setF('startDate', e.target.value)} /></FormField>
            <FormField label="End Date"><Input type="date" value={form.endDate} onChange={e => setF('endDate', e.target.value)} /></FormField>
          </Card>
        </div>
        <div className="flex items-center justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
          <Button onClick={save} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Projects" description="Plan, budget, and track project delivery" actions={<Button onClick={startNew}><Plus className="mr-2 h-4 w-4" /> New Project</Button>} />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Active Projects" value={projects.filter(p => p.status === 'Active').length} tone="teal" />
        <StatCard icon={Wallet} label="Total Budget" value={money(projects.reduce((s, p) => s + p.budget, 0))} tone="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={projects.filter(p => p.status === 'Completed').length} tone="green" />
        <StatCard icon={AlertTriangle} label="On Hold" value={projects.filter(p => p.status === 'OnHold').length} tone="amber" />
      </div>
      <div className="flex gap-3 items-center">
        <Input className="w-[240px]" placeholder="Search projects..." value={filter} onChange={e => setFilter(e.target.value)} />
        <Select value={statusFilter} onValueChange={v => v !== null && setStatusFilter(v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Project</th>
              <th className="text-left p-3 font-medium">Manager</th>
              <th className="text-left p-3 font-medium">Dept</th>
              <th className="text-right p-3 font-medium">Budget</th>
              <th className="text-center p-3 font-medium">Progress</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3"><p className="font-semibold">{p.name}</p><p className="font-mono text-xs text-muted-foreground">{p.projectNumber} · {p.startDate}</p></td>
                <td className="p-3">{empName(employees, p.managerId)}</td>
                <td className="p-3">{deptName(departments, p.departmentId)}</td>
                <td className="p-3 text-right font-mono">{money(p.budget)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${p.progressPercent}%` }} /></div>
                    <span className="text-xs text-muted-foreground">{p.progressPercent}%</span>
                  </div>
                </td>
                <td className="p-3 text-center"><Badge variant={projectStatusBadge(p.status) as any}>{p.status}</Badge></td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(p)}>Edit</Button>
                    {p.status !== 'Completed' && <Button size="sm" variant="ghost" onClick={() => setProjectStatus(p.id, 'Completed')}>Complete</Button>}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete project "${p.name}"?`)) deleteProject(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No projects found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Project Planning (phases) ─────────────────────────────────────────────────
export function ProjectPlanningView({ activeEntityId }: { activeEntityId?: string }) {
  const { projects, phases, createPhase } = useProjectData();
  const [form, setForm] = useState(EMPTY_PHASE);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await createPhase({ projectId: form.projectId, name: form.name, description: form.description || null, orderIndex: 0, status: form.status, companyId: activeEntityId || null });
      setForm(EMPTY_PHASE);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Project Planning" description="Break projects into phases and track their progress" actions={<Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" /> New Phase</Button>} />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Total Phases" value={phases.length} tone="teal" />
        <StatCard icon={FolderKanban} label="Projects" value={projects.length} tone="blue" />
        <StatCard icon={CheckCircle2} label="Completed Phases" value={phases.filter(p => p.status === 'Completed').length} tone="green" />
        <StatCard icon={Clock3} label="In Progress" value={phases.filter(p => p.status === 'InProgress').length} tone="violet" />
      </div>
      {showForm && (
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3"><FormField label="Project"><Select value={form.projectId} onValueChange={v => v !== null && setF('projectId', v)}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-3"><FormField label="Phase Name"><Input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. Discovery" /></FormField></div>
            <div className="col-span-4"><FormField label="Description"><Input value={form.description} onChange={e => setF('description', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Status"><Select value={form.status} onValueChange={v => v !== null && setF('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="NotStarted">Not Started</SelectItem><SelectItem value="InProgress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem></SelectContent>
            </Select></FormField></div>
            <div className="col-span-1"><Button onClick={save} disabled={saving || !form.projectId || !form.name}><Save className="mr-1.5 h-4 w-4" />Add</Button></div>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-4">
        {projects.map(p => {
          const pPhases = phases.filter(ph => ph.projectId === p.id);
          if (pPhases.length === 0) return null;
          return (
            <Card key={p.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{p.projectNumber}</p>
                </div>
                <Badge variant={projectStatusBadge(p.status) as any}>{p.status}</Badge>
              </div>
              <div className="space-y-2">
                {pPhases.map(ph => (
                  <div key={ph.id} className="flex items-center justify-between border rounded-lg p-2.5 text-sm">
                    <span className="font-medium">{ph.name}</span>
                    <Badge variant={taskStatusBadge(ph.status) as any}>{ph.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
        {projects.length === 0 && <Card className="p-10 col-span-2 text-center text-muted-foreground">No projects yet.</Card>}
      </div>
    </div>
  );
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export function ProjectsTasksView({ activeEntityId }: { activeEntityId?: string }) {
  const { projects, tasks, employees, createTask, setTaskStatus, deleteTask } = useProjectData();
  const [form, setForm] = useState(EMPTY_TASK);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await createTask({
        projectId: form.projectId, title: form.title, assigneeId: form.assigneeId || null,
        status: form.status, priority: form.priority, startDate: form.startDate,
        dueDate: form.dueDate || null, estimatedHours: Number(form.estimatedHours) || 0,
        companyId: activeEntityId || null,
      });
      setForm(EMPTY_TASK);
    } finally { setSaving(false); }
  };

  const overdue = tasks.filter(t => t.status !== 'Completed' && t.dueDate && t.dueDate < today()).length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Tasks" description="Assign, prioritize, and track project tasks" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ListChecks} label="Total Tasks" value={tasks.length} tone="teal" />
        <StatCard icon={Clock3} label="In Progress" value={tasks.filter(t => t.status === 'InProgress').length} tone="blue" />
        <StatCard icon={CheckCircle2} label="Completed" value={tasks.filter(t => t.status === 'Completed').length} tone="green" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue} tone="red" />
      </div>
      <Card className="p-4">
        <p className="text-sm font-medium mb-3 flex items-center gap-2"><ListChecks className="h-4 w-4" /> Quick Add Task</p>
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-3"><FormField label="Project"><Select value={form.projectId} onValueChange={v => v !== null && setF('projectId', v)}>
            <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select></FormField></div>
          <div className="col-span-3"><FormField label="Title"><Input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Task title" /></FormField></div>
          <div className="col-span-2"><FormField label="Assignee"><Select value={form.assigneeId} onValueChange={v => v !== null && setF('assigneeId', v)}>
            <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
            <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
          </Select></FormField></div>
          <div className="col-span-2"><FormField label="Priority"><Select value={form.priority} onValueChange={v => v !== null && setF('priority', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select></FormField></div>
          <div className="col-span-1"><FormField label="Hours"><Input type="number" value={form.estimatedHours} onChange={e => setF('estimatedHours', e.target.value)} /></FormField></div>
          <div className="col-span-1"><Button onClick={save} disabled={saving || !form.projectId || !form.title}><Plus className="mr-1.5 h-4 w-4" />Add</Button></div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Task</th>
              <th className="text-left p-3 font-medium">Project</th>
              <th className="text-left p-3 font-medium">Assignee</th>
              <th className="text-center p-3 font-medium">Priority</th>
              <th className="text-right p-3 font-medium">Est. / Act.</th>
              <th className="text-right p-3 font-medium">Due</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{t.title}</td>
                <td className="p-3">{projects.find(p => p.id === t.projectId)?.name || '—'}</td>
                <td className="p-3">{empName(employees, t.assigneeId)}</td>
                <td className="p-3 text-center"><Badge variant={priorityBadge(t.priority) as any}>{t.priority}</Badge></td>
                <td className="p-3 text-right font-mono">{t.estimatedHours} / {t.actualHours}</td>
                <td className="p-3 text-right">{t.dueDate || '—'}</td>
                <td className="p-3 text-center"><Badge variant={taskStatusBadge(t.status) as any}>{t.status}</Badge></td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {t.status === 'NotStarted' && <Button size="sm" variant="ghost" onClick={() => setTaskStatus(t.id, 'InProgress')}>Start</Button>}
                    {(t.status === 'InProgress' || t.status === 'Blocked') && <Button size="sm" variant="ghost" onClick={() => setTaskStatus(t.id, 'Completed')}>Done</Button>}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteTask(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No tasks found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Project Budget ────────────────────────────────────────────────────────────
export function ProjectBudgetView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, timesheets, expenses } = useProjectData();
  const rows = useMemo(() => projects.map(p => {
    const labor = timesheets.filter(t => t.projectId === p.id).reduce((s, t) => s + t.hours * t.billableRate, 0);
    const spent = labor + expenses.filter(e => e.projectId === p.id).reduce((s, e) => s + e.amount, 0);
    const utilization = p.budget > 0 ? Math.round((spent / p.budget) * 100) : 0;
    return { project: p, spent, remaining: p.budget - spent, utilization };
  }), [projects, timesheets, expenses]);
  const totalBudget = rows.reduce((s, r) => s + r.project.budget, 0);
  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Project Budget" description="Budget allocation and utilization per project" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Total Budget" value={money(totalBudget)} tone="blue" />
        <StatCard icon={ReceiptText} label="Spent" value={money(totalSpent)} tone="amber" />
        <StatCard icon={CheckCircle2} label="Remaining" value={money(totalBudget - totalSpent)} tone="green" />
        <StatCard icon={Percent} label="Utilization" value={`${totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%`} tone="violet" />
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Project</th>
              <th className="text-right p-3 font-medium">Budget</th>
              <th className="text-right p-3 font-medium">Spent</th>
              <th className="text-right p-3 font-medium">Remaining</th>
              <th className="text-center p-3 font-medium">Utilization</th>
              <th className="text-center p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project, spent, remaining, utilization }) => (
              <tr key={project.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{project.name}</td>
                <td className="p-3 text-right font-mono">{money(project.budget)}</td>
                <td className="p-3 text-right font-mono">{money(spent)}</td>
                <td className="p-3 text-right font-mono">{money(remaining)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(utilization, 100)}%` }} /></div>
                    <span className="text-xs text-muted-foreground">{utilization}%</span>
                  </div>
                </td>
                <td className="p-3 text-center"><Badge variant={utilization >= 100 ? 'destructive' : utilization >= 75 ? 'default' : 'secondary'}>{utilization >= 100 ? 'Over Budget' : utilization >= 75 ? 'At Risk' : 'On Track'}</Badge></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No projects found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Project Costing ───────────────────────────────────────────────────────────
export function ProjectCostingView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, timesheets, expenses } = useProjectData();
  const rows = useMemo(() => projects.map(p => {
    const pTs = timesheets.filter(t => t.projectId === p.id);
    const pEx = expenses.filter(e => e.projectId === p.id);
    const labor = pTs.reduce((s, t) => s + t.hours * t.billableRate, 0);
    const exp = pEx.reduce((s, e) => s + e.amount, 0);
    return { project: p, labor, exp, total: labor + exp, hours: pTs.reduce((s, t) => s + t.hours, 0) };
  }), [projects, timesheets, expenses]);
  const totalLabor = rows.reduce((s, r) => s + r.labor, 0);
  const totalExp = rows.reduce((s, r) => s + r.exp, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Project Costing" description="Labor and expense cost breakdown per project" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Clock3} label="Labor Cost" value={money(totalLabor)} tone="blue" />
        <StatCard icon={ReceiptText} label="Expenses" value={money(totalExp)} tone="amber" />
        <StatCard icon={Banknote} label="Total Cost" value={money(totalLabor + totalExp)} tone="violet" />
        <StatCard icon={TrendingUp} label="Cost / Hour" value={money(rows.reduce((s, r) => s + r.hours, 0) > 0 ? (totalLabor + totalExp) / rows.reduce((s, r) => s + r.hours, 0) : 0)} tone="cyan" />
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Project</th>
              <th className="text-right p-3 font-medium">Hours</th>
              <th className="text-right p-3 font-medium">Labor</th>
              <th className="text-right p-3 font-medium">Expenses</th>
              <th className="text-right p-3 font-medium">Total Cost</th>
              <th className="text-center p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project, labor, exp, total, hours }) => (
              <tr key={project.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{project.name}</td>
                <td className="p-3 text-right font-mono">{hours.toFixed(1)}</td>
                <td className="p-3 text-right font-mono">{money(labor)}</td>
                <td className="p-3 text-right font-mono">{money(exp)}</td>
                <td className="p-3 text-right font-mono font-semibold">{money(total)}</td>
                <td className="p-3 text-center"><Badge variant={projectStatusBadge(project.status) as any}>{project.status}</Badge></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No projects found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Timesheets ────────────────────────────────────────────────────────────────
export function ProjectsTimesheetsView({ activeEntityId }: { activeEntityId?: string }) {
  const { projects, timesheets, employees, logTimesheet, approveTimesheet, deleteTimesheet } = useProjectData();
  const [form, setForm] = useState(EMPTY_TIMESHEET);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await logTimesheet({
        projectId: form.projectId, employeeId: form.employeeId, date: form.date,
        hours: Number(form.hours) || 0, description: form.description,
        billable: form.billable, billableRate: Number(form.billableRate) || 0,
        currency: form.currency, companyId: activeEntityId || null,
      });
      setForm(EMPTY_TIMESHEET);
    } finally { setSaving(false); }
  };

  const totalHours = timesheets.reduce((s, t) => s + t.hours, 0);
  const billableHours = timesheets.filter(t => t.billable).reduce((s, t) => s + t.hours, 0);
  const pending = timesheets.filter(t => !t.approved).length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Timesheets" description="Log and approve project hours" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Clock3} label="Total Hours" value={totalHours.toFixed(1)} tone="violet" />
        <StatCard icon={Timer} label="Billable Hours" value={billableHours.toFixed(1)} tone="blue" />
        <StatCard icon={Wallet} label="Billable Amount" value={money(timesheets.filter(t => t.billable).reduce((s, t) => s + t.hours * t.billableRate, 0))} tone="green" />
        <StatCard icon={AlertTriangle} label="Pending Approval" value={pending} tone="amber" />
      </div>
      <Card className="p-4">
        <p className="text-sm font-medium mb-3 flex items-center gap-2"><Timer className="h-4 w-4" /> Log Hours</p>
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-2"><FormField label="Project"><Select value={form.projectId} onValueChange={v => v !== null && setF('projectId', v)}>
            <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select></FormField></div>
          <div className="col-span-2"><FormField label="Employee"><Select value={form.employeeId} onValueChange={v => v !== null && setF('employeeId', v)}>
            <SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger>
            <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
          </Select></FormField></div>
          <div className="col-span-2"><FormField label="Date"><Input type="date" value={form.date} onChange={e => setF('date', e.target.value)} /></FormField></div>
          <div className="col-span-1"><FormField label="Hours"><Input type="number" value={form.hours} onChange={e => setF('hours', e.target.value)} /></FormField></div>
          <div className="col-span-1"><FormField label="Rate"><Input type="number" value={form.billableRate} onChange={e => setF('billableRate', e.target.value)} /></FormField></div>
          <div className="col-span-3"><FormField label="Description"><Input value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Work performed" /></FormField></div>
          <div className="col-span-1"><Button onClick={save} disabled={saving || !form.projectId || !form.employeeId}><Plus className="mr-1.5 h-4 w-4" />Log</Button></div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Project</th>
              <th className="text-left p-3 font-medium">Employee</th>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-right p-3 font-medium">Hours</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.map(t => (
              <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3">{t.date}</td>
                <td className="p-3">{projects.find(p => p.id === t.projectId)?.name || '—'}</td>
                <td className="p-3">{empName(employees, t.employeeId)}</td>
                <td className="p-3 text-muted-foreground max-w-[260px] truncate">{t.description || '—'}</td>
                <td className="p-3 text-right font-mono">{t.hours}</td>
                <td className="p-3 text-right font-mono">{money(t.hours * t.billableRate)}</td>
                <td className="p-3 text-center">{t.approved ? <Badge variant="secondary">Approved</Badge> : <Badge variant="outline">Pending</Badge>}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {!t.approved && <Button size="sm" variant="ghost" onClick={() => approveTimesheet(t.id)}>Approve</Button>}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteTimesheet(t.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {timesheets.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No timesheet entries found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Project Billing ───────────────────────────────────────────────────────────
export function ProjectBillingView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, timesheets, expenses } = useProjectData();
  const rows = useMemo(() => projects.map(p => {
    const billableTs = timesheets.filter(t => t.projectId === p.id && t.billable);
    const billableEx = expenses.filter(e => e.projectId === p.id && e.billable);
    const hours = billableTs.reduce((s, t) => s + t.hours, 0);
    const labor = billableTs.reduce((s, t) => s + t.hours * t.billableRate, 0);
    const exp = billableEx.reduce((s, e) => s + e.amount, 0);
    return { project: p, hours, labor, exp, total: labor + exp };
  }), [projects, timesheets, expenses]);
  const totalBillable = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Project Billing" description="Billable time and expenses per project" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={CircleDollarSign} label="Total Billable" value={money(totalBillable)} tone="green" />
        <StatCard icon={Clock3} label="Billable Hours" value={rows.reduce((s, r) => s + r.hours, 0).toFixed(1)} tone="blue" />
        <StatCard icon={Timer} label="Billable Labor" value={money(rows.reduce((s, r) => s + r.labor, 0))} tone="violet" />
        <StatCard icon={ReceiptText} label="Billable Expenses" value={money(rows.reduce((s, r) => s + r.exp, 0))} tone="amber" />
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Project</th>
              <th className="text-right p-3 font-medium">Billable Hours</th>
              <th className="text-right p-3 font-medium">Labor</th>
              <th className="text-right p-3 font-medium">Expenses</th>
              <th className="text-right p-3 font-medium">Total Billable</th>
              <th className="text-center p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project, hours, labor, exp, total }) => (
              <tr key={project.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{project.name}</td>
                <td className="p-3 text-right font-mono">{hours.toFixed(1)}</td>
                <td className="p-3 text-right font-mono">{money(labor)}</td>
                <td className="p-3 text-right font-mono">{money(exp)}</td>
                <td className="p-3 text-right font-mono font-semibold">{money(total)}</td>
                <td className="p-3 text-center"><Badge variant={projectStatusBadge(project.status) as any}>{project.status}</Badge></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No projects found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Project Expenses ──────────────────────────────────────────────────────────
export function ProjectsExpensesView({ activeEntityId }: { activeEntityId?: string }) {
  const { projects, expenses, createExpense, deleteExpense } = useProjectData();
  const [form, setForm] = useState(EMPTY_EXPENSE);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await createExpense({
        projectId: form.projectId, employeeId: form.employeeId || null,
        category: form.category, description: form.description, vendorName: form.vendorName || null,
        amount: Number(form.amount) || 0, currency: form.currency, expenseDate: form.expenseDate,
        billable: form.billable, companyId: activeEntityId || null,
      });
      setForm(EMPTY_EXPENSE);
    } finally { setSaving(false); }
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const billable = expenses.filter(e => e.billable).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Project Expenses" description="Track project-related spend" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ReceiptText} label="Total Expenses" value={expenses.length} tone="amber" />
        <StatCard icon={Banknote} label="Total Amount" value={money(total)} tone="blue" />
        <StatCard icon={CircleDollarSign} label="Billable" value={money(billable)} tone="green" />
        <StatCard icon={Wallet} label="Non-Billable" value={money(total - billable)} tone="violet" />
      </div>
      <Card className="p-4">
        <p className="text-sm font-medium mb-3 flex items-center gap-2"><ReceiptText className="h-4 w-4" /> Log Expense</p>
        <div className="grid grid-cols-12 gap-3 items-end">
          <div className="col-span-2"><FormField label="Project"><Select value={form.projectId} onValueChange={v => v !== null && setF('projectId', v)}>
            <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select></FormField></div>
          <div className="col-span-2"><FormField label="Category"><Select value={form.category} onValueChange={v => v !== null && setF('category', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select></FormField></div>
          <div className="col-span-2"><FormField label="Description"><Input value={form.description} onChange={e => setF('description', e.target.value)} placeholder="What was purchased" /></FormField></div>
          <div className="col-span-2"><FormField label="Vendor"><Input value={form.vendorName} onChange={e => setF('vendorName', e.target.value)} /></FormField></div>
          <div className="col-span-1"><FormField label="Amount"><Input type="number" value={form.amount} onChange={e => setF('amount', e.target.value)} /></FormField></div>
          <div className="col-span-1"><FormField label="Date"><Input type="date" value={form.expenseDate} onChange={e => setF('expenseDate', e.target.value)} /></FormField></div>
          <div className="col-span-2"><Button onClick={save} disabled={saving || !form.projectId}><Plus className="mr-1.5 h-4 w-4" />Log Expense</Button></div>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-left p-3 font-medium">Project</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Description</th>
              <th className="text-left p-3 font-medium">Vendor</th>
              <th className="text-right p-3 font-medium">Amount</th>
              <th className="text-center p-3 font-medium">Billable</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3">{e.expenseDate}</td>
                <td className="p-3">{projects.find(p => p.id === e.projectId)?.name || '—'}</td>
                <td className="p-3"><Badge variant="outline">{e.category}</Badge></td>
                <td className="p-3 text-muted-foreground max-w-[260px] truncate">{e.description || '—'}</td>
                <td className="p-3">{e.vendorName || '—'}</td>
                <td className="p-3 text-right font-mono font-medium">{money(e.amount)}</td>
                <td className="p-3 text-center">{e.billable ? <Badge variant="secondary">Yes</Badge> : <Badge variant="outline">No</Badge>}</td>
                <td className="p-3 text-right"><Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteExpense(e.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No expenses found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Project Profitability ─────────────────────────────────────────────────────
export function ProjectProfitabilityView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, tasks, timesheets, expenses } = useProjectData();
  const rows = useMemo(() => projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const pTs = timesheets.filter(t => t.projectId === p.id);
    const pEx = expenses.filter(e => e.projectId === p.id);
    const labor = pTs.reduce((s, t) => s + t.hours * t.billableRate, 0);
    const cost = labor + pEx.reduce((s, e) => s + e.amount, 0);
    const done = pTasks.filter(t => t.status === 'Completed').length;
    return { project: p, labor, cost, hours: pTs.reduce((s, t) => s + t.hours, 0), tasks: pTasks.length, done, margin: p.budget > 0 ? Math.round(((p.budget - cost) / p.budget) * 100) : 0 };
  }), [projects, tasks, timesheets, expenses]);
  const avgMargin = rows.length ? Math.round(rows.reduce((s, r) => s + r.margin, 0) / rows.length) : 0;
  const profitable = rows.filter(r => r.margin >= 0).length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Project Profitability" description="Margin analysis per project" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Avg Margin" value={`${avgMargin}%`} tone="cyan" />
        <StatCard icon={CheckCircle2} label="Profitable" value={`${profitable}/${rows.length}`} tone="green" />
        <StatCard icon={AlertTriangle} label="At Risk / Loss" value={rows.filter(r => r.margin < 0).length} tone="red" />
        <StatCard icon={Wallet} label="Total Cost" value={money(rows.reduce((s, r) => s + r.cost, 0))} tone="violet" />
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Project</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Budget</th>
              <th className="text-right p-3 font-medium">Labor Cost</th>
              <th className="text-right p-3 font-medium">Expenses</th>
              <th className="text-right p-3 font-medium">Total Cost</th>
              <th className="text-right p-3 font-medium">Remaining</th>
              <th className="text-center p-3 font-medium">Margin</th>
              <th className="text-center p-3 font-medium">Tasks</th>
              <th className="text-center p-3 font-medium">Hours</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ project, labor, cost, hours, tasks: tc, done, margin }) => (
              <tr key={project.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{project.name}</td>
                <td className="p-3"><Badge variant={projectStatusBadge(project.status) as any}>{project.status}</Badge></td>
                <td className="p-3 text-right font-mono">{money(project.budget)}</td>
                <td className="p-3 text-right font-mono">{money(labor)}</td>
                <td className="p-3 text-right font-mono">{money(project.budget > 0 ? (cost - labor) : 0)}</td>
                <td className="p-3 text-right font-mono font-semibold">{money(cost)}</td>
                <td className="p-3 text-right font-mono">{money(project.budget - cost)}</td>
                <td className="p-3 text-center"><Badge variant={margin >= 20 ? 'secondary' : margin >= 0 ? 'outline' : 'destructive'}>{margin}%</Badge></td>
                <td className="p-3 text-center text-muted-foreground">{done}/{tc}</td>
                <td className="p-3 text-center text-muted-foreground">{hours.toFixed(1)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No project data available</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Reports ───────────────────────────────────────────────────────────────────
export function ProjectsReportsView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, tasks, timesheets, expenses } = useProjectData();
  const totalCost = timesheets.reduce((s, t) => s + t.hours * t.billableRate, 0) + expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const topByMargin = useMemo(() => projects.map(p => {
    const labor = timesheets.filter(t => t.projectId === p.id).reduce((s, t) => s + t.hours * t.billableRate, 0);
    const cost = labor + expenses.filter(e => e.projectId === p.id).reduce((s, e) => s + e.amount, 0);
    return { p, margin: p.budget > 0 ? Math.round(((p.budget - cost) / p.budget) * 100) : 0 };
  }).sort((a, b) => b.margin - a.margin).slice(0, 5), [projects, timesheets, expenses]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Projects Reports" description="Portfolio-level insights and reporting" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Total Projects" value={projects.length} tone="teal" />
        <StatCard icon={Wallet} label="Budget vs Cost" value={`${money(totalBudget)} / ${money(totalCost)}`} tone="blue" />
        <StatCard icon={CheckCircle2} label="Task Completion" value={`${tasks.filter(t => t.status === 'Completed').length}/${tasks.length}`} tone="green" />
        <StatCard icon={TrendingUp} label="Overall Margin" value={`${totalBudget > 0 ? Math.round(((totalBudget - totalCost) / totalBudget) * 100) : 0}%`} tone="cyan" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Top Projects by Margin</p>
          <div className="space-y-2">
            {topByMargin.map(({ p, margin }, i) => (
              <div key={p.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-muted-foreground">#{i + 1}</span>
                  <div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.status}</p></div>
                </div>
                <Badge variant={margin >= 20 ? 'secondary' : margin >= 0 ? 'outline' : 'destructive'}>{margin}%</Badge>
              </div>
            ))}
            {topByMargin.length === 0 && <p className="text-sm text-muted-foreground">No data available</p>}
          </div>
        </Card>
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Clock3 className="h-4 w-4" /> Effort Overview</p>
          <div className="space-y-2">
            {[
              { label: 'Total Hours Logged', value: `${timesheets.reduce((s, t) => s + t.hours, 0).toFixed(1)}h` },
              { label: 'Billable Hours', value: `${timesheets.filter(t => t.billable).reduce((s, t) => s + t.hours, 0).toFixed(1)}h` },
              { label: 'Total Expenses', value: money(expenses.reduce((s, e) => s + e.amount, 0)) },
              { label: 'Billable Expenses', value: money(expenses.filter(e => e.billable).reduce((s, e) => s + e.amount, 0)) },
              { label: 'Overdue Tasks', value: tasks.filter(t => t.status !== 'Completed' && t.dueDate && t.dueDate < today()).length },
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
