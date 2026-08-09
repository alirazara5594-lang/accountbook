import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderTree, Search, Edit3, ShieldAlert, CheckCircle2, FileSpreadsheet, PlusCircle } from 'lucide-react';

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
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

export const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({
  accounts,
  edit,
  status,
  openCreate,
  setParentIdForNew
}) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'balance-sheet' | 'income-statement'>('all');
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});

  // Filter accounts by tab selection
  const tabFilteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      const isBalanceSheet =
        a.type === 'Asset' ||
        a.type === 'Liability' ||
        a.type === 'Equity' ||
        a.type === 'ContraAsset' ||
        a.type === 'ContraLiability' ||
        a.type === 'ContraEquity';

      if (activeTab === 'balance-sheet') return isBalanceSheet;
      if (activeTab === 'income-statement') return !isBalanceSheet;
      return true;
    });
  }, [accounts, activeTab]);

  // Search filter
  const filtered = useMemo(() => {
    if (!query.trim()) return tabFilteredAccounts;
    const lower = query.toLowerCase();
    return tabFilteredAccounts.filter(
      a =>
        a.code.toLowerCase().includes(lower) ||
        a.name.toLowerCase().includes(lower) ||
        a.type.toLowerCase().includes(lower) ||
        (a.ifrsTag && a.ifrsTag.toLowerCase().includes(lower))
    );
  }, [tabFilteredAccounts, query]);

  // Build child helper
  const getChildren = (parentId?: string) => {
    return filtered.filter(a => (parentId ? a.parentId === parentId : !a.parentId || a.parentId === ''));
  };

  const toggleCollapse = (id: string) => {
    setCollapsedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddSubAccount = (parentId: string) => {
    setParentIdForNew(parentId);
    openCreate();
  };

  // Helper to get IFRS Class grouping description
  const getIfrsClass = (type: AccountType) => {
    switch (type) {
      case 'Asset':
      case 'ContraAsset':
        return 'Non-Current / Current Assets';
      case 'Liability':
      case 'ContraLiability':
        return 'Non-Current / Current Liabilities';
      case 'Equity':
      case 'ContraEquity':
        return 'Equity Attributable to Owners';
      case 'Revenue':
      case 'ContraRevenue':
        return 'Revenue from Contracts with Customers';
      default:
        return 'Operating / Administrative Expenses';
    }
  };

  // Tree render loop
  const renderRow = (a: Account, level = 0): React.ReactNode => {
    const children = getChildren(a.id);
    const hasChildren = children.length > 0;
    const isCollapsed = !!collapsedIds[a.id];

    // Indentation padding
    const paddingLeft = `${level * 24 + 12}px`;

    return (
      <React.Fragment key={a.id}>
        <TableRow className={`hover:bg-blue-50/10 transition-colors ${a.status === 'Inactive' ? 'opacity-60 bg-gray-50/40' : ''}`}>
          <TableCell className="font-mono text-xs text-gray-500 py-3" style={{ paddingLeft }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggleCollapse(a.id)}
                  className="w-4 h-4 flex items-center justify-center rounded text-gray-400 hover:text-gray-900 hover:bg-gray-100 font-semibold"
                >
                  {isCollapsed ? '▸' : '▾'}
                </button>
              ) : (
                <span className="w-4 text-center text-gray-300">•</span>
              )}
              <span className="font-semibold text-gray-800">{a.code}</span>
            </div>
          </TableCell>
          <TableCell className="py-3">
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{a.name}</span>
              <span className="text-[10px] text-gray-400">{getIfrsClass(a.type)}</span>
            </div>
          </TableCell>
          <TableCell className="py-3">
            <Badge variant="secondary" className="font-normal text-[10px] tracking-wide uppercase">
              {a.type.replace('Contra', 'Contra ')}
            </Badge>
          </TableCell>
          <TableCell className="py-3 text-right font-mono text-xs font-medium">
            {formatCurrency(a.openingBalance)}
          </TableCell>
          <TableCell className="py-3">
            {a.ifrsTag ? (
              <Badge variant="outline" className="border-blue-200 bg-blue-50/20 text-blue-700 text-[10px] font-normal">
                {a.ifrsTag}
              </Badge>
            ) : (
              <span className="text-xs text-gray-300 italic">—</span>
            )}
          </TableCell>
          <TableCell className="py-3">
            <div className="flex items-center gap-1.5">
              {a.status === 'Active' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span className={`text-xs ${a.status === 'Active' ? 'text-emerald-700 font-medium' : 'text-amber-700'}`}>
                {a.status}
              </span>
            </div>
          </TableCell>
          <TableCell className="py-3 text-right">
            <div className="flex justify-end gap-1.5">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500 hover:text-blue-600" title="Edit" onClick={() => edit(a)}>
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500 hover:text-emerald-600" title="Add Sub-account" onClick={() => handleAddSubAccount(a.id)}>
                <PlusCircle className="w-3.5 h-3.5" />
              </Button>
              <Button size="xs" variant="ghost" className="h-7 px-2 text-xs font-normal text-gray-500 hover:text-gray-900" onClick={() => status(a)}>
                {a.status === 'Active' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren && !isCollapsed && children.map(child => renderRow(child, level + 1))}
      </React.Fragment>
    );
  };

  // Compute stat summaries
  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((s, a) => s + a.openingBalance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((s, a) => s + a.openingBalance, 0);
  const totalEquity = accounts.filter(a => a.type === 'Equity').reduce((s, a) => s + a.openingBalance, 0);

  return (
    <div className="space-y-6">
      {/* IAS / GAAP compliance banner cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="shadow-sm border-blue-100">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Asset Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-blue-700 font-mono">{formatCurrency(totalAssets)}</div>
            <CardDescription className="text-[10px] mt-1 text-gray-400">IAS 16 Property, Plant & Equipment & Cash Assets</CardDescription>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-orange-100">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Liability Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-orange-600 font-mono">{formatCurrency(totalLiabilities)}</div>
            <CardDescription className="text-[10px] mt-1 text-gray-400">Trade Payables, Accruals & Taxes</CardDescription>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-100">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Equity Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-600 font-mono">{formatCurrency(totalEquity)}</div>
            <CardDescription className="text-[10px] mt-1 text-gray-400">Share Capital & Retained Earnings</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Main workspace toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-fit">
            <TabsList className="bg-gray-100/80 p-0.5 rounded-xl border border-gray-200/50">
              <TabsTrigger value="all" className="rounded-lg text-xs font-medium px-4 py-2">
                All Accounts
              </TabsTrigger>
              <TabsTrigger value="balance-sheet" className="rounded-lg text-xs font-medium px-4 py-2">
                Balance Sheet
              </TabsTrigger>
              <TabsTrigger value="income-statement" className="rounded-lg text-xs font-medium px-4 py-2">
                Income Statement
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by code, name, IFRS tag..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9 h-9 border border-gray-200 rounded-xl text-xs"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-medium border-gray-200 hover:bg-gray-50">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export COA
            </Button>
            <Button size="sm" className="h-9 gap-1.5 text-xs font-medium" onClick={() => { setParentIdForNew(''); openCreate(); }}>
              <PlusCircle className="w-4 h-4" /> Add Account
            </Button>
          </div>
        </div>

        {/* Tree Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
          <Table>
            <TableHeader className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <TableRow>
                <TableHead className="w-44 pl-6">Account Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="w-36">Type</TableHead>
                <TableHead className="w-44 text-right">Opening Balance</TableHead>
                <TableHead className="w-52">IFRS Reporting Line</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-48 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getChildren().map(a => renderRow(a))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-gray-400">
                    <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    No matching accounts found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
