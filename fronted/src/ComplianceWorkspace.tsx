import { useState, useEffect, useMemo } from 'react';
import { useComplianceStore } from './stores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { FormField } from '@/components/ui/form-field';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Scale, Plus, TrendingUp, AlertTriangle, CheckCircle2, FileText, Send, ShieldCheck, ReceiptText, Landmark, Clock3, Wallet, Save
} from 'lucide-react';

const money = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v || 0);
const today = () => new Date().toISOString().split('T')[0];

const JURISDICTIONS = ['UK', 'USA', 'PK', 'EU', 'UAE', 'SA', 'CA'];
const OBLIGATION_TYPES = ['VAT', 'Sales Tax', 'Withholding Tax', 'Corporate Tax', 'Income Tax', 'Property Tax'];
const CERT_TYPES = ['Payment', 'Contract', 'Salary', 'Interest', 'Royalty'];

const obligationBadge = (s: string) =>
  s === 'Paid' ? 'secondary' : s === 'Filed' ? 'outline' : s === 'Overdue' ? 'destructive' : 'default';

const einvoiceBadge = (s: string) =>
  s === 'Validated' ? 'secondary' : s === 'Submitted' ? 'default' : s === 'Rejected' ? 'destructive' : 'outline';

const EMPTY_OBLIGATION = { jurisdictionId: 'UK', obligationType: 'VAT', periodStart: today(), periodEnd: today(), dueDate: today(), amountDue: 0, notes: '' };
const EMPTY_CERT = { certificateType: 'Payment', counterpartyName: '', taxId: '', ratePercent: 5, grossAmount: 0, periodStart: today(), periodEnd: today(), status: 'Issued' };
const EMPTY_EINVOICE = { invoiceType: 'Sales', counterpartyName: '', counterpartyTaxId: '', issueDate: today(), reference: '', grossAmount: 0, taxAmount: 0, uuid: '' };

