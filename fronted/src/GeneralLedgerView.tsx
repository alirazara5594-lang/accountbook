import React, { useState, useEffect, useMemo } from 'react';
import { reportsApi } from './api/modules/reports.api';
import {
  BookOpen, Search, X, ShieldCheck,
  Download, FileSpreadsheet, RefreshCw,
  Layers, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { money } from './lib/currency';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
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
  const [lines, setLines] = useState<GeneralLedgerLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'this_month' | 'this_quarter' | 'this_year'>('all');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'chronological' | 'grouped'>('chronological');

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

  // Unique Accounts list
  const uniqueAccounts = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    lines.forEach((l) => {
      if (l.accountCode) {
        map.set(l.accountCode, { code: l.accountCode, name: l.accountName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [lines]);

  // Filtered Lines
  const filtered = useMemo(() => {
    return lines.filter((l) => {
      if (selectedAccountFilter !== 'ALL' && l.accountCode !== selectedAccountFilter) {
        return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesRef = (l.reference || '').toLowerCase().includes(q);
        const matchesCode = (l.accountCode || '').toLowerCase().includes(q);
        const matchesName = (l.accountName || '').toLowerCase().includes(q);
        const matchesDesc = (l.description || '').toLowerCase().includes(q);
        const matchesType = (l.transactionType || '').toLowerCase().includes(q);
        if (!matchesRef && !matchesCode && !matchesName && !matchesDesc && !matchesType) return false;
      }
      return true;
    });
  }, [lines, query, selectedAccountFilter]);

  // 4 Top Financial KPIs
  const totalDebit = filtered.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = filtered.reduce((s, l) => s + (l.credit || 0), 0);
  const netDifference = Math.abs(totalDebit - totalCredit);
  const isBalanced = netDifference < 0.01;

  // Grouped Account Structure for T-Account View
  const groupedAccounts = useMemo(() => {
    const map = new Map<string, { code: string; name: string; debit: number; credit: number; lines: GeneralLedgerLine[] }>();
    filtered.forEach((l) => {
      const key = l.accountCode || l.accountId || 'UNKNOWN';
      if (!map.has(key)) {
        map.set(key, { code: l.accountCode, name: l.accountName, debit: 0, credit: 0, lines: [] });
      }
      const acc = map.get(key)!;
      acc.debit += l.debit || 0;
      acc.credit += l.credit || 0;
      acc.lines.push(l);
    });
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [filtered]);

  // ─── Branded Official General Ledger Statement PDF ────────────────────────
  const generateStatementPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const primaryColor: [number, number, number] = [20, 62, 43]; // Institutional Deep Forest
    const grayColor: [number, number, number] = [100, 116, 139];

    // Banner Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('GENERAL LEDGER AUDIT REGISTER', margin, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Entity: ${currentEntity?.name || 'All Consolidated Entities'}`, margin, 21);
    doc.text(`Period: ${from || 'Inception'} to ${to || 'Present'}`, pageWidth - margin, 14, { align: 'right' });
    doc.text(`Standard: IAS 1 / IFRS Compliant`, pageWidth - margin, 21, { align: 'right' });

    let yPos = 36;

    // Summary Card
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
        0: { cellWidth: 20 },
        1: { cellWidth: 24, fontStyle: 'bold' },
        2: { cellWidth: 42 },
        3: { cellWidth: 46 },
        4: { cellWidth: 16 },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
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
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6 min-h-screen">
      {/* ─── Top Control & Action Bar ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--color-text-strong)] flex items-center gap-2">
              General Ledger Register <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">IAS 1 / IFRS / GAAP</span>
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Posting-level double-entry register of all general journal & subledger lines for <strong>{currentEntity?.name || 'All Entities'}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            onClick={generateStatementPDF}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> PDF Statement
          </button>
          <button
            onClick={() => exportData('excel')}
            className="inline-flex items-center gap-1.5 h-9 px-3 bg-[var(--color-surface)] hover:bg-gray-50 dark:hover:bg-gray-800 text-[var(--color-text)] border border-[var(--color-border)] rounded-xl text-xs font-semibold transition-all shadow-2xs"
            title="Export to Excel (.xls)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
          </button>
          <button
            onClick={() => exportData('csv')}
            className="inline-flex items-center gap-1.5 h-9 px-3 bg-[var(--color-surface)] hover:bg-gray-50 dark:hover:bg-gray-800 text-[var(--color-text)] border border-[var(--color-border)] rounded-xl text-xs font-semibold transition-all shadow-2xs"
            title="Export to CSV (.csv)"
          >
            CSV
          </button>
          <button
            onClick={load}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center bg-[var(--color-surface)] hover:bg-gray-50 dark:hover:bg-gray-800 text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-xl transition-all shadow-2xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 4-in-1 Top Financial KPI Cards ─── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {/* Total Debit */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              TOTAL POSTED DEBITS (DR)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {money(totalDebit)}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Asset & Expense debit movements</p>
          </div>
        </div>

        {/* Total Credit */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              TOTAL POSTED CREDITS (CR)
            </span>
            <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-rose-600 dark:text-rose-400">
              {money(totalCredit)}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Liability, Equity & Income credit movements</p>
          </div>
        </div>

        {/* Ledger Integrity */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              DOUBLE-ENTRY INTEGRITY
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-[var(--color-text-strong)] flex items-center gap-1.5">
              {isBalanced ? (
                <span className="text-emerald-600 dark:text-emerald-400">0.00 Diff</span>
              ) : (
                <span className="text-rose-600">{money(netDifference)} Diff</span>
              )}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              {isBalanced ? '✓ 100% Balanced (IAS 1 Double-Entry)' : '⚠ Imbalance Detected'}
            </p>
          </div>
        </div>

        {/* Transaction Lines */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              POSTED LEDGER LINES
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-[var(--color-text-strong)]">
              {filtered.length} Lines
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Across {uniqueAccounts.length} Chart Accounts</p>
          </div>
        </div>
      </div>

      {/* ─── Search, Date Range & Filter Toolbar ─── */}
      <div className="bg-[var(--color-surface)] p-3.5 rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Zero Overlap Search Box */}
        <div className="inline-flex items-center h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-emerald-500 w-full sm:w-72 shadow-2xs">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Search reference, account, memo..."
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
        <div className="inline-flex items-center gap-1.5">
          <select
            value={selectedAccountFilter}
            onChange={(e) => setSelectedAccountFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500 shadow-2xs font-medium"
          >
            <option value="ALL">All Chart of Accounts ({uniqueAccounts.length})</option>
            {uniqueAccounts.map((a) => (
              <option key={a.code} value={a.code}>
                {a.code} — {a.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Presets & Inputs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800/60 rounded-xl border border-[var(--color-border)] text-xs font-semibold">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'today', label: 'Today' },
                { id: 'this_month', label: 'Month' },
                { id: 'this_quarter', label: 'Quarter' },
                { id: 'this_year', label: 'Year' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                onClick={() => applyDatePreset(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                  datePreset === p.id
                    ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1">
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setDatePreset('all'); }}
              className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] text-[var(--color-text)] font-mono outline-none focus:border-emerald-500"
            />
            <span className="text-gray-400 text-xs">—</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setDatePreset('all'); }}
              className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] text-[var(--color-text)] font-mono outline-none focus:border-emerald-500"
            />
          </div>

          {/* View Mode Switcher */}
          <div className="inline-flex p-0.5 bg-gray-100 dark:bg-gray-800/60 rounded-xl border border-[var(--color-border)] text-xs font-semibold ml-1">
            <button
              onClick={() => setViewMode('chronological')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                viewMode === 'chronological'
                  ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              Postings
            </button>
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                viewMode === 'grouped'
                  ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              T-Accounts
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* ─── Mode 1: Chronological Detailed Postings View ─── */}
      {viewMode === 'chronological' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-900/50 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-extrabold">
                  <th className="py-3.5 px-4">POSTING DATE</th>
                  <th className="py-3.5 px-4">REFERENCE ID</th>
                  <th className="py-3.5 px-4">CHART OF ACCOUNT</th>
                  <th className="py-3.5 px-4">DESCRIPTION / MEMO</th>
                  <th className="py-3.5 px-4 text-center">TX TYPE</th>
                  <th className="py-3.5 px-4 text-right">DEBIT (+)</th>
                  <th className="py-3.5 px-4 text-right pr-6">CREDIT (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)]">
                      <div className="max-w-xs mx-auto space-y-2">
                        <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto" />
                        <p className="font-semibold text-xs text-[var(--color-text-strong)]">No general ledger lines found</p>
                        <p className="text-[11px]">Post journals or sales/purchase transactions to populate the general ledger.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((l, i) => (
                    <tr key={`${l.id}-${i}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[var(--color-text)]">
                        {l.date?.slice(0, 10)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {l.reference}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[var(--color-text-strong)] block">
                          {l.accountCode}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] block truncate max-w-xs">
                          {l.accountName}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-[var(--color-text)] max-w-xs truncate">
                        {l.description || l.memo || '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-[var(--color-border)]">
                          {l.transactionType || 'Journal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {l.debit > 0 ? money(l.debit) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 pr-6">
                        {l.credit > 0 ? money(l.credit) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50/80 dark:bg-gray-900/80 font-extrabold border-t-2 border-[var(--color-border)]">
                    <td colSpan={5} className="py-3.5 px-4 text-[var(--color-text-strong)] text-xs">
                      TOTAL MOVEMENTS (BALANCED DOUBLE-ENTRY)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      {money(totalDebit)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-rose-600 dark:text-rose-400 pr-6">
                      {money(totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ─── Mode 2: Grouped Account-by-Account T-Account Ledger View ─── */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {groupedAccounts.length === 0 ? (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center text-[var(--color-text-muted)]">
              <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
              <p className="font-semibold text-xs text-[var(--color-text-strong)]">No account transactions found</p>
            </div>
          ) : (
            groupedAccounts.map((acc) => {
              const netBalance = acc.debit - acc.credit;
              return (
                <div key={acc.code} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-4 bg-gray-50/70 dark:bg-gray-900/70 border-b border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono font-extrabold text-xs">
                        {acc.code}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--color-text-strong)]">
                        {acc.name}
                      </h3>
                      <span className="text-[10px] text-[var(--color-text-muted)] font-semibold">
                        ({acc.lines.length} postings)
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span>Total Dr: <strong className="text-emerald-600">{money(acc.debit)}</strong></span>
                      <span>Total Cr: <strong className="text-rose-600">{money(acc.credit)}</strong></span>
                      <span className="px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] font-bold text-[var(--color-text-strong)]">
                        Net: {money(Math.abs(netBalance))} {netBalance >= 0 ? 'Dr' : 'Cr'}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold bg-gray-50/30 dark:bg-gray-900/30">
                          <th className="py-2.5 px-4">DATE</th>
                          <th className="py-2.5 px-4">REF #</th>
                          <th className="py-2.5 px-4">DESCRIPTION / MEMO</th>
                          <th className="py-2.5 px-4">TYPE</th>
                          <th className="py-2.5 px-4 text-right">DEBIT (+)</th>
                          <th className="py-2.5 px-4 text-right pr-6">CREDIT (-)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {acc.lines.map((l, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/40 dark:hover:bg-gray-900/30">
                            <td className="py-2 px-4 font-mono text-[var(--color-text)]">{l.date?.slice(0, 10)}</td>
                            <td className="py-2 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{l.reference}</td>
                            <td className="py-2 px-4 text-[var(--color-text-strong)]">{l.description || l.memo || '—'}</td>
                            <td className="py-2 px-4 text-gray-500">{l.transactionType || 'Journal'}</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-emerald-600">
                              {l.debit > 0 ? money(l.debit) : '—'}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-rose-600 pr-6">
                              {l.credit > 0 ? money(l.credit) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default GeneralLedgerView;