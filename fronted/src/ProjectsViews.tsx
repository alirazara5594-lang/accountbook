import React, { useState, useEffect, useMemo } from 'react';
import { useProjectsStore, usePayrollStore, useCompanyStore } from './stores';
import type { Project, ProjectStatus, ProjectTaskStatus, TaskPriority } from './api/modules/projects.api';
import {
  FolderKanban, Plus, CheckCircle2, Save, Trash2, ListChecks, Timer,
  ReceiptText, Layers, AlertTriangle, Banknote, Search, RefreshCw,
  X, Download, FileSpreadsheet, FileText, Eye, Check, DollarSign,
  Scale, Activity, Briefcase, FileCheck2, LayoutGrid,
  Table as TableIcon, ArrowRight, ShieldCheck, Receipt
} from 'lucide-react';
import { money } from './lib/currency';
import { KpiCard, KpiGrid } from './components/ui/kpi-card';
import { StatusChip } from './components/ui/status-chip';
import { EmptyState } from './components/ui/empty-state';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const today = () => new Date().toISOString().split('T')[0];

const STATUS_OPTIONS: ProjectStatus[] = ['Planning', 'Active', 'OnHold', 'Completed', 'Cancelled'];
const TASK_STATUS_OPTIONS: ProjectTaskStatus[] = ['NotStarted', 'InProgress', 'Blocked', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];

// ── Status Badges & Styles ──────────────────────────────────────────────────
const projectStatusHex: Record<string, string> = {
  Active: '#10b981',
  Completed: '#10b981',
  OnHold: '#f59e0b',
  Cancelled: '#ef4444',
};
const projectStatusColor = (s: string) => projectStatusHex[s] ?? '#94a3b8';

const taskStatusBadge = (s: string) => {
  switch (s) {
    case 'Completed':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200';
    case 'InProgress':
      return 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200';
    case 'Blocked':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
  }
};

const priorityHex: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Medium: '#3b82f6',
};
const priorityColor = (p: string) => priorityHex[p] ?? '#94a3b8';

function useProjectData() {
  const store = useProjectsStore();
  const { employees, departments, fetchAll: fetchPayrollAll } = usePayrollStore();
  const { entities, fetchCompanies } = useCompanyStore();

  useEffect(() => {
    store.fetchAll();
    fetchPayrollAll();
    fetchCompanies();
  }, []);

  return { ...store, employees, departments, entities };
}

const empName = (employees: any[], id?: string | null) => {
  if (!id) return 'Unassigned';
  const e = employees.find(x => x.id === id);
  return e ? `${e.firstName} ${e.lastName}` : 'Unassigned';
};

