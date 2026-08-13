import React, { useState, useEffect, useMemo } from 'react';
import { reportsApi } from './api/modules/reports.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, FileDown } from 'lucide-react';
import type { Entity } from './EntitySettings';

interface GeneralLedgerLine {
  id: string;
  date: string;
  reference: string;
  description: string;
  status: string;
  transactionType: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

interface GeneralLedgerViewProps {
  activeEntityId: string;
  entities: Entity[];
}

export const GeneralLedgerView: React.FC<GeneralLedgerViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [lines, setLines] = useState<GeneralLedgerLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (activeEntityId) params.companyId = activeEntityId;
      if (from) params.from = from;
      if (to) params.to = to;
      const data = await reportsApi.getGeneralLedger(params);
      setLines(data || []);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load general ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeEntityId]);

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);

  const filtered = useMemo(() => {
    if (!query.trim()) return lines;
    const q = query.toLowerCase();
    return lines.filter(l =>
      (l.reference || '').toLowerCase().includes(q) ||
      (l.accountCode || '').toLowerCase().includes(q) ||
      (l.accountName || '').toLowerCase().includes(q) ||
      (l.description || '').toLowerCase().includes(q)
    );
  }, [lines, query]);

  const exportCsv = () => {
    const header = ['Date', 'Reference', 'Description', 'Account Code', 'Account Name', 'Debit', 'Credit', 'Transaction Type'];
    const rows = filtered.map(l => [l.date, l.reference, l.description, l.accountCode, l.accountName, l.debit, l.credit, l.transactionType]);
    const csv = [header, ...rows].map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'general-ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Search className="w-4 h-4 text-indigo-600" /> Accounting & Finance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">General Ledger</h1>
          <p className="text-xs text-slate-500">
            Posting-level register of all journal lines for {currentEntity?.name || 'Active Entity'}, derived from
            posted entries (IAS 1 presentation, IFRS-compliant).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load} className="h-9 px-3 gap-1.5 text-xs font-semibold">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv} className="h-9 px-3 gap-1.5 text-xs font-semibold">
            <FileDown className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search reference, account, description..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 h-9 bg-white border border-slate-200 rounded-lg text-xs"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">From</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-9 bg-white text-xs w-36" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">To</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-9 bg-white text-xs w-36" />
        </div>
        <Button size="sm" onClick={load} className="h-9 px-4 text-xs font-semibold bg-[#143e2b] hover:bg-[#0f3222]">Apply</Button>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading general ledger…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="flex items-center gap-4 text-xs font-semibold">
        <span className="text-slate-600">Total Debit: <span className="font-mono text-slate-900">{totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
        <span className="text-slate-600">Total Credit: <span className="font-mono text-slate-900">{totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
        <span className={`ml-auto px-2.5 py-1 rounded-md font-bold border ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {Math.abs(totalDebit - totalCredit) < 0.01 ? 'Balanced' : 'Out of Balance'}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">DATE</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider">REFERENCE</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ACCOUNT</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">DESCRIPTION</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">TYPE</TableHead>
              <TableHead className="w-28 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">DEBIT</TableHead>
              <TableHead className="w-28 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">CREDIT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No posted journal lines yet. Post journal entries or transactions to populate the general ledger.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((l, i) => (
              <TableRow key={`${l.id}-${i}`} className="hover:bg-slate-50/80">
                <TableCell className="py-3 pl-4 font-mono text-xs text-slate-600">{l.date}</TableCell>
                <TableCell className="py-3 font-mono text-xs font-bold text-slate-800">{l.reference}</TableCell>
                <TableCell className="py-3 text-xs">
                  <span className="font-bold text-slate-800">{l.accountCode}</span>
                  <span className="text-slate-500"> — {l.accountName}</span>
                </TableCell>
                <TableCell className="py-3 text-xs text-slate-600">{l.description || l.memo || '—'}</TableCell>
                <TableCell className="py-3">
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">{l.transactionType}</span>
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-emerald-700">
                  {l.debit > 0 ? l.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                </TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-rose-600 pr-4">
                  {l.credit > 0 ? l.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};