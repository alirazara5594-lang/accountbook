import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderTree, Search, Edit3, FileSpreadsheet, PlusCircle } from 'lucide-react';

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
    if (type === 'Asset') return 'Current Asset';
    if (type === 'Liability') return 'Current Liability';
    if (type === 'Equity') return 'Equity';
    if (type === 'Revenue') return 'Operating Revenue';
    return 'Operating Expense';
  };

  const getParentName = (account: Account, allAccounts: Account[]) => {
    if (!account.parentId) return '— Top-Level Group —';
    const p = allAccounts.find(x => x.id === account.parentId);
    return p ? `${p.code} ${p.name}` : '— Top-Level Group —';
  };

  const renderRow = (a: Account, level = 0): React.ReactNode => {
    const children = getChildren(a.id);
    const hasChildren = children.length > 0;
    const isCollapsed = !!collapsedIds[a.id];
    const paddingLeft = `${level * 24 + 12}px`;
    const subTypeLabel = getSubtype(a.code, a.type);
    const parentLineLabel = getParentName(a, accounts);

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
              <span className="font-semibold text-gray-800 font-mono tracking-wider">{a.code}</span>
            </div>
          </TableCell>
          <TableCell className="py-3">
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{a.name}</span>
              {a.ifrsTag && <span className="text-[10px] text-blue-600 font-mono">{a.ifrsTag}</span>}
            </div>
          </TableCell>
          <TableCell className="py-3">
            <Badge variant="secondary" className="font-normal text-[10px] tracking-wide uppercase">
              {a.type.replace('Contra', 'Contra ')}
            </Badge>
          </TableCell>
          <TableCell className="py-3">
            <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md font-medium">
              {subTypeLabel}
            </span>
          </TableCell>
          <TableCell className="py-3">
            <span className="text-xs text-gray-600 font-medium">
              {parentLineLabel}
            </span>
          </TableCell>
          <TableCell className="py-3 text-right font-mono text-xs font-medium">
            {formatCurrency(a.openingBalance)}
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

  const totalAssets = accounts.filter(a => a.type === 'Asset').reduce((s, a) => s + a.openingBalance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Liability').reduce((s, a) => s + a.openingBalance, 0);
  const totalEquity = accounts.filter(a => a.type === 'Equity').reduce((s, a) => s + a.openingBalance, 0);

  return (
    <div className="space-y-6">
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
        <Card className="shadow-sm border-purple-100">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Liability Accounts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-purple-700 font-mono">{formatCurrency(totalLiabilities)}</div>
            <CardDescription className="text-[10px] mt-1 text-gray-400">Trade Payables & Provisions</CardDescription>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-100">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Equity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-emerald-700 font-mono">{formatCurrency(totalEquity)}</div>
            <CardDescription className="text-[10px] mt-1 text-gray-400">Capital & Reserves</CardDescription>
          </CardContent>
        </Card>
      </div>

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
                placeholder="Search by 5-digit code, name, type..."
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

        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
          <Table>
            <TableHeader className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <TableRow>
                <TableHead className="w-36 pl-6">5-Digit Code</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead className="w-28">Major Type</TableHead>
                <TableHead className="w-40">Sub-Type</TableHead>
                <TableHead className="w-56">Parent Account (Financial Line)</TableHead>
                <TableHead className="w-36 text-right">Opening Balance</TableHead>
                <TableHead className="w-36 text-right pr-6">Actions</TableHead>
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
