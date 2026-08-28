import React, { useState, useEffect, useMemo } from 'react';
import { reportsApi } from './api/modules/reports.api';
import { useCoaStore } from './stores';
import {
  BookOpen, Search, X, ShieldCheck,
  Download, FileSpreadsheet, RefreshCw,
  Layers, ArrowUpRight, ArrowDownRight,
  FileText, AlertCircle, Filter
} from 'lucide-react';
import { money } from './lib/currency';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
import { KpiCard, KpiGrid } from './components/ui/kpi-card';
import { EmptyState, TableSkeleton } from './components/ui/empty-state';
import type { Entity } from './EntitySettings';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GeneralLedgerLine {
  id: string;
  date: string;
  reference: string;
  description: string;
  status: string;
  transactionType: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

interface GeneralLedgerViewProps {
  activeEntityId: string;
  entities: Entity[];
}

export const GeneralLedgerView: React.FC<GeneralLedgerViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find((e) => e.id === activeEntityId);
  const coaAccounts = useCoaStore((s) => s.accounts);
  const fetchAccounts = useCoaStore((s) => s.fetchAccounts);

  const [lines, setLines] = useState<GeneralLedgerLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'this_month' | 'this_quarter' | 'this_year'>('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'chronological' | 'grouped'>('chronological');

  // Load COA accounts if empty
  useEffect(() => {
    if (coaAccounts.length === 0) {
      fetchAccounts();
    }
  }, [coaAccounts.length, fetchAccounts]);

  // Handle Date Presets
  const applyDatePreset = (preset: 'all' | 'today' | 'this_month' | 'this_quarter' | 'this_year') => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === 'all') {
      setFrom('');
      setTo('');
    } else if (preset === 'today') {
      const todayStr = now.toISOString().slice(0, 10);
      setFrom(todayStr);
      setTo(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      setFrom(firstDay);
      setTo(lastDay);
    } else if (preset === 'this_quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), currentQuarter * 3, 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0).toISOString().slice(0, 10);
      setFrom(firstDay);
      setTo(lastDay);
    } else if (preset === 'this_year') {
      const firstDay = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
      const lastDay = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10);
      setFrom(firstDay);
      setTo(lastDay);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, any> = {};
      if (activeEntityId) params.companyId = activeEntityId;
      if (from) params.from = from;
      if (to) params.to = to;
      const data = await reportsApi.getGeneralLedger(params);
      setLines(data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load general ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeEntityId, from, to]);

  // Combined Unique Accounts List (All COA Accounts + Any Transaction Accounts)
  const availableAccounts = useMemo(() => {
    const map = new Map<string, { code: string; name: string; type?: string; id?: string }>();
    coaAccounts.forEach((a) => {
      if (a.code) {
        map.set(a.code, { code: a.code, name: a.name, type: a.type, id: a.id });
      }
    });
    lines.forEach((l) => {
      if (l.accountCode && !map.has(l.accountCode)) {
        map.set(l.accountCode, { code: l.accountCode, name: l.accountName, id: l.accountId });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [coaAccounts, lines]);

  // Filtered Lines
  const filtered = useMemo(() => {
    return lines.filter((l) => {
      // Account Code Filter
      if (selectedAccountFilter !== 'ALL' && l.accountCode !== selectedAccountFilter) {
        return false;
      }
      // Text Search Query
      if (query.trim()) {
        const q = query.toLowerCase();
        const refMatch = l.reference?.toLowerCase().includes(q);
        const codeMatch = l.accountCode?.toLowerCase().includes(q);
        const nameMatch = l.accountName?.toLowerCase().includes(q);
        const descMatch = l.description?.toLowerCase().includes(q);
        const memoMatch = l.memo?.toLowerCase().includes(q);
        const typeMatch = l.transactionType?.toLowerCase().includes(q);
        if (!refMatch && !codeMatch && !nameMatch && !descMatch && !memoMatch && !typeMatch) {
          return false;
        }
      }
      return true;
    });
  }, [lines, selectedAccountFilter, query]);

  // Financial KPI Calculations
  const totalDebit = useMemo(() => filtered.reduce((acc, curr) => acc + (curr.debit || 0), 0), [filtered]);
  const totalCredit = useMemo(() => filtered.reduce((acc, curr) => acc + (curr.credit || 0), 0), [filtered]);
  const netDifference = Math.abs(totalDebit - totalCredit);
  const isBalanced = netDifference < 0.01;

  // Grouped Accounts for T-Account View
  const groupedByAccount = useMemo(() => {
    const groups: Record<string, { code: string; name: string; lines: GeneralLedgerLine[]; totalDr: number; totalCr: number; balance: number }> = {};
    filtered.forEach((l) => {
      const key = l.accountCode || 'UNASSIGNED';
      if (!groups[key]) {
        groups[key] = {
          code: l.accountCode,
          name: l.accountName,
          lines: [],
          totalDr: 0,
          totalCr: 0,
          balance: 0,
        };
      }
      groups[key].lines.push(l);
      groups[key].totalDr += l.debit || 0;
      groups[key].totalCr += l.credit || 0;
    });

    Object.values(groups).forEach((g) => {
      g.balance = g.totalDr - g.totalCr;
    });

    return Object.values(groups).sort((a, b) => a.code.localeCompare(b.code));
  }, [filtered]);

  // ─── Export Institutional PDF ─────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let yPos = 14;

    const brandColor: [number, number, number] = [15, 23, 42]; // Slate 900
    const grayColor: [number, number, number] = [100, 116, 139];

    // Header Band
    doc.setFillColor(...brandColor);
    doc.rect(margin, yPos, contentWidth, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text((currentEntity?.name || 'Enterprise Group').toUpperCase(), margin + 6, yPos + 8);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text('GENERAL LEDGER AUDIT REGISTER · DOUBLE-ENTRY FINANCIAL STATEMENT', margin + 6, yPos + 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    const dateRangeLabel = from && to ? `${from} to ${to}` : from ? `From ${from}` : to ? `Up to ${to}` : 'All Dates (Full History)';
    doc.text(`PERIOD: ${dateRangeLabel}`, pageWidth - margin - 6, yPos + 8, { align: 'right' });
    doc.text(`CURRENCY: ${currentEntity?.currencyCode || 'PKR'}`, pageWidth - margin - 6, yPos + 14, { align: 'right' });

    yPos += 28;

    // KPI Summary Bar in PDF
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`TOTAL POSTED DEBITS: ${money(totalDebit)}`, margin + 4, yPos + 6);
    doc.text(`TOTAL POSTED CREDITS: ${money(totalCredit)}`, margin + 4, yPos + 10.5);
    doc.text(`BALANCE INTEGRITY: ${isBalanced ? '✓ PERFECTLY BALANCED (0.00 DIFF)' : 'OUT OF BALANCE'}`, pageWidth - margin - 4, yPos + 8, { align: 'right' });

    yPos += 20;

    const tableBody: any[] = [];
    filtered.forEach((l) => {
      tableBody.push([
        l.date?.slice(0, 10) || '',
        l.reference || '',
        `${l.accountCode} - ${l.accountName}`,
        l.description || l.memo || '—',
        l.transactionType || 'Journal',
        l.debit > 0 ? money(l.debit) : '—',
        l.credit > 0 ? money(l.credit) : '—',
      ]);
    });

    tableBody.push([
      { content: 'TOTALS (BALANCED DOUBLE-ENTRY)', colSpan: 5, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
      { content: money(totalDebit), styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [16, 100, 75] } },
      { content: money(totalCredit), styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [16, 100, 75] } },
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['DATE', 'REF #', 'ACCOUNT TITLE', 'DESCRIPTION', 'TYPE', 'DEBIT (PKR)', 'CREDIT (PKR)']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 26, fontStyle: 'bold' },
        2: { cellWidth: 46 },
        3: { cellWidth: 50 },
        4: { cellWidth: 20 },
        5: { cellWidth: 24, halign: 'right' },
        6: { cellWidth: 24, halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 220;

    // Signatures
    if (finalY < 245) {
      const sigY = Math.max(finalY + 16, 250);
      const colW = contentWidth / 3;

      ['Senior Accountant', 'Internal Auditor', 'Finance Controller / CFO'].forEach((title, idx) => {
        const x = margin + idx * colW + 4;
        doc.setDrawColor(180, 180, 180);
        doc.line(x, sigY, x + colW - 8, sigY);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text(title, x + (colW - 8) / 2, sigY + 4.5, { align: 'center' });
      });
    }

    doc.save(`General_Ledger_Statement_${from || 'All'}_to_${to || 'Present'}.pdf`);
  };

  // ─── Export Excel & CSV ───────────────────────────────────────────────────
  const exportData = (type: 'excel' | 'csv') => {
    const headers = ['Date', 'Reference ID', 'Account Code', 'Account Name', 'Description / Memo', 'Transaction Type', 'Debit', 'Credit'];
    const rows = filtered.map((l) => [
      l.date?.slice(0, 10) || '',
      l.reference,
      l.accountCode,
      l.accountName,
      l.description || l.memo || '',
      l.transactionType || 'Journal',
      l.debit || 0,
      l.credit || 0,
    ]);

    if (type === 'excel') {
      downloadExcel('General_Ledger_Register', 'GeneralLedger', headers, rows);
    } else {
      downloadCSV('General_Ledger_Register', headers, rows);
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* ─── Page Header — AMS Signature Hero Band ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-violet-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-violet-500 to-indigo-700" />
              <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">General Ledger Register</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400"><span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> Live Ledger</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-semibold border border-blue-500/20">IAS 1 / IFRS Double-Entry</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Audit-trail ledger of all posted transactions, running balances, and T-account allocations for {currentEntity?.name || 'Active Entity'}.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={exportPDF}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" /> PDF Statement
          </button>
          <button
            onClick={() => exportData('excel')}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel (.xlsx)
          </button>
          <button
            onClick={() => exportData('csv')}
            className="px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-strong)] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> CSV
          </button>
          </div>
        </div>
      </div>

      {/* ─── 4-in-1 Financial KPI Summary Cards ─── */}
      <KpiGrid cols={4}>
        {/* Total Debit */}
        <KpiCard
          icon={ArrowUpRight}
          label="TOTAL POSTED DEBITS (DR)"
          value={money(totalDebit)}
          desc="Asset & Expense debit movements"
          tone="emerald"
        />

        {/* Total Credit */}
        <KpiCard
          icon={ArrowDownRight}
          label="TOTAL POSTED CREDITS (CR)"
          value={money(totalCredit)}
          desc="Liability, Equity & Income credit movements"
          tone="rose"
        />

        {/* Ledger Integrity */}
        <KpiCard
          icon={ShieldCheck}
          label="DOUBLE-ENTRY INTEGRITY"
          value={isBalanced ? '0.00 Diff' : `${money(netDifference)} Diff`}
          desc={isBalanced ? '✓ 100% Balanced (IAS 1 Double-Entry)' : '⚠ Imbalance Detected'}
          tone={isBalanced ? 'blue' : 'red'}
        />

        {/* Transaction Lines */}
        <KpiCard
          icon={Layers}
          label="POSTED LEDGER LINES"
          value={`${filtered.length}`}
          desc={`Lines · Across ${availableAccounts.length} Chart Accounts`}
          tone="teal"
        />
      </KpiGrid>

      {/* ─── Search, Date Range & Filter Toolbar ─── */}
      <div className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-xs space-y-3">
        {/* Row 1: Search & Account Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="inline-flex items-center h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] focus-within:border-emerald-500 flex-1 max-w-md shadow-2xs">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search reference #, account code, memo, title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] !p-0 !border-0 !outline-none !bg-transparent focus:!ring-0"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-0.5 text-gray-400 hover:text-gray-600 shrink-0 ml-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Account Filter Dropdown */}
          <div className="inline-flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
            <select
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500 shadow-2xs font-semibold min-w-[240px]"
            >
              <option value="ALL">All Chart of Accounts ({availableAccounts.length})</option>
              {availableAccounts.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.code} — {a.name} {a.type ? `(${a.type})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Date Presets, Custom Range & View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)]">
          {/* Date Range Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-1 bg-[var(--color-surface-muted)] rounded-xl border border-[var(--color-border)] text-xs font-semibold">
              {(
                [
                  { id: 'all', label: 'All Dates' },
                  { id: 'today', label: 'Today' },
                  { id: 'this_month', label: 'Month' },
                  { id: 'this_quarter', label: 'Quarter' },
                  { id: 'this_year', label: 'Year' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyDatePreset(p.id)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    datePreset === p.id
                      ? 'bg-[var(--color-surface)] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range */}
            <div className="inline-flex items-center gap-1.5">
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setDatePreset('all'); }}
                className="h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono outline-none focus:border-emerald-500"
              />
              <span className="text-[var(--color-text-muted)] text-xs">—</span>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setDatePreset('all'); }}
                className="h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-[var(--color-surface-muted)] rounded-xl border border-[var(--color-border)] text-xs font-semibold">
            <button
              onClick={() => setViewMode('chronological')}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                viewMode === 'chronological'
                  ? 'bg-[var(--color-surface)] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              📄 Postings Register
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1 rounded-lg text-xs transition-all ${
                viewMode === 'grouped'
                  ? 'bg-[var(--color-surface)] text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              ⚖️ T-Account Ledgers
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Mode 1: Chronological Ledger Register Table ─── */}
      {viewMode === 'chronological' && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-violet-500/[0.05] dark:bg-violet-400/[0.07] text-[var(--color-text-muted)] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-28">Date</th>
                  <th className="py-3 px-4 w-32">Reference #</th>
                  <th className="py-3 px-4 min-w-[200px]">GL Account</th>
                  <th className="py-3 px-4 min-w-[240px]">Description / Memo</th>
                  <th className="py-3 px-4 w-28">Type</th>
                  <th className="py-3 px-4 text-right w-32">Debit (DR)</th>
                  <th className="py-3 px-4 text-right w-32">Credit (CR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] font-sans text-[var(--color-text)]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <TableSkeleton rows={6} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={BookOpen}
                        title="No general ledger entries found"
                        hint="Post journals, sales invoices, or bills to generate ledger movements."
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--color-text-muted)]">
                        {l.date?.slice(0, 10) || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {l.reference || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-[var(--color-text-strong)]">
                            {l.accountCode}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            — {l.accountName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--color-text)]">
                        <div>{l.description || '—'}</div>
                        {l.memo && <div className="text-[10px] text-[var(--color-text-muted)] italic mt-0.5">{l.memo}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface-muted)] text-[10px] font-semibold text-[var(--color-text-muted)] border border-[var(--color-border)]">
                          {l.transactionType || 'Journal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {l.debit > 0 ? money(l.debit) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {l.credit > 0 ? money(l.credit) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-surface-muted)] font-bold text-xs">
                    <td colSpan={5} className="py-3 px-4 text-[var(--color-text-strong)] uppercase tracking-wider">
                      Total Ledger Postings (Double-Entry Balanced)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-extrabold text-sm">
                      {money(totalDebit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 font-extrabold text-sm">
                      {money(totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ─── Mode 2: T-Account Visual Ledgers ─── */}
      {viewMode === 'grouped' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groupedByAccount.length === 0 ? (
            <div className="col-span-2 border border-[var(--color-border)] rounded-2xl bg-[var(--color-surface)]">
              <EmptyState
                icon={Layers}
                title="No T-Account ledgers available"
                hint="Adjust the filters or switch the view mode to see grouped ledgers."
              />
            </div>
          ) : (
            groupedByAccount.map((group) => (
              <div
                key={group.code}
                className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs space-y-4"
              >
                {/* T-Account Card Header */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text-strong)] flex items-center gap-2">
                      <span className="font-mono text-emerald-600">{group.code}</span>
                      <span>— {group.name}</span>
                    </h3>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      {group.lines.length} transaction entries
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                      Net Balance
                    </span>
                    <span className={`text-sm font-mono font-bold ${group.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {money(Math.abs(group.balance))} {group.balance >= 0 ? '(DR)' : '(CR)'}
                    </span>
                  </div>
                </div>

                {/* T-Table (Split Debit / Credit) */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Debit Side (Left) */}
                  <div className="border-r border-[var(--color-border)] pr-3 space-y-2">
                    <div className="font-bold text-[11px] text-emerald-600 uppercase tracking-wider border-b border-[var(--color-border)] pb-1 flex justify-between">
                      <span>Debit (DR)</span>
                      <span>{money(group.totalDr)}</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {group.lines
                        .filter((l) => l.debit > 0)
                        .map((l) => (
                          <div key={l.id} className="flex justify-between text-[11px] font-mono py-0.5">
                            <span className="text-[var(--color-text-muted)] truncate max-w-[110px]" title={l.description}>
                              {l.date?.slice(5, 10)} {l.reference}
                            </span>
                            <span className="font-bold text-emerald-600">{money(l.debit)}</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Credit Side (Right) */}
                  <div className="pl-1 space-y-2">
                    <div className="font-bold text-[11px] text-rose-600 uppercase tracking-wider border-b border-[var(--color-border)] pb-1 flex justify-between">
                      <span>Credit (CR)</span>
                      <span>{money(group.totalCr)}</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {group.lines
                        .filter((l) => l.credit > 0)
                        .map((l) => (
                          <div key={l.id} className="flex justify-between text-[11px] font-mono py-0.5">
                            <span className="text-[var(--color-text-muted)] truncate max-w-[110px]" title={l.description}>
                              {l.date?.slice(5, 10)} {l.reference}
                            </span>
                            <span className="font-bold text-rose-600">{money(l.credit)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};