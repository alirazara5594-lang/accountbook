import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet, Search, Plus, CheckCircle2,
  FileSpreadsheet, Download, Printer, RefreshCw,
  Coins, DollarSign, Users, X, Edit3
} from 'lucide-react';
import type { Entity } from './EntitySettings';
import { apiClient } from './api/client';
import { money } from './lib/currency';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CashAccountRecord {
  id: string;
  code: string;
  name: string;
  vaultLocation: string;
  custodian: string;
  currency: string;
  balance: number;
  openingBalance: number;
  status: 'Active' | 'Inactive';
  updatedAt: string;
}

interface CashAccountsViewProps {
  activeEntityId: string;
  entities: Entity[];
}

interface CashAccountDto {
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

export const CashAccountsView: React.FC<CashAccountsViewProps> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find((e) => e.id === activeEntityId) || entities[0];
  const [cashAccounts, setCashAccounts] = useState<CashAccountRecord[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashAccountRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: '11105',
    name: '',
    vaultLocation: '',
    custodian: '',
    currency: currentEntity?.currencyCode || 'PKR',
    openingBalance: '0',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const loadCashAccounts = async () => {
    setLoading(true);
    try {
      const data = await apiClient<CashAccountDto[]>('/cash-accounts', {
        params: { companyId: activeEntityId },
      });
      setCashAccounts(
        data.map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          vaultLocation: '',
          custodian: '',
          currency: a.currency || currentEntity?.currencyCode || 'PKR',
          balance: a.balance || 0,
          openingBalance: a.openingBalance || 0,
          status: (a.status === 'Active' ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
          updatedAt: a.updatedAt || new Date().toISOString(),
        }))
      );
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to load cash accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashAccounts();
  }, [activeEntityId]);

  const uniqueCurrencies = useMemo(() => {
    const list = Array.from(new Set(cashAccounts.map((c) => c.currency))).filter(Boolean);
    return ['All', ...list];
  }, [cashAccounts]);

  const filtered = useMemo(() => {
    return cashAccounts.filter((c) => {
      if (selectedCurrency !== 'All' && c.currency !== selectedCurrency) return false;
      if (selectedStatus !== 'All' && c.status !== selectedStatus) return false;

      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesCode = c.code.toLowerCase().includes(q);
        const matchesLocation = c.vaultLocation.toLowerCase().includes(q);
        const matchesCustodian = c.custodian.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesLocation && !matchesCustodian) return false;
      }
      return true;
    });
  }, [cashAccounts, selectedCurrency, selectedStatus, query]);

  // 4 Top Financial KPIs
  const totalBalance = filtered.reduce((s, c) => s + c.balance, 0);
  const activeCount = filtered.filter((c) => c.status === 'Active').length;
  const custodianCount = filtered.filter((c) => c.custodian || c.name).length;
  const avgBalance = filtered.length > 0 ? totalBalance / filtered.length : 0;

  const openAddModal = () => {
    setEditingAccount(null);
    setForm({
      code: `1110${cashAccounts.length + 1}`,
      name: '',
      vaultLocation: '',
      custodian: '',
      currency: currentEntity?.currencyCode || 'PKR',
      openingBalance: '0',
      status: 'Active',
    });
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: CashAccountRecord) => {
    setEditingAccount(c);
    setForm({
      code: c.code,
      name: c.name,
      vaultLocation: c.vaultLocation,
      custodian: c.custodian,
      currency: c.currency,
      openingBalance: String(c.openingBalance),
      status: c.status,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Cash Account / Till name is required.');
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
        await apiClient(`/cash-accounts/${editingAccount.id}`, {
          method: 'PUT',
          body: {
            name: form.name.trim(),
            code: form.code.trim(),
            currency: form.currency,
            openingBalance: parseFloat(form.openingBalance) || 0,
            reconciliationEnabled: true,
            companyId: activeEntityId,
          },
        });
      } else {
        await apiClient('/cash-accounts', {
          method: 'POST',
          body: {
            name: form.name.trim(),
            code: form.code.trim(),
            currency: form.currency,
            openingBalance: parseFloat(form.openingBalance) || 0,
            reconciliationEnabled: true,
            companyId: activeEntityId,
          },
        });
      }

      setIsModalOpen(false);
      await loadCashAccounts();
    } catch (err: any) {
      setError(err?.data?.error || err?.message || 'Failed to save cash account.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Branded Cash Account Statement / Certificate PDF ───────────────────────
  const generateAccountPDF = (c: CashAccountRecord) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const primaryColor: [number, number, number] = [16, 185, 129];
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
    doc.text('CASH ACCOUNT & TILL CERTIFICATE', margin, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`GL Account Code: ${c.code}`, margin, 21);
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

    // Cash Till Details Box
    const cashX = margin + colW + 6;
    doc.setFillColor(...lightBg);
    doc.roundedRect(cashX, boxY, colW, boxH, 2, 2, 'FD');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('CASH REGISTER / VAULT DETAILS', cashX + 4, boxY + 7);

    doc.setTextColor(...darkColor);
    doc.setFontSize(9.5);
    doc.text(c.name, cashX + 4, boxY + 14);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Custodian / Cashier: ${c.custodian || 'General Cashier'}`, cashX + 4, boxY + 20);
    doc.text(`Vault Location: ${c.vaultLocation || 'Main Cash Desk'}`, cashX + 4, boxY + 25);
    doc.text(`Status: ${c.status} • Denomination: ${c.currency}`, cashX + 4, boxY + 30);

    // Balance Banner
    const bannerY = boxY + boxH + 6;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin, bannerY, contentWidth, 18, 2, 2, 'FD');

    doc.setTextColor(6, 95, 70);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PHYSICAL CASH GENERAL LEDGER BOOK BALANCE', margin + 4, bannerY + 6.5);

    doc.setFontSize(14);
    doc.text(money(c.balance, c.currency), margin + 4, bannerY + 14);

    // Financial Profile Table
    const tableStartY = bannerY + 24;
    const tableHeaders = ['Financial Metric', 'GL Value', 'Notes'];
    const tableRows = [
      ['General Ledger Code', c.code, 'IAS 1 / GAAP Cash & Cash Equivalents Classification'],
      ['Opening Book Balance', money(c.openingBalance, c.currency), 'Initial brought forward balance'],
      ['Current Ledger Balance', money(c.balance, c.currency), 'Live synchronized position'],
      ['Custodian / Cashier', c.custodian || 'General Cashier', 'Assigned financial handler'],
      ['Operational Status', c.status, 'Active register'],
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
    doc.text('Official Cash Account Profile Verification. Generated from AccountBook Banking & Payments Module.', margin, pageHeight - 8);

    const safeName = (c.name || 'Cash').replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`Cash_Account_${c.code}_${safeName}.pdf`);
  };

  // ─── Excel & CSV Exports ───────────────────────────────────────────────────
  const exportAccountsExcel = () => {
    const headers = ['GL Code', 'Cash Account / Till Name', 'Vault Location', 'Custodian', 'Currency', 'Current Balance', 'Status'];
    const rows = filtered.map((c) => [
      c.code,
      c.name,
      c.vaultLocation || 'Main Cash Desk',
      c.custodian || 'General Cashier',
      c.currency,
      c.balance,
      c.status,
    ]);
    downloadExcel(`Cash_Accounts_Register_${new Date().toISOString().slice(0, 10)}`, 'Cash Accounts', headers, rows);
  };

  const exportAccountsCSV = () => {
    const headers = ['GL Code', 'Cash Account / Till Name', 'Vault Location', 'Custodian', 'Currency', 'Current Balance', 'Status'];
    const rows = filtered.map((c) => [
      c.code,
      c.name,
      c.vaultLocation || 'Main Cash Desk',
      c.custodian || 'General Cashier',
      c.currency,
      c.balance,
      c.status,
    ]);
    downloadCSV(`Cash_Accounts_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-xs">
        <div>
          <h1 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" /> Cash Accounts & Vaults
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Physical cash registers, petty cash funds, custodian assignments, and vault reserves for {currentEntity?.name || 'Active Company'}.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={exportAccountsExcel}
            className="secondary h-8.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            title="Export cash accounts to Excel"
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
            onClick={loadCashAccounts}
            className="secondary h-8.5 w-8.5 rounded-lg flex items-center justify-center text-xs text-[var(--color-text)]"
            title="Refresh accounts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openAddModal}
            className="primary h-8.5 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Cash Register / Till
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards - KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL CASH ON HAND', value: money(totalBalance, currentEntity?.currencyCode), desc: `Across ${filtered.length} cash registers`, icon: Wallet, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'ACTIVE REGISTERS', value: activeCount, desc: 'Operational tills and vaults', icon: CheckCircle2, color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'CUSTODIANS ASSIGNED', value: custodianCount, desc: 'Monitored cash handlers', icon: Users, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-950/30', textColor: 'text-violet-600 dark:text-violet-400' },
          { label: 'AVERAGE TILL BALANCE', value: money(avgBalance, currentEntity?.currencyCode), desc: 'Per register average', icon: DollarSign, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-xl font-semibold mt-1.5 ${kpi.textColor}`}>{kpi.value}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">{kpi.desc}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center text-white shadow-lg`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full ${kpi.bg} opacity-50`} />
          </div>
        ))}
      </div>

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
            placeholder="Search till name, custodian, code..."
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

      {/* Cash Accounts Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xs overflow-hidden">
        <div className="p-3 border-b border-[var(--color-border)] flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <span className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-emerald-600" /> Cash Registers & Vaults Directory ({filtered.length})
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Click <strong>Certificate PDF</strong> to download an official till balance certificate.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/80 text-[var(--color-text-muted)] border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5">GL Code</th>
                <th className="py-2.5 px-3">Cash Register / Till Name</th>
                <th className="py-2.5 px-3">Vault Location</th>
                <th className="py-2.5 px-3">Custodian / Cashier</th>
                <th className="py-2.5 px-3 text-center">Currency</th>
                <th className="py-2.5 px-3 text-right">On-Hand Balance</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3.5 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <p className="font-semibold text-xs">Loading cash accounts...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-gray-400" />
                      <p className="font-semibold text-xs">No cash accounts match your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {c.code}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[var(--color-text-strong)]">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text-muted)]">
                      {c.vaultLocation || 'Main Cash Desk'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--color-text)] font-medium">
                      {c.custodian || 'General Cashier'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-semibold text-[10px]">
                        {c.currency}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      {money(c.balance, c.currency)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 border border-rose-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg text-[11px] font-semibold transition-all shadow-2xs"
                          title="Edit Cash Account / Till"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-600" /> Edit
                        </button>
                        <button
                          onClick={() => generateAccountPDF(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-semibold transition-all shadow-2xs"
                          title="Download Cash Account Certificate PDF"
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
                  <td colSpan={5} className="py-3 px-3.5 uppercase tracking-wider text-[var(--color-text-muted)] text-right">
                    Total Cash On Hand:
                  </td>
                  <td className="py-3 px-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {money(totalBalance, currentEntity?.currencyCode)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Cash Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-strong)] flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-600" /> {editingAccount ? 'Edit Cash Register / Till' : 'Add Cash Register / Till'}
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {editingAccount ? `Update configuration and balance details for ${editingAccount.name}.` : 'Register a physical cash till or petty cash vault with GL mapping.'}
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
                    placeholder="e.g. 11105"
                    className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono font-bold outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Denomination Currency *</label>
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
                <label className="text-xs font-bold text-[var(--color-text-strong)]">Cash Register / Till Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Head Office Petty Cash Vault / Till #1"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Vault Location</label>
                  <input
                    type="text"
                    value={form.vaultLocation}
                    onChange={(e) => setForm({ ...form, vaultLocation: e.target.value })}
                    placeholder="e.g. Head Office Safe #2"
                    className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Custodian / Cashier</label>
                  <input
                    type="text"
                    value={form.custodian}
                    onChange={(e) => setForm({ ...form, custodian: e.target.value })}
                    placeholder="e.g. Account Cashier"
                    className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">Opening Cash Balance ({form.currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.openingBalance}
                  onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono outline-none focus:border-blue-500"
                />
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
                  {editingAccount ? 'Update Cash Register' : 'Save Cash Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashAccountsView;
