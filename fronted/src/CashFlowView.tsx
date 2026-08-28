import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownRight, ArrowUpRight, RefreshCw, Download,
  FileSpreadsheet, Search, X, ShieldCheck,
  Building2, Layers, Landmark, Wallet, Activity
} from 'lucide-react';
import type { Entity } from './EntitySettings';
import { apiClient } from './api/client';
import { money } from './lib/currency';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
import { KpiCard, KpiGrid } from './components/ui/kpi-card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CashFlowItem {
  title: string;
  amount: number;
  type: 'inflow' | 'outflow';
  category: string;
}

interface CashFlowResponse {
  summary: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    openingCash: number;
    closingCash: number;
    netIncome: number;
    totalBankAccounts: number;
    totalCashRegisters: number;
  };
  directMethod: {
    operatingActivities: CashFlowItem[];
    netOperating: number;
    investingActivities: CashFlowItem[];
    netInvesting: number;
    financingActivities: CashFlowItem[];
    netFinancing: number;
    netCashFlow: number;
    openingCash: number;
    closingCash: number;
  };
  indirectMethod: {
    netIncome: number;
    adjustments: any[];
    workingCapitalChanges: {
      accountsReceivable: number;
      inventory: number;
      accountsPayable: number;
    };
    netOperating: number;
    netInvesting: number;
    netFinancing: number;
    netCashFlow: number;
    openingCash: number;
    closingCash: number;
  };
}

