import React, { useState, useMemo, useRef } from 'react';
import { useCoaStore } from './stores';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Edit3, Download, Upload, Plus, Trash2, ChevronDown, ChevronRight, Lock } from 'lucide-react';

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
  isSystem: boolean;
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
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
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

  // Helper to calculate roll-up balances recursively
  const getRollupBalance = (account: Account): number => {
    let sum = account.openingBalance;
    const children = accounts.filter(a => a.parentId === account.id);
    for (const child of children) {
      sum += getRollupBalance(child);
    }
    return sum;
  };

  const isFiltering = !!query.trim() || selectedType !== 'All';

  // Process list in case filtering is active (flat view)
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
    }).sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, query, selectedType, showDeactivated]);

  // Construct tree structures per category when NOT filtering
  const treeCategories = useMemo(() => {
    if (isFiltering) return [];

    const categories = [
      { name: 'Assets', typeKeys: ['Asset', 'ContraAsset'] },
      { name: 'Liabilities', typeKeys: ['Liability', 'ContraLiability'] },
      { name: 'Equity', typeKeys: ['Equity', 'ContraEquity'] },
      { name: 'Revenue', typeKeys: ['Revenue', 'ContraRevenue'] },
      { name: 'Expenses', typeKeys: ['Expense', 'ContraExpense'] }
    ];

    return categories.map(cat => {
      // Filter top level accounts for this category
      const topLevel = accounts.filter(a => 
        cat.typeKeys.includes(a.type) && 
        (!a.parentId || !accounts.some(parent => parent.id === a.parentId)) &&
        (showDeactivated || a.status === 'Active')
      ).sort((a, b) => a.code.localeCompare(b.code));

      // Flatten tree helper in preorder traversal
      const flattened: { account: Account; depth: number; hasChildren: boolean }[] = [];
      const traverse = (nodeList: Account[], depth: number) => {
        for (const node of nodeList) {
          const children = accounts.filter(a => a.parentId === node.id && (showDeactivated || a.status === 'Active'));
          flattened.push({
            account: node,
            depth,
            hasChildren: children.length > 0
          });

          if (!collapsedIds[node.id]) {
            const sortedChildren = [...children].sort((a, b) => a.code.localeCompare(b.code));
            traverse(sortedChildren, depth + 1);
          }
        }
      };

      traverse(topLevel, 0);

      return {
        name: cat.name,
        items: flattened
      };
    }).filter(c => c.items.length > 0);
  }, [accounts, collapsedIds, showDeactivated, isFiltering]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const listToExport = isFiltering ? filteredAccounts : accounts;
    const headers = ['ACCOUNT NUMBER', 'ACCOUNT NAME', 'TYPE', 'SUB TYPE', 'CURRENCY', 'BALANCE', 'STATUS', 'SYSTEM_PROTECTED'];
    const rows = listToExport.map(a => [
      `"${a.code}"`,
      `"${a.name}"`,
      `"${a.type}"`,
      `"${getSubtype(a.code, a.type)}"`,
      '"USD"',
      a.openingBalance,
      `"${a.status}"`,
      a.isSystem ? '"YES"' : '"NO"'
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
          const isSystem = parts[7] === 'YES';

          try {
            await useCoaStore.getState().saveAccount({
              code,
              name,
              type,
              openingBalance,
              parentId: null,
              reconciliationEnabled: false,
              isSystem
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
    if (window.confirm('Warning: Clearing all accounts will reset the system state. Only non-system accounts should normally be cleaned. Do you want to proceed?')) {
      try {
        await useCoaStore.getState().clearAllAccounts();
        if (reloadAccounts) reloadAccounts();
      } catch {
        alert('Could not clear accounts.');
      }
    }
  };

  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderRow = (acc: Account, depth = 0, hasChildren = false) => {
    const isDeactivated = acc.status === 'Inactive';
    const subType = getSubtype(acc.code, acc.type);
    const parentAccount = accounts.find(x => x.id === acc.parentId);
    const accountGroup = parentAccount ? `${parentAccount.code} ${parentAccount.name}` : '— Top-Level Group —';
    const balance = isFiltering ? acc.openingBalance : getRollupBalance(acc);

    return (
      <TableRow
        key={acc.id}
        className={`hover:bg-slate-50/80 transition-colors ${isDeactivated ? 'bg-slate-50/30' : ''}`}
      >
        {/* Account Number */}
        <TableCell className="py-3 pl-4 font-mono text-xs font-medium text-slate-600">
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: depth * 20 }}>
            {hasChildren && !isFiltering ? (
              <button 
                onClick={(e) => toggleCollapse(acc.id, e)} 
                className="p-0.5 mr-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer"
              >
                {collapsedIds[acc.id] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            ) : (
              !isFiltering && <span style={{ width: 20, display: 'inline-block' }} />
            )}
            <span>{acc.code}</span>
          </div>
        </TableCell>

        {/* Account Name */}
        <TableCell className="py-3 font-semibold text-xs text-slate-700">
          <div className="flex items-center gap-1.5">
            <span>{acc.name}</span>
            {acc.isSystem && (
              <span className="inline-flex items-center" title="Protected System Account">
                <Lock className="w-3 h-3 text-amber-500" />
              </span>
            )}
          </div>
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
          {formatCurrency(balance, 'USD')}
          {hasChildren && !isFiltering && (
            <span style={{ fontSize: 9, display: 'block', color: '#94a3b8' }}>(rollup)</span>
          )}
        </TableCell>

        {/* Status matching soft pill badges */}
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
              title={acc.isSystem ? "Edit (Critical fields locked)" : "Edit Account"}
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            
            {acc.isSystem ? (
              <span className="text-[10px] font-semibold text-amber-600 px-2 py-0.5 bg-amber-50 rounded border border-amber-200/40 select-none">
                System Lock
              </span>
            ) : (
              <button
                onClick={() => status(acc)}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
              >
                {isDeactivated ? 'Activate' : 'Deactivate'}
              </button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
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

      {/* Main Accounts Table Layout */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-48 text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-4">ACCOUNT NUMBER</TableHead>
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
            {isFiltering ? (
              // Flat View when filtering or searching
              filteredAccounts.map(acc => renderRow(acc, 0, false))
            ) : (
              // Collapsible Tree View per Major Category when no filters active
              treeCategories.map(cat => (
                <React.Fragment key={cat.name}>
                  {/* Category Header Banner */}
                  <TableRow className="bg-slate-50/60 hover:bg-slate-50/60 font-semibold border-t border-b border-slate-200/80">
                    <TableCell colSpan={8} className="py-2.5 pl-4 text-xs font-bold text-slate-800">
                      {cat.name} <span className="font-normal text-slate-400 text-[11px]">({cat.items.length} {cat.items.length === 1 ? 'account' : 'accounts'})</span>
                    </TableCell>
                  </TableRow>

                  {/* Collapsible tree rows */}
                  {cat.items.map(item => renderRow(item.account, item.depth, item.hasChildren))}
                </React.Fragment>
              ))
            )}

            {/* Empty State when no accounts match */}
            {((isFiltering && filteredAccounts.length === 0) || (!isFiltering && treeCategories.length === 0)) && (
              <TableRow>
                <TableCell colSpan={8} className="py-16 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="text-sm font-medium text-slate-600">No accounts found</p>
                    <p className="text-xs text-slate-400">Adjust your search query or click "+ Add Account" to manually add an account.</p>
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
