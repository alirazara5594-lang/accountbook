import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { DataToolbar } from '@/components/ui/data-toolbar';
import { money } from '@/lib/currency';

import { type Account } from './api/modules/coa.api';
type AccountType = string;

interface JournalLine {
  accountId: string;
  debit: number;
  credit: number;
}

interface Journal {
  id: string;
  date: string;
  reference: string;
  description: string;
  status?: string; // 'Draft', 'Posted', etc.
  companyId?: string;
  lines: JournalLine[];
}

interface FinancialReportsProps {
  accounts: Account[];
  entries: Journal[];
  activeEntityId: string;
}

const formatCurrency = (val: number) => {
  return money(val);
};

export const FinancialReports: React.FC<FinancialReportsProps> = ({
  accounts,
  entries,
  activeEntityId
}) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // 1. Calculate the active balance for each account using double-entry journal postings
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};

    // Helper to identify debit/credit normal balance
    const getNormalSide = (type: AccountType) => {
      switch (type) {
        case 'Asset':
        case 'Expense':
        case 'ContraLiability':
        case 'ContraEquity':
        case 'ContraRevenue':
          return 'debit';
        default:
          return 'credit';
      }
    };

    // Initialize with opening balances
    accounts.forEach(a => {
      balances[a.id] = a.openingBalance;
    });

    // Process all posted entries
    entries.forEach(entry => {
      // Only posted entries flow into financial statements (IAS 1 accrual basis)
      if (entry.status && entry.status !== 'Posted') return;

      // Filter by active entity if applicable
      if (activeEntityId && entry.companyId && entry.companyId !== activeEntityId) {
        return;
      }

      // Filter by date range if applicable
      if (dateFrom && entry.date < dateFrom) return;
      if (dateTo && entry.date > dateTo) return;

      // Sum lines
      entry.lines.forEach(line => {
        const acc = accounts.find(a => a.id === line.accountId);
        if (!acc) return;

        const side = getNormalSide(acc.type);
        if (side === 'debit') {
          balances[acc.id] = (balances[acc.id] || 0) + (line.debit || 0) - (line.credit || 0);
        } else {
          balances[acc.id] = (balances[acc.id] || 0) + (line.credit || 0) - (line.debit || 0);
        }
      });
    });

    return balances;
  }, [accounts, entries, activeEntityId, dateFrom, dateTo]);

  // Balance Sheet Calculations (IAS 1 compliant)
  const balanceSheetData = useMemo(() => {
    const assetAccounts = accounts.filter(a => a.type === 'Asset' || a.type === 'ContraAsset');
    const liabilityAccounts = accounts.filter(a => a.type === 'Liability' || a.type === 'ContraLiability');
    const equityAccounts = accounts.filter(a => a.type === 'Equity' || a.type === 'ContraEquity');

    const totalAssets = assetAccounts.reduce((sum, a) => {
      const bal = accountBalances[a.id] || 0;
      // Contra assets reduce asset totals
      return sum + (a.type === 'ContraAsset' ? -bal : bal);
    }, 0);

    const totalLiabilities = liabilityAccounts.reduce((sum, a) => {
      const bal = accountBalances[a.id] || 0;
      return sum + (a.type === 'ContraLiability' ? -bal : bal);
    }, 0);

    const totalEquity = equityAccounts.reduce((sum, a) => {
      const bal = accountBalances[a.id] || 0;
      return sum + (a.type === 'ContraEquity' ? -bal : bal);
    }, 0);

    return {
      assetAccounts,
      liabilityAccounts,
      equityAccounts,
      totalAssets,
      totalLiabilities,
      totalEquity
    };
  }, [accounts, accountBalances]);

  // Income Statement Calculations (IAS 1 / IFRS 15 compliant)
  const incomeStatementData = useMemo(() => {
    const revenueAccounts = accounts.filter(a => a.type === 'Revenue' || a.type === 'ContraRevenue');
    const expenseAccounts = accounts.filter(a => a.type === 'Expense' || a.type === 'ContraExpense');

    const totalRevenue = revenueAccounts.reduce((sum, a) => {
      const bal = accountBalances[a.id] || 0;
      return sum + (a.type === 'ContraRevenue' ? -bal : bal);
    }, 0);

    // Identify COGS accounts for Gross Profit calculation
    const cogsAccounts = expenseAccounts.filter(a => a.name.toLowerCase().includes('cost of goods sold') || a.name.toLowerCase().includes('cogs'));
    const otherExpenses = expenseAccounts.filter(a => !cogsAccounts.includes(a));

    const totalCogs = cogsAccounts.reduce((sum, a) => {
      const bal = accountBalances[a.id] || 0;
      return sum + (a.type === 'ContraExpense' ? -bal : bal);
    }, 0);

    const totalOtherExpenses = otherExpenses.reduce((sum, a) => {
      const bal = accountBalances[a.id] || 0;
      return sum + (a.type === 'ContraExpense' ? -bal : bal);
    }, 0);

    const grossProfit = totalRevenue - totalCogs;
    const netIncome = grossProfit - totalOtherExpenses;

    return {
      revenueAccounts,
      cogsAccounts,
      otherExpenses,
      totalRevenue,
      totalCogs,
      totalOtherExpenses,
      grossProfit,
      netIncome
    };
  }, [accounts, accountBalances]);

  // 3. Statement of Cash Flows (IAS 7 compliant - Indirect Method)
  const cashFlowData = useMemo(() => {
    const netIncome = incomeStatementData.netIncome;

    // Adjustments for non-cash items: Depreciation
    const deprExpAccounts = accounts.filter(a => a.type === 'Expense' && a.name.toLowerCase().includes('depreciation'));
    const totalDepreciation = deprExpAccounts.reduce((sum, a) => {
      const currentBal = accountBalances[a.id] || 0;
      return sum + currentBal;
    }, 0);

    // Adjustments for changes in working capital
    const arAccount = accounts.find(a => a.code === '12000');
    const arOpening = arAccount ? arAccount.openingBalance : 0;
    const arEnding = arAccount ? (accountBalances[arAccount.id] || 0) : 0;
    const arChange = arEnding - arOpening;

    const invAccount = accounts.find(a => a.code === '13000');
    const invOpening = invAccount ? invAccount.openingBalance : 0;
    const invEnding = invAccount ? (accountBalances[invAccount.id] || 0) : 0;
    const invChange = invEnding - invOpening;

    const apAccount = accounts.find(a => a.code === '21000');
    const apOpening = apAccount ? apAccount.openingBalance : 0;
    const apEnding = apAccount ? (accountBalances[apAccount.id] || 0) : 0;
    const apChange = apEnding - apOpening;

    const grniAccount = accounts.find(a => a.code === '22000');
    const grniOpening = grniAccount ? grniAccount.openingBalance : 0;
    const grniEnding = grniAccount ? (accountBalances[grniAccount.id] || 0) : 0;
    const grniChange = grniEnding - grniOpening;

    const operatingCashFlow = netIncome + totalDepreciation - arChange - invChange + apChange + grniChange;

    // Cash Flows from Investing Activities
    const faAccount = accounts.find(a => a.code === '15000');
    const faOpening = faAccount ? faAccount.openingBalance : 0;
    const faEnding = faAccount ? (accountBalances[faAccount.id] || 0) : 0;
    const faChange = faEnding - faOpening;
    const investingCashFlow = -faChange;

    // Cash Flows from Financing Activities
    const equityAccount = accounts.find(a => a.code === '30000' || a.code === '31000');
    const eqOpening = equityAccount ? equityAccount.openingBalance : 0;
    const eqEnding = equityAccount ? (accountBalances[equityAccount.id] || 0) : 0;
    const eqChange = eqEnding - eqOpening;
    const financingCashFlow = eqChange;

    const netCashIncrease = operatingCashFlow + investingCashFlow + financingCashFlow;

    // Cash & equivalents beginning vs ending
    const cashAccounts = accounts.filter(a => a.code.startsWith('11') || a.reconciliationEnabled);
    const beginningCash = cashAccounts.reduce((sum, a) => sum + a.openingBalance, 0);
    const endingCash = cashAccounts.reduce((sum, a) => sum + (accountBalances[a.id] || 0), 0);

    return {
      netIncome,
      totalDepreciation,
      arChange,
      invChange,
      apChange,
      grniChange,
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashIncrease,
      beginningCash,
      endingCash
    };
  }, [accounts, accountBalances, incomeStatementData]);

  // Balance Check
  const balanceSheetBalanced = Math.abs(balanceSheetData.totalAssets - (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity + incomeStatementData.netIncome)) < 0.01;

  const exportHeaders = ['Account', 'Amount'];
  const exportRows: (string | number)[][] = [];
  exportRows.push(['ASSETS']);
  balanceSheetData.assetAccounts.forEach(a => exportRows.push([`${a.code} — ${a.name}`, (a.type === 'ContraAsset' ? -1 : 1) * (accountBalances[a.id] || 0)]));
  exportRows.push(['', balanceSheetData.totalAssets]);
  exportRows.push(['LIABILITIES']);
  balanceSheetData.liabilityAccounts.forEach(a => exportRows.push([`${a.code} — ${a.name}`, (a.type === 'ContraLiability' ? -1 : 1) * (accountBalances[a.id] || 0)]));
  exportRows.push(['', balanceSheetData.totalLiabilities]);
  exportRows.push(['EQUITY']);
  balanceSheetData.equityAccounts.forEach(a => exportRows.push([`${a.code} — ${a.name}`, (a.type === 'ContraEquity' ? -1 : 1) * (accountBalances[a.id] || 0)]));
  exportRows.push(['', balanceSheetData.totalEquity]);
  exportRows.push(['NET INCOME', incomeStatementData.netIncome]);

  return (
    <div className="space-y-6">
      {/* Date Filters Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">Reporting Period</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Clear
            </Button>
          )}
          <DataToolbar
            exportFileName={`financial-reports-${new Date().toISOString().slice(0, 10)}`}
            exportSheetName="Financial Reports"
            exportTitle="Financial Reports"
            exportSubtitle={`Balance sheet and income statement — ${dateFrom || 'start'} to ${dateTo || 'today'} (IAS 1 / IFRS 15).`}
            exportHeaders={exportHeaders}
            exportRows={exportRows}
            onRefresh={() => { setDateFrom(''); setDateTo(''); }}
          />
        </div>
      </div>

      {/* Compliance / Balancing Alert */}
      <div className="grid grid-cols-1">
        {balanceSheetBalanced ? (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Ledger Balance Status: Balanced</p>
              <p className="text-xs opacity-90">All double-entry asset debits equal liability, equity, and recognized period income credits perfectly (IAS 1 / GAAP Compliance Check passed).</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Ledger Balance Warning: Out of Balance</p>
              <p className="text-xs opacity-90">Total assets do not match the sum of liabilities, equity, and net earnings. Please review outstanding drafts or unposted journal entries.</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="balance-sheet" className="w-full">
        <TabsList className="bg-gray-100 p-0.5 rounded-xl border border-gray-200/50 mb-6">
          <TabsTrigger value="balance-sheet" className="rounded-lg text-xs font-semibold px-5 py-2">
            Balance Sheet
          </TabsTrigger>
          <TabsTrigger value="income-statement" className="rounded-lg text-xs font-semibold px-5 py-2">
            Income Statement
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="rounded-lg text-xs font-semibold px-5 py-2">
            Cash Flow
          </TabsTrigger>
          <TabsTrigger value="trial-balance" className="rounded-lg text-xs font-semibold px-5 py-2">
            Trial Balance
          </TabsTrigger>
        </TabsList>

        {/* 1. BALANCE SHEET */}
        <TabsContent value="balance-sheet">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Statement of Financial Position</CardTitle>
                  <CardDescription className="text-xs text-gray-500">IAS 1 Standard Layout · Accrual Basis</CardDescription>
                </div>
                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">Balance Sheet</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-100/40 text-xs font-medium text-gray-500">
                  <TableRow>
                    <TableHead className="pl-6">Account Name</TableHead>
                    <TableHead className="w-44 text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {/* ASSETS SECTION */}
                  <TableRow className="bg-blue-50/5 font-semibold text-gray-900">
                    <TableCell colSpan={2} className="py-4 pl-6 text-sm tracking-wide uppercase">1. Assets</TableCell>
                  </TableRow>
                  {balanceSheetData.assetAccounts.map(a => (
                    <TableRow key={a.id} className="hover:bg-gray-50/40">
                      <TableCell className="pl-6 text-gray-700">{a.name} {a.type === 'ContraAsset' && <span className="text-[10px] text-gray-400 italic">(Contra Account)</span>}</TableCell>
                      <TableCell className="text-right pr-6 font-mono text-xs text-gray-900 font-medium">
                        {formatCurrency(a.type === 'ContraAsset' ? -(accountBalances[a.id] || 0) : (accountBalances[a.id] || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-blue-50/30 font-bold text-blue-900 border-t-2 border-blue-100">
                    <TableCell className="pl-6 text-sm uppercase">Total Assets</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm">{formatCurrency(balanceSheetData.totalAssets)}</TableCell>
                  </TableRow>

                  {/* LIABILITIES SECTION */}
                  <TableRow className="bg-orange-50/5 font-semibold text-gray-900">
                    <TableCell colSpan={2} className="py-4 pl-6 text-sm tracking-wide uppercase">2. Liabilities</TableCell>
                  </TableRow>
                  {balanceSheetData.liabilityAccounts.map(a => (
                    <TableRow key={a.id} className="hover:bg-gray-50/40">
                      <TableCell className="pl-6 text-gray-700">{a.name} {a.type === 'ContraLiability' && <span className="text-[10px] text-gray-400 italic">(Contra Account)</span>}</TableCell>
                      <TableCell className="text-right pr-6 font-mono text-xs text-gray-900 font-medium">
                        {formatCurrency(a.type === 'ContraLiability' ? -(accountBalances[a.id] || 0) : (accountBalances[a.id] || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-orange-50/30 font-bold text-orange-900 border-t-2 border-orange-100">
                    <TableCell className="pl-6 text-sm uppercase">Total Liabilities</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm">{formatCurrency(balanceSheetData.totalLiabilities)}</TableCell>
                  </TableRow>

                  {/* EQUITY SECTION */}
                  <TableRow className="bg-emerald-50/5 font-semibold text-gray-900">
                    <TableCell colSpan={2} className="py-4 pl-6 text-sm tracking-wide uppercase">3. Equity & Reserves</TableCell>
                  </TableRow>
                  {balanceSheetData.equityAccounts.map(a => (
                    <TableRow key={a.id} className="hover:bg-gray-50/40">
                      <TableCell className="pl-6 text-gray-700">{a.name}</TableCell>
                      <TableCell className="text-right pr-6 font-mono text-xs text-gray-900 font-medium">
                        {formatCurrency(accountBalances[a.id] || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Plus Net income of current period */}
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-6 text-gray-700 font-medium italic">Current Period Net Income</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-xs text-emerald-700 font-bold">
                      {formatCurrency(incomeStatementData.netIncome)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-emerald-50/30 font-bold text-emerald-950 border-t-2 border-emerald-100">
                    <TableCell className="pl-6 text-sm uppercase">Total Equity</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm">{formatCurrency(balanceSheetData.totalEquity + incomeStatementData.netIncome)}</TableCell>
                  </TableRow>

                  {/* DOUBLE BOTTOM LINE TOTALS */}
                  <TableRow className="bg-gray-950 text-white font-bold border-t-4 border-double border-gray-950">
                    <TableCell className="pl-6 text-sm uppercase tracking-wide">Total Liabilities & Equity</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm">
                      {formatCurrency(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity + incomeStatementData.netIncome)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. INCOME STATEMENT */}
        <TabsContent value="income-statement">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Statement of Profit or Loss</CardTitle>
                  <CardDescription className="text-xs text-gray-500">IAS 1 compliant statement mapping sales revenue to net earnings</CardDescription>
                </div>
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Income Statement</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-100/40 text-xs font-medium text-gray-500">
                  <TableRow>
                    <TableHead className="pl-6">Reporting Line Item</TableHead>
                    <TableHead className="w-44 text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {/* REVENUE SECTION */}
                  <TableRow className="bg-blue-50/5 font-semibold text-gray-900">
                    <TableCell colSpan={2} className="py-4 pl-6 text-sm tracking-wide uppercase">1. Operating Revenue</TableCell>
                  </TableRow>
                  {incomeStatementData.revenueAccounts.map(a => (
                    <TableRow key={a.id} className="hover:bg-gray-50/40">
                      <TableCell className="pl-6 text-gray-700">{a.name} {a.type === 'ContraRevenue' && <span className="text-[10px] text-gray-400 italic">(Contra Account)</span>}</TableCell>
                      <TableCell className="text-right pr-6 font-mono text-xs text-gray-900 font-medium">
                        {formatCurrency(a.type === 'ContraRevenue' ? -(accountBalances[a.id] || 0) : (accountBalances[a.id] || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50/50 font-bold border-t border-gray-200">
                    <TableCell className="pl-6 text-xs uppercase text-gray-500">Total Revenue</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm text-gray-900 font-bold">{formatCurrency(incomeStatementData.totalRevenue)}</TableCell>
                  </TableRow>

                  {/* COGS SECTION */}
                  <TableRow className="bg-orange-50/5 font-semibold text-gray-900">
                    <TableCell colSpan={2} className="py-4 pl-6 text-sm tracking-wide uppercase">2. Cost of Sales</TableCell>
                  </TableRow>
                  {incomeStatementData.cogsAccounts.map(a => (
                    <TableRow key={a.id} className="hover:bg-gray-50/40">
                      <TableCell className="pl-6 text-gray-700">{a.name}</TableCell>
                      <TableCell className="text-right pr-6 font-mono text-xs text-red-600 font-medium">
                        ({formatCurrency(accountBalances[a.id] || 0)})
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50/50 font-bold border-t border-gray-200">
                    <TableCell className="pl-6 text-xs uppercase text-gray-500">Total Cost of Goods Sold</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm text-red-600 font-bold">({formatCurrency(incomeStatementData.totalCogs)})</TableCell>
                  </TableRow>

                  {/* GROSS PROFIT SUB-TOTAL */}
                  <TableRow className="bg-blue-50/40 font-bold text-blue-900 border-t border-b-2 border-blue-100">
                    <TableCell className="pl-6 text-sm uppercase">Gross Profit</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm">{formatCurrency(incomeStatementData.grossProfit)}</TableCell>
                  </TableRow>

                  {/* OPERATING EXPENSES */}
                  <TableRow className="bg-gray-50/5 font-semibold text-gray-900">
                    <TableCell colSpan={2} className="py-4 pl-6 text-sm tracking-wide uppercase">3. Operating Expenses</TableCell>
                  </TableRow>
                  {incomeStatementData.otherExpenses.map(a => (
                    <TableRow key={a.id} className="hover:bg-gray-50/40">
                      <TableCell className="pl-6 text-gray-700">{a.name} {a.type === 'ContraExpense' && <span className="text-[10px] text-gray-400 italic">(Contra Account)</span>}</TableCell>
                      <TableCell className="text-right pr-6 font-mono text-xs text-red-600 font-medium">
                        ({formatCurrency(a.type === 'ContraExpense' ? -(accountBalances[a.id] || 0) : (accountBalances[a.id] || 0))})
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50/50 font-bold border-t border-gray-200">
                    <TableCell className="pl-6 text-xs uppercase text-gray-500">Total Operating Expenses</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm text-red-600 font-bold">({formatCurrency(incomeStatementData.totalOtherExpenses)})</TableCell>
                  </TableRow>

                  {/* NET INCOME */}
                  <TableRow className="bg-emerald-600 text-white font-bold border-t-2 border-emerald-700">
                    <TableCell className="pl-6 text-sm uppercase tracking-wide">Net Income / Earnings</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm">
                      {formatCurrency(incomeStatementData.netIncome)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. TRIAL BALANCE */}
        <TabsContent value="trial-balance">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Trial Balance Statement</CardTitle>
                  <CardDescription className="text-xs text-gray-500">Ledger audit report validating zero-net balances across all assets, liabilities, and period accounts</CardDescription>
                </div>
                <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-800">Trial Balance</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-100/40 text-xs font-medium text-gray-500">
                  <TableRow>
                    <TableHead className="pl-6">Account Description</TableHead>
                    <TableHead className="w-44 text-right">Debit Balance</TableHead>
                    <TableHead className="w-44 text-right pr-6">Credit Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {accounts.map(a => {
                    const bal = accountBalances[a.id] || 0;
                    if (bal === 0) return null; // Only show active ledger balances

                    // Determine normal side
                    const side = ['Asset', 'Expense', 'ContraLiability', 'ContraEquity', 'ContraRevenue'].includes(a.type) ? 'debit' : 'credit';

                    return (
                      <TableRow key={a.id} className="hover:bg-gray-50/40 text-xs">
                        <TableCell className="pl-6 font-sans text-gray-700 font-medium">{a.name}</TableCell>
                        <TableCell className="text-right font-mono text-gray-900">
                          {side === 'debit' ? formatCurrency(bal) : '—'}
                        </TableCell>
                        <TableCell className="text-right pr-6 font-mono text-gray-900">
                          {side === 'credit' ? formatCurrency(bal) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Totals */}
                  <TableRow className="bg-gray-100 font-bold text-gray-900 border-t-2 border-gray-300">
                    <TableCell className="pl-6 text-sm uppercase">Total Ledger Balances</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(
                        accounts
                          .filter(a => ['Asset', 'Expense', 'ContraLiability', 'ContraEquity', 'ContraRevenue'].includes(a.type))
                          .reduce((s, a) => s + (accountBalances[a.id] || 0), 0)
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm">
                      {formatCurrency(
                        accounts
                          .filter(a => !['Asset', 'Expense', 'ContraLiability', 'ContraEquity', 'ContraRevenue'].includes(a.type))
                          .reduce((s, a) => s + (accountBalances[a.id] || 0), 0)
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. CASH FLOW STATEMENT */}
        <TabsContent value="cash-flow">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900">Statement of Cash Flows</CardTitle>
                  <CardDescription className="text-xs text-gray-500">IAS 7 compliant statement of cash flows · Indirect Method</CardDescription>
                </div>
                <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-800">Cash Flow</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-100/40 text-xs font-medium text-gray-500">
                  <TableRow>
                    <TableHead className="pl-6">Cash Flow Activity</TableHead>
                    <TableHead className="w-44 text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {/* OPERATING ACTIVITIES */}
                  <TableRow className="bg-gray-50/50 font-semibold text-gray-900">
                    <TableCell colSpan={2} className="py-4 pl-6 text-sm tracking-wide uppercase">1. Cash Flows from Operating Activities</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-8 text-gray-700">Net Period Earnings / Net Income</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-xs text-gray-900 font-medium">{formatCurrency(cashFlowData.netIncome)}</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-8 text-gray-700">Adjustment for Depreciation Expense (Non-Cash Expense)</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-xs text-emerald-700 font-medium">+{formatCurrency(cashFlowData.totalDepreciation)}</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-8 text-gray-700">Change in Accounts Receivable (Increase reduces cash)</TableCell>
                    <TableCell className={`text-right pr-6 font-mono text-xs font-medium ${cashFlowData.arChange > 0 ? 'text-red-650' : 'text-emerald-700'}`}>
                      {cashFlowData.arChange > 0 ? `-${formatCurrency(cashFlowData.arChange)}` : `+${formatCurrency(-cashFlowData.arChange)}`}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-8 text-gray-700">Change in Inventory Assets (Increase reduces cash)</TableCell>
                    <TableCell className={`text-right pr-6 font-mono text-xs font-medium ${cashFlowData.invChange > 0 ? 'text-red-650' : 'text-emerald-700'}`}>
                      {cashFlowData.invChange > 0 ? `-${formatCurrency(cashFlowData.invChange)}` : `+${formatCurrency(-cashFlowData.invChange)}`}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-8 text-gray-700">Change in Accounts Payable (Increase increases cash)</TableCell>
                    <TableCell className={`text-right pr-6 font-mono text-xs font-medium ${cashFlowData.apChange > 0 ? 'text-emerald-700' : 'text-red-650'}`}>
                      {cashFlowData.apChange > 0 ? `+${formatCurrency(cashFlowData.apChange)}` : `-${formatCurrency(-cashFlowData.apChange)}`}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-8 text-gray-700">Change in GRNI Accruals (Goods received not invoiced)</TableCell>
                    <TableCell className={`text-right pr-6 font-mono text-xs font-medium ${cashFlowData.grniChange > 0 ? 'text-emerald-700' : 'text-red-650'}`}>
                      {cashFlowData.grniChange > 0 ? `+${formatCurrency(cashFlowData.grniChange)}` : `-${formatCurrency(-cashFlowData.grniChange)}`}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50 font-bold border-t border-gray-200">
                    <TableCell className="pl-6 text-xs uppercase text-gray-500">Net Cash provided by Operating Activities</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm text-gray-900 font-bold">{formatCurrency(cashFlowData.operatingCashFlow)}</TableCell>
                  </TableRow>

                  {/* INVESTING ACTIVITIES */}
                  <TableRow className="bg-gray-50/50 font-semibold text-gray-900">
                    <TableCell colSpan={2} className="py-4 pl-6 text-sm tracking-wide uppercase">2. Cash Flows from Investing Activities</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-8 text-gray-700">Capital Expenditure on Fixed Assets / Property, Plant & Equipment</TableCell>
                    <TableCell className={`text-right pr-6 font-mono text-xs font-medium ${cashFlowData.investingCashFlow < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {cashFlowData.investingCashFlow < 0 ? `-${formatCurrency(-cashFlowData.investingCashFlow)}` : `+${formatCurrency(cashFlowData.investingCashFlow)}`}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50 font-bold border-t border-gray-200">
                    <TableCell className="pl-6 text-xs uppercase text-gray-500">Net Cash used in Investing Activities</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm text-gray-900 font-bold">{formatCurrency(cashFlowData.investingCashFlow)}</TableCell>
                  </TableRow>

                  {/* FINANCING ACTIVITIES */}
                  <TableRow className="bg-gray-50/50 font-semibold text-gray-900">
                    <TableCell colSpan={2} className="py-4 pl-6 text-sm tracking-wide uppercase">3. Cash Flows from Financing Activities</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-8 text-gray-700">Equity Capital Additions / Share Capital Issuances</TableCell>
                    <TableCell className={`text-right pr-6 font-mono text-xs font-medium ${cashFlowData.financingCashFlow >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {cashFlowData.financingCashFlow >= 0 ? `+${formatCurrency(cashFlowData.financingCashFlow)}` : `-${formatCurrency(-cashFlowData.financingCashFlow)}`}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-gray-50 font-bold border-t border-gray-200">
                    <TableCell className="pl-6 text-xs uppercase text-gray-500">Net Cash provided by Financing Activities</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm text-gray-900 font-bold">{formatCurrency(cashFlowData.financingCashFlow)}</TableCell>
                  </TableRow>

                  {/* NET CHANGE IN CASH */}
                  <TableRow className="bg-teal-50/50 font-bold text-teal-900 border-t border-b-2 border-teal-200">
                    <TableCell className="pl-6 text-sm uppercase">Net Increase / (Decrease) in Cash & equivalents</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm">{formatCurrency(cashFlowData.netCashIncrease)}</TableCell>
                  </TableRow>

                  {/* BEGINNING AND ENDING CASH */}
                  <TableRow className="hover:bg-gray-50/40">
                    <TableCell className="pl-8 text-gray-500">Cash and Cash Equivalents at Beginning of Period</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-xs text-gray-500">{formatCurrency(cashFlowData.beginningCash)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-teal-600 text-white font-bold border-t-2 border-teal-700">
                    <TableCell className="pl-6 text-sm uppercase tracking-wide">Cash and Cash Equivalents at End of Period</TableCell>
                    <TableCell className="text-right pr-6 font-mono text-sm">{formatCurrency(cashFlowData.endingCash)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
