import React, { useState, useEffect, useMemo } from 'react';
import { reportsApi } from './api/modules/reports.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, ReceiptText } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';

interface ArInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  currency: string;
}

interface AccountsReceivableViewProps {
  activeEntityId: string;
  entities: Entity[];
}

export const AccountsReceivableView: React.FC<AccountsReceivableViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [invoices, setInvoices] = useState<ArInvoice[]>([]);
  const [current, setCurrent] = useState(0);
  const [pastDue, setPastDue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (activeEntityId) params.companyId = activeEntityId;
      const data = await reportsApi.getArLedger(params);
      setInvoices(data?.invoices || []);
      setCurrent(data?.current || 0);
      setPastDue(data?.pastDue || 0);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load accounts receivable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeEntityId]);

  const filtered = useMemo(() => {
    return invoices.filter(i => {
      if (statusFilter !== 'All' && i.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!i.customerName.toLowerCase().includes(q) && !i.invoiceNumber.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [invoices, query, statusFilter]);

  const totalDue = invoices.reduce((s, i) => s + (i.amountDue || 0), 0);

  const exportHeaders = ['Invoice #', 'Customer', 'Date', 'Due Date', 'Total', 'Paid', 'Due', 'Status'];
  const exportRows = filtered.map(i => [i.invoiceNumber, i.customerName, i.date, i.dueDate, i.totalAmount, i.amountPaid, i.amountDue, i.status]);

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <ReceiptText className="w-4 h-4 text-indigo-600" /> Accounting & Finance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Accounts Receivable</h1>
          <p className="text-xs text-slate-500">
            Customer trade receivables aged by due date for {currentEntity?.name || 'Active Entity'} (IAS 39/IFRS 9 financial assets).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataToolbar
            exportFileName="accounts-receivable"
            exportSheetName="Accounts Receivable"
            exportTitle="Accounts Receivable"
            exportSubtitle={`Customer trade receivables aged by due date for ${currentEntity?.name || 'Active Entity'} (IAS 39/IFRS 9).`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Due', value: totalDue }]}
            onRefresh={load}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Receivable</p>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">{totalDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Current (Not Yet Due)</p>
          <p className="text-xl font-bold text-emerald-800 font-mono mt-1">{current.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Past Due</p>
          <p className="text-xl font-bold text-rose-800 font-mono mt-1">{pastDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input placeholder="Search customer, invoice #..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 h-9 bg-white text-xs" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none">
          <option value="All">All Statuses</option>
          <option value="Unpaid">Unpaid</option>
          <option value="PartiallyPaid">Partially Paid</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading accounts receivable…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">INVOICE #</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CUSTOMER</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">INVOICE DATE</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">DUE DATE</TableHead>
              <TableHead className="w-32 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL</TableHead>
              <TableHead className="w-28 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">PAID</TableHead>
              <TableHead className="w-32 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">AMOUNT DUE</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-xs text-slate-400">
                  No outstanding customer invoices. Create Sales Invoices to build receivables.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(i => (
              <TableRow key={i.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3 pl-4 font-mono text-xs font-bold text-slate-800">{i.invoiceNumber}</TableCell>
                <TableCell className="py-3 font-bold text-xs text-slate-800">{i.customerName}</TableCell>
                <TableCell className="py-3 font-mono text-xs text-slate-600">{i.date}</TableCell>
                <TableCell className={`py-3 font-mono text-xs ${new Date(i.dueDate) < new Date() && i.amountDue > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>{i.dueDate}</TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-800">{i.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="py-3 text-right font-mono text-xs text-emerald-700">{i.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-rose-600">{i.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${i.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : i.status === 'PartiallyPaid' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{i.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};