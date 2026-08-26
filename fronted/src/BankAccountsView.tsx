import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Search, Plus, CheckCircle2,
  FileSpreadsheet, Download, Printer, RefreshCw,
  Landmark, DollarSign, X, Edit3
} from 'lucide-react';
import type { Entity } from './EntitySettings';
import { apiClient } from './api/client';
import { money } from './lib/currency';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
import { KpiCard, KpiGrid } from './components/ui/kpi-card';
import { EmptyState, TableSkeleton } from './components/ui/empty-state';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface BankAccountRecord {
  id: string;
  code: string;
  name: string;
  bankName: string;
  currency: string;
  balance: number;
  openingBalance: number;
  status: 'Active' | 'Inactive';
  reconciliationEnabled: boolean;
  updatedAt: string;
}

interface BankAccountsViewProps {
  activeEntityId: string;
  entities: Entity[];
}

interface BankAccountDto {
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

export const BankAccountsView: React.FC<BankAccountsViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find((e) => e.id === activeEntityId) || entities[0];
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '11205',
    name: '',
    bankName: '',
    currency: currentEntity?.currencyCode || 'PKR',
    openingBalance: '0',
    reconciliationEnabled: true,
    status: 'Active' as 'Active' | 'Inactive',
  });

  const loadBankAccounts = async () => {
    setLoading(true);
    try {
      const data = await apiClient<BankAccountDto[]>('/bank-accounts', {
        params: { companyId: activeEntityId },
      });
      setBankAccounts(
        data.map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          bankName: a.bankName || a.name,
          currency: a.currency || currentEntity?.currencyCode || 'PKR',
          balance: a.balance || 0,
          openingBalance: a.openingBalance || 0,
          status: (a.status === 'Active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
          reconciliationEnabled: a.reconciliationEnabled ?? true,
          updatedAt: a.updatedAt || new Date().toISOString(),
        }))
      );
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load bank accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankAccounts();
  }, [activeEntityId]);

  const uniqueCurrencies = useMemo(() => {
    const list = Array.from(new Set(bankAccounts.map((b) => b.currency))).filter(Boolean);
    return ['All', ...list];
  }, [bankAccounts]);

  const filtered = useMemo(() => {
    return bankAccounts.filter((b) => {
      if (selectedCurrency !== 'All' && b.currency !== selectedCurrency) return false;
      if (selectedStatus !== 'All' && b.status !== selectedStatus) return false;

      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesBank = b.bankName.toLowerCase().includes(q);
        const matchesCode = b.code.toLowerCase().includes(q);
        const matchesCurr = b.currency.toLowerCase().includes(q);
        if (!matchesName && !matchesBank && !matchesCode && !matchesCurr) return false;
      }
      return true;
    });
  }, [bankAccounts, selectedCurrency, selectedStatus, query]);

  // 4 Top Financial KPIs
  const totalBalance = filtered.reduce((s, b) => s + b.balance, 0);
  const activeCount = filtered.filter((b) => b.status === 'Active').length;
  const reconciledCount = filtered.filter((b) => b.reconciliationEnabled).length;
  const avgBalance = filtered.length > 0 ? totalBalance / filtered.length : 0;

  const openAddModal = () => {
    setEditingAccount(null);
    setForm({
      code: `1120${bankAccounts.length + 1}`,
      name: '',
      bankName: '',
      currency: currentEntity?.currencyCode || 'PKR',
      openingBalance: '0',
      reconciliationEnabled: true,
      status: 'Active',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (b: BankAccountRecord) => {
    setEditingAccount(b);
    setForm({
      code: b.code,
      name: b.name,
      bankName: b.bankName,
      currency: b.currency,
      openingBalance: String(b.openingBalance),
      reconciliationEnabled: b.reconciliationEnabled,
      status: b.status,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Account name is required.');
      return;
    }
    if (!form.code.trim()) {
      setError('GL Account code is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingAccount) {
        await apiClient(`/bank-accounts/${editingAccount.id}`, {
          method: 'PUT',
          body: {
            name: form.name.trim(),
            code: form.code.trim(),
            currency: form.currency,
            openingBalance: parseFloat(form.openingBalance) || 0,
            reconciliationEnabled: form.reconciliationEnabled,
            bankName: form.bankName.trim() || form.name.trim(),
            companyId: activeEntityId,
          },
        });
      } else {
        await apiClient('/bank-accounts', {
          method: 'POST',
          body: {
            name: form.name.trim(),
            code: form.code.trim(),
            currency: form.currency,
            openingBalance: parseFloat(form.openingBalance) || 0,
            reconciliationEnabled: form.reconciliationEnabled,
            bankName: form.bankName.trim() || form.name.trim(),
            companyId: activeEntityId,
          },
        });
      }

      setIsModalOpen(false);
      await loadBankAccounts();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to save bank account.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Branded Bank Account Statement / Certificate PDF ───────────────────────
  const generateAccountPDF = (b: BankAccountRecord) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const primaryColor: [number, number, number] = [15, 76, 129];
    const darkColor: [number, number, number] = [15, 23, 42];
    const grayColor: [number, number, number] = [100, 116, 139];
    const lightBg: [number, number, number] = [248, 250, 252];
    const borderGray: [number, number, number] = [226, 232, 240];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BANK ACCOUNT PROFILE & CERTIFICATE', margin, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Account Code: ${b.code}`, margin, 21);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, pageWidth - margin, 14, { align: 'right' });
    doc.text(`Entity: ${currentEntity?.name || 'Company ERP'}`, pageWidth - margin, 21, { align: 'right' });

    // Details Grid
    const boxY = 34;
    const boxH = 36;
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

    // Bank Account Details Box
    const bankX = margin + colW + 6;
    doc.setFillColor(...lightBg);
    doc.roundedRect(bankX, boxY, colW, boxH, 2, 2, 'FD');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('INSTITUTIONAL ACCOUNT DETAILS', bankX + 4, boxY + 7);

    doc.setTextColor(...darkColor);
    doc.setFontSize(9.5);
    doc.text(b.name, bankX + 4, boxY + 14);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bank Name: ${b.bankName}`, bankX + 4, boxY + 20);
    doc.text(`Account Currency: ${b.currency}`, bankX + 4, boxY + 25);
    doc.text(`Status: ${b.status} • Reconciliation: ${b.reconciliationEnabled ? 'Active' : 'Disabled'}`, bankX + 4, boxY + 30);

    // Balance Banner
    const bannerY = boxY + boxH + 6;
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(margin, bannerY, contentWidth, 18, 2, 2, 'FD');

    doc.setTextColor(30, 58, 138);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CURRENT GENERAL LEDGER BOOK BALANCE', margin + 4, bannerY + 6.5);

    doc.setFontSize(14);
    doc.text(money(b.balance, b.currency), margin + 4, bannerY + 14);

    // Financial Profile Table
    const tableStartY = bannerY + 24;
    const tableHeaders = ['Financial Metric', 'GL Value', 'Notes'];
    const tableRows = [
      ['General Ledger Code', b.code, 'IAS 1 / GAAP Asset Account Classification'],
      ['Opening Book Balance', money(b.openingBalance, b.currency), 'Initial brought forward balance'],
      ['Current Ledger Balance', money(b.balance, b.currency), 'Live synchronized position'],
      ['Reconciliation Status', b.reconciliationEnabled ? 'Enabled (Automated Check)' : 'Manual', 'Bank statement matching'],
      ['Account Status', b.status, 'Operational state'],
    ];

    autoTable(doc, {
      startY: tableStartY,
      head: [tableHeaders],
      body: tableRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3, textColor: darkColor },
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        1: { fontStyle: 'bold' },
      },
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setTextColor(...grayColor);
    doc.setFontSize(7);
    doc.text('Official Account Profile Verification. Generated from AccountBook Banking & Payments Module.', margin, pageHeight - 8);

    const safeName = (b.name || 'Bank').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Bank_Account_${b.code}_${safeName}.pdf`);
  };

  // ─── Excel & CSV Exports ───────────────────────────────────────────────────
  const exportAccountsExcel = () => {
    const headers = ['GL Code', 'Account Name', 'Bank Institution', 'Currency', 'Current Balance', 'Reconciliation', 'Status'];
    const rows = filtered.map((b) => [
      b.code,
      b.name,
      b.bankName,
      b.currency,
      b.balance,
      b.reconciliationEnabled ? 'Enabled' : 'Disabled',
      b.status,
    ]);
    downloadExcel(`Bank_Accounts_Register_${new Date().toISOString().slice(0, 10)}`, 'Bank Accounts', headers, rows);
  };

  const exportAccountsCSV = () => {
    const headers = ['GL Code', 'Account Name', 'Bank Institution', 'Currency', 'Current Balance', 'Reconciliation', 'Status'];
    const rows = filtered.map((b) => [
      b.code,
      b.name,
      b.bankName,
      b.currency,
      b.balance,
      b.reconciliationEnabled ? 'Enabled' : 'Disabled',
      b.status,
    ]);
    downloadCSV(`Bank_Accounts_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Page Header — AMS Signature Hero Band */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-blue-500/[0.03] to-transparent pointer-events-none" />
        <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              <div className="absolute inset-[6px] rotate-45 rounded-[12px] shadow-xl bg-gradient-to-br from-blue-500 to-cyan-700" />
              <div className="absolute inset-0 flex items-center justify-center"><Building2 className="w-6 h-6 text-white" /></div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-strong)]">Bank Accounts Management</h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Live Ledger</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Manage institutional bank accounts, currency denominations, GL mappings, and bank feeds for {currentEntity?.name || 'Active Company'}.
              </p>
            </div>
          </div>

          {/* Global Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={exportAccountsExcel}
              className="secondary h-8.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              title="Export bank accounts to Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
            </button>
            <button
              onClick={exportAccountsCSV}
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
              onClick={loadBankAccounts}
              className="secondary h-8.5 w-8.5 rounded-lg flex items-center justify-center text-xs text-[var(--color-text)]"
              title="Refresh accounts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openAddModal}
              className="primary h-8.5 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Bank Account
            </button>
          </div>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard icon={Landmark} label="TOTAL BANK LIQUIDITY" value={money(totalBalance, currentEntity?.currencyCode)} desc={`Across ${filtered.length} bank accounts`} tone="blue" />
        <KpiCard icon={CheckCircle2} label="ACTIVE ACCOUNTS" value={activeCount} desc="Operational institutional accounts" tone="emerald" />
        <KpiCard icon={RefreshCw} label="RECONCILIATION READY" value={reconciledCount} desc="Statement matching enabled" tone="purple" />
        <KpiCard icon={DollarSign} label="AVERAGE BALANCE" value={money(avgBalance, currentEntity?.currencyCode)} desc="Per account average" tone="amber" />
      </KpiGrid>

      {/* Filter Toolbar & Non-Overlapping Search Box */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-xs">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500 transition-colors"
          >
            <option value="All">📋 All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>

          {/* Currency Filter */}
          {uniqueCurrencies.length > 1 && (
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500 transition-colors"
            >
              {uniqueCurrencies.map((c) => (
                <option key={c} value={c}>{c === 'All' ? '🌐 All Currencies' : `Currency: ${c}`}</option>
              ))}
            </select>
          )}
        </div>

        {/* Robust Search Box - Guaranteed Zero Text/Icon Overlap */}
        <div className="flex items-center h-8 w-60 px-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 transition-all shadow-2xs">
          <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search bank name, GL code..."
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

      {/* Bank Accounts Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-strong)]">
            <span className="inline-block h-2 w-2 rotate-45 rounded-[2px] bg-gradient-to-br from-blue-500 to-cyan-700" />
            Bank Accounts Directory
          </p>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {filtered.length} accounts · Click <strong>Certificate PDF</strong> to download an official account balance certificate.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-500/[0.05] dark:bg-blue-400/[0.07] text-[var(--color-text-muted)] border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">GL Code</th>
                <th className="py-2.5 px-3">Account Name</th>
                <th className="py-2.5 px-3">Bank Institution</th>
                <th className="py-2.5 px-3 text-center">Currency</th>
                <th className="py-2.5 px-3 text-right">Book Balance</th>
                <th className="py-2.5 px-3 text-center">Reconciliation</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <TableSkeleton rows={6} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={CheckCircle2}
                      title="No bank accounts found"
                      hint="Add an institutional bank account or adjust your search and filters."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {b.code}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[var(--color-text-strong)]">
                      {b.name}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text)]">
                      {b.bankName}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-semibold text-[10px]">
                        {b.currency}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                      {money(b.balance, b.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.reconciliationEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.reconciliationEnabled ? 'Automated' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 border border-rose-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] font-semibold transition-all shadow-2xs"
                          title="Edit Bank Account"
                        >
                          <Edit3 className="w-3 h-3 text-blue-600" /> Edit
                        </button>
                        <button
                          onClick={() => generateAccountPDF(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-semibold transition-all shadow-2xs"
                          title="Download Account Verification Certificate PDF"
                        >
                          <Download className="w-3 h-3" /> Certificate PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-900 border-t-2 border-[var(--color-border)] font-bold text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-3.5 uppercase tracking-wider text-[var(--color-text-muted)] text-right">
                    Total Bank Balances:
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                    {money(totalBalance, currentEntity?.currencyCode)}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Bank Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-strong)] flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-600" /> {editingAccount ? 'Edit Institutional Bank Account' : 'Add Institutional Bank Account'}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {editingAccount ? `Update configuration and details for ${editingAccount.name}.` : 'Register a corporate bank account with General Ledger mapping.'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">GL Account Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. 11210"
                    className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono font-bold outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Currency *</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500"
                    required
                  >
                    <option value="PKR">PKR - Pakistani Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">Account Display Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. HBL Corporate Operating Account"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">Bank / Financial Institution *</label>
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="e.g. Habib Bank Limited / Chase / Barclays"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">Opening Balance ({form.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.openingBalance}
                  onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-[var(--color-border)]">
                <input
                  type="checkbox"
                  id="reconCheck"
                  checked={form.reconciliationEnabled}
                  onChange={(e) => setForm({ ...form, reconciliationEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="reconCheck" className="text-xs text-[var(--color-text)] cursor-pointer">
                  <strong>Enable Automated Bank Reconciliation</strong> (Support bank statement import and automated matching)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="secondary h-9 px-4 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="primary h-9 px-4 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {editingAccount ? 'Update Bank Account' : 'Save Bank Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountsView;
