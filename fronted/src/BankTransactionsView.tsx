import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeftRight, Search, Download, Printer,
  FileSpreadsheet, RefreshCw, Landmark,
  Clock, CheckCircle2, X, TrendingUp, TrendingDown, ArrowRightLeft, Hash
} from 'lucide-react';
import type { Entity } from './EntitySettings';
import { useBankingStore } from './stores';
import { money } from './lib/currency';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BankTransactionRecord {
  id: string;
  date: string;
  ref: string;
  bank: string;
  bankAccountId?: string;
  description: string;
  payee: string;
  mode: string;
  type: string;
  amount: number;
  curr: string;
  status: string;
  journalEntryId?: string;
}

type DatePreset = 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'ytd' | 'all';

function getPresetDates(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (preset === 'thisMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: firstDay.toISOString().slice(0, 10), to: todayStr };
  }
  if (preset === 'lastMonth') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: firstDay.toISOString().slice(0, 10), to: lastDay.toISOString().slice(0, 10) };
  }
  if (preset === 'thisQuarter') {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    const firstDay = new Date(now.getFullYear(), qMonth, 1);
    return { from: firstDay.toISOString().slice(0, 10), to: todayStr };
  }
  if (preset === 'ytd') {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    return { from: firstDay.toISOString().slice(0, 10), to: todayStr };
  }
  return { from: '', to: '' };
}

