import React, { useState, useMemo, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Search } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';
import { useBankingStore } from './stores';

interface BankTransactionRecord {
  id: string;
  date: string;
  ref: string;
  bank: string;
  payee: string;
  mode: string;
  type: string;
  amount: number;
  curr: string;
}

export const BankTransactionsView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [query, setQuery] = useState('');
  const { transactions, fetchTransactions } = useBankingStore();

  useEffect(() => {
    fetchTransactions(undefined, activeEntityId);
  }, [activeEntityId]);

  const transactionsData: BankTransactionRecord[] = useMemo(() => {
    return transactions.map(t => ({
      id: String(t.id),
      date: t.date,
      ref: t.ref,
      bank: t.bank,
      payee: t.payee,
      mode: t.mode,
      type: t.type,
      amount: t.amount,
      curr: t.curr
    }));
  }, [transactions]);

  const formatCurrency = (val: number, curr: string) => {
    const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: curr, maximumFractionDigits: 2 }).format(Math.abs(val));
    return val < 0 ? `-${formatted}` : `+${formatted}`;
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return transactionsData;
    const q = query.toLowerCase();
    return transactionsData.filter(t =>
      t.date.includes(q) ||
      t.ref.toLowerCase().includes(q) ||
      t.bank.toLowerCase().includes(q) ||
      t.payee.toLowerCase().includes(q) ||
      t.mode.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q)
    );
  }, [query, transactionsData]);

  const exportHeaders = ['Date', 'Reference', 'Bank Account', 'Payee / Recipient', 'Mode', 'Type', 'Amount', 'Currency'];
  const exportRows = filtered.map(t => [t.date, t.ref, t.bank, t.payee, t.mode, t.type, t.amount, t.curr]);

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Bank & Cash Transactions</h1>
          <p className="text-xs text-slate-500">General ledger bank movements and cash transactions for {currentEntity?.name || 'Active Entity'}.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search date, reference, payee..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 h-9 bg-white border border-slate-200 rounded-lg text-xs"
          />
        </div>
        <DataToolbar
          exportFileName="bank-transactions"
          exportSheetName="Bank Transactions"
          exportTitle="Bank & Cash Transactions"
          exportSubtitle={`General ledger bank movements for ${currentEntity?.name || 'Active Entity'}.`}
          exportHeaders={exportHeaders}
          exportRows={exportRows}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">DATE</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider">REFERENCE</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">BANK ACCOUNT</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PAYEE / RECIPIENT</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MODE OF PAYMENT</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TYPE</TableHead>
              <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">AMOUNT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.map(t => (
              <TableRow key={t.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3.5 pl-4 font-mono text-xs text-slate-600">{t.date}</TableCell>
                <TableCell className="py-3.5 font-mono text-xs font-bold text-slate-800">{t.ref}</TableCell>
                <TableCell className="py-3.5 text-xs text-slate-700 font-medium">{t.bank}</TableCell>
                <TableCell className="py-3.5 text-xs text-slate-600 font-medium">{t.payee}</TableCell>
                <TableCell className="py-3.5"><span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">{t.mode}</span></TableCell>
                <TableCell className="py-3.5"><Badge variant="outline" className="text-[11px]">{t.type}</Badge></TableCell>
                <TableCell className={`py-3.5 text-right font-mono text-xs font-bold pr-4 ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {formatCurrency(t.amount, t.curr)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
