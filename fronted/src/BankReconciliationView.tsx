import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, CheckCircle2, Scale } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import type { Entity } from './EntitySettings';
import { apiClient } from './api/client';

interface ReconAccount { id: string; code: string; name: string; }
interface Reconciliation {
  id: string;
  bankAccountId: string;
  bankAccountName: string;
  bankAccountCode: string;
  date: string;
  statementBalance: number;
  glBalance: number;
  difference: number;
  status: string;
}

export const BankReconciliationView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [accounts, setAccounts] = useState<ReconAccount[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [statementBalance, setStatementBalance] = useState('');
  const [statementDate, setStatementDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const formatCurrency = (val: number, currency = 'PKR') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [accts, recs] = await Promise.all([
        apiClient<ReconAccount[]>('/bank-reconciliations/accounts'),
        apiClient<Reconciliation[]>('/bank-reconciliations', { params: { companyId: activeEntityId || undefined } }),
      ]);
      setAccounts(accts);
      setReconciliations(recs);
      if (!selectedBankId && accts.length > 0) setSelectedBankId(accts[0].id);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load reconciliation data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [activeEntityId]);

  const currentGl = reconciliations.find(r => r.bankAccountId === selectedBankId)?.glBalance ?? null;
  const statementValue = parseFloat(statementBalance);
  const glDisplay = currentGl ?? 0;
  const diff = Number.isFinite(statementValue) ? glDisplay - statementValue : 0;

  const exportHeaders = ['Date', 'Bank Account', 'GL Balance', 'Statement Balance', 'Difference', 'Status'];
  const exportRows = reconciliations.map(r => [r.date, `${r.bankAccountCode} — ${r.bankAccountName}`, r.glBalance, r.statementBalance, r.difference, r.status]);

  const handleComplete = async () => {
    if (!selectedBankId) return;
    if (!Number.isFinite(statementValue)) { setError('Enter a valid bank statement balance.'); return; }
    setSaving(true);
    try {
      await apiClient('/bank-reconciliations', {
        method: 'POST',
        body: {
          bankAccountId: selectedBankId,
          statementDate: statementDate,
          statementBalance: statementValue,
          companyId: activeEntityId || undefined,
        },
      });
      setStatementBalance('');
      await loadAll();
    } catch (e: any) {
      setError(e?.data?.error || e?.message || 'Failed to save reconciliation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-blue-500 to-violet-700" />
              <div className="absolute inset-0 flex items-center justify-center"><RefreshCw className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Bank Reconciliation</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Match General Ledger balances against bank statement records for {currentEntity?.name || 'Active Entity'}.</p>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Reconcile Bank Account</CardTitle>
              <CardDescription className="text-xs text-slate-500">IAS 7 Statement Audit & Cleared Lines Matching.</CardDescription>
            </div>
            <select
              value={selectedBankId}
              onChange={e => setSelectedBankId(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
            >
              <option value="">— Select Account —</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-medium text-slate-500">General Ledger Book Balance</p>
              <p className="text-sm font-bold text-slate-900">{loading ? '…' : currentGl === null ? '—' : formatCurrency(currentGl)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-500">Bank Statement Balance</p>
              <Input
                type="number"
                value={statementBalance}
                onChange={e => setStatementBalance(e.target.value)}
                placeholder="0.00"
                className="h-7 w-40 mt-1 font-mono text-[10px] font-bold text-slate-900 border-slate-300"
              />
              <Input
                type="date"
                value={statementDate}
                onChange={e => setStatementDate(e.target.value)}
                className="h-7 w-40 mt-1.5 font-mono text-[10px] text-slate-700 border-slate-300"
              />
            </div>
            <div>
              <p className="text-[10px] font-medium text-slate-500">Unreconciled Difference</p>
              <p className={`text-sm font-bold ${Math.abs(diff) === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {Number.isFinite(statementValue) ? formatCurrency(diff) : '—'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              onClick={handleComplete}
              disabled={saving || !selectedBankId}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs h-9 px-4"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> {saving ? 'Saving…' : 'Complete Statement Reconciliation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Reconciliation History</CardTitle>
              <CardDescription className="text-xs text-slate-500">All recorded reconciliation runs for the active entity.</CardDescription>
            </div>
            <DataToolbar
              exportFileName="bank-reconciliations"
              exportSheetName="Bank Reconciliations"
              exportTitle="Bank Statement Reconciliation"
              exportSubtitle={`Reconciliation runs for ${currentEntity?.name || 'Active Entity'} (IAS 7).`}
              exportHeaders={exportHeaders}
              exportRows={exportRows}
              onRefresh={() => loadAll()}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-blue-500/[0.05] dark:bg-blue-400/[0.07] border-b border-slate-200">
              <TableRow>
                <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">DATE</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">BANK ACCOUNT</TableHead>
                <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">GL BALANCE</TableHead>
                <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATEMENT</TableHead>
                <TableHead className="w-32 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">DIFFERENCE</TableHead>
                <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {reconciliations.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={Scale}
                      title="No reconciliations recorded yet"
                      hint="Select an account and enter the statement balance to run one."
                    />
                  </TableCell>
                </TableRow>
              )}
              {reconciliations.map(r => (
                <TableRow key={r.id} className="hover:bg-slate-50/80">
                  <TableCell className="py-3 pl-4 font-mono text-xs text-slate-600">{r.date}</TableCell>
                  <TableCell className="py-3 text-xs text-slate-700 font-semibold">{r.bankAccountCode} — {r.bankAccountName}</TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs text-slate-700">{formatCurrency(r.glBalance)}</TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs text-slate-700">{formatCurrency(r.statementBalance)}</TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-900">{formatCurrency(r.difference)}</TableCell>
                  <TableCell className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${r.status === 'Balanced' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                      <Scale className="w-3 h-3 mr-1" /> {r.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};