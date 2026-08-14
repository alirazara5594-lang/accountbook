import { useState, useEffect, useMemo } from 'react';
import { useProjectsStore, usePayrollStore } from './stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormSection } from '@/components/ui/form-section';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FolderKanban, Plus, TrendingUp, Wallet, Clock3, CheckCircle2, ArrowLeft, Save, Trash2, User, ListChecks, Timer, ReceiptText
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

const EMPTY_PROJECT = { name: '', description: '', status: 'Planning', startDate: today(), endDate: '', managerId: '', departmentId: '', customerId: '', customerName: '', budget: 0, currency: 'USD' };
const EMPTY_TASK = { projectId: '', phaseId: '', title: '', description: '', assigneeId: '', status: 'NotStarted', priority: 'Medium', startDate: today(), dueDate: '', estimatedHours: 0 };
const EMPTY_TIMESHEET = { projectId: '', taskId: '', employeeId: '', date: today(), hours: 8, description: '', billable: true, billableRate: 0, currency: 'USD' };
const EMPTY_EXPENSE = { projectId: '', employeeId: '', category: 'Travel', description: '', vendorName: '', amount: 0, currency: 'USD', expenseDate: today(), billable: true };

export default function ProjectsWorkspace({ activeEntityId }: { activeEntityId?: string }) {
  const { projects, tasks, timesheets, expenses, fetchAll, createProject, updateProject, setProjectStatus, deleteProject, createTask, setTaskStatus, deleteTask, logTimesheet, approveTimesheet, deleteTimesheet, createExpense, deleteExpense } = useProjectsStore();
  const { employees, departments, fetchAll: fetchPayrollAll } = usePayrollStore();
  const [tab, setTab] = useState('overview');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [tsForm, setTsForm] = useState(EMPTY_TIMESHEET);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); fetchPayrollAll(); }, []);

  const setForm = (form: any, key: string, value: any) => form === 'project' ? setProjectForm(f => ({ ...f, [key]: value })) : form === 'task' ? setTaskForm(f => ({ ...f, [key]: value })) : form === 'ts' ? setTsForm(f => ({ ...f, [key]: value })) : setExpenseForm(f => ({ ...f, [key]: value }));

  const getEmpName = (id?: string) => { const e = employees.find(x => x.id === id); return e ? `${e.firstName} ${e.lastName}` : 'Unassigned'; };
  const getDeptName = (id?: string) => departments.find(d => d.id === id)?.name || '—';
  const getProject = (id?: string) => projects.find(p => p.id === id);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = projects.filter(p => p.status === 'Active');
    const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalHours = timesheets.reduce((s, t) => s + t.hours, 0);
    const totalCost = timesheets.reduce((s, t) => s + t.hours * t.billableRate, 0) + expenses.reduce((s, e) => s + e.amount, 0);
    return { active: active.length, totalBudget, totalTasks, doneTasks, totalHours, totalCost };
  }, [projects, tasks, timesheets, expenses]);

  const filteredProjects = projects.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (projectFilter && !p.name.toLowerCase().includes(projectFilter.toLowerCase())) return false;
    return true;
  });

  // ── Project CRUD ───────────────────────────────────────────────────────────
  const startNewProject = () => { setEditingId(null); setProjectForm(EMPTY_PROJECT); setView('form'); };
  const startEditProject = (p: any) => { setEditingId(p.id); setProjectForm({ name: p.name, description: p.description, status: p.status, startDate: p.startDate, endDate: p.endDate || '', managerId: p.managerId || '', departmentId: p.departmentId || '', customerId: p.customerId || '', customerName: p.customerName, budget: p.budget, currency: p.currency }); setView('form'); };
  const handleSaveProject = async () => {
    setSaving(true);
    try {
      const body = {
        name: projectForm.name, description: projectForm.description, status: projectForm.status,
        startDate: projectForm.startDate, endDate: projectForm.endDate || null,
        managerId: projectForm.managerId || null, departmentId: projectForm.departmentId || null,
        customerId: projectForm.customerId || null, customerName: projectForm.customerName,
        budget: Number(projectForm.budget) || 0, currency: projectForm.currency, companyId: activeEntityId || null,
      };
      if (editingId) await updateProject(editingId, body); else await createProject(body);
    } finally { setSaving(false); }
    setView('list');
  };

  const handleSaveTask = async () => {
    setSaving(true);
    try {
      await createTask({
        projectId: taskForm.projectId, phaseId: taskForm.phaseId || null, title: taskForm.title,
        description: taskForm.description, assigneeId: taskForm.assigneeId || null,
        status: taskForm.status, priority: taskForm.priority, startDate: taskForm.startDate,
        dueDate: taskForm.dueDate || null, estimatedHours: Number(taskForm.estimatedHours) || 0,
        companyId: activeEntityId || null,
      });
      setTaskForm(EMPTY_TASK);
    } finally { setSaving(false); }
  };

  const handleSaveTimesheet = async () => {
    setSaving(true);
    try {
      await logTimesheet({
        projectId: tsForm.projectId, taskId: tsForm.taskId || null, employeeId: tsForm.employeeId,
        date: tsForm.date, hours: Number(tsForm.hours) || 0, description: tsForm.description,
        billable: tsForm.billable, billableRate: Number(tsForm.billableRate) || 0,
        currency: tsForm.currency, companyId: activeEntityId || null,
      });
      setTsForm(EMPTY_TIMESHEET);
    } finally { setSaving(false); }
  };

  const handleSaveExpense = async () => {
    setSaving(true);
    try {
      await createExpense({
        projectId: expenseForm.projectId, employeeId: expenseForm.employeeId || null,
        category: expenseForm.category, description: expenseForm.description,
        vendorName: expenseForm.vendorName || null, amount: Number(expenseForm.amount) || 0,
        currency: expenseForm.currency, expenseDate: expenseForm.expenseDate,
        billable: expenseForm.billable, companyId: activeEntityId || null,
      });
      setExpenseForm(EMPTY_EXPENSE);
    } finally { setSaving(false); }
  };

  // ── Profitability table ────────────────────────────────────────────────────
  const profitability = useMemo(() => projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const pTs = timesheets.filter(t => t.projectId === p.id);
    const pEx = expenses.filter(e => e.projectId === p.id);
    const labor = pTs.reduce((s, t) => s + t.hours * t.billableRate, 0);
    const cost = labor + pEx.reduce((s, e) => s + e.amount, 0);
    const done = pTasks.filter(t => t.status === 'Completed').length;
    return { project: p, labor, cost, hours: pTs.reduce((s, t) => s + t.hours, 0), tasks: pTasks.length, done, margin: p.budget > 0 ? Math.round(((p.budget - cost) / p.budget) * 100) : 0 };
  }), [projects, tasks, timesheets, expenses]);

  if (view === 'form') {
    return (
      <div className="p-6 max-w-[1100px] mx-auto space-y-5">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setView('list')}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
          <PageHeader title={editingId ? 'Edit Project' : 'New Project'} description="Plan, budget, and track a project" />
          <Button onClick={handleSaveProject} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}</Button>
        </div>

        <div className="space-y-4">
          <FormSection icon={FolderKanban} title="Project Details" tone="teal">
            <FormField label="Project Name" required className="col-span-full"><Input value={projectForm.name} onChange={e => setForm('project', 'name', e.target.value)} placeholder="e.g. ERP Cloud Migration" /></FormField>
            <FormField label="Description" className="col-span-full"><Input value={projectForm.description} onChange={e => setForm('project', 'description', e.target.value)} placeholder="Brief description" /></FormField>
            <FormField label="Status"><Select value={projectForm.status} onValueChange={v => v !== null && setForm('project', 'status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select></FormField>
            <FormField label="Currency"><Input value={projectForm.currency} onChange={e => setForm('project', 'currency', e.target.value)} /></FormField>
            <FormField label="Start Date" required><Input type="date" value={projectForm.startDate} onChange={e => setForm('project', 'startDate', e.target.value)} /></FormField>
            <FormField label="End Date"><Input type="date" value={projectForm.endDate} onChange={e => setForm('project', 'endDate', e.target.value)} /></FormField>
            <FormField label="Budget" required><Input type="number" value={projectForm.budget} onChange={e => setForm('project', 'budget', e.target.value)} /></FormField>
          </FormSection>

          <FormSection icon={User} title="Assignment & Customer" tone="blue">
            <FormField label="Project Manager"><Select value={projectForm.managerId} onValueChange={v => v !== null && setForm('project', 'managerId', v)}>
              <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
              <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
            </Select></FormField>
            <FormField label="Department"><Select value={projectForm.departmentId} onValueChange={v => v !== null && setForm('project', 'departmentId', v)}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>{departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select></FormField>
            <FormField label="Customer Name"><Input value={projectForm.customerName} onChange={e => setForm('project', 'customerName', e.target.value)} placeholder="Internal or external" /></FormField>
          </FormSection>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-4 sticky bottom-0 bg-background py-3">
          <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
          <Button onClick={handleSaveProject} disabled={saving}><Save className="mr-1.5 h-4 w-4" />{saving ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Projects"
        description="Plan projects, assign tasks, track timesheets, and monitor profitability"
        actions={<Button onClick={startNewProject}><Plus className="mr-2 h-4 w-4" /> New Project</Button>}
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={FolderKanban} label="Active Projects" value={stats.active} tone="teal" />
        <StatCard icon={Wallet} label="Total Budget" value={money(stats.totalBudget)} tone="blue" />
        <StatCard icon={TrendingUp} label="Tasks Completed" value={`${stats.doneTasks}/${stats.totalTasks}`} tone="green" />
        <StatCard icon={Clock3} label="Hours Logged" value={stats.totalHours.toFixed(1)} tone="violet" />
        <StatCard icon={ReceiptText} label="Total Cost" value={money(stats.totalCost)} tone="amber" />
        <StatCard icon={CheckCircle2} label="Project Margin" value={`${stats.totalBudget > 0 ? Math.round(((stats.totalBudget - stats.totalCost) / stats.totalBudget) * 100) : 0}%`} tone="cyan" />
      </div>

      <Tabs value={tab} onValueChange={v => v !== null && setTab(v)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="profitability">Profitability</TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {projects.slice(0, 6).map(p => {
              const totalTasks = tasks.filter(t => t.projectId === p.id).length;
              const totalHours = timesheets.filter(t => t.projectId === p.id).reduce((s, t) => s + t.hours, 0);
              return (
                <Card key={p.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
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
                      <span>{totalTasks} tasks · {totalHours.toFixed(1)}h</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Manager: <span className="font-medium">{getEmpName(p.managerId)}</span></p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {projects.length === 0 && <Card className="p-10 text-center text-muted-foreground">No projects yet — click New Project to get started.</Card>}
        </TabsContent>

        {/* ── Projects ─────────────────────────────────────────────────────── */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex gap-3 items-center">
            <Input className="w-[240px]" placeholder="Search projects..." value={projectFilter} onChange={e => setProjectFilter(e.target.value)} />
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
                {filteredProjects.map(p => (
                  <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-semibold">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.projectNumber} · {p.startDate}</p>
                    </td>
                    <td className="p-3">{getEmpName(p.managerId)}</td>
                    <td className="p-3">{getDeptName(p.departmentId)}</td>
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
                        <Button size="sm" variant="ghost" onClick={() => startEditProject(p)}>Edit</Button>
                        {p.status !== 'Completed' && <Button size="sm" variant="ghost" onClick={() => setProjectStatus(p.id, 'Completed')}>Complete</Button>}
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete project "${p.name}"? This also removes its tasks, timesheets and expenses.`)) deleteProject(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProjects.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No projects found</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* ── Tasks ────────────────────────────────────────────────────────── */}
        <TabsContent value="tasks" className="space-y-4">
          <Card className="p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2"><ListChecks className="h-4 w-4" /> Quick Add Task</p>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-3"><FormField label="Project"><Select value={taskForm.projectId} onValueChange={v => v !== null && setForm('task', 'projectId', v)}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select></FormField></div>
              <div className="col-span-3"><FormField label="Title"><Input value={taskForm.title} onChange={e => setForm('task', 'title', e.target.value)} placeholder="Task title" /></FormField></div>
              <div className="col-span-2"><FormField label="Assignee"><Select value={taskForm.assigneeId} onValueChange={v => v !== null && setForm('task', 'assigneeId', v)}>
                <SelectTrigger><SelectValue placeholder="Assignee" /></SelectTrigger>
                <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
              </Select></FormField></div>
              <div className="col-span-2"><FormField label="Priority"><Select value={taskForm.priority} onValueChange={v => v !== null && setForm('task', 'priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select></FormField></div>
              <div className="col-span-1"><FormField label="Hours"><Input type="number" value={taskForm.estimatedHours} onChange={e => setForm('task', 'estimatedHours', e.target.value)} /></FormField></div>
              <div className="col-span-1"><Button onClick={handleSaveTask} disabled={saving || !taskForm.projectId || !taskForm.title}><Plus className="mr-1.5 h-4 w-4" />Add</Button></div>
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
                    <td className="p-3">{getProject(t.projectId)?.name || '—'}</td>
                    <td className="p-3">{getEmpName(t.assigneeId)}</td>
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
        </TabsContent>

        {/* ── Timesheets ───────────────────────────────────────────────────── */}
        <TabsContent value="timesheets" className="space-y-4">
          <Card className="p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2"><Timer className="h-4 w-4" /> Log Hours</p>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-2"><FormField label="Project"><Select value={tsForm.projectId} onValueChange={v => v !== null && setForm('ts', 'projectId', v)}>
                <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select></FormField></div>
              <div className="col-span-2"><FormField label="Employee"><Select value={tsForm.employeeId} onValueChange={v => v !== null && setForm('ts', 'employeeId', v)}>
                <SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger>
                <SelectContent>{employees.filter(e => e.status === 'Active').map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}</SelectContent>
              </Select></FormField></div>
              <div className="col-span-2"><FormField label="Date"><Input type="date" value={tsForm.date} onChange={e => setForm('ts', 'date', e.target.value)} /></FormField></div>
              <div className="col-span-1"><FormField label="Hours"><Input type="number" value={tsForm.hours} onChange={e => setForm('ts', 'hours', e.target.value)} /></FormField></div>
              <div className="col-span-1"><FormField label="Rate"><Input type="number" value={tsForm.billableRate} onChange={e => setForm('ts', 'billableRate', e.target.value)} /></FormField></div>
              <div className="col-span-3"><FormField label="Description"><Input value={tsForm.description} onChange={e => setForm('ts', 'description', e.target.value)} placeholder="Work performed" /></FormField></div>
              <div className="col-span-1"><Button onClick={handleSaveTimesheet} disabled={saving || !tsForm.projectId || !tsForm.employeeId}><Plus className="mr-1.5 h-4 w-4" />Log</Button></div>
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
                    <td className="p-3">{getProject(t.projectId)?.name || '—'}</td>
                    <td className="p-3">{getEmpName(t.employeeId)}</td>
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
        </TabsContent>

        {/* ── Expenses ─────────────────────────────────────────────────────── */}
        <TabsContent value="expenses" className="space-y-4">
          <Card className="p-4">
            <p className="text-sm font-medium mb-3 flex items-center gap-2"><ReceiptText className="h-4 w-4" /> Log Expense</p>
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-2"><FormField label="Project"><Select value={expenseForm.projectId} onValueChange={v => v !== null && setForm('expense', 'projectId', v)}>
                <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select></FormField></div>
              <div className="col-span-2"><FormField label="Category"><Select value={expenseForm.category} onValueChange={v => v !== null && setForm('expense', 'category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select></FormField></div>
              <div className="col-span-2"><FormField label="Description"><Input value={expenseForm.description} onChange={e => setForm('expense', 'description', e.target.value)} placeholder="What was purchased" /></FormField></div>
              <div className="col-span-2"><FormField label="Vendor"><Input value={expenseForm.vendorName} onChange={e => setForm('expense', 'vendorName', e.target.value)} /></FormField></div>
              <div className="col-span-1"><FormField label="Amount"><Input type="number" value={expenseForm.amount} onChange={e => setForm('expense', 'amount', e.target.value)} /></FormField></div>
              <div className="col-span-1"><FormField label="Date"><Input type="date" value={expenseForm.expenseDate} onChange={e => setForm('expense', 'expenseDate', e.target.value)} /></FormField></div>
              <div className="col-span-2"><Button onClick={handleSaveExpense} disabled={saving || !expenseForm.projectId}><Plus className="mr-1.5 h-4 w-4" />Log Expense</Button></div>
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
                    <td className="p-3">{getProject(e.projectId)?.name || '—'}</td>
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
        </TabsContent>

        {/* ── Profitability ────────────────────────────────────────────────── */}
        <TabsContent value="profitability" className="space-y-4">
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
                {profitability.map(({ project, labor, cost, hours, tasks: tc, done, margin }) => (
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
                {profitability.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">No project data available</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
