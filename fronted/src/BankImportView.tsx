import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import type { Entity } from './EntitySettings';
import { useBankingStore } from './stores';

export const BankImportView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const { bankAccounts, imports, fetchBankAccounts, fetchImports, createImport } = useBankingStore();
  const [form, setForm] = useState({ bankAccountId: '', fileName: 'statement.csv', format: 'CSV', transactionCount: '12', totalAmount: '0' });

  useEffect(() => { fetchBankAccounts(activeEntityId); fetchImports(activeEntityId); }, [activeEntityId]);
  useEffect(() => { if (!form.bankAccountId && bankAccounts[0]) setForm(f => ({ ...f, bankAccountId: bankAccounts[0].id })); }, [bankAccounts]);

  const exportRows = useMemo(() => imports.map(i => [i.importedAt, i.fileName, i.bankAccountName || '', i.format, i.transactionCount, i.totalAmount, i.status]), [imports]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createImport({ bankAccountId: form.bankAccountId || undefined, fileName: form.fileName, format: form.format, transactionCount: Number(form.transactionCount) || 0, totalAmount: Number(form.totalAmount) || 0, companyId: activeEntityId });
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
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-blue-500 to-sky-700" />
              <div className="absolute inset-0 flex items-center justify-center"><UploadCloud className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Bank Statement Import</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Record imported electronic bank statements for {currentEntity?.name || 'Active Entity'}.</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-white border-slate-200"><CardHeader className="pb-3 border-b border-slate-200"><CardTitle className="text-base font-bold text-slate-900">Upload Electronic Bank Statement</CardTitle><CardDescription className="text-xs text-slate-500">Import history is stored in the backend and can be used during reconciliation.</CardDescription></CardHeader>
        <CardContent className="pt-6"><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select value={form.bankAccountId} onChange={e => setForm({ ...form, bankAccountId: e.target.value })} className="h-10 border rounded-md px-3 text-sm"><option value="">Select bank account</option>{bankAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select>
          <Input value={form.fileName} onChange={e => setForm({ ...form, fileName: e.target.value })} placeholder="File name" />
          <Input value={form.format} onChange={e => setForm({ ...form, format: e.target.value })} placeholder="CSV / OFX / MT940" />
          <Input type="number" value={form.transactionCount} onChange={e => setForm({ ...form, transactionCount: e.target.value })} placeholder="Transactions" />
          <Button type="submit" className="h-10 text-xs bg-[#143e2b] text-white hover:bg-[#0f3222]"><FileSpreadsheet className="w-4 h-4 mr-1.5" /> Record Import</Button>
        </form></CardContent>
      </Card>

      <div className="flex justify-end"><DataToolbar exportFileName="bank-imports" exportSheetName="Bank Imports" exportTitle="Bank Statement Imports" exportHeaders={['Imported At', 'File', 'Bank', 'Format', 'Transactions', 'Amount', 'Status']} exportRows={exportRows} /></div>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden"><Table><TableHeader className="bg-blue-500/[0.05] dark:bg-blue-400/[0.07]"><TableRow><TableHead>Imported At</TableHead><TableHead>File</TableHead><TableHead>Bank Account</TableHead><TableHead>Format</TableHead><TableHead className="text-right">Transactions</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{imports.map(i => <TableRow key={i.id}><TableCell>{new Date(i.importedAt).toLocaleString()}</TableCell><TableCell className="font-mono text-xs">{i.fileName}</TableCell><TableCell>{i.bankAccountName || 'Unassigned'}</TableCell><TableCell>{i.format}</TableCell><TableCell className="text-right">{i.transactionCount}</TableCell><TableCell>{i.status}</TableCell></TableRow>)}</TableBody></Table></div>
    </div>
  );
};
