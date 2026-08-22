import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3, Search, Download, Printer,
  FileSpreadsheet, RefreshCw, ShoppingCart,
  CreditCard, Clock, Users,
  Layers, FileText, CheckCircle2
} from 'lucide-react';
import type { Entity } from './EntitySettings';
import { reportsApi } from './api/modules/reports.api';
import { money } from './lib/currency';
import { downloadExcel } from './lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const firstDay = new Date(now.getFullYear(), currentQuarter * 3, 1);
    return { from: firstDay.toISOString().slice(0, 10), to: todayStr };
  }
  if (preset === 'ytd') {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    return { from: firstDay.toISOString().slice(0, 10), to: todayStr };
  }
  return { from: '', to: todayStr };
}

export const PurchaseReportsView: React.FC<{ activeEntityId: string; entities: Entity[] }> = ({
  activeEntityId,
  entities,
}) => {
  const currentEntity = entities.find((e) => e.id === activeEntityId) || entities[0];
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'spend' | 'bills' | 'insights'>('spend');

  // Date filters
  const [activePreset, setActivePreset] = useState<DatePreset>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportsApi.getPurchaseReports({
        companyId: activeEntityId || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      });
      setReport(data);
    } catch (e) {
      console.error('Failed to load purchase reports', e);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeEntityId, dateFrom, dateTo]);

  const handlePresetSelect = (preset: DatePreset) => {
    setActivePreset(preset);
    const { from, to } = getPresetDates(preset);
    setDateFrom(from);
    setDateTo(to);
  };

  const fmt = (v?: number) => money(v || 0);

  const vendorSpend = report?.vendorSpend || [];
  const recentBills = report?.recentBills || [];

  // Filtered vendors
  const filteredVendors = useMemo(() => {
    return vendorSpend.filter((v: any) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (v.vendorName || '').toLowerCase().includes(q);
    });
  }, [vendorSpend, query]);

  // Filtered recent bills
  const filteredBills = useMemo(() => {
    return recentBills.filter((b: any) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        (b.billNumber || '').toLowerCase().includes(q) ||
        (b.vendorName || '').toLowerCase().includes(q) ||
        (b.status || '').toLowerCase().includes(q)
      );
    });
  }, [recentBills, query]);

  const totalBilledSpend = report?.totalBilled || 0;

  // ─── PDF Report Generator ──────────────────────────────────────────────────
  const generatePurchaseReportPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const primaryColor: [number, number, number] = [30, 58, 138]; // Blue 900
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
    doc.text('EXECUTIVE PURCHASE & SPEND REPORT', margin, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Period: ${dateFrom ? new Date(dateFrom).toLocaleDateString() : 'All Time'} to ${new Date(dateTo).toLocaleDateString()}`,
      margin,
      21
    );
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 14, { align: 'right' });
    doc.text(`Entity: ${currentEntity?.name || 'Company ERP'}`, pageWidth - margin, 21, { align: 'right' });

    // KPI Summary Section
    const kpiY = 34;
    const kpiH = 16;
    const kpiW = (contentWidth - 9) / 4;

    const kpis = [
      { label: 'PO VALUE COMMITTED', value: fmt(report?.purchaseOrderValue), count: `${report?.totalPurchaseOrders || 0} Orders` },
      { label: 'TOTAL BILLED SPEND', value: fmt(report?.totalBilled), count: `${report?.totalBills || 0} Bills` },
      { label: 'PAYMENTS DISBURSED', value: fmt(report?.vendorPayments || report?.amountPaid), count: 'Settled' },
      { label: 'NET AP OUTSTANDING', value: fmt(report?.amountDue), count: `${report?.openBills || 0} Open Bills` },
    ];

    kpis.forEach((k, idx) => {
      const x = margin + idx * (kpiW + 3);
      doc.setFillColor(...lightBg);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(x, kpiY, kpiW, kpiH, 1.5, 1.5, 'FD');

      doc.setTextColor(...grayColor);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(k.label, x + 3, kpiY + 5);

      doc.setTextColor(...primaryColor);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(k.value, x + 3, kpiY + 10.5);

      doc.setTextColor(...grayColor);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(k.count, x + 3, kpiY + 14.5);
    });

    // Vendor Spend Table
    const tableStartY = kpiY + kpiH + 6;

    const tableHeaders = ['Supplier / Vendor', 'Bills Count', 'Total Billed', 'Amount Paid', 'Balance Due', 'Spend Share %'];
    const tableRows = filteredVendors.map((v: any) => {
      const share = totalBilledSpend > 0 ? ((v.totalBilled / totalBilledSpend) * 100).toFixed(1) + '%' : '0%';
      return [v.vendorName, v.billCount, fmt(v.totalBilled), fmt(v.amountPaid), fmt(v.amountDue), share];
    });

    tableRows.push([
      'TOTALS',
      String(filteredVendors.reduce((s: number, v: any) => s + (v.billCount || 0), 0)),
      fmt(report?.totalBilled),
      fmt(report?.amountPaid),
      fmt(report?.amountDue),
      '100%',
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [tableHeaders],
      body: tableRows,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2.2, textColor: darkColor, lineColor: borderGray, lineWidth: 0.1 },
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.row.index === tableRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [241, 245, 249];
        }
      },
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setTextColor(...grayColor);
    doc.setFontSize(7);
    doc.text('Purchasing & Procurement Analytics. Confidential Financial Record.', margin, pageHeight - 9);

    doc.save(`Purchase_Report_${dateTo}.pdf`);
  };

  // ─── Excel Export ──────────────────────────────────────────────────────────
  const exportVendorSpendExcel = () => {
    const headers = ['Supplier Name', 'Bills Count', 'Total Billed', 'Amount Paid', 'Balance Due', 'Spend Share %'];
    const rows = filteredVendors.map((v: any) => [
      v.vendorName,
      v.billCount,
      v.totalBilled,
      v.amountPaid,
      v.amountDue,
      totalBilledSpend > 0 ? ((v.totalBilled / totalBilledSpend) * 100).toFixed(2) + '%' : '0%',
    ]);
    downloadExcel(`Purchase_Vendor_Spend_${dateTo}`, 'Vendor Spend', headers, rows);
  };

  const exportBillsExcel = () => {
    const headers = ['Bill Number', 'Supplier', 'Date', 'Due Date', 'Total Amount', 'Amount Paid', 'Amount Due', 'Status', 'Currency'];
    const rows = filteredBills.map((b: any) => [
      b.billNumber,
      b.vendorName,
      b.date,
      b.dueDate,
      b.totalAmount,
      b.amountPaid,
      b.amountDue,
      b.status,
      b.currencyCode || 'PKR',
    ]);
    downloadExcel(`Purchase_Bills_Ledger_${dateTo}`, 'Bills Ledger', headers, rows);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-xs">
        <div>
          <h1 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Purchase & Spend Analytics
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Procurement spend analysis, vendor billing summaries, and Accounts Payable commitments for {currentEntity?.name || 'Active Entity'}.
          </p>
        </div>

        {/* Date Presets, Range Pickers & Export Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Presets */}
          <div className="flex items-center gap-1">
            {(['thisMonth', 'lastMonth', 'thisQuarter', 'ytd', 'all'] as DatePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePresetSelect(p)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                  activePreset === p
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {p === 'thisMonth' ? 'This Mo' : p === 'lastMonth' ? 'Last Mo' : p === 'thisQuarter' ? 'Qtr' : p === 'ytd' ? 'YTD' : 'All'}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-1 h-8.5 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)]">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setActivePreset('all'); }}
              className="bg-transparent text-xs text-[var(--color-text)] outline-none border-none cursor-pointer w-28"
            />
            <span className="text-gray-400 text-[10px]">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setActivePreset('all'); }}
              className="bg-transparent text-xs text-[var(--color-text)] outline-none border-none cursor-pointer w-28"
            />
          </div>

          {/* Action Buttons */}
          <button
            onClick={generatePurchaseReportPDF}
            className="primary h-8.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            title="Download PDF Report"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </button>
          <button
            onClick={activeTab === 'spend' ? exportVendorSpendExcel : exportBillsExcel}
            className="secondary h-8.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
          </button>
          <button
            onClick={() => window.print()}
            className="secondary h-8.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={loadReport}
            className="secondary h-8.5 w-8.5 rounded-lg flex items-center justify-center text-xs text-[var(--color-text)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Financial Metric Cards (4 in one row) */}
      <section className="stats" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
        <article>
          <span className="stat-icon blue"><ShoppingCart className="w-4 h-4" /></span>
          <div>
            <small>PO COMMITTED VALUE</small>
            <h2>{fmt(report?.purchaseOrderValue)}</h2>
            <p>{report?.totalPurchaseOrders || 0} Purchase Orders</p>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><FileText className="w-4 h-4 text-blue-600" /></span>
          <div>
            <small>TOTAL INVOICED SPEND</small>
            <h2>{fmt(report?.totalBilled)}</h2>
            <p>{report?.totalBills || 0} Vendor Bills</p>
          </div>
        </article>
        <article>
          <span className="stat-icon teal"><CreditCard className="w-4 h-4 text-emerald-600" /></span>
          <div>
            <small>PAYMENTS DISBURSED</small>
            <h2 className="text-emerald-600 dark:text-emerald-400">{fmt(report?.vendorPayments || report?.amountPaid)}</h2>
            <p>Settled liabilities</p>
          </div>
        </article>
        <article>
          <span className="stat-icon violet"><Clock className="w-4 h-4 text-amber-600" /></span>
          <div>
            <small>NET AP OUTSTANDING</small>
            <h2 className={report?.amountDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}>
              {fmt(report?.amountDue)}
            </h2>
            <p>{report?.openBills || 0} Open / Unpaid Bills</p>
          </div>
        </article>
      </section>

      {/* Search & Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('spend')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'spend'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Supplier Spend ({vendorSpend.length})
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'bills'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Recent Bills Ledger ({recentBills.length})
          </button>
        </div>

        {/* Robust Inline Search Bar (Icon and input in normal DOM flow) */}
        <div className="flex items-center h-8.5 w-64 px-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 transition-all shadow-2xs">
          <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeTab === 'spend' ? 'Search suppliers...' : 'Search bills, vendor...'}
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

      {/* TAB 1: SUPPLIER SPEND ANALYSIS */}
      {activeTab === 'spend' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xs overflow-hidden">
          <div className="p-3 border-b border-[var(--color-border)] flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
            <span className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Supplier Spend Distribution ({filteredVendors.length})
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Ranked by total billed purchase volume
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/80 text-[var(--color-text-muted)] border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Supplier</th>
                  <th className="py-2.5 px-3 text-center">Bills Count</th>
                  <th className="py-2.5 px-3 text-right">Total Billed</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-right">Average Bill</th>
                  <th className="py-2.5 px-3.5 text-center">Spend Share %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)]">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                        <p className="font-semibold text-xs">Analyzing purchase reports & spend metrics...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)]">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-gray-400" />
                        <p className="font-semibold text-xs">No vendor purchase records found for this period.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((v: any, idx: number) => {
                    const share = totalBilledSpend > 0 ? (v.totalBilled / totalBilledSpend) * 100 : 0;
                    const avg = v.billCount > 0 ? v.totalBilled / v.billCount : 0;

                    return (
                      <tr key={v.vendorId || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {(v.vendorName || 'V').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-[var(--color-text-strong)]">{v.vendorName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-300 text-[10px]">
                            {v.billCount} bills
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[var(--color-text-strong)]">
                          {fmt(v.totalBilled)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {fmt(v.amountPaid)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span className={v.amountDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}>
                            {fmt(v.amountDue)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-[var(--color-text-muted)]">
                          {fmt(avg)}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, share)}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)] font-mono">
                              {share.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredVendors.length > 0 && (
                <tfoot className="bg-gray-50 dark:bg-gray-900 border-t-2 border-[var(--color-border)] font-bold text-xs">
                  <tr>
                    <td className="py-3 px-3.5 uppercase tracking-wider text-[var(--color-text-muted)]">
                      Total Purchases Spend:
                    </td>
                    <td className="py-3 px-3 text-center">
                      {filteredVendors.reduce((s: number, v: any) => s + (v.billCount || 0), 0)} bills
                    </td>
                    <td className="py-3 px-3 text-right text-base text-[var(--color-text-strong)] font-extrabold">
                      {fmt(report?.totalBilled)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                      {fmt(report?.amountPaid)}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-600 dark:text-amber-400 font-bold">
                      {fmt(report?.amountDue)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECENT BILLS ACTIVITY */}
      {activeTab === 'bills' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xs overflow-hidden">
          <div className="p-3 border-b border-[var(--color-border)] flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
            <span className="text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> Recent Vendor Bills Activity ({filteredBills.length})
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Chronological log of recent supplier invoices
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/80 text-[var(--color-text-muted)] border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Bill Number</th>
                  <th className="py-2.5 px-3">Supplier</th>
                  <th className="py-2.5 px-3">Bill Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[var(--color-text-muted)]">
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-gray-400" />
                        <p className="font-semibold text-xs">No recent bills found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((b: any) => (
                    <tr key={b.id || b.billNumber} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-[var(--color-text-strong)]">{b.billNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-[var(--color-text-strong)]">{b.vendorName}</td>
                      <td className="py-2.5 px-3 text-[var(--color-text)] whitespace-nowrap">{b.date}</td>
                      <td className="py-2.5 px-3 text-[var(--color-text-muted)] whitespace-nowrap">{b.dueDate}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[var(--color-text-strong)]">{fmt(b.totalAmount)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{fmt(b.amountPaid)}</td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        <span className={b.amountDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}>
                          {fmt(b.amountDue)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseReportsView;
