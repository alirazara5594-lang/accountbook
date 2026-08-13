import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, CheckCircle2, Scale } from 'lucide-react';
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

  const selectedAccount = accounts.find(a => a.id === selectedBankId);

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <RefreshCw className="w-4 h-4 text-emerald-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Bank Statement Reconciliation Engine</h1>
          <p className="text-xs text-slate-500">Match General Ledger balances against bank statement records for {currentEntity?.name || 'Active Entity'}. GL balance is computed from posted journal entries.</p>
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
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs font-medium text-slate-500">General Ledger Book Balance</p>
              <p className="text-lg font-bold text-slate-900">{loading ? '…' : currentGl === null ? '—' : formatCurrency(currentGl)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Bank Statement Balance</p>
              <Input
                type="number"
                value={statementBalance}
                onChange={e => setStatementBalance(e.target.value)}
                placeholder="0.00"
                className="h-8 w-44 mt-1 font-mono text-xs font-bold text-slate-900 border-slate-300"
              />
              <Input
                type="date"
                value={statementDate}
                onChange={e => setStatementDate(e.target.value)}
                className="h-8 w-44 mt-2 font-mono text-xs text-slate-700 border-slate-300"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Unreconciled Difference</p>
              <p className={`text-lg font-bold ${Math.abs(diff) === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
          <CardTitle className="text-base font-bold text-slate-900">Reconciliation History</CardTitle>
          <CardDescription className="text-xs text-slate-500">All recorded reconciliation runs for the active entity.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
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
                  <TableCell colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No reconciliations recorded yet. Select an account and enter the statement balance to run one.
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