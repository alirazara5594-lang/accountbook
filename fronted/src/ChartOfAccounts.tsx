import React, { useState, useMemo, useRef } from 'react';
import { useCoaStore } from './stores';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Edit3, Download, Upload, Plus, Trash2 } from 'lucide-react';

type AccountType =
  | 'Asset'
  | 'Liability'
  | 'Equity'
  | 'Revenue'
  | 'Expense'
  | 'ContraAsset'
  | 'ContraLiability'
  | 'ContraEquity'
  | 'ContraRevenue'
  | 'ContraExpense';

interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  status: 'Active' | 'Inactive';
  openingBalance: number;
  reconciliationEnabled: boolean;
  ifrsTag?: string;
  gaapTag?: string;
  updatedAt: string;
}

interface ChartOfAccountsProps {
  accounts: Account[];
  edit: (a: Account) => void;
  status: (a: Account) => void;
  openCreate: () => void;
  setParentIdForNew: (parentId: string) => void;
  reloadAccounts?: () => void;
}

const formatCurrency = (val: number, currency = 'USD') => {
  const formatted = new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Math.abs(val));
  return val < 0 ? `-${formatted}` : formatted;
};

export const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({
  accounts,
  edit,
  status,
  openCreate,
  setParentIdForNew,
  reloadAccounts
}) => {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showDeactivated, setShowDeactivated] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getSubtype = (code: string, type: string) => {
    const num = parseInt(code, 10);
    if (!isNaN(num)) {
      if (num >= 10000 && num <= 14999) return 'Current Asset';
      if (num >= 15000 && num <= 19999) return 'Fixed Asset';
      if (num >= 20000 && num <= 24999) return 'Current Liability';
      if (num >= 25000 && num <= 29999) return 'Long-Term Liability';
      if (num >= 30000 && num <= 39999) return 'Equity';
      if (num >= 40000 && num <= 49999) return 'Operating Revenue';
      if (num >= 50000 && num <= 59999) return 'Cost of Sales';
      if (num >= 60000 && num <= 79999) return 'Operating Expense';
      if (num >= 80000 && num <= 89999) return 'Other Income/Expense';
    }
    if (type.includes('Asset')) return 'Cash & Assets';
    if (type.includes('Liability')) return 'Current Liability';
    if (type.includes('Equity')) return 'Equity';
    if (type.includes('Revenue')) return 'Operating Revenue';
    return 'Operating Expense';
  };

  // Filter accounts based on query, selected major type, and showDeactivated toggle
  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      // Deactivated filter
      if (!showDeactivated && a.status === 'Inactive') return false;

      // Major type filter
      if (selectedType !== 'All') {
        const baseType = a.type.replace('Contra', '');
        if (baseType !== selectedType) return false;
      }

      // Search query
      if (query.trim()) {
        const lower = query.toLowerCase();
        const matchesCode = a.code.toLowerCase().includes(lower);
        const matchesName = a.name.toLowerCase().includes(lower);
        const matchesType = a.type.toLowerCase().includes(lower);
        if (!matchesCode && !matchesName && !matchesType) return false;
      }

      return true;
    });
  }, [accounts, query, selectedType, showDeactivated]);

  // Group accounts by Major Category for section header banners (Assets, Liabilities, Equity, Revenue, Expense)
  const groupedCategories = useMemo(() => {
    const categories: { name: string; typeKey: string; items: Account[] }[] = [
      { name: 'Assets', typeKey: 'Asset', items: [] },
      { name: 'Liabilities', typeKey: 'Liability', items: [] },
      { name: 'Equity', typeKey: 'Equity', items: [] },
      { name: 'Revenue', typeKey: 'Revenue', items: [] },
      { name: 'Expenses', typeKey: 'Expense', items: [] }
    ];

    filteredAccounts.forEach(acc => {
      if (acc.type === 'Asset' || acc.type === 'ContraAsset') {
        categories[0].items.push(acc);
      } else if (acc.type === 'Liability' || acc.type === 'ContraLiability') {
        categories[1].items.push(acc);
      } else if (acc.type === 'Equity' || acc.type === 'ContraEquity') {
        categories[2].items.push(acc);
      } else if (acc.type === 'Revenue' || acc.type === 'ContraRevenue') {
        categories[3].items.push(acc);
      } else {
        categories[4].items.push(acc);
      }
    });

    return categories.filter(c => c.items.length > 0 || (selectedType === 'All' && !query));
  }, [filteredAccounts, selectedType, query]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['ACCOUNT NUMBER', 'ACCOUNT NAME', 'TYPE', 'SUB TYPE', 'CURRENCY', 'BALANCE', 'STATUS'];
    const rows = filteredAccounts.map(a => [
      `"${a.code}"`,
      `"${a.name}"`,
      `"${a.type}"`,
      `"${getSubtype(a.code, a.type)}"`,
      '"USD"',
      a.openingBalance,
      `"${a.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `chart_of_accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Trigger
  const handleImportCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) return;

      let createdCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 2) {
          const code = parts[0];
          const name = parts[1];
          const type = (parts[2] || 'Asset') as AccountType;
          const openingBalance = parseFloat(parts[5]) || 0;

          try {
            await useCoaStore.getState().saveAccount({
              code,
              name,
              type,
              openingBalance,
              parentId: null,
              reconciliationEnabled: false
            });
            createdCount++;
          } catch (err) {
            console.error('Import error for row', i, err);
          }
        }
      }

      alert(`Successfully imported ${createdCount} accounts from CSV!`);
      if (reloadAccounts) reloadAccounts();
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all accounts? You will be able to manually add your accounts one by one.')) {
      try {
        await useCoaStore.getState().clearAllAccounts();
        if (reloadAccounts) reloadAccounts();
      } catch {
        alert('Could not clear accounts.');
      }
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Hidden file input for CSV Import */}
      <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileUpload} className="hidden" />

      {/* Top Toolbar matching screenshot exactly */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl shadow-xs">
        {/* Left Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by code or name..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 h-9 bg-white border border-slate-200 rounded-lg text-xs font-normal placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400"
            />
          </div>

          {/* Type Filter Dropdown */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-normal text-slate-700 outline-none cursor-pointer focus:border-slate-400"
          >
            <option value="All">All Types</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expense</option>
          </select>

          {/* Show Deactivated Checkbox */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDeactivated}
              onChange={e => setShowDeactivated(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            Show Deactivated
          </label>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 px-3 gap-1.5 text-xs font-medium text-slate-700 bg-white border-slate-200 hover:bg-slate-50 rounded-lg"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImportCSVClick}
            className="h-9 px-3 gap-1.5 text-xs font-medium text-slate-700 bg-white border-slate-200 hover:bg-slate-50 rounded-lg"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            Import CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="h-9 px-3 gap-1.5 text-xs font-medium text-rose-600 bg-white border-rose-200 hover:bg-rose-50 rounded-lg"
            title="Clear pre-seeded accounts to add manually"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            Clear Accounts
          </Button>

          {/* Primary Dark Green Add Account Button */}
          <Button
            size="sm"
            onClick={() => { setParentIdForNew(''); openCreate(); }}
            className="h-9 px-4 gap-1.5 text-xs font-semibold text-white bg-[#143e2b] hover:bg-[#0f3222] rounded-lg shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Main Accounts Table Layout matching picture */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-40 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">ACCOUNT NUMBER</TableHead>
              <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ACCOUNT NAME</TableHead>
              <TableHead className="w-36 text-[11px] font-bold text-slate-500 uppercase tracking-wider">SUB TYPE</TableHead>
              <TableHead className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-wider">ACCOUNT GROUP</TableHead>
              <TableHead className="w-24 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CURRENCY</TableHead>
              <TableHead className="w-32 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">BALANCE</TableHead>
              <TableHead className="w-28 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</TableHead>
              <TableHead className="w-36 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider pr-4">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {groupedCategories.map(cat => {
              if (cat.items.length === 0) return null;
              return (
                <React.Fragment key={cat.name}>
                  {/* Category Group Header Banner matching screenshot (e.g. Assets (22 accounts)) */}
                  <TableRow className="bg-slate-50/60 hover:bg-slate-50/60 font-semibold border-t border-b border-slate-200/80">
                    <TableCell colSpan={8} className="py-2.5 pl-4 text-xs font-bold text-slate-800">
                      {cat.name} <span className="font-normal text-slate-400 text-[11px]">({cat.items.length} {cat.items.length === 1 ? 'account' : 'accounts'})</span>
                    </TableCell>
                  </TableRow>

                  {/* Individual Account Rows */}
                  {cat.items.map(acc => {
                    const isDeactivated = acc.status === 'Inactive';
                    const subType = getSubtype(acc.code, acc.type);
                    const parentAccount = accounts.find(x => x.id === acc.parentId);
                    const accountGroup = parentAccount ? `${parentAccount.code} ${parentAccount.name}` : '— Top-Level Group —';

                    return (
                      <TableRow
                        key={acc.id}
                        className={`hover:bg-slate-50/80 transition-colors ${isDeactivated ? 'bg-slate-50/30' : ''}`}
                      >
                        {/* Account Number */}
                        <TableCell className="py-3 pl-4 font-mono text-xs font-medium text-slate-600">
                          {acc.code}
                        </TableCell>

                        {/* Account Name */}
                        <TableCell className="py-3 font-semibold text-xs text-slate-700">
                          {acc.name}
                        </TableCell>

                        {/* Sub Type */}
                        <TableCell className="py-3 text-xs text-slate-500">
                          {subType}
                        </TableCell>

                        {/* Account Group */}
                        <TableCell className="py-3 text-xs text-slate-600 font-medium">
                          {accountGroup}
                        </TableCell>

                        {/* Currency */}
                        <TableCell className="py-3 text-xs font-mono text-slate-500">
                          USD
                        </TableCell>

                        {/* Balance */}
                        <TableCell className="py-3 text-right font-mono text-xs font-medium text-slate-700">
                          {formatCurrency(acc.openingBalance, 'USD')}
                        </TableCell>

                        {/* Status matching soft pill badges from picture */}
                        <TableCell className="py-3">
                          {isDeactivated ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100/80 text-rose-700 border border-rose-200/60">
                              Deactivated
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100/80 text-emerald-800 border border-emerald-200/60">
                              Active
                            </span>
                          )}
                        </TableCell>

                        {/* Row Actions */}
                        <TableCell className="py-3 text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => edit(acc)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                              title="Edit Account"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => status(acc)}
                              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
                            >
                              {isDeactivated ? 'Activate' : 'Deactivate'}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* Empty State when no accounts match */}
            {filteredAccounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-sm font-medium text-slate-600">No accounts in Chart of Accounts</p>
                    <p className="text-xs text-slate-400">Click "+ Add Account" to manually add your first parent or child account.</p>
                    <Button
                      size="sm"
                      onClick={() => { setParentIdForNew(''); openCreate(); }}
                      className="mt-2 h-8 text-xs bg-[#143e2b] text-white hover:bg-[#0f3222]"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Account
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
