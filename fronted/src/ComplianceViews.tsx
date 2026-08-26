import { useState, useEffect, useMemo } from 'react';
import { useComplianceStore } from './stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { KpiCard, KpiGrid } from '@/components/ui/kpi-card';

import {
  Scale, Plus, TrendingUp, AlertTriangle, CheckCircle2, FileText, Send, ShieldCheck, ReceiptText, Landmark, Clock3, Wallet, Save, Building2, BadgeDollarSign
} from 'lucide-react';

import { money } from './lib/currency';
const today = () => new Date().toISOString().split('T')[0];

const JURISDICTIONS = ['UK', 'USA', 'PK', 'EU', 'UAE', 'SA', 'CA'];
const CERT_TYPES = ['Payment', 'Contract', 'Salary', 'Interest', 'Royalty'];

const COUNTRY_TO_JURISDICTION: Record<string, string> = {
  'united kingdom': 'UK',
  'uk': 'UK',
  'united states': 'USA',
  'us': 'USA',
  'usa': 'USA',
  'pakistan': 'PK',
  'pk': 'PK',
  'european union': 'EU',
  'eu': 'EU',
  'united arab emirates': 'UAE',
  'ae': 'UAE',
  'saudi arabia': 'SA',
  'sa': 'SA',
  'canada': 'CA',
  'ca': 'CA',
};

type ComplianceEntity = { id: string; country?: string };

function getJurisdictionForEntity(entity?: ComplianceEntity): string | null {
  if (!entity?.country) return null;
  return COUNTRY_TO_JURISDICTION[entity.country.toLowerCase()] || null;
}

const obligationBadge = (s: string) =>
  s === 'Paid' ? 'secondary' : s === 'Filed' ? 'outline' : s === 'Overdue' ? 'destructive' : 'default';

const einvoiceBadge = (s: string) =>
  s === 'Validated' ? 'secondary' : s === 'Submitted' ? 'default' : s === 'Rejected' ? 'destructive' : 'outline';

const EMPTY_OBLIGATION = { jurisdictionId: 'UK', obligationType: 'VAT', periodStart: today(), periodEnd: today(), dueDate: today(), amountDue: 0, notes: '' };
const EMPTY_CERT = { certificateType: 'Payment', counterpartyName: '', taxId: '', ratePercent: 5, grossAmount: 0, periodStart: today(), periodEnd: today(), status: 'Issued' };
const EMPTY_EINVOICE = { invoiceType: 'Sales', counterpartyName: '', counterpartyTaxId: '', issueDate: today(), reference: '', grossAmount: 0, taxAmount: 0, uuid: '' };

function useComplianceData() {
  const store = useComplianceStore();
  useEffect(() => { store.fetchAll(); }, []);
  return store;
}

