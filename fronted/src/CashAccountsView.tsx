import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Search, Plus, Edit3, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import type { Entity } from './EntitySettings';

export interface CashAccountRecord {
  id: string;
  code: string;
  name: string;
  vaultLocation: string;
  custodian: string;
  currency: string;
  balance: number;
  status: 'Active' | 'Inactive';
  lastAuditedDate: string;
}

interface CashAccountsViewProps {
  activeEntityId: string;
  entities: Entity[];
}

const initialCashAccounts: CashAccountRecord[] = [
  {
    id: 'ca-1',
    code: '11104',
    name: 'Head Office Main Cash Vault',
    vaultLocation: 'Head Office Secure Vault #01',
    custodian: 'Muhammad Ali (Finance Admin)',
    currency: 'PKR',
    balance: 125000,
    status: 'Active',
    lastAuditedDate: '2026-08-08'
  },
  {
    id: 'ca-2',
    code: '11105',
    name: 'Branch Office Petty Cash Till',
    vaultLocation: 'Lahore Regional Office Cash Register',
    custodian: 'Usman Tariq (Branch Admin)',
    currency: 'PKR',
    balance: 45000,
    status: 'Active',
    lastAuditedDate: '2026-08-07'
  },
  {
    id: 'ca-3',
    code: '11106',
    name: 'USD Emergency Travel Cash Reserve',
    vaultLocation: 'Executive Safe',
    custodian: 'Finance Director',
    currency: 'USD',
    balance: 3500,
    status: 'Active',
    lastAuditedDate: '2026-08-01'
  }
];

export const CashAccountsView: React.FC<CashAccountsViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [cashAccounts, setCashAccounts] = useState<CashAccountRecord[]>(initialCashAccounts);
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashAccountRecord | null>(null);

  const [form, setForm] = useState({
    code: '11107',
    name: '',
    vaultLocation: '',
    custodian: '',
    currency: 'PKR',
    balance: '0',
    status: 'Active' as 'Active' | 'Inactive'
  });

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val);
  };

  const filtered = useMemo(() => {
    return cashAccounts.filter(acc => {
      if (query.trim()) {
        const lower = query.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(lower);
        const matchesLocation = acc.vaultLocation.toLowerCase().includes(lower);
        const matchesCustodian = acc.custodian.toLowerCase().includes(lower);
        const matchesCode = acc.code.toLowerCase().includes(lower);
        if (!matchesName && !matchesLocation && !matchesCustodian && !matchesCode) return false;
      }
      return true;
    });
  }, [cashAccounts, query]);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    if (editingAccount) {
      setCashAccounts(prev => prev.map(a => a.id === editingAccount.id ? {
        ...a,
        code: form.code,
        name: form.name,
        vaultLocation: form.vaultLocation,
        custodian: form.custodian,
        currency: form.currency,
        balance: parseFloat(form.balance) || 0,
        status: form.status,
        lastAuditedDate: new Date().toISOString().slice(0, 10)
      } : a));
    } else {
      setCashAccounts(prev => [...prev, {
        id: `ca-${Date.now()}`,
        code: form.code,
        name: form.name,
        vaultLocation: form.vaultLocation || 'Main Cash Vault',
        custodian: form.custodian || 'Cashier',
        currency: form.currency,
        balance: parseFloat(form.balance) || 0,
        status: form.status,
        lastAuditedDate: new Date().toISOString().slice(0, 10)
      }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
            <Wallet className="w-4 h-4 text-emerald-600" /> Banking & Payments
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Cash Accounts & Vaults</h1>
          <p className="text-xs text-slate-500">
            Physical cash register balances, petty cash funds, and internal vault reserves for {currentEntity?.name || 'Active Entity'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setEditingAccount(null);
              setForm({ code: `1110${cashAccounts.length + 4}`, name: '', vaultLocation: '', custodian: '', currency: 'PKR', balance: '0', status: 'Active' });
              setIsModalOpen(true);
            }}
            className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b] hover:bg-[#0f3222] shadow-xs"
          >
            <Plus className="w-4 h-4" /> Add Cash Register / Vault
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Cash Accounts</p>
              <h3 className="text-lg font-bold text-slate-900">{cashAccounts.length} Active Registers</h3>
              <p className="text-[11px] text-emerald-600 font-medium">Head Office & Regional Tills</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">PKR Petty Cash Reserves</p>
              <h3 className="text-lg font-bold text-slate-900">{formatCurrency(170000, 'PKR')}</h3>
              <p className="text-[11px] text-blue-600 font-medium font-mono">11104 & 11105 Registers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">USD Emergency Travel Reserve</p>
              <h3 className="text-lg font-bold text-slate-900">{formatCurrency(3500, 'USD')}</h3>
              <p className="text-[11px] text-indigo-600 font-medium">Executive Safe Vault</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="relative w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search cash register name, location, custodian..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9 h-9 bg-white border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">CODE</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CASH REGISTER NAME</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">VAULT LOCATION</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CUSTODIAN / CASHIER</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CURRENCY</TableHead>
              <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">ON-HAND BALANCE</TableHead>
              <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {filtered.map(acc => (
              <TableRow key={acc.id} className="hover:bg-slate-50/80">
                <TableCell className="py-3.5 pl-4 font-mono text-xs font-semibold text-slate-600">{acc.code}</TableCell>
                <TableCell className="py-3.5 font-bold text-xs text-slate-800">{acc.name}</TableCell>
                <TableCell className="py-3.5 text-xs text-slate-600">{acc.vaultLocation}</TableCell>
                <TableCell className="py-3.5 text-xs text-slate-700 font-medium">{acc.custodian}</TableCell>
                <TableCell className="py-3.5 font-mono text-xs font-bold text-slate-700">{acc.currency}</TableCell>
                <TableCell className="py-3.5 text-right font-mono text-xs font-bold text-slate-900">
                  {formatCurrency(acc.balance, acc.currency)}
                </TableCell>
                <TableCell className="py-3.5 text-right pr-4">
                  <button
                    onClick={() => {
                      setEditingAccount(acc);
                      setForm({ code: acc.code, name: acc.name, vaultLocation: acc.vaultLocation, custodian: acc.custodian, currency: acc.currency, balance: String(acc.balance), status: acc.status });
                      setIsModalOpen(true);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isModalOpen && (
        <div className="overlay">
          <form className="modal" onSubmit={handleSaveAccount} >
            <div className="modal-head">
              <div>
                <p className="eyebrow">BANKING & PAYMENTS</p>
                <h2>{editingAccount ? 'Edit Cash Account' : 'Add Cash Register'}</h2>
              </div>
              <button type="button" className="close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="form-grid">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">GL Code</label>
                  <Input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="h-9 text-xs font-mono" />
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
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Cash Register / Vault Name</label>
                <Input required placeholder="e.g. Head Office Petty Cash Vault" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="h-9 text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Vault Location</label>
                  <Input placeholder="e.g. Head Office Safe #1" value={form.vaultLocation} onChange={e => setForm({ ...form, vaultLocation: e.target.value })} className="h-9 text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Custodian / Cashier</label>
                  <Input placeholder="e.g. Muhammad Ali" value={form.custodian} onChange={e => setForm({ ...form, custodian: e.target.value })} className="h-9 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Opening Cash Balance</label>
                <Input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} className="h-9 text-xs font-mono" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary" onClick={(e) => { e.preventDefault(); alert("Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary">Save Cash Account</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
