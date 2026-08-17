import { useState, useEffect } from 'react';
import { useCompanyStore, useAdministrationStore } from './stores';
import { accountingApi, type AuditTrailItem } from './api/modules/accounting.api';
import type { UserStatus } from './api/modules/administration.api';
import type { Entity } from './api/modules/entities.api';
import { setActiveCurrency } from './lib/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ModuleSummaryLayout, SummaryPanel } from '@/components/module-summary-layout';
import {
  Users, ShieldCheck, Building2, GitBranch, CheckCircle2, Hash, Coins, ScrollText, Plus, Save, Trash2, Pencil, KeyRound, Lock, Globe, Search
} from 'lucide-react';

// ── Summary (module overview) ─────────────────────────────────────────────────
export function AdministrationSummaryView() {
  const { entities } = useCompanyStore();
  const { dashboard, users, roles, branches, numberSeries, workflows, currencies, fetchAll } = useAdministrationStore();
  useEffect(() => { useCompanyStore.getState().fetchCompanies(); }, []);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const activeEntities = entities.filter(e => e.active).length;

  return (
    <ModuleSummaryLayout
      title="Administration"
      description="User access, roles, company structure, workflows, number series, currency, and audit"
      stats={[
        { icon: Users, label: 'Users', value: users.length, tone: 'teal' },
        { icon: ShieldCheck, label: 'Roles', value: roles.length, tone: 'blue' },
        { icon: Building2, label: 'Active Companies', value: activeEntities, tone: 'green' },
        { icon: GitBranch, label: 'Branches', value: branches.length, tone: 'violet' },
      ]}
    >
      <SummaryPanel icon={CheckCircle2} title="Configuration Status">
        <div className="space-y-2">
          <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span>Number Series</span><Badge variant={numberSeries.length ? 'secondary' : 'outline'}>{numberSeries.length} defined</Badge></div>
          <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span>Approval Workflows</span><Badge variant="secondary">{workflows.filter(w => w.active).length} active</Badge></div>
          <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span>Currencies</span><Badge variant="secondary">{currencies.filter(c => c.active).length} enabled</Badge></div>
          <div className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"><span>Base Currency</span><Badge variant="outline">{dashboard?.baseCurrency ?? '—'}</Badge></div>
        </div>
      </SummaryPanel>
      <SummaryPanel icon={Lock} title="Security Posture">
        <div className="grid grid-cols-2 gap-3">
          <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{users.filter(u => u.status === 'Active').length}</p><p className="text-[10px] text-muted-foreground">Active Users</p></div>
          <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{users.filter(u => u.status === 'Locked').length}</p><p className="text-[10px] text-muted-foreground">Locked Accounts</p></div>
          <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{roles.reduce((s, r) => s + r.permissions.length, 0)}</p><p className="text-[10px] text-muted-foreground">Total Permissions</p></div>
          <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{branches.filter(b => b.active).length}</p><p className="text-[10px] text-muted-foreground">Active Branches</p></div>
        </div>
      </SummaryPanel>
    </ModuleSummaryLayout>
  );
}

const ALL_PERMISSIONS = ['Dashboard', 'Sales', 'Procurement', 'Banking', 'Accounting', 'Inventory', 'Manufacturing', 'Payroll', 'Field Ops', 'Compliance', 'Projects', 'Analytics', 'Administration'];

