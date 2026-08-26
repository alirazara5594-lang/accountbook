import { useEffect, useMemo, useState } from 'react';
import { useSalesStore, useCustomersStore, useCompanyStore } from './stores';
import { useReportsStore } from './stores/useReportsStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  BarChart3, Search, Download, Printer,
  FileSpreadsheet, RefreshCw, ShoppingCart,
  DollarSign, Clock, Users,
  FileText, CheckCircle2, TrendingUp
} from 'lucide-react';
import { money, moneyCompact } from './lib/currency';
import { downloadExcel, downloadCSV } from './lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Props = { activeEntityId: string };
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

export function SalesReportsWorkspace({ activeEntityId }: Props) {
  const invoices = useSalesStore((s) => s.invoices as any[]);
  const fetchInvoices = useSalesStore((s) => s.fetchInvoices);
  const customers = useCustomersStore((s) => s.customers as any[]);
  const fetchCustomers = useCustomersStore((s) => s.fetchCustomers);
  const { entities, fetchCompanies } = useCompanyStore();
  const { balanceSheet, fetchBalanceSheet } = useReportsStore();

  const [preset, setPreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'customers' | 'ledger' | 'trends'>('customers');
  const [loading, setLoading] = useState(false);

  const activeCompany = useMemo(() => {
    return entities.find((e) => e.id === activeEntityId) || entities[0];
  }, [entities, activeEntityId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchInvoices(activeEntityId),
        fetchCustomers(activeEntityId),
        fetchCompanies(),
        fetchBalanceSheet({ entityId: activeEntityId }),
      ]);
    } catch {
      /* gracefully degrade */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeEntityId]);

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const { from, to } = getPresetDates(newPreset);
    setFromDate(from);
    setToDate(to);
  };

  // Filter invoices by date range
  const dateFilteredInvoices = useMemo(() => {
    return invoices.filter((i: any) => {
      const invDate = i.invoiceDate || i.date || '';
      if (fromDate && invDate < fromDate) return false;
      if (toDate && invDate > toDate) return false;
      return true;
    });
  }, [invoices, fromDate, toDate]);

  // Aggregate Customer Sales Breakdown
  const customerSalesSummary = useMemo(() => {
    const map: Record<string, {
      customerId: string;
      customerName: string;
      customerNumber: string;
      invoicesCount: number;
      totalSales: number;
      totalPaid: number;
      totalDue: number;
    }> = {};

    dateFilteredInvoices.forEach((inv: any) => {
      const cId = inv.customerId || 'unassigned';
      if (!map[cId]) {
        const found = customers.find((c: any) => c.id === cId);
        map[cId] = {
          customerId: cId,
          customerName: inv.customerName || found?.name || 'Unknown Customer',
          customerNumber: found?.customerNumber || '',
          invoicesCount: 0,
          totalSales: 0,
          totalPaid: 0,
          totalDue: 0,
        };
      }

      const total = inv.totalAmount || 0;
      const due = inv.amountDue ?? (inv.status === 2 ? 0 : total);
      const paid = inv.paidAmount ?? (total - due);

      map[cId].invoicesCount += 1;
      map[cId].totalSales += total;
      map[cId].totalPaid += paid;
      map[cId].totalDue += due;
    });

    return Object.values(map).sort((a, b) => b.totalSales - a.totalSales);
  }, [dateFilteredInvoices, customers]);

  // Total KPIs
  const totalRevenue = dateFilteredInvoices.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
  const totalPaid = customerSalesSummary.reduce((s, c) => s + c.totalPaid, 0);
  const totalOutstanding = customerSalesSummary.reduce((s, c) => s + c.totalDue, 0);
  const totalInvoicesCount = dateFilteredInvoices.length;
  const avgInvoiceValue = totalInvoicesCount > 0 ? totalRevenue / totalInvoicesCount : 0;
  const grossProfit = balanceSheet?.grossProfit || (totalRevenue * 0.35); // fallback approximation
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Filtered Customer Sales
  const filteredCustomerSales = useMemo(() => {
    if (!searchQuery.trim()) return customerSalesSummary;
    const q = searchQuery.toLowerCase();
    return customerSalesSummary.filter(
      (c) => c.customerName.toLowerCase().includes(q) || c.customerNumber.toLowerCase().includes(q)
    );
  }, [customerSalesSummary, searchQuery]);

  // Monthly revenue trend for chart
  const monthlyTrends = useMemo(() => {
    const months: Record<string, { month: string; sales: number; paid: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    invoices.forEach((inv: any) => {
      const d = inv.invoiceDate || inv.date || '';
      if (d) {
        const key = d.slice(0, 7);
        if (!months[key]) months[key] = { month: monthNames[parseInt(key.slice(5, 7)) - 1] || key, sales: 0, paid: 0 };
        months[key].sales += inv.totalAmount || 0;
        const total = inv.totalAmount || 0;
        const due = inv.amountDue ?? (inv.status === 2 ? 0 : total);
        months[key].paid += (total - due);
      }
    });

    return Object.values(months).slice(-6);
  }, [invoices]);

  // Invoice status breakdown
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = { Paid: 0, Overdue: 0, 'Partially Paid': 0, Sent: 0, Draft: 0 };
    dateFilteredInvoices.forEach((inv: any) => {
      if (inv.status === 2 || String(inv.status).toLowerCase() === 'paid') {
        map.Paid += 1;
      } else if (inv.amountDue > 0 && inv.dueDate && new Date(inv.dueDate) < new Date()) {
        map.Overdue += 1;
      } else if (inv.paidAmount > 0 && inv.amountDue > 0) {
        map['Partially Paid'] += 1;
      } else if (inv.status === 1 || String(inv.status).toLowerCase() === 'sent') {
        map.Sent += 1;
      } else {
        map.Draft += 1;
      }
    });

    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [dateFilteredInvoices]);

  const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#94a3b8'];

  // ─── Branded PDF Report Generator ──────────────────────────────────────────
  const generateSalesPDF = () => {
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
    doc.text('EXECUTIVE SALES & REVENUE REPORT', margin, 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const periodLabel = fromDate && toDate ? `${fromDate} to ${toDate}` : 'All Recorded Periods';
    doc.text(`Reporting Period: ${periodLabel}`, margin, 21);
    doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, pageWidth - margin, 14, { align: 'right' });
    doc.text(`Entity: ${activeCompany?.name || 'Company ERP'}`, pageWidth - margin, 21, { align: 'right' });

    // 4 KPI Summary Cards
    const cardY = 34;
    const cardH = 18;
    const cardW = (contentWidth - 9) / 4;

    const kpiCards = [
      { label: 'TOTAL INVOICED', value: money(totalRevenue), color: primaryColor },
      { label: 'TOTAL COLLECTED', value: money(totalPaid), color: [16, 185, 129] as [number, number, number] },
      { label: 'NET RECEIVABLES', value: money(totalOutstanding), color: [239, 68, 68] as [number, number, number] },
      { label: 'AVERAGE INVOICE', value: money(avgInvoiceValue), color: [139, 92, 246] as [number, number, number] },
    ];

    kpiCards.forEach((card, idx) => {
      const x = margin + idx * (cardW + 3);
      doc.setFillColor(...lightBg);
      doc.setDrawColor(...borderGray);
      doc.roundedRect(x, cardY, cardW, cardH, 2, 2, 'FD');

      doc.setTextColor(...grayColor);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text(card.label, x + 3.5, cardY + 5.5);

      doc.setTextColor(...card.color);
      doc.setFontSize(10.5);
      doc.text(card.value, x + 3.5, cardY + 13.5);
    });

    // Customer Sales Breakdown Table
    const tableHeaders = ['Customer Name', 'Invoices', 'Total Invoiced', 'Collected Amount', 'Balance Due', 'Revenue Share %'];
    const tableRows = customerSalesSummary.map((c) => {
      const share = totalRevenue > 0 ? ((c.totalSales / totalRevenue) * 100).toFixed(1) : '0.0';
      return [
        c.customerName,
        String(c.invoicesCount),
        money(c.totalSales),
        money(c.totalPaid),
        money(c.totalDue),
        `${share}%`,
      ];
    });

    autoTable(doc, {
      startY: cardY + cardH + 7,
      head: [tableHeaders],
      body: tableRows.length ? tableRows : [['No sales transactions in selected period', '', '', '', '', '']],
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: darkColor },
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'right' },
      },
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setTextColor(...grayColor);
    doc.setFontSize(7);
    doc.text('Confidential • Generated by AccountBook ERP Sales & Revenue Analytics Suite', margin, pageHeight - 8);

    doc.save(`Sales_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ─── Excel Export ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    const headers = ['Customer Name', 'Customer Number', 'Invoices Count', 'Total Invoiced', 'Amount Paid', 'Balance Due', 'Share of Revenue %'];
    const rows = customerSalesSummary.map((c) => [
      c.customerName,
      c.customerNumber,
      c.invoicesCount,
      c.totalSales,
      c.totalPaid,
      c.totalDue,
      totalRevenue > 0 ? ((c.totalSales / totalRevenue) * 100).toFixed(2) : 0,
    ]);
    downloadExcel(`Sales_Report_${new Date().toISOString().slice(0, 10)}`, 'Sales Summary', headers, rows);
  };

  const exportCSV = () => {
    const headers = ['Customer Name', 'Customer Number', 'Invoices Count', 'Total Invoiced', 'Amount Paid', 'Balance Due', 'Share of Revenue %'];
    const rows = customerSalesSummary.map((c) => [
      c.customerName,
      c.customerNumber,
      c.invoicesCount,
      c.totalSales,
      c.totalPaid,
      c.totalDue,
      totalRevenue > 0 ? ((c.totalSales / totalRevenue) * 100).toFixed(2) : 0,
    ]);
    downloadCSV(`Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[var(--color-surface)] p-3.5 rounded-xl border border-[var(--color-border)] shadow-xs">
        <div>
          <h1 className="text-base font-bold text-[var(--color-text-strong)] tracking-tight flex items-center gap-2">
            <span className="text-lg">📊</span> Sales & Revenue Reports
          </h1>
          <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
            Real-time analytics on revenue velocity, customer collections, Accounts Receivable aging, and sales margins.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={exportExcel}
            className="secondary h-8.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            title="Export sales analytics to Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
          </button>
          <button
            onClick={exportCSV}
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
            title="Refresh data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={generateSalesPDF}
            className="primary h-8.5 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" /> Export PDF Report
          </button>
        </div>
      </div>

      {/* Date Range & Preset Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface)] p-3 rounded-xl border border-[var(--color-border)] shadow-xs">
        {/* Date Presets */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-bold text-[var(--color-text-muted)] mr-1.5 flex items-center gap-1">
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

        {/* Custom Date Pickers & Robust Non-Overlapping Search Box */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[var(--color-text-muted)] font-semibold text-[11px]">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPreset('all'); }}
              className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[var(--color-text-muted)] font-semibold text-[11px]">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPreset('all'); }}
              className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text)] outline-none focus:border-blue-500"
            />
          </div>

          {/* Search Box - Guaranteed No Text/Icon Overlap */}
          <div className="flex items-center h-8 w-56 px-2.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-200 transition-all shadow-2xs">
            <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name..."
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 text-sm px-1 leading-none font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top 5 KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'TOTAL INVOICED', value: money(totalRevenue), desc: `${totalInvoicesCount} invoices billed`, icon: DollarSign, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'COLLECTED CASH', value: money(totalPaid), desc: `${totalRevenue > 0 ? ((totalPaid / totalRevenue) * 100).toFixed(1) : 0}% collection rate`, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'NET AR OUTSTANDING', value: money(totalOutstanding), desc: 'Receivables pending', icon: Clock, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400' },
          { label: 'GROSS PROFIT', value: money(grossProfit), desc: `${grossMargin.toFixed(1)}% estimated margin`, icon: TrendingUp, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', textColor: 'text-violet-600 dark:text-violet-400' },
          { label: 'AVERAGE INVOICE', value: money(avgInvoiceValue), desc: `Across ${customerSalesSummary.length} customers`, icon: ShoppingCart, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400' },
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

      {/* Multi-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-1">
        <button
          onClick={() => setActiveTab('customers')}
          className={`h-8.5 px-3.5 rounded-t-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'customers'
              ? 'bg-[var(--color-surface)] border-t border-l border-r border-[var(--color-border)] text-blue-600 -mb-[5px] pb-2'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Customer Revenue Breakdown ({filteredCustomerSales.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`h-8.5 px-3.5 rounded-t-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'ledger'
              ? 'bg-[var(--color-surface)] border-t border-l border-r border-[var(--color-border)] text-blue-600 -mb-[5px] pb-2'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Sales Invoices Activity Ledger ({dateFilteredInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`h-8.5 px-3.5 rounded-t-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
            activeTab === 'trends'
              ? 'bg-[var(--color-surface)] border-t border-l border-r border-[var(--color-border)] text-blue-600 -mb-[5px] pb-2'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Revenue & Status Trends
        </button>
      </div>

      {/* Tab 1: Customer Sales Breakdown Table */}
      {activeTab === 'customers' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/80 text-[var(--color-text-muted)] border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Customer Name</th>
                  <th className="py-2.5 px-3 text-center">Invoices</th>
                  <th className="py-2.5 px-3 text-right">Total Invoiced</th>
                  <th className="py-2.5 px-3 text-right">Collected Amount</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-right">Avg / Invoice</th>
                  <th className="py-2.5 px-3.5 text-right w-44">Share of Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredCustomerSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)]">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 text-gray-400" />
                        <p className="font-semibold text-xs">No sales activity in this period.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCustomerSales.map((c) => {
                    const sharePct = totalRevenue > 0 ? (c.totalSales / totalRevenue) * 100 : 0;
                    const avgVal = c.invoicesCount > 0 ? c.totalSales / c.invoicesCount : 0;

                    return (
                      <tr key={c.customerId} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="py-2.5 px-3.5 font-semibold text-[var(--color-text-strong)]">
                          {c.customerName}
                          {c.customerNumber && (
                            <span className="ml-1.5 text-[10px] font-mono text-[var(--color-text-muted)]">
                              ({c.customerNumber})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{c.invoicesCount}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400 font-mono">
                          {money(c.totalSales)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          {money(c.totalPaid)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-600 dark:text-rose-400 font-mono">
                          {money(c.totalDue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-[var(--color-text-muted)]">
                          {money(avgVal)}
                        </td>
                        <td className="py-2.5 px-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono text-[11px] font-bold text-[var(--color-text-strong)]">
                              {sharePct.toFixed(1)}%
                            </span>
                            <div className="w-16 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(2, sharePct))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredCustomerSales.length > 0 && (
                <tfoot className="bg-gray-50 dark:bg-gray-900 border-t-2 border-[var(--color-border)] font-bold text-xs">
                  <tr>
                    <td className="py-3 px-3.5 uppercase tracking-wider text-[var(--color-text-muted)]">
                      Total Sales Summary:
                    </td>
                    <td className="py-3 px-3 text-center font-mono">{totalInvoicesCount}</td>
                    <td className="py-3 px-3 text-right text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                      {money(totalRevenue)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                      {money(totalPaid)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                      {money(totalOutstanding)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">{money(avgInvoiceValue)}</td>
                    <td className="py-3 px-3.5 text-right font-extrabold text-sm">100.0%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Recent Sales Invoices Activity */}
      {activeTab === 'ledger' && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/80 text-[var(--color-text-muted)] border-b border-[var(--color-border)] text-[10px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-2.5 px-3.5">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                  <th className="py-2.5 px-3 text-right">Amount Due</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {dateFilteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--color-text-muted)]">
                      <p className="font-semibold text-xs">No invoices found for this date range.</p>
                    </td>
                  </tr>
                ) : (
                  dateFilteredInvoices.map((inv: any) => {
                    const due = inv.amountDue ?? (inv.status === 2 ? 0 : inv.totalAmount);
                    const isOverdue = due > 0 && inv.dueDate && new Date(inv.dueDate) < new Date();

                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="py-2.5 px-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-text)] whitespace-nowrap">
                          {inv.invoiceDate || inv.date}
                        </td>
                        <td className="py-2.5 px-3 text-[var(--color-text-muted)] whitespace-nowrap">
                          {inv.dueDate || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[var(--color-text-strong)]">
                          {inv.customerName || inv.customerId}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-600 font-mono">
                          {money(inv.totalAmount || 0)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-rose-600 font-mono">
                          {money(due)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            due === 0
                              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 border border-emerald-200'
                              : isOverdue
                                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 border border-blue-200'
                          }`}>
                            {due === 0 ? 'Paid' : isOverdue ? 'Overdue' : 'Open'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Revenue & Status Trends */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
            <h3 className="text-xs font-bold text-[var(--color-text-strong)] mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Monthly Revenue vs Collections Trend
            </h3>
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => moneyCompact(v)} />
                  <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Invoiced Sales" />
                  <Bar dataKey="paid" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected Cash" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-gray-400 text-xs">No monthly trends data</div>
            )}
          </div>

          <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-xs">
            <h3 className="text-xs font-bold text-[var(--color-text-strong)] mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" /> Invoice Status Distribution
            </h3>
            {statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusBreakdown.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-gray-400 text-xs">No invoice status data</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesReportsWorkspace;
