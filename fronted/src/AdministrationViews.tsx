import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyStore, useAdministrationStore } from './stores';
import { accountingApi } from './api/modules/accounting.api';
import type { AuditTrailItem } from './api/modules/accounting.api';
import type { UserStatus, AdminUser, UserRole, Branch, ApprovalWorkflow, NumberSeries, Currency } from './api/modules/administration.api';
import type { Entity } from './api/modules/entities.api';
import { setActiveCurrency } from './lib/currency';
import {
  Users, ShieldCheck, Building2, GitBranch, CheckCircle2, Hash, Coins, ScrollText, Plus, Trash2, Pencil, KeyRound, Lock, Globe, Search,
  Power, X, Download, FileSpreadsheet, Eye, RefreshCw, ArrowRight, FileText, Shield, UserCheck, LayoutGrid, ListFilter, Copy, Check,
  MapPin, Receipt, Sparkles
} from 'lucide-react';
import { KpiCard, KpiGrid } from './components/ui/kpi-card';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─────────────────────────────────────────────────────────────────────────────
// ALL MODULES & PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────
const ALL_MODULES = [
  { id: 'overview', name: 'Overview & Dashboard', category: 'Core' },
  { id: 'sales', name: 'Sales & Customers', category: 'Commercial' },
  { id: 'procurement', name: 'Procurement & Purchasing', category: 'Commercial' },
  { id: 'banking', name: 'Banking & Payments', category: 'Financial' },
  { id: 'accounting', name: 'General Accounting & GL', category: 'Financial' },
  { id: 'assets', name: 'Assets & Inventory', category: 'Operations' },
  { id: 'manufacturing', name: 'Manufacturing & Production', category: 'Operations' },
  { id: 'payroll', name: 'Payroll & HR Management', category: 'Operations' },
  { id: 'field', name: 'Survey & Field Operations', category: 'Operations' },
  { id: 'compliance', name: 'Government Compliance & Tax', category: 'Compliance' },
  { id: 'projects', name: 'Projects & Job Costing', category: 'Operations' },
  { id: 'analytics', name: 'AI & Business Analytics', category: 'Core' },
  { id: 'administration', name: 'Administration & Settings', category: 'Core' },
];