export default function ComplianceWorkspace({ activeEntityId }: { activeEntityId?: string }) {
  const { dashboard, obligations, returns, withholding, eInvoices, fetchAll, createObligation, setObligationStatus, fileReturn, createWithholding, createEInvoice, setEInvoiceStatus } = useComplianceStore();
  const [tab, setTab] = useState('overview');
  const [showObligation, setShowObligation] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [showEInvoice, setShowEInvoice] = useState(false);
  const [obligationForm, setObligationForm] = useState(EMPTY_OBLIGATION);
  const [certForm, setCertForm] = useState(EMPTY_CERT);
  const [einvoiceForm, setEInvoiceForm] = useState(EMPTY_EINVOICE);
  const [jurisdictionFilter, setJurisdictionFilter] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const setObl = (k: string, v: any) => setObligationForm(f => ({ ...f, [k]: v }));
  const setCert = (k: string, v: any) => setCertForm(f => ({ ...f, [k]: v }));
  const setEInv = (k: string, v: any) => setEInvoiceForm(f => ({ ...f, [k]: v }));

  const filteredObligations = obligations.filter(o => !jurisdictionFilter || o.jurisdictionId === jurisdictionFilter);
  const filteredReturns = returns.filter(r => !jurisdictionFilter || r.jurisdictionId === jurisdictionFilter);

  const totals = useMemo(() => {
    const totalDue = obligations.filter(o => o.status === 'Due' || o.status === 'Overdue').reduce((s, o) => s + (o.amountDue - o.amountPaid), 0);
    const totalWithheld = withholding.reduce((s, c) => s + c.withheldAmount, 0);
    const validated = eInvoices.filter(e => e.status === 'Validated').length;
    const rejected = eInvoices.filter(e => e.status === 'Rejected').length;
    return { totalDue, totalWithheld, validated, rejected };
  }, [obligations, withholding, eInvoices]);

  const handleSaveObligation = async () => {
    setSaving(true);
    try {
      await createObligation({
        jurisdictionId: obligationForm.jurisdictionId, obligationType: obligationForm.obligationType,
        periodStart: obligationForm.periodStart, periodEnd: obligationForm.periodEnd, dueDate: obligationForm.dueDate,
        amountDue: Number(obligationForm.amountDue) || 0, notes: obligationForm.notes || null, companyId: activeEntityId || null,
      });
      setObligationForm(EMPTY_OBLIGATION);
      setShowObligation(false);
    } finally { setSaving(false); }
  };

  const handleSaveCert = async () => {
    setSaving(true);
    try {
      await createWithholding({
        certificateType: certForm.certificateType, counterpartyName: certForm.counterpartyName, taxId: certForm.taxId,
        ratePercent: Number(certForm.ratePercent) || 0, grossAmount: Number(certForm.grossAmount) || 0,
        periodStart: certForm.periodStart, periodEnd: certForm.periodEnd, status: certForm.status, companyId: activeEntityId || null,
      });
      setCertForm(EMPTY_CERT);
      setShowCert(false);
    } finally { setSaving(false); }
  };

  const handleSaveEInvoice = async () => {
    setSaving(true);
    try {
      await createEInvoice({
        invoiceType: einvoiceForm.invoiceType, counterpartyName: einvoiceForm.counterpartyName,
        counterpartyTaxId: einvoiceForm.counterpartyTaxId || null, issueDate: einvoiceForm.issueDate,
        reference: einvoiceForm.reference || null, grossAmount: Number(einvoiceForm.grossAmount) || 0,
        taxAmount: Number(einvoiceForm.taxAmount) || 0, uuid: einvoiceForm.uuid || null, companyId: activeEntityId || null,
      });
      setEInvoiceForm(EMPTY_EINVOICE);
      setShowEInvoice(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Government Compliance"
        description="Tax management, VAT / sales tax, withholding, returns, and e-invoicing across jurisdictions"
        actions={<Button onClick={() => setShowObligation(true)}><Plus className="mr-2 h-4 w-4" /> New Obligation</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Obligations Due" value={dashboard?.due ?? 0} tone="amber" />
        <StatCard icon={Scale} label="Total Tax Due" value={money(totals.totalDue)} tone="red" />
        <StatCard icon={ShieldCheck} label="Validated E-Invoices" value={totals.validated} tone="teal" />
        <StatCard icon={Wallet} label="Total Withheld" value={money(totals.totalWithheld)} tone="blue" />
        <StatCard icon={CheckCircle2} label="Obligations Filed" value={dashboard?.filed ?? 0} tone="green" />
        <StatCard icon={FileText} label="Tax Returns" value={dashboard?.returns ?? 0} tone="violet" />
        <StatCard icon={Landmark} label="Total Obligations" value={dashboard?.obligations ?? 0} tone="cyan" />
        <StatCard icon={ReceiptText} label="E-Invoices" value={dashboard?.invoices ?? 0} tone="amber" />
      </div>

      <Tabs value={tab} onValueChange={v => v !== null && setTab(v)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tax-management">Tax Management</TabsTrigger>
          <TabsTrigger value="vat">VAT / Sales Tax</TabsTrigger>
          <TabsTrigger value="withholding">Withholding Tax</TabsTrigger>
          <TabsTrigger value="returns">Tax Returns</TabsTrigger>
          <TabsTrigger value="einvoicing">E-Invoicing</TabsTrigger>
        </TabsList>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2"><Clock3 className="h-4 w-4" /> Upcoming Filing Deadlines</p>
                <div className="space-y-2">
                  {(dashboard?.upcoming || []).map(u => (
                    <div key={u.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
                      <div>
                        <p className="font-medium">{u.obligationNumber} · {u.obligationType}</p>
                        <p className="text-xs text-muted-foreground">{u.jurisdictionId} · due {u.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-medium">{money(u.amountDue)}</p>
                        <Badge variant="outline">Due</Badge>
                      </div>
                    </div>
                  ))}
                  {(dashboard?.upcoming || []).length === 0 && <p className="text-sm text-muted-foreground">No upcoming deadlines</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Filing Activity</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 text-center"><p className="text-2xl font-semibold">{totals.validated}</p><p className="text-xs text-muted-foreground">Validated Invoices</p></div>
                  <div className="border rounded-lg p-3 text-center"><p className="text-2xl font-semibold">{totals.rejected}</p><p className="text-xs text-muted-foreground">Rejected Invoices</p></div>
                  <div className="border rounded-lg p-3 text-center"><p className="text-2xl font-semibold">{dashboard?.overdue ?? 0}</p><p className="text-xs text-muted-foreground">Overdue Obligations</p></div>
                  <div className="border rounded-lg p-3 text-center"><p className="text-2xl font-semibold">{dashboard?.pendingInvoices ?? 0}</p><p className="text-xs text-muted-foreground">Submitted Invoices</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Tax Management ────────────────────────────────────────────────── */}
        <TabsContent value="tax-management" className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {JURISDICTIONS.map(j => {
              const jOblig = obligations.filter(o => o.jurisdictionId === j);
              const jDue = jOblig.filter(o => o.status === 'Due' || o.status === 'Overdue').reduce((s, o) => s + (o.amountDue - o.amountPaid), 0);
              const jFiled = jOblig.filter(o => o.status === 'Filed' || o.status === 'Paid').length;
              return (
                <Card key={j} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{j}</p>
                      <Badge variant="outline">{jOblig.length} obligations</Badge>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between text-muted-foreground"><span>Total due</span><span className="font-mono font-medium">{money(jDue)}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Filed / paid</span><span className="font-mono font-medium">{jFiled}</span></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── VAT / Sales Tax ──────────────────────────────────────────────── */}
        <TabsContent value="vat" className="space-y-4">
          {showObligation && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> New Tax Obligation</p>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-2"><FormField label="Jurisdiction"><Select value={obligationForm.jurisdictionId} onValueChange={v => v !== null && setObl('jurisdictionId', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{JURISDICTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}</SelectContent>
                </Select></FormField></div>
                <div className="col-span-2"><FormField label="Type"><Select value={obligationForm.obligationType} onValueChange={v => v !== null && setObl('obligationType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{OBLIGATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select></FormField></div>
                <div className="col-span-2"><FormField label="Period Start"><Input type="date" value={obligationForm.periodStart} onChange={e => setObl('periodStart', e.target.value)} /></FormField></div>
                <div className="col-span-2"><FormField label="Period End"><Input type="date" value={obligationForm.periodEnd} onChange={e => setObl('periodEnd', e.target.value)} /></FormField></div>
                <div className="col-span-2"><FormField label="Due Date"><Input type="date" value={obligationForm.dueDate} onChange={e => setObl('dueDate', e.target.value)} /></FormField></div>
                <div className="col-span-1"><FormField label="Amount"><Input type="number" value={obligationForm.amountDue} onChange={e => setObl('amountDue', e.target.value)} /></FormField></div>
                <div className="col-span-1"><Button onClick={handleSaveObligation} disabled={saving}><Save className="mr-1.5 h-4 w-4" />Save</Button></div>
              </div>
            </Card>
          )}

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
                {filteredObligations.map(o => (
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
                {filteredObligations.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No obligations found</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* ── Withholding Tax ───────────────────────────────────────────────── */}
        <TabsContent value="withholding" className="space-y-4">
          {showCert && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Issue Withholding Certificate</p>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-2"><FormField label="Type"><Select value={certForm.certificateType} onValueChange={v => v !== null && setCert('certificateType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CERT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select></FormField></div>
                <div className="col-span-2"><FormField label="Counterparty"><Input value={certForm.counterpartyName} onChange={e => setCert('counterpartyName', e.target.value)} /></FormField></div>
                <div className="col-span-2"><FormField label="Tax ID"><Input value={certForm.taxId} onChange={e => setCert('taxId', e.target.value)} /></FormField></div>
                <div className="col-span-1"><FormField label="Rate %"><Input type="number" value={certForm.ratePercent} onChange={e => setCert('ratePercent', e.target.value)} /></FormField></div>
                <div className="col-span-1"><FormField label="Gross"><Input type="number" value={certForm.grossAmount} onChange={e => setCert('grossAmount', e.target.value)} /></FormField></div>
                <div className="col-span-2"><FormField label="Period"><Input type="date" value={certForm.periodStart} onChange={e => setCert('periodStart', e.target.value)} /></FormField></div>
                <div className="col-span-1"><FormField label="Status"><Select value={certForm.status} onValueChange={v => v !== null && setCert('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Issued">Issued</SelectItem></SelectContent>
                </Select></FormField></div>
                <div className="col-span-1"><Button onClick={handleSaveCert} disabled={saving}><Save className="mr-1.5 h-4 w-4" />Issue</Button></div>
              </div>
            </Card>
          )}

          <div className="flex gap-3 items-center">
            <Button size="sm" variant="outline" onClick={() => setShowCert(v => !v)}><Plus className="mr-1 h-3.5 w-3.5" /> Issue Certificate</Button>
          </div>

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
        </TabsContent>

        {/* ── Tax Returns ───────────────────────────────────────────────────── */}
        <TabsContent value="returns" className="space-y-4">
          <div className="flex gap-3 items-center">
            <Select value={jurisdictionFilter} onValueChange={v => v !== null && setJurisdictionFilter(v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Jurisdictions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Jurisdictions</SelectItem>
                {JURISDICTIONS.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

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
                {filteredReturns.map(r => (
                  <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono font-medium">{r.returnNumber}</td>
                    <td className="p-3"><Badge variant="outline">{r.jurisdictionId}</Badge></td>
                    <td className="p-3">{r.returnType}</td>
                    <td className="p-3 text-muted-foreground">{r.periodStart} → {r.periodEnd}</td>
                    <td className="p-3 text-right font-mono">{money(r.outputTax)}</td>
                    <td className="p-3 text-right font-mono">{money(r.inputTax)}</td>
                    <td className="p-3 text-right font-mono font-semibold">{money(r.netTax)}</td>
                    <td className="p-3 text-center">
                      <Badge variant={r.status === 'Filed' ? 'secondary' : 'default'}>{r.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      {r.status === 'Draft' && <Button size="sm" variant="ghost" onClick={() => fileReturn(r.id)}><Send className="mr-1 h-3.5 w-3.5" />File</Button>}
                    </td>
                  </tr>
                ))}
                {filteredReturns.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No tax returns found</td></tr>}
              </tbody>
            </table>
          </Card>
        </TabsContent>

        {/* ── E-Invoicing ───────────────────────────────────────────────────── */}
        <TabsContent value="einvoicing" className="space-y-4">
          {showEInvoice && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Create E-Invoice</p>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-2"><FormField label="Type"><Select value={einvoiceForm.invoiceType} onValueChange={v => v !== null && setEInv('invoiceType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Sales">Sales</SelectItem><SelectItem value="Purchase">Purchase</SelectItem></SelectContent>
                </Select></FormField></div>
                <div className="col-span-2"><FormField label="Counterparty"><Input value={einvoiceForm.counterpartyName} onChange={e => setEInv('counterpartyName', e.target.value)} /></FormField></div>
                <div className="col-span-2"><FormField label="Counterparty Tax ID"><Input value={einvoiceForm.counterpartyTaxId} onChange={e => setEInv('counterpartyTaxId', e.target.value)} /></FormField></div>
                <div className="col-span-2"><FormField label="Issue Date"><Input type="date" value={einvoiceForm.issueDate} onChange={e => setEInv('issueDate', e.target.value)} /></FormField></div>
                <div className="col-span-1"><FormField label="Gross"><Input type="number" value={einvoiceForm.grossAmount} onChange={e => setEInv('grossAmount', e.target.value)} /></FormField></div>
                <div className="col-span-1"><FormField label="Tax"><Input type="number" value={einvoiceForm.taxAmount} onChange={e => setEInv('taxAmount', e.target.value)} /></FormField></div>
                <div className="col-span-1"><FormField label="Reference"><Input value={einvoiceForm.reference} onChange={e => setEInv('reference', e.target.value)} /></FormField></div>
                <div className="col-span-1"><Button onClick={handleSaveEInvoice} disabled={saving}><Save className="mr-1.5 h-4 w-4" />Create</Button></div>
              </div>
            </Card>
          )}

          <div className="flex gap-3 items-center">
            <Button size="sm" variant="outline" onClick={() => setShowEInvoice(v => !v)}><Plus className="mr-1 h-3.5 w-3.5" /> Create E-Invoice</Button>
          </div>

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
        </TabsContent>
      </Tabs>
    </div>
  );
}
