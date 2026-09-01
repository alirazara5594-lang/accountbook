import React, { useState, useMemo } from 'react';
import { useCustomersStore } from './stores';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ArrowDownLeft, Search, Plus } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';

type PaymentMode = 'ACH' | 'Wire Transfer' | 'Cheque / Pay Order' | 'Credit Card' | 'Payment Gateway' | 'Direct Deposit';

export interface CustomerReceiptRecord {
  id: string;
  date: string;
  reference: string;
  customerName: string;
  bankAccount: string;
  paymentMode: PaymentMode;
  amount: number;
  currency: string;
  status: 'Completed' | 'Pending Clearance';
}

interface CustomerReceiptsViewProps {
  activeEntityId: string;
  entities: Entity[];
}

const initialCustomerReceipts: CustomerReceiptRecord[] = [
  {
    id: 'cr-1',
    date: '2026-08-08',
    reference: 'REC-1092',
    customerName: 'Apex Global Logistics USA',
    bankAccount: 'Standard Chartered (USD)',
    paymentMode: 'ACH',
    amount: 14800,
    currency: 'USD',
    status: 'Completed'
  },
  {
    id: 'cr-2',
    date: '2026-08-07',
    reference: 'REC-1093',
    customerName: 'Crescent Textile Mills Pakistan',
    bankAccount: 'Habib Bank Limited (HBL)',
    paymentMode: 'Wire Transfer',
    amount: 1250000,
    currency: 'PKR',
    status: 'Completed'
  }
];

export const CustomerReceiptsView: React.FC<CustomerReceiptsViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [receipts, setReceipts] = useState<CustomerReceiptRecord[]>(initialCustomerReceipts);
  const customers = useCustomersStore((s) => s.customers);
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultCustomerName = 'Apex Global Logistics USA';

  const [form, setForm] = useState({
    customerName: defaultCustomerName,
    bankAccount: 'Habib Bank Limited (HBL)',
    paymentMode: 'Wire Transfer' as PaymentMode,
    amount: '',
    currency: 'PKR',
    reference: `REC-${Math.floor(1000 + Math.random() * 9000)}`
  });

  const fetchCustomers = useCustomersStore((s) => s.fetchCustomers);

  React.useEffect(() => {
    fetchCustomers(activeEntityId).then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setForm(f => ({ ...f, customerName: data[0].name }));
      }
    });
  }, [activeEntityId]);

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
  };

  const filtered = useMemo(() => {
    return receipts
      .filter(r => {
        if (query.trim()) {
          const lower = query.toLowerCase();
          const matchesCustomer = r.customerName.toLowerCase().includes(lower);
          const matchesRef = r.reference.toLowerCase().includes(lower);
          if (!matchesCustomer && !matchesRef) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        const numA = a.reference || '';
        const numB = b.reference || '';
        return numB.localeCompare(numA, undefined, { numeric: true, sensitivity: 'base' });
      });
  }, [receipts, query]);

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0 || !form.customerName) return;

    setReceipts(prev => [{
      id: `cr-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      reference: form.reference,
      customerName: form.customerName,
      bankAccount: form.bankAccount,
      paymentMode: form.paymentMode,
      amount: amt,
      currency: form.currency,
      status: 'Completed'
    }, ...prev]);

    setIsModalOpen(false);
  };

  const exportHeaders = ['Date', 'Reference', 'Customer', 'Bank Account', 'Payment Mode', 'Amount', 'Currency', 'Status'];
  const exportRows = filtered.map(r => [r.date, r.reference, r.customerName, r.bankAccount, r.paymentMode, r.amount, r.currency, r.status]);
  const totalReceipts = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> Customer Receipts
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Incoming customer collections via ACH, Wire Transfer, Cheque, and Payment Gateway for {currentEntity?.name || 'Active Entity'}.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)}
          className="h-8 px-2.5 bg-[#143e2b] hover:bg-[#0f3222] text-white text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Record Receipt
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search customer name, reference..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 h-9 bg-white border border-slate-200 rounded-lg text-xs"
          />
        </div>
        <DataToolbar
          exportFileName="customer-receipts"
          exportSheetName="Customer Receipts"
          exportTitle="Customer Receipts"
          exportSubtitle={`Incoming customer collections for ${currentEntity?.name || 'Active Entity'}.`}
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportTotals={[{ label: 'Total Amount', value: totalReceipts }]}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">DATE</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider">REFERENCE</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CUSTOMER NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MODE OF PAYMENT</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">DEPOSITED INTO</TableHead>
              <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">AMOUNT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.map(r => (
              <TableRow key={r.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3.5 pl-4 font-mono text-xs text-slate-600">{r.date}</TableCell>
                <TableCell className="py-3.5 font-mono text-xs font-bold text-slate-800">{r.reference}</TableCell>
                <TableCell className="py-3.5 font-bold text-xs text-slate-800">{r.customerName}</TableCell>
                <TableCell className="py-3.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {r.paymentMode}
                  </span>
                </TableCell>
                <TableCell className="py-3.5 text-xs text-slate-600 font-medium">{r.bankAccount}</TableCell>
                <TableCell className="py-3.5 text-right font-mono text-xs font-bold text-emerald-600 pr-4">
                  + {formatCurrency(r.amount, r.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreateReceipt} >
            <div className="modal-head">
              <div>
                <p className="eyebrow">SALES & CUSTOMERS</p>
                <h2>Record Customer Receipt</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Customer (from Customer Management)</label>
                <select
                  required
                  value={form.customerName}
                  onChange={e => setForm({ ...form, customerName: e.target.value })}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                >
                  {customers.length > 0 ? (
                    customers.map(c => (
                      <option key={c.id} value={c.name}>
                        {c.customerNumber ? `${c.customerNumber} — ${c.name}` : c.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Apex Global Logistics USA">C-1001 — Apex Global Logistics USA</option>
                      <option value="Crescent Textile Mills Pakistan">C-1002 — Crescent Textile Mills Pakistan</option>
                      <option value="Gul Ahmed Energy Limited">C-1003 — Gul Ahmed Energy Limited</option>
                      <option value="Indus Motor Company">C-1004 — Indus Motor Company</option>
                    </>
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mode of Payment</label>
                  <select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value as PaymentMode })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="ACH">ACH Electronic</option>
                    <option value="Cheque / Pay Order">Cheque / Pay Order</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Payment Gateway">Payment Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Deposited Into Account</label>
                  <select value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                    <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                    <option value="Standard Chartered (USD)">Standard Chartered (USD)</option>
                    <option value="Meezan Bank Limited">Meezan Bank Limited</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount Received</label>
                  <Input required type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="h-9 text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Currency</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono">
                    <option value="PKR">PKR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="primary btn-finalize">Record Receipt</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