const PRESET_ROLES = [
  {
    name: 'Super Administrator / CFO',
    description: 'Full unconstrained access to all operational, financial, and administrative modules.',
    permissions: ALL_MODULES.map(m => m.id),
  },
  {
    name: 'Senior Accountant',
    description: 'Access to Accounting, Banking, Sales, Procurement, Tax Compliance, and Analytics.',
    permissions: ['overview', 'sales', 'procurement', 'banking', 'accounting', 'assets', 'compliance', 'analytics'],
  },
  {
    name: 'Accounts Payable / Receivable Clerk',
    description: 'Daily operational billing, payments, vendor bills, and voucher handling.',
    permissions: ['overview', 'sales', 'procurement', 'banking'],
  },
  {
    name: 'Operations & Inventory Manager',
    description: 'Access to inventory, manufacturing, projects, and field operations.',
    permissions: ['overview', 'assets', 'manufacturing', 'field', 'projects'],
  },
  {
    name: 'External Auditor / Read-Only',
    description: 'Read-only audit inspection across financial records, reports, and compliance.',
    permissions: ['overview', 'accounting', 'banking', 'compliance', 'analytics'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 1. SUMMARY VIEW (MODULE OVERVIEW)
// ─────────────────────────────────────────────────────────────────────────────
export function AdministrationSummaryView({ setPage }: { setPage?: (p: string) => void }) {
  const { entities } = useCompanyStore();
  const { users, roles, branches, numberSeries, workflows, currencies, fetchAll } = useAdministrationStore();

  useEffect(() => { useCompanyStore.getState().fetchCompanies(); }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeEntities = entities.filter(e => e.active).length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const lockedUsers = users.filter(u => u.status === 'Locked').length;

  const navigate = (pageKey: string) => {
    if (setPage) setPage(pageKey);
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-purple-700" />
              <div className="absolute inset-0 flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Administration &amp; System Governance</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Enterprise user management, role-based access control (RBAC), multi-entity hierarchy, and audit governance.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Security Posture: Compliant
            </span>
          </div>
        </div>
      </div>

      {/* 4-in-1 Top KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={Users} label="System Users" value={users.length} desc={<>{activeUsers} Active · {lockedUsers} Locked</>} tone="teal" />
        <KpiCard icon={KeyRound} label="Security Roles" value={roles.length} desc={`${roles.reduce((s, r) => s + r.permissions.length, 0)} Total module grants`} tone="blue" />
        <KpiCard icon={Building2} label="Companies & Entities" value={entities.length} desc={<>{activeEntities} Operational ({new Set(entities.map(e => e.country)).size} Countries)</>} tone="emerald" />
        <KpiCard icon={GitBranch} label="Branches & Units" value={branches.length} desc={`${branches.filter(b => b.active).length} Active operating branches`} tone="purple" />
      </KpiGrid>

      {/* Quick Navigation Matrix */}
      <div>
        <h2 className="text-sm font-bold text-[var(--color-text-strong)] uppercase tracking-wider mb-3">
          Administration Submodules & Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Users Directory',
              desc: 'Manage user profiles, login credentials, and account statuses.',
              icon: Users,
              color: 'teal',
              key: 'Administration.Users',
              stat: `${users.length} Users`,
            },
            {
              title: 'Roles & Permissions',
              desc: 'Define role matrices and granular module permissions.',
              icon: ShieldCheck,
              color: 'blue',
              key: 'Administration.Roles & Permissions',
              stat: `${roles.length} Roles`,
            },
            {
              title: 'Companies & Hierarchy',
              desc: 'Multi-entity corporate structure, functional currencies, and tax IDs.',
              icon: Building2,
              color: 'emerald',
              key: 'Administration.Companies',
              stat: `${entities.length} Entities`,
            },
            {
              title: 'Branches & Locations',
              desc: 'Physical branches, regional warehouses, and operating units.',
              icon: GitBranch,
              color: 'purple',
              key: 'Administration.Branches',
              stat: `${branches.length} Branches`,
            },
            {
              title: 'Approval Workflows',
              desc: 'Multi-tiered approval chains for vouchers, bills, and payroll.',
              icon: CheckCircle2,
              color: 'amber',
              key: 'Administration.Approval Workflows',
              stat: `${workflows.length} Workflows`,
            },
            {
              title: 'Document Number Series',
              desc: 'Auto-sequencing, prefixing, and formatting for all vouchers.',
              icon: Hash,
              color: 'indigo',
              key: 'Administration.Number Series',
              stat: `${numberSeries.length} Series`,
            },
            {
              title: 'Currencies & FX Rates',
              desc: 'Multi-currency valuation, functional base currency, and exchange rates.',
              icon: Coins,
              color: 'rose',
              key: 'Administration.Currency',
              stat: `${currencies.length} Currencies`,
            },
            {
              title: 'Chart of Accounts Mapping',
              desc: 'Default system GL account postings for AR, AP, COGS, and Tax.',
              icon: FileText,
              color: 'cyan',
              key: 'Administration.Chart of Accounts Mapping',
              stat: 'System Rules',
            },
            {
              title: 'Audit Logs & Governance',
              desc: 'Immutable forensic event log of all transactions and changes.',
              icon: ScrollText,
              color: 'slate',
              key: 'Administration.Audit Logs',
              stat: '100% Immutable',
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                onClick={() => navigate(card.key)}
                className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-teal-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--color-text-strong)] group-hover:text-teal-600 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)] line-clamp-1 mt-0.5">{card.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[var(--color-text-muted)]">Configuration Status:</span>
                  <span className="px-2 py-0.5 rounded-md font-bold bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] font-mono">
                    {card.stat}
                  </span>
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
// 2. USERS MANAGEMENT VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function UsersView({ activeEntityId, notify }: { activeEntityId?: string; notify?: (m: string) => void }) {
  const { users, roles, branches, fetchUsers, fetchRoles, fetchBranches, createUser, updateUser, deleteUser, setUserStatus, loading } = useAdministrationStore();
  const { entities, fetchCompanies } = useCompanyStore();

  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);
  const [resetPasswordModal, setResetPasswordModal] = useState<AdminUser | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);

  // Form tab state
  const [formTab, setFormTab] = useState<'profile' | 'access' | 'security'>('profile');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    userName: '',
    phone: '',
    designation: '',
    department: 'Finance & Accounts',
    role: 'Senior Accountant',
    status: 'Active' as UserStatus,
    companyId: activeEntityId || '',
    branchId: '',
    requirePasswordChange: true,
    mfaEnforced: false,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchBranches();
    fetchCompanies();
  }, [fetchUsers, fetchRoles, fetchBranches, fetchCompanies]);

  const openCreate = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      userName: '',
      phone: '',
      designation: 'Accountant',
      department: 'Finance & Accounts',
      role: roles[0]?.name || 'Senior Accountant',
      status: 'Active',
      companyId: activeEntityId || entities[0]?.id || '',
      branchId: branches[0]?.id || '',
      requirePasswordChange: true,
      mfaEnforced: false,
    });
    setFormTab('profile');
    setModalOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditingUser(u);
    setFormData({
      fullName: u.fullName || '',
      email: u.email || '',
      userName: u.userName || u.email?.split('@')[0] || '',
      phone: (u as any).phone || '',
      designation: (u as any).designation || 'Financial Officer',
      department: (u as any).department || 'Finance & Accounts',
      role: u.role || 'Senior Accountant',
      status: u.status || 'Active',
      companyId: u.companyId || activeEntityId || entities[0]?.id || '',
      branchId: (u as any).branchId || '',
      requirePasswordChange: false,
      mfaEnforced: (u as any).mfaEnforced || false,
    });
    setFormTab('profile');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      notify?.('Please provide both full name and email address');
      return;
    }

    const payload = {
      ...formData,
      userName: formData.userName.trim() || formData.email.trim(),
    };

    if (editingUser) {
      const res = await updateUser(editingUser.id, payload);
      if (res) notify?.(`✓ User profile "${formData.fullName}" updated successfully`);
    } else {
      const res = await createUser(payload);
      if (res) notify?.(`✓ New system operator "${formData.fullName}" created successfully`);
    }
    setModalOpen(false);
  };

  const handleToggleLock = async (u: AdminUser) => {
    const newStatus: UserStatus = u.status === 'Locked' ? 'Active' : 'Locked';
    const ok = await setUserStatus(u.id, newStatus);
    if (ok) {
      notify?.(
        newStatus === 'Locked'
          ? `🔒 User "${u.fullName}" locked. Access revoked.`
          : `🔓 User "${u.fullName}" unlocked and ready for authentication.`
      );
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (window.confirm(`⚠️ Are you sure you want to permanently remove operator "${u.fullName}" (${u.email})? This action cannot be undone.`)) {
      const ok = await deleteUser(u.id);
      if (ok) notify?.(`✓ User "${u.fullName}" removed from operator directory`);
    }
  };

  const handleOpenResetPassword = (u: AdminUser) => {
    const randomPass = 'AccBook#' + Math.floor(100000 + Math.random() * 900000) + '!';
    setTempPassword(randomPass);
    setCopiedPass(false);
    setResetPasswordModal(u);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopiedPass(true);
    notify?.('✓ Temporary password copied to clipboard');
    setTimeout(() => setCopiedPass(false), 3000);
  };

  // Color generator for roles
  const getRoleBadgeStyle = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('super') || r.includes('admin') || r.includes('cfo')) {
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
    if (r.includes('senior') || r.includes('accountant') || r.includes('finance')) {
      return 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800';
    }
    if (r.includes('payable') || r.includes('procurement') || r.includes('purchase')) {
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    }
    if (r.includes('receivable') || r.includes('sales') || r.includes('billing')) {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (r.includes('auditor') || r.includes('compliance')) {
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = query.toLowerCase();
      const matchesQ =
        !q ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.userName || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        ((u as any).department || '').toLowerCase().includes(q);

      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
      const matchesEntity = entityFilter === 'All' || u.companyId === entityFilter;

      return matchesQ && matchesRole && matchesStatus && matchesEntity;
    });
  }, [users, query, roleFilter, statusFilter, entityFilter]);

  const uniqueRoles = Array.from(new Set([...roles.map(r => r.name), ...users.map(u => u.role)].filter(Boolean)));
  const activeCount = users.filter(u => u.status === 'Active').length;
  const lockedCount = users.filter(u => u.status === 'Locked').length;
  const inactiveCount = users.filter(u => u.status === 'Inactive').length;

  // Exports
  const handleExportCSV = () => {
    const headers = ['Full Name', 'Username', 'Email', 'Role', 'Status', 'Company Scope', 'Last Login'];
    const rows = filteredUsers.map(u => [
      u.fullName,
      u.userName || u.email,
      u.email,
      u.role || 'Operator',
      u.status,
      entities.find(e => e.id === u.companyId)?.name || 'Default Entity',
      u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'
    ]);
    downloadCSV('Enterprise_Users_Directory', headers, rows);
    notify?.('✓ Users directory exported to CSV');
  };

  const handleExportExcel = () => {
    const headers = ['Full Name', 'Username', 'Email', 'Role', 'Status', 'Company Scope', 'Last Login'];
    const rows = filteredUsers.map(u => [
      u.fullName,
      u.userName || u.email,
      u.email,
      u.role || 'Operator',
      u.status,
      entities.find(e => e.id === u.companyId)?.name || 'Default Entity',
      u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'
    ]);
    downloadExcel('Enterprise_Users_Directory', 'System_Users', headers, rows);
    notify?.('✓ Users directory exported to Excel (.xlsx)');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text('AccountBook ERP — System Users & Operator Directory', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Filter: ${roleFilter} Role, ${statusFilter} Status`, 14, 21);

    const rows = filteredUsers.map(u => [
      u.fullName,
      u.userName || u.email,
      u.email,
      u.role || 'Operator',
      u.status,
      entities.find(e => e.id === u.companyId)?.name || 'Default Entity',
      u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'
    ]);

    autoTable(doc, {
      startY: 26,
      head: [['Operator Name', 'Username', 'Email Address', 'Assigned Role', 'Status', 'Entity Scope', 'Last Access']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [0, 106, 167], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    doc.save('Enterprise_Users_Directory.pdf');
    notify?.('✓ Users directory PDF statement generated');
  };

  return (
    <div className="p-6 max-w-[1500px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-purple-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Users &amp; Operator Management Suite</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Maintain operator identities, assign security profiles, govern multi-company permissions, and enforce authentication policies.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={fetchUsers}
            title="Refresh Users Directory"
            className="p-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
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
            <Plus className="w-4 h-4" /> Add System User
          </button>
          </div>
        </div>
      </div>

      {/* 4-in-1 KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={Users} label="Total Operators" value={users.length} desc="Registered accounts in tenant" tone="teal" />
        <KpiCard icon={UserCheck} label="Active Operators" value={activeCount} desc="Ready for immediate login" tone="emerald" />
        <KpiCard icon={Lock} label="Locked / Restricted" value={lockedCount + inactiveCount} desc={`${lockedCount} Locked · ${inactiveCount} Inactive`} tone="rose" />
        <KpiCard icon={ShieldCheck} label="Assigned Roles" value={uniqueRoles.length} desc="Security access matrix groups" tone="purple" />
      </KpiGrid>

      {/* Control & Filter Center */}
      <div className="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search operators by legal name, email address, username, or role..."
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
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none"
            >
              <option value="All">All Security Roles ({uniqueRoles.length})</option>
              {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active ({activeCount})</option>
              <option value="Inactive">Inactive ({inactiveCount})</option>
              <option value="Locked">Locked ({lockedCount})</option>
            </select>

            {entities.length > 0 && (
              <select
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl text-[var(--color-text)] outline-none"
              >
                <option value="All">All Corporate Entities</option>
                {entities.map(ent => (
                  <option key={ent.id} value={ent.id}>{ent.name}</option>
                ))}
              </select>
            )}

            <div className="flex items-center bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'table' ? 'bg-[var(--color-surface)] shadow-xs text-teal-600 font-bold' : 'text-[var(--color-text-muted)]'}`}
                title="Table View"
              >
                <ListFilter className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'grid' ? 'bg-[var(--color-surface)] shadow-xs text-teal-600 font-bold' : 'text-[var(--color-text-muted)]'}`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW MODE A: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-4">Operator Identity</th>
                  <th className="p-4">Email & Username</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Entity / Branch Scope</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Activity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredUsers.map(u => {
                  const companyObj = entities.find(e => e.id === u.companyId);
                  return (
                    <tr key={u.id} className="hover:bg-[var(--color-surface-muted)]/60 transition-colors">
                      {/* Identity */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                              {u.fullName ? u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                            </div>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--color-surface)] ${
                                u.status === 'Active' ? 'bg-emerald-500' : u.status === 'Locked' ? 'bg-rose-500' : 'bg-slate-400'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="font-bold text-xs text-[var(--color-text-strong)] flex items-center gap-1.5">
                              {u.fullName}
                            </div>
                            <div className="text-[10px] text-[var(--color-text-muted)] font-medium">
                              {(u as any).designation || 'System Operator'} · {(u as any).department || 'Finance'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email & Username */}
                      <td className="p-4">
                        <div className="font-mono text-xs text-[var(--color-text-strong)]">{u.email}</div>
                        <div className="text-[10px] text-[var(--color-text-muted)] font-mono">@{u.userName || u.email?.split('@')[0]}</div>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getRoleBadgeStyle(u.role || 'Operator')}`}>
                          <Shield className="w-3 h-3" />
                          {u.role || 'Operator'}
                        </span>
                      </td>

                      {/* Entity / Scope */}
                      <td className="p-4">
                        <div className="font-semibold text-[var(--color-text-strong)] flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-[var(--color-text-muted)]" />
                          {companyObj ? companyObj.name : 'All Corporate Entities'}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)]">
                          {(u as any).branchId ? `Branch: ${branches.find(b => b.id === (u as any).branchId)?.name || (u as any).branchId}` : 'All Locations'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            u.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : u.status === 'Locked'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {u.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                          {u.status === 'Locked' && <Lock className="w-3 h-3" />}
                          {u.status}
                        </span>
                      </td>

                      {/* Last Activity */}
                      <td className="p-4 text-[var(--color-text-muted)]">
                        <div className="font-mono text-xs">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</div>
                        <div className="text-[10px]">{u.lastLogin ? new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No session recorded'}</div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectUser(u)}
                            title="Inspect User Profile & Security"
                            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-teal-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenResetPassword(u)}
                            title="Reset Password / Security Token"
                            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-amber-600 hover:text-amber-700 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleLock(u)}
                            title={u.status === 'Locked' ? 'Unlock Account' : 'Lock Operator Account'}
                            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors"
                          >
                            <Lock className={`w-3.5 h-3.5 ${u.status === 'Locked' ? 'text-emerald-600' : 'text-rose-500'}`} />
                          </button>

                          <button
                            onClick={() => openEdit(u)}
                            title="Edit User Profile"
                            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(u)}
                            title="Remove User"
                            className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-500 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-[var(--color-text-muted)]">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Users className="w-8 h-8 text-[var(--color-text-muted)] mx-auto opacity-40" />
                        <div className="font-bold text-xs text-[var(--color-text-strong)]">No users matching query</div>
                        <p className="text-[11px]">Adjust your role or status filter to view available operators.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE B: GRID PROFILE CARDS */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(u => {
            const companyObj = entities.find(e => e.id === u.companyId);
            return (
              <div
                key={u.id}
                className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs hover:shadow-sm transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                        {u.fullName ? u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--color-text-strong)] leading-tight">{u.fullName}</h4>
                        <div className="text-[11px] text-[var(--color-text-muted)] font-mono mt-0.5">{u.email}</div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                          : u.status === 'Locked'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[var(--color-border)] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-muted)]">Security Role</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRoleBadgeStyle(u.role || 'Operator')}`}>
                        {u.role || 'Operator'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-muted)]">Entity Scope</span>
                      <span className="font-semibold text-[11px] text-[var(--color-text-strong)] truncate max-w-[160px]">
                        {companyObj ? companyObj.name : 'All Companies'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-muted)]">Last Login</span>
                      <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-[var(--color-border)]">
                  <button
                    onClick={() => setInspectUser(u)}
                    className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-teal-600 transition-colors"
                    title="Inspect Profile"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleOpenResetPassword(u)}
                    className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-amber-600 transition-colors"
                    title="Reset Password"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleLock(u)}
                    className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] transition-colors"
                    title={u.status === 'Locked' ? 'Unlock Account' : 'Lock Account'}
                  >
                    <Lock className={`w-4 h-4 ${u.status === 'Locked' ? 'text-emerald-600' : 'text-rose-500'}`} />
                  </button>

                  <button
                    onClick={() => openEdit(u)}
                    className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-blue-600 transition-colors"
                    title="Edit Profile"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(u)}
                    className="p-1.5 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-500 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <div>
                <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  {editingUser ? `Edit Operator: ${editingUser.fullName}` : 'Register New System Operator'}
                </h3>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Configure identity credentials, security profile, and authorized company access.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Tabs */}
            <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormTab('profile')}
                className={`py-2.5 border-b-2 transition-all ${formTab === 'profile' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-[var(--color-text-muted)]'}`}
              >
                1. Identity & Profile
              </button>
              <button
                type="button"
                onClick={() => setFormTab('access')}
                className={`py-2.5 border-b-2 transition-all ${formTab === 'access' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-[var(--color-text-muted)]'}`}
              >
                2. Role & Entity Access
              </button>
              <button
                type="button"
                onClick={() => setFormTab('security')}
                className={`py-2.5 border-b-2 transition-all ${formTab === 'security' ? 'border-teal-600 text-teal-600 font-bold' : 'border-transparent text-[var(--color-text-muted)]'}`}
              >
                3. Security & Governance
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {/* TAB 1: IDENTITY */}
              {formTab === 'profile' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Full Legal Name *</label>
                      <input
                        required
                        type="text"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Tariq Mehmood"
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Official Email Address *</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="tariq@company.com"
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Username / Operator Code</label>
                      <input
                        type="text"
                        value={formData.userName}
                        onChange={e => setFormData({ ...formData, userName: e.target.value })}
                        placeholder="tariq.mehmood"
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Phone / Mobile</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Job Title / Designation</label>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g. Senior Financial Accountant"
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Department</label>
                      <select
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                      >
                        <option value="Finance & Accounts">Finance & Accounts</option>
                        <option value="Treasury & Banking">Treasury & Banking</option>
                        <option value="Procurement & Supply Chain">Procurement & Supply Chain</option>
                        <option value="Sales & Billing">Sales & Billing</option>
                        <option value="Operations & Warehouse">Operations & Warehouse</option>
                        <option value="Human Resources & Payroll">Human Resources & Payroll</option>
                        <option value="Internal Audit & Compliance">Internal Audit & Compliance</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACCESS & ROLE */}
              {formTab === 'access' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Primary Security Role *</label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.name}>{r.name} — {r.description || 'Full Permissions'}</option>
                      ))}
                      {roles.length === 0 && (
                        <>
                          <option value="Super Administrator / CFO">Super Administrator / CFO</option>
                          <option value="Senior Accountant">Senior Accountant</option>
                          <option value="Accounts Payable Clerk">Accounts Payable Clerk</option>
                          <option value="Accounts Receivable Specialist">Accounts Receivable Specialist</option>
                          <option value="Inventory & Warehouse Controller">Inventory & Warehouse Controller</option>
                          <option value="HR & Payroll Officer">HR & Payroll Officer</option>
                          <option value="External Statutory Auditor">External Statutory Auditor</option>
                          <option value="Read-Only Viewer">Read-Only Viewer</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Authorized Company Entity</label>
                      <select
                        value={formData.companyId}
                        onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                      >
                        <option value="">All Corporate Entities (Global)</option>
                        {entities.map(ent => (
                          <option key={ent.id} value={ent.id}>{ent.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Branch / Operating Unit</label>
                      <select
                        value={formData.branchId}
                        onChange={e => setFormData({ ...formData, branchId: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                      >
                        <option value="">All Locations & Branches</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200/60 dark:border-blue-800/60 text-[11px] text-blue-800 dark:text-blue-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Multi-Company Access Control
                    </div>
                    <p>Operators assigned to a specific entity will only see transactions, ledgers, and journals belonging to that corporate scope.</p>
                  </div>
                </div>
              )}

              {/* TAB 3: SECURITY & GOVERNANCE */}
              {formTab === 'security' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Account Login Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value as UserStatus })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-semibold"
                    >
                      <option value="Active">Active (Permit Immediate Login)</option>
                      <option value="Inactive">Inactive (Suspended Temporarily)</option>
                      <option value="Locked">Locked (Security Hold / Revoked)</option>
                    </select>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.requirePasswordChange}
                        onChange={e => setFormData({ ...formData, requirePasswordChange: e.target.checked })}
                        className="accent-teal-600"
                      />
                      <div>
                        <span className="font-semibold text-[var(--color-text-strong)]">Force Password Change on Next Login</span>
                        <p className="text-[10px] text-[var(--color-text-muted)]">Operator must set a new complex password upon first authentication.</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.mfaEnforced}
                        onChange={e => setFormData({ ...formData, mfaEnforced: e.target.checked })}
                        className="accent-teal-600"
                      />
                      <div>
                        <span className="font-semibold text-[var(--color-text-strong)]">Enforce Multi-Factor Authentication (MFA)</span>
                        <p className="text-[10px] text-[var(--color-text-muted)]">Require authenticator TOTP code on every session establishment.</p>
                      </div>
                    </label>
                  </div>

                  <div className="p-3 bg-teal-50/50 dark:bg-teal-950/30 rounded-xl border border-teal-200/50 dark:border-teal-800/50 text-[11px] text-teal-800 dark:text-teal-200">
                    🔒 GAAP/IAS Audit Trail: All modifications to user access credentials and roles are permanently logged in the non-repudiation audit ledger.
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  {formTab !== 'profile' && (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab === 'security' ? 'access' : 'profile')}
                      className="px-3 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                    >
                      Back
                    </button>
                  )}
                  {formTab !== 'security' ? (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab === 'profile' ? 'access' : 'security')}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      {editingUser ? 'Save Profile Changes' : 'Create User Account'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER INSPECTOR PROFILE DRAWER / MODAL */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-xs">
                  {inspectUser.fullName ? inspectUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text-strong)]">{inspectUser.fullName}</h3>
                  <p className="text-[11px] text-[var(--color-text-muted)] font-mono">{inspectUser.email}</p>
                </div>
              </div>
              <button onClick={() => setInspectUser(null)} className="p-1.5 rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Security Role</span>
                  <div className="font-bold text-[var(--color-text-strong)] mt-0.5">{inspectUser.role || 'Senior Accountant'}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Account Status</span>
                  <div className="mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inspectUser.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {inspectUser.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Corporate Entity</span>
                  <div className="font-medium text-[var(--color-text-strong)] mt-0.5">
                    {entities.find(e => e.id === inspectUser.companyId)?.name || 'All Corporate Entities'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Last Session Recorded</span>
                  <div className="font-mono text-[var(--color-text-strong)] mt-0.5">
                    {inspectUser.lastLogin ? new Date(inspectUser.lastLogin).toLocaleString() : 'Never logged in'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs text-[var(--color-text-strong)]">Authorized Module Capabilities</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['General Ledger', 'Invoicing & Sales', 'Procurement & Bills', 'Treasury & Bank', 'Payroll Processing', 'System Governance'].map(mod => (
                    <div key={mod} className="p-2 rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border)] flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-strong)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface)] text-[var(--color-text)]"
              >
                Close Inspector
              </button>
              <button
                onClick={() => {
                  const u = inspectUser;
                  setInspectUser(null);
                  openEdit(u);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {resetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Reset Password for {resetPasswordModal.fullName}
              </h3>
              <button onClick={() => setResetPasswordModal(null)} className="p-1.5 rounded-xl hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-[var(--color-text-muted)]">
                A temporary one-time authentication token has been generated. Provide this token to the operator:
              </p>

              <div className="p-3.5 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)] flex items-center justify-between gap-3">
                <code className="font-mono text-sm font-bold text-teal-600 select-all">{tempPassword}</code>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
                >
                  {copiedPass ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPass ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200">
                ⚠️ The operator will be strictly prompted to define a new password immediately upon successful login.
              </div>
            </div>

            <div className="flex items-center justify-end p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <button
                onClick={() => setResetPasswordModal(null)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ROLES & PERMISSIONS VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function RolesPermissionsView({ notify }: { activeEntityId?: string; notify?: (m: string) => void }) {
  const { roles, fetchRoles, createRole, updateRole, deleteRole } = useAdministrationStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchRoles().then(() => {
      if (roles.length > 0 && !selectedRole) setSelectedRole(roles[0]);
    });
  }, [fetchRoles]);

  const openCreate = () => {
    setFormData({ name: '', description: '', permissions: [] });
    setModalOpen(true);
  };

  const applyTemplate = (tpl: typeof PRESET_ROLES[0]) => {
    setFormData({
      name: tpl.name,
      description: tpl.description,
      permissions: [...tpl.permissions],
    });
  };

  const togglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(id)
        ? prev.permissions.filter(p => p !== id)
        : [...prev.permissions, id],
    }));
  };

  const selectAll = () => {
    setFormData(prev => ({
      ...prev,
      permissions: ALL_MODULES.map(m => m.id),
    }));
  };

  const deselectAll = () => {
    setFormData(prev => ({ ...prev, permissions: [] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (selectedRole && modalOpen && formData.name === selectedRole.name) {
      await updateRole(selectedRole.id, formData);
      notify?.(`Role ${formData.name} updated`);
    } else {
      await createRole(formData);
      notify?.(`Role ${formData.name} created`);
    }
    setModalOpen(false);
  };

  const handleDelete = async (r: UserRole) => {
    if (window.confirm(`Delete role "${r.name}"? Users with this role will need reassignment.`)) {
      await deleteRole(r.id);
      notify?.(`Role ${r.name} deleted`);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-purple-700" />
              <div className="absolute inset-0 flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Roles &amp; Security Permissions Matrix (RBAC)</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Configure access control policies across all 13 ERP functional modules.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Create Custom Role
            </button>
          </div>
        </div>
      </div>

      {/* 4-in-1 KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={ShieldCheck} label="Defined Roles" value={roles.length} desc="Active security roles" tone="blue" />
        <KpiCard icon={KeyRound} label="Permission Grants" value={roles.reduce((s, r) => s + r.permissions.length, 0)} desc="Total granted module privileges" tone="emerald" />
        <KpiCard icon={Lock} label="Modules Protected" value={ALL_MODULES.length} desc="13 ERP operational modules" tone="purple" />
        <KpiCard icon={CheckCircle2} label="Full Access Roles" value={roles.filter(r => r.permissions.length === ALL_MODULES.length).length} desc="Unrestricted superuser profiles" tone="teal" />
      </KpiGrid>

      {/* Preset Role Templates */}
      <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
        <h3 className="text-xs font-bold text-[var(--color-text-strong)] uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-600" /> 1-Click Industry Standard Role Templates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESET_ROLES.map((tpl, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] hover:border-blue-500/40 transition-colors space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="font-bold text-xs text-[var(--color-text-strong)]">{tpl.name}</div>
                <div className="text-[11px] text-[var(--color-text-muted)] mt-1">{tpl.description}</div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-[11px]">
                <span className="font-mono text-blue-600 font-semibold">{tpl.permissions.length} modules</span>
                <button
                  onClick={() => {
                    applyTemplate(tpl);
                    setModalOpen(true);
                  }}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px]"
                >
                  Apply & Customize
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Register */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--color-text-strong)] uppercase tracking-wider">
          Active Security Roles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(r => (
            <div
              key={r.id}
              className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-text-strong)]">{r.name}</h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{r.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setFormData({ name: r.name, description: r.description, permissions: r.permissions });
                      setSelectedRole(r);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-blue-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[var(--color-text-muted)] mb-1.5">
                  Authorized Modules ({r.permissions.length}/{ALL_MODULES.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.permissions.map(p => {
                    const mod = ALL_MODULES.find(m => m.id === p);
                    return (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] border border-[var(--color-border)]"
                      >
                        {mod?.name || p}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Configure Security Role & Module Permissions
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Role Designation *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Chief Risk Officer"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Role Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Responsibilities and access scope..."
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[var(--color-text-strong)]">
                    Module Access Matrix ({formData.permissions.length}/{ALL_MODULES.length})
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-[var(--color-text-muted)]">·</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-[11px] font-bold text-rose-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface-muted)]">
                  {ALL_MODULES.map(m => {
                    const checked = formData.permissions.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                          checked
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200 font-semibold'
                            : 'border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text)]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(m.id)}
                          className="accent-blue-600 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-xs">{m.name}</div>
                          <div className="text-[10px] opacity-60 uppercase">{m.category}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Security Role
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
// 4. COMPANIES & MULTI-ENTITY VIEW
// ─────────────────────────────────────────────────────────────────────────────
const COUNTRY_PROVINCES: Record<string, { flag: string; currency: string; taxIdLabel: string; taxAuthority: string; provinces: { code: string; name: string }[] }> = {
  Pakistan: {
    flag: '🇵🇰',
    currency: 'PKR',
    taxIdLabel: 'National Tax Number (NTN) & STRN',
    taxAuthority: 'FBR / Provincial Revenue Authorities (PRA / SRB / KPRA / BRA)',
    provinces: [
      { code: 'Punjab', name: 'Punjab (PRA - 16% / IT 5%)' },
      { code: 'Sindh', name: 'Sindh (SRB - 13% / IT 3%)' },
      { code: 'KPK', name: 'Khyber Pakhtunkhwa (KPRA - 15% / IT 2%)' },
      { code: 'Balochistan', name: 'Balochistan (BRA - 15%)' },
      { code: 'Islamabad', name: 'Islamabad Capital Territory (ICT - 15%)' },
    ],
  },
  'United Kingdom': {
    flag: '🇬🇧',
    currency: 'GBP',
    taxIdLabel: 'VAT Registration Number (VRN)',
    taxAuthority: 'HMRC (Making Tax Digital VAT / CIS)',
    provinces: [
      { code: 'England', name: 'England' },
      { code: 'Scotland', name: 'Scotland' },
      { code: 'Wales', name: 'Wales' },
      { code: 'Northern Ireland', name: 'Northern Ireland (Dual Protocol)' },
    ],
  },
  'Saudi Arabia': {
    flag: '🇸🇦',
    currency: 'SAR',
    taxIdLabel: 'ZATCA VAT / TIN Number',
    taxAuthority: 'ZATCA (Fatoora Phase 2 E-Invoicing)',
    provinces: [
      { code: 'Riyadh', name: 'Riyadh Region' },
      { code: 'Makkah', name: 'Makkah Region (Jeddah)' },
      { code: 'Eastern Province', name: 'Eastern Province (Dammam/Khobar)' },
      { code: 'Madinah', name: 'Madinah Region' },
      { code: 'Asir', name: 'Asir Region' },
    ],
  },
  'United Arab Emirates': {
    flag: '🇦🇪',
    currency: 'AED',
    taxIdLabel: 'Tax Registration Number (TRN)',
    taxAuthority: 'Federal Tax Authority (FTA)',
    provinces: [
      { code: 'Dubai', name: 'Dubai' },
      { code: 'Abu Dhabi', name: 'Abu Dhabi' },
      { code: 'Sharjah', name: 'Sharjah' },
      { code: 'Ajman', name: 'Ajman' },
      { code: 'Ras Al Khaimah', name: 'Ras Al Khaimah' },
      { code: 'Fujairah', name: 'Fujairah' },
      { code: 'Umm Al Quwain', name: 'Umm Al Quwain' },
    ],
  },
  'United States': {
    flag: '🇺🇸',
    currency: 'USD',
    taxIdLabel: 'Federal Employer ID (EIN) / State Tax ID',
    taxAuthority: 'IRS & State Revenue Depts',
    provinces: [
      { code: 'California', name: 'California (CDTFA - 7.25% / 9.5%)' },
      { code: 'New York', name: 'New York (NYS - 8.875%)' },
      { code: 'Texas', name: 'Texas (TX-CPA - 8.25%)' },
      { code: 'Florida', name: 'Florida (FL-DOR - 6.0%)' },
      { code: 'Illinois', name: 'Illinois (IL-DOR - 6.25%)' },
      { code: 'Washington', name: 'Washington (WA - 6.5%)' },
    ],
  },
  Canada: {
    flag: '🇨🇦',
    currency: 'CAD',
    taxIdLabel: 'Business Number (BN / GST/HST #)',
    taxAuthority: 'Canada Revenue Agency (CRA) & Revenu Québec',
    provinces: [
      { code: 'Ontario', name: 'Ontario (HST 13%)' },
      { code: 'British Columbia', name: 'British Columbia (GST 5% + PST 7%)' },
      { code: 'Quebec', name: 'Quebec (GST 5% + QST 9.975%)' },
      { code: 'Alberta', name: 'Alberta (GST 5% only)' },
      { code: 'Nova Scotia', name: 'Nova Scotia / Atlantic (HST 15%)' },
    ],
  },
  'European Union': {
    flag: '🇪🇺',
    currency: 'EUR',
    taxIdLabel: 'EU VAT Identification Number (VIES)',
    taxAuthority: 'Member-State Tax Office (BZSt / DGFiP / Revenue)',
    provinces: [
      { code: 'Germany', name: 'Germany (BZSt - 19% / 7%)' },
      { code: 'France', name: 'France (DGFiP - 20% / 10% / 5.5%)' },
      { code: 'Netherlands', name: 'Netherlands (BTW - 21% / 9%)' },
      { code: 'Ireland', name: 'Ireland (Revenue - 23% / 13.5%)' },
      { code: 'Italy', name: 'Italy (Agenzia delle Entrate - 22%)' },
      { code: 'Spain', name: 'Spain (Agencia Tributaria - 21%)' },
    ],
  },
};

type CompanyModalTab = 'identity' | 'jurisdiction' | 'tax' | 'contact' | 'modules' | 'preview';

export function CompaniesView({ activeEntityId, notify }: { activeEntityId?: string; setPage?: (p: string) => void; notify?: (m: string) => void }) {
  const { entities, fetchCompanies, saveCompany, toggleCompanyStatus, deleteCompany, setActiveEntityId } = useCompanyStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<CompanyModalTab>('identity');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    code: '',
    currencyCode: 'PKR',
    country: 'Pakistan',
    state: 'Punjab',
    taxRegistrationNumber: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    fiscalYearStartMonth: 7,
    type: 'Subsidiary',
    parentId: '' as string | undefined,
    active: true,
    modules: ALL_MODULES.map(m => m.id),
  });

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const activeCountryData = COUNTRY_PROVINCES[formData.country] || COUNTRY_PROVINCES['Pakistan'];

  const handleCountryChange = (countryName: string) => {
    const data = COUNTRY_PROVINCES[countryName];
    if (data) {
      setFormData(prev => ({
        ...prev,
        country: countryName,
        currencyCode: data.currency,
        state: data.provinces[0]?.code || '',
        fiscalYearStartMonth: countryName === 'Pakistan' ? 7 : countryName === 'United Kingdom' ? 4 : 1,
      }));
    } else {
      setFormData(prev => ({ ...prev, country: countryName }));
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      legalName: '',
      code: '',
      currencyCode: 'PKR',
      country: 'Pakistan',
      state: 'Punjab',
      taxRegistrationNumber: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      website: '',
      fiscalYearStartMonth: 7,
      type: 'Subsidiary',
      parentId: '',
      active: true,
      modules: ALL_MODULES.map(m => m.id),
    });
    setModalTab('identity');
    setModalOpen(true);
  };

  const openEdit = (e: Entity) => {
    setEditingId(e.id);
    const country = e.country || 'Pakistan';
    const cData = COUNTRY_PROVINCES[country] || COUNTRY_PROVINCES['Pakistan'];
    setFormData({
      name: e.name,
      legalName: e.legalName || e.name,
      code: e.code || '',
      currencyCode: e.currencyCode || e.functionalCurrency || cData.currency,
      country: country,
      state: e.state || cData.provinces[0]?.code || '',
      taxRegistrationNumber: e.taxRegistrationNumber || e.taxId || '',
      address: e.address || '',
      city: e.city || '',
      phone: e.phone || '',
      email: e.email || '',
      website: e.website || '',
      fiscalYearStartMonth: e.fiscalYearStartMonth || (country === 'Pakistan' ? 7 : country === 'United Kingdom' ? 4 : 1),
      type: e.type || 'Subsidiary',
      parentId: e.parentId || '',
      active: e.active,
      modules: e.modules?.length ? e.modules : ALL_MODULES.map(m => m.id),
    });
    setModalTab('identity');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      notify?.('Company name is required.');
      setModalTab('identity');
      return;
    }

    if (modalTab !== 'preview') {
      setModalTab('preview');
      return;
    }

    const payload = {
      ...formData,
      parentId: formData.parentId ? formData.parentId : undefined,
    };

    await saveCompany(payload, editingId ?? undefined);
    if (editingId && editingId === activeEntityId) {
      setActiveCurrency(formData.currencyCode);
    }
    notify?.(`Company ${formData.name} saved successfully with ${formData.country} tax pack`);
    setModalOpen(false);
  };

  const handleSwitchCompany = (id: string, name: string) => {
    setActiveEntityId(id);
    notify?.(`Switched active workspace to ${name}`);
  };

  const handleDelete = async (e: Entity) => {
    if (window.confirm(`CAUTION: Delete company "${e.name}" and ALL its transactional data (Journals, Invoices, Payroll, Vouchers)? This action is permanent.`)) {
      await deleteCompany(e.id);
      notify?.(`Company ${e.name} and data deleted.`);
    }
  };

  const exportCompanyProfilePDF = (e: Entity) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(e.name.toUpperCase(), 14, 18);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`CORPORATE ENTITY PROFILE & COMPLIANCE REGISTRATION`, 14, 25);

    let y = 40;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Legal & Operational Parameters', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      styles: { fontSize: 9 },
      body: [
        ['Company Legal Name', e.legalName || e.name],
        ['Entity Code', e.code || '—'],
        ['Country Jurisdiction', e.country || '—'],
        ['Operating State / Province', e.state || '—'],
        ['Tax Registration # (NTN/TRN/EIN)', e.taxRegistrationNumber || e.taxId || '—'],
        ['Functional Ledger Currency', e.currencyCode || e.functionalCurrency || 'PKR'],
        ['Entity Corporate Type', e.type || 'Subsidiary'],
        ['Fiscal Year Start Month', e.fiscalYearStartMonth === 7 ? 'July (Pakistan Fiscal)' : e.fiscalYearStartMonth === 4 ? 'April (UK Fiscal)' : 'January (Calendar Year)'],
        ['Registered Address', e.address ? `${e.address}, ${e.city || ''}` : '—'],
        ['Official Email / Phone', `${e.email || '—'} / ${e.phone || '—'}`],
        ['Operating Status', e.active ? 'ACTIVE & OPERATIONAL' : 'DEACTIVATED (READ-ONLY)'],
      ],
    });

    y = (doc as any).lastAutoTable.finalY + 12;
    doc.text('2. Enabled Enterprise Functional Modules', 14, y);
    y += 4;

    const moduleRows = (e.modules || ALL_MODULES.map(m => m.id)).map(mId => {
      const m = ALL_MODULES.find(x => x.id === mId);
      return [m?.name || mId, m?.category || 'Core', 'Enabled [✓]'];
    });

    autoTable(doc, {
      startY: y,
      theme: 'striped',
      head: [['Module Name', 'Category', 'Status']],
      body: moduleRows,
    });

    doc.save(`${e.name.replace(/\s+/g, '_')}_Corporate_Profile.pdf`);
    notify?.('Corporate profile PDF downloaded');
  };

  const filteredEntities = entities.filter(e =>
    (e.name + ' ' + (e.code || '') + ' ' + (e.country || '') + ' ' + (e.state || '') + ' ' + (e.taxRegistrationNumber || '')).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-purple-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Companies &amp; Multi-Entity Hierarchy</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Govern corporate entities, operating subsidiaries, national &amp; provincial tax jurisdictions, and functional currencies.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Company / Entity
            </button>
          </div>
        </div>
      </div>

      {/* 4-in-1 KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={Building2} label="Registered Entities" value={entities.length} desc="Multi-company ecosystem" tone="emerald" />
        <KpiCard icon={CheckCircle2} label="Active Entities" value={entities.filter(e => e.active).length} desc="Open for financial postings" tone="teal" />
        <KpiCard icon={Globe} label="Jurisdictions" value={new Set(entities.map(e => e.country)).size} desc="Operating countries" tone="blue" />
        <KpiCard icon={Coins} label="Ledger Currencies" value={new Set(entities.map(e => e.currencyCode || e.functionalCurrency)).size} desc="Multi-currency functional books" tone="purple" />
      </KpiGrid>

      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter by company name, entity code, jurisdiction, province, or tax ID..."
          className="w-full pl-11 pr-8 py-2.5 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-teal-500 transition-colors"
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

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntities.map(e => {
          const isWorkingIn = e.id === activeEntityId;
          const countryInfo = COUNTRY_PROVINCES[e.country || 'Pakistan'] || COUNTRY_PROVINCES['Pakistan'];
          return (
            <div
              key={e.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isWorkingIn
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                  : 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-emerald-500/50 hover:shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                      {countryInfo.flag || (e.code || e.name[0] || 'C')}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                        {e.name}
                        {isWorkingIn && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">
                        {e.code || 'NO-CODE'} · {e.country || 'Global'} {e.state ? `(${e.state})` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[var(--color-surface-muted)] text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold block">Currency</span>
                    <span className="font-bold font-mono text-[var(--color-text-strong)]">{e.currencyCode || e.functionalCurrency || countryInfo.currency}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold block">Type</span>
                    <span className="font-semibold text-[var(--color-text-strong)]">{e.type || 'Subsidiary'}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-[var(--color-border)]/50">
                    <span className="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold block">Tax Registration #</span>
                    <span className="font-mono font-medium text-[var(--color-text-strong)] text-[11px] truncate block">
                      {e.taxRegistrationNumber || e.taxId || 'Not Registered'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--color-text-muted)] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${e.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {e.active ? 'Operational' : 'Deactivated'}
                  </div>
                  {e.city && (
                    <span className="text-[10px] text-[var(--color-text-muted)]">{e.city}</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                {!isWorkingIn && e.active ? (
                  <button
                    onClick={() => handleSwitchCompany(e.id, e.name)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Building2 className="w-3.5 h-3.5" /> Switch To Entity
                  </button>
                ) : (
                  <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Current Workspace
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => exportCompanyProfilePDF(e)}
                    title="Download Corporate Entity Profile PDF"
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEdit(e)}
                    title="Edit Corporate Parameters"
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-indigo-600"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleCompanyStatus(e.id, !e.active)}
                    title={e.active ? 'Deactivate Company' : 'Activate Company'}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-amber-600"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  {!isWorkingIn && !e.active && (
                    <button
                      onClick={() => handleDelete(e)}
                      title="Delete Company and Data"
                      className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Corporate Multi-Tabbed Entity Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
                  {activeCountryData.flag}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                    {editingId ? `Edit ${formData.name || 'Company Entity'}` : 'Register New Corporate Entity'}
                  </h3>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Operating Jurisdiction: <strong className="text-[var(--color-text-strong)]">{formData.country}</strong> ({formData.state || 'National'})
                  </p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('identity')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'identity'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> 1. Identity & Type
              </button>

              <button
                type="button"
                onClick={() => setModalTab('jurisdiction')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'jurisdiction'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> 2. Country & Province
              </button>

              <button
                type="button"
                onClick={() => setModalTab('tax')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'tax'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" /> 3. Tax & Fiscal
              </button>

              <button
                type="button"
                onClick={() => setModalTab('contact')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'contact'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" /> 4. Address & Contact
              </button>

              <button
                type="button"
                onClick={() => setModalTab('modules')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'modules'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> 5. Modules
              </button>

              <button
                type="button"
                onClick={() => setModalTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  modalTab === 'preview'
                    ? 'border-emerald-600 text-emerald-600 bg-emerald-500/10 font-bold'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> 6. Preview
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* TAB 1: IDENTITY */}
              {modalTab === 'identity' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Company Trading / Brand Name *</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Apex Industrial Solutions"
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Entity Short Code *</label>
                      <input
                        required
                        type="text"
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="APEX"
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] font-mono font-bold focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Full Registered Legal Name</label>
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={e => setFormData({ ...formData, legalName: e.target.value })}
                      placeholder="e.g. Apex Industrial Solutions (Private) Limited"
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Corporate Entity Type</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500"
                      >
                        <option value="Parent Corporation">Parent Corporation (Holding Company)</option>
                        <option value="Subsidiary">Operating Subsidiary</option>
                        <option value="Joint Venture">Joint Venture</option>
                        <option value="Branch Office">Branch / Regional Operating Unit</option>
                        <option value="Associate">Associate Entity</option>
                      </select>
                    </div>

                    {formData.type !== 'Parent Corporation' && (
                      <div className="space-y-1">
                        <label className="font-semibold text-[var(--color-text-strong)]">Parent / Holding Company</label>
                        <select
                          value={formData.parentId || ''}
                          onChange={e => setFormData({ ...formData, parentId: e.target.value })}
                          className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500"
                        >
                          <option value="">None / Standalone Entity</option>
                          {entities.filter(e => e.id !== editingId).map(e => (
                            <option key={e.id} value={e.id}>{e.name} ({e.code || 'CO'})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: JURISDICTION & PROVINCE */}
              {modalTab === 'jurisdiction' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Country / Sovereign Jurisdiction *</label>
                      <select
                        value={formData.country}
                        onChange={e => handleCountryChange(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] font-semibold focus:border-emerald-500"
                      >
                        <option value="Pakistan">🇵🇰 Pakistan</option>
                        <option value="United Kingdom">🇬🇧 United Kingdom</option>
                        <option value="Saudi Arabia">🇸🇦 Saudi Arabia (KSA)</option>
                        <option value="United Arab Emirates">🇦🇪 United Arab Emirates (UAE)</option>
                        <option value="United States">🇺🇸 United States of America</option>
                        <option value="Canada">🇨🇦 Canada</option>
                        <option value="European Union">🇪🇺 European Union (Germany / France / Netherlands / Ireland)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">
                        State / Province / Regional Authority *
                      </label>
                      <select
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] font-semibold focus:border-emerald-500"
                      >
                        {activeCountryData.provinces.map(p => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Functional General Ledger Currency</label>
                      <select
                        value={formData.currencyCode}
                        onChange={e => setFormData({ ...formData, currencyCode: e.target.value })}
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] font-mono font-bold focus:border-emerald-500"
                      >
                        <option value="PKR">PKR — Pakistani Rupee</option>
                        <option value="GBP">GBP — British Pound Sterling</option>
                        <option value="SAR">SAR — Saudi Riyal</option>
                        <option value="AED">AED — UAE Dirham</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="CAD">CAD — Canadian Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Governing Tax Ecosystem</label>
                      <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{activeCountryData.taxAuthority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-[var(--color-text-muted)] space-y-1">
                    <p className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      <Globe className="w-4 h-4" />
                      Automatic Localization Engine Active
                    </p>
                    <p className="text-[11px]">
                      Selecting <strong>{formData.country} ({formData.state})</strong> automatically provisions the official tax authorities, dual-entry GL mappings, standard & reduced VAT rates, zero-rated exports, and withholding tax slabs for this entity.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 3: TAX REGISTRATION */}
              {modalTab === 'tax' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">
                      {activeCountryData.taxIdLabel} *
                    </label>
                    <input
                      type="text"
                      value={formData.taxRegistrationNumber}
                      onChange={e => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                      placeholder={formData.country === 'Pakistan' ? 'e.g. NTN: 1234567-8 / STRN: 32-00-1234-567' : formData.country === 'United Kingdom' ? 'e.g. GB 123 4567 89' : 'e.g. 12-3456789'}
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] font-mono focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Fiscal Year Start Month</label>
                      <select
                        value={formData.fiscalYearStartMonth}
                        onChange={e => setFormData({ ...formData, fiscalYearStartMonth: parseInt(e.target.value, 10) })}
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500"
                      >
                        <option value={1}>January (Calendar Year — US / EU / UAE / SA)</option>
                        <option value={4}>April (UK / Japan Fiscal Year)</option>
                        <option value={7}>July (Pakistan / Australia Fiscal Year)</option>
                        <option value={10}>October (US Federal Govt Fiscal)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Accounting Standards Framework</label>
                      <select
                        defaultValue="IFRS"
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500 font-semibold"
                      >
                        <option value="IFRS">IAS / IFRS (International Accounting Standards)</option>
                        <option value="GAAP">US GAAP (Generally Accepted Accounting Principles)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ADDRESS & CONTACT */}
              {modalTab === 'contact' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-1">
                    <label className="font-semibold text-[var(--color-text-strong)]">Registered Corporate Address</label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Suite 402, Corporate Towers, Main Boulevard"
                      className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">City / District</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Lahore / London / Dubai"
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Official Contact Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +92 42 3578 9000"
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Corporate Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="finance@company.com"
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-[var(--color-text-strong)]">Corporate Website</label>
                      <input
                        type="text"
                        value={formData.website}
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://company.com"
                        className="w-full px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ENABLED MODULES */}
              {modalTab === 'modules' && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]">
                    <span className="font-semibold text-[var(--color-text-strong)]">Enable Functional Modules for this Entity</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, modules: ALL_MODULES.map(m => m.id) })}
                      className="text-[11px] text-emerald-600 font-bold hover:underline"
                    >
                      Enable All
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_MODULES.map(m => {
                      const enabled = formData.modules.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            const next = enabled
                              ? formData.modules.filter(id => id !== m.id)
                              : [...formData.modules, m.id];
                            setFormData({ ...formData, modules: next });
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                            enabled
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold'
                              : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          <span className="text-[11px]">{m.name}</span>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${enabled ? 'bg-emerald-600 text-white' : 'border border-[var(--color-border)]'}`}>
                            {enabled ? '✓' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: LIVE PREVIEW */}
              {modalTab === 'preview' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{activeCountryData.flag}</span>
                        <div>
                          <h3 className="text-base font-bold tracking-tight">{formData.name || 'Unnamed Company'}</h3>
                          <p className="text-xs text-emerald-200 font-mono">
                            {formData.code || 'NO-CODE'} · {formData.legalName || formData.name}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-bold font-mono">
                        {formData.currencyCode} Functional
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
                      <span className="font-bold text-[var(--color-text-strong)] block border-b border-[var(--color-border)] pb-1">
                        📍 Jurisdiction & Tax Setup
                      </span>
                      <div className="space-y-1 text-[11px]">
                        <p><span className="text-[var(--color-text-muted)]">Country:</span> <strong>{formData.country}</strong></p>
                        <p><span className="text-[var(--color-text-muted)]">State / Province:</span> <strong>{formData.state}</strong></p>
                        <p><span className="text-[var(--color-text-muted)]">Tax Registration:</span> <strong className="font-mono">{formData.taxRegistrationNumber || 'Not Specified'}</strong></p>
                        <p><span className="text-[var(--color-text-muted)]">Tax Authority:</span> <span className="text-emerald-600 font-semibold">{activeCountryData.taxAuthority}</span></p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
                      <span className="font-bold text-[var(--color-text-strong)] block border-b border-[var(--color-border)] pb-1">
                        🏢 Corporate & Contact
                      </span>
                      <div className="space-y-1 text-[11px]">
                        <p><span className="text-[var(--color-text-muted)]">Entity Type:</span> <strong>{formData.type}</strong></p>
                        <p><span className="text-[var(--color-text-muted)]">Fiscal Year Start:</span> <strong>Month {formData.fiscalYearStartMonth}</strong></p>
                        <p><span className="text-[var(--color-text-muted)]">City / Address:</span> <span>{formData.city || '—'} {formData.address ? `(${formData.address})` : ''}</span></p>
                        <p><span className="text-[var(--color-text-muted)]">Contact:</span> <span className="font-mono">{formData.email || '—'}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {modalTab !== 'identity' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'preview') setModalTab('modules');
                        else if (modalTab === 'modules') setModalTab('contact');
                        else if (modalTab === 'contact') setModalTab('tax');
                        else if (modalTab === 'tax') setModalTab('jurisdiction');
                        else if (modalTab === 'jurisdiction') setModalTab('identity');
                      }}
                      className="px-3.5 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                    >
                      Back
                    </button>
                  )}

                  {modalTab !== 'preview' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (modalTab === 'identity') {
                          if (!formData.name.trim()) { notify?.('Company name is required.'); return; }
                          setModalTab('jurisdiction');
                        } else if (modalTab === 'jurisdiction') {
                          setModalTab('tax');
                        } else if (modalTab === 'tax') {
                          setModalTab('contact');
                        } else if (modalTab === 'contact') {
                          setModalTab('modules');
                        } else if (modalTab === 'modules') {
                          setModalTab('preview');
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>
                        {modalTab === 'identity' ? 'Next: Jurisdiction & Province' : modalTab === 'jurisdiction' ? 'Next: Tax Registration' : modalTab === 'tax' ? 'Next: Address & Contact' : modalTab === 'contact' ? 'Next: Modules' : 'Preview & Review'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingId ? 'Confirm & Save Changes' : 'Confirm & Register Corporate Entity'}</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BRANCHES VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function BranchesView({ activeEntityId, notify }: { activeEntityId?: string; notify?: (m: string) => void }) {
  const { branches, fetchBranches, createBranch, setBranchStatus, deleteBranch } = useAdministrationStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', city: '', address: '', active: true });

  useEffect(() => { fetchBranches({ companyId: activeEntityId }); }, [fetchBranches, activeEntityId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await createBranch({ ...formData, companyId: activeEntityId });
    notify?.(`Branch ${formData.name} added`);
    setFormData({ name: '', code: '', city: '', address: '', active: true });
    setModalOpen(false);
  };

  const handleDelete = async (b: Branch) => {
    if (window.confirm(`Delete branch "${b.name}"?`)) {
      await deleteBranch(b.id);
      notify?.(`Branch ${b.name} deleted`);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-purple-700" />
              <div className="absolute inset-0 flex items-center justify-center"><GitBranch className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Branches &amp; Regional Operating Units</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Define physical outlets, regional offices, and cost centers for segmented transaction tagging.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Branch
            </button>
          </div>
        </div>
      </div>

      {/* 4-in-1 KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={GitBranch} label="Total Branches" value={branches.length} desc="Operating units" tone="purple" />
        <KpiCard icon={CheckCircle2} label="Active Units" value={branches.filter(b => b.active).length} desc="Accepting transactions" tone="emerald" />
        <KpiCard icon={Building2} label="Operating Cities" value={new Set(branches.map(b => b.city).filter(Boolean)).size} desc="Geographic reach" tone="blue" />
        <KpiCard icon={Globe} label="Network Architecture" value={branches.length > 1 ? 'Multi-Branch' : 'Single Unit'} desc="Branch segment reporting" tone="teal" />
      </KpiGrid>

      {/* Branches Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              <th className="p-3.5">Branch Name</th>
              <th className="p-3.5">Code</th>
              <th className="p-3.5">City</th>
              <th className="p-3.5">Physical Address</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {branches.map(b => (
              <tr key={b.id} className="hover:bg-[var(--color-surface-muted)] transition-colors">
                <td className="p-3.5 font-bold text-[var(--color-text-strong)]">{b.name}</td>
                <td className="p-3.5 font-mono text-[var(--color-text-muted)]">{b.code || '—'}</td>
                <td className="p-3.5">{b.city || '—'}</td>
                <td className="p-3.5 text-[var(--color-text-muted)]">{b.address || '—'}</td>
                <td className="p-3.5">
                  <button
                    onClick={() => setBranchStatus(b.id, !b.active)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                      b.active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                    }`}
                  >
                    {b.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleDelete(b)}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {branches.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">
                  No branches configured. Click "+ Add Branch" to add your first operating unit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-purple-600" />
                Add Operating Branch
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Branch Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Islamabad Regional Office"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Branch Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="ISB-01"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Islamabad"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Address Details</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Floor 4, Corporate Tower, Blue Area"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Create Branch
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
// 6. APPROVAL WORKFLOWS VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function ApprovalWorkflowsView({ activeEntityId, notify }: { activeEntityId?: string; notify?: (m: string) => void }) {
  const { workflows, fetchWorkflows, createWorkflow, setWorkflowStatus, deleteWorkflow } = useAdministrationStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    module: 'Banking & Payments',
    approverRole: 'Manager',
    steps: 2,
    active: true,
  });

  useEffect(() => { fetchWorkflows({ companyId: activeEntityId }); }, [fetchWorkflows, activeEntityId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await createWorkflow({ ...formData, companyId: activeEntityId });
    notify?.(`Approval workflow ${formData.name} created`);
    setFormData({ name: '', module: 'Banking & Payments', approverRole: 'Manager', steps: 2, active: true });
    setModalOpen(false);
  };

  const handleDelete = async (w: ApprovalWorkflow) => {
    if (window.confirm(`Delete workflow "${w.name}"?`)) {
      await deleteWorkflow(w.id);
      notify?.(`Workflow ${w.name} removed`);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-purple-700" />
              <div className="absolute inset-0 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Multi-Tiered Approval Workflows</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Enforce segregation of duties (SoD) and multi-step authorization rules before posting financial transactions.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Create Workflow
            </button>
          </div>
        </div>
      </div>

      {/* 4-in-1 KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={CheckCircle2} label="Defined Workflows" value={workflows.length} desc="Governance approval chains" tone="amber" />
        <KpiCard icon={Power} label="Active Routing" value={workflows.filter(w => w.active).length} desc="Currently intercepting submissions" tone="emerald" />
        <KpiCard icon={GitBranch} label="Approval Steps" value={workflows.reduce((s, w) => s + w.steps, 0)} desc="Sequential audit checkpoints" tone="blue" />
        <KpiCard icon={ShieldCheck} label="Approver Roles" value={new Set(workflows.map(w => w.approverRole)).size} desc="Designated authorizers" tone="purple" />
      </KpiGrid>

      {/* Workflows Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map(w => (
          <div
            key={w.id}
            className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-sm text-[var(--color-text-strong)]">{w.name}</h4>
                <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-0.5">
                  Target Module: <span className="text-amber-600 font-bold">{w.module}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkflowStatus(w.id, !w.active)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    w.active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                  }`}
                >
                  {w.active ? 'Active' : 'Paused'}
                </button>
                <button
                  onClick={() => handleDelete(w)}
                  className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Visual Approval Chain Flowchart */}
            <div className="p-3 rounded-xl bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)] block">Sequential Flow:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-1 rounded bg-[var(--color-surface)] border font-semibold text-[var(--color-text)]">
                  1. Operator Draft
                </span>
                <span className="text-amber-600 font-bold">➔</span>
                <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-300 font-bold">
                  2. {w.approverRole} Approval
                </span>
                {w.steps > 1 && (
                  <>
                    <span className="text-amber-600 font-bold">➔</span>
                    <span className="px-2 py-1 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200 border border-blue-300 font-bold">
                      3. CFO Signoff
                    </span>
                  </>
                )}
                <span className="text-emerald-600 font-bold">➔</span>
                <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-300 font-bold">
                  ✓ Post to GL
                </span>
              </div>
            </div>
          </div>
        ))}
        {workflows.length === 0 && (
          <div className="col-span-2 p-8 text-center text-[var(--color-text-muted)] border border-dashed rounded-xl">
            No approval workflows configured.
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                Configure Approval Rule
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Workflow Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. High Value Payment Voucher Approval"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Target Module</label>
                  <select
                    value={formData.module}
                    onChange={e => setFormData({ ...formData, module: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  >
                    <option value="Banking & Payments">Banking & Payments</option>
                    <option value="Sales Invoicing">Sales Invoicing</option>
                    <option value="Procurement & Bills">Procurement & Bills</option>
                    <option value="Journal Entries">Journal Entries</option>
                    <option value="Payroll & HR">Payroll & HR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Approver Role</label>
                  <select
                    value={formData.approverRole}
                    onChange={e => setFormData({ ...formData, approverRole: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                  >
                    <option value="Manager">Department Manager</option>
                    <option value="Senior Accountant">Senior Accountant</option>
                    <option value="Finance Admin">Finance Admin</option>
                    <option value="CFO">Chief Financial Officer (CFO)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Number of Sequential Approval Steps</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={formData.steps}
                  onChange={e => setFormData({ ...formData, steps: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Workflow
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
// 7. NUMBER SERIES VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function NumberSeriesView({ activeEntityId, notify }: { activeEntityId?: string; notify?: (m: string) => void }) {
  const { numberSeries, fetchNumberSeries, createNumberSeries, setNumberSeriesStatus, deleteNumberSeries } = useAdministrationStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', prefix: 'INV-', nextNumber: 1, format: '', active: true });

  useEffect(() => { fetchNumberSeries({ companyId: activeEntityId }); }, [fetchNumberSeries, activeEntityId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.prefix.trim()) return;

    const format = `${formData.prefix}${String(formData.nextNumber).padStart(5, '0')}`;
    await createNumberSeries({ ...formData, format, companyId: activeEntityId });
    notify?.(`Number series ${formData.name} created`);
    setFormData({ name: '', prefix: 'INV-', nextNumber: 1, format: '', active: true });
    setModalOpen(false);
  };

  const handleDelete = async (s: NumberSeries) => {
    if (window.confirm(`Delete number series "${s.name}"?`)) {
      await deleteNumberSeries(s.id);
      notify?.(`Series ${s.name} deleted`);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-purple-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Hash className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Document Number Series &amp; Auto-Sequencing</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Automate document numbering, prefixes, and sequence padding for invoices, vouchers, and bills.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Series
            </button>
          </div>
        </div>
      </div>

      {/* 4-in-1 KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={Hash} label="Configured Series" value={numberSeries.length} desc="Document sequence definitions" tone="indigo" />
        <KpiCard icon={CheckCircle2} label="Active Series" value={numberSeries.filter(s => s.active).length} desc="Ready for document creation" tone="emerald" />
        <KpiCard icon={KeyRound} label="Unique Prefixes" value={new Set(numberSeries.map(s => s.prefix)).size} desc="Document type prefixes" tone="blue" />
        <KpiCard icon={ScrollText} label="Next Sequenced Count" value={numberSeries.reduce((s, x) => s + x.nextNumber, 0)} desc="Issued document count" tone="purple" />
      </KpiGrid>

      {/* Number Series Register */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              <th className="p-3.5">Series Name</th>
              <th className="p-3.5">Prefix</th>
              <th className="p-3.5">Next Sequence #</th>
              <th className="p-3.5">Sample Format</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {numberSeries.map(s => (
              <tr key={s.id} className="hover:bg-[var(--color-surface-muted)] transition-colors">
                <td className="p-3.5 font-bold text-[var(--color-text-strong)]">{s.name}</td>
                <td className="p-3.5 font-mono text-[var(--color-text-muted)]">{s.prefix}</td>
                <td className="p-3.5 font-mono font-bold text-indigo-600">{s.nextNumber}</td>
                <td className="p-3.5 font-mono text-[var(--color-text-strong)]">
                  {s.format || `${s.prefix}${String(s.nextNumber).padStart(5, '0')}`}
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => setNumberSeriesStatus(s.id, !s.active)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                      s.active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                    }`}
                  >
                    {s.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleDelete(s)}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {numberSeries.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">
                  No number series defined. Click "+ Add Series" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-600" />
                Define Document Number Series
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Series / Document Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sales Invoice"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Prefix *</label>
                  <input
                    required
                    type="text"
                    value={formData.prefix}
                    onChange={e => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
                    placeholder="INV-"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Next Number</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.nextNumber}
                    onChange={e => setFormData({ ...formData, nextNumber: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 text-xs">
                <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 block mb-1">Live Format Preview:</span>
                <span className="font-mono font-bold text-sm text-indigo-950 dark:text-indigo-200">
                  {formData.prefix}{String(formData.nextNumber).padStart(5, '0')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Create Series
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
// 8. CURRENCY & EXCHANGE RATES VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function CurrencyView({ activeEntityId, notify }: { activeEntityId?: string; notify?: (m: string) => void }) {
  const { currencies, fetchCurrencies, createCurrency, setCurrencyStatus, deleteCurrency } = useAdministrationStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', name: '', symbol: '', rate: 1, active: true });

  useEffect(() => { fetchCurrencies({ companyId: activeEntityId }); }, [fetchCurrencies, activeEntityId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    await createCurrency({ ...formData, base: false, companyId: activeEntityId });
    notify?.(`Currency ${formData.code} added`);
    setFormData({ code: '', name: '', symbol: '', rate: 1, active: true });
    setModalOpen(false);
  };

  const handleDelete = async (c: Currency) => {
    if (c.base) {
      alert('Cannot delete functional base currency.');
      return;
    }
    if (window.confirm(`Delete currency ${c.code}?`)) {
      await deleteCurrency(c.id);
      notify?.(`Currency ${c.code} deleted`);
    }
  };

  const baseCurrency = currencies.find(c => c.base);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-purple-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Coins className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Multi-Currency &amp; Exchange Rates Engine</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Manage ISO currencies, FX valuation rates, and base functional currency for IAS 21 compliance.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Add Foreign Currency
            </button>
          </div>
        </div>
      </div>

      {/* 4-in-1 KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={Coins} label="Currencies Supported" value={currencies.length} desc="Active multi-currency pool" tone="rose" />
        <KpiCard icon={Building2} label="Functional Base" value={baseCurrency?.code || 'PKR'} desc="Standard GL reporting currency" tone="blue" />
        <KpiCard icon={CheckCircle2} label="Enabled Currencies" value={currencies.filter(c => c.active).length} desc="Available for transactions" tone="emerald" />
        <KpiCard icon={Globe} label="IAS 21 FX Standard" value="Active" desc="Realized / Unrealized FX Gain" tone="purple" />
      </KpiGrid>

      {/* Currencies Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              <th className="p-3.5">ISO Code</th>
              <th className="p-3.5">Currency Name</th>
              <th className="p-3.5">Symbol</th>
              <th className="p-3.5">FX Rate vs Base ({baseCurrency?.code || 'BASE'})</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {currencies.map(c => (
              <tr key={c.id} className="hover:bg-[var(--color-surface-muted)] transition-colors">
                <td className="p-3.5 font-bold font-mono text-[var(--color-text-strong)] flex items-center gap-2">
                  {c.code}
                  {c.base && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                      BASE
                    </span>
                  )}
                </td>
                <td className="p-3.5 text-[var(--color-text-strong)] font-medium">{c.name}</td>
                <td className="p-3.5 font-bold font-mono">{c.symbol}</td>
                <td className="p-3.5 font-mono font-bold text-rose-600">
                  {c.base ? '1.0000 (Base)' : `1 ${c.code} = ${c.rate} ${baseCurrency?.code || ''}`}
                </td>
                <td className="p-3.5">
                  <button
                    onClick={() => setCurrencyStatus(c.id, !c.active)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                      c.active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                    }`}
                  >
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3.5 text-right">
                  {!c.base && (
                    <button
                      onClick={() => handleDelete(c)}
                      className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {currencies.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--color-text-muted)]">
                  No currencies defined.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                <Coins className="w-4 h-4 text-rose-600" />
                Add Foreign Currency
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">ISO Code *</label>
                  <input
                    required
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. EUR"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-text-strong)]">Symbol *</label>
                  <input
                    required
                    type="text"
                    value={formData.symbol}
                    onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                    placeholder="€"
                    className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Currency Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Euro"
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--color-text-strong)]">Exchange Rate (vs 1 {baseCurrency?.code || 'Base'})</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={formData.rate}
                  onChange={e => setFormData({ ...formData, rate: Number(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text)] font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-xl text-xs font-semibold hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Currency
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
// 9. AUDIT LOGS & EVENT REGISTER VIEW
// ─────────────────────────────────────────────────────────────────────────────
export function AuditLogsView({ activeEntityId, notify }: { activeEntityId?: string; entities?: any[]; notify?: (m: string) => void }) {
  const [items, setItems] = useState<AuditTrailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(200);
  const [actionFilter, setActionFilter] = useState('All');

  const [selectedItem, setSelectedItem] = useState<AuditTrailItem | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit };
      if (activeEntityId) params.companyId = activeEntityId;
      const data = await accountingApi.getAuditTrail(params);
      setItems(data || []);
    } catch {
      setItems([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeEntityId, limit]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchesQ = (i.entityName + ' ' + i.detail + ' ' + i.action).toLowerCase().includes(query.toLowerCase());
      const matchesAction = actionFilter === 'All' || i.action.toUpperCase() === actionFilter.toUpperCase();
      return matchesQ && matchesAction;
    });
  }, [items, query, actionFilter]);

  const uniqueActions = Array.from(new Set(items.map(i => i.action.toUpperCase()).filter(Boolean)));

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('FORENSIC AUDIT TRAIL REGISTER & EVENT LOG', 14, 15);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleString()} · Total Logged Events: ${filtered.length}`, 14, 21);

    const tableData = filtered.map(i => [
      new Date(i.at).toLocaleString(),
      i.action,
      i.entityName,
      i.detail,
    ]);

    autoTable(doc, {
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      head: [['Timestamp', 'Action', 'Target Entity', 'Event Detail & Parameters']],
      body: tableData,
    });

    doc.save(`Audit_Trail_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    notify?.('Audit log PDF exported');
  };

  const exportExcelReport = () => {
    const headers = ['Timestamp', 'Action', 'Target Entity', 'Detail'];
    const rows = filtered.map(i => [
      new Date(i.at).toLocaleString(),
      i.action,
      i.entityName,
      i.detail,
    ]);
    downloadExcel(`Audit_Trail_${new Date().toISOString().slice(0, 10)}`, 'Audit Trail', headers, rows);
    notify?.('Audit log Excel exported');
  };

  const exportCSVReport = () => {
    const headers = ['Timestamp', 'Action', 'Target Entity', 'Detail'];
    const rows = filtered.map(i => [
      new Date(i.at).toLocaleString(),
      i.action,
      i.entityName,
      i.detail,
    ]);
    downloadCSV(`Audit_Trail_${new Date().toISOString().slice(0, 10)}`, headers, rows);
    notify?.('Audit log CSV exported');
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-purple-700" />
              <div className="absolute inset-0 flex items-center justify-center"><ScrollText className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Immutable Audit Trail &amp; Governance Log</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Forensic non-repudiation event stream tracking all journal postings, mutations, deletions, and logins.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportPDF}
            className="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-rose-500" /> Export PDF
          </button>
          <button
            onClick={exportExcelReport}
            className="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
          </button>
          <button
            onClick={exportCSVReport}
            className="px-3 py-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" /> CSV
          </button>
          <button
            onClick={load}
            className="p-1.5 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] rounded-xl"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

      {/* 4-in-1 KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={ScrollText} label="Logged Events" value={items.length} desc="Total chronological events" tone="teal" />
        <KpiCard icon={Hash} label="Action Types" value={uniqueActions.length} desc="Distinct transaction types" tone="blue" />
        <KpiCard icon={Building2} label="Entities Tracked" value={new Set(items.map(i => i.entityName)).size} desc="Data models monitored" tone="purple" />
        <KpiCard icon={CheckCircle2} label="Audit Integrity" value="100% SECURE" desc="Tamper-evident WORM storage" tone="emerald" />
      </KpiGrid>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search forensic audit trail by action, entity, or description..."
            className="w-full pl-11 pr-8 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-xl outline-none text-[var(--color-text-strong)] focus:border-teal-500 transition-colors"
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] outline-none"
          >
            <option value="All">All Actions</option>
            {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            value={String(limit)}
            onChange={e => setLimit(Number(e.target.value) || 200)}
            className="px-3 py-1.5 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] outline-none"
          >
            <option value="100">100 rows</option>
            <option value="200">200 rows</option>
            <option value="500">500 rows</option>
            <option value="1000">1000 rows</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Action</th>
              <th className="p-3.5">Target Entity</th>
              <th className="p-3.5">Event Description & Parameters</th>
              <th className="p-3.5 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {loading && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--color-text-muted)]">
                  Loading immutable audit events...
                </td>
              </tr>
            )}
            {!loading && filtered.map((i, idx) => (
              <tr key={idx} className="hover:bg-[var(--color-surface-muted)] transition-colors">
                <td className="p-3.5 font-mono text-[var(--color-text-muted)] whitespace-nowrap">
                  {new Date(i.at).toLocaleString()}
                </td>
                <td className="p-3.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      i.action.includes('CREATE') || i.action.includes('POST')
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200'
                        : i.action.includes('DELETE') || i.action.includes('LOCK')
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200'
                        : i.action.includes('UPDATE')
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200'
                    }`}
                  >
                    {i.action}
                  </span>
                </td>
                <td className="p-3.5 font-bold text-[var(--color-text-strong)]">{i.entityName}</td>
                <td className="p-3.5 text-[var(--color-text-muted)] max-w-xl truncate">{i.detail}</td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => setSelectedItem(i)}
                    className="p-1.5 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)]"
                    title="Inspect Payload"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-[var(--color-text-muted)]">
                  No audit trail records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                <ScrollText className="w-4 h-4 text-slate-600" />
                Audit Event Inspector
              </h3>
              <button onClick={() => setSelectedItem(null)} className="p-1 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--color-surface-muted)] rounded-xl border border-[var(--color-border)]">
                <div>
                  <span className="text-[10px] text-[var(--color-text-muted)] font-semibold block">Timestamp</span>
                  <span className="font-mono font-bold text-[var(--color-text-strong)]">{new Date(selectedItem.at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-text-muted)] font-semibold block">Action</span>
                  <span className="font-bold text-teal-600">{selectedItem.action}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--color-text-strong)]">Target Entity / Model</label>
                <div className="p-2.5 bg-[var(--color-surface-muted)] rounded-lg font-mono text-[var(--color-text-strong)]">
                  {selectedItem.entityName}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[var(--color-text-strong)]">Full Event Log Payload</label>
                <div className="p-3 bg-[var(--color-surface-muted)] rounded-xl border border-[var(--color-border)] font-mono text-[11px] text-[var(--color-text-strong)] whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedItem.detail}
                </div>
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-[var(--color-border)]">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}