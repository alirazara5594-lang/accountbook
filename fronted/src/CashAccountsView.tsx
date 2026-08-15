import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wallet, Search, Plus, Edit3, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import type { Entity } from './EntitySettings';
import { apiClient } from './api/client';

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

interface CashAccountDto {
  id: string;
  code: string;
  name: string;
  currency: string;
  status: string;
  openingBalance: number;
  balance: number;
  reconciliationEnabled: boolean;
  bankName: string | null;
  updatedAt: string;
}

export const CashAccountsView: React.FC<CashAccountsViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find(e => e.id === activeEntityId);
  const [cashAccounts, setCashAccounts] = useState<CashAccountRecord[]>([]);
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashAccountRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const loadCashAccounts = async () => {
    setLoading(true);
    try {
      const data = await apiClient<CashAccountDto[]>('/cash-accounts');
      setCashAccounts(data.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        vaultLocation: '',
        custodian: '',
        currency: a.currency,
        balance: a.balance,
        status: a.status as 'Active' | 'Inactive',
        lastAuditedDate: (a.updatedAt || '').slice(0, 10),
      })));
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load cash accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCashAccounts(); }, [activeEntityId]);

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

  const exportHeaders = ['GL CODE', 'CASH ACCOUNT', 'VAULT LOCATION', 'CUSTODIAN', 'CURRENCY', 'BALANCE', 'STATUS', 'LAST AUDITED'];
  const exportRows = filtered.map(a => [
    a.code, a.name, a.vaultLocation, a.custodian, a.currency, a.balance, a.status, a.lastAuditedDate,
  ]);
  const totalBalance = filtered.reduce((s, a) => s + (a.balance || 0), 0);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;

    try {
      if (editingAccount) {
        alert('Editing cash accounts is handled via the Chart of Accounts. Please update the COA account directly.');
      } else {
        await apiClient('/cash-accounts', {
          method: 'POST',
          body: {
            name: form.name,
            code: form.code,
            currency: form.currency,
            openingBalance: parseFloat(form.balance) || 0,
            reconciliationEnabled: true,
            companyId: activeEntityId || undefined,
          },
        });
      }
      setIsModalOpen(false);
      await loadCashAccounts();
    } catch (err: any) {
      alert(err?.data?.error || err?.message || 'Failed to save cash account.');
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" /> Cash Accounts & Vaults
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Physical cash register balances, petty cash funds, and internal vault reserves for {currentEntity?.name || 'Active Entity'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DataToolbar
            exportFileName="cash-accounts"
            exportSheetName="Cash Accounts"
            exportTitle="Cash Accounts & Vaults"
            exportSubtitle={`Physical cash register balances for ${currentEntity?.name || 'Active Entity'}.`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            exportTotals={[{ label: 'Total Cash Balance', value: totalBalance }]}
            onRefresh={loadCashAccounts}
          />
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

      {loading && <p className="text-xs text-slate-500">Loading cash accounts…</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total Cash Accounts</p>
              <h3 className="text-base font-bold text-slate-900">{cashAccounts.length} Active Registers</h3>
              <p className="text-[10px] text-emerald-600 font-medium">Head Office & Regional Tills</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">PKR Petty Cash Reserves</p>
              <h3 className="text-base font-bold text-slate-900">{formatCurrency(cashAccounts.filter(a => a.currency === 'PKR').reduce((s, a) => s + a.balance, 0), 'PKR')}</h3>
              <p className="text-[10px] text-blue-600 font-medium font-mono">On-hand registers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-3 flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Foreign Currency Reserve</p>
              <h3 className="text-base font-bold text-slate-900">{formatCurrency(cashAccounts.filter(a => a.currency !== 'PKR').reduce((s, a) => s + a.balance, 0), 'USD')}</h3>
              <p className="text-[10px] text-indigo-600 font-medium">Non-PKR vaults</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
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
              <button type="button" className="secondary btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="secondary btn-draft" onClick={(e) => { e.preventDefault(); alert("��� Draft saved locally"); }}>Save Draft</button>
              <button type="submit" className="primary btn-finalize">Save Cash Account</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