// ── Summary (module overview) ─────────────────────────────────────────────────
export function ComplianceSummaryView() {
  const { dashboard, obligations, withholding, eInvoices } = useComplianceData();
  const totalDue = obligations.filter(o => o.status === 'Due' || o.status === 'Overdue').reduce((s, o) => s + (o.amountDue - o.amountPaid), 0);
  const totalWithheld = withholding.reduce((s, c) => s + c.withheldAmount, 0);
  const validated = eInvoices.filter(e => e.status === 'Validated').length;
  const rejected = eInvoices.filter(e => e.status === 'Rejected').length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Government Compliance" description="Tax management, VAT / sales tax, withholding, returns, and e-invoicing across jurisdictions" />
      <KpiGrid cols={4}>
        <KpiCard icon={AlertTriangle} label="Obligations Due" value={dashboard?.due ?? 0} desc="Require attention" tone="amber" />
        <KpiCard icon={Scale} label="Total Tax Due" value={money(totalDue)} desc="Outstanding amount" tone="rose" />
        <KpiCard icon={ShieldCheck} label="Validated E-Invoices" value={validated} desc="Successfully validated" tone="teal" />
        <KpiCard icon={Wallet} label="Total Withheld" value={money(totalWithheld)} desc="Withholding tax total" tone="blue" />
      </KpiGrid>
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Clock3 className="h-4 w-4" /> Upcoming Filing Deadlines</p>
          <div className="space-y-2">
            {(dashboard?.upcoming || []).map(u => (
              <div key={u.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                <div>
                  <p className="font-medium">{u.obligationNumber} · {u.obligationType}</p>
                  <p className="text-xs text-muted-foreground">{u.jurisdictionId} · due {u.dueDate}</p>
                </div>
                <div className="text-right"><p className="font-mono font-medium">{money(u.amountDue)}</p><Badge variant="outline">Due</Badge></div>
              </div>
            ))}
            {(dashboard?.upcoming || []).length === 0 && <p className="text-sm text-muted-foreground">No upcoming deadlines</p>}
          </div>
        </Card>
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Filing Activity</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{validated}</p><p className="text-[10px] text-muted-foreground">Validated Invoices</p></div>
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{rejected}</p><p className="text-[10px] text-muted-foreground">Rejected Invoices</p></div>
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{dashboard?.overdue ?? 0}</p><p className="text-[10px] text-muted-foreground">Overdue Obligations</p></div>
            <div className="border rounded-lg p-2.5 text-center"><p className="text-base font-bold">{dashboard?.pendingInvoices ?? 0}</p><p className="text-[10px] text-muted-foreground">Submitted Invoices</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Tax Management ────────────────────────────────────────────────────────────
export function TaxManagementView({ activeEntityId, entities }: { activeEntityId?: string; entities?: any[] }) {
  const { obligations } = useComplianceData();
  const activeEntity = entities?.find(e => e.id === activeEntityId);
  const jurisdiction = getJurisdictionForEntity(activeEntity as ComplianceEntity);
  const filteredObligations = useMemo(
    () => obligations.filter(o => !jurisdiction || o.jurisdictionId === jurisdiction),
    [obligations, jurisdiction]
  );
  const totalDue = filteredObligations.filter(o => o.status === 'Due' || o.status === 'Overdue').reduce((s, o) => s + (o.amountDue - o.amountPaid), 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Tax Management" description={`Monitor tax obligations and liability${jurisdiction ? ` for ${jurisdiction}` : ' across jurisdictions'}`} />
      <KpiGrid cols={4}>
        <KpiCard icon={Landmark} label="Jurisdictions" value={jurisdiction ? 1 : JURISDICTIONS.length} desc="Active regions" tone="teal" />
        <KpiCard icon={Scale} label="Total Obligations" value={filteredObligations.length} desc="Across jurisdictions" tone="blue" />
        <KpiCard icon={AlertTriangle} label="Due / Overdue" value={filteredObligations.filter(o => o.status === 'Due' || o.status === 'Overdue').length} desc="Require payment" tone="amber" />
        <KpiCard icon={Wallet} label="Amount Due" value={money(totalDue)} desc="Outstanding balance" tone="rose" />
      </KpiGrid>
      <div className="grid grid-cols-4 gap-4">
        {(jurisdiction ? [jurisdiction] : JURISDICTIONS).map(j => {
          const jOblig = filteredObligations.filter(o => o.jurisdictionId === j);
          const jDue = jOblig.filter(o => o.status === 'Due' || o.status === 'Overdue').reduce((s, o) => s + (o.amountDue - o.amountPaid), 0);
          const jFiled = jOblig.filter(o => o.status === 'Filed' || o.status === 'Paid').length;
          return (
            <Card key={j} className="hover:shadow-md transition-shadow p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{j}</p>
                <Badge variant="outline">{jOblig.length} obligations</Badge>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Total due</span><span className="font-mono font-medium">{money(jDue)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Filed / paid</span><span className="font-mono font-medium">{jFiled}</span></div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── VAT / Sales Tax ───────────────────────────────────────────────────────────
export function VatSalesTaxView({ activeEntityId, entities }: { activeEntityId?: string; entities?: any[] }) {
  const { obligations, createObligation, setObligationStatus } = useComplianceData();
  const activeEntity = entities?.find(e => e.id === activeEntityId);
  const jurisdiction = getJurisdictionForEntity(activeEntity as ComplianceEntity);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_OBLIGATION, jurisdictionId: jurisdiction || 'UK' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState(jurisdiction || '');
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const vatObligations = useMemo(
    () => obligations.filter(o => (o.obligationType === 'VAT' || o.obligationType === 'Sales Tax') && (!jurisdiction || o.jurisdictionId === jurisdiction)),
    [obligations, jurisdiction]
  );
  const filtered = useMemo(() => {
    return vatObligations.filter(o => !filter || o.jurisdictionId === filter);
  }, [vatObligations, filter]);
  const due = vatObligations.filter(o => o.status === 'Due' || o.status === 'Overdue').reduce((s, o) => s + (o.amountDue - o.amountPaid), 0);

  const save = async () => {
    setSaving(true);
    try {
      await createObligation({
        jurisdictionId: form.jurisdictionId, obligationType: form.obligationType,
        periodStart: form.periodStart, periodEnd: form.periodEnd, dueDate: form.dueDate,
        amountDue: Number(form.amountDue) || 0, notes: form.notes || null, companyId: activeEntityId || null,
      });
      setForm({ ...EMPTY_OBLIGATION, jurisdictionId: jurisdiction || 'UK' });
      setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="VAT / Sales Tax" description={`Manage value-added and sales tax obligations${jurisdiction ? ` for ${jurisdiction}` : ''}`} actions={<Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" /> New Obligation</Button>} />
      <KpiGrid cols={4}>
        <KpiCard icon={Scale} label="VAT / Sales Obligations" value={vatObligations.length} desc="Total obligations" tone="blue" />
        <KpiCard icon={Wallet} label="Amount Due" value={money(due)} desc="Outstanding balance" tone="amber" />
        <KpiCard icon={CheckCircle2} label="Paid" value={vatObligations.filter(o => o.status === 'Paid').length} desc="Completed payments" tone="emerald" />
        <KpiCard icon={AlertTriangle} label="Overdue" value={vatObligations.filter(o => o.status === 'Overdue').length} desc="Past due date" tone="rose" />
      </KpiGrid>
      {showForm && (
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-2"><FormField label="Jurisdiction"><Select value={form.jurisdictionId} onValueChange={v => v !== null && setF('jurisdictionId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(jurisdiction ? [jurisdiction] : JURISDICTIONS).map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Type"><Select value={form.obligationType} onValueChange={v => v !== null && setF('obligationType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="VAT">VAT</SelectItem><SelectItem value="Sales Tax">Sales Tax</SelectItem></SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Period Start"><Input type="date" value={form.periodStart} onChange={e => setF('periodStart', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Period End"><Input type="date" value={form.periodEnd} onChange={e => setF('periodEnd', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Due Date"><Input type="date" value={form.dueDate} onChange={e => setF('dueDate', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Amount"><Input type="number" value={form.amountDue} onChange={e => setF('amountDue', e.target.value)} /></FormField></div>
            <div className="col-span-1"><Button onClick={save} disabled={saving}><Save className="mr-1.5 h-4 w-4" />Save</Button></div>
          </div>
        </Card>
      )}
      <div className="flex gap-3 items-center">
        {!jurisdiction && (
          <Select value={filter} onValueChange={v => v !== null && setFilter(v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Jurisdictions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Jurisdictions</SelectItem>
              {JURISDICTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
            </SelectContent>
          </Select>
        )}</div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Obligation</th>
              <th className="text-left p-3 font-medium">Jurisdiction</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Period</th>
              <th className="text-right p-3 font-medium">Due Date</th>
              <th className="text-right p-3 font-medium">Amount Due</th>
              <th className="text-right p-3 font-medium">Paid</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-medium">{o.obligationNumber}</td>
                <td className="p-3"><Badge variant="outline">{o.jurisdictionId}</Badge></td>
                <td className="p-3">{o.obligationType}</td>
                <td className="p-3 text-muted-foreground">{o.periodStart} → {o.periodEnd}</td>
                <td className="p-3 text-right">{o.dueDate}</td>
                <td className="p-3 text-right font-mono">{money(o.amountDue)}</td>
                <td className="p-3 text-right font-mono">{money(o.amountPaid)}</td>
                <td className="p-3 text-center"><Badge variant={obligationBadge(o.status) as any}>{o.status}</Badge></td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {o.status === 'Due' && <Button size="sm" variant="ghost" onClick={() => setObligationStatus(o.id, 'Filed')}>Mark Filed</Button>}
                    {o.status === 'Filed' && <Button size="sm" variant="ghost" onClick={() => setObligationStatus(o.id, 'Paid')}>Mark Paid</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No VAT / sales tax obligations found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Withholding Tax ───────────────────────────────────────────────────────────
export function WithholdingTaxView({ activeEntityId }: { activeEntityId?: string }) {
  const { withholding, createWithholding } = useComplianceData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_CERT });
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const totalWithheld = withholding.reduce((s, c) => s + c.withheldAmount, 0);

  const save = async () => {
    setSaving(true);
    try {
      await createWithholding({
        certificateType: form.certificateType, counterpartyName: form.counterpartyName, taxId: form.taxId,
        ratePercent: Number(form.ratePercent) || 0, grossAmount: Number(form.grossAmount) || 0,
        periodStart: form.periodStart, periodEnd: form.periodEnd, status: form.status, companyId: activeEntityId || null,
      });
      setForm({ ...EMPTY_CERT });
      setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Withholding Tax" description="Issue and track withholding tax certificates" actions={<Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" /> Issue Certificate</Button>} />
      <KpiGrid cols={4}>
        <KpiCard icon={BadgeDollarSign} label="Certificates" value={withholding.length} desc="Total issued" tone="blue" />
        <KpiCard icon={Wallet} label="Total Withheld" value={money(totalWithheld)} desc="Withholding tax total" tone="amber" />
        <KpiCard icon={Scale} label="Avg Rate" value={`${withholding.length ? Math.round(withholding.reduce((s, c) => s + c.ratePercent, 0) / withholding.length) : 0}%`} desc="Average withholding" tone="purple" />
        <KpiCard icon={ShieldCheck} label="Issued" value={withholding.filter(c => c.status === 'Issued').length} desc="Active certificates" tone="emerald" />
      </KpiGrid>
      {showForm && (
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-2"><FormField label="Type"><Select value={form.certificateType} onValueChange={v => v !== null && setF('certificateType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CERT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Counterparty"><Input value={form.counterpartyName} onChange={e => setF('counterpartyName', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Tax ID"><Input value={form.taxId} onChange={e => setF('taxId', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Rate %"><Input type="number" value={form.ratePercent} onChange={e => setF('ratePercent', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Gross"><Input type="number" value={form.grossAmount} onChange={e => setF('grossAmount', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Period"><Input type="date" value={form.periodStart} onChange={e => setF('periodStart', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Status"><Select value={form.status} onValueChange={v => v !== null && setF('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Issued">Issued</SelectItem></SelectContent>
            </Select></FormField></div>
            <div className="col-span-1"><Button onClick={save} disabled={saving}><Save className="mr-1.5 h-4 w-4" />Issue</Button></div>
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Certificate</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Counterparty</th>
              <th className="text-left p-3 font-medium">Tax ID</th>
              <th className="text-right p-3 font-medium">Rate</th>
              <th className="text-right p-3 font-medium">Gross</th>
              <th className="text-right p-3 font-medium">Withheld</th>
              <th className="text-center p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {withholding.map(c => (
              <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-medium">{c.certificateNumber}</td>
                <td className="p-3">{c.certificateType}</td>
                <td className="p-3">{c.counterpartyName}</td>
                <td className="p-3 font-mono text-muted-foreground">{c.taxId || '—'}</td>
                <td className="p-3 text-right font-mono">{c.ratePercent}%</td>
                <td className="p-3 text-right font-mono">{money(c.grossAmount)}</td>
                <td className="p-3 text-right font-mono font-semibold">{money(c.withheldAmount)}</td>
                <td className="p-3 text-center"><Badge variant={c.status === 'Issued' ? 'secondary' : 'outline'}>{c.status}</Badge></td>
              </tr>
            ))}
            {withholding.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No withholding certificates</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Tax Returns ───────────────────────────────────────────────────────────────
export function TaxReturnsView({ activeEntityId, entities }: { activeEntityId?: string; entities?: any[] }) {
  const { returns, fileReturn } = useComplianceData();
  const activeEntity = entities?.find(e => e.id === activeEntityId);
  const jurisdiction = getJurisdictionForEntity(activeEntity as ComplianceEntity);
  const filteredReturns = useMemo(
    () => returns.filter(r => !jurisdiction || r.jurisdictionId === jurisdiction),
    [returns, jurisdiction]
  );
  const [filter, setFilter] = useState(jurisdiction || '');
  const displayReturns = useMemo(() => {
    return filteredReturns.filter(r => !filter || r.jurisdictionId === filter);
  }, [filteredReturns, filter]);
  const totalNet = filteredReturns.reduce((s, r) => s + r.netTax, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Tax Returns" description={`Prepare and file tax returns${jurisdiction ? ` for ${jurisdiction}` : ''}`} />
      <KpiGrid cols={4}>
        <KpiCard icon={FileText} label="Total Returns" value={filteredReturns.length} desc="Across jurisdictions" tone="blue" />
        <KpiCard icon={CheckCircle2} label="Filed" value={filteredReturns.filter(r => r.status === 'Filed').length} desc="Successfully filed" tone="emerald" />
        <KpiCard icon={Clock3} label="Draft" value={filteredReturns.filter(r => r.status === 'Draft').length} desc="Pending submission" tone="amber" />
        <KpiCard icon={Wallet} label="Net Tax" value={money(totalNet)} desc="Total net tax liability" tone="purple" />
      </KpiGrid>
      {!jurisdiction && (
        <div className="flex gap-3 items-center">
          <Select value={filter} onValueChange={v => v !== null && setFilter(v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Jurisdictions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Jurisdictions</SelectItem>
              {JURISDICTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Return</th>
              <th className="text-left p-3 font-medium">Jurisdiction</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Period</th>
              <th className="text-right p-3 font-medium">Output Tax</th>
              <th className="text-right p-3 font-medium">Input Tax</th>
              <th className="text-right p-3 font-medium">Net Tax</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayReturns.map(r => (
              <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-medium">{r.returnNumber}</td>
                <td className="p-3"><Badge variant="outline">{r.jurisdictionId}</Badge></td>
                <td className="p-3">{r.returnType}</td>
                <td className="p-3 text-muted-foreground">{r.periodStart} → {r.periodEnd}</td>
                <td className="p-3 text-right font-mono">{money(r.outputTax)}</td>
                <td className="p-3 text-right font-mono">{money(r.inputTax)}</td>
                <td className="p-3 text-right font-mono font-semibold">{money(r.netTax)}</td>
                <td className="p-3 text-center"><Badge variant={r.status === 'Filed' ? 'secondary' : 'default'}>{r.status}</Badge></td>
                <td className="p-3 text-right">
                  {r.status === 'Draft' && <Button size="sm" variant="ghost" onClick={() => fileReturn(r.id)}><Send className="mr-1 h-3.5 w-3.5" />File</Button>}
                </td>
              </tr>
            ))}
            {displayReturns.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No tax returns found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── E-Invoicing ───────────────────────────────────────────────────────────────
export function EInvoicingView({ activeEntityId }: { activeEntityId?: string }) {
  const { eInvoices, createEInvoice, setEInvoiceStatus } = useComplianceData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_EINVOICE);
  const [saving, setSaving] = useState(false);
  const setF = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const validated = eInvoices.filter(e => e.status === 'Validated').length;
  const rejected = eInvoices.filter(e => e.status === 'Rejected').length;
  const total = eInvoices.reduce((s, e) => s + e.totalAmount, 0);

  const save = async () => {
    setSaving(true);
    try {
      await createEInvoice({
        invoiceType: form.invoiceType, counterpartyName: form.counterpartyName,
        counterpartyTaxId: form.counterpartyTaxId || null, issueDate: form.issueDate,
        reference: form.reference || null, grossAmount: Number(form.grossAmount) || 0,
        taxAmount: Number(form.taxAmount) || 0, uuid: form.uuid || null, companyId: activeEntityId || null,
      });
      setForm(EMPTY_EINVOICE);
      setShowForm(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="E-Invoicing" description="Submit and validate electronic invoices" actions={<Button onClick={() => setShowForm(v => !v)}><Plus className="mr-2 h-4 w-4" /> Create E-Invoice</Button>} />
      <KpiGrid cols={4}>
        <KpiCard icon={ReceiptText} label="Total Invoices" value={eInvoices.length} desc="All e-invoices" tone="blue" />
        <KpiCard icon={ShieldCheck} label="Validated" value={validated} desc="Successfully validated" tone="emerald" />
        <KpiCard icon={AlertTriangle} label="Rejected" value={rejected} desc="Need attention" tone="rose" />
        <KpiCard icon={Wallet} label="Total Amount" value={money(total)} desc="Combined invoice value" tone="amber" />
      </KpiGrid>
      {showForm && (
        <Card className="p-4">
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-2"><FormField label="Type"><Select value={form.invoiceType} onValueChange={v => v !== null && setF('invoiceType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Sales">Sales</SelectItem><SelectItem value="Purchase">Purchase</SelectItem></SelectContent>
            </Select></FormField></div>
            <div className="col-span-2"><FormField label="Counterparty"><Input value={form.counterpartyName} onChange={e => setF('counterpartyName', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Counterparty Tax ID"><Input value={form.counterpartyTaxId} onChange={e => setF('counterpartyTaxId', e.target.value)} /></FormField></div>
            <div className="col-span-2"><FormField label="Issue Date"><Input type="date" value={form.issueDate} onChange={e => setF('issueDate', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Gross"><Input type="number" value={form.grossAmount} onChange={e => setF('grossAmount', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Tax"><Input type="number" value={form.taxAmount} onChange={e => setF('taxAmount', e.target.value)} /></FormField></div>
            <div className="col-span-1"><FormField label="Reference"><Input value={form.reference} onChange={e => setF('reference', e.target.value)} /></FormField></div>
            <div className="col-span-1"><Button onClick={save} disabled={saving}><Save className="mr-1.5 h-4 w-4" />Create</Button></div>
          </div>
        </Card>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium">Invoice</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Counterparty</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-right p-3 font-medium">Gross</th>
              <th className="text-right p-3 font-medium">Tax</th>
              <th className="text-right p-3 font-medium">Total</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {eInvoices.map(e => (
              <tr key={e.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-mono font-medium">{e.invoiceNumber}</td>
                <td className="p-3">{e.invoiceType}</td>
                <td className="p-3">{e.counterpartyName}</td>
                <td className="p-3">{e.issueDate}</td>
                <td className="p-3 text-right font-mono">{money(e.grossAmount)}</td>
                <td className="p-3 text-right font-mono">{money(e.taxAmount)}</td>
                <td className="p-3 text-right font-mono font-semibold">{money(e.totalAmount)}</td>
                <td className="p-3 text-center"><Badge variant={einvoiceBadge(e.status) as any}>{e.status}</Badge></td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {e.status === 'Draft' && <Button size="sm" variant="ghost" onClick={() => setEInvoiceStatus(e.id, 'Submitted')}>Submit</Button>}
                    {e.status === 'Submitted' && <Button size="sm" variant="ghost" onClick={() => setEInvoiceStatus(e.id, 'Validated')}><CheckCircle2 className="mr-1 h-3.5 w-3.5" />Validate</Button>}
                  </div>
                </td>
              </tr>
            ))}
            {eInvoices.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No e-invoices found</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Compliance Reports ────────────────────────────────────────────────────────
export function ComplianceReportsView({ activeEntityId, entities }: { activeEntityId?: string; entities?: any[] }) {
  const { dashboard, obligations, returns, withholding, eInvoices } = useComplianceData();
  const activeEntity = entities?.find(e => e.id === activeEntityId);
  const jurisdiction = getJurisdictionForEntity(activeEntity as ComplianceEntity);
  const filteredObligations = useMemo(
    () => obligations.filter(o => !jurisdiction || o.jurisdictionId === jurisdiction),
    [obligations, jurisdiction]
  );
  const filteredReturns = useMemo(
    () => returns.filter(r => !jurisdiction || r.jurisdictionId === jurisdiction),
    [returns, jurisdiction]
  );
  const totalDue = filteredObligations.filter(o => o.status === 'Due' || o.status === 'Overdue').reduce((s, o) => s + (o.amountDue - o.amountPaid), 0);
  const totalWithheld = withholding.reduce((s, c) => s + c.withheldAmount, 0);
  const validated = eInvoices.filter(e => e.status === 'Validated').length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader title="Compliance Reports" description={`Compliance posture and reporting${jurisdiction ? ` for ${jurisdiction}` : ' across jurisdictions'}`} />
      <KpiGrid cols={4}>
        <KpiCard icon={Scale} label="Total Tax Due" value={money(totalDue)} desc="Outstanding balance" tone="rose" />
        <KpiCard icon={Wallet} label="Total Withheld" value={money(totalWithheld)} desc="Withholding tax total" tone="blue" />
        <KpiCard icon={ShieldCheck} label="Validated E-Invoices" value={validated} desc="Successfully validated" tone="teal" />
        <KpiCard icon={Building2} label="Jurisdictions Active" value={jurisdiction ? 1 : JURISDICTIONS.filter(j => obligations.some(o => o.jurisdictionId === j)).length} desc="Operating regions" tone="purple" />
      </KpiGrid>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><FileText className="h-4 w-4" /> Obligation Status Breakdown</p>
          <div className="space-y-2">
            {[
              { label: 'Due', value: filteredObligations.filter(o => o.status === 'Due').length, tone: 'amber' },
              { label: 'Overdue', value: filteredObligations.filter(o => o.status === 'Overdue').length, tone: 'red' },
              { label: 'Filed', value: filteredObligations.filter(o => o.status === 'Filed').length, tone: 'blue' },
              { label: 'Paid', value: filteredObligations.filter(o => o.status === 'Paid').length, tone: 'green' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">{r.label}</span>
                <Badge variant={(r.tone === 'red' ? 'destructive' : r.tone === 'green' ? 'secondary' : 'outline') as any}>{r.value}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Filing Performance</p>
          <div className="space-y-2">
            {[
              { label: 'Returns Filed', value: filteredReturns.filter(r => r.status === 'Filed').length },
              { label: 'Returns Draft', value: filteredReturns.filter(r => r.status === 'Draft').length },
              { label: 'E-Invoices Submitted', value: dashboard?.pendingInvoices ?? 0 },
              { label: 'E-Invoices Validated', value: validated },
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