// ── Users ─────────────────────────────────────────────────────────────────────
export function UsersView() {
  const { users, fetchUsers, createUser, updateUser, deleteUser } = useAdministrationStore();
  const [form, setForm] = useState({ fullName: '', email: '', role: 'Accountant', status: 'Active' as UserStatus });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { userName: form.email, ...form };
    if (editingId) await updateUser(editingId, payload);
    else await createUser(payload);
    setForm({ fullName: '', email: '', role: 'Accountant', status: 'Active' });
    setEditingId(null);
  };

  const filtered = users.filter(u => u.fullName.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()));

  const userStatus = (s: string) => s === 'Active' ? 'secondary' : s === 'Locked' ? 'destructive' : 'outline';

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Users" description="Manage system user accounts and access status" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={users.length} tone="teal" />
        <StatCard icon={ShieldCheck} label="Active" value={users.filter(u => u.status === 'Active').length} tone="green" />
        <StatCard icon={Lock} label="Locked" value={users.filter(u => u.status === 'Locked').length} tone="red" />
        <StatCard icon={KeyRound} label="Roles Assigned" value={users.reduce((s, u) => s + (u.role ? 1 : 0), 0)} tone="blue" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 col-span-1 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">{editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editingId ? 'Edit User' : 'Add User'}</p>
          <form onSubmit={save} className="space-y-3">
            <FormField label="Full Name" required><Input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Jane Cooper" /></FormField>
            <FormField label="Email" required><Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" /></FormField>
            <FormField label="Role">
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v || 'Accountant' })}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Finance admin">Finance admin</SelectItem>
                  <SelectItem value="Senior Accountant">Senior Accountant</SelectItem>
                  <SelectItem value="Accountant">Accountant</SelectItem>
                  <SelectItem value="External Auditor">External Auditor</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: (v || 'Active') as UserStatus })}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex gap-2">
              <Button type="submit" size="sm"><Save className="h-4 w-4" /> {editingId ? 'Update' : 'Create'}</Button>
              {editingId && <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(null); setForm({ fullName: '', email: '', role: 'Accountant', status: 'Active' }); }}>Cancel</Button>}
            </div>
          </form>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" /> User Directory</p>
            <div className="relative w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 h-9 text-xs" placeholder="Search users..." value={query} onChange={e => setQuery(e.target.value)} /></div>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last Login</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell><Badge variant={userStatus(u.status) as any}>{u.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" title="Edit" onClick={() => { setEditingId(u.id); setForm({ fullName: u.fullName, email: u.email, role: u.role, status: u.status }); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" title="Delete" onClick={() => deleteUser(u.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No users found</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

// ── Roles & Permissions ───────────────────────────────────────────────────────
export function RolesPermissionsView() {
  const { roles, fetchRoles, createRole, updateRole, deleteRole } = useAdministrationStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingId) await updateRole(editingId, { name, description, permissions: selected });
    else await createRole({ name, description, permissions: selected });
    setName(''); setDescription(''); setSelected([]); setEditingId(null);
  };

  const togglePerm = (p: string) => setSelected(s => s.includes(p) ? s.filter(x => x !== p) : [...s, p]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Roles & Permissions" description="Define roles and control module-level access" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ShieldCheck} label="Roles" value={roles.length} tone="teal" />
        <StatCard icon={KeyRound} label="Permission Grants" value={roles.reduce((s, r) => s + r.permissions.length, 0)} tone="blue" />
        <StatCard icon={Lock} label="Modules Controlled" value={ALL_PERMISSIONS.length} tone="violet" />
        <StatCard icon={CheckCircle2} label="Full-Access Roles" value={roles.filter(r => r.permissions.length === ALL_PERMISSIONS.length).length} tone="green" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {editingId ? 'Edit Role' : 'Create Role'}</p>
          <form onSubmit={save} className="space-y-3">
            <FormField label="Role Name" required><Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Operations Manager" /></FormField>
            <FormField label="Description"><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Scope of this role..." /></FormField>
            <FormField label="Module Permissions">
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {ALL_PERMISSIONS.map(p => (
                  <label key={p} className="flex items-center gap-2 text-sm border rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted/40">
                    <input type="checkbox" checked={selected.includes(p)} onChange={() => togglePerm(p)} className="accent-teal-600" />
                    {p}
                  </label>
                ))}
              </div>
            </FormField>
            <div className="flex gap-2">
              <Button type="submit" size="sm"><Save className="h-4 w-4" /> {editingId ? 'Update' : 'Create'}</Button>
              {editingId && <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(null); setName(''); setDescription(''); setSelected([]); }}>Cancel</Button>}
            </div>
          </form>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium">Role Matrix</p>
          <div className="space-y-2">
            {roles.map(r => (
              <div key={r.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div><p className="font-medium text-sm">{r.name}</p><p className="text-xs text-muted-foreground">{r.description}</p></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(r.id); setName(r.name); setDescription(r.description); setSelected(r.permissions); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteRole(r.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.permissions.map(p => <Badge key={p} variant="outline">{p}</Badge>)}
                </div>
              </div>
            ))}
            {roles.length === 0 && <p className="text-sm text-muted-foreground">No roles defined.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Companies & Branches ──────────────────────────────────────────────────────
const ALL_MODULES = [
  { id: 'overview', name: 'Overview' },
  { id: 'sales', name: 'Sales & Customers' },
  { id: 'procurement', name: 'Procurement' },
  { id: 'banking', name: 'Banking & Payments' },
  { id: 'accounting', name: 'Accounting' },
  { id: 'assets', name: 'Assets & Inventory' },
  { id: 'manufacturing', name: 'Manufacturing' },
  { id: 'payroll', name: 'Payroll & HR' },
  { id: 'field', name: 'Survey & Field Operations' },
  { id: 'compliance', name: 'Government Compliance' },
  { id: 'projects', name: 'Projects' },
  { id: 'analytics', name: 'AI & Analytics' },
  { id: 'administration', name: 'Administration' },
];

export function CompaniesView() {
  const { entities, activeEntityId, fetchCompanies, saveCompany, toggleCompanyStatus, setActiveEntityId } = useCompanyStore();
  const getInitialForm = () => {
    const savedCountry = localStorage.getItem('onboarding_country_name') || 'Pakistan';
    const savedCurrency = localStorage.getItem('active_currency') || 'PKR';
    return { name: '', code: '', currencyCode: savedCurrency, country: savedCountry, type: 'Subsidiary' as string, active: true, modules: ALL_MODULES.map(m => m.id) };
  };
  const [form, setForm] = useState(getInitialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveCompany(form, editingId ?? undefined);
    localStorage.removeItem('onboarding_country');
    localStorage.removeItem('onboarding_country_name');
    if (editingId && editingId === activeEntityId) {
      setActiveCurrency(form.currencyCode);
    }
    setEditingId(null);
    setForm(getInitialForm());
  };

  const startEdit = (e: Entity) => {
    setEditingId(e.id);
    setForm({
      name: e.name,
      code: e.code || '',
      currencyCode: e.currencyCode || e.functionalCurrency || 'PKR',
      country: e.country || 'Pakistan',
      type: e.type || 'Subsidiary',
      active: e.active,
      modules: e.modules?.length ? e.modules : ALL_MODULES.map(m => m.id),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(getInitialForm());
  };

  const toggleModule = (id: string) => {
    setForm(f => ({
      ...f,
      modules: f.modules.includes(id) ? f.modules.filter(m => m !== id) : [...f.modules, id]
    }));
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Companies" description="Corporate entities operating on the system" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Companies" value={entities.length} tone="teal" />
        <StatCard icon={CheckCircle2} label="Active" value={entities.filter(e => e.active).length} tone="green" />
        <StatCard icon={Globe} label="Countries" value={new Set(entities.map(e => e.country)).size} tone="blue" />
        <StatCard icon={Coins} label="Currencies" value={new Set(entities.map(e => e.currencyCode || e.functionalCurrency)).size} tone="violet" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">{editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editingId ? 'Edit Company' : 'Add Company'}</p>
          <form onSubmit={save} className="space-y-3">
            <FormField label="Company Name" required><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Acme Corporation" /></FormField>
            <FormField label="Code"><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="ACME" /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Currency">
                <Select value={form.currencyCode} onValueChange={v => setForm({ ...form, currencyCode: v || 'USD' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PKR">PKR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="GBP">GBP</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="AED">AED</SelectItem><SelectItem value="SAR">SAR</SelectItem><SelectItem value="CAD">CAD</SelectItem><SelectItem value="AUD">AUD</SelectItem></SelectContent>
                </Select>
              </FormField>
              <FormField label="Country">
                <Select value={form.country} onValueChange={v => setForm({ ...form, country: v || 'United States' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Pakistan">Pakistan</SelectItem><SelectItem value="United States">United States</SelectItem><SelectItem value="United Kingdom">United Kingdom</SelectItem><SelectItem value="United Arab Emirates">United Arab Emirates</SelectItem><SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem><SelectItem value="European Union">European Union</SelectItem><SelectItem value="Canada">Canada</SelectItem><SelectItem value="Australia">Australia</SelectItem><SelectItem value="Germany">Germany</SelectItem></SelectContent>
                </Select>
              </FormField>
            </div>
            <FormField label="Modules">
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {ALL_MODULES.map(m => (
                  <label key={m.id} className="flex items-center gap-2 text-sm border rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-muted/40">
                    <input type="checkbox" checked={form.modules.includes(m.id)} onChange={() => toggleModule(m.id)} className="accent-teal-600" />
                    {m.name}
                  </label>
                ))}
              </div>
            </FormField>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm"><Save className="h-4 w-4" /> {editingId ? 'Save Changes' : 'Add Company'}</Button>
              {editingId && <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>}
            </div>
          </form>
        </Card>
<Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium">Entity Register</p>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Currency</TableHead><TableHead>Country</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {entities.map(e => (
                <TableRow key={e.id} className={e.id === activeEntityId ? 'bg-teal-50/60' : ''}>
                  <TableCell className="font-medium">{e.name}{e.id === activeEntityId && <Badge variant="secondary" className="ml-2">Working in</Badge>}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{e.code}</TableCell>
                  <TableCell>{e.currencyCode || e.functionalCurrency}</TableCell>
                  <TableCell>{e.country}</TableCell>
                  <TableCell><Badge variant={e.active ? 'secondary' : 'outline'}>{e.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {e.id !== activeEntityId && (
                        <Button variant="outline" size="sm" onClick={() => setActiveEntityId(e.id)} title="Switch working company and its currency">Use</Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => startEdit(e)} title="Edit company"><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleCompanyStatus(e.id, !e.active)}>
                        {e.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {entities.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No companies configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

export function BranchesView() {
  const { branches, fetchBranches, createBranch, setBranchStatus, deleteBranch } = useAdministrationStore();
  const [form, setForm] = useState({ name: '', code: '', city: '', address: '', active: true });

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBranch(form);
    setForm({ name: '', code: '', city: '', address: '', active: true });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Branches" description="Physical locations and operating units" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={GitBranch} label="Branches" value={branches.length} tone="teal" />
        <StatCard icon={CheckCircle2} label="Active" value={branches.filter(b => b.active).length} tone="green" />
        <StatCard icon={Building2} label="Cities" value={new Set(branches.map(b => b.city)).size} tone="blue" />
        <StatCard icon={Globe} label="Coverage" value={branches.length ? 'Multi-location' : 'None'} tone="violet" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Add Branch</p>
          <form onSubmit={save} className="space-y-3">
            <FormField label="Branch Name" required><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Peshawar Branch" /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Code"><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="PSH" /></FormField>
              <FormField label="City"><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Peshawar" /></FormField>
            </div>
            <FormField label="Address"><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address" /></FormField>
            <Button type="submit" size="sm"><Save className="h-4 w-4" /> Add Branch</Button>
          </form>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium">Branch Register</p>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>City</TableHead><TableHead>Address</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {branches.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{b.code}</TableCell>
                  <TableCell>{b.city}</TableCell>
                  <TableCell className="text-muted-foreground">{b.address}</TableCell>
                  <TableCell><button onClick={() => setBranchStatus(b.id, !b.active)}><Badge variant={b.active ? 'secondary' : 'outline'}>{b.active ? 'Active' : 'Inactive'}</Badge></button></TableCell>
                  <TableCell><Button variant="ghost" size="icon" title="Delete" onClick={() => deleteBranch(b.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                </TableRow>
              ))}
              {branches.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No branches configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

// ── Approval Workflows ────────────────────────────────────────────────────────
export function ApprovalWorkflowsView() {
  const { workflows, fetchWorkflows, createWorkflow, setWorkflowStatus, deleteWorkflow } = useAdministrationStore();
  const [form, setForm] = useState({ name: '', module: 'Sales', approverRole: 'Manager', steps: 1, active: true });

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await createWorkflow(form);
    setForm({ name: '', module: 'Sales', approverRole: 'Manager', steps: 1, active: true });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Approval Workflows" description="Multi-step approval routing for business documents" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Workflows" value={workflows.length} tone="teal" />
        <StatCard icon={GitBranch} label="Active" value={workflows.filter(f => f.active).length} tone="green" />
        <StatCard icon={ShieldCheck} label="Total Steps" value={workflows.reduce((s, f) => s + f.steps, 0)} tone="blue" />
        <StatCard icon={KeyRound} label="Approver Roles" value={new Set(workflows.map(f => f.approverRole)).size} tone="violet" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> New Workflow</p>
          <form onSubmit={save} className="space-y-3">
            <FormField label="Workflow Name" required><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Payment Approval" /></FormField>
            <FormField label="Module">
              <Select value={form.module} onValueChange={v => setForm({ ...form, module: v || 'Sales' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Sales">Sales</SelectItem><SelectItem value="Procurement">Procurement</SelectItem><SelectItem value="Payroll">Payroll</SelectItem><SelectItem value="Banking">Banking</SelectItem><SelectItem value="Projects">Projects</SelectItem><SelectItem value="Field Ops">Field Ops</SelectItem></SelectContent>
              </Select>
            </FormField>
            <FormField label="Approver Role">
              <Select value={form.approverRole} onValueChange={v => setForm({ ...form, approverRole: v || 'Manager' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Manager">Manager</SelectItem><SelectItem value="Senior Accountant">Senior Accountant</SelectItem><SelectItem value="Finance admin">Finance admin</SelectItem><SelectItem value="CFO">CFO</SelectItem></SelectContent>
              </Select>
            </FormField>
            <FormField label="Approval Steps"><Input type="number" min={1} value={form.steps} onChange={e => setForm({ ...form, steps: Number(e.target.value) || 1 })} /></FormField>
            <Button type="submit" size="sm"><Save className="h-4 w-4" /> Create Workflow</Button>
          </form>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium">Active Workflows</p>
          <div className="space-y-2">
            {workflows.map(f => (
              <div key={f.id} className="flex items-center justify-between border rounded-lg p-3">
                <div><p className="font-medium text-sm">{f.name}</p><p className="text-xs text-muted-foreground">{f.module} · {f.approverRole} · {f.steps} step{f.steps > 1 ? 's' : ''}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWorkflowStatus(f.id, !f.active)}><Badge variant={f.active ? 'secondary' : 'outline'}>{f.active ? 'Active' : 'Paused'}</Badge></button>
                  <Button variant="ghost" size="icon" onClick={() => deleteWorkflow(f.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
            {workflows.length === 0 && <p className="text-sm text-muted-foreground">No workflows defined.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Number Series ─────────────────────────────────────────────────────────────
export function NumberSeriesView() {
  const { numberSeries, fetchNumberSeries, createNumberSeries, setNumberSeriesStatus, deleteNumberSeries } = useAdministrationStore();
  const [form, setForm] = useState({ name: '', prefix: '', nextNumber: 1, format: '', active: true });

  useEffect(() => { fetchNumberSeries(); }, [fetchNumberSeries]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const format = `${form.prefix}${String(form.nextNumber).padStart(4, '0')}`;
    await createNumberSeries({ ...form, format });
    setForm({ name: '', prefix: '', nextNumber: 1, format: '', active: true });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Number Series" description="Automatic document numbering for transactions" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Hash} label="Series Defined" value={numberSeries.length} tone="teal" />
        <StatCard icon={CheckCircle2} label="Active" value={numberSeries.filter(s => s.active).length} tone="green" />
        <StatCard icon={ScrollText} label="Next Numbers" value={numberSeries.reduce((s, x) => s + x.nextNumber, 0)} tone="blue" />
        <StatCard icon={KeyRound} label="Prefixes" value={new Set(numberSeries.map(s => s.prefix)).size} tone="violet" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> New Series</p>
          <form onSubmit={save} className="space-y-3">
            <FormField label="Series Name" required><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Credit Note" /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Prefix"><Input value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })} placeholder="CN-" /></FormField>
              <FormField label="Next Number"><Input type="number" min={1} value={form.nextNumber} onChange={e => setForm({ ...form, nextNumber: Number(e.target.value) || 1 })} /></FormField>
            </div>
            <div className="border rounded-lg px-3 py-2 text-xs text-muted-foreground">Preview: <span className="font-mono text-foreground">{form.prefix}{String(form.nextNumber).padStart(4, '0')}</span></div>
            <Button type="submit" size="sm"><Save className="h-4 w-4" /> Add Series</Button>
          </form>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium">Number Series Register</p>
          <Table>
            <TableHeader><TableRow><TableHead>Series</TableHead><TableHead>Prefix</TableHead><TableHead>Next Number</TableHead><TableHead>Sample</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {numberSeries.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{s.prefix}</TableCell>
                  <TableCell className="font-mono">{s.nextNumber}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{s.format}</TableCell>
                  <TableCell><button onClick={() => setNumberSeriesStatus(s.id, !s.active)}><Badge variant={s.active ? 'secondary' : 'outline'}>{s.active ? 'Active' : 'Inactive'}</Badge></button></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => deleteNumberSeries(s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                </TableRow>
              ))}
              {numberSeries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No number series defined</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

// ── Currency ──────────────────────────────────────────────────────────────────
export function CurrencyView() {
  const { currencies, fetchCurrencies, createCurrency, setCurrencyStatus, deleteCurrency } = useAdministrationStore();
  const [form, setForm] = useState({ code: '', name: '', symbol: '', rate: 1, active: true });

  useEffect(() => { fetchCurrencies(); }, [fetchCurrencies]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCurrency({ ...form, base: false });
    setForm({ code: '', name: '', symbol: '', rate: 1, active: true });
  };

  const base = currencies.find(c => c.base);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Currency" description="Multi-currency support with base currency conversion" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Coins} label="Currencies" value={currencies.length} tone="teal" />
        <StatCard icon={Globe} label="Enabled" value={currencies.filter(c => c.active).length} tone="green" />
        <StatCard icon={Building2} label="Base Currency" value={base?.code || '—'} tone="blue" />
        <StatCard icon={KeyRound} label="Codes" value={new Set(currencies.map(c => c.code)).size} tone="violet" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Add Currency</p>
          <form onSubmit={save} className="space-y-3">
            <FormField label="Currency Code" required><Input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="JPY" /></FormField>
            <FormField label="Name"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Japanese Yen" /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Symbol"><Input value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="¥" /></FormField>
              <FormField label={`Rate vs ${base?.code || 'USD'}`}><Input type="number" step="0.0001" min="0.0001" value={form.rate} onChange={e => setForm({ ...form, rate: Number(e.target.value) || 1 })} /></FormField>
            </div>
            <Button type="submit" size="sm"><Save className="h-4 w-4" /> Add Currency</Button>
          </form>
        </Card>
        <Card className="p-4 col-span-2 space-y-3">
          <p className="text-sm font-medium">Exchange Rates</p>
          <Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Symbol</TableHead><TableHead>Rate</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {currencies.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium flex items-center gap-2">{c.code} {c.base && <Badge>Base</Badge>}</TableCell>
                  <TableCell className="text-muted-foreground">{c.name}</TableCell>
                  <TableCell>{c.symbol}</TableCell>
                  <TableCell className="font-mono">{c.rate}</TableCell>
                  <TableCell><button onClick={() => setCurrencyStatus(c.id, !c.active)}><Badge variant={c.active ? 'secondary' : 'outline'}>{c.active ? 'Active' : 'Inactive'}</Badge></button></TableCell>
                  <TableCell>{!c.base && <Button variant="ghost" size="icon" onClick={() => deleteCurrency(c.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}</TableCell>
                </TableRow>
              ))}
              {currencies.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No currencies configured</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
export function AuditLogsView({ activeEntityId }: { activeEntityId?: string }) {
  const [items, setItems] = useState<AuditTrailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(200);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit };
      if (activeEntityId) params.companyId = activeEntityId;
      const data = await accountingApi.getAuditTrail(params);
      setItems(data || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [activeEntityId, limit]);

  const filtered = items.filter(i => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return i.entityName.toLowerCase().includes(q) || i.detail.toLowerCase().includes(q) || i.action.toLowerCase().includes(q);
  });

  const formatTime = (at: string) => new Date(at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Audit Logs" description="Immutable event trail across all ERP modules" />
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={ScrollText} label="Events" value={items.length} tone="teal" />
        <StatCard icon={Hash} label="Actions Logged" value={new Set(items.map(i => i.action)).size} tone="blue" />
        <StatCard icon={Building2} label="Entities Tracked" value={new Set(items.map(i => i.entity)).size} tone="violet" />
        <StatCard icon={CheckCircle2} label="Integrity" value="Immutable" tone="green" />
      </div>
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2"><ScrollText className="h-4 w-4" /> Event Stream</p>
          <div className="flex items-center gap-2">
            <div className="relative w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9 h-9 text-xs" placeholder="Search events..." value={query} onChange={e => setQuery(e.target.value)} /></div>
            <Select value={String(limit)} onValueChange={v => setLimit(Number(v) || 200)}>
              <SelectTrigger className="w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="100">100</SelectItem><SelectItem value="200">200</SelectItem><SelectItem value="500">500</SelectItem><SelectItem value="1000">1000</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Action</TableHead><TableHead>Entity</TableHead><TableHead>Detail</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Loading audit events...</TableCell></TableRow>}
            {!loading && filtered.map((i, idx) => (
              <TableRow key={idx}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatTime(i.at)}</TableCell>
                <TableCell><Badge variant="outline">{i.action}</Badge></TableCell>
                <TableCell className="font-medium">{i.entityName}</TableCell>
                <TableCell className="text-muted-foreground max-w-md truncate">{i.detail}</TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No audit events found</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}