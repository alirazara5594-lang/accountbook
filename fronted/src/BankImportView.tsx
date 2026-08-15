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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-emerald-600" /> Bank Statement Import
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Record imported electronic bank statements for {currentEntity?.name || 'Active Entity'}.</p>
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
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden"><Table><TableHeader><TableRow><TableHead>Imported At</TableHead><TableHead>File</TableHead><TableHead>Bank Account</TableHead><TableHead>Format</TableHead><TableHead className="text-right">Transactions</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{imports.map(i => <TableRow key={i.id}><TableCell>{new Date(i.importedAt).toLocaleString()}</TableCell><TableCell className="font-mono text-xs">{i.fileName}</TableCell><TableCell>{i.bankAccountName || 'Unassigned'}</TableCell><TableCell>{i.format}</TableCell><TableCell className="text-right">{i.transactionCount}</TableCell><TableCell>{i.status}</TableCell></TableRow>)}</TableBody></Table></div>
    </div>
  );
};