export const BankTransactionsView = ({
  activeEntityId,
  entities,
}: {
  activeEntityId: string;
  entities: Entity[];
}) => {
  const currentEntity = entities.find((e) => e.id === activeEntityId) || entities[0];
  const { transactions, bankAccounts, cashAccounts, fetchTransactions, fetchBankAccounts, fetchCashAccounts, loading } = useBankingStore();

  const [query, setQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [flowFilter, setFlowFilter] = useState<'all' | 'in' | 'out'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [preset, setPreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTxn, setSelectedTxn] = useState<BankTransactionRecord | null>(null);

  const loadData = async () => {
    await Promise.all([
      fetchTransactions(undefined, activeEntityId),
      fetchBankAccounts(activeEntityId),
      fetchCashAccounts(activeEntityId),
    ]);
  };

  useEffect(() => {
    loadData();
  }, [activeEntityId]);

  const handlePresetChange = (p: DatePreset) => {
    setPreset(p);
    const { from, to } = getPresetDates(p);
    setFromDate(from);
    setToDate(to);
  };

  // Normalized transaction records
  const transactionsData: BankTransactionRecord[] = useMemo(() => {
    return transactions.map((t: any) => ({
      id: String(t.id),
      date: t.date || '',
      ref: t.ref || 'TXN',
      bank: t.bank || 'Main Bank',
      bankAccountId: t.bankAccountId,
      description: t.description || '',
      payee: t.payee || t.description || '—',
      mode: t.mode || (t.amount >= 0 ? 'Cash In' : 'Cash Out'),
      type: t.type || (t.amount >= 0 ? 'Receipt' : 'Payment'),
      amount: t.amount || 0,
      curr: t.curr || currentEntity?.currencyCode || 'PKR',
      status: t.status || 'Posted',
      journalEntryId: t.journalEntryId,
    }));
  }, [transactions, currentEntity]);

  // Combined Account Options
  const accountOptions = useMemo(() => {
    const banks = bankAccounts.map((b) => ({ id: b.id, name: `${b.name} (${b.code})`, type: 'Bank' }));
    const cash = cashAccounts.map((c) => ({ id: c.id, name: `${c.name} (${c.code})`, type: 'Cash' }));
    return [...banks, ...cash];
  }, [bankAccounts, cashAccounts]);

  // Unique Transaction Types
  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    transactionsData.forEach((t) => { if (t.type) set.add(t.type); });
    return Array.from(set);
  }, [transactionsData]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactionsData.filter((t) => {
      // Date filter
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;

      // Account filter
      if (accountFilter !== 'all') {
        if (t.bankAccountId && t.bankAccountId !== accountFilter) return false;
        if (!t.bankAccountId && !t.bank.toLowerCase().includes(accountFilter.toLowerCase())) return false;
      }

      // Flow filter (Inflow vs Outflow)
      if (flowFilter === 'in' && t.amount < 0) return false;
      if (flowFilter === 'out' && t.amount >= 0) return false;

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Text query
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesDate = t.date.includes(q);
        const matchesRef = t.ref.toLowerCase().includes(q);
        const matchesBank = t.bank.toLowerCase().includes(q);
        const matchesPayee = t.payee.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesType = t.type.toLowerCase().includes(q);
        if (!matchesDate && !matchesRef && !matchesBank && !matchesPayee && !matchesDesc && !matchesType) {
          return false;
        }
      }

      return true;
    });
  }, [transactionsData, fromDate, toDate, accountFilter, flowFilter, typeFilter, query]);

  // 4 Top Financial KPIs
  const totalInflow = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOutflow = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const netMovement = totalInflow - totalOutflow;
  const totalCount = filtered.length;

  // ─── Branded Bank Voucher PDF Generator ─────────────────────────────────────
  const generateVoucherPDF = (t: BankTransactionRecord) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const isInflow = t.amount >= 0;
    const primaryColor: [number, number, number] = isInflow ? [16, 185, 129] : [15, 76, 129];
    const darkColor: [number, number, number] = [15, 23, 42];
    const grayColor: [number, number, number] = [100, 116, 139];
    const lightBg: [number, number, number] = [248, 250, 252];
    const borderGray: [number, number, number] = [226, 232, 240];

    // Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(isInflow ? 'BANK RECEIPT / DEPOSIT VOUCHER' : 'BANK PAYMENT / DISBURSEMENT VOUCHER', margin, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Voucher Ref: ${t.ref || 'TXN'}`, margin, 21);
    doc.text(`Transaction Date: ${t.date}`, pageWidth - margin, 14, { align: 'right' });
    doc.text(`Status: ${t.status || 'Posted'}`, pageWidth - margin, 21, { align: 'right' });

    // Details Grid (Company & Bank Account)
    const boxY = 34;
    const boxH = 34;
    const colW = (contentWidth - 6) / 2;

    // Company Box
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(margin, boxY, colW, boxH, 2, 2, 'FD');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(currentEntity?.name || 'Company ERP', margin + 4, boxY + 7);

    doc.setTextColor(...darkColor);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    const compAny = currentEntity as any;
    let compY = boxY + 13;
    if (compAny?.taxId || compAny?.ntn) {
      doc.text(`Tax ID / NTN: ${compAny.taxId || compAny.ntn}`, margin + 4, compY);
      compY += 4.5;
    }
    if (compAny?.country || compAny?.legalName) {
      doc.text(`${compAny.legalName || ''} • ${compAny.country || ''}`.trim(), margin + 4, compY);
      compY += 4.5;
    }
    doc.text(`Base Currency: ${currentEntity?.currencyCode || 'PKR'}`, margin + 4, compY);

    // Bank / Cash Account Box
    const bankX = margin + colW + 6;
    doc.setFillColor(...lightBg);
    doc.roundedRect(bankX, boxY, colW, boxH, 2, 2, 'FD');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCOUNT & COUNTERPARTY DETAILS', bankX + 4, boxY + 7);

    doc.setTextColor(...darkColor);
    doc.setFontSize(9.5);
    doc.text(t.bank, bankX + 4, boxY + 14);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Party / Payee: ${t.payee}`, bankX + 4, boxY + 20);
    doc.text(`Classification: ${t.type}`, bankX + 4, boxY + 25);
    doc.text(`Movement Mode: ${t.mode}`, bankX + 4, boxY + 30);

    // Amount Banner
    const bannerY = boxY + boxH + 6;
    doc.setFillColor(isInflow ? 236 : 239, isInflow ? 253 : 246, isInflow ? 245 : 255);
    doc.setDrawColor(isInflow ? 167 : 199, isInflow ? 243 : 210, isInflow ? 208 : 254);
    doc.roundedRect(margin, bannerY, contentWidth, 18, 2, 2, 'FD');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(isInflow ? 'TOTAL AMOUNT DEPOSITED / RECEIVED' : 'TOTAL AMOUNT DISBURSED / PAID', margin + 4, bannerY + 6.5);

    doc.setFontSize(14);
    doc.text(money(Math.abs(t.amount), t.curr), margin + 4, bannerY + 14);

    // General Ledger Breakdown Table
    const tableStartY = bannerY + 24;
    const tableHeaders = ['Account Description', 'Reference', 'Type', 'Debit (Cash In)', 'Credit (Cash Out)'];
    const tableRows = [
      [
        t.bank,
        t.ref,
        t.type,
        isInflow ? money(Math.abs(t.amount), t.curr) : '—',
        !isInflow ? money(Math.abs(t.amount), t.curr) : '—',
      ],
      [
        `Offset Account: ${t.payee || t.description}`,
        t.ref,
        t.type,
        !isInflow ? money(Math.abs(t.amount), t.curr) : '—',
        isInflow ? money(Math.abs(t.amount), t.curr) : '—',
      ],
    ];

    autoTable(doc, {
      startY: tableStartY,
      head: [tableHeaders],
      body: tableRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3, textColor: darkColor },
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
    });

    // Signature Block
    const signY = 190;
    const signW = 55;

    doc.setDrawColor(...borderGray);
    doc.line(margin, signY, margin + signW, signY);
    doc.line(pageWidth - margin - signW, signY, pageWidth - margin, signY);

    doc.setTextColor(...grayColor);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Prepared By / Cashier', margin, signY + 4);
    doc.text('Authorized Signatory / Approver', pageWidth - margin - signW, signY + 4);

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.text('Official Banking Transaction Voucher. Generated from AccountBook General Ledger Module.', margin, pageHeight - 8);

    const cleanRef = (t.ref || 'Voucher').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Bank_Voucher_${cleanRef}.pdf`);
  };

  // ─── Excel & CSV Exports ───────────────────────────────────────────────────
  const exportTxnsExcel = () => {
    const headers = ['Date', 'Reference', 'Bank / Cash Account', 'Payee / Counterparty', 'Mode', 'Type', 'Debit (Inflow)', 'Credit (Outflow)', 'Currency', 'Status'];
    const rows = filtered.map((t) => [
      t.date,
      t.ref,
      t.bank,
      t.payee,
      t.mode,
      t.type,
      t.amount > 0 ? t.amount : 0,
      t.amount < 0 ? Math.abs(t.amount) : 0,
      t.curr,
      t.status,
    ]);
    downloadExcel(`Bank_Transactions_${new Date().toISOString().slice(0, 10)}`, 'Transactions', headers, rows);
  };

  const exportTxnsCSV = () => {
    const headers = ['Date', 'Reference', 'Bank / Cash Account', 'Payee / Counterparty', 'Mode', 'Type', 'Debit (Inflow)', 'Credit (Outflow)', 'Currency', 'Status'];
    const rows = filtered.map((t) => [
      t.date,
      t.ref,
      t.bank,
      t.payee,
      t.mode,
      t.type,
      t.amount > 0 ? t.amount : 0,
      t.amount < 0 ? Math.abs(t.amount) : 0,
      t.curr,
      t.status,
    ]);
    downloadCSV(`Bank_Transactions_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-xs">
        <div>
          <h1 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-emerald-600" /> Bank & Cash Transactions
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            General ledger bank movements, cash deposits, disbursements, and inter-account transfers for {currentEntity?.name || 'Active Company'}.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={exportTxnsExcel}
            className="secondary h-8.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            title="Export transactions register to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
          </button>
          <button
            onClick={exportTxnsCSV}
            className="secondary h-8.5 px-2.5 rounded-lg text-xs font-semibold"
          >
            CSV
          </button>
          <button
            onClick={() => window.print()}
            className="secondary h-8.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={loadData}
            className="secondary h-8.5 w-8.5 rounded-lg flex items-center justify-center text-xs text-[var(--color-text)]"
            title="Refresh transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards - Modern KPI Design */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL INFLOW (+)', value: money(totalInflow, currentEntity?.currencyCode), desc: 'Deposits & customer receipts', icon: TrendingUp, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'TOTAL OUTFLOW (-)', value: money(totalOutflow, currentEntity?.currencyCode), desc: 'Disbursements & payments', icon: TrendingDown, color: 'from-rose-500 to-red-500', bg: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400' },
          { label: 'NET CASH MOVEMENT', value: money(netMovement, currentEntity?.currencyCode), desc: netMovement >= 0 ? 'Net positive liquidity' : 'Net liquidity contraction', icon: ArrowRightLeft, color: 'from-blue-500 to-indigo-500', bg: netMovement >= 0 ? 'bg-blue-50 dark:bg-blue-950/30' : 'bg-amber-50 dark:bg-amber-950/30', textColor: netMovement >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400' },
          { label: 'TRANSACTIONS COUNT', value: totalCount, desc: 'Ledger movement records', icon: Hash, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/30', textColor: 'text-violet-600 dark:text-violet-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-lg font-semibold mt-1 ${kpi.textColor}`}>{kpi.value}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{kpi.desc}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white shadow-lg`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${kpi.bg} opacity-50`} />
          </div>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-xs">
        {/* Date Presets */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-bold text-[var(--color-text-muted)] mr-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Period:
          </span>
          {(['thisMonth', 'lastMonth', 'thisQuarter', 'ytd', 'all'] as DatePreset[]).map((p) => {
            const labels: Record<DatePreset, string> = {
              thisMonth: 'This Month',
              lastMonth: 'Last Month',
              thisQuarter: 'This Quarter',
              ytd: 'YTD',
              all: 'All Time',
            };
            const active = preset === p;
            return (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`h-7.5 px-2.5 rounded-md text-xs font-semibold transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-2xs font-bold'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[var(--color-text)]'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Filters and Non-Overlapping Search Box */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">🏦 All Bank & Cash Accounts</option>
            {accountOptions.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Flow Filter */}
          <select
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value as any)}
            className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">⚡ All Flows</option>
            <option value="in">⬇ Inflow (Deposits)</option>
            <option value="out">⬆ Outflow (Withdrawals)</option>
          </select>

          {/* Type Filter */}
          {uniqueTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500 transition-colors"
            >
              <option value="all">📋 All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}

          {/* Search Box - Guaranteed Zero Text/Icon Overlap */}
          <div className="flex items-center h-8 w-56 px-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 transition-all shadow-2xs">
            <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ref, payee, bank..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                padding: '0 !important',
                width: '100%',
                fontSize: '12px',
                color: 'var(--color-text)',
                boxShadow: 'none',
              }}
              className="!p-0 !border-0 !outline-none !bg-transparent w-full text-xs text-[var(--color-text)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 text-sm px-1 leading-none font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xs overflow-hidden">
        <div className="p-3 border-b border-[var(--color-border)] flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <span className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-2">
            <Landmark className="w-3.5 h-3.5 text-blue-600" /> Bank & Cash Transactions Ledger ({filtered.length})
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Click <strong>Voucher PDF</strong> to generate an official transaction advice slip.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/80 text-[var(--color-text-muted)] border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3">Bank Account</th>
                <th className="py-2.5 px-3">Payee / Description</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3 text-right">Debit (Inflow)</th>
                <th className="py-2.5 px-3 text-right">Credit (Outflow)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <p className="font-semibold text-xs">Loading bank transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-gray-400" />
                      <p className="font-semibold text-xs">No bank or cash movements found for the selected criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isInflow = t.amount > 0;
                  const isOutflow = t.amount < 0;

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-[var(--color-text)] whitespace-nowrap">
                        {t.date}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        <button
                          onClick={() => setSelectedTxn(t)}
                          className="hover:underline text-left"
                          title="View transaction details"
                        >
                          {t.ref}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[var(--color-text-strong)]">
                        {t.bank}
                      </td>
                      <td className="py-2.5 px-3 text-[var(--color-text)] max-w-xs truncate" title={t.payee}>
                        {t.payee}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[var(--color-text)] font-semibold text-[10px]">
                          {t.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {isInflow ? money(t.amount, t.curr) : <span className="text-gray-300 dark:text-gray-700 font-normal">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                        {isOutflow ? money(Math.abs(t.amount), t.curr) : <span className="text-gray-300 dark:text-gray-700 font-normal">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => generateVoucherPDF(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-semibold transition-all shadow-2xs"
                          title="Download Voucher PDF"
                        >
                          <Download className="w-3 h-3" /> Voucher PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-900 border-t-2 border-[var(--color-border)] font-bold text-xs">
                <tr>
                  <td colSpan={5} className="py-3 px-3.5 uppercase tracking-wider text-[var(--color-text-muted)] text-right">
                    Movement Totals:
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {money(totalInflow, currentEntity?.currencyCode)}
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                    {money(totalOutflow, currentEntity?.currencyCode)}
                  </td>
                  <td colSpan={2} className="py-3 px-3.5 text-right font-bold text-blue-600">
                    Net: {money(netMovement, currentEntity?.currencyCode)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setSelectedTxn(null)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-strong)] flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-600" /> Transaction Advice #{selectedTxn.ref}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Audit log & general ledger breakdown</p>
              </div>
              <button onClick={() => setSelectedTxn(null)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-[var(--color-border)] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Date:</span>
                  <span className="font-semibold text-[var(--color-text-strong)]">{selectedTxn.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Bank / Cash Account:</span>
                  <span className="font-semibold text-[var(--color-text-strong)]">{selectedTxn.bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Payee / Beneficiary:</span>
                  <span className="font-semibold text-[var(--color-text-strong)]">{selectedTxn.payee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Classification:</span>
                  <span className="font-semibold text-blue-600">{selectedTxn.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Amount:</span>
                  <span className={`font-mono font-extrabold text-sm ${selectedTxn.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {money(Math.abs(selectedTxn.amount), selectedTxn.curr)} ({selectedTxn.amount >= 0 ? 'Inflow / Debit' : 'Outflow / Credit'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Status:</span>
                  <span className="font-bold text-emerald-600">{selectedTxn.status}</span>
                </div>
              </div>

              {/* Double-Entry Preview Box */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 text-xs space-y-1.5">
                <span className="font-bold text-blue-800 dark:text-blue-300 block text-[11px] uppercase tracking-wider">
                  General Ledger Entry Mechanics
                </span>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-blue-200 text-[var(--color-text-muted)] text-[10px]">
                      <th className="text-left pb-1">Account</th>
                      <th className="text-right pb-1">Debit</th>
                      <th className="text-right pb-1">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 text-[var(--color-text)]">{selectedTxn.bank}</td>
                      <td className="py-1 text-right font-mono font-bold text-emerald-600">
                        {selectedTxn.amount >= 0 ? money(Math.abs(selectedTxn.amount), selectedTxn.curr) : '—'}
                      </td>
                      <td className="py-1 text-right font-mono font-bold text-rose-600">
                        {selectedTxn.amount < 0 ? money(Math.abs(selectedTxn.amount), selectedTxn.curr) : '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 text-[var(--color-text)]">Offset: {selectedTxn.payee}</td>
                      <td className="py-1 text-right font-mono font-bold text-emerald-600">
                        {selectedTxn.amount < 0 ? money(Math.abs(selectedTxn.amount), selectedTxn.curr) : '—'}
                      </td>
                      <td className="py-1 text-right font-mono font-bold text-rose-600">
                        {selectedTxn.amount >= 0 ? money(Math.abs(selectedTxn.amount), selectedTxn.curr) : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setSelectedTxn(null)}
                  className="secondary h-9 px-4 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => generateVoucherPDF(selectedTxn)}
                  className="primary h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Voucher PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankTransactionsView;