const entityName = (entities: any[], id?: string | null) => {
  if (!id) return 'Default Corporate Entity';
  return entities.find(e => e.id === id)?.name || 'Default Corporate Entity';
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. PROJECTS SUMMARY VIEW (Portfolio Command Center)
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectsSummaryView() {
  const { projects, tasks, timesheets, expenses } = useProjectData();

  const totalBudget = useMemo(() => projects.reduce((s, p) => s + (p.budget || 0), 0), [projects]);
  const totalLaborCost = useMemo(() => timesheets.reduce((s, t) => s + (t.hours || 0) * (t.billableRate || 0), 0), [timesheets]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses]);
  const totalActualCost = totalLaborCost + totalExpenses;

  const activeProjects = useMemo(() => projects.filter(p => p.status === 'Active'), [projects]);
  const completedProjects = useMemo(() => projects.filter(p => p.status === 'Completed'), [projects]);

  const avgProgress = useMemo(() => {
    if (projects.length === 0) return 0;
    return Math.round(projects.reduce((s, p) => s + (p.progressPercent || 0), 0) / projects.length);
  }, [projects]);

  const earnedValue = totalBudget * (avgProgress / 100);
  const costVariance = earnedValue - totalActualCost;
  const cpi = totalActualCost > 0 ? (earnedValue / totalActualCost) : 1;

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><FolderKanban className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Executive Project Portfolio &amp; Governance</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                IAS/IFRS 15 &amp; GAAP compliant contract accounting, Earned Value Analysis (EVM), and lifecycle control.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> IFRS 15 PoC Active
          </span>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Active Portfolios</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600"><FolderKanban className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-[var(--color-text-strong)]">{activeProjects.length} / {projects.length}</div>
          <div className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {completedProjects.length} Projects Delivered
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Total Contract Budget</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600"><DollarSign className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-blue-600 font-mono">{money(totalBudget)}</div>
          <div className="text-[11px] text-[var(--color-text-muted)]">Approved Baseline Budget (BAC)</div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Incurred Actual Cost (AC)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600"><ReceiptText className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-purple-600 font-mono">{money(totalActualCost)}</div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            Labor: {money(totalLaborCost)} · Exp: {money(totalExpenses)}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Avg Progress (PoC %)</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600"><Activity className="w-4 h-4" /></div>
          </div>
          <div className="text-2xl font-black text-[var(--color-text-strong)]">{avgProgress}%</div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${avgProgress}%` }} />
          </div>
        </div>
      </div>

      {/* EVM Earned Value & Forensic Performance Banner */}
      <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-gradient-to-r from-teal-500/5 via-blue-500/5 to-purple-500/5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-[var(--color-text-strong)] flex items-center gap-2">
              <Scale className="w-4 h-4 text-teal-600" />
              IFRS 15 Earned Value Management (EVM) Financial Standing
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Real-time synchronization of Earned Value (EV), Cost Variance (CV), and Cost Performance Index (CPI).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cpi >= 1 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
              CPI: {cpi.toFixed(2)} ({cpi >= 1 ? 'Under Budget / Efficient' : 'Cost Overrun Risk'})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--color-border)] text-xs">
          <div className="space-y-1">
            <span className="text-[var(--color-text-muted)]">Earned Value (EV = BAC × PoC):</span>
            <div className="text-base font-bold font-mono text-[var(--color-text-strong)]">{money(earnedValue)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[var(--color-text-muted)]">Forensic Cost Variance (CV = EV - AC):</span>
            <div className={`text-base font-bold font-mono ${costVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {costVariance >= 0 ? `+${money(costVariance)}` : `-${money(Math.abs(costVariance))}`}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[var(--color-text-muted)]">Open Operational Tasks:</span>
            <div className="text-base font-bold text-[var(--color-text-strong)]">
              {tasks.filter(t => t.status !== 'Completed').length} Pending Execution
            </div>
          </div>
        </div>
      </div>

      {/* Active Portfolios Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--color-text-strong)] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-teal-600" /> Active Commercial Projects
          </h2>
          <span className="text-xs text-[var(--color-text-muted)]">{projects.length} Total Projects</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.slice(0, 6).map(p => {
            const pLabor = timesheets.filter(t => t.projectId === p.id).reduce((s, t) => s + ((t.hours || 0) * (t.billableRate || 0)), 0);
            const pExp = expenses.filter(e => e.projectId === p.id).reduce((s, e) => s + (e.amount || 0), 0);
            const pCost = pLabor + pExp;

            return (
              <div key={p.id} className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                      {p.projectNumber || 'PRJ-PRO'}
                    </span>
                    <h3 className="font-bold text-xs text-[var(--color-text-strong)] mt-1.5">{p.name}</h3>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{p.customerName || 'General Client'}</p>
                  </div>
                  <StatusChip status={p.status} label={p.status} hex={projectStatusColor(p.status)} />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--color-text-muted)]">Progress (PoC)</span>
                    <span className="font-bold text-teal-600">{p.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-600 rounded-full" style={{ width: `${Math.min(100, p.progressPercent || 0)}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border)] text-xs">
                  <div>
                    <span className="text-[10.5px] text-[var(--color-text-muted)] block">Budget</span>
                    <span className="font-bold font-mono text-[var(--color-text-strong)]">{money(p.budget || 0)}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] text-[var(--color-text-muted)] block">Actual Cost</span>
                    <span className="font-bold font-mono text-purple-600">{money(pCost)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROJECTS MASTER LIST VIEW & LIFECYCLE REGISTER
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectsListView({ activeEntityId }: { activeEntityId?: string }) {
  const { projects, fetchAll, createProject, updateProject, deleteProject, employees, departments, entities } = useProjectData();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [inspectorProject, setInspectorProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Planning' as ProjectStatus,
    startDate: today(),
    endDate: '',
    managerId: '',
    departmentId: '',
    customerId: '',
    customerName: '',
    budget: 0,
    currency: 'USD',
    companyId: activeEntityId || ''
  });

  const openCreate = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'Planning',
      startDate: today(),
      endDate: '',
      managerId: employees[0]?.id || '',
      departmentId: departments[0]?.id || '',
      customerId: '',
      customerName: '',
      budget: 50000,
      currency: 'USD',
      companyId: activeEntityId || entities[0]?.id || ''
    });
    setModalStep(1);
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditingProject(p);
    setFormData({
      name: p.name,
      description: p.description || '',
      status: p.status,
      startDate: p.startDate ? String(p.startDate) : today(),
      endDate: p.endDate ? String(p.endDate) : '',
      managerId: p.managerId || '',
      departmentId: p.departmentId || '',
      customerId: p.customerId || '',
      customerName: p.customerName || '',
      budget: p.budget || 0,
      currency: p.currency || 'USD',
      companyId: p.companyId || activeEntityId || ''
    });
    setModalStep(1);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProject) {
      await updateProject(editingProject.id, formData);
    } else {
      await createProject(formData);
    }
    setModalOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete project "${name}"? All associated WBS phases and records will be affected.`)) {
      await deleteProject(id);
      fetchAll();
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesQ = (p.name || '').toLowerCase().includes(query.toLowerCase()) ||
                       (p.projectNumber || '').toLowerCase().includes(query.toLowerCase()) ||
                       (p.customerName || '').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [projects, query, statusFilter]);

  // Exports
  const handleExportCSV = () => {
    const headers = ['Project Code', 'Project Name', 'Client / Customer', 'Status', 'Start Date', 'Target End Date', 'Project Manager', 'Contract Budget', 'Progress %'];
    const rows = filteredProjects.map(p => [
      p.projectNumber || 'PRJ-PRO',
      p.name,
      p.customerName || 'General Client',
      p.status,
      p.startDate ? String(p.startDate) : '',
      p.endDate ? String(p.endDate) : 'Ongoing',
      empName(employees, p.managerId),
      p.budget || 0,
      `${p.progressPercent || 0}%`
    ]);
    downloadCSV('Projects_Portfolio_Master_Register', headers, rows);
  };

  const handleExportExcel = () => {
    const headers = ['Project Code', 'Project Name', 'Client / Customer', 'Status', 'Start Date', 'Target End Date', 'Project Manager', 'Contract Budget', 'Progress %'];
    const rows = filteredProjects.map(p => [
      p.projectNumber || 'PRJ-PRO',
      p.name,
      p.customerName || 'General Client',
      p.status,
      p.startDate ? String(p.startDate) : '',
      p.endDate ? String(p.endDate) : 'Ongoing',
      empName(employees, p.managerId),
      p.budget || 0,
      `${p.progressPercent || 0}%`
    ]);
    downloadExcel('Projects_Portfolio_Master_Register', 'Projects_Register', headers, rows);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('AMS ERP — Master Project Portfolio Directory', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Filter: ${statusFilter} Status`, 14, 21);

    const rows = filteredProjects.map(p => [
      p.projectNumber || 'PRJ-PRO',
      p.name,
      p.customerName || 'General Client',
      p.status,
      empName(employees, p.managerId),
      money(p.budget || 0),
      `${p.progressPercent || 0}%`,
      p.startDate ? String(p.startDate) : ''
    ]);

    autoTable(doc, {
      startY: 26,
      head: [['Code', 'Project Name', 'Client', 'Status', 'Manager', 'Budget', 'Progress', 'Start Date']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [0, 106, 167], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    doc.save('Projects_Portfolio_Master_Register.pdf');
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><FolderKanban className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Project Master Portfolio &amp; Control Register</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Comprehensive lifecycle governance: Inception, WBS Milestones, Direct Labor, Job Costing, Progress Billing, and Forensic Variance Comparison.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap overflow-x-auto">
          <button
            onClick={fetchAll}
            title="Refresh Projects Register"
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-teal-600" />
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <FileText className="w-4 h-4 text-blue-600" /> CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
          </button>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <Download className="w-4 h-4 text-rose-500" /> PDF
          </button>

          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Create Project
          </button>
          </div>
        </div>
      </div>

      {/* Start-to-End Visual Project Lifecycle Flow */}
      <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--color-text-strong)]">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" /> End-to-End Project Control Architecture
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] font-normal">IFRS 15 / ASC 606 & GAAP Aligned</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {[
            { step: '1. Inception', desc: 'Charter, Budget & Client Scope', icon: Briefcase, color: 'text-blue-600' },
            { step: '2. WBS Planning', desc: 'Milestones & Work Breakdown', icon: Layers, color: 'text-indigo-600' },
            { step: '3. Execution', desc: 'Tasks & Timesheet Hours', icon: ListChecks, color: 'text-teal-600' },
            { step: '4. Direct Costing', desc: 'Materials, Labor & Overheads', icon: ReceiptText, color: 'text-purple-600' },
            { step: '5. Billing & PoC', desc: 'Applications & Retention %', icon: Banknote, color: 'text-amber-600' },
            { step: '6. End Comparison', desc: 'Forensic Budget vs Actuals', icon: Scale, color: 'text-emerald-600' },
          ].map((s, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-1 text-center">
              <s.icon className={`w-4 h-4 mx-auto ${s.color}`} />
              <div className="font-bold text-[11px] text-[var(--color-text-strong)]">{s.step}</div>
              <div className="text-[9.5px] text-[var(--color-text-muted)] leading-tight">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Control & Search Toolbar */}
      <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search projects by code, project name, customer, or manager..."
              className="w-full pl-11 pr-8 py-2.5 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-teal-500 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none"
            >
              <option value="All">All Statuses ({projects.length})</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div className="flex items-center border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface-muted)]">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-xs flex items-center gap-1.5 transition-colors ${viewMode === 'table' ? 'bg-teal-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'}`}
              >
                <TableIcon className="w-3.5 h-3.5" /> Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-xs flex items-center gap-1.5 transition-colors ${viewMode === 'grid' ? 'bg-teal-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View: Table */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-cyan-500/[0.05] dark:bg-cyan-400/[0.07] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-3.5 pl-5">Project Code & Name</th>
                  <th className="p-3.5">Client & Sector</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Target Schedule</th>
                  <th className="p-3.5 text-right">Contract Budget</th>
                  <th className="p-3.5">Progress (PoC)</th>
                  <th className="p-3.5">Project Manager</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredProjects.map(p => (
                  <tr key={p.id} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                    <td className="p-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 border border-teal-200 dark:border-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[var(--color-text-strong)] hover:text-teal-600 cursor-pointer" onClick={() => setInspectorProject(p)}>
                            {p.name}
                          </div>
                          <div className="font-mono text-[11px] text-[var(--color-text-muted)]">
                            {p.projectNumber || 'PRJ-PRO'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-medium text-[var(--color-text-strong)]">{p.customerName || 'General Client'}</div>
                      <div className="text-[10.5px] text-[var(--color-text-muted)]">{entityName(entities, p.companyId)}</div>
                    </td>

                    <td className="p-3.5">
                      <StatusChip status={p.status} label={p.status} hex={projectStatusColor(p.status)} />
                    </td>

                    <td className="p-3.5">
                      <div className="text-[11px] text-[var(--color-text-strong)] font-mono">
                        {p.startDate ? String(p.startDate) : '—'}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-muted)]">
                        Due: {p.endDate ? String(p.endDate) : 'Ongoing'}
                      </div>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-[var(--color-text-strong)]">
                      {money(p.budget || 0)}
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-1 w-28">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{p.progressPercent || 0}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-600 rounded-full" style={{ width: `${Math.min(100, p.progressPercent || 0)}%` }} />
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 text-[11px] text-[var(--color-text-muted)]">
                      {empName(employees, p.managerId)}
                    </td>

                    <td className="p-3.5 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setInspectorProject(p)}
                          title="Inspect Project Lifecycle"
                          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-teal-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          title="Edit Project Charter"
                          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-blue-600 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          title="Delete Project"
                          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon={FolderKanban} title="No matching projects found" hint="Adjust the search or status filter, or create a new project charter." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map(p => (
            <div key={p.id} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4 hover:border-teal-500/40 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800">
                    {p.projectNumber || 'PRJ-PRO'}
                  </span>
                  <h3 className="font-bold text-sm text-[var(--color-text-strong)] mt-2">{p.name}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{p.customerName || 'General Client'}</p>
                </div>
                <StatusChip status={p.status} label={p.status} hex={projectStatusColor(p.status)} />
              </div>

              <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                {p.description || 'No detailed scope charter provided.'}
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[var(--color-text-muted)]">Execution Progress</span>
                  <span className="text-teal-600 font-bold">{p.progressPercent || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: `${Math.min(100, p.progressPercent || 0)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--color-border)] text-xs">
                <div>
                  <span className="text-[10.5px] text-[var(--color-text-muted)] block">Contract Budget</span>
                  <span className="font-bold font-mono text-[var(--color-text-strong)]">{money(p.budget || 0)}</span>
                </div>
                <div>
                  <span className="text-[10.5px] text-[var(--color-text-muted)] block">Manager</span>
                  <span className="font-medium text-[var(--color-text-strong)] truncate block">{empName(employees, p.managerId)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <button
                  onClick={() => setInspectorProject(p)}
                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL (3-Step Wizard) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 border border-teal-500/20">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text-strong)]">
                    {editingProject ? 'Edit Project Charter & Scope' : 'Create New Project Charter'}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Step {modalStep} of 3 — Complete all financial & operational parameters</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-3 border-b border-[var(--color-border)] text-xs text-center font-semibold bg-[var(--color-surface)]">
              <button
                type="button"
                onClick={() => setModalStep(1)}
                className={`py-2.5 border-b-2 transition-colors ${modalStep === 1 ? 'border-teal-600 text-teal-600 font-bold bg-teal-50/20' : 'border-transparent text-[var(--color-text-muted)]'}`}
              >
                1. Charter & Inception
              </button>
              <button
                type="button"
                onClick={() => setModalStep(2)}
                className={`py-2.5 border-b-2 transition-colors ${modalStep === 2 ? 'border-teal-600 text-teal-600 font-bold bg-teal-50/20' : 'border-transparent text-[var(--color-text-muted)]'}`}
              >
                2. Governance & Entity
              </button>
              <button
                type="button"
                onClick={() => setModalStep(3)}
                className={`py-2.5 border-b-2 transition-colors ${modalStep === 3 ? 'border-teal-600 text-teal-600 font-bold bg-teal-50/20' : 'border-transparent text-[var(--color-text-muted)]'}`}
              >
                3. Financials & Budget
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="p-6 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
                {modalStep === 1 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Project Title / Name *</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Metro Expressway Civil Construction - Phase 2"
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Scope & Objective Description</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Define major deliverables, client specifications, and completion criteria..."
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Client / Customer Name *</label>
                        <input
                          required
                          type="text"
                          value={formData.customerName}
                          onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                          placeholder="e.g. National Highway Authority"
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Initial Project Status</label>
                        <select
                          value={formData.status}
                          onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 2 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Start Date *</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Target Completion Date</label>
                        <input
                          type="date"
                          value={formData.endDate}
                          onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Project Manager</label>
                        <select
                          value={formData.managerId}
                          onChange={e => setFormData({ ...formData, managerId: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                        >
                          <option value="">Select Project Manager</option>
                          {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Corporate Entity Scope</label>
                        <select
                          value={formData.companyId}
                          onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                        >
                          {entities.map(e => <option key={e.id} value={e.id}>{e.name} ({e.currencyCode || 'USD'})</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {modalStep === 3 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Total Contract Budget *</label>
                        <input
                          required
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.budget}
                          onChange={e => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                          placeholder="50000"
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Billing Currency</label>
                        <select
                          value={formData.currency}
                          onChange={e => setFormData({ ...formData, currency: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="AED">AED (د.إ)</option>
                          <option value="SAR">SAR (﷼)</option>
                          <option value="PKR">PKR (₨)</option>
                          <option value="CAD">CAD (C$)</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 bg-teal-50/50 dark:bg-teal-950/20 rounded-xl border border-teal-200/60 dark:border-teal-800/60 text-[11px] text-teal-800 dark:text-teal-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-teal-600" /> IFRS 15 / ASC 606 Revenue Recognition
                      </div>
                      <p>
                        This project will automatically recognize revenue Over Time based on Percentage of Completion (PoC) and track Work-in-Progress (Contract Assets / Contract Liabilities).
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]">
                {modalStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setModalStep((modalStep - 1) as any)}
                    className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface)] transition-all"
                  >
                    Back
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  {modalStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setModalStep((modalStep + 1) as any)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Save Project Charter
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT INSPECTOR DRAWER */}
      {inspectorProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-xl h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] shadow-2xl p-6 overflow-y-auto space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)]">
              <div>
                <span className="font-mono text-xs font-bold text-teal-600">{inspectorProject.projectNumber || 'PRJ-PRO'}</span>
                <h2 className="text-base font-black text-[var(--color-text-strong)]">{inspectorProject.name}</h2>
              </div>
              <button onClick={() => setInspectorProject(null)} className="p-2 rounded-xl hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Client / Customer</span>
                  <span className="font-bold text-[var(--color-text-strong)]">{inspectorProject.customerName || 'General Client'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Project Manager</span>
                  <span className="font-bold text-[var(--color-text-strong)]">{empName(employees, inspectorProject.managerId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Status</span>
                  <StatusChip status={inspectorProject.status} label={inspectorProject.status} hex={projectStatusColor(inspectorProject.status)} />
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Contract Baseline Budget</span>
                  <span className="font-bold font-mono text-teal-600">{money(inspectorProject.budget || 0)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600" /> Start-to-End Governance Status
                </h4>
                <p className="text-[var(--color-text-muted)] leading-relaxed">
                  {inspectorProject.description || 'Project charter initiated. All milestones and cost elements are tracked under continuous forensic audit.'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] flex justify-end">
              <button
                onClick={() => setInspectorProject(null)}
                className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. WORK BREAKDOWN STRUCTURE (WBS) & PLANNING VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectPlanningView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, phases, tasks, createPhase, fetchPhases, fetchAll } = useProjectData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [phaseModalOpen, setPhaseModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', orderIndex: 1 });

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const currentPhases = useMemo(() => {
    return phases.filter(p => p.projectId === selectedProjectId);
  }, [phases, selectedProjectId]);

  const handleCreatePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !selectedProjectId) return;
    await createPhase({ projectId: selectedProjectId, name: formData.name, description: formData.description, orderIndex: formData.orderIndex });
    setFormData({ name: '', description: '', orderIndex: currentPhases.length + 2 });
    setPhaseModalOpen(false);
    fetchPhases(selectedProjectId);
    fetchAll();
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Layers className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Work Breakdown Structure (WBS) &amp; Phase Planning</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Deconstruct project scope into structured phases, milestones, deliverables, and execution sequences.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none font-bold"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.projectNumber || 'PRJ'})</option>)}
          </select>

          <button
            onClick={() => setPhaseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add WBS Phase
          </button>
          </div>
        </div>
      </div>

      {/* WBS Phase Sequence */}
      <div className="space-y-4">
        {currentPhases.map((phase, idx) => {
          const phaseTasks = tasks.filter(t => t.phaseId === phase.id);
          const doneTasks = phaseTasks.filter(t => t.status === 'Completed').length;
          const progress = phaseTasks.length > 0 ? Math.round((doneTasks / phaseTasks.length) * 100) : 0;

          return (
            <div key={phase.id} className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border border-indigo-200 font-mono font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text-strong)]">{phase.name}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">{phase.description || 'Milestone deliverable sequence'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{doneTasks}/{phaseTasks.length} Tasks Complete</span>
                    <div className="w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${taskStatusBadge(phase.status)}`}>
                    {phase.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {currentPhases.length === 0 && (
          <EmptyState
            icon={Layers}
            title="No WBS Phases Defined"
            hint="Deconstruct your project into manageable phases to begin task assignments."
            action={
              <button
                onClick={() => setPhaseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Create Phase 1
              </button>
            }
          />
        )}
      </div>

      {/* ADD PHASE MODAL */}
      {phaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> Define New WBS Phase
              </h3>
              <button onClick={() => setPhaseModalOpen(false)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePhase} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Phase Title / Milestone *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Structural Substructure & Foundation"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Deliverable Scope</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of deliverables expected in this phase..."
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setPhaseModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  Create Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TASKS & RESOURCE GOVERNANCE VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectsTasksView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, tasks, phases, employees, createTask, setTaskStatus, fetchAll } = useProjectData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [query, setQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    phaseId: '',
    assigneeId: '',
    status: 'NotStarted' as ProjectTaskStatus,
    priority: 'Medium' as TaskPriority,
    startDate: today(),
    dueDate: '',
    estimatedHours: 10
  });

  const currentTasks = useMemo(() => {
    return tasks.filter(t => (!selectedProjectId || t.projectId === selectedProjectId) &&
                             (t.title || '').toLowerCase().includes(query.toLowerCase()));
  }, [tasks, selectedProjectId, query]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !selectedProjectId) return;
    await createTask({
      projectId: selectedProjectId,
      phaseId: formData.phaseId || null,
      title: formData.title,
      description: formData.description,
      assigneeId: formData.assigneeId || null,
      status: formData.status,
      priority: formData.priority,
      startDate: formData.startDate,
      dueDate: formData.dueDate || null,
      estimatedHours: formData.estimatedHours
    });
    setTaskModalOpen(false);
    fetchAll();
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><ListChecks className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Task Execution &amp; Resource Governance</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Assign work packages, monitor task dependencies, record estimated vs actual hours, and manage workflow status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none font-bold"
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <button
            onClick={() => setTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
          </div>
        </div>
      </div>

      {/* Task Filter & Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
        <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tasks by title..."
              className="w-full pl-11 pr-8 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cyan-500/[0.05] dark:bg-cyan-400/[0.07] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 pl-5">Task Title</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Assignee</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-right">Est. Hours</th>
                <th className="p-3.5 text-right">Actual Hours</th>
                <th className="p-3.5 pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {currentTasks.map(t => (
                <tr key={t.id} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                  <td className="p-3.5 pl-5 font-bold text-[var(--color-text-strong)]">{t.title}</td>
                  <td className="p-3.5">
                    <StatusChip status={t.priority} label={t.priority} hex={priorityColor(t.priority)} />
                  </td>
                  <td className="p-3.5 text-[var(--color-text-muted)]">{empName(employees, t.assigneeId)}</td>
                  <td className="p-3.5">
                    <select
                      value={t.status}
                      onChange={e => {
                        setTaskStatus(t.id, e.target.value as ProjectTaskStatus);
                        fetchAll();
                      }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none ${taskStatusBadge(t.status)}`}
                    >
                      {TASK_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-[var(--color-text-muted)]">{t.dueDate ? String(t.dueDate) : '—'}</td>
                  <td className="p-3.5 text-right font-mono font-semibold">{t.estimatedHours || 0}h</td>
                  <td className="p-3.5 text-right font-mono font-bold text-teal-600">{t.actualHours || 0}h</td>
                  <td className="p-3.5 pr-5 text-right">
                    <button
                      onClick={() => setTaskStatus(t.id, t.status === 'Completed' ? 'InProgress' : 'Completed')}
                      className={`p-1.5 rounded-lg border text-xs font-semibold ${t.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'}`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {currentTasks.length === 0 && (
                  <tr>
                    <td colSpan={8}><EmptyState icon={ListChecks} title="No tasks registered for this project" hint="Add a work package task to begin execution tracking." /></td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-teal-600" /> Create Work Package Task
              </h3>
              <button onClick={() => setTaskModalOpen(false)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Task Title *</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Complete Geotechnical Soil Testing"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">WBS Phase</label>
                  <select
                    value={formData.phaseId}
                    onChange={e => setFormData({ ...formData, phaseId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  >
                    <option value="">General (No Phase)</option>
                    {phases.filter(p => p.projectId === selectedProjectId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Assignee</label>
                  <select
                    value={formData.assigneeId}
                    onChange={e => setFormData({ ...formData, assigneeId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  >
                    <option value="">Unassigned</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  >
                    {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Est. Hours</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedHours}
                    onChange={e => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => setTaskModalOpen(false)} className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DIRECT JOB COSTING & BUDGET BREAKDOWN VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectCostingView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, timesheets, expenses } = useProjectData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');

  const project = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const pTimesheets = useMemo(() => timesheets.filter(t => t.projectId === selectedProjectId), [timesheets, selectedProjectId]);
  const pExpenses = useMemo(() => expenses.filter(e => e.projectId === selectedProjectId), [expenses, selectedProjectId]);

  const laborCost = pTimesheets.reduce((s, t) => s + (t.hours || 0) * (t.billableRate || 0), 0);
  const expenseCost = pExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalCost = laborCost + expenseCost;
  const budget = project?.budget || 0;
  const variance = budget - totalCost;

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><ReceiptText className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Direct Job Costing &amp; Cost Breakdown Structure (CBS)</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Forensic cost allocation across Direct Labor, Materials, Subcontractors, Plant Equipment, and Overheads.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none font-bold"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          </div>
        </div>
      </div>

      {/* CBS Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Contract Budget</span>
          <div className="text-xl font-black text-blue-600 font-mono">{money(budget)}</div>
          <div className="text-[10.5px] text-[var(--color-text-muted)]">Approved Baseline</div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Direct Labor</span>
          <div className="text-xl font-black text-teal-600 font-mono">{money(laborCost)}</div>
          <div className="text-[10.5px] text-[var(--color-text-muted)]">{pTimesheets.length} Timesheet postings</div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Direct Materials & Exp</span>
          <div className="text-xl font-black text-purple-600 font-mono">{money(expenseCost)}</div>
          <div className="text-[10.5px] text-[var(--color-text-muted)]">{pExpenses.length} Expense vouchers</div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Remaining Allowance</span>
          <div className={`text-xl font-black font-mono ${variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {money(variance)}
          </div>
          <div className="text-[10.5px] text-[var(--color-text-muted)]">{variance >= 0 ? 'Within budget' : 'Cost overrun'}</div>
        </div>
      </div>

      {/* Incurred Cost Journal */}
      <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
        <h3 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-purple-600" /> Incurred Direct Cost Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cyan-500/[0.05] dark:bg-cyan-400/[0.07] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3 pl-4">Cost Category</th>
                <th className="p-3">Reference / Description</th>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Incurred Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {pTimesheets.map(t => (
                <tr key={t.id} className="hover:bg-[var(--color-surface-muted)]/50">
                  <td className="p-3 pl-4 font-bold text-teal-600">Direct Labor</td>
                  <td className="p-3 text-[var(--color-text-strong)]">{t.description || 'Logged Timesheet Labor'} ({t.hours}h @ {money(t.billableRate || 0)}/h)</td>
                  <td className="p-3 font-mono text-[11px] text-[var(--color-text-muted)]">{String(t.date)}</td>
                  <td className="p-3 text-right font-mono font-bold text-[var(--color-text-strong)]">{money((t.hours || 0) * (t.billableRate || 0))}</td>
                </tr>
              ))}
              {pExpenses.map(e => (
                <tr key={e.id} className="hover:bg-[var(--color-surface-muted)]/50">
                  <td className="p-3 pl-4 font-bold text-purple-600">{e.category || 'Direct Expense'}</td>
                  <td className="p-3 text-[var(--color-text-strong)]">{e.description} {e.vendorName ? `· ${e.vendorName}` : ''}</td>
                  <td className="p-3 font-mono text-[11px] text-[var(--color-text-muted)]">{String(e.expenseDate)}</td>
                  <td className="p-3 text-right font-mono font-bold text-[var(--color-text-strong)]">{money(e.amount || 0)}</td>
                </tr>
              ))}
              {pTimesheets.length === 0 && pExpenses.length === 0 && (
                <tr>
                  <td colSpan={4}><EmptyState icon={ReceiptText} title="No direct job costs posted" hint="Logged timesheets and expense vouchers for this project will appear here." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. TIMESHEETS VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectsTimesheetsView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, timesheets, employees, logTimesheet, approveTimesheet, deleteTimesheet, fetchAll } = useProjectData();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '',
    employeeId: employees[0]?.id || '',
    date: today(),
    hours: 8,
    description: '',
    billable: true,
    billableRate: 75,
    currency: 'USD'
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.employeeId) return;
    await logTimesheet(formData);
    setModalOpen(false);
    fetchAll();
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Timer className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Direct Labor &amp; Timesheet Logging</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Record employee operational hours, compute direct labor burden, and maintain supervisory audit approvals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Log Timesheet
          </button>
          </div>
        </div>
      </div>

      {/* Timesheets Register */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cyan-500/[0.05] dark:bg-cyan-400/[0.07] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 pl-5">Date</th>
                <th className="p-3.5">Employee</th>
                <th className="p-3.5">Project</th>
                <th className="p-3.5">Work Summary</th>
                <th className="p-3.5 text-right">Hours</th>
                <th className="p-3.5 text-right">Billable Rate</th>
                <th className="p-3.5 text-right">Labor Cost</th>
                <th className="p-3.5">Approval</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {timesheets.map(t => (
                <tr key={t.id} className="hover:bg-[var(--color-surface-muted)]/50">
                  <td className="p-3.5 pl-5 font-mono text-[11px] text-[var(--color-text-strong)]">{String(t.date)}</td>
                  <td className="p-3.5 font-bold text-[var(--color-text-strong)]">{empName(employees, t.employeeId)}</td>
                  <td className="p-3.5 text-[var(--color-text-muted)]">{projects.find(p => p.id === t.projectId)?.name || 'Project'}</td>
                  <td className="p-3.5 text-[var(--color-text-strong)]">{t.description || 'General engineering labor'}</td>
                  <td className="p-3.5 text-right font-mono font-bold">{t.hours}h</td>
                  <td className="p-3.5 text-right font-mono text-[var(--color-text-muted)]">{money(t.billableRate || 0)}/h</td>
                  <td className="p-3.5 text-right font-mono font-bold text-teal-600">{money((t.hours || 0) * (t.billableRate || 0))}</td>
                  <td className="p-3.5">
                    <button
                      onClick={() => { approveTimesheet(t.id); fetchAll(); }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.approved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                    >
                      {t.approved ? '✓ Approved' : 'Pending'}
                    </button>
                  </td>
                  <td className="p-3.5 pr-5 text-right">
                    <button onClick={() => { deleteTimesheet(t.id); fetchAll(); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {timesheets.length === 0 && (
                <tr>
                  <td colSpan={9}><EmptyState icon={Timer} title="No timesheet entries recorded yet" hint="Log operational hours to build the direct labor ledger." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG TIMESHEET MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-2">
                <Timer className="w-4 h-4 text-teal-600" /> Log Operational Timesheet
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Employee *</label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  >
                    {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Hours *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.hours}
                    onChange={e => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Rate / Hour ($)</label>
                  <input
                    type="number"
                    step="1"
                    value={formData.billableRate}
                    onChange={e => setFormData({ ...formData, billableRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Work Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of operational tasks completed..."
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold">
                  Save Timesheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PROGRESS BILLING & IFRS 15 RETENTION VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectBillingView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects } = useProjectData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [retentionPct, setRetentionPct] = useState<number>(5);

  const project = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const budget = project?.budget || 0;
  const progress = project?.progressPercent || 0;
  const earnedRevenue = (budget * progress) / 100;
  const retentionAmount = (earnedRevenue * retentionPct) / 100;
  const netCertifiedBilling = earnedRevenue - retentionAmount;

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Banknote className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Progress Billing &amp; IFRS 15 Contract Accounting</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Application for Payment (AIA G702/G703 style), Work-in-Progress (WIP), and Retention Money ledger.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none font-bold"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Contract Baseline (BAC)</span>
          <div className="text-xl font-black text-blue-600 font-mono">{money(budget)}</div>
          <div className="text-[10.5px] text-[var(--color-text-muted)]">Fixed Price / Lump Sum</div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Earned Valuation (PoC)</span>
          <div className="text-xl font-black text-teal-600 font-mono">{money(earnedRevenue)}</div>
          <div className="text-[10.5px] text-[var(--color-text-muted)]">Certified @ {progress}% progress</div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Retention Withheld</span>
            <select
              value={retentionPct}
              onChange={e => setRetentionPct(Number(e.target.value))}
              className="text-[10px] font-bold bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-md px-1 py-0.5 outline-none"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
            </select>
          </div>
          <div className="text-xl font-black text-amber-600 font-mono">{money(retentionAmount)}</div>
          <div className="text-[10.5px] text-[var(--color-text-muted)]">Contract Asset / Guarantee</div>
        </div>

        <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-1">
          <span className="text-xs text-[var(--color-text-muted)] font-semibold uppercase">Net Certified Invoice</span>
          <div className="text-xl font-black text-emerald-600 font-mono">{money(netCertifiedBilling)}</div>
          <div className="text-[10.5px] text-[var(--color-text-muted)]">Billable to client</div>
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
        <h3 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-amber-600" /> Application For Payment & Certificate Schedule
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cyan-500/[0.05] dark:bg-cyan-400/[0.07] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3 pl-4">App #</th>
                <th className="p-3">Billing Period</th>
                <th className="p-3 text-right">Scheduled Value</th>
                <th className="p-3 text-right">Work Completed %</th>
                <th className="p-3 text-right">Total Completed & Stored</th>
                <th className="p-3 text-right">Retention (Withheld)</th>
                <th className="p-3 pr-4 text-right">Current Payment Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              <tr className="hover:bg-[var(--color-surface-muted)]/50">
                <td className="p-3 pl-4 font-mono font-bold text-amber-600">AFP-001</td>
                <td className="p-3 text-[var(--color-text-strong)]">Progress Certificate - Current Stage</td>
                <td className="p-3 text-right font-mono font-bold text-[var(--color-text-strong)]">{money(budget)}</td>
                <td className="p-3 text-right font-mono font-bold text-teal-600">{progress}%</td>
                <td className="p-3 text-right font-mono font-bold">{money(earnedRevenue)}</td>
                <td className="p-3 text-right font-mono text-amber-600 font-bold">{money(retentionAmount)}</td>
                <td className="p-3 pr-4 text-right font-mono font-black text-emerald-600">{money(netCertifiedBilling)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-600" /> Retention Money Accounting Treatment (GAAP / IFRS 15)
          </div>
          <p>
            Retention receivable of {money(retentionAmount)} is classified as non-current / contract asset until issuance of Final Completion & Defect Liability Clearance Certificate.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. PROJECT EXPENSES VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectsExpensesView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, expenses, createExpense, deleteExpense, fetchAll } = useProjectData();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '',
    category: 'Direct Materials',
    description: '',
    vendorName: '',
    amount: 500,
    currency: 'USD',
    expenseDate: today(),
    billable: true
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.amount) return;
    await createExpense(formData);
    setModalOpen(false);
    fetchAll();
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Receipt className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Project Direct Expenses &amp; Disbursements</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Track material purchases, subcontractor billings, plant &amp; equipment rentals, and reimbursables.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Direct Expense
          </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cyan-500/[0.05] dark:bg-cyan-400/[0.07] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 pl-5">Date</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Project</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5">Vendor / Payee</th>
                <th className="p-3.5 text-right">Incurred Amount</th>
                <th className="p-3.5 text-center">Billable</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-[var(--color-surface-muted)]/50">
                  <td className="p-3.5 pl-5 font-mono text-[11px] text-[var(--color-text-strong)]">{String(e.expenseDate)}</td>
                  <td className="p-3.5 font-bold text-purple-600">{e.category}</td>
                  <td className="p-3.5 text-[var(--color-text-muted)]">{projects.find(p => p.id === e.projectId)?.name || 'Project'}</td>
                  <td className="p-3.5 text-[var(--color-text-strong)]">{e.description}</td>
                  <td className="p-3.5 text-[var(--color-text-muted)]">{e.vendorName || '—'}</td>
                  <td className="p-3.5 text-right font-mono font-bold text-[var(--color-text-strong)]">{money(e.amount || 0)}</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${e.billable ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {e.billable ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-3.5 pr-5 text-right">
                    <button onClick={() => { deleteExpense(e.id); fetchAll(); }} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={8}><EmptyState icon={Receipt} title="No project direct expenses recorded yet" hint="Post a direct expense voucher for materials, subcontractors, or plant hire." /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXPENSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-600" /> Post Direct Expense Voucher
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Project *</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                >
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  >
                    <option value="Direct Materials">Direct Materials</option>
                    <option value="Subcontractor">Subcontractor</option>
                    <option value="Plant & Equipment">Plant & Equipment</option>
                    <option value="Site Overhead">Site Overhead</option>
                    <option value="Permits & Legal">Permits & Legal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Amount ($) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Vendor / Payee</label>
                <input
                  type="text"
                  value={formData.vendorName}
                  onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                  placeholder="e.g. Apex Industrial Supplies"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details of expense voucher..."
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold">
                  Save Expense Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. PROFITABILITY & COMPREHENSIVE END-OF-PROJECT FORENSIC COMPARISON VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectProfitabilityView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, timesheets, expenses } = useProjectData();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');

  const project = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

  const pTimesheets = useMemo(() => timesheets.filter(t => t.projectId === selectedProjectId), [timesheets, selectedProjectId]);
  const pExpenses = useMemo(() => expenses.filter(e => e.projectId === selectedProjectId), [expenses, selectedProjectId]);

  const laborCost = pTimesheets.reduce((s, t) => s + (t.hours || 0) * (t.billableRate || 0), 0);
  const materialsCost = pExpenses.filter(e => e.category === 'Direct Materials').reduce((s, e) => s + (e.amount || 0), 0);
  const subcontractCost = pExpenses.filter(e => e.category === 'Subcontractor').reduce((s, e) => s + (e.amount || 0), 0);
  const plantCost = pExpenses.filter(e => e.category === 'Plant & Equipment').reduce((s, e) => s + (e.amount || 0), 0);
  const overheadCost = pExpenses.filter(e => e.category !== 'Direct Materials' && e.category !== 'Subcontractor' && e.category !== 'Plant & Equipment').reduce((s, e) => s + (e.amount || 0), 0);

  const actualCost = laborCost + materialsCost + subcontractCost + plantCost + overheadCost;
  const budget = project?.budget || 0;
  const progress = project?.progressPercent || 0;

  // EVM Calculations
  const earnedValue = (budget * progress) / 100;
  const costVariance = earnedValue - actualCost;
  const cpi = actualCost > 0 ? (earnedValue / actualCost) : 1;
  const eac = cpi > 0 ? (budget / cpi) : budget;
  const vac = budget - eac;

  // Comparison Matrix Data
  const comparisonData = [
    { category: 'Direct Labor & Engineering', budgeted: budget * 0.40, actual: laborCost },
    { category: 'Direct Materials & Supplies', budgeted: budget * 0.30, actual: materialsCost },
    { category: 'Subcontracting & Specialty Works', budgeted: budget * 0.15, actual: subcontractCost },
    { category: 'Plant Hire & Heavy Equipment', budgeted: budget * 0.10, actual: plantCost },
    { category: 'Site Overhead & Logistics', budgeted: budget * 0.05, actual: overheadCost },
  ];

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Scale className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">End-of-Project Comparison &amp; Forensic Variance Audit</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Audit-ready comparison between initial baseline contract budgets versus finalized actual expenditures with full EVM analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none font-bold"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          </div>
        </div>
      </div>

      {/* EVM Performance KPI Dashboard */}
      <KpiGrid cols={5}>
        <KpiCard icon={Banknote} label="Budget At Completion (BAC)" value={money(budget)} desc="Initial Baseline Contract" tone="blue" />
        <KpiCard icon={Activity} label="Earned Value (EV)" value={money(earnedValue)} desc={`PoC: ${progress}% Complete`} tone="teal" />
        <KpiCard icon={ReceiptText} label="Actual Cost (AC)" value={money(actualCost)} desc="Total Incurred Outflow" tone="purple" />
        <KpiCard icon={costVariance >= 0 ? CheckCircle2 : AlertTriangle} label="Cost Variance (CV = EV - AC)" value={costVariance >= 0 ? `+${money(costVariance)}` : `-${money(Math.abs(costVariance))}`} desc={costVariance >= 0 ? 'Favorable profit' : 'Unfavorable variance'} tone={costVariance >= 0 ? 'emerald' : 'rose'} />
        <KpiCard icon={Scale} label="Estimate At Completion (EAC)" value={money(eac)} desc={`VAC: ${money(vac)}`} tone="indigo" />
      </KpiGrid>

      {/* Forensic Comparison Matrix Table */}
      <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-600" /> Start-to-End Forensic Budget vs Actual Comparison Matrix
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-[var(--color-border)]">
            GAAP & IAS 23 Compliant
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cyan-500/[0.05] dark:bg-cyan-400/[0.07] border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5 pl-4">Cost Breakdown Structure (CBS) Element</th>
                <th className="p-3.5 text-right">Inception Baseline Budget</th>
                <th className="p-3.5 text-right">Final Incurred Actuals</th>
                <th className="p-3.5 text-right">Forensic Variance ($)</th>
                <th className="p-3.5 text-right">Variance (%)</th>
                <th className="p-3.5 pr-4 text-center">Audit Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {comparisonData.map((row, idx) => {
                const rowVariance = row.budgeted - row.actual;
                const rowPct = row.budgeted > 0 ? ((rowVariance / row.budgeted) * 100) : 0;
                const isUnder = rowVariance >= 0;

                return (
                  <tr key={idx} className="hover:bg-[var(--color-surface-muted)]/50">
                    <td className="p-3.5 pl-4 font-bold text-[var(--color-text-strong)]">{row.category}</td>
                    <td className="p-3.5 text-right font-mono font-semibold text-[var(--color-text-muted)]">{money(row.budgeted)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-[var(--color-text-strong)]">{money(row.actual)}</td>
                    <td className={`p-3.5 text-right font-mono font-bold ${isUnder ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isUnder ? `+${money(rowVariance)}` : `-${money(Math.abs(rowVariance))}`}
                    </td>
                    <td className={`p-3.5 text-right font-mono font-bold ${isUnder ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isUnder ? `+${rowPct.toFixed(1)}%` : `${rowPct.toFixed(1)}%`}
                    </td>
                    <td className="p-3.5 pr-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${isUnder ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {isUnder ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {isUnder ? 'Under Budget' : 'Cost Overrun'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              <tr className="bg-[var(--color-surface-muted)]/80 font-black border-t-2 border-[var(--color-border)]">
                <td className="p-4 pl-4 text-xs uppercase">Total Project Portfolio Variance</td>
                <td className="p-4 text-right font-mono text-xs">{money(budget)}</td>
                <td className="p-4 text-right font-mono text-xs">{money(actualCost)}</td>
                <td className={`p-4 text-right font-mono text-xs ${costVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {costVariance >= 0 ? `+${money(costVariance)}` : `-${money(Math.abs(costVariance))}`}
                </td>
                <td className={`p-4 text-right font-mono text-xs ${costVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {budget > 0 ? `${((costVariance / budget) * 100).toFixed(1)}%` : '0%'}
                </td>
                <td className="p-4 pr-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${costVariance >= 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}`}>
                    {costVariance >= 0 ? '✓ FAVORABLE PROFIT' : '⚠️ UNFAVORABLE VARIANCE'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. PROJECT BUDGET OVERVIEW VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectBudgetView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  return <ProjectCostingView />;
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. REPORTS VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectsReportsView({ activeEntityId: _activeEntityId }: { activeEntityId?: string }) {
  const { projects, timesheets, expenses } = useProjectData();

  const handleDownloadPortfolioStatement = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('AMS ERP — Executive Project Portfolio & Performance Audit Statement', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()} | IFRS 15 & EVM Compliant`, 14, 21);

    const rows = projects.map(p => {
      const pCost = timesheets.filter(t => t.projectId === p.id).reduce((s, t) => s + (t.hours || 0) * (t.billableRate || 0), 0) +
                    expenses.filter(e => e.projectId === p.id).reduce((s, e) => s + (e.amount || 0), 0);
      const ev = (p.budget || 0) * ((p.progressPercent || 0) / 100);
      const cv = ev - pCost;

      return [
        p.projectNumber || 'PRJ',
        p.name,
        p.customerName || 'Client',
        p.status,
        money(p.budget || 0),
        `${(p.progressPercent || 0)}%`,
        money(ev),
        money(pCost),
        money(cv)
      ];
    });

    autoTable(doc, {
      startY: 26,
      head: [['Code', 'Project Name', 'Client', 'Status', 'Budget', 'Progress', 'Earned Value', 'Actual Cost', 'Variance']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [0, 106, 167], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
    });

    doc.save('Project_Portfolio_Performance_Statement.pdf');
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-cyan-500 to-blue-700" />
              <div className="absolute inset-0 flex items-center justify-center"><FileCheck2 className="w-6 h-6 text-white" /></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Executive Project Audit &amp; Compliance Reporting Suite</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Export formal audit packages, EVM performance statements, and forensic budget vs actual comparison certifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <button
            onClick={handleDownloadPortfolioStatement}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Download className="w-4 h-4" /> Download PDF Portfolio Audit
          </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
          <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          <h3 className="font-bold text-xs text-[var(--color-text-strong)]">Master Project Portfolio Report</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Complete portfolio dataset including contract budgets, managers, and schedules.</p>
          <button onClick={handleDownloadPortfolioStatement} className="text-xs font-bold text-teal-600 hover:underline">
            Generate Statement →
          </button>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
          <Scale className="w-6 h-6 text-indigo-600" />
          <h3 className="font-bold text-xs text-[var(--color-text-strong)]">End-of-Project Variance Audit</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Forensic line-by-line comparison of baseline budgets vs finalized costs.</p>
          <button onClick={handleDownloadPortfolioStatement} className="text-xs font-bold text-indigo-600 hover:underline">
            Generate Statement →
          </button>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
          <Banknote className="w-6 h-6 text-amber-600" />
          <h3 className="font-bold text-xs text-[var(--color-text-strong)]">IFRS 15 Progress Billing Register</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Application for Payment certificates, retention ledger, and WIP contract asset balances.</p>
          <button onClick={handleDownloadPortfolioStatement} className="text-xs font-bold text-amber-600 hover:underline">
            Generate Statement →
          </button>
        </div>
      </div>
    </div>
  );
}
