import React, { useState, useEffect, useMemo } from 'react';
import { reportsApi } from './api/modules/reports.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Wallet } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';

interface ApBill {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  date: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: string;
  currencyCode: string;
}

interface AccountsPayableViewProps {
  activeEntityId: string;
  entities: Entity[];
}

export const AccountsPayableView: React.FC<AccountsPayableViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [bills, setBills] = useState<ApBill[]>([]);
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
      const data = await reportsApi.getApLedger(params);
      setBills(data?.bills || []);
      setCurrent(data?.current || 0);
      setPastDue(data?.pastDue || 0);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load accounts payable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [activeEntityId]);

  const filtered = useMemo(() => {
    return bills.filter(b => {
      if (statusFilter !== 'All' && b.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!b.vendorName.toLowerCase().includes(q) && !b.billNumber.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [bills, query, statusFilter]);

  const totalDue = bills.reduce((s, b) => s + (b.amountDue || 0), 0);

  const exportHeaders = ['Bill #', 'Vendor', 'Date', 'Due Date', 'Total', 'Paid', 'Due', 'Status'];
  const exportRows = filtered.map(b => [b.billNumber, b.vendorName, b.date, b.dueDate, b.totalAmount, b.amountPaid, b.amountDue, b.status]);

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Wallet className="w-4 h-4 text-indigo-600" /> Accounting & Finance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Accounts Payable</h1>
          <p className="text-xs text-slate-500">
            Vendor trade payables aged by due date for {currentEntity?.name || 'Active Entity'} (IAS 37 / IAS 32 financial liabilities).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DataToolbar
            exportFileName="accounts-payable"
            exportSheetName="Accounts Payable"
            exportTitle="Accounts Payable"
            exportSubtitle={`Vendor trade payables aged by due date for ${currentEntity?.name || 'Active Entity'} (IAS 37 / IAS 32).`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Due', value: totalDue }]}
            onRefresh={load}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payable</p>
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
          <Input placeholder="Search vendor, bill #..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9 h-9 bg-white text-xs" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none">
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="PartiallyPaid">Partially Paid</option>
        </select>
      </div>

      {loading && <p className="text-xs text-slate-500">Loading accounts payable…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">BILL #</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">VENDOR</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">BILL DATE</TableHead>
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
                  No outstanding vendor bills. Create Purchase Orders / Bills to build payables.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(b => (
              <TableRow key={b.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3 pl-4 font-mono text-xs font-bold text-slate-800">{b.billNumber}</TableCell>
                <TableCell className="py-3 font-bold text-xs text-slate-800">{b.vendorName}</TableCell>
                <TableCell className="py-3 font-mono text-xs text-slate-600">{b.date}</TableCell>
                <TableCell className={`py-3 font-mono text-xs ${new Date(b.dueDate) < new Date() && b.amountDue > 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>{b.dueDate}</TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-slate-800">{b.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="py-3 text-right font-mono text-xs text-emerald-700">{b.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="py-3 text-right font-mono text-xs font-bold text-rose-600">{b.amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${b.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : b.status === 'PartiallyPaid' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{b.status}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};