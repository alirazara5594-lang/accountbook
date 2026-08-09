import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Search, Download, Plus, CheckCircle2, AlertCircle, Edit3, FileText, Globe } from 'lucide-react';
import type { Entity } from './EntitySettings';

export interface BankAccountRecord {
  id: string;
  code: string;
  name: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  iban: string;
  swift: string;
  currency: string;
  balance: number;
  status: 'Active' | 'Inactive';
  reconciledStatus: 'Reconciled' | 'Pending Sync' | 'Needs Attention';
  connectionType: 'Live Feed API' | 'Manual Import';
  updatedAt: string;
}

interface BankAccountsViewProps {
  activeEntityId: string;
  entities: Entity[];
}

const initialBankAccountsData: BankAccountRecord[] = [
  {
    id: 'ba-1',
    code: '11101',
    name: 'Habib Bank Limited — Main Operating',
    bankName: 'Habib Bank Limited',
    branchName: 'Corporate Branch, I.I. Chundrigar Rd',
    accountNumber: '00012345678901',
    iban: 'PK12HABB00012345678901',
    swift: 'HABBPKKA',
    currency: 'PKR',
    balance: 4500000,
    status: 'Active',
    reconciledStatus: 'Reconciled',
    connectionType: 'Live Feed API',
    updatedAt: '2026-08-09'
  },
  {
    id: 'ba-2',
    code: '11102',
    name: 'Meezan Bank — Corporate Islamic Account',
    bankName: 'Meezan Bank Limited',
    branchName: 'Islamic Banking Center, Gulberg',
    accountNumber: '00098765432102',
    iban: 'PK45MEZN00098765432102',
    swift: 'MEZNPKKA',
    currency: 'PKR',
    balance: 1850000,
    status: 'Active',
    reconciledStatus: 'Pending Sync',
    connectionType: 'Live Feed API',
    updatedAt: '2026-08-08'
  },
  {
    id: 'ba-3',
    code: '11103',
    name: 'Standard Chartered — Global USD Trade Account',
    bankName: 'Standard Chartered Bank',
    branchName: 'Main Commercial Hub, NY',
    accountNumber: 'SCB-USD-992144',
    iban: 'US89SCBL000992144',
    swift: 'SCBLUS33',
    currency: 'USD',
    balance: 62500,
    status: 'Active',
    reconciledStatus: 'Reconciled',
    connectionType: 'Live Feed API',
    updatedAt: '2026-08-09'
  },
  {
    id: 'ba-4',
    code: '11104',
    name: 'Emirates NBD — UAE Dirham Treasury',
    bankName: 'Emirates NBD',
    branchName: 'Dubai Financial Center (DIFC)',
    accountNumber: 'ENBD-AED-774120',
    iban: 'AE210330000011223344556',
    swift: 'EBILAEAD',
    currency: 'AED',
    balance: 48000,
    status: 'Active',
    reconciledStatus: 'Reconciled',
    connectionType: 'Manual Import',
    updatedAt: '2026-08-05'
  }
];

