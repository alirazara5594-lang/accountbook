import React, { useState, useMemo } from 'react';
import { useVendorsStore } from './stores';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search, Plus } from 'lucide-react';
import type { Entity } from './EntitySettings';

type PaymentMode = 'ACH' | 'Wire Transfer' | 'Cheque / Pay Order' | 'SWIFT' | 'RTGS' | 'Credit Card' | 'Direct Debit' | 'Online Banking';

export interface VendorPaymentRecord {
  id: string;
  date: string;
  reference: string;
  vendorName: string;
  bankAccount: string;
  paymentMode: PaymentMode;
  amount: number;
  currency: string;
  status: 'Completed' | 'Pending Clearance' | 'Processing';
}

interface VendorPaymentsViewProps {
  activeEntityId: string;
  entities: Entity[];
}

const initialVendorPayments: VendorPaymentRecord[] = [
  {
    id: 'vp-1',
    date: '2026-08-09',
    reference: 'PAY-8841',
    vendorName: 'Allied Engineering Supplies Ltd',
    bankAccount: 'Habib Bank Limited (HBL)',
    paymentMode: 'Wire Transfer',
    amount: 450000,
    currency: 'PKR',
    status: 'Completed'
  },
  {
    id: 'vp-2',
    date: '2026-08-08',
    reference: 'PAY-8842',
    vendorName: 'Cloud Infrastructure Services USA',
    bankAccount: 'Standard Chartered (USD)',
    paymentMode: 'ACH',
    amount: 3200,
    currency: 'USD',
    status: 'Completed'
  },
  {
    id: 'vp-3',
    date: '2026-08-06',
    reference: 'PAY-8843',
    vendorName: 'National Electric Equipment Co',
    bankAccount: 'Meezan Bank Limited',
    paymentMode: 'Cheque / Pay Order',
    amount: 180000,
    currency: 'PKR',
    status: 'Pending Clearance'
  }
];

export const VendorPaymentsView: React.FC<VendorPaymentsViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [payments, setPayments] = useState<VendorPaymentRecord[]>(initialVendorPayments);
  const vendors = useVendorsStore((s) => s.vendors);
  const [query, setQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultVendorName = 'Allied Engineering Supplies Ltd';

  const [form, setForm] = useState({
    vendorName: defaultVendorName,
    bankAccount: 'Habib Bank Limited (HBL)',
    paymentMode: 'Wire Transfer' as PaymentMode,
    amount: '',
    currency: 'PKR',
    reference: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
    description: ''
  });

  const fetchVendors = useVendorsStore((s) => s.fetchVendors);

  React.useEffect(() => {
    fetchVendors(activeEntityId).then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setForm(f => ({ ...f, vendorName: data[0].name }));
      }
    });
  }, [activeEntityId]);

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
  };

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (selectedMode !== 'All' && p.paymentMode !== selectedMode) return false;
      if (query.trim()) {
        const lower = query.toLowerCase();
        const matchesVendor = p.vendorName.toLowerCase().includes(lower);
        const matchesRef = p.reference.toLowerCase().includes(lower);
        const matchesBank = p.bankAccount.toLowerCase().includes(lower);
        if (!matchesVendor && !matchesRef && !matchesBank) return false;
      }
      return true;
    });
  }, [payments, query, selectedMode]);

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0 || !form.vendorName) return;

    setPayments(prev => [{
      id: `vp-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      reference: form.reference,
      vendorName: form.vendorName,
      bankAccount: form.bankAccount,
      paymentMode: form.paymentMode,
      amount: amt,
      currency: form.currency,
      status: 'Completed'
    }, ...prev]);

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Send className="w-4 h-4 text-emerald-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Vendor Payments</h1>
          <p className="text-xs text-slate-500">
            Outgoing supplier disbursements via Wire, ACH, SWIFT, Cheque, RTGS, and Credit Card for {currentEntity?.name || 'Active Entity'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b] hover:bg-[#0f3222] shadow-xs"
          >
            <Plus className="w-4 h-4" /> Record Vendor Payment
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search vendor name, reference..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 h-9 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <select
            value={selectedMode}
            onChange={e => setSelectedMode(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
          >
            <option value="All">All Payment Modes</option>
            <option value="Wire Transfer">Wire Transfer</option>
            <option value="ACH">ACH Electronic</option>
            <option value="SWIFT">SWIFT International</option>
            <option value="RTGS">RTGS Real-Time</option>
            <option value="Cheque / Pay Order">Cheque / Pay Order</option>
            <option value="Credit Card">Credit Card</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">DATE</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider">REFERENCE</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">VENDOR / PAYEE NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MODE OF PAYMENT</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">DISBURSED FROM</TableHead>
              <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">AMOUNT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3.5 pl-4 font-mono text-xs text-slate-600">{p.date}</TableCell>
                <TableCell className="py-3.5 font-mono text-xs font-bold text-slate-800">{p.reference}</TableCell>
                <TableCell className="py-3.5 font-bold text-xs text-slate-800">{p.vendorName}</TableCell>
                <TableCell className="py-3.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {p.paymentMode}
                  </span>
                </TableCell>
                <TableCell className="py-3.5 text-xs text-slate-600 font-medium">{p.bankAccount}</TableCell>
                <TableCell className="py-3.5 text-right font-mono text-xs font-bold text-rose-600 pr-4">
                  - {formatCurrency(p.amount, p.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreatePayment} style={{ width: 'min(700px, 100%)' }}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">PROCUREMENT</p>
                <h2>Record Vendor Payment</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Vendor (from Vendor Management)</label>
                <select
                  required
                  value={form.vendorName}
                  onChange={e => setForm({ ...form, vendorName: e.target.value })}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                >
                  {vendors.length > 0 ? (
                    vendors.map(v => (
                      <option key={v.id} value={v.name}>
                        {v.vendorNumber ? `${v.vendorNumber} — ${v.name}` : v.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Allied Engineering Supplies Ltd">V-1001 — Allied Engineering Supplies Ltd</option>
                      <option value="Cloud Infrastructure Services USA">V-1002 — Cloud Infrastructure Services USA</option>
                      <option value="National Electric Equipment Co">V-1003 — National Electric Equipment Co</option>
                      <option value="Siemens Pakistan">V-1004 — Siemens Pakistan</option>
                      <option value="Packages Limited">V-1005 — Packages Limited</option>
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
                    <option value="SWIFT">SWIFT International</option>
                    <option value="RTGS">RTGS Real-Time</option>
                    <option value="Cheque / Pay Order">Cheque / Pay Order</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Disbursed From Account</label>
                  <select value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                    <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                    <option value="Meezan Bank Limited">Meezan Bank Limited</option>
                    <option value="Standard Chartered (USD)">Standard Chartered (USD)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount</label>
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
              <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Record Payment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
