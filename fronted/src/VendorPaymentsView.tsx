import React, { useState, useEffect, useMemo } from 'react';
import { useVendorsStore } from './stores';
import { vendorPaymentsApi, type VendorPayment, type WithdrawAccount, type VendorBillLite } from './api/modules/vendorPayments.api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Search, Plus } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';

type PaymentMode = 'ACH' | 'Wire Transfer' | 'Cheque / Pay Order' | 'SWIFT' | 'RTGS' | 'Credit Card' | 'Direct Debit' | 'Online Banking';

const MODE_METHOD: Record<string, string> = {
  'Wire Transfer': 'WireTransfer',
  'ACH': 'ACH',
  'Cheque / Pay Order': 'Cheque',
  'SWIFT': 'WireTransfer',
  'RTGS': 'BankTransfer',
  'Credit Card': 'CreditCard',
  'Direct Debit': 'DirectDebit',
  'Online Banking': 'OnlineBanking',
};

interface VendorPaymentsViewProps {
  activeEntityId: string;
  entities: Entity[];
}

export const VendorPaymentsView: React.FC<VendorPaymentsViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [payments, setPayments] = useState<VendorPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const vendors = useVendorsStore((s) => s.vendors);
  const fetchVendors = useVendorsStore((s) => s.fetchVendors);
  const [query, setQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAccounts, setWithdrawAccounts] = useState<WithdrawAccount[]>([]);
  const [bills, setBills] = useState<VendorBillLite[]>([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    vendorId: '',
    billId: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMode: 'Wire Transfer' as PaymentMode,
    withdrawFromAccountId: '',
    amount: '',
    currency: 'PKR',
    reference: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
    description: ''
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await vendorPaymentsApi.getAll(activeEntityId || undefined);
      setPayments(data);
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load vendor payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    fetchVendors(activeEntityId);
    vendorPaymentsApi.getWithdrawAccounts().then(setWithdrawAccounts).catch(() => {});
  }, [activeEntityId]);

  useEffect(() => {
    if (!isModalOpen) return;
    vendorPaymentsApi.getBills().then(setBills).catch(() => {});
  }, [isModalOpen]);

  // Auto-fill default vendor + default withdraw account when modal opens / vendors load
  useEffect(() => {
    if (!isModalOpen) return;
    setForm(f => ({
      ...f,
      vendorId: vendors[0]?.id || '',
      withdrawFromAccountId: withdrawAccounts[0]?.id || '',
    }));
  }, [isModalOpen, vendors, withdrawAccounts]);

  const onVendorChange = (vendorId: string) => {
    setForm({ ...form, vendorId, billId: '', amount: '' });
    vendorPaymentsApi.getBills(vendorId).then(b => {
      setBills(b);
      if (b.length > 0) {
        setForm(prev => ({ ...prev, vendorId, billId: b[0].id, amount: String(b[0].amountDue) }));
      }
    }).catch(() => {});
  };

  const onBillChange = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    setForm({
      ...form,
      billId,
      vendorId: bill ? bill.vendorId : form.vendorId,
      amount: bill ? String(bill.amountDue) : form.amount,
    });
  };

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
  };

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (selectedMode !== 'All' && p.paymentMethod !== selectedMode) return false;
      if (query.trim()) {
        const lower = query.toLowerCase();
        const matchesVendor = (p.vendorName || '').toLowerCase().includes(lower);
        const matchesRef = (p.reference || p.paymentNumber || '').toLowerCase().includes(lower);
        const matchesBank = (p.withdrawFromAccountName || p.bankAccountName || '').toLowerCase().includes(lower);
        if (!matchesVendor && !matchesRef && !matchesBank) return false;
      }
      return true;
    });
  }, [payments, query, selectedMode]);

  const exportHeaders = ['Payment Number', 'Date', 'Vendor', 'Bill', 'Amount', 'Mode', 'Bank Account', 'Reference', 'Status'];
  const exportRows = filtered.map(p => [
    p.paymentNumber || '', p.date, p.vendorName || '', p.billNumber || '',
    p.amount, p.paymentMethod, p.withdrawFromAccountName || p.bankAccountName || '',
    p.reference || '', p.status,
  ]);
  const totalPaid = filtered.reduce((s, p) => s + (p.amount || 0), 0);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amt = parseFloat(form.amount);
    if (!form.vendorId) { setFormError('Please select a vendor.'); return; }
    if (isNaN(amt) || amt <= 0) { setFormError('Amount must be greater than zero.'); return; }
    if (!form.withdrawFromAccountId) { setFormError('Please select a Withdraw From account.'); return; }

    setSaving(true);
    try {
      await vendorPaymentsApi.create({
        vendorId: form.vendorId,
        billId: form.billId || undefined,
        paymentDate: form.paymentDate,
        amount: amt,
        paymentMethod: MODE_METHOD[form.paymentMode] || 'BankTransfer',
        withdrawFromAccountId: form.withdrawFromAccountId,
        reference: form.reference || undefined,
        memo: form.description || undefined,
        companyId: activeEntityId || undefined,
      });
      setIsModalOpen(false);
      setForm({
        vendorId: '',
        billId: '',
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMode: 'Wire Transfer',
        withdrawFromAccountId: '',
        amount: '',
        currency: 'PKR',
        reference: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
        description: '',
      });
      await loadPayments();
    } catch (err: any) {
      setFormError(err?.data?.error || err?.message || 'Failed to create payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Send className="w-4 h-4 text-emerald-600" /> Procurement & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Vendor Payments</h1>
          <p className="text-xs text-slate-500">
            Outgoing supplier disbursements via Wire, ACH, SWIFT, Cheque, RTGS, and Credit Card for {currentEntity?.name || 'Active Entity'}.
            Payments post a Dr Accounts Payable / Cr Bank journal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DataToolbar
            exportFileName="vendor-payments"
            exportSheetName="Vendor Payments"
            exportTitle="Vendor Payments"
            exportSubtitle={`Outgoing supplier disbursements for ${currentEntity?.name || 'Active Entity'}.`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Paid', value: totalPaid }]}
            onRefresh={loadPayments}
          />
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

      {loading && <p className="text-xs text-slate-500">Loading vendor payments…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">DATE</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider">PAYMENT #</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">VENDOR / PAYEE NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MODE OF PAYMENT</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">DISBURSED FROM</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
              <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">AMOUNT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {payments.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-400">
                  No vendor payments recorded yet. Use "Record Vendor Payment" to disburse supplier funds.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(p => (
              <TableRow key={p.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3.5 pl-4 font-mono text-xs text-slate-600">{p.date}</TableCell>
                <TableCell className="py-3.5 font-mono text-xs font-bold text-slate-800">{p.paymentNumber}</TableCell>
                <TableCell className="py-3.5 font-bold text-xs text-slate-800">{p.vendorName}</TableCell>
                <TableCell className="py-3.5">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {p.paymentMethod}
                  </span>
                </TableCell>
                <TableCell className="py-3.5 text-xs text-slate-600 font-medium">{p.withdrawFromAccountName || p.bankAccountName || '—'}</TableCell>
                <TableCell className="py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${p.status === 'Posted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                    {p.status}
                  </span>
                </TableCell>
                <TableCell className="py-3.5 text-right font-mono text-xs font-bold text-rose-600 pr-4">
                  - {formatCurrency(p.amount, 'PKR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleCreatePayment} >
            <div className="modal-head">
              <div>
                <p className="eyebrow">PROCUREMENT</p>
                <h2>Record Vendor Payment</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">
              {formError && <p className="error" style={{ gridColumn: '1 / -1', color: '#c25c5c', fontSize: 13, marginBottom: 10 }}>{formError}</p>}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Vendor (from Vendor Management)</label>
                <select
                  required
                  value={form.vendorId}
                  onChange={e => onVendorChange(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="">— Select Vendor —</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.vendorNumber ? `${v.vendorNumber} — ${v.name}` : v.name}
                    </option>
                  ))}
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Withdraw From Account</label>
                  <select value={form.withdrawFromAccountId} onChange={e => setForm({ ...form, withdrawFromAccountId: e.target.value })} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                    <option value="">— Select Account —</option>
                    {withdrawAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Against Bill</label>
                <select value={form.billId} onChange={e => onBillChange(e.target.value)} className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs">
                  <option value="">— On Account (no bill) —</option>
                  {bills.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.billNumber} — Due: {b.amountDue.toLocaleString()} {b.currencyCode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Date</label>
                <Input required type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Amount</label>
                  <Input required type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="h-9 text-xs font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Reference</label>
                  <Input type="text" placeholder="Wire ref / cheque #" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="h-9 text-xs font-mono" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" className="primary" disabled={saving}>{saving ? 'Posting…' : 'Post & Record Payment'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};