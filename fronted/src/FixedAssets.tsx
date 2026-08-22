import React, { useEffect, useState, useMemo } from 'react';
import { assetsInventoryApi } from './api/modules/assetsInventory.api';
import type { FixedAsset, DepreciationRunResult } from './api/modules/assetsInventory.api';
import { coaApi } from './api/modules/coa.api';
import type { Account } from './api/modules/coa.api';
import {
  Building, Plus, Search, X, CheckCircle2, ShieldCheck,
  Download, FileSpreadsheet, RefreshCw, Zap, Trash2,
  FileText, TrendingDown, DollarSign, Tag
} from 'lucide-react';
import { money } from './lib/currency';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ASSET_CATEGORIES = [
  'Plant & Machinery',
  'Office Equipment',
  'Computer Hardware & IT',
  'Furniture & Fixtures',
  'Motor Vehicles',
  'Land & Buildings',
  'Leasehold Improvements',
];

export const FixedAssets: React.FC<{ activeEntityId: string }> = ({ activeEntityId }) => {
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'FullyDepreciated' | 'Disposed'>('All');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deprModal, setDeprModal] = useState<FixedAsset | null>(null);
  const [disposeModal, setDisposeModal] = useState<FixedAsset | null>(null);
  const [detailModal, setDetailModal] = useState<FixedAsset | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchResults, setBatchResults] = useState<DepreciationRunResult[] | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    assetTag: `AST-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
    name: '',
    description: '',
    category: ASSET_CATEGORIES[0],
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchasePrice: '',
    salvageValue: '0',
    usefulLifeYears: '5',
    depreciationMethod: 0, // 0 = StraightLine, 1 = DecliningBalance
    assetAccountId: '',
    accumulatedDepreciationAccountId: '',
    depreciationExpenseAccountId: '',
  });

  const [deprForm, setDeprForm] = useState({
    expenseAccId: '',
    accumAccId: '',
  });

  const [disposeForm, setDisposeForm] = useState({
    disposalDate: new Date().toISOString().slice(0, 10),
    proceeds: '0',
    cashAccountId: '',
    assetAccountId: '',
    accumDeprAccountId: '',
    gainLossAccountId: '',
  });

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await assetsInventoryApi.getFixedAssets(activeEntityId);
      setAssets(data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch fixed assets register.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await coaApi.getAccounts();
      setAccounts(data.filter((a: any) => a.status === 'Active' || !a.status));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchAccounts();
  }, [activeEntityId]);

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Helper check
  const isActive = (a: FixedAsset) => String(a.status) === '0' || a.status === 'Active';
  const isFullyDepreciated = (a: FixedAsset) => a.status === 'Depreciated' || a.status === 'FullyDepreciated' || String(a.status) === '2';
  const isDisposed = (a: FixedAsset) => String(a.status) === '1' || a.status === 'Disposed';

  // ─── Create Asset ────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setError('');
    setCreateForm({
      assetTag: `AST-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`,
      name: '',
      description: '',
      category: ASSET_CATEGORIES[0],
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchasePrice: '',
      salvageValue: '0',
      usefulLifeYears: '5',
      depreciationMethod: 0,
      assetAccountId: accounts.find((a) => a.type === 'FixedAsset' || a.type === 'Asset')?.id || '',
      accumulatedDepreciationAccountId: accounts.find((a) => a.type === 'ContraAsset' || a.name?.toLowerCase().includes('accumulated'))?.id || '',
      depreciationExpenseAccountId: accounts.find((a) => a.type === 'Expense' && a.name?.toLowerCase().includes('depreciation'))?.id || '',
    });
    setIsCreateOpen(true);
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cost = parseFloat(createForm.purchasePrice);
    if (!createForm.name.trim()) { setError('Asset name is required.'); return; }
    if (isNaN(cost) || cost <= 0) { setError('Valid purchase cost is required.'); return; }

    setLoading(true);
    try {
      await assetsInventoryApi.createFixedAsset({
        assetTag: createForm.assetTag,
        name: createForm.name,
        description: `${createForm.category} — ${createForm.description}`.trim(),
        purchaseDate: createForm.purchaseDate,
        purchasePrice: cost,
        salvageValue: parseFloat(createForm.salvageValue) || 0,
        usefulLifeYears: parseInt(createForm.usefulLifeYears) || 3,
        depreciationMethod: Number(createForm.depreciationMethod),
        assetAccountId: createForm.assetAccountId || undefined,
        accumulatedDepreciationAccountId: createForm.accumulatedDepreciationAccountId || undefined,
        depreciationExpenseAccountId: createForm.depreciationExpenseAccountId || undefined,
        companyId: activeEntityId || undefined,
      });

      notify('✓ Fixed asset successfully registered in the Asset Register.');
      setIsCreateOpen(false);
      await fetchAssets();
    } catch (err: any) {
      setError(err?.data?.error || err?.data?.message || err?.message || 'Failed to register asset.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Single Asset Depreciation ───────────────────────────────────────────
  const openDeprModal = (a: FixedAsset) => {
    setError('');
    setDeprForm({
      expenseAccId: a.depreciationExpenseAccountId || accounts.find((acc) => acc.type === 'Expense' && acc.name.toLowerCase().includes('depreciation'))?.id || '',
      accumAccId: a.accumulatedDepreciationAccountId || accounts.find((acc) => acc.type === 'ContraAsset' || acc.name.toLowerCase().includes('accumulated'))?.id || '',
    });
    setDeprModal(a);
  };

  const handleRunDepreciation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deprModal) return;
    setActingId(deprModal.id);
    setError('');
    try {
      await assetsInventoryApi.runDepreciation(deprModal.id, deprForm.expenseAccId, deprForm.accumAccId);
      notify(`✓ Monthly depreciation for ${deprModal.name} posted to General Ledger.`);
      setDeprModal(null);
      await fetchAssets();
    } catch (err: any) {
      setError(err?.data?.error || err?.data?.message || err?.message || 'Failed to post depreciation.');
    } finally {
      setActingId(null);
    }
  };

  // ─── Month-End Batch Depreciation ─────────────────────────────────────────
  const handleBatchDepreciation = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await assetsInventoryApi.runBatchDepreciation();
      setBatchResults(res.results || []);
      setBatchModalOpen(true);
      notify(res.message || '✓ Batch depreciation posted to General Ledger.');
      await fetchAssets();
    } catch (err: any) {
      setError(err?.data?.error || err?.data?.message || err?.message || 'Failed to run batch depreciation.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Asset Disposal (IAS 16 Derecognition) ─────────────────────────────────
  const openDisposeModal = (a: FixedAsset) => {
    setError('');
    setDisposeForm({
      disposalDate: new Date().toISOString().slice(0, 10),
      proceeds: '0',
      cashAccountId: accounts.find((acc) => acc.type === 'Asset' && (acc.name.toLowerCase().includes('bank') || acc.name.toLowerCase().includes('cash')))?.id || '',
      assetAccountId: a.assetAccountId || accounts.find((acc) => acc.type === 'FixedAsset' || acc.type === 'Asset')?.id || '',
      accumDeprAccountId: a.accumulatedDepreciationAccountId || accounts.find((acc) => acc.type === 'ContraAsset' || acc.name.toLowerCase().includes('accumulated'))?.id || '',
      gainLossAccountId: accounts.find((acc) => acc.name.toLowerCase().includes('gain') || acc.name.toLowerCase().includes('loss') || acc.type === 'Expense')?.id || '',
    });
    setDisposeModal(a);
  };

  const handleDisposeAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeModal) return;
    const proceeds = parseFloat(disposeForm.proceeds);
    if (isNaN(proceeds) || proceeds < 0) { setError('Proceeds cannot be negative.'); return; }

    setActingId(disposeModal.id);
    setError('');
    try {
      await assetsInventoryApi.disposeAsset(disposeModal.id, {
        disposalDate: disposeForm.disposalDate,
        proceeds,
        assetAccountId: disposeForm.assetAccountId || undefined,
        accumDeprAccountId: disposeForm.accumDeprAccountId || undefined,
        gainLossAccountId: disposeForm.gainLossAccountId || undefined,
        cashAccountId: disposeForm.cashAccountId || undefined,
      });

      notify(`✓ Asset ${disposeModal.name} disposed and gain/loss journal posted to General Ledger.`);
      setDisposeModal(null);
      await fetchAssets();
    } catch (err: any) {
      setError(err?.data?.error || err?.data?.message || err?.message || 'Failed to dispose asset.');
    } finally {
      setActingId(null);
    }
  };

  // ─── 4 Top Financial KPIs ────────────────────────────────────────────────
  const activeAssets = assets.filter(isActive);
  const totalCost = activeAssets.reduce((sum, a) => sum + (a.purchasePrice || (a as any).cost || 0), 0);
  const totalAccumDepr = assets.reduce((sum, a) => sum + (a.accumulatedDepreciation || 0), 0);
  const totalNBV = activeAssets.reduce((sum, a) => {
    const cost = a.purchasePrice || (a as any).cost || 0;
    const depr = a.accumulatedDepreciation || 0;
    return sum + (cost - depr);
  }, 0);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (statusFilter === 'Active' && !isActive(a)) return false;
      if (statusFilter === 'FullyDepreciated' && !isFullyDepreciated(a)) return false;
      if (statusFilter === 'Disposed' && !isDisposed(a)) return false;

      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTag = (a.assetTag || (a as any).assetCode || '').toLowerCase().includes(q);
        const matchesName = (a.name || '').toLowerCase().includes(q);
        const matchesDesc = (a.description || '').toLowerCase().includes(q);
        if (!matchesTag && !matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [assets, statusFilter, query]);

  // ─── Branded Official Asset PDF Certificate ──────────────────────────────
  const generateAssetPDF = (asset: FixedAsset) => {
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
    doc.text('FIXED ASSET CERTIFICATE & REGISTER', margin, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Asset Tag: ${asset.assetTag || asset.id.slice(0, 8)}`, margin, 21);
    doc.text(`Standard: IAS 16 (PPE)`, pageWidth - margin, 14, { align: 'right' });
    doc.text(`Date Generated: ${new Date().toISOString().slice(0, 10)}`, pageWidth - margin, 21, { align: 'right' });

    let yPos = 36;

    // Asset Info Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, yPos, contentWidth, 34, 2, 2, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(asset.name, margin + 4, yPos + 7);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Description / Category: ${asset.description || 'Capital Asset'}`, margin + 4, yPos + 13);
    doc.text(`Acquisition Date: ${(asset.purchaseDate || (asset as any).acquisitionDate || '').slice(0, 10)}`, margin + 4, yPos + 19);
    doc.text(`Useful Life: ${asset.usefulLifeYears || 5} Years | Depreciation Method: Straight-Line (IAS 16)`, margin + 4, yPos + 25);
    doc.text(`Status: ${isActive(asset) ? 'ACTIVE' : isFullyDepreciated(asset) ? 'FULLY DEPRECIATED' : 'DISPOSED'}`, margin + 4, yPos + 31);

    yPos += 42;

    // Financial Values Breakdown Table
    const cost = asset.purchasePrice || (asset as any).cost || 0;
    const depr = asset.accumulatedDepreciation || 0;
    const nbv = asset.netBookValue ?? (cost - depr);
    const monthlyDepr = ((cost - (asset.salvageValue || 0)) / (asset.usefulLifeYears || 5)) / 12;

    const tableBody = [
      ['Gross Acquisition Cost (Historical)', money(cost)],
      ['Estimated Residual / Salvage Value', money(asset.salvageValue || 0)],
      ['Depreciable Base Amount', money(cost - (asset.salvageValue || 0))],
      ['Monthly Depreciation Expense (GL Dr/Cr)', money(monthlyDepr)],
      ['Cumulative Accumulated Depreciation to Date', `- ${money(depr)}`],
      ['CURRENT NET BOOK VALUE (CARRYING AMOUNT)', money(nbv)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['CAPITAL ASSET FINANCIAL PARAMETER', 'AMOUNT (PKR)']],
      body: tableBody,
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 3.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 110, fontStyle: 'bold' },
        1: { cellWidth: 72, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 160;

    // Signatures
    const sigY = Math.max(finalY + 25, 220);
    const colW = contentWidth / 3;

    ['Asset Custodian', 'Internal Auditor', 'Finance Director / Controller'].forEach((title, idx) => {
      const x = margin + idx * colW + 4;
      doc.setDrawColor(180, 180, 180);
      doc.line(x, sigY, x + colW - 8, sigY);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...grayColor);
      doc.text(title, x + (colW - 8) / 2, sigY + 4.5, { align: 'center' });
    });

    doc.save(`Asset_Register_${asset.assetTag || asset.name}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ─── Export Excel & CSV ───────────────────────────────────────────────────
  const exportData = (type: 'excel' | 'csv') => {
    const headers = ['Asset Tag', 'Name', 'Description', 'Acquisition Date', 'Cost', 'Accumulated Depreciation', 'Net Book Value', 'Status'];
    const rows = filteredAssets.map((a) => {
      const cost = a.purchasePrice || (a as any).cost || 0;
      const depr = a.accumulatedDepreciation || 0;
      const nbv = a.netBookValue ?? (cost - depr);
      return [
        a.assetTag || (a as any).assetCode || '',
        a.name,
        a.description || '',
        (a.purchaseDate || (a as any).acquisitionDate || '').slice(0, 10),
        cost,
        depr,
        nbv,
        isActive(a) ? 'Active' : isFullyDepreciated(a) ? 'Fully Depreciated' : 'Disposed',
      ];
    });

    if (type === 'excel') {
      downloadExcel('Fixed_Assets_Register', 'FixedAssets', headers, rows);
    } else {
      downloadCSV('Fixed_Assets_Register', headers, rows);
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6 min-h-screen">
      {/* ─── Top Control & Action Bar ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--color-text-strong)] flex items-center gap-2">
              Fixed Assets Register <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">IAS 16 (PPE) / IAS 36</span>
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Capital assets register with automated straight-line depreciation, derecognition & General Ledger integration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Register Asset
          </button>
          <button
            onClick={handleBatchDepreciation}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-9 px-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Post one month depreciation across all active assets"
          >
            <Zap className="w-3.5 h-3.5" /> Batch Depreciate
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
            onClick={fetchAssets}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center bg-[var(--color-surface)] hover:bg-gray-50 dark:hover:bg-gray-800 text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-xl transition-all shadow-2xs"
            title="Refresh Assets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 4-in-1 Top Financial KPI Cards ─── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        {/* Gross Cost */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              GROSS ASSET COST (HISTORICAL)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-[var(--color-text-strong)]">
              {money(totalCost)}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Capitalized acquisition base</p>
          </div>
        </div>

        {/* Accumulated Depr */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-purple-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              ACCUMULATED DEPRECIATION
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-purple-600 dark:text-purple-400">
              - {money(totalAccumDepr)}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Recognized wear & tear expense</p>
          </div>
        </div>

        {/* Net Book Value */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              NET BOOK VALUE (NBV)
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {money(totalNBV)}
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Balance sheet carrying amount</p>
          </div>
        </div>

        {/* Active Capital Assets */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-text-muted)]">
              ACTIVE CAPITAL ASSETS
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-mono font-extrabold text-blue-600 dark:text-blue-400">
              {activeAssets.length} Assets
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{assets.length} total in register</p>
          </div>
        </div>
      </div>

      {/* ─── Search & Status Filter Toolbar (Zero Overlap Guaranteed) ─── */}
      <div className="bg-[var(--color-surface)] p-3 rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Zero Overlap Search Box */}
        <div className="inline-flex items-center h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-emerald-500 w-full sm:w-80 shadow-2xs">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Search asset tag, name, category..."
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

        {/* Status Filter Tabs & Integrity Pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl border border-[var(--color-border)] text-xs font-semibold">
            {(['All', 'Active', 'FullyDepreciated', 'Disposed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === s
                    ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
                }`}
              >
                {s === 'FullyDepreciated' ? 'Fully Depreciated' : s}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>IAS 16 Compliant</span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="text-emerald-500 hover:text-emerald-700 font-bold ml-2">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold ml-2">✕</button>
        </div>
      )}

      {/* ─── Fixed Assets Table ─── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-900/50 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-extrabold">
                <th className="py-3.5 px-4">ASSET TAG</th>
                <th className="py-3.5 px-4">ASSET NAME & DESCRIPTION</th>
                <th className="py-3.5 px-4">ACQUISITION DATE</th>
                <th className="py-3.5 px-4 text-right">COST</th>
                <th className="py-3.5 px-4 text-right">ACCUM. DEPR.</th>
                <th className="py-3.5 px-4 text-right">NET BOOK VALUE</th>
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-right pr-6">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--color-text-muted)]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Building className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto" />
                      <p className="font-semibold text-xs text-[var(--color-text-strong)]">No fixed assets found</p>
                      <p className="text-[11px]">Click "Register Asset" to record plant, equipment, or machinery.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const cost = asset.purchasePrice || (asset as any).cost || 0;
                  const depr = asset.accumulatedDepreciation || 0;
                  const nbv = asset.netBookValue ?? (cost - depr);
                  const active = isActive(asset);

                  return (
                    <tr key={asset.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {asset.assetTag || (asset as any).assetCode || asset.id.slice(0, 8)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[var(--color-text-strong)] block">
                          {asset.name}
                        </span>
                        <span className="text-[10px] text-[var(--color-text-muted)] block truncate max-w-xs">
                          {asset.description || 'Capital Asset'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[var(--color-text)]">
                        {(asset.purchaseDate || (asset as any).acquisitionDate || '').slice(0, 10) || '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--color-text-strong)]">
                        {money(cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                        {depr > 0 ? `- ${money(depr)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {money(nbv)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            active
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : isFullyDepreciated(asset)
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                          }`}
                        >
                          {active ? 'Active' : isFullyDepreciated(asset) ? 'Fully Depr.' : 'Disposed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDetailModal(asset)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 hover:text-[var(--color-text-strong)] transition-all"
                            title="View Asset Details & Financial Schedule"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => generateAssetPDF(asset)}
                            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-emerald-600 transition-all"
                            title="Download IAS 16 PDF Certificate"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {active && (
                            <>
                              <button
                                disabled={actingId === asset.id}
                                onClick={() => openDeprModal(asset)}
                                className="h-7 px-2.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3" /> Depr.
                              </button>
                              <button
                                disabled={actingId === asset.id}
                                onClick={() => openDisposeModal(asset)}
                                className="h-7 px-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" /> Dispose
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Capital Asset Registration Modal ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto" onClick={() => setIsCreateOpen(false)}>
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[94vh] transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-gray-50/70 dark:bg-gray-900/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-strong)]">
                    Register Capital Fixed Asset
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Record Property, Plant & Equipment under IAS 16 with automated depreciation parameters.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Asset Tag / Identifier *</label>
                  <input
                    type="text"
                    value={createForm.assetTag}
                    onChange={(e) => setCreateForm({ ...createForm, assetTag: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono font-bold outline-none focus:border-emerald-500 shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Asset Category *</label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500 shadow-2xs"
                  >
                    {ASSET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Asset Name / Title *</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Caterpillar Heavy Generator 150kVA / MacBook Pro M3 Max"
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500 shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Description & Serial Details</label>
                  <input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Serial number, custodian department, location..."
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Acquisition / Capitalization Date *</label>
                  <input
                    type="date"
                    value={createForm.purchaseDate}
                    onChange={(e) => setCreateForm({ ...createForm, purchaseDate: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] font-mono outline-none focus:border-emerald-500 shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Gross Purchase Cost (PKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={createForm.purchasePrice}
                    onChange={(e) => setCreateForm({ ...createForm, purchasePrice: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:border-emerald-500 shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Salvage / Residual Value (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={createForm.salvageValue}
                    onChange={(e) => setCreateForm({ ...createForm, salvageValue: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono outline-none focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--color-text-strong)]">Useful Economic Life (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={createForm.usefulLifeYears}
                    onChange={(e) => setCreateForm({ ...createForm, usefulLifeYears: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono outline-none focus:border-emerald-500 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Monthly Depreciation Preview Bar */}
              {parseFloat(createForm.purchasePrice) > 0 && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    Estimated Monthly Straight-Line Depreciation:
                  </span>
                  <span className="font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-300">
                    {money(
                      ((parseFloat(createForm.purchasePrice) - (parseFloat(createForm.salvageValue) || 0)) / (parseInt(createForm.usefulLifeYears) || 5)) / 12
                    )} / mo
                  </span>
                </div>
              )}

              {/* GL Accounts Section */}
              <div className="pt-2 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-text-strong)] block">
                  General Ledger Chart of Accounts Mapping
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-text-muted)]">Fixed Asset Account (Dr)</label>
                    <select
                      value={createForm.assetAccountId}
                      onChange={(e) => setCreateForm({ ...createForm, assetAccountId: e.target.value })}
                      className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Default Asset Account --</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-text-muted)]">Accumulated Depr. (Cr)</label>
                    <select
                      value={createForm.accumulatedDepreciationAccountId}
                      onChange={(e) => setCreateForm({ ...createForm, accumulatedDepreciationAccountId: e.target.value })}
                      className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Default Accum. Depr. --</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[var(--color-text-muted)]">Depr. Expense (Dr)</label>
                    <select
                      value={createForm.depreciationExpenseAccountId}
                      onChange={(e) => setCreateForm({ ...createForm, depreciationExpenseAccountId: e.target.value })}
                      className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                    >
                      <option value="">-- Default Depr. Expense --</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="secondary h-9 px-4 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="primary h-9 px-5 rounded-xl text-xs font-bold shadow-xs"
                >
                  {loading ? 'Saving...' : 'Register Asset in Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Single Asset Depreciation Modal ─── */}
      {deprModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6" onClick={() => setDeprModal(null)}>
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-gray-50/70 dark:bg-gray-900/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl border border-blue-200 dark:border-blue-800">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-strong)]">
                    Post Monthly Depreciation
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Asset: <strong>{deprModal.name}</strong> ({deprModal.assetTag})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDeprModal(null)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRunDepreciation} className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Historical Cost:</span>
                  <span className="font-mono font-bold text-[var(--color-text-strong)]">{money(deprModal.purchasePrice || (deprModal as any).cost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Accumulated to Date:</span>
                  <span className="font-mono font-bold text-purple-600">{money(deprModal.accumulatedDepreciation || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 dark:border-blue-800 pt-1.5">
                  <span className="font-bold text-blue-900 dark:text-blue-200">Monthly Depreciation to Post:</span>
                  <span className="font-mono font-extrabold text-blue-700 dark:text-blue-300 text-sm">
                    {money((((deprModal.purchasePrice || (deprModal as any).cost || 0) - (deprModal.salvageValue || 0)) / (deprModal.usefulLifeYears || 5)) / 12)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--color-text-strong)]">Depreciation Expense Account (Dr)</label>
                  <select
                    value={deprForm.expenseAccId}
                    onChange={(e) => setDeprForm({ ...deprForm, expenseAccId: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Use System Default Mapping --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--color-text-strong)]">Accumulated Depreciation Account (Cr)</label>
                  <select
                    value={deprForm.accumAccId}
                    onChange={(e) => setDeprForm({ ...deprForm, accumAccId: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Use System Default Mapping --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setDeprModal(null)}
                  className="secondary h-9 px-4 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actingId === deprModal.id}
                  className="primary h-9 px-5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" /> Post Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Asset Disposal Modal (IAS 16 Derecognition) ─── */}
      {disposeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6" onClick={() => setDisposeModal(null)}>
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-gray-50/70 dark:bg-gray-900/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-xl border border-rose-200 dark:border-rose-800">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-strong)]">
                    Dispose / Derecognize Capital Asset
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Asset: <strong>{disposeModal.name}</strong> (NBV: {money(disposeModal.netBookValue ?? ((disposeModal.purchasePrice || 0) - (disposeModal.accumulatedDepreciation || 0)))})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDisposeModal(null)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisposeAsset} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--color-text-strong)]">Disposal Date *</label>
                  <input
                    type="date"
                    value={disposeForm.disposalDate}
                    onChange={(e) => setDisposeForm({ ...disposeForm, disposalDate: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[var(--color-text-strong)]">Disposal Proceeds (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={disposeForm.proceeds}
                    onChange={(e) => setDisposeForm({ ...disposeForm, proceeds: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-right font-mono font-bold text-emerald-600 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-[var(--color-text-strong)]">Proceeds Deposited To (Cash/Bank Account)</label>
                  <select
                    value={disposeForm.cashAccountId}
                    onChange={(e) => setDisposeForm({ ...disposeForm, cashAccountId: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No Proceeds (Scrapped / Written Off) --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setDisposeModal(null)}
                  className="secondary h-9 px-4 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actingId === disposeModal.id}
                  className="h-9 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Dispose & Post Gain/Loss
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Asset Detail Inspection Modal ─── */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6" onClick={() => setDetailModal(null)}>
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-gray-50/70 dark:bg-gray-900/70">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-strong)]">
                    {detailModal.name}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Tag: <strong>{detailModal.assetTag || detailModal.id.slice(0, 8)}</strong> | IAS 16 Capital Asset
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailModal(null)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 dark:bg-gray-900 rounded-xl border border-[var(--color-border)]">
                <div>
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold block">Acquisition Date</span>
                  <span className="font-mono font-bold text-[var(--color-text-strong)]">{(detailModal.purchaseDate || (detailModal as any).acquisitionDate || '').slice(0, 10)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold block">Useful Life</span>
                  <span className="font-mono font-bold text-[var(--color-text-strong)]">{detailModal.usefulLifeYears || 5} Years</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold block">Gross Cost</span>
                  <span className="font-mono font-bold text-emerald-600">{money(detailModal.purchasePrice || (detailModal as any).cost || 0)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold block">Carrying Value (NBV)</span>
                  <span className="font-mono font-bold text-emerald-700">{money(detailModal.netBookValue ?? ((detailModal.purchasePrice || 0) - (detailModal.accumulatedDepreciation || 0)))}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setDetailModal(null)}
                  className="secondary h-9 px-4 rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => generateAssetPDF(detailModal)}
                  className="primary h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download IAS 16 Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Batch Depreciation Results Modal ─── */}
      {batchModalOpen && batchResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6" onClick={() => setBatchModalOpen(false)}>
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-gray-50/70 dark:bg-gray-900/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--color-text-strong)]">
                    Month-End Batch Depreciation Summary
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Depreciation journals posted to General Ledger for {batchResults.length} active capital assets.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setBatchModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              <div className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-900 font-extrabold text-[10px] text-[var(--color-text-muted)] uppercase border-b border-[var(--color-border)]">
                    <tr>
                      <th className="py-2.5 px-3">ASSET TAG</th>
                      <th className="py-2.5 px-3">ASSET NAME</th>
                      <th className="py-2.5 px-3 text-right">POSTED DEPR.</th>
                      <th className="py-2.5 px-3 text-right">CLOSING NBV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)] font-mono">
                    {batchResults.map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-bold text-blue-600">{r.assetTag}</td>
                        <td className="py-2 px-3 font-sans font-medium text-[var(--color-text-strong)]">{r.assetName}</td>
                        <td className="py-2 px-3 text-right font-bold text-purple-600">{money(r.amountPosted)}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">{money(r.netBookValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="primary h-9 px-5 rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedAssets;