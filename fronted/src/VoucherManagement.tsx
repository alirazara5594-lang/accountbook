import React, { useState, useMemo, useEffect } from 'react';
import { useFormDraft } from './hooks/useFormDraft';
import { useVendorsStore, useCustomersStore, useVouchersStore, useBankingStore } from './stores';
import type { FormEvent } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, Download, Plus, CheckCircle2, Layers, Send, ArrowDownLeft, Wallet, Building2, BookOpen } from 'lucide-react';
import type { Entity } from './EntitySettings';

export type VoucherType = 'BPV' | 'BRV' | 'CPV' | 'CRV' | 'JV';

export interface VoucherRecord {
  id: string;
  voucherNumber: string;
  voucherType: VoucherType;
  date: string;
  accountName: string;
  partyType: 'Vendor' | 'Customer' | 'General Ledger';
  partyName: string;
  paymentMode: string;
  chequeNumber?: string;
  amount: number;
  currency: string;
  narration: string;
  status: 'Posted' | 'Draft';
}

interface VoucherManagementProps {
  subView?: string;
  activeEntityId: string;
  entities: Entity[];
}

export const VoucherManagement: React.FC<VoucherManagementProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<{ id: string; code: string; name: string }[]>([]);
  const [cashAccounts, setCashAccounts] = useState<{ id: string; code: string; name: string }[]>([]);
  const { vouchers: storeVouchers, fetchVouchers, createVoucher } = useVouchersStore();
  const { bankAccounts: storeBankAccounts, cashAccounts: storeCashAccounts, fetchBankAccounts, fetchCashAccounts } = useBankingStore();

  // Modal Dialog Open State & Active Voucher Type
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVoucherType, setSelectedVoucherType] = useState<VoucherType>('BPV');

  const [query, setQuery] = useState('');
  const [tableTypeFilter, setTableTypeFilter] = useState<string>('All');

  // Modal Form State
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    accountName: 'Habib Bank Limited (HBL)',
    partyName: '',
    paymentMode: 'Wire Transfer',
    chequeNumber: '',
    amount: '',
    currency: 'PKR',
    narration: ''
  });

  const { saveDraft, clearDraft } = useFormDraft('voucher', form, setForm, isModalOpen);

  const fetchVendors = useVendorsStore((s) => s.fetchVendors);
  const fetchCustomers = useCustomersStore((s) => s.fetchCustomers);

  useEffect(() => {
    fetchVendors(activeEntityId).then((data) => {
      if (Array.isArray(data)) setVendors(data as any[]);
    });

    fetchCustomers(activeEntityId).then((data) => {
      if (Array.isArray(data)) setCustomers(data as any[]);
    });
  }, [activeEntityId]);

  useEffect(() => {
    fetchVouchers(activeEntityId);
  }, [activeEntityId]);

  useEffect(() => {
    fetchBankAccounts(activeEntityId);
    fetchCashAccounts(activeEntityId);
  }, [activeEntityId]);

  useEffect(() => {
    setBankAccounts(storeBankAccounts.map(a => ({ id: a.id, code: a.code, name: a.name })));
  }, [storeBankAccounts]);

  useEffect(() => {
    setCashAccounts(storeCashAccounts.map(a => ({ id: a.id, code: a.code, name: a.name })));
  }, [storeCashAccounts]);

  useEffect(() => {
    setVouchers(storeVouchers.map(v => ({
      id: v.id,
      voucherNumber: v.voucherNumber,
      voucherType: v.voucherType,
      date: v.date,
      accountName: v.accountName,
      partyType: v.partyType,
      partyName: v.partyName,
      paymentMode: v.paymentMode,
      chequeNumber: v.chequeNumber,
      amount: v.amount,
      currency: v.currency,
      narration: v.narration,
      status: v.status
    })));
  }, [storeVouchers]);

  // Open Modal ONLY for the clicked voucher type (Exact Customer Management style)
  const openVoucherModal = (type: VoucherType) => {
    setSelectedVoucherType(type);

    const bankAcc = bankAccounts.length > 0 ? bankAccounts[0].name : 'Habib Bank Limited (HBL)';
    const cashAcc = cashAccounts.length > 0 ? cashAccounts[0].name : 'Head Office Petty Cash Vault';
    let defaultAcc = bankAcc;
    let defaultMode = 'Wire Transfer';
    let defaultParty = '';

    if (type === 'BPV') {
      defaultAcc = bankAcc;
      defaultMode = 'Wire Transfer';
      defaultParty = vendors.length > 0 ? vendors[0].name : 'Allied Engineering Supplies Ltd';
    } else if (type === 'BRV') {
      defaultAcc = bankAcc;
      defaultMode = 'Wire Transfer';
      defaultParty = customers.length > 0 ? customers[0].name : 'Apex Global Logistics USA';
    } else if (type === 'CPV') {
      defaultAcc = cashAcc;
      defaultMode = 'Cash';
      defaultParty = vendors.length > 0 ? vendors[0].name : 'Office Express Stationary';
    } else if (type === 'CRV') {
      defaultAcc = cashAcc;
      defaultMode = 'Cash';
      defaultParty = customers.length > 0 ? customers[0].name : 'Crescent Retail Store';
    } else if (type === 'JV') {
      defaultAcc = 'General Ledger Adjustments';
      defaultMode = 'N/A';
      defaultParty = 'General Ledger Adjustments';
    }

    setForm({
      date: new Date().toISOString().slice(0, 10),
      accountName: defaultAcc,
      partyName: defaultParty,
      paymentMode: defaultMode,
      chequeNumber: '',
      amount: '',
      currency: 'PKR',
      narration: ''
    });

    setIsModalOpen(true);
  };

  const handlePostVoucher = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid Voucher Amount.');
      return;
    }

    const partyTypeMap: Record<VoucherType, 'Vendor' | 'Customer' | 'General Ledger'> = {
      BPV: 'Vendor',
      BRV: 'Customer',
      CPV: 'Vendor',
      CRV: 'Customer',
      JV: 'General Ledger'
    };

    try {
      const created = await createVoucher({
        type: selectedVoucherType,
        date: form.date,
        accountName: form.accountName,
        partyType: partyTypeMap[selectedVoucherType],
        partyName: form.partyName,
        paymentMode: form.paymentMode,
        chequeNumber: form.chequeNumber || undefined,
        amount: amt,
        currency: form.currency,
        narration: form.narration || `${selectedVoucherType} Entry`,
        companyId: activeEntityId
      });

      clearDraft();
      setIsModalOpen(false);
      alert(`Voucher ${created.voucherNumber} posted successfully to General Ledger!`);
    } catch (err: any) {
      alert(`Failed to post voucher: ${err.message || 'Unknown error'}`);
    }
  };

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
  };

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      if (tableTypeFilter !== 'All' && v.voucherType !== tableTypeFilter) return false;
      if (query.trim()) {
        const lower = query.toLowerCase();
        const matchesNum = v.voucherNumber.toLowerCase().includes(lower);
        const matchesParty = v.partyName.toLowerCase().includes(lower);
        const matchesAcc = v.accountName.toLowerCase().includes(lower);
        const matchesNarr = v.narration.toLowerCase().includes(lower);
        if (!matchesNum && !matchesParty && !matchesAcc && !matchesNarr) return false;
      }
      return true;
    });
  }, [vouchers, tableTypeFilter, query]);

  const handleExportCSV = () => {
    const headers = ['VOUCHER NO', 'TYPE', 'DATE', 'ACCOUNT / VAULT', 'PARTY NAME', 'PAYMENT MODE', 'REF / CHEQUE', 'AMOUNT', 'CURRENCY', 'NARRATION', 'STATUS'];
    const rows = filteredVouchers.map(v => [
      `"${v.voucherNumber}"`,
      `"${v.voucherType}"`,
      `"${v.date}"`,
      `"${v.accountName}"`,
      `"${v.partyName}"`,
      `"${v.paymentMode}"`,
      `"${v.chequeNumber || ''}"`,
      v.amount,
      `"${v.currency}"`,
      `"${v.narration}"`,
      `"${v.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vouchers_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVoucherBadgeStyle = (type: VoucherType) => {
    switch (type) {
      case 'BPV': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'BRV': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CPV': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CRV': return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'JV': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getVoucherTitle = (type: VoucherType) => {
    switch (type) {
      case 'BPV': return 'Create Bank Payment Voucher (BPV)';
      case 'BRV': return 'Create Bank Receipt Voucher (BRV)';
      case 'CPV': return 'Create Cash Payment Voucher (CPV)';
      case 'CRV': return 'Create Cash Receipt Voucher (CRV)';
      case 'JV': return 'Create Journal Voucher (JV)';
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" /> Voucher Management
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Select a Voucher Type below to open its dedicated data entry form for {currentEntity?.name || 'Active Entity'}.
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={handleExportCSV}
            className="h-8 px-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1">
            <Download className="w-3.5 h-3.5 text-slate-500" /> CSV
          </button>
          <button onClick={() => openVoucherModal('BPV')}
            className="h-8 px-2.5 bg-[#143e2b] hover:bg-[#0f3222] text-white text-[11px] font-semibold rounded-lg shrink-0 whitespace-nowrap flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Voucher
          </button>
        </div>
      </div>

      {/* 5 Interactive Voucher Type Cards at the Top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* BPV Card */}
        <button
          type="button"
          onClick={() => openVoucherModal('BPV')}
          className="p-4 rounded-xl border text-left transition-all cursor-pointer bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-rose-100 text-rose-700">
              <Send className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">BPV</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">BPV — Bank Payment</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Disburse vendor payments & bills from commercial bank accounts.</p>
        </button>

        {/* BRV Card */}
        <button
          type="button"
          onClick={() => openVoucherModal('BRV')}
          className="p-4 rounded-xl border text-left transition-all cursor-pointer bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">BRV</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">BRV — Bank Receipt</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Collect customer invoice payments directly into bank accounts.</p>
        </button>

        {/* CPV Card */}
        <button
          type="button"
          onClick={() => openVoucherModal('CPV')}
          className="p-4 rounded-xl border text-left transition-all cursor-pointer bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-amber-100 text-amber-700">
              <Wallet className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">CPV</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">CPV — Cash Payment</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Pay petty cash expenses or cash purchases from physical vaults.</p>
        </button>

        {/* CRV Card */}
        <button
          type="button"
          onClick={() => openVoucherModal('CRV')}
          className="p-4 rounded-xl border text-left transition-all cursor-pointer bg-white border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-teal-100 text-teal-700">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">CRV</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">CRV — Cash Receipt</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Collect cash sales or cash receipts into cash registers.</p>
        </button>

        {/* JV Card */}
        <button
          type="button"
          onClick={() => openVoucherModal('JV')}
          className="p-4 rounded-xl border text-left transition-all cursor-pointer bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 shadow-xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-indigo-100 text-indigo-700">
              <BookOpen className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">JV</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">JV — Journal Voucher</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Record non-cash GL entries, period accruals & adjustments.</p>
        </button>
      </div>

      {/* Voucher History Register Table */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Voucher #, Party Name, Account..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9 h-9 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <select
              value={tableTypeFilter}
              onChange={e => setTableTypeFilter(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Voucher Types</option>
              <option value="BPV">BPV — Bank Payment Voucher</option>
              <option value="BRV">BRV — Bank Receipt Voucher</option>
              <option value="CPV">CPV — Cash Payment Voucher</option>
              <option value="CRV">CRV — Cash Receipt Voucher</option>
              <option value="JV">JV — Journal Voucher</option>
            </select>
          </div>

          <div className="text-xs font-medium text-slate-500">
            Showing <span className="font-bold text-slate-800">{filteredVouchers.length}</span> posted vouchers
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">VOUCHER NO</TableHead>
                <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">TYPE</TableHead>
                <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">DATE</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">BANK / CASH ACCOUNT</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PARTY NAME</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">MODE & REF</TableHead>
                <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">AMOUNT</TableHead>
                <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredVouchers.map(v => (
                <TableRow key={v.id} className="hover:bg-slate-50/80">
                  <TableCell className="py-3.5 pl-4 font-mono text-xs font-bold text-slate-900">
                    {v.voucherNumber}
                  </TableCell>
                  <TableCell className="py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getVoucherBadgeStyle(v.voucherType)}`}>
                      {v.voucherType}
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5 font-mono text-xs text-slate-600">
                    {v.date}
                  </TableCell>
                  <TableCell className="py-3.5 text-xs text-slate-700 font-medium">
                    {v.accountName}
                  </TableCell>
                  <TableCell className="py-3.5 text-xs font-bold text-slate-800">
                    {v.partyName}
                  </TableCell>
                  <TableCell className="py-3.5 text-xs text-slate-600">
                    <span className="font-semibold">{v.paymentMode}</span>
                    {v.chequeNumber && <span className="text-[11px] text-slate-400 block font-mono">{v.chequeNumber}</span>}
                  </TableCell>
                  <TableCell className="py-3.5 text-right font-mono text-xs font-bold text-slate-900">
                    {formatCurrency(v.amount, v.currency)}
                  </TableCell>
                  <TableCell className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> {v.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* EXACT CUSTOMER MANAGEMENT MODAL OVERLAY FORMAT (.overlay & .modal) */}
      {isModalOpen && (
        <div className="overlay">
          <form className="modal" style={{ maxWidth: '800px' }} onSubmit={handlePostVoucher}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">BANKING & PAYMENTS • VOUCHER DATA ENTRY</p>
                <h2>{getVoucherTitle(selectedVoucherType)}</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="form-grid">
              <label>
                Voucher Date *
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </label>

              <label>
                {selectedVoucherType.startsWith('B') ? 'Bank Account' : selectedVoucherType.startsWith('C') ? 'Cash Vault / Register' : 'Account Category'}
                <select
                  value={form.accountName}
                  onChange={e => setForm({ ...form, accountName: e.target.value })}
                >
                  {selectedVoucherType.startsWith('B') ? (
                    bankAccounts.length > 0 ? (
                      bankAccounts.map(a => <option key={a.id} value={a.name}>{a.code} — {a.name}</option>)
                    ) : (
                      <>
                        <option value="Habib Bank Limited (HBL)">11101 — Habib Bank Limited (HBL)</option>
                        <option value="Meezan Bank Limited">11102 — Meezan Bank Limited</option>
                        <option value="Standard Chartered (USD)">11103 — Standard Chartered (USD)</option>
                      </>
                    )
                  ) : selectedVoucherType.startsWith('C') ? (
                    cashAccounts.length > 0 ? (
                      cashAccounts.map(a => <option key={a.id} value={a.name}>{a.code} — {a.name}</option>)
                    ) : (
                      <>
                        <option value="Head Office Petty Cash Vault">11104 — Head Office Petty Cash Vault</option>
                        <option value="Branch Office Cash Register">11105 — Branch Office Cash Register</option>
                      </>
                    )
                  ) : (
                    <option value="General Ledger Adjustments">General Ledger Adjustments</option>
                  )}
                </select>
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                {selectedVoucherType === 'BPV' || selectedVoucherType === 'CPV' ? 'Select Vendor / Payee (from Vendor Management) *' : selectedVoucherType === 'BRV' || selectedVoucherType === 'CRV' ? 'Select Customer / Payer (from Customer Management) *' : 'Party / Account Narration *'}
                {selectedVoucherType === 'BPV' || selectedVoucherType === 'CPV' ? (
                  <select
                    value={form.partyName}
                    onChange={e => setForm({ ...form, partyName: e.target.value })}
                  >
                    {vendors.length > 0 ? (
                      vendors.map(v => <option key={v.id} value={v.name}>{v.vendorNumber ? `${v.vendorNumber} — ${v.name}` : v.name}</option>)
                    ) : (
                      <>
                        <option value="Allied Engineering Supplies Ltd">V-1001 — Allied Engineering Supplies Ltd</option>
                        <option value="Cloud Infrastructure Services USA">V-1002 — Cloud Infrastructure Services USA</option>
                        <option value="National Electric Equipment Co">V-1003 — National Electric Equipment Co</option>
                      </>
                    )}
                  </select>
                ) : selectedVoucherType === 'BRV' || selectedVoucherType === 'CRV' ? (
                  <select
                    value={form.partyName}
                    onChange={e => setForm({ ...form, partyName: e.target.value })}
                  >
                    {customers.length > 0 ? (
                      customers.map(c => <option key={c.id} value={c.name}>{c.customerNumber ? `${c.customerNumber} — ${c.name}` : c.name}</option>)
                    ) : (
                      <>
                        <option value="Apex Global Logistics USA">C-1001 — Apex Global Logistics USA</option>
                        <option value="Crescent Textile Mills Pakistan">C-1002 — Crescent Textile Mills Pakistan</option>
                      </>
                    )}
                  </select>
                ) : (
                  <input placeholder="General Ledger Adjustment" value={form.partyName} onChange={e => setForm({ ...form, partyName: e.target.value })} />
                )}
              </label>

              <label>
                Payment Mode
                <select
                  value={form.paymentMode}
                  onChange={e => setForm({ ...form, paymentMode: e.target.value })}
                >
                  <option value="Wire Transfer">Wire Transfer</option>
                  <option value="ACH">ACH Electronic</option>
                  <option value="Cheque / Pay Order">Cheque / Pay Order</option>
                  <option value="RTGS">RTGS Real-Time</option>
                  <option value="SWIFT">SWIFT International</option>
                  <option value="Cash">Physical Cash</option>
                  <option value="N/A">N/A (Journal Entry)</option>
                </select>
              </label>

              <label>
                Cheque / Reference No.
                <input
                  placeholder="e.g. CHQ-99182"
                  value={form.chequeNumber}
                  onChange={e => setForm({ ...form, chequeNumber: e.target.value })}
                />
              </label>

              <label>
                Voucher Amount *
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                />
              </label>

              <label>
                Currency
                <select
                  value={form.currency}
                  onChange={e => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="PKR">PKR (Pakistani Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </label>

              <label style={{ gridColumn: '1 / -1' }}>
                Narration / Audit Trail Description
                <input
                  placeholder="Describe transaction audit details..."
                  value={form.narration}
                  onChange={e => setForm({ ...form, narration: e.target.value })}
                />
              </label>
            </div>

{/* Modal Footer */}
            <div className="modal-footer">
              <button type="button" className="secondary btn-cancel" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="secondary btn-draft" onClick={(e) => { e.preventDefault(); saveDraft(); alert("��� Voucher draft saved successfully!"); }}>Save Draft</button>
              <button type="submit" className="primary btn-finalize">
                Finalize & Post {selectedVoucherType} Voucher
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
