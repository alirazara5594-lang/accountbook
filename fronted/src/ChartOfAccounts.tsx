import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useCoaStore, useJournalsStore, useSalesStore, useProcurementStore } from './stores';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Edit3, Download, Upload, Plus, Trash2, 
  ChevronDown, ChevronRight, Lock, Folder, FolderOpen, 
  FileText, Shield, PieChart, Info, ArrowRight, Eye, Calendar, User, CheckCircle
} from 'lucide-react';

import { type Account } from './api/modules/coa.api';
type AccountType = string;

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
  return val < 0 ? `(${formatted})` : formatted; // GAAP standard parentheses for negative balances
};

export const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({
  accounts,
  edit,
  status,
  openCreate,
  setParentIdForNew,
  reloadAccounts
}) => {
  // Store subscriptions
  const journalEntries = useJournalsStore(s => s.entries);
  const fetchJournalEntries = useJournalsStore(s => s.fetchJournalEntries);
  const salesInvoices = useSalesStore(s => s.invoices);
  const fetchInvoices = useSalesStore(s => s.fetchInvoices);
  const vendorBills = useProcurementStore(s => s.bills);
  const fetchBills = useProcurementStore(s => s.fetchBills);

  // Drill-down audit explorer states
  const [selectedMainHead, setSelectedMainHead] = useState<string | null>(null);
  const [selectedSubHead, setSelectedSubHead] = useState<string | null>(null);
  const [selectedGLAccountId, setSelectedGLAccountId] = useState<string | null>(null);
  const [activeSourceTx, setActiveSourceTx] = useState<any | null>(null);
  const [glSearchQuery, setGlSearchQuery] = useState('');

  // Primary list view states
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [showDeactivated, setShowDeactivated] = useState<boolean>(true);
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch audit trail dependencies on load
  useEffect(() => {
    fetchJournalEntries();
    fetchInvoices();
    fetchBills();
  }, [fetchJournalEntries, fetchInvoices, fetchBills]);

  // Centralized balance calculation engine mapping all transaction records to their specific account IDs
  const accountBalances = useMemo(() => {
    const balances: Record<string, { debits: number; credits: number; net: number }> = {};
    
    // Initialize account balances
    accounts.forEach(a => {
      balances[a.id] = { debits: 0, credits: 0, net: a.openingBalance };
    });

    // Traverse all posted journal entries
    const posted = journalEntries.filter(e => String(e.status) === 'Posted' || String(e.status) === '3');
    
    posted.forEach(entry => {
      entry.lines?.forEach(line => {
        if (balances[line.accountId]) {
          balances[line.accountId].debits += line.debit || 0;
          balances[line.accountId].credits += line.credit || 0;
        }
      });
    });

    // Compute net balance based on normal balance type
    accounts.forEach(a => {
      const b = balances[a.id];
      const isDebitNormal = ['Asset', 'Expense', 'ContraLiability', 'ContraEquity', 'ContraRevenue'].includes(a.type);
      if (isDebitNormal) {
        b.net = a.openingBalance + b.debits - b.credits;
      } else {
        b.net = a.openingBalance + b.credits - b.debits;
      }
    });

    return balances;
  }, [accounts, journalEntries]);

  // Recursive balance resolver for rolled-up parent headers
  const getAccountBalancesRecursive = (accId: string): { opening: number; debits: number; credits: number; current: number } => {
    const account = accounts.find(a => a.id === accId);
    if (!account) return { opening: 0, debits: 0, credits: 0, current: 0 };

    const direct = accountBalances[accId] || { debits: 0, credits: 0, net: account.openingBalance };
    
    let opening = account.openingBalance;
    let debits = direct.debits;
    let credits = direct.credits;
    let current = direct.net;

    // Traverse children
    const children = accounts.filter(a => a.parentId === accId);
    for (const child of children) {
      const childBal = getAccountBalancesRecursive(child.id);
      opening += childBal.opening;
      debits += childBal.debits;
      credits += childBal.credits;
      current += childBal.current;
    }

    return { opening, debits, credits, current };
  };

  const isFiltering = !!query.trim() || selectedType !== 'All';

  // Flat account view for searching
  const filteredAccounts = useMemo(() => {
    return accounts.filter(a => {
      if (!showDeactivated && a.status === 'Inactive') return false;
      if (selectedType !== 'All') {
        const baseType = a.type.replace('Contra', '');
        if (baseType !== selectedType) return false;
      }
      if (query.trim()) {
        const lower = query.toLowerCase();
        return (
          a.code.toLowerCase().includes(lower) ||
          a.name.toLowerCase().includes(lower) ||
          a.subtype.toLowerCase().includes(lower) ||
          a.type.toLowerCase().includes(lower)
        );
      }
      return true;
    }).sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts, query, selectedType, showDeactivated]);

  // Pre-order traversal tree builder
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
      const topLevel = accounts.filter(a => 
        cat.typeKeys.includes(a.type) && 
        (!a.parentId || !accounts.some(parent => parent.id === a.parentId)) &&
        (showDeactivated || a.status === 'Active')
      ).sort((a, b) => a.code.localeCompare(b.code));

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

  const categoryTotals = useMemo(() => {
    const getCategoryTotal = (typeKeys: string[]): number => {
      return accounts
        .filter(a => typeKeys.includes(a.type) && (!a.parentId || !accounts.some(p => p.id === a.parentId)))
        .reduce((sum, a) => sum + getAccountBalancesRecursive(a.id).current, 0);
    };

    return {
      Asset: getCategoryTotal(['Asset', 'ContraAsset']),
      Liability: getCategoryTotal(['Liability', 'ContraLiability']),
      Equity: getCategoryTotal(['Equity', 'ContraEquity']),
      Revenue: getCategoryTotal(['Revenue', 'ContraRevenue']),
      Expense: getCategoryTotal(['Expense', 'ContraExpense']),
    };
  }, [accounts, accountBalances]);

  const maxAccountBalance = useMemo(() => {
    const balances = accounts.map(a => Math.abs(getAccountBalancesRecursive(a.id).current));
    return Math.max(...balances, 1);
  }, [accounts, accountBalances]);

  // CSV operations
  const handleExportCSV = () => {
    const listToExport = isFiltering ? filteredAccounts : accounts;
    const headers = ['ACCOUNT CODE', 'ACCOUNT NAME', 'MAJOR TYPE', 'SUBTYPE', 'LEVEL', 'POSTING ACCOUNT', 'NORMAL BALANCE', 'CURRENCY', 'CURRENT BALANCE', 'STATUS'];
    const rows = listToExport.map(a => {
      const bal = getAccountBalancesRecursive(a.id).current;
      return [
        `"${a.code}"`,
        `"${a.name}"`,
        `"${a.type}"`,
        `"${a.subtype}"`,
        `"${a.level}"`,
        `"${a.isPosting ? 'Yes' : 'No'}"`,
        `"${a.normalBalance}"`,
        `"${a.currency}"`,
        bal,
        `"${a.status}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Zenabook_ChartOfAccounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      let createdCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length >= 6) {
          const code = parts[0].replace(/"/g, '').trim();
          const name = parts[1].replace(/"/g, '').trim();
          const type = parts[2].replace(/"/g, '').trim() as AccountType;
          const subtype = parts[3].replace(/"/g, '').trim();
          const currency = parts[7]?.replace(/"/g, '').trim() || 'USD';
          const openingBalance = parseFloat(parts[8]) || 0;

          try {
            await useCoaStore.getState().saveAccount({
              code,
              name,
              type,
              subtype,
              currency,
              openingBalance,
              parentId: null,
              reconciliationEnabled: false,
              isSystem: false
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
    if (window.confirm('Warning: Clearing all accounts will reset the system state. System mappings and child balances will be deleted. Do you want to proceed?')) {
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

  // General Ledger detail loader
  const glAccount = useMemo(() => {
    if (!selectedGLAccountId) return null;
    return accounts.find(a => a.id === selectedGLAccountId) || null;
  }, [selectedGLAccountId, accounts]);

  const glLines = useMemo(() => {
    if (!selectedGLAccountId || !glAccount) return [];
    
    const lines: any[] = [];
    const posted = journalEntries.filter(e => String(e.status) === 'Posted' || String(e.status) === '3');

    posted.forEach(entry => {
      entry.lines?.forEach(line => {
        if (line.accountId === selectedGLAccountId) {
          lines.push({
            date: entry.date,
            reference: entry.reference,
            description: line.memo || entry.description,
            debit: line.debit || 0,
            credit: line.credit || 0,
            entry
          });
        }
      });
    });

    // Sort chronologically
    lines.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balances
    let running = glAccount.openingBalance;
    const isDebitNormal = ['Asset', 'Expense', 'ContraLiability', 'ContraEquity', 'ContraRevenue'].includes(glAccount.type);

    return lines.map(l => {
      if (isDebitNormal) {
        running = running + l.debit - l.credit;
      } else {
        running = running + l.credit - l.debit;
      }
      return { ...l, runningBalance: running };
    });
  }, [selectedGLAccountId, glAccount, journalEntries]);

  // Filtered GL lines based on text query
  const filteredGLLines = useMemo(() => {
    return glLines.filter(line => {
      if (!glSearchQuery.trim()) return true;
      const lower = glSearchQuery.toLowerCase();
      return (
        line.reference?.toLowerCase().includes(lower) ||
        line.description?.toLowerCase().includes(lower) ||
        line.date.includes(lower)
      );
    });
  }, [glLines, glSearchQuery]);

  // Source transaction finder
  const sourceTxDetails = useMemo(() => {
    if (!activeSourceTx) return null;
    
    const ref = activeSourceTx.reference || '';
    
    // Look for matching Sales Invoice
    const inv = salesInvoices.find(i => i.invoiceNumber === ref || ref.includes(i.invoiceNumber));
    if (inv) {
      return { type: 'Invoice', data: inv };
    }

    // Look for matching Vendor Bill
    const bill = vendorBills.find(b => b.billNumber === ref || ref.includes(b.billNumber));
    if (bill) {
      return { type: 'Bill', data: bill };
    }

    return { type: 'Journal', data: activeSourceTx };
  }, [activeSourceTx, salesInvoices, vendorBills]);

  // Renders a visual row in the COA explorer list
  const renderRow = (acc: Account, depth = 0, hasChildren = false) => {
    const isDeactivated = acc.status === 'Inactive';
    const balRec = getAccountBalancesRecursive(acc.id);
    const balance = balRec.current;

    const baseType = acc.type.replace('Contra', '');
    const colorMap: Record<string, { bg: string; text: string; border: string; bar: string }> = {
      Asset: { bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-200/50', bar: 'bg-emerald-500' },
      Liability: { bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-200/50', bar: 'bg-amber-500' },
      Equity: { bg: 'bg-indigo-50/50', text: 'text-indigo-700', border: 'border-indigo-200/50', bar: 'bg-indigo-500' },
      Revenue: { bg: 'bg-teal-50/50', text: 'text-teal-700', border: 'border-teal-200/50', bar: 'bg-teal-500' },
      Expense: { bg: 'bg-rose-50/50', text: 'text-rose-700', border: 'border-rose-200/50', bar: 'bg-rose-500' }
    };
    
    const theme = colorMap[baseType] || { bg: 'bg-slate-50/50', text: 'text-slate-700', border: 'border-slate-200/50', bar: 'bg-slate-500' };
    const relativePercent = Math.min(100, (Math.abs(balance) / maxAccountBalance) * 100);

    return (
      <TableRow
        key={acc.id}
        className={`group transition-all hover:bg-slate-50/80 ${isDeactivated ? 'opacity-50 bg-slate-50/20' : ''}`}
      >
        {/* Account Code & Guides */}
        <TableCell className="py-3 pl-4 font-mono text-xs font-semibold">
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: depth * 16 }}>
            {depth > 0 && (
              <span className="text-slate-300 font-mono mr-2 select-none" style={{ fontSize: 13 }}>
                ├─
              </span>
            )}
            
            {hasChildren && !isFiltering ? (
              <button 
                onClick={(e) => toggleCollapse(acc.id, e)} 
                className="p-1 mr-1 hover:bg-slate-200 rounded text-slate-500 cursor-pointer flex items-center justify-center transition-colors"
              >
                {collapsedIds[acc.id] ? <ChevronRight size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-600" />}
              </button>
            ) : (
              !isFiltering && <span style={{ width: 22, display: 'inline-block' }} />
            )}
            
            {!isFiltering && (
              <span className="mr-2 text-slate-400">
                {hasChildren ? (
                  collapsedIds[acc.id] ? <Folder size={14} className="fill-slate-100" /> : <FolderOpen size={14} className="fill-slate-100 text-slate-500" />
                ) : (
                  <FileText size={14} />
                )}
              </span>
            )}
            <span className="text-slate-700">{acc.code}</span>
          </div>
        </TableCell>

        {/* Account Name */}
        <TableCell className="py-3">
          <div className="flex items-center gap-2">
            <span className={`text-xs text-slate-800 tracking-tight group-hover:text-[#143e2b] transition-colors ${!acc.isPosting ? 'font-bold text-slate-900' : 'font-medium'}`}>
              {acc.name}
            </span>
            {acc.isSystem && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200/50 text-[9px] font-bold text-amber-700">
                <Lock className="w-2.5 h-2.5" />
                System
              </span>
            )}
          </div>
        </TableCell>

        {/* Major Type */}
        <TableCell className="py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${theme.text} ${theme.bg} border ${theme.border}`}>
            {acc.type}
          </span>
        </TableCell>

        {/* Subtype */}
        <TableCell className="py-3">
          <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/35">
            {acc.subtype || 'General'}
          </span>
        </TableCell>

        {/* Account Level */}
        <TableCell className="py-3 text-[11px] text-slate-500 font-semibold">
          {acc.level === 'MainHead' ? 'Main Head' : acc.level === 'SubHead' ? 'Sub Head' : 'Detail'}
        </TableCell>

        {/* Posting Account flag */}
        <TableCell className="py-3">
          {acc.isPosting ? (
            <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Yes (Leaf)
            </span>
          ) : (
            <span className="text-slate-400 text-xs font-medium">No (Group Header)</span>
          )}
        </TableCell>

        {/* Normal Balance */}
        <TableCell className="py-3 text-xs font-semibold text-slate-600 font-mono">
          {acc.normalBalance}
        </TableCell>

        {/* Current Balance */}
        <TableCell className="py-3 text-right font-mono text-xs">
          <div>
            <span className={`font-bold ${!acc.isPosting ? 'text-slate-900 font-extrabold' : 'text-slate-800'}`}>
              {formatCurrency(balance, acc.currency)}
            </span>
            {hasChildren && !isFiltering && (
              <span className="text-[9px] block text-slate-400 font-sans mt-0.5">rollup total</span>
            )}
            {!isDeactivated && (
              <div className="w-16 ml-auto bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                <div className={`h-full rounded-full ${theme.bar}`} style={{ width: `${relativePercent}%` }} />
              </div>
            )}
          </div>
        </TableCell>

        {/* Status */}
        <TableCell className="py-3">
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${isDeactivated ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {acc.status}
          </span>
        </TableCell>

        {/* Controls */}
        <TableCell className="py-3 text-right pr-4">
          <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => edit(acc)} 
              className="p-1.5 text-slate-500 hover:text-[#143e2b] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Account Properties"
            >
              <Edit3 size={13.5} />
            </button>
            <button 
              onClick={() => status(acc)} 
              disabled={acc.isSystem}
              className={`p-1.5 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ${acc.isSystem ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={acc.isSystem ? "Protected System Account" : "Toggle Active/Inactive"}
            >
              <Shield size={13.5} />
            </button>
            {acc.isPosting && (
              <button
                onClick={() => setSelectedGLAccountId(acc.id)}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="View General Ledger (GL) Register"
              >
                <Eye size={13.5} />
              </button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  // DRILL-DOWN SUMMARY CALCULATIONS
  const drillDownData = useMemo(() => {
    // 1. Level 1: Main Heads
    if (!selectedMainHead) {
      const heads = [
        { name: 'Assets', typeKeys: ['Asset', 'ContraAsset'] },
        { name: 'Liabilities', typeKeys: ['Liability', 'ContraLiability'] },
        { name: 'Equity', typeKeys: ['Equity', 'ContraEquity'] },
        { name: 'Revenue', typeKeys: ['Revenue', 'ContraRevenue'] },
        { name: 'Expenses', typeKeys: ['Expense', 'ContraExpense'] }
      ];

      return heads.map(h => {
        let opening = 0;
        let debits = 0;
        let credits = 0;
        let current = 0;
        let count = 0;

        accounts.forEach(a => {
          if (h.typeKeys.includes(a.type)) {
            if (a.isPosting) count++;
            if (!a.parentId) {
              const rec = getAccountBalancesRecursive(a.id);
              opening += rec.opening;
              debits += rec.debits;
              credits += rec.credits;
              current += rec.current;
            }
          }
        });

        return {
          key: h.name,
          name: h.name,
          accountsCount: count,
          opening,
          debits,
          credits,
          current
        };
      });
    }

    // 2. Level 2: Sub Heads
    if (selectedMainHead && !selectedSubHead) {
      const typeKeys = selectedMainHead === 'Assets' ? ['Asset', 'ContraAsset'] :
                       selectedMainHead === 'Liabilities' ? ['Liability', 'ContraLiability'] :
                       selectedMainHead === 'Equity' ? ['Equity', 'ContraEquity'] :
                       selectedMainHead === 'Revenue' ? ['Revenue', 'ContraRevenue'] : ['Expense', 'ContraExpense'];

      // Find unique subtypes in this category
      const uniqueSubtypes = Array.from(new Set(accounts.filter(a => typeKeys.includes(a.type)).map(a => a.subtype || 'General')));

      return uniqueSubtypes.map(sub => {
        let opening = 0;
        let debits = 0;
        let credits = 0;
        let current = 0;
        let count = 0;

        accounts.forEach(a => {
          if (typeKeys.includes(a.type) && (a.subtype || 'General') === sub) {
            if (a.isPosting) {
              count++;
              const direct = accountBalances[a.id] || { debits: 0, credits: 0, net: a.openingBalance };
              opening += a.openingBalance;
              debits += direct.debits;
              credits += direct.credits;
              current += direct.net;
            }
          }
        });

        return {
          key: sub,
          name: sub,
          accountsCount: count,
          opening,
          debits,
          credits,
          current
        };
      });
    }

    // 3. Level 3: Posting Accounts
    if (selectedMainHead && selectedSubHead) {
      const typeKeys = selectedMainHead === 'Assets' ? ['Asset', 'ContraAsset'] :
                       selectedMainHead === 'Liabilities' ? ['Liability', 'ContraLiability'] :
                       selectedMainHead === 'Equity' ? ['Equity', 'ContraEquity'] :
                       selectedMainHead === 'Revenue' ? ['Revenue', 'ContraRevenue'] : ['Expense', 'ContraExpense'];

      const leafAccounts = accounts.filter(a => 
        typeKeys.includes(a.type) && 
        (a.subtype || 'General') === selectedSubHead &&
        a.isPosting
      );

      return leafAccounts.map(a => {
        const direct = accountBalances[a.id] || { debits: 0, credits: 0, net: a.openingBalance };
        return {
          key: a.id,
          code: a.code,
          name: a.name,
          normalBalance: a.normalBalance,
          opening: a.openingBalance,
          debits: direct.debits,
          credits: direct.credits,
          current: direct.net
        };
      });
    }

    return [];
  }, [selectedMainHead, selectedSubHead, accounts, accountBalances]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { name: 'Assets', type: 'Asset', total: categoryTotals.Asset, count: accounts.filter(a => ['Asset', 'ContraAsset'].includes(a.type) && a.isPosting).length },
          { name: 'Liabilities', type: 'Liability', total: categoryTotals.Liability, count: accounts.filter(a => ['Liability', 'ContraLiability'].includes(a.type) && a.isPosting).length },
          { name: 'Equity', type: 'Equity', total: categoryTotals.Equity, count: accounts.filter(a => ['Equity', 'ContraEquity'].includes(a.type) && a.isPosting).length },
          { name: 'Revenue', type: 'Revenue', total: categoryTotals.Revenue, count: accounts.filter(a => ['Revenue', 'ContraRevenue'].includes(a.type) && a.isPosting).length },
          { name: 'Expenses', type: 'Expense', total: categoryTotals.Expense, count: accounts.filter(a => ['Expense', 'ContraExpense'].includes(a.type) && a.isPosting).length },
        ].map(({ name, type, total, count }) => {
          const isSelected = selectedType === type;
          return (
            <button
              key={name}
              onClick={() => setSelectedType(isSelected ? 'All' : type)}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                isSelected 
                  ? 'bg-[#143e2b] text-white border-[#143e2b] shadow-md scale-102' 
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{name}</span>
                <div className={`w-2.5 h-2.5 rounded-full ${
                  type === 'Asset' ? 'bg-emerald-500' :
                  type === 'Liability' ? 'bg-amber-500' :
                  type === 'Equity' ? 'bg-indigo-500' :
                  type === 'Revenue' ? 'bg-teal-500' : 'bg-rose-500'
                }`} />
              </div>
              <h4 className="text-sm font-extrabold truncate">{formatCurrency(total, 'USD')}</h4>
              <span className={`text-[10px] block mt-1.5 font-medium ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                {count} Posting Registers
              </span>
            </button>
          );
        })}
      </div>

      {/* Top Search & Actions Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-80">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search code, name, or subtypes..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 h-10 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-400"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDeactivated}
              onChange={e => setShowDeactivated(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-700 accent-[#143e2b]"
            />
            Include Inactive Registers
          </label>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-10 px-3.5 gap-1.5 text-xs font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 rounded-xl"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImportCSVClick}
            className="h-10 px-3.5 gap-1.5 text-xs font-semibold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 rounded-xl"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            Import CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="h-10 px-3.5 gap-1.5 text-xs font-semibold text-rose-600 bg-white border-rose-100 hover:bg-rose-50 rounded-xl hover:text-rose-700"
            title="Wipe state to reset accounts tree"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset State
          </Button>

          <Button
            size="sm"
            onClick={() => { setParentIdForNew(''); openCreate(); }}
            className="h-10 px-4 gap-1.5 text-xs font-bold text-white bg-[#143e2b] hover:bg-[#0c2a1d] rounded-xl shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Account
          </Button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportCSV} 
            accept=".csv" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Explanatory Info Alert */}
      {!isFiltering && (
        <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-2xl p-4 flex gap-3 items-start">
          <Info className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            <strong>Hierarchical Tree Explorer:</strong> Parents act as header folders and dynamically calculate aggregate balances. Postings are only permitted to Leaf detail accounts. System accounts (🔒) protect invoice and tax routing paths.
          </p>
        </div>
      )}

      {/* Main Accounts Table Layout */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-52 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-4">ACCOUNT CODE</TableHead>
              <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">REGISTER NAME</TableHead>
              <TableHead className="w-32 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">MAJOR TYPE</TableHead>
              <TableHead className="w-40 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">SUB-SEGMENT</TableHead>
              <TableHead className="w-28 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">LEVEL</TableHead>
              <TableHead className="w-36 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">POSTING ALLOWED</TableHead>
              <TableHead className="w-24 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">NORMAL</TableHead>
              <TableHead className="w-44 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">RUNNING BALANCE</TableHead>
              <TableHead className="w-24 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">STATUS</TableHead>
              <TableHead className="w-32 text-right text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pr-4">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {isFiltering ? (
              filteredAccounts.map(acc => renderRow(acc, 0, false))
            ) : (
              treeCategories.map(cat => (
                <React.Fragment key={cat.name}>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 font-bold border-t border-b border-slate-100">
                    <TableCell colSpan={10} className="py-2.5 pl-4 text-xs font-bold text-slate-700">
                      {cat.name} <span className="font-normal text-slate-400 text-[10px] ml-1">({cat.items.length} registers)</span>
                    </TableCell>
                  </TableRow>
                  {cat.items.map(item => renderRow(item.account, item.depth, item.hasChildren))}
                </React.Fragment>
              ))
            )}

            {((isFiltering && filteredAccounts.length === 0) || (!isFiltering && treeCategories.length === 0)) && (
              <TableRow>
                <TableCell colSpan={10} className="py-20 text-center text-slate-400">
                  <div className="max-w-xs mx-auto space-y-3">
                    <span className="text-4xl">📂</span>
                    <p className="text-xs font-bold text-slate-600">No matching accounts found</p>
                    <Button
                      size="sm"
                      onClick={() => { setParentIdForNew(''); openCreate(); }}
                      className="mt-2 h-9 text-xs bg-[#143e2b] text-white hover:bg-[#0b291c] rounded-xl"
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

      {/* ACCOUNT BALANCE SUMMARY (GAAP AUDIT ENGINE) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-700" />
              GAAP Audit Trail Balance Summary
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify the Double-Entry bookkeeping ledger trial status. Drill down from major classifications to source journal entries.
            </p>
          </div>
          
          {/* Breadcrumb navigator */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600">
            <button onClick={() => { setSelectedMainHead(null); setSelectedSubHead(null); }} className="hover:text-[#143e2b]">Summary</button>
            {selectedMainHead && (
              <>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <button onClick={() => { setSelectedSubHead(null); }} className="hover:text-[#143e2b]">{selectedMainHead}</button>
              </>
            )}
            {selectedSubHead && (
              <>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-slate-800 font-bold">{selectedSubHead}</span>
              </>
            )}
          </div>
        </div>

        {/* Drill-down grid or table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider pl-4">
                  {selectedSubHead ? 'ACCOUNT CODE & NAME' : selectedMainHead ? 'REPORTING SUB-HEAD' : 'MAJOR HEAD'}
                </TableHead>
                {!selectedSubHead && (
                  <TableHead className="w-32 text-center text-[10px] font-bold uppercase tracking-wider">REGISTERS</TableHead>
                )}
                {selectedSubHead && (
                  <TableHead className="w-32 text-[10px] font-bold uppercase tracking-wider">NORMAL BALANCE</TableHead>
                )}
                <TableHead className="w-40 text-right text-[10px] font-bold uppercase tracking-wider">OPENING BALANCE</TableHead>
                <TableHead className="w-40 text-right text-[10px] font-bold uppercase tracking-wider">DEBIT (+)</TableHead>
                <TableHead className="w-40 text-right text-[10px] font-bold uppercase tracking-wider">CREDIT (-)</TableHead>
                <TableHead className="w-44 text-right text-[10px] font-bold uppercase tracking-wider pr-4">CURRENT BALANCE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {drillDownData.map((row) => (
                <TableRow 
                  key={row.key} 
                  onClick={() => {
                    if (!selectedMainHead) {
                      setSelectedMainHead(row.name);
                    } else if (!selectedSubHead) {
                      setSelectedSubHead(row.name);
                    } else {
                      setSelectedGLAccountId(row.key);
                    }
                  }}
                  className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <TableCell className="py-3 pl-4">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      {selectedSubHead && <span className="font-mono text-slate-400 text-[11px] font-normal">{(row as any).code} — </span>}
                      {row.name}
                      <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 ml-1 transition-opacity" />
                    </span>
                  </TableCell>
                  {!selectedSubHead && (
                    <TableCell className="py-3 text-center text-xs font-semibold text-slate-500">
                      {(row as any).accountsCount} accounts
                    </TableCell>
                  )}
                  {selectedSubHead && (
                    <TableCell className="py-3 text-xs font-medium text-slate-500 font-mono">
                      {(row as any).normalBalance}
                    </TableCell>
                  )}
                  <TableCell className="py-3 text-right font-mono text-xs text-slate-600">
                    {formatCurrency(row.opening, 'USD')}
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs text-emerald-600 font-semibold">
                    {formatCurrency(row.debits, 'USD')}
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs text-rose-600 font-semibold">
                    {formatCurrency(row.credits, 'USD')}
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono text-xs font-extrabold text-slate-900 pr-4">
                    {formatCurrency(row.current, 'USD')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* GENERAL LEDGER SLIDE OVERLAY PANEL */}
      {selectedGLAccountId && glAccount && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="bg-white w-[850px] h-full shadow-2xl flex flex-col p-6 animate-slide-in relative border-l border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ledger Audit Trial</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  General Ledger: {glAccount.code} — {glAccount.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type: {glAccount.type} ({glAccount.normalBalance} Normal) | Subtype: {glAccount.subtype}
                </p>
              </div>
              <button 
                onClick={() => setSelectedGLAccountId(null)} 
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Quick Cards */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Opening Balance', val: glAccount.openingBalance, color: 'text-slate-700' },
                { label: 'Debit Postings', val: glLines.reduce((sum, l) => sum + l.debit, 0), color: 'text-emerald-700' },
                { label: 'Credit Postings', val: glLines.reduce((sum, l) => sum + l.credit, 0), color: 'text-rose-700' },
                { label: 'Current Balance', val: getAccountBalancesRecursive(glAccount.id).current, color: 'text-[#143e2b] font-extrabold' }
              ].map(card => (
                <div key={card.label} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{card.label}</span>
                  <p className={`text-sm font-bold font-mono mt-1 ${card.color}`}>{formatCurrency(card.val, 'USD')}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search by reference, memo, date..."
                value={glSearchQuery}
                onChange={e => setGlSearchQuery(e.target.value)}
                className="pl-9 h-10 border border-slate-200 rounded-xl text-xs bg-slate-50/50"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-white">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0">
                  <TableRow>
                    <TableHead className="w-24 text-[10px] font-bold">DATE</TableHead>
                    <TableHead className="w-28 text-[10px] font-bold">REFERENCE</TableHead>
                    <TableHead className="text-[10px] font-bold">DESCRIPTION / MEMO</TableHead>
                    <TableHead className="w-24 text-right text-[10px] font-bold">DEBIT</TableHead>
                    <TableHead className="w-24 text-right text-[10px] font-bold">CREDIT</TableHead>
                    <TableHead className="w-28 text-right text-[10px] font-bold">BALANCE</TableHead>
                    <TableHead className="w-20 text-center text-[10px] font-bold">AUDIT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <TableRow className="bg-slate-50/40 text-slate-500">
                    <TableCell className="py-2.5 font-sans">—</TableCell>
                    <TableCell className="py-2.5">OPENING</TableCell>
                    <TableCell className="py-2.5 font-sans">Initial pre-seeded opening register balance</TableCell>
                    <TableCell className="py-2.5 text-right">—</TableCell>
                    <TableCell className="py-2.5 text-right">—</TableCell>
                    <TableCell className="py-2.5 text-right font-bold">{formatCurrency(glAccount.openingBalance, 'USD')}</TableCell>
                    <TableCell className="py-2.5 text-center">—</TableCell>
                  </TableRow>
                  {filteredGLLines.map((line, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50">
                      <TableCell className="py-2.5 text-slate-500">{line.date}</TableCell>
                      <TableCell className="py-2.5 font-bold text-slate-700">{line.reference}</TableCell>
                      <TableCell className="py-2.5 font-sans text-slate-600 max-w-[200px] truncate" title={line.description}>{line.description}</TableCell>
                      <TableCell className="py-2.5 text-right text-emerald-600 font-semibold">{line.debit > 0 ? formatCurrency(line.debit, 'USD') : '—'}</TableCell>
                      <TableCell className="py-2.5 text-right text-rose-600 font-semibold">{line.credit > 0 ? formatCurrency(line.credit, 'USD') : '—'}</TableCell>
                      <TableCell className="py-2.5 text-right font-bold text-slate-800">{formatCurrency(line.runningBalance, 'USD')}</TableCell>
                      <TableCell className="py-2.5 text-center">
                        <button
                          onClick={() => setActiveSourceTx(line.entry)}
                          className="p-1 hover:bg-blue-50 text-blue-600 rounded cursor-pointer"
                          title="Audit Source Transaction Document"
                        >
                          <Shield size={12.5} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredGLLines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                        No transactions posted to this account.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <Button size="sm" onClick={() => setSelectedGLAccountId(null)} className="h-9 px-4 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 rounded-xl">
                Close Register
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SOURCE TRANSACTION DOCUMENT VIEWER OVERLAY MODAL */}
      {activeSourceTx && sourceTxDetails && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-51 animate-fade-in">
          <div className="bg-white rounded-3xl w-[700px] max-h-[85vh] overflow-hidden shadow-2xl flex flex-col p-6 animate-scale-up border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Source Document Audit Viewer
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest">
                    Posted Transaction Ledger Record
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveSourceTx(null)} 
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Document Render Switch */}
            <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-4">
              {sourceTxDetails.type === 'Invoice' && (() => {
                const inv = sourceTxDetails.data;
                return (
                  <div className="space-y-4 font-sans">
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16 }} className="p-4 flex justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Document Class</span>
                        <h4 className="text-base font-extrabold text-[#143e2b]">{inv.invoiceNumber}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Date: {inv.invoiceDate}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Entity</span>
                        <p className="text-xs font-bold text-slate-800">{inv.customerName || inv.customerId}</p>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Posted
                        </span>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="text-[10px] font-bold">PRODUCT / DESCRIPTION</TableHead>
                            <TableHead className="w-16 text-center text-[10px] font-bold">QTY</TableHead>
                            <TableHead className="w-24 text-right text-[10px] font-bold">PRICE</TableHead>
                            <TableHead className="w-28 text-right text-[10px] font-bold">AMOUNT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100 text-xs">
                          {inv.lines?.map((line: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="py-2.5 font-semibold text-slate-700">
                                {line.productName || line.productId}
                                {line.description && <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{line.description}</span>}
                              </TableCell>
                              <TableCell className="py-2.5 text-center text-slate-600">{line.quantity}</TableCell>
                              <TableCell className="py-2.5 text-right font-mono text-slate-600">{formatCurrency(line.unitPrice)}</TableCell>
                              <TableCell className="py-2.5 text-right font-mono font-bold text-slate-800">{formatCurrency(line.lineTotal)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-60 bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 text-xs font-semibold">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal:</span>
                          <span className="font-mono">{formatCurrency(inv.subTotal)}</span>
                        </div>
                        {inv.discountTotal > 0 && (
                          <div className="flex justify-between text-rose-600">
                            <span>Discounts:</span>
                            <span className="font-mono">-{formatCurrency(inv.discountTotal)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-500">
                          <span>Tax Total:</span>
                          <span className="font-mono">{formatCurrency(inv.taxTotal)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-extrabold text-sm">
                          <span>Total Amount:</span>
                          <span className="font-mono text-[#143e2b]">{formatCurrency(inv.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {sourceTxDetails.type === 'Bill' && (() => {
                const bill = sourceTxDetails.data;
                return (
                  <div className="space-y-4 font-sans">
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16 }} className="p-4 flex justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Document Class</span>
                        <h4 className="text-base font-extrabold text-amber-700">{bill.billNumber}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Date: {bill.billDate}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Supplier Entity</span>
                        <p className="text-xs font-bold text-slate-800">{bill.vendorName || bill.vendorId}</p>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-100">
                          Posted
                        </span>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="text-[10px] font-bold">ITEM / DESCRIPTION</TableHead>
                            <TableHead className="w-16 text-center text-[10px] font-bold">QTY</TableHead>
                            <TableHead className="w-24 text-right text-[10px] font-bold">PRICE</TableHead>
                            <TableHead className="w-28 text-right text-[10px] font-bold">AMOUNT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100 text-xs">
                          {bill.lines?.map((line: any, idx: number) => (
                            <TableRow key={idx}>
                              <TableCell className="py-2.5 font-semibold text-slate-700">
                                {line.productName || line.itemId || 'Procured Goods/Services'}
                                {line.description && <span className="block text-[10px] font-normal text-slate-400 mt-0.5">{line.description}</span>}
                              </TableCell>
                              <TableCell className="py-2.5 text-center text-slate-600">{line.quantity}</TableCell>
                              <TableCell className="py-2.5 text-right font-mono text-slate-600">{formatCurrency(line.unitPrice)}</TableCell>
                              <TableCell className="py-2.5 text-right font-mono font-bold text-slate-800">{formatCurrency(line.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-60 bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 text-xs font-semibold">
                        <div className="flex justify-between text-slate-500">
                          <span>Subtotal:</span>
                          <span className="font-mono">{formatCurrency(bill.subTotal || bill.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Tax Total:</span>
                          <span className="font-mono">{formatCurrency(bill.taxTotal || 0)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-extrabold text-sm">
                          <span>Total Amount:</span>
                          <span className="font-mono text-amber-700">{formatCurrency(bill.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {sourceTxDetails.type === 'Journal' && (() => {
                const entry = sourceTxDetails.data;
                const debitsTotal = entry.lines?.reduce((s: number, l: any) => s + (l.debit || 0), 0) || 0;
                const creditsTotal = entry.lines?.reduce((s: number, l: any) => s + (l.credit || 0), 0) || 0;
                return (
                  <div className="space-y-4">
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16 }} className="p-4 grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Document Class</span>
                        <h4 className="text-sm font-extrabold text-slate-900">{entry.reference || 'Manual Ledger Adjustment'}</h4>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Date: {entry.date}</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Audit Status</span>
                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1 font-bold">
                          <User className="w-3.5 h-3.5" /> Submitted: {entry.submittedBy || 'System Engine'}
                        </p>
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#edf7f3] text-[#143e2b]">
                          Fully Posted
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-slate-150 pt-2 mt-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Transaction Memo / Description</span>
                        <p className="text-xs text-slate-600 mt-1 font-sans font-medium">{entry.description || 'No descriptive memo logged.'}</p>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow>
                            <TableHead className="text-[10px] font-bold">ACCOUNT REGISTER</TableHead>
                            <TableHead className="text-[10px] font-bold">LINE REMARKS</TableHead>
                            <TableHead className="w-28 text-right text-[10px] font-bold">DEBIT</TableHead>
                            <TableHead className="w-28 text-right text-[10px] font-bold">CREDIT</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {entry.lines?.map((line: any, idx: number) => {
                            const acc = accounts.find(a => a.id === line.accountId);
                            return (
                              <TableRow key={idx}>
                                <TableCell className="py-2.5 font-bold text-slate-700">
                                  {acc ? `${acc.code} — ${acc.name}` : line.accountId}
                                </TableCell>
                                <TableCell className="py-2.5 font-sans text-slate-500">{line.memo || '—'}</TableCell>
                                <TableCell className="py-2.5 text-right text-emerald-600 font-semibold">{line.debit > 0 ? formatCurrency(line.debit) : '—'}</TableCell>
                                <TableCell className="py-2.5 text-right text-rose-600 font-semibold">{line.credit > 0 ? formatCurrency(line.credit) : '—'}</TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                            <TableCell colSpan={2} className="py-3 pl-4 font-sans text-xs">Total Ledger Distribution:</TableCell>
                            <TableCell className="py-3 text-right">{formatCurrency(debitsTotal)}</TableCell>
                            <TableCell className="py-3 text-right">{formatCurrency(creditsTotal)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-150 flex justify-end gap-2">
              <Button size="sm" onClick={() => setActiveSourceTx(null)} className="h-9 px-4 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 rounded-xl">
                Done Audit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// End of Chart of Accounts component