export const BankAccountsView: React.FC<BankAccountsViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>(initialBankAccountsData);
  const [query, setQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountRecord | null>(null);

  const [form, setForm] = useState({
    code: '11105',
    name: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    iban: '',
    swift: '',
    currency: 'PKR',
    openingBalance: '0',
    status: 'Active' as 'Active' | 'Inactive',
    connectionType: 'Live Feed API' as 'Live Feed API' | 'Manual Import'
  });

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
  };

  // Filtered Accounts
  const filtered = useMemo(() => {
    return bankAccounts.filter(acc => {
      if (selectedCurrency !== 'All' && acc.currency !== selectedCurrency) return false;
      if (selectedStatus !== 'All' && acc.status !== selectedStatus) return false;
      if (query.trim()) {
        const lower = query.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(lower);
        const matchesBank = acc.bankName.toLowerCase().includes(lower);
        const matchesNum = acc.accountNumber.toLowerCase().includes(lower);
        const matchesCode = acc.code.toLowerCase().includes(lower);
        const matchesIban = acc.iban.toLowerCase().includes(lower);
        if (!matchesName && !matchesBank && !matchesNum && !matchesCode && !matchesIban) return false;
      }
      return true;
    });
  }, [bankAccounts, query, selectedCurrency, selectedStatus]);

  // Summaries
  const totalPKR = useMemo(() => {
    return bankAccounts.filter(a => a.currency === 'PKR').reduce((sum, a) => sum + a.balance, 0);
  }, [bankAccounts]);

  const totalUSD = useMemo(() => {
    return bankAccounts.filter(a => a.currency === 'USD').reduce((sum, a) => sum + a.balance, 0);
  }, [bankAccounts]);

  const openCreateModal = () => {
    setEditingAccount(null);
    setForm({
      code: `1110${bankAccounts.length + 1}`,
      name: '',
      bankName: '',
      branchName: '',
      accountNumber: '',
      iban: '',
      swift: '',
      currency: 'PKR',
      openingBalance: '0',
      status: 'Active',
      connectionType: 'Live Feed API'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (acc: BankAccountRecord) => {
    setEditingAccount(acc);
    setForm({
      code: acc.code,
      name: acc.name,
      bankName: acc.bankName,
      branchName: acc.branchName,
      accountNumber: acc.accountNumber,
      iban: acc.iban,
      swift: acc.swift,
      currency: acc.currency,
      openingBalance: String(acc.balance),
      status: acc.status,
      connectionType: acc.connectionType
    });
    setIsModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.bankName) {
      alert('Please fill in Account Name and Bank Name.');
      return;
    }

    if (editingAccount) {
      setBankAccounts(prev => prev.map(a => a.id === editingAccount.id ? {
        ...a,
        code: form.code,
        name: form.name,
        bankName: form.bankName,
        branchName: form.branchName,
        accountNumber: form.accountNumber,
        iban: form.iban,
        swift: form.swift,
        currency: form.currency,
        balance: parseFloat(form.openingBalance) || 0,
        status: form.status,
        connectionType: form.connectionType,
        updatedAt: new Date().toISOString().slice(0, 10)
      } : a));
      alert(`Bank Account "${form.name}" updated successfully!`);
    } else {
      const newAcc: BankAccountRecord = {
        id: `ba-${Date.now()}`,
        code: form.code,
        name: form.name,
        bankName: form.bankName,
        branchName: form.branchName,
        accountNumber: form.accountNumber,
        iban: form.iban,
        swift: form.swift,
        currency: form.currency,
        balance: parseFloat(form.openingBalance) || 0,
        status: form.status,
        reconciledStatus: 'Reconciled',
        connectionType: form.connectionType,
        updatedAt: new Date().toISOString().slice(0, 10)
      };
      setBankAccounts(prev => [...prev, newAcc]);
      alert(`Bank Account "${form.name}" created successfully!`);
    }

    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['GL CODE', 'BANK ACCOUNT NAME', 'BANK INSTITUTION', 'BRANCH', 'ACCOUNT NUMBER', 'IBAN', 'SWIFT', 'CURRENCY', 'BALANCE', 'STATUS'];
    const rows = filtered.map(a => [
      `"${a.code}"`,
      `"${a.name}"`,
      `"${a.bankName}"`,
      `"${a.branchName}"`,
      `"${a.accountNumber}"`,
      `"${a.iban}"`,
      `"${a.swift}"`,
      `"${a.currency}"`,
      a.balance,
      `"${a.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bank_accounts_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      {/* Top Header & Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Building2 className="w-4 h-4 text-emerald-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Bank Accounts Summary</h1>
          <p className="text-xs text-slate-500">
            Commercial bank account balances, IBAN & SWIFT records, and live account management for {currentEntity?.name || 'Active Entity'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b] hover:bg-[#0f3222] shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Bank Account
          </Button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Commercial Bank Accounts</p>
              <h3 className="text-lg font-bold text-slate-900">{bankAccounts.length} Active Accounts</h3>
              <p className="text-[11px] text-emerald-600 font-medium">Commercial & Corporate Banks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">PKR Liquid Reserves</p>
              <h3 className="text-lg font-bold text-slate-900">{formatCurrency(totalPKR, 'PKR')}</h3>
              <p className="text-[11px] text-blue-600 font-medium">HBL & Meezan Bank Accounts</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">USD Foreign Reserves</p>
              <h3 className="text-lg font-bold text-slate-900">{formatCurrency(totalUSD, 'USD')}</h3>
              <p className="text-[11px] text-indigo-600 font-medium">Standard Chartered US Trade</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Statement Reconciled Status</p>
              <h3 className="text-lg font-bold text-slate-900">3 of 4 Reconciled</h3>
              <p className="text-[11px] text-amber-600 font-medium">1 Account Pending Sync</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Filter Bar matching COA layout */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl shadow-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Bank Name, IBAN, Code..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 h-9 bg-white border border-slate-200 rounded-lg text-xs"
            />
          </div>

          {/* Currency Filter Dropdown */}
          <select
            value={selectedCurrency}
            onChange={e => setSelectedCurrency(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Currencies</option>
            <option value="PKR">PKR (Pakistani Rupee)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="GBP">GBP (British Pound)</option>
            <option value="AED">AED (UAE Dirham)</option>
            <option value="SAR">SAR (Saudi Riyal)</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> bank accounts
        </div>
      </div>

      {/* Main Bank Accounts Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">GL CODE</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">BANK ACCOUNT NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">INSTITUTION & BRANCH</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ACCOUNT NUMBER / IBAN</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SWIFT / BIC</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CURRENCY</TableHead>
              <TableHead className="w-40 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">BOOK BALANCE</TableHead>
              <TableHead className="w-32 text-[11px] font-bold text-slate-500 uppercase tracking-wider">RECONCILED</TableHead>
              <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.map(acc => (
              <TableRow key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                <TableCell className="py-3.5 pl-4 font-mono text-xs font-semibold text-slate-600">
                  {acc.code}
                </TableCell>
                <TableCell className="py-3.5 font-bold text-xs text-slate-800">
                  {acc.name}
                </TableCell>
                <TableCell className="py-3.5 text-xs text-slate-600">
                  <div className="font-medium text-slate-800">{acc.bankName}</div>
                  <div className="text-[11px] text-slate-400">{acc.branchName}</div>
                </TableCell>
                <TableCell className="py-3.5 font-mono text-xs text-slate-600">
                  <div>{acc.accountNumber}</div>
                  {acc.iban && <div className="text-[10px] text-slate-400">{acc.iban}</div>}
                </TableCell>
                <TableCell className="py-3.5 font-mono text-xs font-semibold text-slate-600">
                  {acc.swift}
                </TableCell>
                <TableCell className="py-3.5 font-mono text-xs font-bold text-slate-700">
                  {acc.currency}
                </TableCell>
                <TableCell className="py-3.5 text-right font-mono text-xs font-bold text-slate-900">
                  {formatCurrency(acc.balance, acc.currency)}
                </TableCell>
                <TableCell className="py-3.5">
                  {acc.reconciledStatus === 'Reconciled' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100/80 text-emerald-800 border border-emerald-200/60">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Reconciled
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100/80 text-amber-800 border border-amber-200/60">
                      <AlertCircle className="w-3 h-3 text-amber-600" /> Pending Sync
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-3.5 text-right pr-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                      title="Edit Bank Account"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => alert(`Opening ledger for ${acc.name}...`)}
                      className="h-7 text-[11px] font-medium text-slate-700 px-2 bg-white border-slate-200 hover:bg-slate-50"
                    >
                      Ledger
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-sm font-medium text-slate-600">No bank accounts found</p>
                    <p className="text-xs text-slate-400">Click "+ Add Bank Account" to create your first bank account record.</p>
                    <Button
                      size="sm"
                      onClick={openCreateModal}
                      className="mt-2 h-8 text-xs bg-[#143e2b] text-white hover:bg-[#0f3222]"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Bank Account
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal: Create / Edit Bank Account */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 w-full max-w-lg shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">1. GL Account Code</label>
                  <Input
                    required
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={e => setForm({ ...form, currency: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700"
                  >
                    <option value="PKR">PKR (Pakistani Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                    <option value="SAR">SAR (Saudi Riyal)</option>
                    <option value="CAD">CAD (Canadian Dollar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">2. Bank Account Name</label>
                <Input
                  required
                  placeholder="e.g. Habib Bank Limited — Main Operating"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">3. Bank / Institution Name</label>
                  <Input
                    required
                    placeholder="e.g. Habib Bank Limited"
                    value={form.bankName}
                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">4. Branch Name & City</label>
                  <Input
                    placeholder="e.g. Corporate Branch, Karachi"
                    value={form.branchName}
                    onChange={e => setForm({ ...form, branchName: e.target.value })}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">5. Account Number</label>
                  <Input
                    required
                    placeholder="00012345678901"
                    value={form.accountNumber}
                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">6. SWIFT / BIC Code</label>
                  <Input
                    placeholder="HABBPKKA"
                    value={form.swift}
                    onChange={e => setForm({ ...form, swift: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">7. IBAN (International Bank Account Number)</label>
                <Input
                  placeholder="PK12HABB00012345678901"
                  value={form.iban}
                  onChange={e => setForm({ ...form, iban: e.target.value })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">8. Opening Balance</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={form.openingBalance}
                    onChange={e => setForm({ ...form, openingBalance: e.target.value })}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Integration Mode</label>
                  <select
                    value={form.connectionType}
                    onChange={e => setForm({ ...form, connectionType: e.target.value as any })}
                    className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Live Feed API">Live Feed API</option>
                    <option value="Manual Import">Manual Import</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" size="sm" className="bg-[#143e2b] text-white hover:bg-[#0f3222]">Save Bank Account</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