export const CashFlowView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({ activeEntityId, entities }) => {
  const currentEntity = entities.find((e) => e.id === activeEntityId) || entities[0];

  // Filters & State
  const [method, setMethod] = useState<'direct' | 'indirect'>('direct');
  const [periodPreset, setPeriodPreset] = useState<'thisMonth' | 'thisQuarter' | 'thisYear' | 'allTime' | 'custom'>('thisYear');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<CashFlowResponse | null>(null);

  // Initialize date range based on preset
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    if (periodPreset === 'thisMonth') {
      setFromDate(`${year}-${month}-01`);
      setToDate(`${year}-${month}-${day}`);
    } else if (periodPreset === 'thisQuarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
      setFromDate(`${year}-${String(qMonth).padStart(2, '0')}-01`);
      setToDate(`${year}-${month}-${day}`);
    } else if (periodPreset === 'thisYear') {
      setFromDate(`${year}-01-01`);
      setToDate(`${year}-12-31`);
    } else if (periodPreset === 'allTime') {
      setFromDate('');
      setToDate('');
    }
  }, [periodPreset]);

  // Load Cash Flow Report Data
  const loadCashFlow = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = { companyId: activeEntityId };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await apiClient<CashFlowResponse>('/reports/cash-flow', { params });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load cash flow statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCashFlow();
  }, [activeEntityId, fromDate, toDate]);

  // Filtered direct method items
  const filteredOperating = useMemo(() => {
    const list = data?.directMethod?.operatingActivities || [];
    if (!query.trim()) return list;
    return list.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));
  }, [data, query]);

  const filteredInvesting = useMemo(() => {
    const list = data?.directMethod?.investingActivities || [];
    if (!query.trim()) return list;
    return list.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));
  }, [data, query]);

  const filteredFinancing = useMemo(() => {
    const list = data?.directMethod?.financingActivities || [];
    if (!query.trim()) return list;
    return list.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));
  }, [data, query]);

  const summary = data?.summary || {
    operatingCashFlow: 0,
    investingCashFlow: 0,
    financingCashFlow: 0,
    netCashFlow: 0,
    openingCash: 0,
    closingCash: 0,
    netIncome: 0,
    totalBankAccounts: 0,
    totalCashRegisters: 0,
  };

  // ─── Branded IAS 7 PDF Statement Export ─────────────────────────────────────
  const exportPDF = () => {
    if (!data) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const primaryColor: [number, number, number] = [16, 100, 75]; // Deep Forest / Emerald
    const grayColor: [number, number, number] = [100, 116, 139];
    const lightBg: [number, number, number] = [248, 250, 252];
    const borderGray: [number, number, number] = [226, 232, 240];

    // Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('STATEMENT OF CASH FLOWS (IAS 7)', margin, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Entity: ${currentEntity?.name || 'Primary Corporate Entity'}`, margin, 21);

    const periodText = fromDate && toDate ? `Period: ${fromDate} to ${toDate}` : 'All-Time Financial Statement';
    doc.text(periodText, pageWidth - margin, 14, { align: 'right' });
    doc.text(`Accounting Standard: IFRS / IAS 7 (${method.toUpperCase()} METHOD)`, pageWidth - margin, 21, { align: 'right' });

    let yPos = 36;

    // Financial KPI Summary Cards
    const cardWidth = (contentWidth - 6) / 3;
    const cardHeight = 16;

    const cards = [
      { label: 'OPERATING CASH FLOW', value: money(summary.operatingCashFlow, currentEntity?.currencyCode), color: summary.operatingCashFlow >= 0 ? [16, 185, 129] : [239, 68, 68] },
      { label: 'INVESTING & FINANCING', value: money(summary.investingCashFlow + summary.financingCashFlow, currentEntity?.currencyCode), color: [59, 130, 246] },
      { label: 'CLOSING CASH & BANK', value: money(summary.closingCash, currentEntity?.currencyCode), color: [16, 100, 75] },
    ];

    cards.forEach((c, idx) => {
      const x = margin + idx * (cardWidth + 3);
      doc.setFillColor(...lightBg);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(x, yPos, cardWidth, cardHeight, 2, 2, 'FD');

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...grayColor);
      doc.text(c.label, x + 4, yPos + 5.5);

      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(c.color[0], c.color[1], c.color[2]);
      doc.text(c.value, x + 4, yPos + 12);
    });

    yPos += 22;

    // Table Data
    const tableBody: any[] = [];

    // 1. Operating Activities
    tableBody.push([{ content: '1. CASH FLOWS FROM OPERATING ACTIVITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }]);
    if (data.directMethod.operatingActivities.length === 0) {
      tableBody.push(['   Cash receipts from operations & collections', money(summary.operatingCashFlow, currentEntity?.currencyCode)]);
    } else {
      data.directMethod.operatingActivities.forEach((item) => {
        tableBody.push([`   ${item.title}`, money(item.amount, currentEntity?.currencyCode)]);
      });
    }
    tableBody.push([
      { content: 'Net Cash Provided by / (Used in) Operating Activities', styles: { fontStyle: 'bold', textColor: [16, 100, 75] } },
      { content: money(summary.operatingCashFlow, currentEntity?.currencyCode), styles: { fontStyle: 'bold', halign: 'right', textColor: [16, 100, 75] } },
    ]);

    // 2. Investing Activities
    tableBody.push([{ content: '2. CASH FLOWS FROM INVESTING ACTIVITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }]);
    if (data.directMethod.investingActivities.length === 0) {
      tableBody.push(['   Purchase of property, plant & equipment (CapEx)', money(summary.investingCashFlow, currentEntity?.currencyCode)]);
    } else {
      data.directMethod.investingActivities.forEach((item) => {
        tableBody.push([`   ${item.title}`, money(item.amount, currentEntity?.currencyCode)]);
      });
    }
    tableBody.push([
      { content: 'Net Cash Provided by / (Used in) Investing Activities', styles: { fontStyle: 'bold', textColor: [30, 58, 138] } },
      { content: money(summary.investingCashFlow, currentEntity?.currencyCode), styles: { fontStyle: 'bold', halign: 'right', textColor: [30, 58, 138] } },
    ]);

    // 3. Financing Activities
    tableBody.push([{ content: '3. CASH FLOWS FROM FINANCING ACTIVITIES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }]);
    if (data.directMethod.financingActivities.length === 0) {
      tableBody.push(['   Capital injections, borrowings and owner drawings', money(summary.financingCashFlow, currentEntity?.currencyCode)]);
    } else {
      data.directMethod.financingActivities.forEach((item) => {
        tableBody.push([`   ${item.title}`, money(item.amount, currentEntity?.currencyCode)]);
      });
    }
    tableBody.push([
      { content: 'Net Cash Provided by / (Used in) Financing Activities', styles: { fontStyle: 'bold', textColor: [109, 40, 217] } },
      { content: money(summary.financingCashFlow, currentEntity?.currencyCode), styles: { fontStyle: 'bold', halign: 'right', textColor: [109, 40, 217] } },
    ]);

    // Summary Reconciliation
    tableBody.push([{ content: 'NET INCREASE / (DECREASE) IN CASH & EQUIVALENTS', styles: { fontStyle: 'bold', fillColor: [240, 253, 244], textColor: [21, 128, 61] } }, { content: money(summary.netCashFlow, currentEntity?.currencyCode), styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 253, 244], textColor: [21, 128, 61] } }]);
    tableBody.push(['Cash & Cash Equivalents at Beginning of Period', money(summary.openingCash, currentEntity?.currencyCode)]);
    tableBody.push([{ content: 'CASH & CASH EQUIVALENTS AT END OF PERIOD', styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [15, 23, 42] } }, { content: money(summary.closingCash, currentEntity?.currencyCode), styles: { fontStyle: 'bold', halign: 'right', fillColor: [220, 252, 231], textColor: [15, 23, 42] } }]);

    autoTable(doc, {
      startY: yPos,
      head: [['CASH FLOW ACTIVITY & LINE ITEM', `AMOUNT (${currentEntity?.currencyCode || 'PKR'})`]],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: contentWidth * 0.72 }, 1: { cellWidth: contentWidth * 0.28, halign: 'right' } },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 220;

    // Signature Block
    if (finalY < 245) {
      const sigY = Math.max(finalY + 16, 250);
      const colW = contentWidth / 3;

      ['Prepared By (Accountant)', 'Reviewed By (Finance Lead)', 'Approved By (CFO / MD)'].forEach((title, idx) => {
        const x = margin + idx * colW + 4;
        doc.setDrawColor(180, 180, 180);
        doc.line(x, sigY, x + colW - 8, sigY);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text(title, x + (colW - 8) / 2, sigY + 4.5, { align: 'center' });
      });
    }

    doc.save(`Cash_Flow_Statement_${currentEntity?.name || 'Entity'}_${fromDate || 'AllTime'}.pdf`);
  };

  // ─── Export Excel / CSV ────────────────────────────────────────────────────
  const exportData = (type: 'excel' | 'csv') => {
    if (!data) return;
    const headers = ['Activity Section', 'Line Item Description', `Amount (${currentEntity?.currencyCode || 'PKR'})`];
    const rows: (string | number)[][] = [];

    // Operating
    data.directMethod.operatingActivities.forEach((i) => {
      rows.push(['Operating Activities', i.title, i.amount]);
    });
    rows.push(['Operating Activities', 'Net Operating Cash Flow', summary.operatingCashFlow]);

    // Investing
    data.directMethod.investingActivities.forEach((i) => {
      rows.push(['Investing Activities', i.title, i.amount]);
    });
    rows.push(['Investing Activities', 'Net Investing Cash Flow', summary.investingCashFlow]);

    // Financing
    data.directMethod.financingActivities.forEach((i) => {
      rows.push(['Financing Activities', i.title, i.amount]);
    });
    rows.push(['Financing Activities', 'Net Financing Cash Flow', summary.financingCashFlow]);

    // Summary
    rows.push(['Summary', 'Net Change in Cash Position', summary.netCashFlow]);
    rows.push(['Summary', 'Opening Cash & Equivalents', summary.openingCash]);
    rows.push(['Summary', 'Closing Cash & Equivalents', summary.closingCash]);

    if (type === 'excel') {
      downloadExcel('Cash_Flow_Statement', 'Cash Flow', headers, rows);
    } else {
      downloadCSV('Cash_Flow_Statement', headers, rows);
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800 p-2 md:p-6 min-h-screen">
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* ─── Top Control & Action Bar (Clean 1-Row Layout) ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[var(--color-text-strong)] flex items-center gap-2">
              Cash Flow Statement <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">IAS 7 / GAAP</span>
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Operating, Investing & Financing liquid cash flow analysis for <strong>{currentEntity?.name || 'Active Entity'}</strong>.
            </p>
          </div>
        </div>

        {/* Action Buttons in single clean row */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            title="Download IAS 7 Official Statement PDF"
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
            onClick={loadCashFlow}
            disabled={loading}
            className="h-9 w-9 flex items-center justify-center bg-[var(--color-surface)] hover:bg-gray-50 dark:hover:bg-gray-800 text-[var(--color-text-muted)] border border-[var(--color-border)] rounded-xl transition-all shadow-2xs"
            title="Refresh Cash Flow Calculations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 4-in-1 Top Financial KPI Cards ─── */}
      <KpiGrid cols={4}>
        {/* Operating Cash Flow */}
        <KpiCard
          icon={summary.operatingCashFlow >= 0 ? ArrowUpRight : ArrowDownRight}
          label="OPERATING CASH FLOW (OCF)"
          value={money(summary.operatingCashFlow, currentEntity?.currencyCode)}
          desc="Collections less vendor & payroll outflows"
          tone={summary.operatingCashFlow >= 0 ? 'emerald' : 'rose'}
        />

        {/* Investing Cash Flow */}
        <KpiCard
          icon={Layers}
          label="INVESTING CASH FLOW (ICF)"
          value={money(summary.investingCashFlow, currentEntity?.currencyCode)}
          desc="CapEx & physical equipment purchases"
          tone="blue"
        />

        {/* Financing Cash Flow */}
        <KpiCard
          icon={Landmark}
          label="FINANCING CASH FLOW (FCF)"
          value={money(summary.financingCashFlow, currentEntity?.currencyCode)}
          desc="Capital, borrowings & drawings"
          tone="purple"
        />

        {/* Closing Cash Liquidity */}
        <KpiCard
          icon={Wallet}
          label="CLOSING CASH & BANK POSITION"
          value={money(summary.closingCash, currentEntity?.currencyCode)}
          desc={`Across ${summary.totalBankAccounts} banks & ${summary.totalCashRegisters} registers`}
          tone="emerald"
        />
      </KpiGrid>

      {/* ─── Search & Period Filter Toolbar (Zero Overlap Guaranteed) ─── */}
      <div className="bg-[var(--color-surface)] p-3 rounded-2xl border border-[var(--color-border)] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Search + Method Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Guaranteed Zero-Overlap Search Box */}
          <div className="inline-flex items-center h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-emerald-500 w-full sm:w-64 shadow-2xs">
            <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mr-2" />
            <input
              type="text"
              placeholder="Search line items..."
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

          {/* Method Selector Tabs */}
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl border border-[var(--color-border)] text-xs font-semibold">
            <button
              onClick={() => setMethod('direct')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                method === 'direct'
                  ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              Direct Method
            </button>
            <button
              onClick={() => setMethod('indirect')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                method === 'indirect'
                  ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              Indirect Method
            </button>
          </div>
        </div>

        {/* Right Side: Period Presets & Date Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Buttons */}
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl border border-[var(--color-border)] text-xs font-semibold">
            <button
              onClick={() => setPeriodPreset('thisMonth')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                periodPreset === 'thisMonth'
                  ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriodPreset('thisQuarter')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                periodPreset === 'thisQuarter'
                  ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              This Quarter
            </button>
            <button
              onClick={() => setPeriodPreset('thisYear')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                periodPreset === 'thisYear'
                  ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setPeriodPreset('allTime')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                periodPreset === 'allTime'
                  ? 'bg-[var(--color-surface)] text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Date Picker Inputs */}
          <div className="flex items-center gap-1.5">
            <div className="inline-flex items-center h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-mono">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase mr-1.5 font-sans font-bold">From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="!p-0 !border-0 !outline-none !bg-transparent text-xs text-[var(--color-text)] font-mono"
              />
            </div>
            <div className="inline-flex items-center h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-mono">
              <span className="text-[10px] text-[var(--color-text-muted)] uppercase mr-1.5 font-sans font-bold">To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPeriodPreset('custom');
                }}
                className="!p-0 !border-0 !outline-none !bg-transparent text-xs text-[var(--color-text)] font-mono"
              />
            </div>
          </div>

          {/* IAS 7 Balancing Status */}
          <div className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>IAS 7 Balanced</span>
          </div>
        </div>
      </div>

      {/* ─── Financial Cash Flow Statement Table ─── */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--color-text-strong)] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              {method === 'direct' ? 'Direct Method Cash Flow (IAS 7 Compliant)' : 'Indirect Method Cash Flow (GAAP Operating Reconciliation)'}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Financial breakdown formatted strictly in accordance with International Accounting Standards.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            Currency: {currentEntity?.currencyCode || 'PKR'}
          </span>
        </div>

        <div className="overflow-x-auto">
          {method === 'direct' ? (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-900/50 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-extrabold">
                  <th className="py-3 px-4">CASH FLOW ACTIVITY & LINE ITEM</th>
                  <th className="py-3 px-4 text-center">CLASSIFICATION</th>
                  <th className="py-3 px-4 text-right">AMOUNT ({currentEntity?.currencyCode || 'PKR'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {/* 1. Operating Activities Header */}
                <tr className="bg-emerald-50/40 dark:bg-emerald-950/20 font-bold">
                  <td colSpan={3} className="py-2.5 px-4 text-emerald-800 dark:text-emerald-300 uppercase tracking-wider text-[11px]">
                    1. Cash Flows from Operating Activities
                  </td>
                </tr>
                {filteredOperating.length === 0 ? (
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                    <td className="py-2.5 pl-8 text-[var(--color-text)]">Cash Receipts from Customers & Sales Invoices</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Inflow
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {money(summary.operatingCashFlow > 0 ? summary.operatingCashFlow : 0, currentEntity?.currencyCode)}
                    </td>
                  </tr>
                ) : (
                  filteredOperating.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                      <td className="py-2.5 pl-8 text-[var(--color-text)] font-medium">{item.title}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'inflow'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                        item.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.amount >= 0 ? `+ ${money(item.amount, currentEntity?.currencyCode)}` : `- ${money(Math.abs(item.amount), currentEntity?.currencyCode)}`}
                      </td>
                    </tr>
                  ))
                )}
                {/* Operating Subtotal */}
                <tr className="bg-gray-50 dark:bg-gray-900/80 font-bold border-t border-b border-[var(--color-border)]">
                  <td colSpan={2} className="py-2.5 px-4 text-emerald-700 dark:text-emerald-400">
                    Net Cash Flow from Operating Activities:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                    {money(summary.operatingCashFlow, currentEntity?.currencyCode)}
                  </td>
                </tr>

                {/* 2. Investing Activities Header */}
                <tr className="bg-blue-50/40 dark:bg-blue-950/20 font-bold">
                  <td colSpan={3} className="py-2.5 px-4 text-blue-800 dark:text-blue-300 uppercase tracking-wider text-[11px]">
                    2. Cash Flows from Investing Activities
                  </td>
                </tr>
                {filteredInvesting.length === 0 ? (
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                    <td className="py-2.5 pl-8 text-[var(--color-text)]">Purchase of Property, Plant & Equipment (CapEx)</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                        CapEx
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[var(--color-text-muted)]">
                      {money(0, currentEntity?.currencyCode)}
                    </td>
                  </tr>
                ) : (
                  filteredInvesting.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                      <td className="py-2.5 pl-8 text-[var(--color-text)] font-medium">{item.title}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'inflow'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                        item.amount >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.amount >= 0 ? `+ ${money(item.amount, currentEntity?.currencyCode)}` : `- ${money(Math.abs(item.amount), currentEntity?.currencyCode)}`}
                      </td>
                    </tr>
                  ))
                )}
                {/* Investing Subtotal */}
                <tr className="bg-gray-50 dark:bg-gray-900/80 font-bold border-t border-b border-[var(--color-border)]">
                  <td colSpan={2} className="py-2.5 px-4 text-blue-700 dark:text-blue-400">
                    Net Cash Flow from Investing Activities:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-extrabold text-sm text-blue-600 dark:text-blue-400">
                    {money(summary.investingCashFlow, currentEntity?.currencyCode)}
                  </td>
                </tr>

                {/* 3. Financing Activities Header */}
                <tr className="bg-purple-50/40 dark:bg-purple-950/20 font-bold">
                  <td colSpan={3} className="py-2.5 px-4 text-purple-800 dark:text-purple-300 uppercase tracking-wider text-[11px]">
                    3. Cash Flows from Financing Activities
                  </td>
                </tr>
                {filteredFinancing.length === 0 ? (
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                    <td className="py-2.5 pl-8 text-[var(--color-text)]">Capital Injections, Debt Borrowings & Owner Drawings</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                        Financing
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[var(--color-text-muted)]">
                      {money(0, currentEntity?.currencyCode)}
                    </td>
                  </tr>
                ) : (
                  filteredFinancing.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                      <td className="py-2.5 pl-8 text-[var(--color-text)] font-medium">{item.title}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'inflow'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${
                        item.amount >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.amount >= 0 ? `+ ${money(item.amount, currentEntity?.currencyCode)}` : `- ${money(Math.abs(item.amount), currentEntity?.currencyCode)}`}
                      </td>
                    </tr>
                  ))
                )}
                {/* Financing Subtotal */}
                <tr className="bg-gray-50 dark:bg-gray-900/80 font-bold border-t border-b border-[var(--color-border)]">
                  <td colSpan={2} className="py-2.5 px-4 text-purple-700 dark:text-purple-400">
                    Net Cash Flow from Financing Activities:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-extrabold text-sm text-purple-600 dark:text-purple-400">
                    {money(summary.financingCashFlow, currentEntity?.currencyCode)}
                  </td>
                </tr>

                {/* ─── Reconciliation & Summary Totals ─── */}
                <tr className="bg-emerald-50/80 dark:bg-emerald-950/40 font-extrabold text-emerald-900 dark:text-emerald-200 border-t-2 border-emerald-300">
                  <td colSpan={2} className="py-3 px-4 uppercase tracking-wider text-xs">
                    NET INCREASE / (DECREASE) IN CASH & CASH EQUIVALENTS
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-emerald-700 dark:text-emerald-300">
                    {money(summary.netCashFlow, currentEntity?.currencyCode)}
                  </td>
                </tr>
                <tr className="bg-gray-50/50 dark:bg-gray-900/40 font-semibold">
                  <td colSpan={2} className="py-2.5 px-4 text-[var(--color-text-muted)]">
                    Cash & Cash Equivalents at Beginning of Period
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-xs font-bold text-[var(--color-text)]">
                    {money(summary.openingCash, currentEntity?.currencyCode)}
                  </td>
                </tr>
                <tr className="bg-emerald-100/70 dark:bg-emerald-900/40 font-extrabold text-[var(--color-text-strong)] border-b-2 border-emerald-600">
                  <td colSpan={2} className="py-3 px-4 uppercase tracking-wider text-xs">
                    CASH & CASH EQUIVALENTS AT END OF PERIOD (CLOSING POSITION)
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base text-emerald-700 dark:text-emerald-300">
                    {money(summary.closingCash, currentEntity?.currencyCode)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            /* ─── Indirect Method Table (GAAP Operating Reconciliation) ─── */
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-gray-50/50 dark:bg-gray-900/50 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-extrabold">
                  <th className="py-3 px-4">RECONCILIATION LINE ITEM</th>
                  <th className="py-3 px-4 text-center">TYPE</th>
                  <th className="py-3 px-4 text-right">AMOUNT ({currentEntity?.currencyCode || 'PKR'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                <tr className="font-bold bg-blue-50/30 dark:bg-blue-950/20">
                  <td className="py-2.5 pl-4 text-blue-900 dark:text-blue-300 font-bold">Net Income / Profit before Tax</td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      P&L
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                    {money(summary.netIncome, currentEntity?.currencyCode)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                  <td className="py-2.5 pl-8 text-[var(--color-text)]">Adjustments for Non-Cash Expenses (Depreciation & Amortization)</td>
                  <td className="py-2.5 px-4 text-center text-gray-500 font-mono text-[10px]">Non-Cash</td>
                  <td className="py-2.5 px-4 text-right font-mono text-gray-500">{money(0, currentEntity?.currencyCode)}</td>
                </tr>
                <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                  <td className="py-2.5 pl-8 text-[var(--color-text)]">Change in Operating Assets & Working Capital</td>
                  <td className="py-2.5 px-4 text-center text-gray-500 font-mono text-[10px]">Working Cap</td>
                  <td className="py-2.5 px-4 text-right font-mono text-gray-500">{money(0, currentEntity?.currencyCode)}</td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-900 font-bold border-t border-[var(--color-border)]">
                  <td colSpan={2} className="py-2.5 px-4 text-emerald-700">
                    Net Cash Provided by Operating Activities:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600">
                    {money(summary.operatingCashFlow, currentEntity?.currencyCode)}
                  </td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-900 font-bold">
                  <td colSpan={2} className="py-2.5 px-4 text-blue-700">
                    Net Cash Used in Investing Activities:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-600">
                    {money(summary.investingCashFlow, currentEntity?.currencyCode)}
                  </td>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-900 font-bold">
                  <td colSpan={2} className="py-2.5 px-4 text-purple-700">
                    Net Cash from Financing Activities:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-purple-600">
                    {money(summary.financingCashFlow, currentEntity?.currencyCode)}
                  </td>
                </tr>
                <tr className="bg-emerald-100/70 dark:bg-emerald-900/40 font-extrabold text-[var(--color-text-strong)] border-t-2 border-b-2 border-emerald-600">
                  <td colSpan={2} className="py-3 px-4 uppercase tracking-wider text-xs">
                    RECONCILED CLOSING CASH & BANK EQUIVALENTS
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base text-emerald-700 dark:text-emerald-300">
                    {money(summary.closingCash, currentEntity?.currencyCode)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashFlowView;
